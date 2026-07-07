import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";
import { EventListPage } from "./features/event/pages/EventListPage";
import { EventDetailPage } from "./features/event/pages/EventDetailPage";
import { SeatSelectionPage } from "./features/show/pages/SeatSelectionPage";
import { BookingPage } from "./features/booking/pages/BookingPage";
import { useAuthStore } from "./shared/store/authStore";

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/" element={<EventListPage />} />
      <Route path="/events/:eventId" element={<EventDetailPage />} />
      <Route path="/events/:eventId/shows/:showId/seats" element={<SeatSelectionPage />} />
      <Route path="/bookings/:id" element={<BookingPage />} />
    </Routes>
  );
}

export default App;
