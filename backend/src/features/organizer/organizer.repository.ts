import { prisma } from "../../shared/database/connection";

export class OrganizerRepository {
  async findByUserId(userId: string) {
    return prisma.organizerProfile.findUnique({ where: { userId } });
  }
}
