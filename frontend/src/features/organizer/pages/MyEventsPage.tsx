import { Link } from "react-router-dom";
import { useMyEvents } from "../hooks/useMyEvents";
import { usePublishEvent } from "../hooks/usePublishEvent";
import type { Category } from "../../event/hooks/useEvents";
import { UserMenu } from "../../../shared/components/UserMenu";

const categoryLabels: Record<Category, string> = {
  MOVIE: "Movie",
  CONCERT: "Concert",
  SPORT: "Sport",
  WORKSHOP: "Workshop",
  COMEDY: "Comedy",
  FESTIVAL: "Festival",
};

export function MyEventsPage() {
  const eventsQuery = useMyEvents();
  const publishEvent = usePublishEvent();

  const events = eventsQuery.data?.data ?? [];

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">My events</h1>
            <p className="mt-1.5 text-[15px] text-gray-500">Everything you've created, published or not.</p>
          </div>
          <Link
            to="/organizer/events/new"
            className="glow rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            + New event
          </Link>
        </div>

        {eventsQuery.isLoading ? (
          <p className="mt-6 text-sm text-gray-500">Loading your events...</p>
        ) : events.length === 0 ? (
          <div className="mt-6 rounded-lg border border-gray-200 p-6 text-center">
            <p className="text-[15px] text-gray-500">You haven't created any events yet.</p>
            <Link
              to="/organizer/events/new"
              className="glow mt-4 inline-block rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              Create your first event
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-2.5">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-display text-lg font-bold tracking-tight text-ink">{event.title}</h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        event.published ? "bg-brand/10 text-brand" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {event.published ? "Published" : "Unpublished"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {categoryLabels[event.category]} · {event.showCount} {event.showCount === 1 ? "show" : "shows"}
                  </p>
                  {publishEvent.isError && publishEvent.variables === event.id && (
                    <p className="mt-1.5 text-sm font-medium text-red-500">{publishEvent.error.message}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/organizer/events/${event.id}/shows/new`}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gray-50"
                  >
                    Add show
                  </Link>
                  {!event.published && (
                    <button
                      type="button"
                      onClick={() => publishEvent.mutate(event.id, { onSuccess: () => eventsQuery.refetch() })}
                      disabled={event.showCount === 0 || (publishEvent.isPending && publishEvent.variables === event.id)}
                      title={event.showCount === 0 ? "Add a show before publishing" : undefined}
                      className="glow rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {publishEvent.isPending && publishEvent.variables === event.id ? "Publishing..." : "Publish"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
