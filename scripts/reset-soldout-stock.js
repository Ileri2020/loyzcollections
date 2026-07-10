const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Scanning products to reset sold-out stock...');

  const products = await prisma.product.findMany({
    include: {
      stock: true,
      cartItems: {
        include: { cart: true },
      },
    },
  });

  let updatedCount = 0;

  for (const p of products) {
    const totalStock = (p.stock || []).reduce((s, st) => s + (st.addedQuantity || 0), 0);
    const totalSold = (p.cartItems || []).reduce((s, ci) => {
      const isPaid = ci.cart?.status === 'paid' || ci.cart?.status === 'completed';
      return s + (isPaid ? (ci.quantity || 0) : 0);
    }, 0);

    const available = totalStock - totalSold;

    if (available <= 0) {
      if (p.stock && p.stock.length > 0) {
        // increase each existing stock record by 1 unit for sold-out products
        for (const stockEntry of p.stock) {
          try {
            await prisma.stock.update({
              where: { id: stockEntry.id },
              data: { addedQuantity: (stockEntry.addedQuantity || 0) + 1 },
            });
            console.log(`Increased stock for product ${p.id} (${p.name}) -> stock ${stockEntry.id} +1`);
            updatedCount++;
          } catch (err) {
            console.error(`Failed to increase stock for product ${p.id}:`, err);
          }
        }
      } else {
        // create a new stock entry
        try {
          await prisma.stock.create({ data: { productId: p.id, addedQuantity: 1, pricePerProduct: p.price || 0, costPerProduct: p.costPrice || p.price || 0 } });
          console.log(`Created stock for product ${p.id} (${p.name}) -> addedQuantity=1`);
          updatedCount++;
        } catch (err) {
          console.error(`Failed to create stock for product ${p.id}:`, err);
        }
      }
    }
  }

  console.log(`Completed. Updated ${updatedCount} products.`);
}

main()
  .catch((e) => {
    console.error('Script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
