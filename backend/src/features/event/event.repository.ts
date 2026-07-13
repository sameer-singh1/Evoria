import { prisma } from "../../shared/database/connection";
import { Category } from "../../generated/prisma/client";

export class EventRepository {
  async findPublished() {
    return prisma.event.findMany({
      where: { published: true },
      include: {
        shows: {
          where: { startsAt: { gte: new Date() } },
          orderBy: { startsAt: "asc" },
          take: 1,
          include: {
            venue: true,
            seats: {
              where: { status: "AVAILABLE" },
              orderBy: { price: "asc" },
              take: 1,
            },
          },
        },
      },
    });
  }

  async create(data: { organizerId: string; title: string; category: Category; description?: string; mediaRef?: string }) {
    return prisma.event.create({ data });
  }

  async findById(id: string) {
    return prisma.event.findUnique({ where: { id } });
  }

  async findByIdWithShowCount(id: string) {
    return prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { shows: true } } },
    });
  }

  async publish(id: string) {
    return prisma.event.update({ where: { id }, data: { published: true } });
  }

  async findPublishedById(id: string) {
    return prisma.event.findFirst({ where: { id, published: true } });
  }

  async findByOrganizerId(organizerId: string) {
    return prisma.event.findMany({
      where: { organizerId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { shows: true } } },
    });
  }
}
