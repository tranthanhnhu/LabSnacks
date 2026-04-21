import express from "express";
import cors from "cors";
import path from "node:path";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { StockSubject } from "./observers/StockSubject.js";
import { LowStockObserver } from "./observers/LowStockObserver.js";
import { AuthService } from "./services/AuthService.js";
import { ProductService } from "./services/ProductService.js";
import { InventoryService } from "./services/InventoryService.js";
import { RestockService } from "./services/RestockService.js";
import { NotificationService } from "./services/NotificationService.js";
import { UserService } from "./services/UserService.js";
import { AnalyticsService } from "./services/AnalyticsService.js";
import { DashboardService } from "./services/DashboardService.js";
import { HistoryService } from "./services/HistoryService.js";
import { createV1Router } from "./routes/v1.js";
import { errorHandler } from "./middleware/errorHandler.js";

const stockSubject = new StockSubject();
stockSubject.register(new LowStockObserver(prisma));

const inventoryService = new InventoryService(stockSubject);
const restockService = new RestockService(inventoryService);

const deps = {
  auth: new AuthService(),
  products: new ProductService(),
  inventory: inventoryService,
  restock: restockService,
  notifications: new NotificationService(),
  users: new UserService(),
  analytics: new AnalyticsService(),
  dashboard: new DashboardService(),
  history: new HistoryService(),
};

const app = express();
app.use(
  cors({
    origin: (origin, cb) => {
      // Non-browser clients (curl/Postman) may not send Origin.
      if (!origin) return cb(null, true);

      const allowed = env.CORS_ORIGIN.split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (allowed.includes(origin)) return cb(null, true);

      // In dev, Next.js may auto-pick a different port (3001/3002/...) when 3000 is busy.
      // Allow localhost ports to reduce setup friction for newcomers.
      if (env.NODE_ENV === "development" && /^http:\/\/localhost:\d+$/.test(origin)) {
        return cb(null, true);
      }

      return cb(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.resolve("uploads")));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", createV1Router(deps));
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
