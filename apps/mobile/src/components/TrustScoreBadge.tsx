import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { trustLabel } from "../utils/trustScore";

export function TrustScoreBadge({ score, light }: { score: number; light?: boolean }) {
  return (
    <View
      className="flex-row items-center rounded-full px-2.5 py-1"
      style={light ? { backgroundColor: "rgba(255,255,255,0.22)" } : { backgroundColor: "#CCFBF1" }}
    >
      <Ionicons name="shield-checkmark" size={12} color={light ? "#FFFFFF" : "#0F766E"} />
      <Text className={`ml-1 text-xs font-bold ${light ? "text-white" : "text-brand-dark"}`}>
        {score} {trustLabel(score)}
      </Text>
    </View>
  );
}
