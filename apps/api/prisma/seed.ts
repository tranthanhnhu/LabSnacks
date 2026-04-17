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
      name: "Cola Classic",
      sku: "COLA-001",
      category: "Drink",
      description: "Drink • Sparkling",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBb5CIllylTc7V74YWPLSznEW3eamnFIi2IsgkUK8Fk5s3rIQmU5gjFzbbbemlGQkebZyUdVyA12geyDD6mVTDRc9CZLJkFiJ1TuywwoImDPvi-hsj-gKiDpjZmF6hBViwL26EJY23mctWKwwNAdvRzU8c_ierZoJwbQTxkkOCHGsC23Fabpqn0_WEDQ1i7Xyq5J5KhFVNOs40rxnw7Xs_7yXqZk8WXtxNIyaDSYNIaQGaI23qqRlehd4YmNZnhrRLLcB9NSJnzTmA",
      quantity: 12,
    },
    {
      name: "Matcha Cookie",
      sku: "MATCHA-002",
      category: "Bakery",
      description: "Bakery • Homemade",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDCKEZ7geU9LENzaZtta25aG41QPVtRolNMXmd15I931H-mIArvZ5qRF8eYwPYMFsU7aUIUWpw87L8_FZ4BL9sICWh5V7SoG2WoQYGc-r99xRTXfKEpXOZnO_jPynzmoeIqA2hiMuZVKiOQGYHw_Rze6yRHtI0E-qnTraUbl_SalBcNDxqpuUA82zt6NlUxRO_jyR4aaL5Y2zq2n3xczewtQDkbsrS-kQjXlkrxRDmzWHEi2TeNg_WR0ECCq85VQmmmQf6KWFunT0U",
      quantity: 8,
    },
    {
      name: "Spicy Noodles",
      sku: "NOODLE-003",
      category: "Noodles",
      description: "Noodles • Extra Spicy",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDLhHyh8oCAoT1i2RwFHuUkFmFKsaRb0ayLEPksNOARa6LLa3EN3yic7YHTQUHiIo8IN35W5j3q7pdSYedyN5Ns3cO77wdZOLMa-lGI7f8wHnJ-NhdZkDtvTfEFnIqtkhDAAxkkSnMSLBloifiCKc5jw_EAObhocijCDrxht_lkBV-MSs3wlQWU99V5IsGa9JLPEetRq22wGcJ638FZQYxTV9s3dU1zmp_8G5cuYPNEKB95Ha2I52CFMWuL2dN-e9XxgmA_wnEM_c8",
      quantity: 2,
    },
    {
      name: "Fuji Apple",
      sku: "APPLE-004",
      category: "Fruit",
      description: "Fruit • Fresh & Clean",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAhBz49Eakmdozunv2QViwL-ZvWVlNrhb-XR88rzijoYpx2cpCD0nJHcBN7EF0lWgMnXXBcM6YvIOzSEy5xEqde6abBGaBEDMg33oppVX5BFWHhIRhMegM91AN2qZv3526iIjILh8FlSt7Jdb5WtiIC8GWVwAKot5AkhFEmNEKhPY14KJieKk43C3I6xcqheKDZMXqcAX6pAtpWIm7qgoV4DjdnSqB1LLcmVlhRghghlF0mlX2HYAajtPC76qQ7eUymddOCozwH43s",
      quantity: 24,
    },
    {
      name: "Bottled Milk Tea",
      sku: "MILKTEA-005",
      category: "Drink",
      description: "Drink • Sweet & Creamy",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuD1z02UmClkYeMIwhO8XR9VBWTO-p6n_20QXhp5YgAWLe2tekQxouphAODYB3Tys61pYWtZNNjlFYrKZ_a3tjo9w2HmmwcJ9WQFXZ6biV9UjRHgjH8kEMFGihbWVRSIbLNCBqffzqo64DDeGHyVrr3FxJduIPEt6-FAJYxtLTC7ar26eqnCkMZFs0FUL7ER-DgEhmbAS9bTOrz1XyHoUhHehXceqMXhNvhTKiZGAS11t3zab7vCNAjr_n_X2s7pA4gjMMfz2Vck2fI",
      quantity: 15,
    },
    {
      name: "Butter Popcorn",
      sku: "POPCORN-006",
      category: "Snack",
      description: "Snack • Buttery",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAcMYHL6tFmhpJWTWeQ97w_WjE0dtwwUHwGrmSi0SlcSDOKhYb1AXw6AOD4bk0x58LmA3NE4azaFxXcnfnXAVA3AHX87ipLyaljFjYLaKCoAELFCphM0lV4lnf4Uiu9SpMB3TnHJkoczDZPPrlt3uAFkO1hsiwXy-3pPO_3cTwr-4dY9eZrBcWawbpv1FWqc5F4pPluYM03YSx9XvIxBYxFP9G8xnm2oQxt2SQ4JDUN30SUhVMz0e48M9OTa100eNlwRd_PMDbP6-o",
      quantity: 10,
    },
    {
      name: "Berry Quantum Crunch",
      sku: "BQC-007",
      category: "Snack",
      description: "Crunchy berry-flavored snack.",
      imageUrl: null,
      quantity: 120,
    },
    {
      name: "Liquid Fuel Tea",
      sku: "LFT-008",
      category: "Drink",
      description: "Mild sweet lab tea.",
      imageUrl: null,
      quantity: 3,
    },
    {
      name: "Mochi Lab Special",
      sku: "MLS-009",
      category: "Snack",
      description: "Special lab mochi.",
      imageUrl: null,
      quantity: 120,
    },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: { name: p.name, category: p.category, description: p.description, imageUrl: p.imageUrl ?? undefined },
      create: {
        name: p.name,
        sku: p.sku,
        category: p.category,
        description: p.description,
        imageUrl: p.imageUrl ?? undefined,
      },
    });

    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: {},
      create: {
        productId: product.id,
        quantity: p.quantity,
        lowStockThreshold: 10,
      },
    });
  }

  const p1 = await prisma.product.findUnique({ where: { sku: "COLA-001" } });
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
