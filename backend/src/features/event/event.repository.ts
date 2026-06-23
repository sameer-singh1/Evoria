import { prisma } from "../../shared/database/connection";

export class EventRepository {
  async findPublished() {
    return prisma.event.findMany({ where: { published: true } });
  }
}
