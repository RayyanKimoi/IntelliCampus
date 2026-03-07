import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
  const user = await prisma.user.findUnique({
    where: { email: 'divyajeetsahu24@gmail.com' },
    select: {
      email: true,
      role: true,
      passwordHash: true,
      name: true,
    },
  });

  console.log('\n=== Admin User Check ===\n');
  
  if (!user) {
    console.log('❌ User NOT FOUND in database');
  } else {
    console.log('✅ User found!');
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('Has passwordHash:', !!user.passwordHash);
    console.log('PasswordHash length:', user.passwordHash?.length);
    console.log('PasswordHash preview:', user.passwordHash?.substring(0, 20) + '...');
  }
  
  await prisma.$disconnect();
}

checkAdmin().catch(console.error);
