require("dotenv/config");
const bcrypt = require("bcrypt");
const { prisma } = require("../dist/shared/database/connection");

async function createEventWithShow({ title, category, description, venue, startsAt, seatPrices, organizerId }) {
  const event = await prisma.event.create({
    data: {
      organizerId,
      title,
      category,
      description,
      published: true,
    },
  });

  if (venue && startsAt) {
    const show = await prisma.show.create({
      data: {
        eventId: event.id,
        venueId: venue.id,
        startsAt,
      },
    });

    for (let i = 0; i < seatPrices.length; i++) {
      await prisma.seat.create({
        data: {
          showId: show.id,
          label: `A${i + 1}`,
          price: seatPrices[i],
          status: "AVAILABLE",
        },
      });
    }
  }

  return event;
}

async function main() {
  const passwordHash = await bcrypt.hash("Test1234", 10);

  const organizer = await prisma.user.create({
    data: {
      email: "seed-organizer@evoria.test",
      passwordHash,
      name: "Seed Organizer",
      role: "ORGANIZER",
      organizerProfile: {
        create: {
          approvalStatus: "APPROVED",
          organizationName: "Evoria Seed Productions",
        },
      },
    },
  });

  const venueNY = await prisma.venue.create({
    data: { name: "Madison Square Garden", city: "New York, NY", address: "4 Pennsylvania Plaza" },
  });
  const venueLA = await prisma.venue.create({
    data: { name: "The Forum", city: "Los Angeles, CA", address: "3900 W Manchester Blvd" },
  });
  const venueChi = await prisma.venue.create({
    data: { name: "Chicago Theatre", city: "Chicago, IL", address: "175 N State St" },
  });

  await createEventWithShow({
    organizerId: organizer.id,
    title: "Neon Nights Live",
    category: "CONCERT",
    description: "An electric night of music under the city lights.",
    venue: venueNY,
    startsAt: new Date("2026-08-14T19:00:00.000Z"),
    seatPrices: [59, 89, 129],
  });

  await createEventWithShow({
    organizerId: organizer.id,
    title: "Summer Beats Fest",
    category: "FESTIVAL",
    description: "A weekend-long celebration of music and community.",
    venue: venueLA,
    startsAt: new Date("2026-09-02T18:00:00.000Z"),
    seatPrices: [89, 149],
  });

  await createEventWithShow({
    organizerId: organizer.id,
    title: "Stand-Up Showcase",
    category: "COMEDY",
    description: "An evening of stand-up from rising comedians.",
    venue: venueChi,
    startsAt: new Date("2026-07-22T20:00:00.000Z"),
    seatPrices: [35, 45],
  });

  await createEventWithShow({
    organizerId: organizer.id,
    title: "City Derby Finals",
    category: "SPORT",
    description: "The biggest local rivalry match of the season.",
    venue: venueNY,
    startsAt: new Date("2026-10-05T15:00:00.000Z"),
    seatPrices: [75, 120, 200],
  });

  await createEventWithShow({
    organizerId: organizer.id,
    title: "Code & Canvas Workshop",
    category: "WORKSHOP",
    description: "A hands-on workshop blending generative art and code.",
    venue: venueChi,
    startsAt: new Date("2026-08-01T10:00:00.000Z"),
    seatPrices: [25],
  });

  // No venue/startsAt/seats -- demonstrates the "Dates TBA" (no upcoming show) state
  await createEventWithShow({
    organizerId: organizer.id,
    title: "Quantum Horizons",
    category: "MOVIE",
    description: "A sci-fi premiere -- dates to be announced.",
    venue: null,
    startsAt: null,
    seatPrices: [],
  });

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
