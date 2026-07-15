import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSeats, type Seat } from "../hooks/useSeats";
import { useEventDetail } from "../../event/hooks/useEventDetail";
import { useShows } from "../../event/hooks/useShows";
import { useCreateBooking } from "../../booking/hooks/useCreateBooking";
import { useInitiatePayment } from "../../booking/hooks/useInitiatePayment";
import { useVerifyPayment } from "../../booking/hooks/useVerifyPayment";
import { useCancelBooking } from "../../booking/hooks/useCancelBooking";
import { useHoldSeat } from "../hooks/useHoldSeat";
import { useReleaseSeat } from "../hooks/useReleaseSeat";

function groupSeatsByRow(seats: Seat[]) {
  const rows = new Map<string, Seat[]>();

  for (const seat of seats) {
    const row = seat.label.match(/^[A-Za-z]+/)?.[0] ?? "?";
    if (!rows.has(row)) rows.set(row, []);
    rows.get(row)!.push(seat);
  }

  for (const rowSeats of rows.values()) {
    rowSeats.sort((a, b) => {
      const numA = parseInt(a.label.replace(/^[A-Za-z]+/, ""), 10);
      const numB = parseInt(b.label.replace(/^[A-Za-z]+/, ""), 10);
      return numA - numB;
    });
  }

  return Array.from(rows.entries()).sort(([rowA], [rowB]) => rowA.localeCompare(rowB));
}

const formatShowDateTime = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
  " · " +
  new Date(isoDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export function SeatSelectionPage() {
  const { eventId, showId } = useParams<{ eventId: string; showId: string }>();
  const eventQuery = useEventDetail(eventId!);
  const showsQuery = useShows(eventId!);
  const seatsQuery = useSeats(showId!);
  const createBooking = useCreateBooking();
  const initiatePayment = useInitiatePayment();
  const verifyPayment = useVerifyPayment();
  const cancelBooking = useCancelBooking();
  const holdSeat = useHoldSeat();
  const releaseSeat = useReleaseSeat();
  const navigate = useNavigate();

  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(new Set());
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const seats = seatsQuery.data?.data ?? [];
  const shows = showsQuery.data?.data ?? [];
  const show = shows.find((s) => s.id === showId);
  const rows = groupSeatsByRow(seats);

  const selectedSeats = seats.filter((seat) => selectedSeatIds.has(seat.id));
  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  const toggleSeat = (seat: Seat) => {
    if (seat.status !== "AVAILABLE" && !selectedSeatIds.has(seat.id)) return;
    
    const isCurrentlySelected = selectedSeatIds.has(seat.id);
    
    if (isCurrentlySelected) {
      // Deselecting - remove from UI immediately, then try to release on backend
      setSelectedSeatIds((current) => {
        const next = new Set(current);
        next.delete(seat.id);
        return next;
      });
      // Best-effort release — if seat was already released by a cancelled booking, that's fine
      releaseSeat.mutate({ showId: showId!, seatId: seat.id });
    } else {
      // Selecting - hold the seat
      holdSeat.mutate(
        { showId: showId!, seatId: seat.id },
        {
          onSuccess: () => {
            setSelectedSeatIds((current) => {
              const next = new Set(current);
              next.add(seat.id);
              return next;
            });
          },
          onError: (error) => {
            alert(error.message === "Seat is no longer available" 
              ? "This seat was just taken by another user" 
              : "Failed to hold seat. Please try again.");
          },
        }
      );
    }
  };

  const handleBookNow = () => {
    if (selectedSeatIds.size === 0 || !showId) return;

    createBooking.mutate(
      { showId, seatIds: Array.from(selectedSeatIds) },
      { onSuccess: (data) => {
        initiatePayment.mutate(
          { bookingId: data.id },
          { 
            onSuccess: (paymentData) => openRazorpayModal(paymentData, data.id),
            onError: () => {
              // Payment initiation failed, cancel the booking to release seats
              cancelBooking.mutate({ bookingId: data.id });
            }
          }
        );
      }},
    );
  };

  const openRazorpayModal = (paymentData: { orderId: string; amount: number; currency: string; keyId: string }, bookingId: string) => {
    setIsProcessingPayment(true);
    
    const options = {
      key: paymentData.keyId,
      amount: paymentData.amount * 100, // Convert to paise
      currency: paymentData.currency,
      name: "Evoria",
      description: "Event Ticket Booking",
      order_id: paymentData.orderId,
      handler: function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
        verifyPayment.mutate(
          {
            bookingId,
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature,
          },
          {
            onSuccess: () => {
              setIsProcessingPayment(false);
              navigate(`/bookings/${bookingId}`);
            },
            onError: (error) => {
              setIsProcessingPayment(false);
              // Payment verification failed, cancel the booking to release seats
              cancelBooking.mutate({ bookingId });
              alert(`Payment verification failed: ${error.message}`);
            },
          }
        );
      },
      prefill: {
        name: "",
        email: "",
        contact: "",
      },
      theme: {
        color: "#3399cc",
      },
      modal: {
        ondismiss: function () {
          setIsProcessingPayment(false);
          // User closed the modal without completing payment — release seats
          cancelBooking.mutate({ bookingId });
        },
      },
    };

    const rzp = new (window as unknown as { Razorpay: new (options: unknown) => { open: () => void; on: (event: string, handler: (response: { error: { description: string } }) => void) => void } }).Razorpay(options);
    rzp.open();
    
    rzp.on("payment.failed", function (response: { error: { description: string } }) {
      setIsProcessingPayment(false);
      // Payment failed, cancel the booking to release seats
      cancelBooking.mutate({ bookingId });
      alert(`Payment failed: ${response.error.description}`);
    });
  };

  return (
    <div className="bg-white text-ink antialiased">
      {/* NAVBAR */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <span className="font-display text-xl font-bold tracking-tight text-ink">Evoria<span className="text-brand">.</span></span>
          </div>
          <Link to={`/events/${eventId}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-ink">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Back to event
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
            {eventQuery.data?.title ?? "..."}
          </h1>
          {show && (
            <p className="mt-1 text-sm text-gray-500">
              {show.venueName} · {formatShowDateTime(show.startsAt)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* SEAT MAP */}
          <div className="rounded-lg border border-gray-200 p-5 sm:p-8">
            <div className="mx-auto mb-6 max-w-xl">
              <div className="rounded-t-xl bg-ink py-3 text-center text-xs font-semibold uppercase tracking-[0.25em] text-white/70">Stage</div>
              <div className="h-1 bg-gradient-to-r from-transparent via-brand/50 to-transparent"></div>
            </div>

            {seats.length === 0 ? (
              <p className="text-center text-sm text-gray-500">No seats found for this show.</p>
            ) : (
              <div className="mx-auto flex w-fit flex-col gap-2.5">
                {rows.map(([rowLabel, rowSeats]) => (
                  <div key={rowLabel} className="flex items-center gap-2.5">
                    <span className="w-4 text-center text-xs font-semibold text-gray-400">{rowLabel}</span>
                    {rowSeats.map((seat) => {
                      const isSelected = selectedSeatIds.has(seat.id);
                      const statusClass = isSelected ? "selected" : seat.status === "AVAILABLE" ? "available" : "booked";

                      return (
                        <button
                          key={seat.id}
                          type="button"
                          disabled={seat.status !== "AVAILABLE" && !selectedSeatIds.has(seat.id)}
                          onClick={() => toggleSeat(seat)}
                          className={`seat ${statusClass}`}
                        >
                          {seat.label.replace(/^[A-Za-z]+/, "")}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2"><span className="h-4 w-4 rounded-md bg-gray-200"></span> Available</div>
              <div className="flex items-center gap-2"><span className="h-4 w-4 rounded-md bg-brand"></span> Selected</div>
              <div className="flex items-center gap-2"><span className="h-4 w-4 rounded-md bg-ink opacity-55"></span> Booked</div>
            </div>
          </div>

          {/* SIDEBAR SUMMARY */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-gray-200 p-5">
              <h2 className="font-display text-lg font-bold tracking-tight text-ink">Your seats</h2>

              <div className="mt-3 space-y-2 text-sm text-gray-600">
                {selectedSeats.length === 0 ? (
                  <p className="text-gray-400">No seats selected yet</p>
                ) : (
                  selectedSeats.map((seat) => (
                    <div key={seat.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <span className="font-medium text-ink">Seat {seat.label}</span>
                      <span className="text-gray-500">₹{seat.price}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 border-t border-gray-200 pt-3.5">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{selectedSeats.length} {selectedSeats.length === 1 ? "seat" : "seats"}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-display text-base font-bold text-ink">Total</span>
                  <span className="font-display text-2xl font-extrabold tracking-tight text-ink">₹{totalPrice}</span>
                </div>
              </div>

              {(createBooking.isError || initiatePayment.isError || verifyPayment.isError) && (
                <p className="mt-3 text-sm font-medium text-red-500">
                  {createBooking.error?.message || initiatePayment.error?.message || verifyPayment.error?.message}
                </p>
              )}

              <button
                type="button"
                disabled={selectedSeatIds.size === 0 || createBooking.isPending || initiatePayment.isPending || isProcessingPayment}
                onClick={handleBookNow}
                className="glow mt-5 w-full rounded-lg bg-brand py-3 text-[15px] font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
              >
                {createBooking.isPending ? "Booking..." : initiatePayment.isPending ? "Initiating payment..." : isProcessingPayment ? "Processing payment..." : "Book now"}
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
