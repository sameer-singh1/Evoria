import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";
import { EventListPage } from "./features/event/pages/EventListPage";
import { EventDetailPage } from "./features/event/pages/EventDetailPage";
import { SeatSelectionPage } from "./features/show/pages/SeatSelectionPage";
import { BookingPage } from "./features/booking/pages/BookingPage";
import { MyBookingsPage } from "./features/booking/pages/MyBookingsPage";
import { OrganizerApplyPage } from "./features/organizer/pages/OrganizerApplyPage";
import { CreateEventPage } from "./features/organizer/pages/CreateEventPage";
import { CreateShowPage } from "./features/organizer/pages/CreateShowPage";
import { MyEventsPage } from "./features/organizer/pages/MyEventsPage";
import { useAuthStore } from "./shared/store/authStore";

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const isOrganizer = isAuthenticated && user?.role === "ORGANIZER";

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/" element={<EventListPage />} />
      <Route path="/events/:eventId" element={<EventDetailPage />} />
      <Route path="/events/:eventId/shows/:showId/seats" element={<SeatSelectionPage />} />
      <Route path="/bookings" element={isAuthenticated ? <MyBookingsPage /> : <Navigate to="/login" replace />} />
      <Route path="/bookings/:id" element={<BookingPage />} />
      <Route path="/organizer/apply" element={isOrganizer ? <OrganizerApplyPage /> : <Navigate to="/" replace />} />
      <Route path="/organizer/events" element={isOrganizer ? <MyEventsPage /> : <Navigate to="/" replace />} />
      <Route path="/organizer/events/new" element={isOrganizer ? <CreateEventPage /> : <Navigate to="/" replace />} />
      <Route path="/organizer/events/:eventId/shows/new" element={isOrganizer ? <CreateShowPage /> : <Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
