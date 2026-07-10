const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const NIGERIA_STATES = [
  'Abia','Adamawa','Akwa_Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross_River','Delta',
  'Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi',
  'Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'
];

async function upsertStateFee(state, price) {
  try {
    const existing = await prisma.deliveryFee.findFirst({
      where: { country: 'Nigeria', state: state, city: null, region: null }
    });

    if (existing) {
      const updated = await prisma.deliveryFee.update({
        where: { id: existing.id },
        data: { price: price }
      });
      console.log(`Updated ${state} -> ${price}`);
      return updated;
    } else {
      const created = await prisma.deliveryFee.create({
        data: { country: 'Nigeria', state: state, city: null, region: null, price: price }
      });
      console.log(`Created ${state} -> ${price}`);
      return created;
    }
  } catch (err) {
    console.error(`Error upserting ${state}:`, err);
  }
}

async function main() {
  console.log('Starting delivery fee seeding...');

  for (const state of NIGERIA_STATES) {
    const price = state === 'Kwara' ? 2500 : 4000;
    await upsertStateFee(state, price);
  }

  // Also ensure a country-wide fallback exists
  try {
    const country = await prisma.deliveryFee.findFirst({ where: { country: 'Nigeria', state: null, city: null, region: null } });
    if (country) {
      await prisma.deliveryFee.update({ where: { id: country.id }, data: { price: 4000 } });
      console.log('Updated Nigeria fallback -> 4000');
    } else {
      await prisma.deliveryFee.create({ data: { country: 'Nigeria', state: null, city: null, region: null, price: 4000 } });
      console.log('Created Nigeria fallback -> 4000');
    }
  } catch (err) {
    console.error('Error creating/updating country fallback:', err);
  }

  console.log('Done seeding delivery fees.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
