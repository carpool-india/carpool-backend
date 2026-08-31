import { Image, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function Avatar({
  photoUrl,
  size = 40,
}: {
  photoUrl?: string | null;
  name?: string | null;
  size?: number;
}) {
  if (photoUrl) {
    return (
      <Image source={{ uri: photoUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} />
    );
  }
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center bg-brand-light"
    >
      <Ionicons name="person" size={size * 0.55} color="#0F766E" />
    </View>
  );
}
