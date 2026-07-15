"use server";

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const prisma = new PrismaClient();

// Centralized model mapping
const modelMap: Record<string, any> = {
  cart: prisma.cart,
  cartItem: prisma.cartItem,
  category: prisma.category,
  coupon: prisma.coupon,
  featuredProduct: prisma.featuredProduct,
  notification: prisma.notification,
  payment: prisma.payment,
  post: prisma.post,
  product: prisma.product,
  refund: prisma.refund,
  review: prisma.review,
  shippingAddress: prisma.shippingAddress,
  stock: prisma.stock,
  user: prisma.user,
  deliveryFee: prisma.deliveryFee,
  visit: prisma.visit,
  message: prisma.message,
};

// =====================
// Utilities
// =====================
async function parseJson(req: NextRequest) {
  try {
    const json = await req.json();
    return typeof json === "object" && json !== null ? json : {};
  } catch {
    return {};
  }
}

async function handleUpload(file: File | string) {
  let dataURI = typeof file === "string" ? file : "";

  if (typeof file !== "string") {
    const buffer = await file.arrayBuffer();
    const b64 = Buffer.from(buffer).toString("base64");
    dataURI = `data:${file.type};base64,${b64}`;
  }

  const res = await cloudinary.v2.uploader.upload(dataURI, { resource_type: "auto" });
  return res;
}

function parseId(id: string | null, model: string) {
  if (!id) return null;
  // return ["user", "category", "product"].includes(model) ? id : Number(id);
  return id;
}

function parseFormValue(key: string, value: string | File) {
  if (value instanceof File) return value;
  if (typeof value !== "string") return value;

  const trimmed = value.trim();

  if (trimmed === "true" || trimmed === "false") {
    return trimmed === "true";
  }

  if (key === "price" || key === "costPrice") {
    const parsed = parseFloat(trimmed);
    return Number.isNaN(parsed) ? trimmed : parsed;
  }

  if (key === "images" || key === "activeIngredients" || key === "for") {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore invalid JSON
    }
    if (trimmed.includes(",")) {
      return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }

  return trimmed;
}


const DELIVERY_FEES_BY_STATE: Record<string, number> = {
  Kwara: 2500, Kogi: 4000, Niger: 4000, Oyo: 4000, Osun: 4000,
  Ogun: 4000, Ondo: 4000, Ekiti: 4000, Benue: 4000, Nasarawa: 4000,
  Lagos: 4000, FCT: 4000, Edo: 4000,
  Anambra: 4000, Enugu: 4000, Imo: 4000, Abia: 4000, Ebonyi: 4000,
  Delta: 4000, Rivers: 4000, Akwa_Ibom: 4000, Cross_River: 4000, Bayelsa: 4000,
  Kaduna: 4000, Kano: 4000, Katsina: 4000, Jigawa: 4000, Zamfara: 4000,
  Sokoto: 4000, Kebbi: 4000, Bauchi: 4000, Gombe: 4000, Adamawa: 4000,
  Taraba: 4000, Borno: 4000, Yobe: 4000,
};

const normalizeState = (state?: string | null): string | null => {
  if (!state) return null;
  return state.replace(/state/i, "").replace(/[-\s]/g, "_").trim();
};


// ==================== GET ====================
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const model = searchParams.get("model");
  const id = parseId(searchParams.get("id"), model || "");
  const searchQuery = searchParams.get("search")?.toLowerCase() || "";
  const categoryFilter = searchParams.get("category")?.toLowerCase() || "";
  const statusParam = searchParams.get("status"); // ← NEW

  if (!model || !modelMap[model]) {
    return NextResponse.json({ error: "Invalid model" }, { status: 400 });
  }

  const prismaModel = modelMap[model];

  // =====================
  // INCLUDE MAP
  // =====================
  const includeMap: Record<string, any> = {
    product: {
      category: true,
      stock: true,
      reviews: true,
      cartItems: {
        include: {
          cart: true,
        },
      },
    },
    featuredProduct: {
      product: {
        include: {
          category: true,
          stock: true,
          reviews: true,
          cartItems: {
            include: {
              cart: true,
            },
          },
        },
      },
    },
    review: {
      user: { select: { id: true, name: true, email: true, image: true } },
      product: {
        include: {
          category: true,
          stock: true,
          reviews: true,
          cartItems: {
            include: {
              cart: true,
            },
          },
        },
      },
    },
    post: { author: true },
    cart: {
      products: {
        include: { product: true },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
      payment: true,
    },
    user: {
      cart: true,
      reviews: true,
      addresses: true,
      post: true,
      notification: true,
    },
    category: { products: true },
    stock: { product: true },
    payment: { cart: true },
    refund: { cart: true },
    message: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  };

  try {
    // =====================
    // SINGLE ITEM
    // =====================
    if (id) {
      if (model === "review") {
        const items = await prisma.review.findMany({
          where: { productId: id },
          include: includeMap.review,
        });
        return NextResponse.json(items);
      }

      const item = await prismaModel.findUnique({
        where: { id },
        include: includeMap[model],
      });

      if (!item) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(item);
    }

    // =====================
    // CART FILTERING (🔥 FIX)
    // =====================
    // =====================
    // CART FILTERING (🔥 FIX)
    // =====================
    if (model === "cart") {
      const where: any = {};

      if (statusParam) {
        const statuses = statusParam
          .split(",")
          .map(s => s.trim().toLowerCase());

        where.status = { in: statuses };
      }

      if (searchQuery) {
          where.OR = [
              { name: { contains: searchQuery, mode: 'insensitive' } },
              { user: { name: { contains: searchQuery, mode: 'insensitive' } } },
              { user: { email: { contains: searchQuery, mode: 'insensitive' } } },
              { user: { contact: { contains: searchQuery, mode: 'insensitive' } } },
              // Check id too just in case
              { id: { contains: searchQuery, mode: 'insensitive' } }
          ];
      }

      // If userId is passed via searchParam (often unrelated to text search)
      if (searchParams.get('userId')) {
         where.userId = searchParams.get('userId');
      }

      const carts = await prisma.cart.findMany({
        where,
        include: includeMap.cart,
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(carts);
    }

    // =====================
    // PRODUCT SEARCH
    // =====================
    if (model === "product") {
      const where: any = {};

      if (searchQuery || categoryFilter) {
        where.OR = [];

        if (searchQuery) {
          where.OR.push({
            name: { contains: searchQuery, mode: "insensitive" },
          });
        }

        if (categoryFilter) {
          where.OR.push({
            category: {
              name: { contains: categoryFilter, mode: "insensitive" },
            },
          });
        }
      }

      const products = await prisma.product.findMany({
        where,
        include: includeMap.product,
        take: 50,
      });

      return NextResponse.json(products);
    }

    // =====================
    // DEFAULT FETCH ALL
    // =====================
    const items = await prismaModel.findMany({
      include: includeMap[model],
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Database GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}


// ==================== POST ====================
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model");

  if (!model || !modelMap[model]) {
    return NextResponse.json({ error: "Invalid model" }, { status: 400 });
  }

  const prismaModel = modelMap[model];
  const contentType = req.headers.get("content-type") || "";
  let body: Record<string, any> = {};

  try {
    /**
     * =========================
     * BODY PARSING (JSON + FORM)
     * =========================
     */
    if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      // Handle file upload
      if (file) {
        const uploadRes = await handleUpload(file);

        if (model === "category" || model === "user") {
          body.image = uploadRes.url;
        }

        if (model === "product") {
          body.images = [uploadRes.url];
        }
      }

      // Copy remaining fields
      formData.forEach((value, key) => {
        if (key === "file") return;
        body[key] = value;
      });
    }
    else if (contentType.includes("application/json")) {
      body = await parseJson(req);
    }
    else {
      return NextResponse.json(
        { error: "Unsupported Content-Type" },
        { status: 415 }
      );
    }

    /**
     * =========================
     * CART / PAYMENT CREATION
     * =========================
     */
    if (model === "cart") {
      const { userId, items, deliveryAddressId } = body;

      if (!userId || !items?.length || !deliveryAddressId) {
        return NextResponse.json(
          { error: "Missing checkout data" },
          { status: 400 }
        );
      }

      const productIds = items.map((i: any) => i.productId);
      const dbProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, price: true },
      });

      let subtotal = 0;
      for (const item of items) {
        const product = dbProducts.find(p => p.id === item.productId);
        if (!product) continue;
        subtotal += product.price * item.quantity;
      }

      const address = await prisma.shippingAddress.findUnique({
        where: { id: deliveryAddressId },
        select: { country: true, state: true, city: true },
      });

      let deliveryFee = 6500;

      if (address) {
        // 1. Try City specific
        const feeCity = await prisma.deliveryFee.findFirst({
          where: { country: address.country, state: address.state, city: address.city },
        });

        if (feeCity) {
          deliveryFee = feeCity.price;
        } else {
          // 2. Try State specific
          const feeState = await prisma.deliveryFee.findFirst({
            where: { country: address.country, state: address.state, city: null },
          });

          if (feeState) {
            deliveryFee = feeState.price;
          } else {
            // 3. Try Country specific
            const feeCountry = await prisma.deliveryFee.findFirst({
              where: { country: address.country, state: null, city: null },
            });

            if (feeCountry) {
              deliveryFee = feeCountry.price;
            } else {
              // 3b. Try Region/Group Specific (Fallback if no country match)
              // Assumption: We check if any Defined Region matches the user's country? 
              // Or rather, if the user's country is part of a region? 
              // Without a Country->Region map table, we can only check if the address.country
              // matches a 'region' field entry in DeliveryFee? 
              // No, wait. The user selects "United Kingdom" as country. 
              // If Admin sets Region="United Kingdom", Price=X.
              // We should search where region = address.country OR region = 'Europe' (if we knew).
              // For now, let's strictly check if the country name is used as a region key.

              const feeRegion = await prisma.deliveryFee.findFirst({
                where: { region: address.country }
              });

              if (feeRegion) {
                deliveryFee = feeRegion.price;
              } else {
                // 4. Fallback to hardcoded for Nigeria states if applicable
                const normalizedState = normalizeState(address.state);
                if (normalizedState && DELIVERY_FEES_BY_STATE[normalizedState]) {
                  deliveryFee = DELIVERY_FEES_BY_STATE[normalizedState];
                }
              }
            }
          }
        }
      }

      const total = subtotal + deliveryFee;

      const cart = await prisma.cart.create({
        data: {
          userId,
          total,
          deliveryFee,
          status: "pending",
          name: body.name, // optional name
          contact: body.contact, // optional contact
          products: {
            create: items.map((i: any) => ({
              productId: i.productId,
              quantity: i.quantity,
            })),
          },
        },
        include: { products: true },
      });

      return NextResponse.json(cart);
    }

    /**
     * =========================
     * USER PASSWORD HASHING
     * =========================
     */
    if (model === "user" && body.password) {
      const salt = await bcrypt.genSalt();
      body.password = await bcrypt.hash(body.password, salt);
    }

    if (body.price) body.price = parseFloat(body.price);

    console.log("Creating new", model, "with data:", body);

    const newItem = await prismaModel.create({ data: body });
    return NextResponse.json(newItem);
  } catch (error) {
    console.error("Database POST error:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}




// ==================== PUT ====================
export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model");

  if (!model || !modelMap[model]) {
    return NextResponse.json({ error: "Invalid model" }, { status: 400 });
  }

  const prismaModel = modelMap[model];
  const contentType = req.headers.get("content-type") || "";
  const body: Record<string, any> = {};

  try {
    // =========================
    // FORM DATA
    // =========================
    if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      // handle file upload only if present
      if (file instanceof File && file.size > 0) {
        const uploadRes = await handleUpload(file);

        if (model === "category" || model === "user") {
          body.image = uploadRes.url;
        }

        if (model === "product") {
          body.images = [uploadRes.url];
        }
      }

      // copy remaining fields
      formData.forEach((value, key) => {
        if (key === "file") return;
        const parsedValue = parseFormValue(key, value);

        if (body[key] !== undefined) {
          body[key] = Array.isArray(body[key])
            ? [...body[key], parsedValue]
            : [body[key], parsedValue];
        } else {
          body[key] = parsedValue;
        }
      });
    }

    // =========================
    // JSON BODY
    // =========================
    else if (contentType.includes("application/json")) {
      const json = await req.json();
      Object.assign(body, json);

      if (json.image && (model === "user" || model === "category")) {
        body.image = json.image;
      }

      if (json.images && model === "product") {
        body.images = json.images;
      }
    } else {
      return NextResponse.json(
        { error: "Unsupported Content-Type" },
        { status: 415 }
      );
    }

    // =========================
    // ID RESOLUTION
    // =========================
    const id = parseId(body.id || searchParams.get("id"), model);
    if (!id) {
      return NextResponse.json(
        { error: "Missing or invalid id" },
        { status: 400 }
      );
    }

    // remove id from update payload
    const { id: _ignore, ...updatedData } = body;

    // =========================
    // TYPE FIXES (CRITICAL)
    // =========================
    if (updatedData.price) {
      updatedData.price = parseFloat(updatedData.price);
    }
    if (updatedData.costPrice) {
      updatedData.costPrice = parseFloat(updatedData.costPrice);
    }

    // =========================
    // CART PAYLOAD UPDATES
    // =========================
    if (model === "cart") {
        // Allow updating name and contact if provided
        // Logic handled by default update below unless it is status/payment specific
        
        // However, if it IS status/payment specific, we enter the block below.
        // We should merge logic or let the block below handle strict status/payment updates.
        // If the user is just renaming (body only has name), it skips the big block below.
    }

    if (!updatedData || Object.keys(updatedData).length === 0) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 }
      );
    }

    // =========================
    // UPDATE
    // =========================
    // =========================
    // CART PAYMENT UPDATE
    // =========================
    if (model === "cart" && (body.status || body.payment || body.total)) {
      // Fetch existing cart to check status
      const existingCart = await prisma.cart.findUnique({
        where: { id },
        select: { status: true },
      });

      const updatePayload: any = {};
      if (body.status) updatePayload.status = body.status;
      // Only allow total update if cart is still pending (not paid/completed)
      if (body.total && existingCart?.status === "pending") updatePayload.total = body.total;
      
      // Also allow updating name/contact here if passed
      if (body.name) updatePayload.name = body.name;
      if (body.contact) updatePayload.contact = body.contact;

      if (Object.keys(updatePayload).length > 0 || body.payment) {
          const updatedCart = await prisma.cart.update({
            where: { id },
            data: {
              ...updatePayload,
              ...(body.payment && {
                  payment: {
                    upsert: {
                      create: body.payment,
                      update: body.payment,
                    },
                  },
              })
            },
            include: {
                user: { include: { addresses: true } },
                products: { include: { product: true } },
                payment: true
            }
          });
          
          // Send email if paid
          if (body.status === 'paid' && updatedCart.user?.email && body.adminConfirmed) {
              const { sendPaymentConfirmationEmail } = await import('@/lib/nodemailer');
              // Use cart contact, then user contact, then address phone
              const contact = updatedCart.contact || updatedCart.user.contact || updatedCart.user.addresses?.[0]?.phone || 'N/A';
              
              const address = updatedCart.user.addresses?.[0];
              const addressStr = address 
                  ? `${address.address}, ${address.city}, ${address.state}, ${address.country}`
                  : "Address on file";

              await sendPaymentConfirmationEmail(updatedCart.user.email, {
                  customerName: updatedCart.user.name || 'Customer',
                  contact: contact,
                  address: addressStr,
                  products: updatedCart.products,
                  total: updatedCart.total,
                  deliveryFee: updatedCart.deliveryFee,
                  orderId: updatedCart.id
              });
          }

          return NextResponse.json(updatedCart);
      }
    }

    const updatedItem = await prismaModel.update({
      where: { id },
      data: updatedData,
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Database PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}


// ==================== DELETE ====================
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model");
  const id = `${parseId(searchParams.get("id"), model || "")}`;
  console.log("DELETE request for model:", model, "id:", id, 'search params id', searchParams.get("id"));

  if (!model || !modelMap[model]) return NextResponse.json({ error: "Invalid model" }, { status: 400 });
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const prismaModel = modelMap[model];

  try {
    await prismaModel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
