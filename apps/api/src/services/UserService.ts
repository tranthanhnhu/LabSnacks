import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../utils/password.js";

export class UserService {
  list() {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        role: true,
      },
    });
  }

  async create(input: { email: string; password: string; name: string; roleId: string }) {
    return prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        roleId: input.roleId,
        passwordHash: await hashPassword(input.password),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        role: true,
      },
    });
  }

  async update(
    id: string,
    data: Partial<{ name: string; email: string; roleId: string; password: string }>,
  ) {
    const passwordHash = data.password ? await hashPassword(data.password) : undefined;
    return prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.roleId !== undefined ? { roleId: data.roleId } : {}),
        ...(passwordHash ? { passwordHash } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        role: true,
      },
    });
  }

  async remove(id: string) {
    await prisma.user.delete({ where: { id } });
  }

  listRoles() {
    return prisma.role.findMany({ orderBy: { slug: "asc" } });
  }
}
