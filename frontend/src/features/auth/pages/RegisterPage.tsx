import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegister } from "../hooks/useRegister";

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ATTENDEE" | "ORGANIZER">("ATTENDEE");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    if (!agreedToTerms) {
      setFormError("You must agree to the Terms and Privacy Policy.");
      return;
    }

    registerMutation.mutate(
      { email, password, name, role },
      { onSuccess: () => navigate("/login") },
    );
  };

  const errorMessage = formError ?? (registerMutation.isError ? registerMutation.error.message : null);

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
        {/* LEFT: brand content over photo (same as login) */}
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
        <div className="flex items-center justify-center px-6 py-6 sm:px-12">
          <div className="w-full max-w-sm rounded-lg border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
            {/* mobile logo */}
            <div className="mb-4 flex items-center gap-3 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-600 shadow-lg shadow-brand/40 ring-1 ring-white/25">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
                  <path d="M4 9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 1.5 1.5 0 0 0 0 3 1.5 1.5 0 0 0 0 3 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 1.5 1.5 0 0 0 0-3 1.5 1.5 0 0 0 0-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  <path d="M12 9.1c.36 1.6 1.09 2.33 2.7 2.7-1.61.37-2.34 1.1-2.7 2.7-.36-1.6-1.09-2.33-2.7-2.7 1.61-.37 2.34-1.1 2.7-2.7Z" fill="currentColor" />
                </svg>
              </span>
              <span className="font-display text-xl font-bold tracking-tight text-white">Evoria<span className="text-brand">.</span></span>
            </div>

            <h2 className="font-display text-xl font-extrabold tracking-tight text-white">Create your account</h2>
            <p className="mt-1 text-xs text-gray-300">Join Evoria to start booking events in seconds.</p>

            <form className="mt-4 space-y-2.5" onSubmit={handleSubmit}>
              {/* full name */}
              <div>
                <label htmlFor="name" className="mb-1 block text-xs font-medium text-gray-200">Full name</label>
                <div className="focus-ring flex items-center gap-3 rounded-lg border border-white/20 bg-white/5 px-4 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-gray-300">
                    <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M5 19.2c1.3-3.2 4-4.8 7-4.8s5.7 1.6 7 4.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                  <input
                    id="name"
                    type="text"
                    placeholder="SAMEER SINGH"
                    className="w-full bg-transparent py-1.5 text-sm text-white placeholder:text-gray-400 focus:outline-none"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
              </div>

              {/* email */}
              <div>
                <label htmlFor="email" className="mb-1 block text-xs font-medium text-gray-200">Email address</label>
                <div className="focus-ring flex items-center gap-3 rounded-lg border border-white/20 bg-white/5 px-4 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-gray-300">
                    <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
                    <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="w-full bg-transparent py-1.5 text-sm text-white placeholder:text-gray-400 focus:outline-none"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              {/* role */}
              <div>
                <label htmlFor="role" className="mb-1 block text-xs font-medium text-gray-200">I am signing up as</label>
                <div className="focus-ring flex items-center gap-3 rounded-lg border border-white/20 bg-white/5 px-4 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-gray-300">
                    <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 1.5 1.5 0 0 0 0 3 2 2 0 0 1-2 3H6a2 2 0 0 1-2-3 1.5 1.5 0 0 0 0-3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                    <path d="M9 8.5v9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                  <select
                    id="role"
                    className="w-full appearance-none bg-transparent py-1.5 text-sm text-white focus:outline-none"
                    value={role}
                    onChange={(event) => setRole(event.target.value as "ATTENDEE" | "ORGANIZER")}
                  >
                    <option className="bg-ink text-white" value="ATTENDEE">Attendee — booking tickets</option>
                    <option className="bg-ink text-white" value="ORGANIZER">Organizer — hosting events</option>
                  </select>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-gray-300">
                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* password */}
              <div>
                <label htmlFor="password" className="mb-1 block text-xs font-medium text-gray-200">Password</label>
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
                    className="w-full bg-transparent py-1.5 text-sm text-white placeholder:text-gray-400 focus:outline-none"
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

              {/* confirm password */}
              <div>
                <label htmlFor="confirm" className="mb-1 block text-xs font-medium text-gray-200">Confirm password</label>
                <div className="focus-ring flex items-center gap-3 rounded-lg border border-white/20 bg-white/5 px-4 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-gray-300">
                    <rect x="4.5" y="10.5" width="15" height="9" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    <circle cx="12" cy="15" r="1.4" fill="currentColor" />
                  </svg>
                  <input
                    id="confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full bg-transparent py-1.5 text-sm text-white placeholder:text-gray-400 focus:outline-none"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="shrink-0 text-gray-300 transition hover:text-white"
                    onClick={() => setShowConfirmPassword((show) => !show)}
                  >
                    {showConfirmPassword ? (
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

              <label className="flex items-start gap-2 pt-0.5 text-xs text-gray-300">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10 text-brand focus:ring-brand/40"
                  checked={agreedToTerms}
                  onChange={(event) => setAgreedToTerms(event.target.checked)}
                />
                <span>I agree to the <a href="#" className="font-semibold text-brand hover:text-brand-600">Terms</a> and <a href="#" className="font-semibold text-brand hover:text-brand-600">Privacy Policy</a></span>
              </label>

              {errorMessage && (
                <p className="text-sm font-medium text-red-400">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="glow w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {registerMutation.isPending ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-gray-300">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-brand hover:text-brand-600">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
