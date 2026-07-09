const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const sharp = require('sharp');

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const FFMPEG_PATH =
  process.env.FFMPEG_PATH ||
  process.argv[2] ||
  (fs.existsSync('C:\\ffmpeg\\bin\\ffmpeg.exe') ? 'C:\\ffmpeg\\bin\\ffmpeg.exe' : 'ffmpeg');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const prisma = new PrismaClient();
const TARGET_BYTES = 80 * 1024;
const TEMP_DIR = path.resolve(__dirname, 'tmp-product-images');
let timeDriftMs = 0;

function ensureTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function ffmpegAvailable() {
  return fileExists(FFMPEG_PATH);
}

function getExtensionFromUrl(url) {
  try {
    const parsed = new URL(url);
    const ext = path.extname(parsed.pathname).toLowerCase();
    return ext || '.jpg';
  } catch (error) {
    return '.jpg';
  }
}

async function downloadImage(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
}

function runFfmpeg(args) {
  const result = spawnSync(FFMPEG_PATH, args, { encoding: 'utf8' });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed: ${result.stderr || result.stdout}`);
  }
}

function getFfmpegOutputPath(inputPath, suffix = 'compressed') {
  const ext = path.extname(inputPath) || '.jpg';
  return inputPath.replace(ext, `.${suffix}${ext}`);
}

function getFfmpegArgs(inputPath, outputPath, width, quality) {
  return [
    '-y',
    '-i',
    inputPath,
    '-vf',
    `scale='min(${width},iw):-2'`,
    '-qscale:v',
    `${quality}`,
    outputPath,
  ];
}

async function compressWithFfmpeg(inputPath, outputPath) {
  const scaleWidths = [1600, 1200, 1000, 800, 600];
  const qualities = [30, 35, 40, 45, 50, 55, 60];

  for (const width of scaleWidths) {
    for (const quality of qualities) {
      const attemptPath = getFfmpegOutputPath(outputPath, `q${quality}w${width}`);
      try {
        runFfmpeg(getFfmpegArgs(inputPath, attemptPath, width, quality));
      } catch (error) {
        continue;
      }
      const size = fs.statSync(attemptPath).size;
      if (size <= TARGET_BYTES) {
        return attemptPath;
      }
    }
  }

  // Last chance: preserve the best output that is smallest.
  const candidates = fs
    .readdirSync(path.dirname(outputPath))
    .filter((file) => file.includes(path.basename(outputPath, path.extname(outputPath))))
    .map((file) => ({
      file,
      size: fs.statSync(path.join(path.dirname(outputPath), file)).size,
    }))
    .sort((a, b) => a.size - b.size);

  if (candidates.length > 0) {
    return path.join(path.dirname(outputPath), candidates[0].file);
  }

  throw new Error('ffmpeg could not produce a compressed output');
}

async function compressWithSharp(inputPath, outputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  const format = ext === '.png' ? 'webp' : 'jpeg';
  const baseOutputPath = outputPath.replace(path.extname(outputPath), `.${format}`);

  const qualitySteps = [80, 70, 60, 50, 40, 30, 20];
  const widths = [1600, 1200, 1000, 800, 600];

  for (const width of widths) {
    for (const quality of qualitySteps) {
      const attemptPath = baseOutputPath.replace(`.${format}`, `.q${quality}w${width}.${format}`);
      const pipeline = sharp(inputPath).resize({ width, withoutEnlargement: true });

      if (format === 'webp') {
        await pipeline.webp({ quality }).toFile(attemptPath);
      } else {
        await pipeline.jpeg({ quality, mozjpeg: true }).toFile(attemptPath);
      }

      const size = fs.statSync(attemptPath).size;
      if (size <= TARGET_BYTES) {
        return attemptPath;
      }
    }
  }

  const candidates = fs
    .readdirSync(path.dirname(outputPath))
    .filter((file) => file.startsWith(path.basename(baseOutputPath, `.${format}`)))
    .map((file) => ({
      file,
      size: fs.statSync(path.join(path.dirname(outputPath), file)).size,
    }))
    .sort((a, b) => a.size - b.size);

  if (candidates.length > 0) {
    return path.join(path.dirname(outputPath), candidates[0].file);
  }

  throw new Error('Sharp could not produce a compressed output');
}

async function uploadToCloudinary(filePath) {
  const adjustedTimestamp = Math.floor((Date.now() + timeDriftMs) / 1000);
  const res = await cloudinary.uploader.upload(filePath, {
    resource_type: 'image',
    folder: 'product-image-compression',
    timestamp: adjustedTimestamp,
  });
  return res.secure_url || res.url;
}

async function processImageUrl(imageUrl, index, productId) {
  if (!/^https?:\/\//i.test(imageUrl)) {
    return { updatedUrl: imageUrl, skipped: true, reason: 'not-http-url' };
  }

  const ext = getExtensionFromUrl(imageUrl);
  const fileName = `product-${productId}-img-${index}${ext}`;
  const inputPath = path.join(TEMP_DIR, `input-${fileName}`);
  const outputPath = path.join(TEMP_DIR, `output-${fileName}`);

  const headResponse = await fetch(imageUrl, { method: 'HEAD' });
  const contentLength = headResponse.headers.get('content-length');
  const remoteSize = contentLength ? Number(contentLength) : null;
  if (remoteSize !== null && remoteSize <= TARGET_BYTES) {
    return { updatedUrl: imageUrl, skipped: true, reason: 'already-small' };
  }

  const buffer = await downloadImage(imageUrl);
  if (buffer.length <= TARGET_BYTES) {
    return { updatedUrl: imageUrl, skipped: true, reason: 'already-small-buffer' };
  }

  fs.writeFileSync(inputPath, buffer);

  let compressedPath;
  if (ffmpegAvailable()) {
    try {
      compressedPath = await compressWithFfmpeg(inputPath, outputPath);
    } catch (error) {
      console.warn(`ffmpeg compression failed for ${imageUrl}: ${error.message}`);
    }
  }

  if (!compressedPath) {
    try {
      compressedPath = await compressWithSharp(inputPath, outputPath);
    } catch (error) {
      throw new Error(`Compression failed for ${imageUrl}: ${error.message}`);
    }
  }

  const compressedSize = fs.statSync(compressedPath).size;
  if (compressedSize > TARGET_BYTES) {
    console.warn(`Compressed file still exceeds 80KB: ${compressedSize} bytes for ${imageUrl}`);
  }

  const newUrl = await uploadToCloudinary(compressedPath);
  return { updatedUrl: newUrl, skipped: false, originalSize: buffer.length, compressedSize };
}

async function main() {
  ensureTempDir();

  console.log('Starting product image compression.');
  console.log('Checking clock drift with Cloudinary...');
  try {
    const res = await fetch('https://api.cloudinary.com');
    const serverDate = res.headers.get('date');
    if (serverDate) {
      const serverMs = new Date(serverDate).getTime();
      const localMs = Date.now();
      timeDriftMs = serverMs - localMs;
      console.log(`Clock drift detected: ${Math.round(timeDriftMs / 1000)} seconds. Adjusting timestamps.`);
    }
  } catch (error) {
    console.warn('Could not check Cloudinary clock drift, using system time:', error.message);
  }

  console.log('ffmpeg path:', FFMPEG_PATH);
  console.log('ffmpeg available:', ffmpegAvailable());

  const products = await prisma.product.findMany({ select: { id: true, images: true } });
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const product of products) {
    if (!Array.isArray(product.images) || product.images.length === 0) continue;

    const updatedImages = [...product.images];
    let changed = false;

    for (let index = 0; index < product.images.length; index += 1) {
      const imageUrl = product.images[index];
      try {
        const result = await processImageUrl(imageUrl, index, product.id);
        if (result.skipped) {
          totalSkipped += 1;
          continue;
        }

        if (result.updatedUrl && result.updatedUrl !== imageUrl) {
          updatedImages[index] = result.updatedUrl;
          changed = true;
          totalUpdated += 1;
          console.log(`Updated image for product ${product.id} index ${index}: ${imageUrl} -> ${result.updatedUrl}`);
        }
      } catch (error) {
        console.error(`Failed to process image for product ${product.id} index ${index}:`, error.message);
      }
    }

    if (changed) {
      await prisma.product.update({
        where: { id: product.id },
        data: { images: updatedImages },
      });
      console.log(`Product ${product.id} images updated.`);
    }
  }

  console.log('Compression complete.');
  console.log(`Total updated images: ${totalUpdated}`);
  console.log(`Total skipped images: ${totalSkipped}`);
  process.exit(0);
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
