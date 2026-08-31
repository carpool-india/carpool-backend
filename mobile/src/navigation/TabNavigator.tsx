import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { t } from "../i18n/translations";
import { HomeScreen } from "../screens/home/HomeScreen";
import { InboxScreen } from "../screens/inbox/InboxScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { MyTripsScreen } from "../screens/profile/MyTripsScreen";
import { PostTripScreen } from "../screens/trip/PostTripScreen";
import { useAuthStore } from "../store/authStore";
import { RideTabBar } from "./RideTabBar";
import type { TabParamList } from "./types";

const Tab = createBottomTabNavigator<TabParamList>();

export function MainTabs() {
  const language = useAuthStore((state) => state.language);

  return (
    <Tab.Navigator
      tabBar={(props) => <RideTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        sceneStyle: { flex: 1, overflow: "hidden", backgroundColor: "#F3F6F5" },
      }}
    >
      <Tab.Screen
        name="SearchTab"
        component={HomeScreen}
        options={{ tabBarLabel: t(language, "tabFind"), title: t(language, "tabFind") }}
      />
      <Tab.Screen
        name="RidesTab"
        component={MyTripsScreen}
        options={{ tabBarLabel: t(language, "tabTrips"), title: t(language, "tabTrips") }}
      />
      <Tab.Screen
        name="PublishTab"
        component={PostTripScreen}
        options={{ tabBarLabel: t(language, "tabOffer"), title: t(language, "tabOffer") }}
      />
      <Tab.Screen
        name="InboxTab"
        component={InboxScreen}
        options={{ tabBarLabel: t(language, "tabInbox"), title: t(language, "tabInbox") }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: t(language, "tabYou"), title: t(language, "tabYou") }}
      />
    </Tab.Navigator>
  );
}
