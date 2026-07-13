import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEventDetail } from "../hooks/useEventDetail";
import { useShows, type Show } from "../hooks/useShows";
import type { Category } from "../hooks/useEvents";
import { useAuthStore } from "../../../shared/store/authStore";
import { UserMenu } from "../../../shared/components/UserMenu";

const categoryBadgeLabels: Record<Category, string> = {
  MOVIE: "Movie",
  CONCERT: "Concert",
  SPORT: "Sport",
  WORKSHOP: "Workshop",
  COMEDY: "Comedy",
  FESTIVAL: "Festival",
};

const formatShowDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

const formatShowTime = (isoDate: string) =>
  new Date(isoDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const eventQuery = useEventDetail(eventId!);
  const showsQuery = useShows(eventId!);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  const shows = showsQuery.data?.data ?? [];
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);
  const selectedShow: Show | undefined =
    shows.find((show) => show.id === selectedShowId) ?? shows[0];

  if (eventQuery.isLoading) {
    return <p className="p-10 text-center text-gray-500">Loading...</p>;
  }

  if (eventQuery.isError || !eventQuery.data) {
    return <p className="p-10 text-center text-gray-500">Event not found.</p>;
  }

  const event = eventQuery.data;

  const dateRangeLabel =
    shows.length > 0
      ? shows.length === 1
        ? formatShowDate(shows[0].startsAt)
        : `${formatShowDate(shows[0].startsAt)} – ${formatShowDate(shows[shows.length - 1].startsAt)}`
      : "Dates TBA";

  return (
    <div className="bg-white text-ink antialiased">
      {/* NAVBAR */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="font-display text-xl font-bold tracking-tight text-ink">Evoria<span className="text-brand">.</span></span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 transition hover:text-ink">Login</Link>
                <Link to="/register" className="glow rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* breadcrumb */}
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-ink">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Back to events
        </Link>
      </div>

      {/* banner */}
      <div className="mx-auto mt-3 max-w-7xl px-6">
        <div className="relative aspect-[21/7] overflow-hidden rounded-lg bg-gray-100">
          {event.mediaRef && (
            <img src={event.mediaRef} alt={event.title} className="h-full w-full object-cover" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent"></div>
          <span className="absolute left-5 top-5 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {categoryBadgeLabels[event.category]}
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          {/* LEFT: details */}
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">{event.title}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-[15px] text-gray-600">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-brand"><rect x="3.5" y="4.5" width="17" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M3.5 9h17M8 3v3M16 3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                {dateRangeLabel}
              </div>
              {shows[0] && (
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-brand"><path d="M12 21s-7-6.1-7-11.4A7 7 0 0 1 19 9.6C19 14.9 12 21 12 21Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="12" cy="9.5" r="2.3" stroke="currentColor" strokeWidth="1.6" /></svg>
                  {shows[0].venueName}, {shows[0].venueCity}
                </div>
              )}
            </div>

            {event.description && (
              <div className="mt-6">
                <h2 className="font-display text-lg font-bold tracking-tight text-ink">About this event</h2>
                <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-gray-600">{event.description}</p>
              </div>
            )}

            {/* shows list */}
            <div className="mt-6">
              <h2 className="font-display text-lg font-bold tracking-tight text-ink">Select a show</h2>
              {shows.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No upcoming shows.</p>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {shows.map((show) => (
                    <label key={show.id} className="block cursor-pointer">
                      <input
                        type="radio"
                        name="show"
                        checked={selectedShow?.id === show.id}
                        onChange={() => setSelectedShowId(show.id)}
                        className="show-radio peer sr-only"
                      />
                      <div className="show-card relative rounded-lg border-2 border-gray-200 p-3.5 transition">
                        <span className="show-dot relative block h-4 w-4 rounded-full border-2 border-gray-300 after:absolute after:left-1/2 after:top-1/2 after:h-2 after:w-2 after:-translate-x-1/2 after:-translate-y-1/2 after:scale-0 after:rounded-full after:bg-brand after:transition-transform"></span>
                        <p className="mt-2.5 font-semibold text-ink">{formatShowDate(show.startsAt)}</p>
                        <p className="text-sm text-gray-500">{formatShowTime(show.startsAt)}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: sticky booking summary */}
          {selectedShow && (
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-lg border border-gray-200 p-5">
                {selectedShow.startingPrice !== null ? (
                  <>
                    <p className="text-sm text-gray-500">Starting from</p>
                    <p className="font-display mt-1 text-2xl font-extrabold tracking-tight text-ink">₹{selectedShow.startingPrice}</p>
                  </>
                ) : (
                  <p className="font-display mt-1 text-xl font-extrabold tracking-tight text-gray-400">Sold out</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  {formatShowDate(selectedShow.startsAt)} · {formatShowTime(selectedShow.startsAt)}
                </p>

                <button
                  type="button"
                  disabled={selectedShow.startingPrice === null}
                  onClick={() =>
                    navigate(isAuthenticated ? `/events/${eventId}/shows/${selectedShow.id}/seats` : "/login")
                  }
                  className="glow mt-5 block w-full rounded-lg bg-brand py-3 text-center text-[15px] font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Select seats
                </button>

                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0"><path d="M12 3.5 4.5 6.5v5.2c0 4.5 3.1 7.9 7.5 8.8 4.4-.9 7.5-4.3 7.5-8.8V6.5L12 3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
                  Secure checkout · Instant confirmation
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
