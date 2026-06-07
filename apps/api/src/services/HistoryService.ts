import { InventoryLogType, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export type HistoryFilters = {
  page?: number;
  limit?: number;
  type?: InventoryLogType;
  productId?: string;
  userId?: string;
  from?: Date;
  to?: Date;
};

function buildWhere(filters: HistoryFilters): Prisma.InventoryLogWhereInput {
  const where: Prisma.InventoryLogWhereInput = {};
  if (filters.type) where.type = filters.type;
  if (filters.productId) where.productId = filters.productId;
  if (filters.userId) where.userId = filters.userId;
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = filters.from;
    if (filters.to) where.createdAt.lte = filters.to;
  }
  return where;
}

const include = {
  product: { select: { id: true, name: true, sku: true } },
  user: { select: { id: true, name: true } },
} as const;

export class HistoryService {
  async list(filters: HistoryFilters = {}) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const skip = (page - 1) * limit;
    const where = buildWhere(filters);

    const [rows, total] = await Promise.all([
      prisma.inventoryLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include,
      }),
      prisma.inventoryLog.count({ where }),
    ]);

    return {
      items: rows.map((r) => ({
        id: r.id,
        type: r.type,
        delta: r.delta,
        note: r.note,
        createdAt: r.createdAt,
        product: r.product,
        user: r.user,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async forProduct(productId: string, filters: Omit<HistoryFilters, "productId"> = {}) {
    return this.list({ ...filters, productId });
  }

  /** @deprecated use list() */
  async recent() {
    const result = await this.list({ limit: 20 });
    return result.items;
  }
}
