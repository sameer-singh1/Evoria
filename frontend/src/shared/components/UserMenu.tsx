import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-ink"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
          {user.name.charAt(0).toUpperCase()}
        </span>
        {user.name}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1.5 shadow-xl shadow-gray-200/60">
          <Link
            to="/bookings"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-ink"
          >
            My Bookings
          </Link>
          {user.role === "ORGANIZER" && (
            <>
              <Link
                to="/organizer/events"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-ink"
              >
                My Events
              </Link>
              <Link
                to="/organizer/apply"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-ink"
              >
                Organizer
              </Link>
            </>
          )}
          <div className="my-1 border-t border-gray-100" />
          <button
            type="button"
            onClick={logout}
            className="block w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-ink"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
