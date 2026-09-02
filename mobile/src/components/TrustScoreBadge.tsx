import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { trustLabel } from "../utils/trustScore";
import { TrustScoreSheet } from "./TrustScoreSheet";
import { useAuthStore } from "../store/authStore";

export function TrustScoreBadge({
  score,
  userId,
  light,
}: {
  score: number;
  userId?: string;
  light?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const language = useAuthStore((state) => state.language);
  const selfId = useAuthStore((state) => state.user?.id);

  return (
    <>
      <Pressable
        disabled={!userId}
        onPress={() => setOpen(true)}
        className="flex-row items-center rounded-full px-2.5 py-1"
        style={light ? { backgroundColor: "rgba(255,255,255,0.22)" } : { backgroundColor: "#CCFBF1" }}
      >
        <Ionicons name="shield-checkmark" size={12} color={light ? "#FFFFFF" : "#0F766E"} />
        <Text className={`ml-1 text-xs font-bold ${light ? "text-white" : "text-brand-dark"}`}>
          {score} {trustLabel(score)}
        </Text>
      </Pressable>
      {userId ? (
        <TrustScoreSheet
          visible={open}
          onClose={() => setOpen(false)}
          userId={userId}
          isSelf={userId === selfId}
          language={language}
        />
      ) : null}
    </>
  );
}
