import type { NextFunction, Request, Response } from "express";
import { RoleSlug } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { verifyToken } from "../utils/jwt.js";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });
    if (!user) return res.status(401).json({ error: "UNAUTHORIZED" });
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
      roleSlug: user.role.slug,
    };
    return next();
  } catch {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }
}

export function requireRoles(...allowed: RoleSlug[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "UNAUTHORIZED" });
    if (!allowed.includes(req.user.roleSlug)) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }
    return next();
  };
}
