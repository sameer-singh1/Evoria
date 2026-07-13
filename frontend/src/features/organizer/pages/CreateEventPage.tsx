import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCreateEvent } from "../hooks/useCreateEvent";
import type { Category } from "../../event/hooks/useEvents";
import { UserMenu } from "../../../shared/components/UserMenu";

const categoryOptions: { value: Category; label: string }[] = [
  { value: "MOVIE", label: "Movie" },
  { value: "CONCERT", label: "Concert" },
  { value: "SPORT", label: "Sport" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "COMEDY", label: "Comedy" },
  { value: "FESTIVAL", label: "Festival" },
];

export function CreateEventPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("CONCERT");
  const [description, setDescription] = useState("");
  const [mediaRef, setMediaRef] = useState("");
  const createEvent = useCreateEvent();
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    createEvent.mutate(
      { title, category, description: description || undefined, mediaRef: mediaRef || undefined },
      { onSuccess: (data) => navigate(`/organizer/events/${data.id}/shows/new`) },
    );
  };

  const notApproved = createEvent.isError && createEvent.error.message === "Organizer not approved";

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

      <main className="mx-auto max-w-lg px-6 py-12">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">Create an event</h1>
        <p className="mt-2 text-[15px] text-gray-500">
          Events stay unpublished until they have at least one show. You'll add the first show next.
        </p>

        <form className="mt-6 space-y-3.5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-gray-700">Title</label>
            <div className="focus-ring flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 transition">
              <input
                id="title"
                type="text"
                placeholder="Sunburn Music Festival"
                className="w-full bg-transparent py-2.5 text-[15px] text-ink placeholder:text-gray-400 focus:outline-none"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-gray-700">Category</label>
            <div className="focus-ring rounded-lg border border-gray-200 bg-white px-4 transition">
              <select
                id="category"
                className="w-full bg-transparent py-2.5 text-[15px] text-ink focus:outline-none"
                value={category}
                onChange={(event) => setCategory(event.target.value as Category)}
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <div className="focus-ring rounded-lg border border-gray-200 bg-white px-4 transition">
              <textarea
                id="description"
                rows={3}
                placeholder="What should attendees know about this event?"
                className="w-full resize-none bg-transparent py-2.5 text-[15px] text-ink placeholder:text-gray-400 focus:outline-none"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="mediaRef" className="mb-1.5 block text-sm font-medium text-gray-700">
              Banner image URL <span className="text-gray-400">(optional)</span>
            </label>
            <div className="focus-ring flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 transition">
              <input
                id="mediaRef"
                type="text"
                placeholder="https://..."
                className="w-full bg-transparent py-2.5 text-[15px] text-ink placeholder:text-gray-400 focus:outline-none"
                value={mediaRef}
                onChange={(event) => setMediaRef(event.target.value)}
              />
            </div>
          </div>

          {notApproved && (
            <p className="text-sm font-medium text-red-500">
              Your organizer application hasn't been approved yet.{" "}
              <Link to="/organizer/apply" className="underline">Check your application</Link>.
            </p>
          )}
          {createEvent.isError && !notApproved && (
            <p className="text-sm font-medium text-red-500">{createEvent.error.message}</p>
          )}

          <button
            type="submit"
            disabled={createEvent.isPending || title.trim().length === 0}
            className="glow w-full rounded-lg bg-brand py-3 text-[15px] font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createEvent.isPending ? "Creating..." : "Continue to add a show"}
          </button>
        </form>
      </main>
    </div>
  );
}
