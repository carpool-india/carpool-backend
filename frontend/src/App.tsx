import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RootLayout } from "./layout/RootLayout";
import { RequireAuth } from "./components/RequireAuth";
import { LandingPage } from "./pages/LandingPage";
import { useAuthStore } from "./store/authStore";

const LoginPage = lazy(() => import("./pages/LoginPage").then(module => ({ default: module.LoginPage })));
const OtpVerifyPage = lazy(() => import("./pages/OtpVerifyPage").then(module => ({ default: module.OtpVerifyPage })));
const ProfileSetupPage = lazy(() => import("./pages/ProfileSetupPage").then(module => ({ default: module.ProfileSetupPage })));
const SearchPage = lazy(() => import("./pages/SearchPage").then(module => ({ default: module.SearchPage })));
const RideDetailPage = lazy(() => import("./pages/RideDetailPage").then(module => ({ default: module.RideDetailPage })));
const BookingPaymentPage = lazy(() => import("./pages/BookingPaymentPage").then(module => ({ default: module.BookingPaymentPage })));
const BookingConfirmedPage = lazy(() => import("./pages/BookingConfirmedPage").then(module => ({ default: module.BookingConfirmedPage })));
const RateTripPage = lazy(() => import("./pages/RateTripPage").then(module => ({ default: module.RateTripPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then(module => ({ default: module.ProfilePage })));
const KycPage = lazy(() => import("./pages/KycPage").then(module => ({ default: module.KycPage })));
const VehiclePage = lazy(() => import("./pages/VehiclePage").then(module => ({ default: module.VehiclePage })));
const PlansPage = lazy(() => import("./pages/PlansPage").then(module => ({ default: module.PlansPage })));
const PostTripPage = lazy(() => import("./pages/PostTripPage").then(module => ({ default: module.PostTripPage })));
const MyTripsPage = lazy(() => import("./pages/MyTripsPage").then(module => ({ default: module.MyTripsPage })));
const LiveTripPage = lazy(() => import("./pages/LiveTripPage").then(module => ({ default: module.LiveTripPage })));
const DashboardPage = lazy(() => import("./pages/DashboardPage").then(module => ({ default: module.DashboardPage })));
const InboxPage = lazy(() => import("./pages/InboxPage").then(module => ({ default: module.InboxPage })));
const PaymentsPage = lazy(() => import("./pages/PaymentsPage").then(module => ({ default: module.PaymentsPage })));
const EmergencyContactsPage = lazy(() => import("./pages/EmergencyContactsPage").then(module => ({ default: module.EmergencyContactsPage })));
const BlockedUsersPage = lazy(() => import("./pages/BlockedUsersPage").then(module => ({ default: module.BlockedUsersPage })));
const SettingsPage = lazy(() => import("./pages/AccountPages").then(module => ({ default: module.SettingsPage })));
const SafetyPage = lazy(() => import("./pages/AccountPages").then(module => ({ default: module.SafetyPage })));
const HelpPage = lazy(() => import("./pages/AccountPages").then(module => ({ default: module.HelpPage })));

function HomeRoute() {
  const sessionToken = useAuthStore((state) => state.sessionToken);
  const user = useAuthStore((state) => state.user);
  return sessionToken ? <Navigate to={user?.name ? "/dashboard" : "/profile-setup"} replace /> : <LandingPage />;
}

function Protected({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}

export function App() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-paper text-brand" role="status">Getting your journey ready…</div>}>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/otp" element={<OtpVerifyPage />} />
          <Route path="/profile-setup" element={<Protected><ProfileSetupPage /></Protected>} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/rides/:tripId" element={<RideDetailPage />} />
          <Route path="/rides/:tripId/book" element={<Protected><BookingPaymentPage /></Protected>} />
          <Route path="/bookings/:bookingId/confirmed" element={<Protected><BookingConfirmedPage /></Protected>} />
          <Route path="/bookings/:bookingId/rate" element={<Protected><RateTripPage /></Protected>} />
          <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
          <Route path="/kyc" element={<Protected><KycPage /></Protected>} />
          <Route path="/vehicle" element={<Protected><VehiclePage /></Protected>} />
          <Route path="/plans" element={<Protected><PlansPage /></Protected>} />
          <Route path="/post" element={<Protected><PostTripPage /></Protected>} />
          <Route path="/trips" element={<Protected><MyTripsPage /></Protected>} />
          <Route path="/trips/:tripId/live" element={<Protected><LiveTripPage /></Protected>} />
          <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
          <Route path="/inbox" element={<Protected><InboxPage /></Protected>} />
          <Route path="/inbox/:tripId" element={<Protected><InboxPage /></Protected>} />
          <Route path="/payments" element={<Protected><PaymentsPage /></Protected>} />
          <Route path="/emergency-contacts" element={<Protected><EmergencyContactsPage /></Protected>} />
          <Route path="/blocked-users" element={<Protected><BlockedUsersPage /></Protected>} />
          <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
          <Route path="/safety" element={<Protected><SafetyPage /></Protected>} />
          <Route path="/help" element={<Protected><HelpPage /></Protected>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
