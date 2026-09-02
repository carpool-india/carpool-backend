import { Route, Routes } from "react-router-dom";
import { Layout } from "./layout/Layout";
import { RequireAuth } from "./components/RequireAuth";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { OtpVerifyPage } from "./pages/OtpVerifyPage";
import { ProfileSetupPage } from "./pages/ProfileSetupPage";
import { SearchPage } from "./pages/SearchPage";
import { RideDetailPage } from "./pages/RideDetailPage";
import { BookingPaymentPage } from "./pages/BookingPaymentPage";
import { BookingConfirmedPage } from "./pages/BookingConfirmedPage";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/otp" element={<OtpVerifyPage />} />
        <Route
          path="/profile-setup"
          element={
            <RequireAuth>
              <ProfileSetupPage />
            </RequireAuth>
          }
        />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/rides/:tripId" element={<RideDetailPage />} />
        <Route
          path="/rides/:tripId/book"
          element={
            <RequireAuth>
              <BookingPaymentPage />
            </RequireAuth>
          }
        />
        <Route
          path="/bookings/:bookingId/confirmed"
          element={
            <RequireAuth>
              <BookingConfirmedPage />
            </RequireAuth>
          }
        />
      </Route>
    </Routes>
  );
}
