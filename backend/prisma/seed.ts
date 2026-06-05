import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ── Admin user ──────────────────────────────────────────────
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        name: 'Admin',
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Admin user created  →  username: admin  |  password: admin123');
  } else {
    console.log('ℹ️  Admin user already exists, skipping.');
  }

  // ── Staff user ───────────────────────────────────────────────
  const existingStaff = await prisma.user.findUnique({
    where: { username: 'staff' },
  });

  if (!existingStaff) {
    const hashedPassword = await bcrypt.hash('staff123', 10);
    await prisma.user.create({
      data: {
        name: 'Staff Member',
        username: 'staff',
        password: hashedPassword,
        role: 'STAFF',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Staff user created  →  username: staff  |  password: staff123');
  } else {
    console.log('ℹ️  Staff user already exists, skipping.');
  }

  // ── Sample products ──────────────────────────────────────────
  const productCount = await prisma.product.count();

  if (productCount === 0) {
    await prisma.product.createMany({
      data: [
        {
          productName: 'Engine Oil 5W-30',
          category: 'Lubricants',
          supplier: 'Castrol',
          quantityInStock: 50,
          purchasePrice: 8.5,
          sellingPrice: 15.0,
          reorderPoint: 10,
          description: '1L engine oil for petrol engines',
        },
        {
          productName: 'Air Filter',
          category: 'Filters',
          supplier: 'Mann Filter',
          quantityInStock: 30,
          purchasePrice: 5.0,
          sellingPrice: 12.0,
          reorderPoint: 5,
          description: 'Universal air filter',
        },
        {
          productName: 'Brake Pads (Front)',
          category: 'Brakes',
          supplier: 'Brembo',
          quantityInStock: 20,
          purchasePrice: 18.0,
          sellingPrice: 35.0,
          reorderPoint: 5,
          description: 'Front brake pads set',
        },
        {
          productName: 'Spark Plug',
          category: 'Ignition',
          supplier: 'NGK',
          quantityInStock: 100,
          purchasePrice: 2.0,
          sellingPrice: 5.0,
          reorderPoint: 20,
          description: 'Standard spark plug',
        },
        {
          productName: 'Car Battery 60Ah',
          category: 'Electrical',
          supplier: 'Exide',
          quantityInStock: 15,
          purchasePrice: 45.0,
          sellingPrice: 80.0,
          reorderPoint: 3,
          description: '12V 60Ah car battery',
        },
      ],
    });
    console.log('✅ Sample products created (5 products)');
  } else {
    console.log('ℹ️  Products already exist, skipping.');
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
