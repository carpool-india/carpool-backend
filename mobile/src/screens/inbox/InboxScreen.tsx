import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { Booking } from "@rideshare/types";
import { bookingGet } from "../../services/api";
import { navigateRoot } from "../../navigation/navigateRoot";
import { t } from "../../i18n/translations";
import type { TabScreenProps } from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import { ErrorRetry } from "../../components/ui/ErrorRetry";
import { Screen } from "../../components/ui/Screen";
import { containedScrollProps } from "../../components/ui/containedScroll";
import { softShadow } from "../../theme/shadows";

interface ChatPreview {
  tripId: string;
  originName: string;
  destinationName: string;
  lastMessageBody: string;
  lastMessageSenderName: string | null;
  lastMessageAt: string;
}

interface InboxItem {
  id: string;
  title: string;
  body: string;
  time: string;
  timestamp: number;
  tone: "safety" | "booking" | "chat";
  tripId?: string;
}

export function InboxScreen({ navigation }: TabScreenProps<"InboxTab">) {
  const language = useAuthStore((state) => state.language);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [chatPreviews, setChatPreviews] = useState<ChatPreview[]>([]);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(() => {
    setLoadError(false);
    Promise.all([
      bookingGet<{ bookings: Booking[] }>("/bookings/me").then((payload) => payload.bookings),
      bookingGet<{ previews: ChatPreview[] }>("/chat/mine").then((payload) => payload.previews),
    ])
      .then(([nextBookings, nextPreviews]) => {
        setBookings(nextBookings);
        setChatPreviews(nextPreviews);
      })
      .catch(() => setLoadError(true));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const messages = useMemo<InboxItem[]>(() => {
    const fromBookings: InboxItem[] = bookings.map((booking) => {
      const route = booking.trip ? `${booking.trip.originName} → ${booking.trip.destinationName}. ` : "";
      const createdAt = new Date(booking.createdAt).getTime();
      return {
        id: `booking-${booking.id}`,
        title: booking.status === "confirmed" ? "Booking confirmed" : `Ride ${booking.status}`,
        body:
          booking.status === "confirmed"
            ? `${route}UPI escrow captured. Your ride is confirmed.`
            : `${route}Booking ${booking.id.slice(0, 8)} · ${booking.seatsBooked} seat(s)`,
        time: new Date(booking.createdAt).toLocaleString("en-IN"),
        timestamp: createdAt,
        tone: "booking",
      };
    });

    const fromChats: InboxItem[] = chatPreviews.map((preview) => {
      const timestamp = new Date(preview.lastMessageAt).getTime();
      return {
        id: `chat-${preview.tripId}`,
        title: `${preview.originName} → ${preview.destinationName}`,
        body: preview.lastMessageSenderName
          ? `${preview.lastMessageSenderName}: ${preview.lastMessageBody}`
          : preview.lastMessageBody,
        time: new Date(preview.lastMessageAt).toLocaleString("en-IN"),
        timestamp,
        tone: "chat",
        tripId: preview.tripId,
      };
    });

    const safetyItem: InboxItem = {
      id: "safety",
      title: "Safety is on for every ride",
      body: "Live GPS tracking and a 2s SOS hold to alert 112.",
      time: "RideShare India",
      timestamp: Number.POSITIVE_INFINITY,
      tone: "safety",
    };

    return [safetyItem, ...fromChats, ...fromBookings].sort((a, b) => b.timestamp - a.timestamp);
  }, [bookings, chatPreviews]);

  return (
    <Screen variant="plain">
      <Text className="px-5 pt-3 text-3xl font-extrabold text-slate-900">{t(language, "tabInbox")}</Text>
      {loadError ? (
        <ErrorRetry language={language} onRetry={load} />
      ) : (
      <FlatList
        className="mt-4 flex-1 px-4"
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 16 }}
        {...containedScrollProps}
        ListEmptyComponent={<Text className="mt-10 text-center text-slate-500">{t(language, "inboxEmpty")}</Text>}
        renderItem={({ item }) => (
          <Pressable
            disabled={item.tone !== "chat"}
            onPress={() => {
              if (item.tripId) {
                navigateRoot(navigation, "Chat", { tripId: item.tripId });
              }
            }}
            style={softShadow}
            className="mb-3 flex-row rounded-[24px] bg-white p-4"
          >
            <View
              className={`h-11 w-11 items-center justify-center rounded-2xl ${
                item.tone === "safety" ? "bg-red-50" : item.tone === "chat" ? "bg-brand-light" : "bg-slate-100"
              }`}
            >
              <Ionicons
                name={item.tone === "safety" ? "shield-checkmark" : item.tone === "chat" ? "chatbubble-ellipses" : "receipt-outline"}
                size={20}
                color={item.tone === "safety" ? "#DC2626" : item.tone === "chat" ? "#0F766E" : "#475569"}
              />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-extrabold text-slate-900">{item.title}</Text>
              <Text className="mt-1 text-sm leading-5 text-slate-600" numberOfLines={2}>
                {item.body}
              </Text>
              <Text className="mt-1.5 text-xs font-medium text-slate-400">{item.time}</Text>
            </View>
            {item.tone === "chat" ? <Ionicons name="chevron-forward" size={16} color="#94A3B8" /> : null}
          </Pressable>
        )}
      />
      )}
    </Screen>
  );
}
