import { prisma } from "../lib/prisma.js";

export class NotificationService {
  listForUser(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async markRead(id: string, userId: string) {
    const n = await prisma.notification.findUnique({ where: { id } });
    if (!n) throw new Error("NOT_FOUND");
    if (n.userId !== userId) throw new Error("FORBIDDEN");
    return prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
