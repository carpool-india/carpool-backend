import { useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useChat, type ChatMessage } from "../../hooks/useChat";
import { Avatar } from "../../components/ui/Avatar";
import { t } from "../../i18n/translations";
import { useAuthStore } from "../../store/authStore";

export function ChatScreen({ route }: { route: { params: { tripId: string } } }) {
  const language = useAuthStore((state) => state.language);
  const userId = useAuthStore((state) => state.user?.id);
  const { messages, send, loading, error } = useChat(route.params.tripId);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const insets = useSafeAreaInsets();

  async function submit() {
    const body = draft.trim();
    if (!body || sending) {
      return;
    }
    setDraft("");
    setSending(true);
    try {
      await send(body);
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F3F6F5]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <FlatList
        className="flex-1 px-4"
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
        ListEmptyComponent={
          !loading ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-slate-400">{t(language, "chatEmpty")}</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <Bubble message={item} isOwn={item.senderId === userId} />}
      />
      {error ? <Text className="px-4 pb-1 text-xs text-sos">{error}</Text> : null}
      <View
        className="flex-row items-center border-t border-slate-100 bg-white px-3 py-2.5"
        style={{ paddingBottom: Math.max(insets.bottom, 10) }}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={t(language, "chatPlaceholder")}
          placeholderTextColor="#94A3B8"
          multiline
          className="mr-2 max-h-24 flex-1 rounded-2xl bg-[#F4F7F6] px-4 py-2.5 text-[15px] text-slate-900"
        />
        <Pressable
          onPress={() => void submit()}
          disabled={!draft.trim() || sending}
          className={`h-10 w-10 items-center justify-center rounded-full ${draft.trim() ? "bg-brand" : "bg-slate-200"}`}
        >
          <Ionicons name="send" size={17} color={draft.trim() ? "#FFFFFF" : "#94A3B8"} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) {
  const time = new Date(message.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  return (
    <View className={`mb-3 flex-row items-end ${isOwn ? "justify-end" : "justify-start"}`}>
      {!isOwn ? (
        <View className="mr-2">
          <Avatar photoUrl={message.senderPhotoUrl} size={28} />
        </View>
      ) : null}
      <View
        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 ${isOwn ? "bg-brand" : "bg-white"}`}
        style={isOwn ? undefined : { borderWidth: 1, borderColor: "#F1F5F4" }}
      >
        {!isOwn && message.senderName ? (
          <Text className="mb-0.5 text-[11px] font-bold text-brand">{message.senderName}</Text>
        ) : null}
        <Text className={`text-[15px] leading-5 ${isOwn ? "text-white" : "text-slate-900"}`}>{message.body}</Text>
        <Text className={`mt-1 text-[10px] ${isOwn ? "text-teal-100" : "text-slate-400"}`}>{time}</Text>
      </View>
    </View>
  );
}
