import { auth } from "../lib/auth.js";
import prisma from "../lib/prisma.js";

async function seedAdmins() {
  console.log("Starting TradeSlot Admin Accounts Seeding...");

  const adminAccounts = [
    {
      name: "Platform Super Admin",
      email: process.env.PLATFORM_ADMIN_EMAIL!,
      password: process.env.PLATFORM_ADMIN_PASSWORD!,
      role: "PLATFORM_ADMIN",
    },
    {
      name: "Apex Business Admin",
      email: process.env.BUSINESS_ADMIN_EMAIL!,
      password: process.env.BUSINESS_ADMIN_PASSWORD!,
      role: "BUSINESS_ADMIN",
    },
  ];

  for (const acc of adminAccounts) {
    // 1. Check if email already exists in database
    const existingUser = await prisma.user.findUnique({
      where: { email: acc.email },
    });

    if (existingUser) {
      console.log(`[Seed Skipped] User (${acc.email}) already exists in DB.`);
      continue;
    }

    // 2. Create user with Better Auth (handles hashing & account table)
    try {
      const createdUser = await auth.api.signUpEmail({
        body: {
          name: acc.name,
          email: acc.email,
          password: acc.password,
          role: acc.role as any,
        },
      });

      if (createdUser?.user?.id) {
        // 3. Mark email as verified by default
        await prisma.user.update({
          where: { id: createdUser.user.id },
          data: { emailVerified: true },
        });

        console.log(
          `[Seeded] ${acc.role}: ${acc.email} (Email Verified: TRUE)`,
        );
      }
    } catch (err: any) {
      console.error(`[Error Seeding] ${acc.email}:`, err?.message || err);
    }
  }

  console.log("Seeding completed successfully!");
}

seedAdmins()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
