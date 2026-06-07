import { NotificationType } from "@prisma/client";

export type NotificationDraft = {
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
};

/**
 * Factory Pattern: build notification content by type, decoupled from Observer/Controller.
 */
export class NotificationFactory {
  static createLowStock(input: {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    threshold: number;
  }): NotificationDraft {
    return {
      type: NotificationType.LOW_STOCK,
      title: `Low stock alert: ${input.productName}`,
      body: `SKU ${input.sku} has ${input.quantity} units left (threshold ${input.threshold}). Consider restocking.`,
      metadata: {
        productId: input.productId,
        sku: input.sku,
        quantity: input.quantity,
        threshold: input.threshold,
      },
    };
  }

  static createRestockPending(input: {
    requestId: string;
    productName: string;
    quantity: number;
    requesterName: string;
  }): NotificationDraft {
    return {
      type: NotificationType.RESTOCK_PENDING,
      title: `Restock request: ${input.productName}`,
      body: `${input.requesterName} requested ${input.quantity} units.`,
      metadata: { requestId: input.requestId },
    };
  }

  static createRestockApproved(input: {
    requestId: string;
    productName: string;
    quantity: number;
  }): NotificationDraft {
    return {
      type: NotificationType.RESTOCK_APPROVED,
      title: `Restock approved: ${input.productName}`,
      body: `Approved ${input.quantity} units.`,
      metadata: { requestId: input.requestId },
    };
  }

  static createRestockRejected(input: {
    requestId: string;
    productName: string;
    reason?: string;
  }): NotificationDraft {
    return {
      type: NotificationType.RESTOCK_REJECTED,
      title: `Restock rejected: ${input.productName}`,
      body: input.reason?.trim() ? input.reason : "The restock request was rejected.",
      metadata: { requestId: input.requestId },
    };
  }

  static createExpirySoon(input: {
    productId: string;
    productName: string;
    sku: string;
    expiryDate: Date;
    daysLeft: number;
  }): NotificationDraft {
    return {
      type: NotificationType.EXPIRY_SOON,
      title: `Expiring soon: ${input.productName}`,
      body: `SKU ${input.sku} expires in ${input.daysLeft} day(s) (${input.expiryDate.toLocaleDateString()}).`,
      metadata: {
        productId: input.productId,
        sku: input.sku,
        expiryDate: input.expiryDate.toISOString(),
        daysLeft: input.daysLeft,
      },
    };
  }
}
