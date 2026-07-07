import { Link, useParams } from "react-router-dom";
import { useBooking } from "../hooks/useBooking";

const formatShowDateTime = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) +
  " · " +
  new Date(isoDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const bookingQuery = useBooking(id!);

  if (bookingQuery.isLoading) {
    return <p className="p-10 text-center text-gray-500">Loading...</p>;
  }

  if (bookingQuery.isError || !bookingQuery.data) {
    return <p className="p-10 text-center text-gray-500">Booking not found.</p>;
  }

  const booking = bookingQuery.data;
  const seatLabels = booking.seats.map((seat) => seat.label).join(", ");

  return (
    <div className="bg-white text-ink antialiased">
      {/* NAVBAR */}
      <header className="border-b border-gray-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-600 shadow-lg shadow-brand/40">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
                <path d="M4 9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 1.5 1.5 0 0 0 0 3 1.5 1.5 0 0 0 0 3 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 1.5 1.5 0 0 0 0-3 1.5 1.5 0 0 0 0-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M12 9.1c.36 1.6 1.09 2.33 2.7 2.7-1.61.37-2.34 1.1-2.7 2.7-.36-1.6-1.09-2.33-2.7-2.7 1.61-.37 2.34-1.1 2.7-2.7Z" fill="currentColor" />
              </svg>
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-ink">Evoria<span className="text-brand">.</span></span>
          </div>
          <Link to="/" className="text-sm font-medium text-gray-500 transition hover:text-ink">Browse more events</Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-16 text-center">
        {/* status icon */}
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand/10">
          <span className="glow flex h-14 w-14 items-center justify-center rounded-full bg-brand">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-white">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </span>

        <h1 className="font-display mt-6 text-3xl font-extrabold tracking-tight text-ink">
          {booking.status === "CONFIRMED" ? "Booking confirmed!" : "Booking received"}
        </h1>
        <p className="mt-2 max-w-md text-[15px] text-gray-500">
          {booking.status === "CONFIRMED"
            ? "Your tickets are booked. A confirmation email with your e-tickets has been sent to your inbox."
            : "We're confirming your payment. This page will show your tickets once confirmed."}
        </p>

        {/* ticket card */}
        <div className="relative mt-10 w-full overflow-hidden rounded-lg border border-gray-200 text-left">
          <div className="bg-ink px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Booking ID</p>
            <p className="font-display mt-1 text-xl font-bold tracking-tight text-white">{booking.id}</p>
          </div>

          <div className="relative border-b border-dashed border-gray-300 px-6 py-5">
            <div className="ticket-notch absolute inset-y-0 left-0 right-0"></div>
            <h2 className="font-display text-lg font-bold tracking-tight text-ink">{booking.eventTitle}</h2>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Date &amp; time</p>
                <p className="mt-0.5 font-medium text-ink">{formatShowDateTime(booking.showStartsAt)}</p>
              </div>
              <div>
                <p className="text-gray-400">Venue</p>
                <p className="mt-0.5 font-medium text-ink">{booking.venueName}, {booking.venueCity}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-400">Seats booked</p>
                <p className="mt-1 font-medium text-ink">{seatLabels}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Amount paid</p>
                <p className="font-display mt-1 text-xl font-extrabold tracking-tight text-ink">${booking.totalPrice}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
          <Link to="/" className="flex flex-1 items-center justify-center rounded-lg border border-gray-200 py-3.5 text-[15px] font-semibold text-ink transition hover:bg-gray-50">
            Back to events
          </Link>
        </div>
      </main>
    </div>
  );
}
