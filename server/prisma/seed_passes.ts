/// <reference types="node" />
import { PrismaClient, PassType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const templates = [
    {
      type: PassType.MONTHLY,
      name: 'Monthly Unlimited',
      description: 'Unlimited travel for 30 days on all routes.',
      price: 45000,
      durationDays: 30,
    },
    {
      type: PassType.WEEKLY,
      name: 'Weekly Saver',
      description: 'Unlimited travel for 7 days within Kigali.',
      price: 12000,
      durationDays: 7,
    },
    {
      type: PassType.MONTHLY,
      name: 'Student Monthly',
      description: 'Discounted monthly pass for students with valid ID.',
      price: 25000,
      durationDays: 30,
    },
  ];

  for (const template of templates) {
    const exists = await prisma.passTemplate.findFirst({
      where: { name: template.name },
    });

    if (!exists) {
      await prisma.passTemplate.create({
        data: template,
      });
      console.log(`Created template: ${template.name}`);
    } else {
        console.log(`Template already exists: ${template.name}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
