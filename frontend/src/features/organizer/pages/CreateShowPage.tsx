import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useVenues } from "../hooks/useVenues";
import { useCreateVenue } from "../hooks/useCreateVenue";
import { useCreateShow } from "../hooks/useCreateShow";
import { usePublishEvent } from "../hooks/usePublishEvent";
import { UserMenu } from "../../../shared/components/UserMenu";

interface SeatRow {
  label: string;
  price: string;
}

export function CreateShowPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const venuesQuery = useVenues();
  const createVenue = useCreateVenue();
  const createShow = useCreateShow();
  const publishEvent = usePublishEvent();
  const navigate = useNavigate();

  const [venueId, setVenueId] = useState("");
  const [showNewVenueForm, setShowNewVenueForm] = useState(false);
  const [newVenueName, setNewVenueName] = useState("");
  const [newVenueCity, setNewVenueCity] = useState("");
  const [newVenueAddress, setNewVenueAddress] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [seats, setSeats] = useState<SeatRow[]>([{ label: "A1", price: "" }]);
  const [successId, setSuccessId] = useState<string | null>(null);

  const venues = venuesQuery.data?.data ?? [];

  const updateSeat = (index: number, patch: Partial<SeatRow>) => {
    setSeats((current) => current.map((seat, i) => (i === index ? { ...seat, ...patch } : seat)));
  };

  const addSeatRow = () => setSeats((current) => [...current, { label: "", price: "" }]);
  const removeSeatRow = (index: number) => setSeats((current) => current.filter((_, i) => i !== index));

  const handleCreateVenue = (event: FormEvent) => {
    event.preventDefault();
    createVenue.mutate(
      { name: newVenueName, city: newVenueCity, address: newVenueAddress },
      {
        onSuccess: (venue) => {
          venuesQuery.refetch();
          setVenueId(venue.id);
          setShowNewVenueForm(false);
          setNewVenueName("");
          setNewVenueCity("");
          setNewVenueAddress("");
        },
      },
    );
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!eventId || !venueId) return;

    createShow.mutate(
      {
        eventId,
        venueId,
        startsAt: new Date(startsAt).toISOString(),
        seats: seats
          .filter((seat) => seat.label.trim() && seat.price.trim())
          .map((seat) => ({ label: seat.label.trim(), price: Number(seat.price) })),
      },
      { onSuccess: (data) => setSuccessId(data.id) },
    );
  };

  const canSubmit = Boolean(venueId) && startsAt.length > 0 && seats.some((seat) => seat.label.trim() && seat.price.trim());

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

      <main className="mx-auto max-w-2xl px-6 py-12">
        {successId ? (
          <div className="rounded-lg border border-gray-200 p-6 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
              <span className="glow flex h-9 w-9 items-center justify-center rounded-full bg-brand">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </span>

            {publishEvent.isSuccess ? (
              <>
                <h1 className="font-display mt-4 text-xl font-extrabold tracking-tight text-ink">Event published</h1>
                <p className="mt-2 text-[15px] text-gray-500">Your event is now live and visible to attendees.</p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setSuccessId(null);
                      setStartsAt("");
                      setSeats([{ label: "A1", price: "" }]);
                    }}
                    className="flex-1 rounded-lg border border-gray-200 py-3 text-[15px] font-semibold text-ink transition hover:bg-gray-50"
                  >
                    Add another show
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/events/${eventId}`)}
                    className="glow flex-1 rounded-lg bg-brand py-3 text-[15px] font-semibold text-white transition hover:bg-brand-600"
                  >
                    View live event
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="font-display mt-4 text-xl font-extrabold tracking-tight text-ink">Show created</h1>
                <p className="mt-2 text-[15px] text-gray-500">
                  This event now has at least one show and is eligible to be published.
                </p>

                {publishEvent.isError && (
                  <p className="mt-3 text-sm font-medium text-red-500">{publishEvent.error.message}</p>
                )}

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setSuccessId(null);
                      setStartsAt("");
                      setSeats([{ label: "A1", price: "" }]);
                    }}
                    className="flex-1 rounded-lg border border-gray-200 py-3 text-[15px] font-semibold text-ink transition hover:bg-gray-50"
                  >
                    Add another show
                  </button>
                  <button
                    type="button"
                    onClick={() => eventId && publishEvent.mutate(eventId)}
                    disabled={publishEvent.isPending}
                    className="glow flex-1 rounded-lg bg-brand py-3 text-[15px] font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {publishEvent.isPending ? "Publishing..." : "Publish event"}
                  </button>
                </div>
                <Link to="/" className="mt-4 inline-block text-sm font-semibold text-gray-500 transition hover:text-ink">
                  Skip for now
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">Add a show</h1>
            <p className="mt-2 text-[15px] text-gray-500">Set the venue, date/time, and seat pricing for this show.</p>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              {/* Venue */}
              <div>
                <label htmlFor="venue" className="mb-1.5 block text-sm font-medium text-gray-700">Venue</label>
                <div className="focus-ring rounded-lg border border-gray-200 bg-white px-4 transition">
                  <select
                    id="venue"
                    className="w-full bg-transparent py-2.5 text-[15px] text-ink focus:outline-none"
                    value={venueId}
                    onChange={(event) => setVenueId(event.target.value)}
                  >
                    <option value="">Select a venue...</option>
                    {venues.map((venue) => (
                      <option key={venue.id} value={venue.id}>{venue.name} — {venue.city}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewVenueForm((show) => !show)}
                  className="mt-2 text-sm font-semibold text-brand hover:text-brand-600"
                >
                  {showNewVenueForm ? "Cancel" : "+ Add a new venue"}
                </button>

                {showNewVenueForm && (
                  <div className="mt-3 space-y-2.5 rounded-lg border border-gray-200 p-3.5">
                    <div className="focus-ring flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 transition">
                      <input
                        type="text"
                        placeholder="Venue name"
                        className="w-full bg-transparent py-2.5 text-[15px] text-ink placeholder:text-gray-400 focus:outline-none"
                        value={newVenueName}
                        onChange={(event) => setNewVenueName(event.target.value)}
                      />
                    </div>
                    <div className="focus-ring flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 transition">
                      <input
                        type="text"
                        placeholder="City"
                        className="w-full bg-transparent py-2.5 text-[15px] text-ink placeholder:text-gray-400 focus:outline-none"
                        value={newVenueCity}
                        onChange={(event) => setNewVenueCity(event.target.value)}
                      />
                    </div>
                    <div className="focus-ring flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 transition">
                      <input
                        type="text"
                        placeholder="Address"
                        className="w-full bg-transparent py-2.5 text-[15px] text-ink placeholder:text-gray-400 focus:outline-none"
                        value={newVenueAddress}
                        onChange={(event) => setNewVenueAddress(event.target.value)}
                      />
                    </div>
                    {createVenue.isError && (
                      <p className="text-sm font-medium text-red-500">{createVenue.error.message}</p>
                    )}
                    <button
                      type="button"
                      onClick={handleCreateVenue}
                      disabled={createVenue.isPending || !newVenueName || !newVenueCity || !newVenueAddress}
                      className="w-full rounded-lg bg-ink py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {createVenue.isPending ? "Saving..." : "Save venue"}
                    </button>
                  </div>
                )}
              </div>

              {/* Date/time */}
              <div>
                <label htmlFor="startsAt" className="mb-1.5 block text-sm font-medium text-gray-700">Date &amp; time</label>
                <div className="focus-ring flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 transition">
                  <input
                    id="startsAt"
                    type="datetime-local"
                    className="w-full bg-transparent py-2.5 text-[15px] text-ink focus:outline-none"
                    value={startsAt}
                    onChange={(event) => setStartsAt(event.target.value)}
                  />
                </div>
              </div>

              {/* Seats */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Seats</label>
                  <button type="button" onClick={addSeatRow} className="text-sm font-semibold text-brand hover:text-brand-600">
                    + Add seat
                  </button>
                </div>
                <div className="space-y-2">
                  {seats.map((seat, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="focus-ring flex flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 transition">
                        <input
                          type="text"
                          placeholder="Label (e.g. A1)"
                          className="w-full bg-transparent py-2.5 text-[15px] text-ink placeholder:text-gray-400 focus:outline-none"
                          value={seat.label}
                          onChange={(event) => updateSeat(index, { label: event.target.value })}
                        />
                      </div>
                      <div className="focus-ring flex w-32 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 transition">
                        <span className="text-gray-400">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Price"
                          className="w-full bg-transparent py-2.5 text-[15px] text-ink placeholder:text-gray-400 focus:outline-none"
                          value={seat.price}
                          onChange={(event) => updateSeat(index, { price: event.target.value })}
                        />
                      </div>
                      {seats.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSeatRow(index)}
                          aria-label="Remove seat"
                          className="shrink-0 rounded-lg p-2.5 text-gray-400 transition hover:bg-gray-50 hover:text-red-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {createShow.isError && <p className="text-sm font-medium text-red-500">{createShow.error.message}</p>}

              <button
                type="submit"
                disabled={createShow.isPending || !canSubmit}
                className="glow w-full rounded-lg bg-brand py-3 text-[15px] font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createShow.isPending ? "Creating..." : "Create show"}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
