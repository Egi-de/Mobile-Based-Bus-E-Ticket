import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 Verifying database contents...\n');

  try {
    const userCount = await prisma.user.count();
    const routeCount = await prisma.route.count();
    const busCount = await prisma.bus.count();
    const passTemplateCount = await prisma.passTemplate.count();
    const bookingCount = await prisma.booking.count();
    const passCount = await prisma.pass.count();

    console.log('📊 Database Statistics:');
    console.log('═══════════════════════════════════');
    console.log(`👥 Users:          ${userCount}`);
    console.log(`🚌 Routes:         ${routeCount}`);
    console.log(`🚍 Buses:          ${busCount}`);
    console.log(`🎫 Pass Templates: ${passTemplateCount}`);
    console.log(`📝 Bookings:       ${bookingCount}`);
    console.log(`🎟️  Passes:         ${passCount}`);
    console.log('═══════════════════════════════════\n');

    if (userCount > 0) {
      console.log('👥 Sample Users:');
      const users = await prisma.user.findMany({
        select: { email: true, name: true, phone: true },
        take: 3,
      });
      users.forEach((user) => {
        console.log(`   - ${user.name} (${user.email})`);
      });
      console.log();
    }

    if (routeCount > 0) {
      console.log('🚌 Sample Routes:');
      const routes = await prisma.route.findMany({
        select: { origin: true, destination: true, price: true, operator: true },
        take: 5,
      });
      routes.forEach((route) => {
        console.log(`   - ${route.origin} → ${route.destination} (${route.price} RWF) - ${route.operator}`);
      });
      console.log();
    }

    if (passTemplateCount > 0) {
      console.log('🎫 Pass Templates:');
      const templates = await prisma.passTemplate.findMany({
        select: { name: true, type: true, price: true, durationDays: true },
      });
      templates.forEach((template) => {
        console.log(`   - ${template.name} (${template.type}) - ${template.price} RWF for ${template.durationDays} days`);
      });
      console.log();
    }

    if (busCount > 0) {
      console.log('🚍 Buses:');
      const buses = await prisma.bus.findMany({
        select: { plateNumber: true, status: true },
        take: 5,
      });
      buses.forEach((bus) => {
        console.log(`   - ${bus.plateNumber} (${bus.status})`);
      });
      console.log();
    }

    console.log('✅ Database verification complete!');
    
    if (userCount === 0 && routeCount === 0) {
      console.log('\n⚠️  Database appears to be empty. Run: npm run db:seed');
    } else {
      console.log('\n💡 Test Login Credentials:');
      console.log('   Email: test@example.com');
      console.log('   Password: password123');
    }

  } catch (error) {
    console.error('❌ Error verifying database:', error);
    process.exit(1);
  }
}

verify()
  .finally(async () => {
    await prisma.$disconnect();
  });
