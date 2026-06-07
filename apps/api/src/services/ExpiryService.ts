import { RoleSlug } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { NotificationFactory } from "../factories/NotificationFactory.js";

const EXPIRY_WINDOW_DAYS = 7;

export class ExpiryService {
  /** Scan products expiring within window and notify Admin/Manager once per product per day. */
  async checkAndNotify() {
    const now = new Date();
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + EXPIRY_WINDOW_DAYS);

    const products = await prisma.product.findMany({
      where: {
        expiryDate: { lte: windowEnd },
        OR: [{ lastExpiryNotifiedAt: null }, { lastExpiryNotifiedAt: { lt: startOfDay(now) } }],
      },
    });

    if (products.length === 0) return;

    const managers = await prisma.user.findMany({
      where: { role: { slug: { in: [RoleSlug.ADMIN, RoleSlug.MANAGER] } } },
      select: { id: true },
    });

    for (const product of products) {
      if (!product.expiryDate) continue;
      const daysLeft = Math.ceil((product.expiryDate.getTime() - now.getTime()) / (86400000));
      const draft = NotificationFactory.createExpirySoon({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        expiryDate: product.expiryDate,
        daysLeft,
      });

      await prisma.$transaction([
        prisma.product.update({
          where: { id: product.id },
          data: { lastExpiryNotifiedAt: now },
        }),
        ...managers.map((u) =>
          prisma.notification.create({
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
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
