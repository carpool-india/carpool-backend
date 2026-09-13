import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { RootLayout } from "./layout/RootLayout";
import { RequireAuth } from "./components/RequireAuth";
import { LandingPage } from "./pages/LandingPage";
const LoginPage = lazy(() => import("./pages/LoginPage").then(module => ({ default: module.LoginPage })));
const OtpVerifyPage = lazy(() => import("./pages/OtpVerifyPage").then(module => ({ default: module.OtpVerifyPage })));
const ProfileSetupPage = lazy(() => import("./pages/ProfileSetupPage").then(module => ({ default: module.ProfileSetupPage })));
const SearchPage = lazy(() => import("./pages/SearchPage").then(module => ({ default: module.SearchPage })));
const RideDetailPage = lazy(() => import("./pages/RideDetailPage").then(module => ({ default: module.RideDetailPage })));
const BookingPaymentPage = lazy(() => import("./pages/BookingPaymentPage").then(module => ({ default: module.BookingPaymentPage })));
const BookingConfirmedPage = lazy(() => import("./pages/BookingConfirmedPage").then(module => ({ default: module.BookingConfirmedPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then(module => ({ default: module.ProfilePage })));
const KycPage = lazy(() => import("./pages/KycPage").then(module => ({ default: module.KycPage })));
const VehiclePage = lazy(() => import("./pages/VehiclePage").then(module => ({ default: module.VehiclePage })));
const PlansPage = lazy(() => import("./pages/PlansPage").then(module => ({ default: module.PlansPage })));
const PostTripPage = lazy(() => import("./pages/PostTripPage").then(module => ({ default: module.PostTripPage })));
const MyTripsPage = lazy(() => import("./pages/MyTripsPage").then(module => ({ default: module.MyTripsPage })));
const LiveTripPage = lazy(() => import("./pages/LiveTripPage").then(module => ({ default: module.LiveTripPage })));


export function App() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-paper text-brand" role="status">Getting your journey ready…</div>}>
    <Routes>
      <Route element={<RootLayout />}>
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
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/kyc"
          element={
            <RequireAuth>
              <KycPage />
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
        <Route
          path="/trips/:tripId/live"
          element={
            <RequireAuth>
              <LiveTripPage />
            </RequireAuth>
          }
        />
      </Route>
    </Routes>
    </Suspense>
  );
}
