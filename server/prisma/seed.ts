import { PrismaClient, PassType, BusStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data...');
  await prisma.booking.deleteMany();
  await prisma.pass.deleteMany();
  await prisma.passTemplate.deleteMany();
  await prisma.bus.deleteMany();
  await prisma.route.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Existing data cleared\n');

  // Seed Users
  console.log('👥 Seeding users...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        name: 'John Doe',
        phone: '+250788123456',
        password: hashedPassword,
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        phone: '+250788234567',
        password: hashedPassword,
      },
    }),
    prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        phone: '+250788345678',
        password: hashedPassword,
      },
    }),
  ]);
  console.log(`✅ Created ${users.length} users\n`);

  // Seed Routes
  console.log('🚌 Seeding routes...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Real bus/coach images (Unsplash) - one per operator for consistent branding
  const ROUTE_IMAGES = {
    virunga: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80',
    ritco: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=80',
    volcano: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80',
    eastern: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&q=80',
  };

  const routes = await Promise.all([
    prisma.route.create({
      data: {
        origin: 'Kigali',
        destination: 'Musanze',
        departureTime: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8:00 AM
        arrivalTime: new Date(today.getTime() + 10.5 * 60 * 60 * 1000), // 10:30 AM
        price: 2500,
        operator: 'Virunga Express',
        seatsAvailable: 15,
        totalSeats: 30,
        amenities: ['WiFi', 'USB Charging', 'AC'],
        imageUrl: ROUTE_IMAGES.virunga,
      },
    }),
    prisma.route.create({
      data: {
        origin: 'Kigali',
        destination: 'Rubavu',
        departureTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9:00 AM
        arrivalTime: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12:00 PM
        price: 3000,
        operator: 'Ritco Express',
        seatsAvailable: 5,
        totalSeats: 25,
        amenities: ['AC', 'WiFi', 'TV', 'Reclining Seats'],
        imageUrl: ROUTE_IMAGES.ritco,
      },
    }),
    prisma.route.create({
      data: {
        origin: 'Kigali',
        destination: 'Huye',
        departureTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00 AM
        arrivalTime: new Date(today.getTime() + 13 * 60 * 60 * 1000), // 1:00 PM
        price: 2800,
        operator: 'Volcano Express',
        seatsAvailable: 20,
        totalSeats: 30,
        amenities: ['WiFi', 'USB Charging'],
        imageUrl: ROUTE_IMAGES.volcano,
      },
    }),
    prisma.route.create({
      data: {
        origin: 'Musanze',
        destination: 'Kigali',
        departureTime: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2:00 PM
        arrivalTime: new Date(today.getTime() + 16.5 * 60 * 60 * 1000), // 4:30 PM
        price: 2500,
        operator: 'Virunga Express',
        seatsAvailable: 28,
        totalSeats: 30,
        amenities: ['WiFi', 'USB Charging', 'AC'],
        imageUrl: ROUTE_IMAGES.virunga,
      },
    }),
    prisma.route.create({
      data: {
        origin: 'Kigali',
        destination: 'Nyagatare',
        departureTime: new Date(today.getTime() + 7 * 60 * 60 * 1000), // 7:00 AM
        arrivalTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00 AM
        price: 3500,
        operator: 'Eastern Express',
        seatsAvailable: 18,
        totalSeats: 28,
        amenities: ['AC', 'WiFi', 'Refreshments'],
        imageUrl: ROUTE_IMAGES.eastern,
      },
    }),
    prisma.route.create({
      data: {
        origin: 'Rubavu',
        destination: 'Kigali',
        departureTime: new Date(today.getTime() + 15 * 60 * 60 * 1000), // 3:00 PM
        arrivalTime: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 6:00 PM
        price: 3000,
        operator: 'Ritco Express',
        seatsAvailable: 12,
        totalSeats: 25,
        amenities: ['AC', 'WiFi', 'TV'],
        imageUrl: ROUTE_IMAGES.ritco,
      },
    }),
  ]);
  console.log(`✅ Created ${routes.length} routes\n`);

  // Seed Buses
  console.log('🚍 Seeding buses...');
  const buses = await Promise.all([
    prisma.bus.create({
      data: {
        plateNumber: 'RAD 001 A',
        routeId: routes[0].id,
        currentLat: -1.9441,
        currentLng: 30.0619,
        speed: 60,
        heading: 45,
        status: BusStatus.ON_ROUTE,
      },
    }),
    prisma.bus.create({
      data: {
        plateNumber: 'RAD 002 B',
        routeId: routes[1].id,
        currentLat: -1.9536,
        currentLng: 30.0606,
        speed: 55,
        heading: 270,
        status: BusStatus.ON_ROUTE,
      },
    }),
    prisma.bus.create({
      data: {
        plateNumber: 'RAD 003 C',
        routeId: routes[2].id,
        currentLat: -1.9706,
        currentLng: 30.1044,
        speed: 50,
        heading: 180,
        status: BusStatus.ON_ROUTE,
      },
    }),
    prisma.bus.create({
      data: {
        plateNumber: 'RAD 004 D',
        status: BusStatus.IDLE,
      },
    }),
    prisma.bus.create({
      data: {
        plateNumber: 'RAD 005 E',
        status: BusStatus.MAINTENANCE,
      },
    }),
  ]);
  console.log(`✅ Created ${buses.length} buses\n`);

  // Seed Pass Templates
  console.log('🎫 Seeding pass templates...');
  const passTemplates = await Promise.all([
    prisma.passTemplate.create({
      data: {
        type: PassType.MONTHLY,
        name: 'Monthly Unlimited',
        description: 'Unlimited travel for 30 days on all routes.',
        price: 45000,
        durationDays: 30,
      },
    }),
    prisma.passTemplate.create({
      data: {
        type: PassType.WEEKLY,
        name: 'Weekly Saver',
        description: 'Unlimited travel for 7 days within Kigali.',
        price: 12000,
        durationDays: 7,
      },
    }),
    prisma.passTemplate.create({
      data: {
        type: PassType.MONTHLY,
        name: 'Student Monthly',
        description: 'Discounted monthly pass for students with valid ID.',
        price: 25000,
        durationDays: 30,
      },
    }),
    prisma.passTemplate.create({
      data: {
        type: PassType.WEEKLY,
        name: 'Weekend Pass',
        description: 'Unlimited travel on weekends for 7 days.',
        price: 8000,
        durationDays: 7,
      },
    }),
  ]);
  console.log(`✅ Created ${passTemplates.length} pass templates\n`);

  // Seed some sample bookings
  console.log('📝 Seeding sample bookings...');
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        userId: users[0].id,
        routeId: routes[0].id,
        seats: ['A1', 'A2'],
        totalAmount: 5000,
        status: 'ACTIVE',
        travelDate: tomorrow,
        qrCode: `QR-${Date.now()}-1`,
      },
    }),
    prisma.booking.create({
      data: {
        userId: users[1].id,
        routeId: routes[1].id,
        seats: ['B3'],
        totalAmount: 3000,
        status: 'ACTIVE',
        travelDate: tomorrow,
        qrCode: `QR-${Date.now()}-2`,
      },
    }),
  ]);
  console.log(`✅ Created ${bookings.length} sample bookings\n`);

  // Seed some sample passes
  console.log('🎟️ Seeding sample passes...');
  const nextMonth = new Date(today);
  nextMonth.setDate(nextMonth.getDate() + 30);

  const passes = await Promise.all([
    prisma.pass.create({
      data: {
        userId: users[0].id,
        templateId: passTemplates[0].id,
        type: PassType.MONTHLY,
        name: 'Monthly Unlimited',
        price: 45000,
        status: 'ACTIVE',
        purchaseDate: today,
        expiryDate: nextMonth,
        qrCode: `PASS-${Date.now()}-1`,
      },
    }),
    prisma.pass.create({
      data: {
        userId: users[2].id,
        templateId: passTemplates[1].id,
        type: PassType.WEEKLY,
        name: 'Weekly Saver',
        price: 12000,
        status: 'ACTIVE',
        purchaseDate: today,
        expiryDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        qrCode: `PASS-${Date.now()}-2`,
      },
    }),
  ]);
  console.log(`✅ Created ${passes.length} sample passes\n`);

  console.log('🎉 Database seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - ${users.length} users`);
  console.log(`   - ${routes.length} routes`);
  console.log(`   - ${buses.length} buses`);
  console.log(`   - ${passTemplates.length} pass templates`);
  console.log(`   - ${bookings.length} bookings`);
  console.log(`   - ${passes.length} passes`);
  console.log('\n💡 Test credentials:');
  console.log('   Email: test@example.com');
  console.log('   Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
