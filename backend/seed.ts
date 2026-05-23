import { PrismaClient } from '@prisma/client';
import { hashPassword } from './src/services/authService.js';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@openarena.local' } });
  if (existing) {
    console.log('Admin user already exists');
    return;
  }

  await prisma.user.create({
    data: {
      email: 'admin@openarena.local',
      username: 'admin',
      passwordHash: await hashPassword('admin123'),
      role: 'ADMIN',
      avatarColor: '#6C4FF6',
    },
  });

  console.log('Admin user created: admin@openarena.local / admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
