/**
 * Script to create admin user with hashed password
 * Run: npx tsx scripts/create-admin.ts
 */

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  console.log(`📄 Loading environment from: ${envPath}\n`);
  dotenv.config({ path: envPath });
} else {
  console.warn(`⚠️  Warning: .env file not found at ${envPath}`);
  console.warn('   Using default values...\n');
}

const prisma = new PrismaClient();

// Use environment variables for admin credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'divyajeetsahu24@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456890';
const ADMIN_NAME = 'Admin User';

// Validate environment variables
if (!process.env.ADMIN_EMAIL) {
  console.warn('⚠️  ADMIN_EMAIL not found in .env file, using default');
}
if (!process.env.ADMIN_PASSWORD) {
  console.warn('⚠️  ADMIN_PASSWORD not found in .env file, using default');
}

async function createAdmin() {
  try {
    console.log('🔐 Creating admin user...\n');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (existingUser) {
      console.log('✅ Admin user already exists!');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Role: ${existingUser.role}`);
      
      if (existingUser.role !== 'admin') {
        console.log('\n⚠️  WARNING: User exists but role is not "admin"');
        console.log('   Please update the role manually in the database.');
      }
      return;
    }

    // Get or create default institution
    let institution = await prisma.institution.findFirst();
    
    if (!institution) {
      console.log('📚 Creating default institution...');
      institution = await prisma.institution.create({
        data: {
          name: 'Default Institution',
          domain: 'default.edu',
        },
      });
      console.log('✅ Institution created\n');
    }

    // Hash password
    console.log('🔒 Hashing password...');
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    console.log('✅ Password hashed\n');

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = await prisma.user.create({
      data: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        passwordHash,
        role: 'admin',
        institutionId: institution.id,
      },
    });

    // Create profile
    await prisma.userProfile.create({
      data: { userId: adminUser.id },
    });

    // Create accessibility settings
    await prisma.accessibilitySettings.create({
      data: { userId: adminUser.id },
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('📋 Admin Details:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Institution: ${institution.name}\n`);
    
    console.log('🎉 You can now login at: http://localhost:3000/login-admin');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}\n`);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
