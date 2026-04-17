import type { RoleSlug } from "@prisma/client";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  roleId: string;
  roleSlug: RoleSlug;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
