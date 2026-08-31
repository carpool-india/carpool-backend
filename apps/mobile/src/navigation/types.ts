import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps, NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

export type TabParamList = {
  SearchTab: undefined;
  PublishTab: undefined;
  RidesTab: undefined;
  InboxTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  OtpVerify: { phone: string };
  ProfileSetup: undefined;
  Kyc: undefined;
  Main: NavigatorScreenParams<TabParamList> | undefined;
  SearchResults: undefined;
  RideDetail: { tripId: string };
  Booking: { tripId: string };
  BookingConfirm: { bookingId: string };
  ActiveTrip: undefined;
  Chat: { tripId: string };
  TripPassengers: { tripId: string };
  RateTrip: undefined;
  EmergencyContacts: undefined;
  Vehicle: undefined;
  Language: undefined;
  Payments: undefined;
  Help: undefined;
  Plans: undefined;
};

export type TabScreenProps<RouteName extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, RouteName>,
  NativeStackScreenProps<RootStackParamList>
>;
