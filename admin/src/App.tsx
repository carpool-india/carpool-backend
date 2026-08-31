import { Route, Routes } from "react-router-dom";
import { useAuth } from "./store/AuthContext";
import { LoginScreen } from "./screens/LoginScreen";
import { NotAuthorizedScreen } from "./screens/NotAuthorizedScreen";
import { AppShell } from "./layout/AppShell";
import { OverviewScreen } from "./screens/OverviewScreen";
import { SafetyScreen } from "./screens/SafetyScreen";
import { UsersScreen } from "./screens/UsersScreen";
import { KycScreen } from "./screens/KycScreen";
import { VehiclesScreen } from "./screens/VehiclesScreen";
import { TripsScreen } from "./screens/TripsScreen";
import { BookingsScreen } from "./screens/BookingsScreen";
import { SubscriptionsScreen } from "./screens/SubscriptionsScreen";
import { PaymentsScreen } from "./screens/PaymentsScreen";
import { RatingsScreen } from "./screens/RatingsScreen";

export function App() {
  const { session, status } = useAuth();

  if (!session) {
    return <LoginScreen />;
  }
  if (status === "checking") {
    return (
      <div className="login-screen text-white">
        <p className="text-sm font-semibold">Checking access…</p>
      </div>
    );
  }
  if (status === "not-authorized") {
    return <NotAuthorizedScreen />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<OverviewScreen />} />
        <Route path="/safety" element={<SafetyScreen />} />
        <Route path="/users" element={<UsersScreen />} />
        <Route path="/kyc" element={<KycScreen />} />
        <Route path="/vehicles" element={<VehiclesScreen />} />
        <Route path="/trips" element={<TripsScreen />} />
        <Route path="/bookings" element={<BookingsScreen />} />
        <Route path="/subscriptions" element={<SubscriptionsScreen />} />
        <Route path="/payments" element={<PaymentsScreen />} />
        <Route path="/ratings" element={<RatingsScreen />} />
      </Route>
    </Routes>
  );
}
