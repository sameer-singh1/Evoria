import { prisma } from "../../shared/database/connection";
import { Category } from "../../generated/prisma/client";

export class EventRepository {
  async findPublished() {
    return prisma.event.findMany({ where: { published: true } });
  }

  async create(data: { organizerId: string; title: string; category: Category; description?: string; mediaRef?: string }) {
    return prisma.event.create({ data });
  }

  async findById(id: string) {
    return prisma.event.findUnique({ where: { id } });
  }
}
