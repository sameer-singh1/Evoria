import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApplyOrganizer } from "../hooks/useApplyOrganizer";
import { useOrganizerStatus } from "../hooks/useOrganizerStatus";
import { UserMenu } from "../../../shared/components/UserMenu";

export function OrganizerApplyPage() {
  const [organizationName, setOrganizationName] = useState("");
  const applyMutation = useApplyOrganizer();
  const statusQuery = useOrganizerStatus();
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    applyMutation.mutate(
      { organizationName },
      { onSuccess: () => statusQuery.refetch() },
    );
  };

  const errorMessage = applyMutation.isError ? applyMutation.error.message : null;

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
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">Become an organizer</h1>
        <p className="mt-2 text-[15px] text-gray-500">
          Tell us your organization's name. An Evoria admin will review and approve your application before you can publish events.
        </p>

        {statusQuery.isLoading ? (
          <p className="mt-6 text-sm text-gray-500">Checking your application status...</p>
        ) : statusQuery.data?.hasApplied ? (
          <div className="mt-6 rounded-lg border border-gray-200 p-5 text-center">
            {statusQuery.data.approvalStatus === "APPROVED" ? (
              <>
                <p className="font-display text-lg font-bold tracking-tight text-ink">You're approved</p>
                <p className="mt-2 text-[15px] text-gray-500">
                  "{statusQuery.data.organizationName}" can now create and publish events.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/organizer/events/new")}
                  className="glow mt-5 w-full rounded-lg bg-brand py-3 text-[15px] font-semibold text-white transition hover:bg-brand-600"
                >
                  Create an event
                </button>
              </>
            ) : statusQuery.data.approvalStatus === "REJECTED" ? (
              <>
                <p className="font-display text-lg font-bold tracking-tight text-ink">Application rejected</p>
                <p className="mt-2 text-[15px] text-gray-500">
                  Your application for "{statusQuery.data.organizationName}" was not approved. Contact Evoria support for details.
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-lg font-bold tracking-tight text-ink">Application submitted</p>
                <p className="mt-2 text-[15px] text-gray-500">
                  "{statusQuery.data.organizationName}" is pending admin approval. You'll be able to create events once approved.
                </p>
              </>
            )}
          </div>
        ) : (
          <form className="mt-6 space-y-3.5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="organizationName" className="mb-1.5 block text-sm font-medium text-gray-700">
                Organization name
              </label>
              <div className="focus-ring flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 transition">
                <input
                  id="organizationName"
                  type="text"
                  placeholder="Acme Live Events"
                  className="w-full bg-transparent py-2.5 text-[15px] text-ink placeholder:text-gray-400 focus:outline-none"
                  value={organizationName}
                  onChange={(event) => setOrganizationName(event.target.value)}
                />
              </div>
            </div>

            {errorMessage && <p className="text-sm font-medium text-red-500">{errorMessage}</p>}

            <button
              type="submit"
              disabled={applyMutation.isPending || organizationName.trim().length === 0}
              className="glow w-full rounded-lg bg-brand py-3 text-[15px] font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {applyMutation.isPending ? "Submitting..." : "Submit application"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
