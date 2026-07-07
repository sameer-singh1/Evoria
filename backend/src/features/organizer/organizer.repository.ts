import { prisma } from "../../shared/database/connection";

export class OrganizerRepository {
  async findByUserId(userId: string) {
    return prisma.organizerProfile.findUnique({ where: { userId } });
  }

  async create(userId: string, organizationName: string) {
    return prisma.organizerProfile.create({ data: { userId, organizationName } });
  }
}
