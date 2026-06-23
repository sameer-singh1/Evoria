import { prisma } from "../../shared/database/connection";
import { Role } from "../../generated/prisma/client";

export class AuthRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(data: { email: string; passwordHash: string; name: string; role: Role }) {
    return prisma.user.create({ data });
  }
}
