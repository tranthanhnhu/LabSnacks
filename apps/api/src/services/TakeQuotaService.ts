import { InventoryLogType, RoleSlug } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export class TakeQuotaService {
  async getQuota(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { role: { include: { takeLimit: true } } },
    });

    const limit = user.role.takeLimit;
    const maxPerTake = limit?.maxPerTake ?? 999;
    const maxPerDay = limit?.maxPerDay ?? 999;

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const takenToday = await prisma.inventoryLog.aggregate({
      where: {
        userId,
        type: InventoryLogType.TAKE,
        createdAt: { gte: todayStart, lte: todayEnd },
      },
      _sum: { delta: true },
    });

    const usedToday = Math.abs(takenToday._sum.delta ?? 0);
    const remainingToday = Math.max(0, maxPerDay - usedToday);

    return {
      maxPerTake,
      maxPerDay,
      usedToday,
      remainingToday,
      role: user.role.slug,
    };
  }

  async assertCanTake(userId: string, quantity: number) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { role: { include: { takeLimit: true } } },
    });

    if (user.role.slug === RoleSlug.ADMIN || user.role.slug === RoleSlug.MANAGER) {
      return;
    }

    const quota = await this.getQuota(userId);

    if (quantity > quota.maxPerTake) {
      throw new Error("TAKE_LIMIT_EXCEEDED");
    }
    if (quantity > quota.remainingToday) {
      throw new Error("TAKE_LIMIT_EXCEEDED");
    }
  }
}
