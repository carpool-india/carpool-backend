import type { ScrollViewProps } from "react-native";

/** Keeps scrolling inside the page without iOS/Android edge bounce or extra inset. */
export const containedScrollProps: Pick<
  ScrollViewProps,
  | "bounces"
  | "alwaysBounceVertical"
  | "alwaysBounceHorizontal"
  | "overScrollMode"
  | "contentInsetAdjustmentBehavior"
  | "automaticallyAdjustContentInsets"
  | "automaticallyAdjustsScrollIndicatorInsets"
  | "keyboardShouldPersistTaps"
  | "showsVerticalScrollIndicator"
> = {
  bounces: false,
  alwaysBounceVertical: false,
  alwaysBounceHorizontal: false,
  overScrollMode: "never",
  contentInsetAdjustmentBehavior: "never",
  automaticallyAdjustContentInsets: false,
  automaticallyAdjustsScrollIndicatorInsets: false,
  keyboardShouldPersistTaps: "handled",
  showsVerticalScrollIndicator: false,
};
