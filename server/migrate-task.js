const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Task" ADD COLUMN "commitOids" TEXT;`);
    console.log('Successfully added commitOids to Task table manually.');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('Column commitOids already exists.');
    } else {
      console.error('Error altering table:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
