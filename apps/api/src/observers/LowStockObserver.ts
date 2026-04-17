import { RoleSlug } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { NotificationFactory } from "../factories/NotificationFactory.js";
import type { StockChangeEvent, StockObserver } from "./types.js";

/**
 * Observer Pattern: when stock crosses from above threshold to at/below threshold, create notifications (anti-spam).
 */
export class LowStockObserver implements StockObserver {
  constructor(private readonly db: PrismaClient) {}

  async onStockChange(event: StockChangeEvent): Promise<void> {
    const wasOk = event.oldQuantity > event.lowStockThreshold;
    const isLow = event.newQuantity <= event.lowStockThreshold;
    if (!(wasOk && isLow)) return;

    const draft = NotificationFactory.createLowStock({
      productId: event.productId,
      productName: event.productName,
      sku: event.sku,
      quantity: event.newQuantity,
      threshold: event.lowStockThreshold,
    });

    const managers = await this.db.user.findMany({
      where: { role: { slug: { in: [RoleSlug.ADMIN, RoleSlug.MANAGER] } } },
      select: { id: true },
    });

    await this.db.$transaction([
      this.db.inventory.update({
        where: { productId: event.productId },
        data: { lastLowStockNotifiedAt: new Date() },
      }),
      ...managers.map((u) =>
        this.db.notification.create({
          data: {
            userId: u.id,
            type: draft.type,
            title: draft.title,
            body: draft.body,
            metadata: draft.metadata as object,
          },
        }),
      ),
    ]);
  }
}
