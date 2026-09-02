import { Navigate, Route, Routes } from "react-router-dom";
import { RootLayout } from "./layout/RootLayout";
import { RequireAuth } from "./components/RequireAuth";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { OtpVerifyPage } from "./pages/OtpVerifyPage";
import { ProfileSetupPage } from "./pages/ProfileSetupPage";
import { SearchPage } from "./pages/SearchPage";
import { RideDetailPage } from "./pages/RideDetailPage";
import { BookingPaymentPage } from "./pages/BookingPaymentPage";
import { BookingConfirmedPage } from "./pages/BookingConfirmedPage";
import { ProfilePage } from "./pages/ProfilePage";
import { VehiclePage } from "./pages/VehiclePage";
import { PlansPage } from "./pages/PlansPage";
import { PostTripPage } from "./pages/PostTripPage";
import { MyTripsPage } from "./pages/MyTripsPage";
import { useAuthStore } from "./store/authStore";

function HomeRoute() {
  const sessionToken = useAuthStore((state) => state.sessionToken);
  if (sessionToken) {
    return <Navigate to="/search" replace />;
  }
  return <LandingPage />;
}

export function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<HomeRoute />} />
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
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/vehicle"
          element={
            <RequireAuth>
              <VehiclePage />
            </RequireAuth>
          }
        />
        <Route
          path="/plans"
          element={
            <RequireAuth>
              <PlansPage />
            </RequireAuth>
          }
        />
        <Route
          path="/post"
          element={
            <RequireAuth>
              <PostTripPage />
            </RequireAuth>
          }
        />
        <Route
          path="/trips"
          element={
            <RequireAuth>
              <MyTripsPage />
            </RequireAuth>
          }
        />
      </Route>
    </Routes>
  );
}
