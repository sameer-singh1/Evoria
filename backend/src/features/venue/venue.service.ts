import { VenueRepository } from "./venue.repository";

export class VenueService {
  private repository = new VenueRepository();

  async listVenues() {
    return this.repository.findAll();
  }

  async createVenue(role: string, name: string, city: string, address: string) {
    if (role !== "ORGANIZER") {
      throw new Error("Only organizers can create venues");
    }

    return this.repository.create({ name, city, address });
  }
}
