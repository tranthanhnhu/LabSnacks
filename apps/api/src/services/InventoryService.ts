import { prisma } from "../lib/prisma.js";
import type { StockSubject } from "../observers/StockSubject.js";

export class InventoryService {
  constructor(private readonly stockSubject: StockSubject) {}

  list() {
    return prisma.inventory.findMany({
      include: { product: true },
      orderBy: { product: { name: "asc" } },
    });
  }

  async updateQuantity(productId: string, quantity: number) {
    const inv = await prisma.inventory.findUnique({
      where: { productId },
      include: { product: true },
    });
    if (!inv) throw new Error("NOT_FOUND");

    const oldQuantity = inv.quantity;
    const updated = await prisma.inventory.update({
      where: { productId },
      data: { quantity },
    });

    await this.stockSubject.notify({
      productId,
      productName: inv.product.name,
      sku: inv.product.sku,
      oldQuantity,
      newQuantity: updated.quantity,
      lowStockThreshold: inv.lowStockThreshold,
    });

    return prisma.inventory.findUniqueOrThrow({
      where: { productId },
      include: { product: true },
    });
  }

  async updateThreshold(productId: string, lowStockThreshold: number) {
    const inv = await prisma.inventory.findUnique({
      where: { productId },
      include: { product: true },
    });
    if (!inv) throw new Error("NOT_FOUND");

    const oldQuantity = inv.quantity;
    const updated = await prisma.inventory.update({
      where: { productId },
      data: { lowStockThreshold },
    });

    await this.stockSubject.notify({
      productId,
      productName: inv.product.name,
      sku: inv.product.sku,
      oldQuantity,
      newQuantity: oldQuantity,
      lowStockThreshold: updated.lowStockThreshold,
    });

    return prisma.inventory.findUniqueOrThrow({
      where: { productId },
      include: { product: true },
    });
  }

  /** Used when a restock is approved: add quantity and emit event (Observer handles low-stock). */
  async adjustQuantity(productId: string, delta: number) {
    const inv = await prisma.inventory.findUnique({
      where: { productId },
      include: { product: true },
    });
    if (!inv) throw new Error("NOT_FOUND");

    const oldQuantity = inv.quantity;
    const newQuantity = oldQuantity + delta;
    if (newQuantity < 0) throw new Error("INVALID_QUANTITY");

    const updated = await prisma.inventory.update({
      where: { productId },
      data: { quantity: newQuantity },
    });

    await this.stockSubject.notify({
      productId,
      productName: inv.product.name,
      sku: inv.product.sku,
      oldQuantity,
      newQuantity: updated.quantity,
      lowStockThreshold: inv.lowStockThreshold,
    });

    return prisma.inventory.findUniqueOrThrow({
      where: { productId },
      include: { product: true },
    });
  }
}
