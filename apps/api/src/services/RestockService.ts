import { RoleSlug, RestockStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { NotificationFactory } from "../factories/NotificationFactory.js";
import type { InventoryService } from "./InventoryService.js";

export class RestockService {
  constructor(private readonly inventoryService: InventoryService) {}

  list() {
    return prisma.restockRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        product: true,
        requestedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async create(requestedById: string, productId: string, quantity: number) {
    const req = await prisma.restockRequest.create({
      data: {
        requestedById,
        productId,
        quantity,
        status: RestockStatus.PENDING,
      },
      include: {
        product: true,
        requestedBy: { select: { id: true, name: true, email: true } },
      },
    });

    const draft = NotificationFactory.createRestockPending({
      requestId: req.id,
      productName: req.product.name,
      quantity: req.quantity,
      requesterName: req.requestedBy.name,
    });

    const managers = await prisma.user.findMany({
      where: { role: { slug: { in: [RoleSlug.ADMIN, RoleSlug.MANAGER] } } },
      select: { id: true },
    });

    await prisma.$transaction(
      managers.map((u) =>
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
    );

    return req;
  }

  async approve(requestId: string, reviewerId: string) {
    const row = await prisma.restockRequest.findUnique({
      where: { id: requestId },
      include: { product: true, requestedBy: true },
    });
    if (!row) throw new Error("NOT_FOUND");
    if (row.status !== RestockStatus.PENDING) throw new Error("INVALID_STATE");

    await prisma.restockRequest.update({
      where: { id: requestId },
      data: { status: RestockStatus.APPROVED, reviewedById: reviewerId },
    });

    await this.inventoryService.adjustQuantity(row.productId, row.quantity);

    const draft = NotificationFactory.createRestockApproved({
      requestId: row.id,
      productName: row.product.name,
      quantity: row.quantity,
    });

    await prisma.notification.create({
      data: {
        userId: row.requestedById,
        type: draft.type,
        title: draft.title,
        body: draft.body,
        metadata: draft.metadata as object,
      },
    });

    return prisma.restockRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: {
        product: true,
        requestedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async reject(requestId: string, reviewerId: string, reason?: string) {
    const row = await prisma.restockRequest.findUnique({
      where: { id: requestId },
      include: { product: true, requestedBy: true },
    });
    if (!row) throw new Error("NOT_FOUND");
    if (row.status !== RestockStatus.PENDING) throw new Error("INVALID_STATE");

    await prisma.restockRequest.update({
      where: { id: requestId },
      data: { status: RestockStatus.REJECTED, reviewedById: reviewerId },
    });

    const draft = NotificationFactory.createRestockRejected({
      requestId: row.id,
      productName: row.product.name,
      reason,
    });

    await prisma.notification.create({
      data: {
        userId: row.requestedById,
        type: draft.type,
        title: draft.title,
        body: draft.body,
        metadata: draft.metadata as object,
      },
    });

    return prisma.restockRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: {
        product: true,
        requestedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
