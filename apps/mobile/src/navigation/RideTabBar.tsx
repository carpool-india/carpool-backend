import { Pressable, StyleSheet, Text, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { t, type TranslationKey } from "../i18n/translations";
import { useAuthStore } from "../store/authStore";
import type { TabParamList } from "./types";

type IonName = ComponentProps<typeof Ionicons>["name"];

const TABS: Record<keyof TabParamList, { label: TranslationKey; icon: IonName; iconOn: IonName }> = {
  SearchTab: { label: "tabFind", icon: "map-outline", iconOn: "map" },
  RidesTab: { label: "tabTrips", icon: "car-outline", iconOn: "car" },
  PublishTab: { label: "tabOffer", icon: "add-circle-outline", iconOn: "add-circle" },
  InboxTab: { label: "tabInbox", icon: "file-tray-full-outline", iconOn: "file-tray-full" },
  ProfileTab: { label: "tabYou", icon: "person-outline", iconOn: "person" },
};

export function RideTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const language = useAuthStore((store) => store.language);
  const bottom = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.wrap, { paddingBottom: bottom }]}>
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const meta = TABS[route.name as keyof TabParamList];
          const focused = state.index === index;
          const color = focused ? "#0F766E" : "#94A3B8";
          const label = t(language, meta.label);

          function onPress() {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              style={styles.item}
            >
              <View style={[styles.mark, focused && styles.markOn]} />
              <Ionicons name={focused ? meta.iconOn : meta.icon} size={22} color={color} />
              <Text style={[styles.label, { color }]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    height: 56,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
  },
  mark: {
    height: 3,
    width: 18,
    marginBottom: 4,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  markOn: {
    backgroundColor: "#0F766E",
  },
  label: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
  },
});
