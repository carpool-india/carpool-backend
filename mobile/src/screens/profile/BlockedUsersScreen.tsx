import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { bookingDelete, bookingGet } from "../../services/api";
import { t } from "../../i18n/translations";
import { useAuthStore } from "../../store/authStore";
import { Avatar } from "../../components/ui/Avatar";
import { Screen } from "../../components/ui/Screen";
import { containedScrollProps } from "../../components/ui/containedScroll";
import { softShadow } from "../../theme/shadows";

interface BlockedUser {
  id: string;
  name: string | null;
  photoUrl: string | null;
}

export function BlockedUsersScreen() {
  const language = useAuthStore((state) => state.language);
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    bookingGet<{ users: BlockedUser[] }>("/trust/blocks")
      .then((res) => setUsers(res.users))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function unblock(userId: string) {
    setUnblockingId(userId);
    try {
      await bookingDelete("/trust/blocks", { blockedId: userId });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      /* leave the row in place if the request failed */
    } finally {
      setUnblockingId(null);
    }
  }

  return (
    <Screen variant="stacked">
      <View className="flex-1 px-4 pt-4">
        <Text className="mb-1 text-sm text-slate-500">{t(language, "blockedUsersSubtitle")}</Text>
        <FlatList
          className="flex-1"
          data={users}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          onRefresh={load}
          contentContainerStyle={{ paddingVertical: 12 }}
          {...containedScrollProps}
          bounces
          ListEmptyComponent={
            !loading ? (
              <View className="mt-8 items-center px-6">
                <Ionicons name="ban-outline" size={28} color="#94A3B8" />
                <Text className="mt-3 text-center text-sm text-slate-500">{t(language, "noBlockedUsers")}</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={softShadow} className="mb-2.5 flex-row items-center rounded-2xl bg-white px-4 py-3.5">
              <Avatar photoUrl={item.photoUrl} name={item.name} size={40} />
              <Text className="ml-3 flex-1 font-bold text-slate-900">{item.name ?? t(language, "unknownUser")}</Text>
              <Pressable
                disabled={unblockingId === item.id}
                onPress={() => void unblock(item.id)}
                className="rounded-full bg-[#F4F7F6] px-3.5 py-2"
              >
                {unblockingId === item.id ? (
                  <ActivityIndicator color="#0F766E" size="small" />
                ) : (
                  <Text className="text-xs font-bold text-slate-700">{t(language, "unblockUserAction")}</Text>
                )}
              </Pressable>
            </View>
          )}
        />
      </View>
    </Screen>
  );
}
