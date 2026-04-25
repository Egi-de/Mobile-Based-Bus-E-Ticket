import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🔧 Creating test users...');

    // Hash password: password123
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create Test Passenger
    const passenger = await prisma.user.upsert({
      where: { email: 'passenger@test.com' },
      update: {},
      create: {
        name: 'Test Passenger',
        email: 'passenger@test.com',
        phone: '0788123456',
        password: hashedPassword,
        role: 'PASSENGER',
      },
    });
    console.log('✅ Created passenger:', passenger.email);

    // Create Test Driver
    const driver = await prisma.user.upsert({
      where: { email: 'driver@test.com' },
      update: {},
      create: {
        name: 'Test Driver',
        email: 'driver@test.com',
        phone: '0788123456',
        password: hashedPassword,
        role: 'DRIVER',
      },
    });
    console.log('✅ Created driver:', driver.email);

    // Create Test Admin
    const admin = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        name: 'Test Admin',
        email: 'admin@test.com',
        phone: '0788123456',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log('✅ Created admin:', admin.email);

    console.log('\n🎉 Test users created successfully!');
    console.log('\nLogin credentials (all use same password):');
    console.log('━'.repeat(50));
    console.log('📧 Passenger: passenger@test.com');
    console.log('🚗 Driver:    driver@test.com');
    console.log('👨‍💼 Admin:     admin@test.com');
    console.log('🔑 Password:  password123');
    console.log('━'.repeat(50));
  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
