import { InventoryLogType, RestockStatus } from "@prisma/client";
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

  async takeTrend(opts: { from?: Date; to?: Date; granularity?: "day" | "week" }) {
    const from = opts.from ?? daysAgo(30);
    const to = opts.to ?? new Date();
    const logs = await prisma.inventoryLog.findMany({
      where: {
        type: InventoryLogType.TAKE,
        createdAt: { gte: from, lte: to },
      },
      select: { createdAt: true, delta: true },
      orderBy: { createdAt: "asc" },
    });

    const buckets = new Map<string, number>();
    for (const log of logs) {
      const key = bucketKey(log.createdAt, opts.granularity ?? "day");
      buckets.set(key, (buckets.get(key) ?? 0) + Math.abs(log.delta));
    }

    return Array.from(buckets.entries()).map(([period, count]) => ({ period, count }));
  }

  async topProducts(opts: { limit?: number; from?: Date; to?: Date }) {
    const limit = opts.limit ?? 10;
    const where: { type: typeof InventoryLogType.TAKE; createdAt?: { gte: Date; lte: Date } } = {
      type: InventoryLogType.TAKE,
    };
    if (opts.from || opts.to) {
      where.createdAt = { gte: opts.from ?? new Date(0), lte: opts.to ?? new Date() };
    }

    const grouped = await prisma.inventoryLog.groupBy({
      by: ["productId"],
      where,
      _sum: { delta: true },
    });

    const sorted = grouped
      .map((g) => ({ productId: g.productId, takeCount: Math.abs(g._sum.delta ?? 0) }))
      .sort((a, b) => b.takeCount - a.takeCount)
      .slice(0, limit);

    const products = await prisma.product.findMany({
      where: { id: { in: sorted.map((g) => g.productId) } },
      select: { id: true, name: true, sku: true, category: true },
    });
    const map = new Map(products.map((p) => [p.id, p]));

    return sorted.map((g) => ({
      product: map.get(g.productId),
      takeCount: g.takeCount,
    }));
  }

  async restockApprovalTime() {
    const approved = await prisma.restockRequest.findMany({
      where: { status: RestockStatus.APPROVED, reviewedById: { not: null } },
      select: { createdAt: true, updatedAt: true },
    });
    if (approved.length === 0) return { averageHours: 0, sampleSize: 0 };

    const totalMs = approved.reduce((sum, r) => sum + (r.updatedAt.getTime() - r.createdAt.getTime()), 0);
    const averageHours = Math.round((totalMs / approved.length / 3600000) * 10) / 10;
    return { averageHours, sampleSize: approved.length };
  }

  async expiryReport(withinDays = 30) {
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + withinDays);

    const products = await prisma.product.findMany({
      where: { expiryDate: { lte: end } },
      include: { inventory: true },
      orderBy: { expiryDate: "asc" },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      expiryDate: p.expiryDate,
      quantity: p.inventory?.quantity ?? 0,
      expired: p.expiryDate ? p.expiryDate < now : false,
      daysLeft: p.expiryDate
        ? Math.ceil((p.expiryDate.getTime() - now.getTime()) / 86400000)
        : null,
    }));
  }
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function bucketKey(d: Date, granularity: "day" | "week") {
  if (granularity === "week") {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - x.getDay());
    return x.toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
}
