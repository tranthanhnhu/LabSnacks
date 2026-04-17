import { prisma } from "../lib/prisma.js";

export class HistoryService {
  async recent() {
    const rows = await prisma.inventoryLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        user: { select: { id: true, name: true } },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      delta: r.delta,
      note: r.note,
      createdAt: r.createdAt,
      product: r.product,
      user: r.user,
    }));
  }
}

