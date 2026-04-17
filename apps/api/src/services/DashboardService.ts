import { RestockStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export class DashboardService {
  async overview() {
    const [products, pendingRestock, inventories, recentRestock] = await Promise.all([
      prisma.product.count(),
      prisma.restockRequest.count({ where: { status: RestockStatus.PENDING } }),
      prisma.inventory.findMany({ include: { product: true } }),
      prisma.restockRequest.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { name: true, sku: true } },
          requestedBy: { select: { name: true } },
        },
      }),
    ]);

    const lowStock = inventories.filter((i) => i.quantity <= i.lowStockThreshold).length;

    return {
      productCount: products,
      pendingRestock,
      lowStockAlerts: lowStock,
      recentRestock,
    };
  }
}
