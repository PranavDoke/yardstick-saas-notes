const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password for all test accounts
  const hashedPassword = await bcrypt.hash('password', 12);

  // Create Acme tenant
  const acmeTenant = await prisma.tenant.upsert({
    where: { slug: 'acme' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme',
      subscriptionPlan: 'FREE',
    },
  });

  // Create Globex tenant
  const globexTenant = await prisma.tenant.upsert({
    where: { slug: 'globex' },
    update: {},
    create: {
      name: 'Globex Corporation',
      slug: 'globex',
      subscriptionPlan: 'FREE',
    },
  });

  // Create Acme users
  const acmeAdmin = await prisma.user.upsert({
    where: { email: 'admin@acme.test' },
    update: {},
    create: {
      email: 'admin@acme.test',
      password: hashedPassword,
      role: 'ADMIN',
      tenantId: acmeTenant.id,
    },
  });

  const acmeUser = await prisma.user.upsert({
    where: { email: 'user@acme.test' },
    update: {},
    create: {
      email: 'user@acme.test',
      password: hashedPassword,
      role: 'MEMBER',
      tenantId: acmeTenant.id,
    },
  });

  // Create Globex users
  const globexAdmin = await prisma.user.upsert({
    where: { email: 'admin@globex.test' },
    update: {},
    create: {
      email: 'admin@globex.test',
      password: hashedPassword,
      role: 'ADMIN',
      tenantId: globexTenant.id,
    },
  });

  const globexUser = await prisma.user.upsert({
    where: { email: 'user@globex.test' },
    update: {},
    create: {
      email: 'user@globex.test',
      password: hashedPassword,
      role: 'MEMBER',
      tenantId: globexTenant.id,
    },
  });

  // Create some sample notes for testing
  await prisma.note.upsert({
    where: { id: 'sample-note-1' },
    update: {},
    create: {
      id: 'sample-note-1',
      title: 'Welcome to Acme Notes',
      content: 'This is a sample note for Acme Corporation. You can create, edit, and delete notes here.',
      userId: acmeAdmin.id,
      tenantId: acmeTenant.id,
    },
  });

  await prisma.note.upsert({
    where: { id: 'sample-note-2' },
    update: {},
    create: {
      id: 'sample-note-2',
      title: 'Welcome to Globex Notes',
      content: 'This is a sample note for Globex Corporation. Each tenant has isolated data.',
      userId: globexAdmin.id,
      tenantId: globexTenant.id,
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('📋 Test Accounts Created:');
  console.log('========================');
  console.log('🏢 Acme Corporation (FREE plan):');
  console.log('  👤 admin@acme.test (Admin) - password: password');
  console.log('  👤 user@acme.test (Member) - password: password');
  console.log('');
  console.log('🏢 Globex Corporation (FREE plan):');
  console.log('  👤 admin@globex.test (Admin) - password: password');
  console.log('  👤 user@globex.test (Member) - password: password');
  console.log('');
  console.log('🔗 API Endpoints:');
  console.log('  Health: GET /api/health');
  console.log('  Login: POST /api/auth/login');
  console.log('  Notes: GET/POST /api/notes');
  console.log('  Note: GET/PUT/DELETE /api/notes/{id}');
  console.log('  Upgrade: POST /api/tenants/{slug}/upgrade');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });