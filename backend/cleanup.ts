import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.conversation.deleteMany({
    where: {
      modelId: {
        contains: 'claude',
      },
    },
  });

  console.log(`Deleted ${result.count} old conversations`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
