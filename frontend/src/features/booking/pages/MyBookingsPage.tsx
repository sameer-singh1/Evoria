import { Link } from "react-router-dom";
import { useMyBookings } from "../hooks/useMyBookings";
import { UserMenu } from "../../../shared/components/UserMenu";

const formatShowDateTime = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
  " · " +
  new Date(isoDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const statusStyles: Record<string, string> = {
  CONFIRMED: "bg-brand/10 text-brand",
  PENDING: "bg-gray-100 text-gray-500",
  CANCELLED: "bg-red-50 text-red-500",
};

const statusLabels: Record<string, string> = {
  CONFIRMED: "Confirmed",
  PENDING: "Pending payment",
  CANCELLED: "Cancelled",
};

export function MyBookingsPage() {
  const bookingsQuery = useMyBookings();
  const bookings = bookingsQuery.data?.data ?? [];

  return (
    <div className="bg-white text-ink antialiased">
      {/* NAVBAR */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="font-display text-xl font-bold tracking-tight text-ink">Evoria<span className="text-brand">.</span></span>
          </Link>

          <div className="flex items-center gap-3">
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">My bookings</h1>
        <p className="mt-1.5 text-[15px] text-gray-500">Every ticket you've booked, past and upcoming.</p>

        {bookingsQuery.isLoading ? (
          <p className="mt-6 text-sm text-gray-500">Loading your bookings...</p>
        ) : bookings.length === 0 ? (
          <div className="mt-6 rounded-lg border border-gray-200 p-6 text-center">
            <p className="text-[15px] text-gray-500">You haven't booked any events yet.</p>
            <Link
              to="/"
              className="glow mt-4 inline-block rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              Browse events
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-2.5">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                to={`/bookings/${booking.id}`}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 transition hover:shadow-lg hover:shadow-gray-200/60 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-display text-lg font-bold tracking-tight text-ink">{booking.eventTitle}</h2>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[booking.status]}`}>
                      {statusLabels[booking.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatShowDateTime(booking.showStartsAt)} · {booking.venueName}, {booking.venueCity}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {booking.seatCount} {booking.seatCount === 1 ? "seat" : "seats"} · ${booking.totalPrice}
                  </p>
                </div>

                <span className="shrink-0 text-sm font-semibold text-brand">View ticket &rarr;</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
