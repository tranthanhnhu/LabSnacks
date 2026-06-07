import { InventoryLogType, ProductUnit } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import type { StockSubject } from "../observers/StockSubject.js";
import type { TakeQuotaService } from "./TakeQuotaService.js";

export class InventoryService {
  constructor(
    private readonly stockSubject: StockSubject,
    private readonly takeQuota: TakeQuotaService,
  ) {}

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
    const updated = await prisma.$transaction(async (tx) => {
      const invUpdated = await tx.inventory.update({
        where: { productId },
        data: { quantity },
      });
      await tx.inventoryLog.create({
        data: {
          type: InventoryLogType.ADJUST,
          productId,
          delta: quantity - oldQuantity,
          note: "Quantity adjusted",
        },
      });
      return invUpdated;
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
    const updated = await prisma.$transaction(async (tx) => {
      const invUpdated = await tx.inventory.update({
        where: { productId },
        data: { lowStockThreshold },
      });
      await tx.inventoryLog.create({
        data: {
          type: InventoryLogType.ADJUST,
          productId,
          delta: 0,
          note: `Threshold set to ${lowStockThreshold}`,
        },
      });
      return invUpdated;
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

  async adjustQuantity(productId: string, delta: number) {
    const inv = await prisma.inventory.findUnique({
      where: { productId },
      include: { product: true },
    });
    if (!inv) throw new Error("NOT_FOUND");

    const oldQuantity = inv.quantity;
    const newQuantity = oldQuantity + delta;
    if (newQuantity < 0) throw new Error("INVALID_QUANTITY");

    const updated = await prisma.$transaction(async (tx) => {
      const invUpdated = await tx.inventory.update({
        where: { productId },
        data: { quantity: newQuantity },
      });
      await tx.inventoryLog.create({
        data: {
          type: InventoryLogType.RESTOCK,
          productId,
          delta,
          note: delta >= 0 ? "Restocked" : "Stock decreased",
        },
      });
      return invUpdated;
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

  async take(productId: string, userId: string, quantity = 1) {
    if (quantity <= 0) throw new Error("INVALID_QUANTITY");

    await this.takeQuota.assertCanTake(userId, quantity);

    const inv = await prisma.inventory.findUnique({
      where: { productId },
      include: { product: true },
    });
    if (!inv) throw new Error("NOT_FOUND");

    const oldQuantity = inv.quantity;
    const newQuantity = oldQuantity - quantity;
    if (newQuantity < 0) throw new Error("INVALID_QUANTITY");

    const updated = await prisma.$transaction(async (tx) => {
      const invUpdated = await tx.inventory.update({
        where: { productId },
        data: { quantity: newQuantity },
      });
      await tx.inventoryLog.create({
        data: {
          type: InventoryLogType.TAKE,
          productId,
          userId,
          delta: -quantity,
          note: "Item taken",
        },
      });
      return invUpdated;
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
