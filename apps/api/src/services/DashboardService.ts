import { InventoryLogType, RestockStatus, RoleSlug } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { TakeQuotaService } from "./TakeQuotaService.js";

export class DashboardService {
  private readonly takeQuota = new TakeQuotaService();

  async overview(userId: string, role: RoleSlug) {
    if (role === RoleSlug.STAFF) {
      return this.staffOverview(userId);
    }
    if (role === RoleSlug.MANAGER) {
      return this.managerOverview(userId);
    }
    return this.adminOverview(userId);
  }

  private async staffOverview(userId: string) {
    const [myRequests, quota, topProducts] = await Promise.all([
      prisma.restockRequest.findMany({
        where: { requestedById: userId },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { name: true, sku: true } },
          requestedBy: { select: { name: true } },
        },
      }),
      this.takeQuota.getQuota(userId),
      prisma.inventoryLog.groupBy({
        by: ["productId"],
        where: { type: InventoryLogType.TAKE },
        _sum: { delta: true },
      }),
    ]);

    const sorted = topProducts
      .map((t) => ({ productId: t.productId, takeCount: Math.abs(t._sum.delta ?? 0) }))
      .sort((a, b) => b.takeCount - a.takeCount)
      .slice(0, 3);

    const productIds = sorted.map((t) => t.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    return {
      role: "STAFF" as const,
      myRequests,
      takeQuota: quota,
      popularSnacks: sorted.map((t) => ({
        product: productMap.get(t.productId),
        takeCount: t.takeCount,
      })),
    };
  }

  private async managerOverview(userId: string) {
    const base = await this.baseStats();
    const pendingQueue = await prisma.restockRequest.findMany({
      where: { status: RestockStatus.PENDING },
      take: 5,
      orderBy: { createdAt: "asc" },
      include: {
        product: { select: { name: true, sku: true } },
        requestedBy: { select: { name: true } },
      },
    });
    return { role: "MANAGER" as const, ...base, pendingQueue, userId };
  }

  private async adminOverview(userId: string) {
    const base = await this.baseStats();
    const userCount = await prisma.user.count();
    return { role: "ADMIN" as const, ...base, userCount, userId };
  }

  private async baseStats() {
    const [productCount, pendingRestock, inventories, recentRestock] = await Promise.all([
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

    const lowStockAlerts = inventories.filter((i) => i.quantity <= i.lowStockThreshold).length;

    return {
      productCount,
      pendingRestock,
      lowStockAlerts,
      recentRestock,
    };
  }
}
