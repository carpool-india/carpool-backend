import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { containedScrollProps } from "./containedScroll";

const CANVAS = "#F3F6F5";
const BRAND = "#0F766E";

type ScreenVariant = "hero" | "plain" | "stacked";

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  variant?: ScreenVariant;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function Screen({ children, scroll = false, variant = "plain", contentContainerStyle }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const hero = variant === "hero";

  const body = scroll ? (
    <ScrollView
      {...containedScrollProps}
      style={styles.flex}
      contentContainerStyle={[{ paddingBottom: 16 }, contentContainerStyle]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.flex}>{children}</View>
  );

  return (
    <View style={styles.root}>
      <StatusBar style={hero ? "light" : "dark"} />
      {hero ? <View pointerEvents="none" style={[styles.statusBleed, { height: insets.top, backgroundColor: BRAND }]} /> : null}
      {variant === "plain" ? <View style={{ height: insets.top, backgroundColor: CANVAS }} /> : null}
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: CANVAS,
  },
  flex: {
    flex: 1,
  },
  statusBleed: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
});
