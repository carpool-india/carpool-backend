import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export function HeaderBackButton() {
  const navigation = useNavigation();
  if (!navigation.canGoBack()) {
    return null;
  }
  return (
    <Pressable
      onPress={() => navigation.goBack()}
      hitSlop={12}
      style={{ paddingRight: 8, paddingVertical: 4 }}
    >
      <Ionicons name="chevron-back" size={26} color="#0F766E" />
    </Pressable>
  );
}
