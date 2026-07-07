import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLogin } from "../hooks/useLogin";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    loginMutation.mutate(
      { email, password },
      { onSuccess: () => navigate("/") },
    );
  };

  const errorMessage = loginMutation.isError ? loginMutation.error.message : null;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* full-page background photo */}
      <img
        src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1800&q=80"
        alt="Live concert crowd"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* dark overlays for legibility */}
      <div className="pointer-events-none absolute inset-0 bg-ink/60"></div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink via-ink/75 to-ink/55"></div>
      {/* subtle ambient glow */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand/25 blur-3xl"></div>
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-brand/10 blur-3xl"></div>

      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* LEFT: brand content over photo */}
        <div className="relative hidden lg:flex flex-col justify-between px-14 py-12 text-white">
          {/* logo */}
          <div className="relative flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-600 shadow-lg shadow-brand/40 ring-1 ring-white/25">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white">
                <path d="M4 9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 1.5 1.5 0 0 0 0 3 1.5 1.5 0 0 0 0 3 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 1.5 1.5 0 0 0 0-3 1.5 1.5 0 0 0 0-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M12 9.1c.36 1.6 1.09 2.33 2.7 2.7-1.61.37-2.34 1.1-2.7 2.7-.36-1.6-1.09-2.33-2.7-2.7 1.61-.37 2.34-1.1 2.7-2.7Z" fill="currentColor" />
              </svg>
            </span>
            <span className="font-display text-[26px] font-bold tracking-tight">Evoria<span className="text-brand">.</span></span>
          </div>

          {/* headline block */}
          <div className="relative max-w-md">
            <h1 className="font-display text-5xl font-extrabold leading-[1.08] tracking-tight">
              Your ticket to<br />unforgettable<br /><span className="text-brand">experiences.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-gray-400">
              Discover concerts, shows, and live events near you. Pick your seats, book in seconds, and show up ready to be amazed.
            </p>

            {/* accent pill tags */}
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-sm font-medium text-brand">
                <span className="h-1.5 w-1.5 rounded-full bg-brand"></span> Live Events
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-sm font-medium text-brand">
                <span className="h-1.5 w-1.5 rounded-full bg-brand"></span> Instant Booking
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-sm font-medium text-brand">
                <span className="h-1.5 w-1.5 rounded-full bg-brand"></span> Secure Payments
              </span>
            </div>
          </div>

          <p className="relative text-sm text-gray-500">© 2026 Evoria. All rights reserved.</p>
        </div>

        {/* RIGHT: form panel */}
        <div className="flex items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-sm rounded-lg border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            {/* mobile logo */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-600 shadow-lg shadow-brand/40 ring-1 ring-white/25">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
                  <path d="M4 9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 1.5 1.5 0 0 0 0 3 1.5 1.5 0 0 0 0 3 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 1.5 1.5 0 0 0 0-3 1.5 1.5 0 0 0 0-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  <path d="M12 9.1c.36 1.6 1.09 2.33 2.7 2.7-1.61.37-2.34 1.1-2.7 2.7-.36-1.6-1.09-2.33-2.7-2.7 1.61-.37 2.34-1.1 2.7-2.7Z" fill="currentColor" />
                </svg>
              </span>
              <span className="font-display text-xl font-bold tracking-tight text-white">Evoria<span className="text-brand">.</span></span>
            </div>

            <h2 className="font-display text-2xl font-extrabold tracking-tight text-white">Welcome back</h2>
            <p className="mt-1.5 text-sm text-gray-300">Sign in to your account to continue booking.</p>

            <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
              {/* email */}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-200">Email address</label>
                <div className="focus-ring flex items-center gap-3 rounded-lg border border-white/20 bg-white/5 px-4 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-gray-300">
                    <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
                    <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="w-full bg-transparent py-2.5 text-[15px] text-white placeholder:text-gray-400 focus:outline-none"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              {/* password */}
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-200">Password</label>
                <div className="focus-ring flex items-center gap-3 rounded-lg border border-white/20 bg-white/5 px-4 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-gray-300">
                    <rect x="4.5" y="10.5" width="15" height="9" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    <circle cx="12" cy="15" r="1.4" fill="currentColor" />
                  </svg>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full bg-transparent py-2.5 text-[15px] text-white placeholder:text-gray-400 focus:outline-none"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="shrink-0 text-gray-300 transition hover:text-white"
                    onClick={() => setShowPassword((show) => !show)}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                        <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                        <path d="M9.5 9.6a2.75 2.75 0 0 0 3.9 3.9M6.3 6.4C3.9 8 2.5 12 2.5 12s3 6.5 9.5 6.5c1.7 0 3.2-.45 4.4-1.1M17.7 15.5C20 13.9 21.5 12 21.5 12S18.5 5.5 12 5.5c-.7 0-1.36.08-2 .22" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                        <path d="M2.5 12S5.5 5.5 12 5.5 21.5 12 21.5 12 18.5 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <p className="text-sm font-medium text-red-400">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="glow w-full rounded-lg bg-brand py-3 text-[15px] font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loginMutation.isPending ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-300">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-brand hover:text-brand-600">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
