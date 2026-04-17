import { RoleSlug } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../utils/jwt.js";
import { verifyPassword } from "../utils/password.js";

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw new Error("INVALID_CREDENTIALS");

    const token = signToken({
      sub: user.id,
      email: user.email,
      roleSlug: user.role.slug,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: { id: user.role.id, slug: user.role.slug, name: user.role.name },
      },
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) throw new Error("NOT_FOUND");
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: { id: user.role.id, slug: user.role.slug, name: user.role.name },
    };
  }

  static assertRole(slug: RoleSlug, allowed: RoleSlug[]) {
    if (!allowed.includes(slug)) throw new Error("FORBIDDEN");
  }
}
