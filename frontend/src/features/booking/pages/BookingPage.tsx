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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <span className="font-display text-xl font-bold tracking-tight text-ink">Evoria<span className="text-brand">.</span></span>
          </div>
          <Link to="/" className="text-sm font-medium text-gray-500 transition hover:text-ink">Browse more events</Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-12 text-center">
        {/* status icon */}
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
          <span className="glow flex h-11 w-11 items-center justify-center rounded-full bg-brand">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </span>

        <h1 className="font-display mt-5 text-2xl font-extrabold tracking-tight text-ink">
          {booking.status === "CONFIRMED" ? "Booking confirmed!" : "Booking received"}
        </h1>
        <p className="mt-2 max-w-md text-[15px] text-gray-500">
          {booking.status === "CONFIRMED"
            ? "Your tickets are booked. A confirmation email with your e-tickets has been sent to your inbox."
            : "We're confirming your payment. This page will show your tickets once confirmed."}
        </p>

        {/* ticket card */}
        <div className="relative mt-6 w-full overflow-hidden rounded-lg border border-gray-200 text-left">
          <div className="bg-ink px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Booking ID</p>
            <p className="font-display mt-1 text-lg font-bold tracking-tight text-white">{booking.id}</p>
          </div>

          <div className="relative border-b border-dashed border-gray-300 px-5 py-4">
            <div className="ticket-notch absolute inset-y-0 left-0 right-0"></div>
            <h2 className="font-display text-base font-bold tracking-tight text-ink">{booking.eventTitle}</h2>
            <div className="mt-2.5 grid grid-cols-2 gap-4 text-sm">
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

          <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-400">Seats booked</p>
                <p className="mt-1 font-medium text-ink">{seatLabels}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Amount paid</p>
                <p className="font-display mt-1 text-lg font-extrabold tracking-tight text-ink">₹{booking.totalPrice}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
          <Link to="/" className="flex flex-1 items-center justify-center rounded-lg border border-gray-200 py-3 text-[15px] font-semibold text-ink transition hover:bg-gray-50">
            Back to events
          </Link>
        </div>
      </main>
    </div>
  );
}
