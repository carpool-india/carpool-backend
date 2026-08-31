import { ActivityIndicator, Pressable, Text } from "react-native";
import { brandGlow } from "../../theme/shadows";

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const blocked = Boolean(disabled) && !loading;
  return (
    <Pressable
      disabled={blocked || loading}
      onPress={onPress}
      style={!blocked ? brandGlow : undefined}
      className={`flex-row items-center justify-center rounded-full py-4 ${blocked ? "bg-slate-200" : "bg-brand"}`}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} /> : null}
      <Text className={`text-base font-bold ${blocked ? "text-slate-500" : "text-white"}`}>
        {loading ? "Please wait…" : label}
      </Text>
    </Pressable>
  );
}

export function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="rounded-full border border-slate-200 bg-white py-4">
      <Text className="text-center text-base font-bold text-slate-800">{label}</Text>
    </Pressable>
  );
}
