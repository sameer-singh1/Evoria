import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEvents, type Category } from "../hooks/useEvents";
import { useAuthStore } from "../../../shared/store/authStore";

type CategoryFilter = "ALL" | Category;

export function EventListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("ALL");
  const eventsQuery = useEvents();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const events = eventsQuery.data?.data ?? [];

  const filteredEvents = events.filter((event) => {
    const matchesCategory = selectedCategory === "ALL" || event.category === selectedCategory;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryOptions: { value: CategoryFilter; label: string }[] = [
    { value: "ALL", label: "All events" },
    { value: "MOVIE", label: "Movies" },
    { value: "CONCERT", label: "Concerts" },
    { value: "SPORT", label: "Sports" },
    { value: "WORKSHOP", label: "Workshops" },
    { value: "COMEDY", label: "Comedy" },
    { value: "FESTIVAL", label: "Festivals" },
  ];

  const categoryBadgeLabels: Record<Category, string> = {
    MOVIE: "Movie",
    CONCERT: "Concert",
    SPORT: "Sport",
    WORKSHOP: "Workshop",
    COMEDY: "Comedy",
    FESTIVAL: "Festival",
  };

  const formatShowDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="bg-white text-ink antialiased">
      {/* NAVBAR */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
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

          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
            <a href="#" className="text-ink">Events</a>
            <a href="#" className="hover:text-ink">Shows</a>
            <a href="#" className="hover:text-ink">Cities</a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <span className="text-sm font-semibold text-gray-700">Hi, {user.name}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 transition hover:text-ink"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 transition hover:text-ink">Login</Link>
                <Link to="/register" className="glow rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* page heading + search */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Browse events</h1>
            <p className="mt-1.5 text-[15px] text-gray-500">{filteredEvents.length} events happening near you</p>
          </div>

          <div className="focus-ring flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 md:w-96">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-gray-400">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
              <path d="m20 20-3.8-3.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search events, artists, venues..."
              className="w-full bg-transparent py-3 text-[15px] text-ink placeholder:text-gray-400 focus:outline-none"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          {/* SIDEBAR FILTERS */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-gray-200 p-5">
              <h3 className="font-display text-base font-bold tracking-tight text-ink">Category</h3>
              <div className="mt-4 space-y-3">
                {categoryOptions.map((option) => (
                  <label key={option.value} className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedCategory === option.value}
                      onChange={() => setSelectedCategory(option.value)}
                      className="cat-checkbox peer sr-only"
                    />
                    <span className="cat-box flex h-5 w-5 items-center justify-center rounded-md border-2 border-gray-300 bg-white transition">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-white opacity-0 transition">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="text-[15px] text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* EVENT GRID */}
          {filteredEvents.length === 0 ? (
            <p className="text-[15px] text-gray-500">No events found.</p>
          ) : (
            <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="group overflow-hidden rounded-lg border border-gray-200 transition hover:shadow-xl hover:shadow-gray-200/60"
                >
                  <Link to={`/events/${event.id}`} className="block">
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                      {event.mediaRef && (
                        <img
                          src={event.mediaRef}
                          alt={event.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      )}
                      <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                        {categoryBadgeLabels[event.category]}
                      </span>
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link to={`/events/${event.id}`} className="block">
                      <h3 className="font-display text-lg font-bold tracking-tight text-ink">{event.title}</h3>

                      {event.nextShowDate ? (
                        <>
                          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0"><rect x="3.5" y="4.5" width="17" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M3.5 9h17M8 3v3M16 3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                            {formatShowDate(event.nextShowDate)}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0"><path d="M12 21s-7-6.1-7-11.4A7 7 0 0 1 19 9.6C19 14.9 12 21 12 21Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="12" cy="9.5" r="2.3" stroke="currentColor" strokeWidth="1.6" /></svg>
                            {event.venueCity}
                          </div>
                        </>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500">Dates TBA</p>
                      )}
                    </Link>

                    {event.nextShowDate && (
                      <div className="mt-4 flex items-center justify-between">
                        {event.startingPrice !== null ? (
                          <>
                            <span className="font-display text-lg font-bold text-ink">${event.startingPrice}</span>
                            <button
                              type="button"
                              onClick={() => navigate(isAuthenticated ? `/events/${event.id}` : "/login")}
                              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-brand-600"
                            >
                              Book now
                            </button>
                          </>
                        ) : (
                          <span className="text-sm font-semibold text-gray-400">Sold out</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
