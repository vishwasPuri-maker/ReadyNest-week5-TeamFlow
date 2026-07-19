import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // Two separate tenants to demonstrate isolation.
  const acme = await prisma.organization.upsert({
    where: { slug: 'acme' },
    update: {},
    create: { name: 'Acme Inc', slug: 'acme' },
  });
  const globex = await prisma.organization.upsert({
    where: { slug: 'globex' },
    update: {},
    create: { name: 'Globex Corp', slug: 'globex' },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: { email: 'admin@acme.com', name: 'Alice Admin', passwordHash, emailVerified: true },
  });
  const member = await prisma.user.upsert({
    where: { email: 'member@acme.com' },
    update: {},
    create: { email: 'member@acme.com', name: 'Bob Member', passwordHash, emailVerified: true },
  });
  const other = await prisma.user.upsert({
    where: { email: 'admin@globex.com' },
    update: {},
    create: { email: 'admin@globex.com', name: 'Carol Globex', passwordHash, emailVerified: true },
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: admin.id, organizationId: acme.id } },
    update: {},
    create: { userId: admin.id, organizationId: acme.id, role: 'ADMIN' },
  });
  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: member.id, organizationId: acme.id } },
    update: {},
    create: { userId: member.id, organizationId: acme.id, role: 'MEMBER' },
  });
  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: other.id, organizationId: globex.id } },
    update: {},
    create: { userId: other.id, organizationId: globex.id, role: 'ADMIN' },
  });

  const project = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Revamp the marketing site',
      organizationId: acme.id,
    },
  });

  await prisma.task.createMany({
    data: [
      { title: 'Design homepage', status: 'IN_PROGRESS', priority: 'HIGH', projectId: project.id, organizationId: acme.id, assigneeId: member.id },
      { title: 'Set up CI/CD', status: 'TODO', priority: 'MEDIUM', projectId: project.id, organizationId: acme.id },
      { title: 'Write copy', status: 'DONE', priority: 'LOW', projectId: project.id, organizationId: acme.id, assigneeId: admin.id },
    ],
  });

  // --- Inventory / Store demo data (Acme = a shop) ---
  const products = [
    { name: 'Wireless Mouse', sku: 'WM-100', price: 79900, stock: 25 },
    { name: 'Mechanical Keyboard', sku: 'KB-200', price: 349900, stock: 12 },
    { name: 'USB-C Cable', sku: 'CB-050', price: 29900, stock: 4 }, // low stock
    { name: 'Laptop Stand', sku: 'LS-300', price: 129900, stock: 8 },
  ];
  for (const p of products) {
    await prisma.product.upsert({
      where: { organizationId_sku: { organizationId: acme.id, sku: p.sku } },
      update: {},
      create: { ...p, organizationId: acme.id },
    });
  }

  console.log('✅ Seed complete.');
  console.log('   Login: admin@acme.com / password123 (ADMIN = Store Owner)');
  console.log('          member@acme.com / password123 (MEMBER = Cashier)');
  console.log(`   Seeded ${products.length} products for Acme Inc.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
