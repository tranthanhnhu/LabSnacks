import jwt from "jsonwebtoken";
import type { RoleSlug } from "@prisma/client";
import { env } from "../config/env.js";

export type JwtPayload = {
  sub: string;
  email: string;
  roleSlug: RoleSlug;
};

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
