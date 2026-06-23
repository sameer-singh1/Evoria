import { EventRepository } from "./event.repository";

export class EventService {
  private repository = new EventRepository();

  async listPublishedEvents() {
    return this.repository.findPublished();
  }
}
