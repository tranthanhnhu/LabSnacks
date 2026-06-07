import { InventoryLogType, ProductUnit } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export class ProductService {
  list() {
    return prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { inventory: true },
    });
  }

  getById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: { inventory: true },
    });
  }

  async create(input: {
    name: string;
    sku: string;
    category: string;
    description?: string | null;
    imageUrl?: string | null;
    initialQuantity: number;
    lowStockThreshold: number;
    unit?: ProductUnit;
    unitLabel?: string | null;
    expiryDate?: Date | null;
  }) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: input.name,
          sku: input.sku,
          category: input.category,
          description: input.description ?? undefined,
          imageUrl: input.imageUrl ?? undefined,
          unit: input.unit ?? ProductUnit.PIECE,
          unitLabel: input.unitLabel ?? undefined,
          expiryDate: input.expiryDate ?? undefined,
        },
      });
      await tx.inventory.create({
        data: {
          productId: product.id,
          quantity: input.initialQuantity,
          lowStockThreshold: input.lowStockThreshold,
        },
      });
      await tx.inventoryLog.create({
        data: {
          type: InventoryLogType.CREATE,
          productId: product.id,
          delta: input.initialQuantity,
          note: "Product created",
        },
      });
      return tx.product.findUniqueOrThrow({
        where: { id: product.id },
        include: { inventory: true },
      });
    });
  }

  update(
    id: string,
    data: Partial<{
      name: string;
      category: string;
      description: string | null;
      imageUrl: string | null;
      unit: ProductUnit;
      unitLabel: string | null;
      expiryDate: Date | null;
    }>,
  ) {
    return prisma.product.update({
      where: { id },
      data,
      include: { inventory: true },
    });
  }

  async remove(id: string) {
    await prisma.product.delete({ where: { id } });
  }
}
