import { prisma } from "../../shared/database/connection";

export class VenueRepository {
  async findAll() {
    return prisma.venue.findMany({ orderBy: { name: "asc" } });
  }

  async create(data: { name: string; city: string; address: string }) {
    return prisma.venue.create({ data });
  }
}
