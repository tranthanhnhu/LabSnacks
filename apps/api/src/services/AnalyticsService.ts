import { RestockStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export class AnalyticsService {
  async summary() {
    const [productCount, invAgg, pendingRestock, byCategory, inventories] = await Promise.all([
      prisma.product.count(),
      prisma.inventory.aggregate({ _sum: { quantity: true } }),
      prisma.restockRequest.count({ where: { status: RestockStatus.PENDING } }),
      prisma.product.groupBy({
        by: ["category"],
        _count: { _all: true },
      }),
      prisma.inventory.findMany({ include: { product: true } }),
    ]);

    const lowStockAlerts = inventories.filter((i) => i.quantity <= i.lowStockThreshold).length;

    return {
      productCount,
      totalUnits: invAgg._sum.quantity ?? 0,
      pendingRestock,
      lowStockAlerts,
      snacksByCategory: byCategory.map((c) => ({
        category: c.category,
        count: c._count._all,
      })),
    };
  }

  async restockTrend() {
    const rows = await prisma.restockRequest.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    return rows.map((r) => ({ status: r.status, count: r._count._all }));
  }
}
