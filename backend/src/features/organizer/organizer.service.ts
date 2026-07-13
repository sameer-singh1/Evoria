import { OrganizerRepository } from "./organizer.repository";

export class OrganizerService {
  private repository = new OrganizerRepository();

  async getProfile(userId: string) {
    return this.repository.findByUserId(userId);
  }

  async apply(userId: string, role: string, organizationName: string) {
    if (role !== "ORGANIZER") throw new Error("Only organizers can apply");

    const existing = await this.repository.findByUserId(userId);
    if (existing) throw new Error("Application already submitted");

    return this.repository.create(userId, organizationName);
  }
}
