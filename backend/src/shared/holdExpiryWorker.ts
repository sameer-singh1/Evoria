import { prisma } from "./database/connection";

const INTERVAL_MS = 60 * 1000; // Run every 60 seconds

async function releaseExpiredHolds() {
  const now = new Date();

  // Find all HELD seats that have expired
  const expiredSeats = await prisma.seat.findMany({
    where: {
      status: "HELD",
      holdExpiresAt: { lt: now },
    },
    select: { id: true, bookingId: true },
  });

  if (expiredSeats.length === 0) return;

  console.log(`[HoldExpiryWorker] Releasing ${expiredSeats.length} expired seat hold(s)`);

  // Release all expired seats atomically
  await prisma.seat.updateMany({
    where: {
      status: "HELD",
      holdExpiresAt: { lt: now },
    },
    data: {
      status: "AVAILABLE",
      heldByUserId: null,
      bookingId: null,
      holdExpiresAt: null,
    },
  });

  // Cancel associated PENDING bookings
  const bookingIds = [...new Set(expiredSeats.map((s) => s.bookingId).filter(Boolean))] as string[];

  if (bookingIds.length > 0) {
    await prisma.booking.updateMany({
      where: {
        id: { in: bookingIds },
        status: "PENDING",
      },
      data: { status: "CANCELLED" },
    });

    console.log(`[HoldExpiryWorker] Cancelled ${bookingIds.length} expired booking(s)`);
  }
}

export function startHoldExpiryWorker() {
  console.log("[HoldExpiryWorker] Started — checking every 60 seconds for expired seat holds");
  setInterval(async () => {
    try {
      await releaseExpiredHolds();
    } catch (error) {
      console.error("[HoldExpiryWorker] Error releasing expired holds:", error);
    }
  }, INTERVAL_MS);
}