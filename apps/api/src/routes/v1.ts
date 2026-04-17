import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { z } from "zod";
import { RoleSlug } from "@prisma/client";
import type { AuthService } from "../services/AuthService.js";
import type { ProductService } from "../services/ProductService.js";
import type { InventoryService } from "../services/InventoryService.js";
import type { RestockService } from "../services/RestockService.js";
import type { NotificationService } from "../services/NotificationService.js";
import type { UserService } from "../services/UserService.js";
import type { AnalyticsService } from "../services/AnalyticsService.js";
import type { DashboardService } from "../services/DashboardService.js";
import type { HistoryService } from "../services/HistoryService.js";
import { authMiddleware, requireRoles } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function paramId(p: string | string[] | undefined): string {
  const v = Array.isArray(p) ? p[0] : p;
  if (!v) throw new Error("NOT_FOUND");
  return v;
}

export type Deps = {
  auth: AuthService;
  products: ProductService;
  inventory: InventoryService;
  restock: RestockService;
  notifications: NotificationService;
  users: UserService;
  analytics: AnalyticsService;
  dashboard: DashboardService;
  history: HistoryService;
};

export function createV1Router(deps: Deps) {
  const r = Router();

  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => {
        const dir = path.resolve("uploads");
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        cb(null, `${Date.now()}_${safe}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith("image/")) return cb(new Error("INVALID_FILE"));
      cb(null, true);
    },
  });

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  r.post(
    "/auth/login",
    asyncHandler(async (req, res) => {
      const body = loginSchema.parse(req.body);
      const result = await deps.auth.login(body.email, body.password);
      res.json(result);
    }),
  );

  r.get(
    "/auth/me",
    authMiddleware,
    asyncHandler(async (req, res) => {
      const me = await deps.auth.getMe(req.user!.id);
      res.json(me);
    }),
  );

  r.get(
    "/dashboard",
    authMiddleware,
    asyncHandler(async (_req, res) => {
      const data = await deps.dashboard.overview();
      res.json(data);
    }),
  );

  r.get(
    "/analytics/summary",
    authMiddleware,
    asyncHandler(async (_req, res) => {
      const data = await deps.analytics.summary();
      res.json(data);
    }),
  );

  r.get(
    "/analytics/restock-trend",
    authMiddleware,
    asyncHandler(async (_req, res) => {
      const data = await deps.analytics.restockTrend();
      res.json(data);
    }),
  );

  r.get(
    "/history",
    authMiddleware,
    asyncHandler(async (_req, res) => {
      const rows = await deps.history.recent();
      res.json(rows);
    }),
  );

  r.post(
    "/uploads",
    authMiddleware,
    requireRoles(RoleSlug.ADMIN, RoleSlug.MANAGER),
    upload.single("file"),
    asyncHandler(async (req, res) => {
      if (!req.file) throw new Error("INVALID_FILE");
      res.status(201).json({ url: `/uploads/${req.file.filename}` });
    }),
  );

  r.get(
    "/products",
    authMiddleware,
    asyncHandler(async (_req, res) => {
      const rows = await deps.products.list();
      res.json(rows);
    }),
  );

  const productCreateSchema = z.object({
    name: z.string().min(1),
    sku: z.string().min(1),
    category: z.string().min(1),
    description: z.string().optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
    initialQuantity: z.number().int().nonnegative(),
    lowStockThreshold: z.number().int().nonnegative(),
  });

  r.post(
    "/products",
    authMiddleware,
    requireRoles(RoleSlug.ADMIN, RoleSlug.MANAGER),
    asyncHandler(async (req, res) => {
      const body = productCreateSchema.parse(req.body);
      const row = await deps.products.create({
        ...body,
        imageUrl: body.imageUrl || undefined,
        description: body.description,
      });
      res.status(201).json(row);
    }),
  );

  r.get(
    "/products/:id",
    authMiddleware,
    asyncHandler(async (req, res) => {
      const row = await deps.products.getById(paramId(req.params.id));
      if (!row) throw new Error("NOT_FOUND");
      res.json(row);
    }),
  );

  const productUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
  });

  r.patch(
    "/products/:id",
    authMiddleware,
    requireRoles(RoleSlug.ADMIN, RoleSlug.MANAGER),
    asyncHandler(async (req, res) => {
      const body = productUpdateSchema.parse(req.body);
      const row = await deps.products.update(paramId(req.params.id), body);
      res.json(row);
    }),
  );

  r.delete(
    "/products/:id",
    authMiddleware,
    requireRoles(RoleSlug.ADMIN),
    asyncHandler(async (req, res) => {
      await deps.products.remove(paramId(req.params.id));
      res.status(204).send();
    }),
  );

  r.get(
    "/inventory",
    authMiddleware,
    asyncHandler(async (_req, res) => {
      const rows = await deps.inventory.list();
      res.json(rows);
    }),
  );

  const qtySchema = z.object({ quantity: z.number().int().nonnegative() });
  r.patch(
    "/inventory/:productId/quantity",
    authMiddleware,
    requireRoles(RoleSlug.ADMIN, RoleSlug.MANAGER),
    asyncHandler(async (req, res) => {
      const body = qtySchema.parse(req.body);
      const row = await deps.inventory.updateQuantity(paramId(req.params.productId), body.quantity);
      res.json(row);
    }),
  );

  const takeSchema = z.object({ quantity: z.number().int().positive().default(1) });
  r.post(
    "/inventory/:productId/take",
    authMiddleware,
    asyncHandler(async (req, res) => {
      const body = takeSchema.parse(req.body ?? {});
      const row = await deps.inventory.take(paramId(req.params.productId), req.user!.id, body.quantity);
      res.json(row);
    }),
  );

  const thrSchema = z.object({ lowStockThreshold: z.number().int().nonnegative() });
  r.patch(
    "/inventory/:productId/threshold",
    authMiddleware,
    requireRoles(RoleSlug.ADMIN, RoleSlug.MANAGER),
    asyncHandler(async (req, res) => {
      const body = thrSchema.parse(req.body);
      const row = await deps.inventory.updateThreshold(paramId(req.params.productId), body.lowStockThreshold);
      res.json(row);
    }),
  );

  r.get(
    "/restock",
    authMiddleware,
    asyncHandler(async (_req, res) => {
      const rows = await deps.restock.list();
      res.json(rows);
    }),
  );

  const restockCreateSchema = z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
  });

  r.post(
    "/restock",
    authMiddleware,
    asyncHandler(async (req, res) => {
      const body = restockCreateSchema.parse(req.body);
      const row = await deps.restock.create(req.user!.id, body.productId, body.quantity);
      res.status(201).json(row);
    }),
  );

  const rejectSchema = z.object({ reason: z.string().optional() });

  r.post(
    "/restock/:id/approve",
    authMiddleware,
    requireRoles(RoleSlug.ADMIN, RoleSlug.MANAGER),
    asyncHandler(async (req, res) => {
      const row = await deps.restock.approve(paramId(req.params.id), req.user!.id);
      res.json(row);
    }),
  );

  r.post(
    "/restock/:id/reject",
    authMiddleware,
    requireRoles(RoleSlug.ADMIN, RoleSlug.MANAGER),
    asyncHandler(async (req, res) => {
      const body = rejectSchema.parse(req.body);
      const row = await deps.restock.reject(paramId(req.params.id), req.user!.id, body.reason);
      res.json(row);
    }),
  );

  r.get(
    "/notifications",
    authMiddleware,
    asyncHandler(async (req, res) => {
      const rows = await deps.notifications.listForUser(req.user!.id);
      res.json(rows);
    }),
  );

  r.patch(
    "/notifications/:id/read",
    authMiddleware,
    asyncHandler(async (req, res) => {
      const row = await deps.notifications.markRead(paramId(req.params.id), req.user!.id);
      res.json(row);
    }),
  );

  r.post(
    "/notifications/read-all",
    authMiddleware,
    asyncHandler(async (req, res) => {
      await deps.notifications.markAllRead(req.user!.id);
      res.json({ ok: true });
    }),
  );

  r.get(
    "/roles",
    authMiddleware,
    requireRoles(RoleSlug.ADMIN),
    asyncHandler(async (_req, res) => {
      const rows = await deps.users.listRoles();
      res.json(rows);
    }),
  );

  r.get(
    "/users",
    authMiddleware,
    requireRoles(RoleSlug.ADMIN),
    asyncHandler(async (_req, res) => {
      const rows = await deps.users.list();
      res.json(rows);
    }),
  );

  const userCreateSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    roleId: z.string().min(1),
  });

  r.post(
    "/users",
    authMiddleware,
    requireRoles(RoleSlug.ADMIN),
    asyncHandler(async (req, res) => {
      const body = userCreateSchema.parse(req.body);
      const row = await deps.users.create(body);
      res.status(201).json(row);
    }),
  );

  const userPatchSchema = z.object({
    email: z.string().email().optional(),
    name: z.string().min(1).optional(),
    roleId: z.string().min(1).optional(),
    password: z.string().min(6).optional(),
  });

  r.patch(
    "/users/:id",
    authMiddleware,
    requireRoles(RoleSlug.ADMIN),
    asyncHandler(async (req, res) => {
      const body = userPatchSchema.parse(req.body);
      const row = await deps.users.update(paramId(req.params.id), body);
      res.json(row);
    }),
  );

  r.delete(
    "/users/:id",
    authMiddleware,
    requireRoles(RoleSlug.ADMIN),
    asyncHandler(async (req, res) => {
      const uid = paramId(req.params.id);
      if (uid === req.user!.id) throw new Error("FORBIDDEN");
      await deps.users.remove(uid);
      res.status(204).send();
    }),
  );

  return r;
}
