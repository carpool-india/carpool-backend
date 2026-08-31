import { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { OtpVerifyScreen } from "../screens/auth/OtpVerifyScreen";
import { ProfileSetupScreen } from "../screens/onboarding/ProfileSetupScreen";
import { KycScreen } from "../screens/onboarding/KycScreen";
import { SearchResultsScreen } from "../screens/trip/SearchResultsScreen";
import { RideDetailScreen } from "../screens/trip/RideDetailScreen";
import { BookingScreen } from "../screens/trip/BookingScreen";
import { BookingConfirmScreen } from "../screens/trip/BookingConfirmScreen";
import { ActiveTripScreen } from "../screens/trip/ActiveTripScreen";
import { ChatScreen } from "../screens/trip/ChatScreen";
import { TripPassengersScreen } from "../screens/trip/TripPassengersScreen";
import { RateTripScreen } from "../screens/trip/RateTripScreen";
import { EmergencyContactsScreen } from "../screens/profile/EmergencyContactsScreen";
import { VehicleScreen } from "../screens/profile/VehicleScreen";
import { LanguageScreen } from "../screens/profile/LanguageScreen";
import { PaymentsScreen } from "../screens/profile/PaymentsScreen";
import { HelpScreen } from "../screens/profile/HelpScreen";
import { PlansScreen } from "../screens/profile/PlansScreen";
import { t } from "../i18n/translations";
import { registerFcmToken } from "../services/fcm";
import { useAuthStore } from "../store/authStore";
import { HeaderBackButton } from "../components/ui/HeaderBackButton";
import { MainTabs } from "./TabNavigator";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const overlayOptions = {
  headerShown: true,
  headerTintColor: "#0F766E",
  headerTitleStyle: { fontWeight: "700" as const },
  headerBackButtonDisplayMode: "minimal" as const,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: "#F3F6F5" },
  contentStyle: { flex: 1, backgroundColor: "#F3F6F5", overflow: "hidden" as const },
  headerLeft: () => <HeaderBackButton />,
};

export function RootNavigator() {
  const token = useAuthStore((state) => state.sessionToken);
  const user = useAuthStore((state) => state.user);
  const language = useAuthStore((state) => state.language);
  const initial = !token ? "Login" : !user?.name ? "ProfileSetup" : !user.aadhaarVerified ? "Kyc" : "Main";

  useEffect(() => {
    if (token) {
      void registerFcmToken();
    }
  }, [token]);

  return (
    <Stack.Navigator
      initialRouteName={initial}
      screenOptions={{ headerShown: false, contentStyle: { flex: 1, backgroundColor: "#F3F6F5" } }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} options={{ ...overlayOptions, title: "" }} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ ...overlayOptions, title: "" }} />
      <Stack.Screen name="Kyc" component={KycScreen} options={{ ...overlayOptions, title: "" }} />
      <Stack.Screen name="Main" component={MainTabs} options={{ contentStyle: { flex: 1, overflow: "hidden" } }} />
      <Stack.Screen name="SearchResults" component={SearchResultsScreen} options={{ ...overlayOptions, title: "Matches" }} />
      <Stack.Screen name="RideDetail" component={RideDetailScreen} options={{ ...overlayOptions, title: "Ride" }} />
      <Stack.Screen name="Booking" component={BookingScreen} options={{ ...overlayOptions, title: "Booking" }} />
      <Stack.Screen name="BookingConfirm" component={BookingConfirmScreen} options={{ ...overlayOptions, title: "Confirmation" }} />
      <Stack.Screen name="ActiveTrip" component={ActiveTripScreen} options={{ ...overlayOptions, title: "Live trip" }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ ...overlayOptions, title: t(language, "chatTitle") }} />
      <Stack.Screen
        name="TripPassengers"
        component={TripPassengersScreen}
        options={{ ...overlayOptions, title: t(language, "tripPassengersTitle") }}
      />
      <Stack.Screen name="RateTrip" component={RateTripScreen} options={{ ...overlayOptions, title: "Rate trip" }} />
      <Stack.Screen
        name="EmergencyContacts"
        component={EmergencyContactsScreen}
        options={{ ...overlayOptions, title: t(language, "emergencyContacts") }}
      />
      <Stack.Screen name="Vehicle" component={VehicleScreen} options={{ ...overlayOptions, title: t(language, "myVehicle") }} />
      <Stack.Screen name="Language" component={LanguageScreen} options={{ ...overlayOptions, title: t(language, "language") }} />
      <Stack.Screen name="Payments" component={PaymentsScreen} options={{ ...overlayOptions, title: t(language, "payments") }} />
      <Stack.Screen name="Help" component={HelpScreen} options={{ ...overlayOptions, title: t(language, "helpSafety") }} />
      <Stack.Screen name="Plans" component={PlansScreen} options={{ ...overlayOptions, title: t(language, "myPlans") }} />
    </Stack.Navigator>
  );
}
