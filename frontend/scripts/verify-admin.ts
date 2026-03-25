/**
 * Script to verify admin user setup
 * Run: npx tsx scripts/verify-admin.ts
 */

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

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'divyajeetsahu24@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Validate environment variables
if (!process.env.ADMIN_EMAIL) {
  console.warn('⚠️  ADMIN_EMAIL not found in .env file, using default');
}
if (!process.env.ADMIN_PASSWORD) {
  console.warn('⚠️  ADMIN_PASSWORD not found in .env file');
}

async function verifyAdmin() {
  try {
    console.log('🔍 Verifying admin user setup...\n');
    console.log(`Looking for admin with email: ${ADMIN_EMAIL}\n`);

    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
      include: {
        institution: true,
        profile: true,
        accessibilitySettings: true,
      },
    });

    if (!adminUser) {
      console.log('❌ Admin user NOT found in database!');
      console.log('\n💡 To create the admin user, run:');
      console.log('   npx tsx scripts/create-admin.ts\n');
      process.exit(1);
    }

    console.log('✅ Admin user found!\n');
    console.log('📋 Admin Details:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Institution ID: ${adminUser.institutionId}`);
    console.log(`   Institution Name: ${adminUser.institution.name}`);
    console.log(`   Active: ${adminUser.isActive}`);
    console.log(`   Has Profile: ${adminUser.profile ? 'Yes' : 'No'}`);
    console.log(`   Has Accessibility Settings: ${adminUser.accessibilitySettings ? 'Yes' : 'No'}`);
    console.log(`   Created: ${adminUser.createdAt.toISOString()}\n`);

    // Verify role
    if (adminUser.role !== 'admin') {
      console.log('⚠️  WARNING: User role is not "admin"!');
      console.log(`   Current role: ${adminUser.role}`);
      console.log('   Please update the user role in the database.\n');
      process.exit(1);
    }

    // Verify institution exists
    if (!adminUser.institution) {
      console.log('⚠️  WARNING: Admin institution not found!');
      console.log('   Database integrity issue detected.\n');
      process.exit(1);
    }

    // Count users by role
    const [totalUsers, studentsCount, teachersCount, adminsCount] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'student' } }),
      prisma.user.count({ where: { role: 'teacher' } }),
      prisma.user.count({ where: { role: 'admin' } }),
    ]);

    console.log('📊 Database Summary:');
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Students: ${studentsCount}`);
    console.log(`   Teachers: ${teachersCount}`);
    console.log(`   Admins: ${adminsCount}\n`);

    // Check institutions
    const institutions = await prisma.institution.count();
    console.log(`   Total Institutions: ${institutions}\n`);

    console.log('✨ Admin setup verified successfully!');
    console.log('\n🚀 You can now login as admin at:');
    console.log('   • Default login: http://localhost:3000/auth/login');
    console.log('   • Admin OTP login: http://localhost:3000/login-admin');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    if (ADMIN_PASSWORD) {
      console.log(`   Password: ${ADMIN_PASSWORD}`);
    }
    console.log('   (Both login methods will provide identical access)\n');

  } catch (error) {
    console.error('❌ Error verifying admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdmin()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
