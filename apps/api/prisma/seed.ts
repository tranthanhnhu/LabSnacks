import bcrypt from "bcryptjs";
import { PrismaClient, RoleSlug, RestockStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { slug: RoleSlug.ADMIN, name: "Lab administrator" },
    { slug: RoleSlug.MANAGER, name: "Inventory manager" },
    { slug: RoleSlug.STAFF, name: "Staff" },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { slug: r.slug },
      update: { name: r.name },
      create: r,
    });
  }

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { slug: RoleSlug.ADMIN } });
  const managerRole = await prisma.role.findUniqueOrThrow({ where: { slug: RoleSlug.MANAGER } });
  const staffRole = await prisma.role.findUniqueOrThrow({ where: { slug: RoleSlug.STAFF } });

  const hash = await bcrypt.hash("demo123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@kawaii.lab" },
    update: {},
    create: {
      email: "admin@kawaii.lab",
      name: "Dr. Mochi",
      passwordHash: hash,
      roleId: adminRole.id,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@kawaii.lab" },
    update: {},
    create: {
      email: "manager@kawaii.lab",
      name: "Lab Manager",
      passwordHash: hash,
      roleId: managerRole.id,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@kawaii.lab" },
    update: {},
    create: {
      email: "staff@kawaii.lab",
      name: "Snack Assistant",
      passwordHash: hash,
      roleId: staffRole.id,
    },
  });

  const products = [
    {
      name: "Berry Quantum Crunch",
      sku: "BQC-001",
      category: "Crunchy",
      description: "Crunchy berry-flavored snack.",
    },
    {
      name: "Liquid Fuel Tea",
      sku: "LFT-002",
      category: "Liquid",
      description: "Mild sweet lab tea.",
    },
    {
      name: "Mochi Lab Special",
      sku: "MLS-003",
      category: "Soft",
      description: "Special lab mochi.",
    },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: { name: p.name, category: p.category, description: p.description },
      create: p,
    });

    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: {},
      create: {
        productId: product.id,
        quantity: p.sku === "LFT-002" ? 3 : 120,
        lowStockThreshold: 10,
      },
    });
  }

  const p1 = await prisma.product.findUnique({ where: { sku: "BQC-001" } });
  if (p1) {
    const existing = await prisma.restockRequest.findFirst({
      where: { productId: p1.id, requestedById: staff.id, status: RestockStatus.PENDING },
    });
    if (!existing) {
      await prisma.restockRequest.create({
        data: {
          productId: p1.id,
          requestedById: staff.id,
          quantity: 50,
          status: RestockStatus.PENDING,
        },
      });
    }
  }

  console.log("Seed OK:", { admin: admin.email, manager: manager.email, staff: staff.email });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
