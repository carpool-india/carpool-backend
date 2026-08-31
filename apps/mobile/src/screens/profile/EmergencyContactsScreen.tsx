import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { t } from "../../i18n/translations";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { Screen } from "../../components/ui/Screen";
import { containedScrollProps } from "../../components/ui/containedScroll";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { softShadow } from "../../theme/shadows";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export function EmergencyContactsScreen() {
  const user = useAuthStore((state) => state.user);
  const language = useAuthStore((state) => state.language);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+91");
  const [relationship, setRelationship] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContacts = useCallback(async () => {
    if (!user) {
      return;
    }
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("emergency_contacts")
      .select("id, name, phone, relationship")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (!fetchError && data) {
      setContacts(data as EmergencyContact[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  async function addContact() {
    if (!user || name.trim().length < 2 || phone.trim().length < 8 || relationship.trim().length < 2) {
      setError(t(language, "contactFieldsRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    const { error: insertError } = await supabase.from("emergency_contacts").insert({
      user_id: user.id,
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship.trim(),
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setName("");
    setPhone("+91");
    setRelationship("");
    void loadContacts();
  }

  async function removeContact(id: string) {
    await supabase.from("emergency_contacts").delete().eq("id", id);
    void loadContacts();
  }

  return (
    <Screen variant="stacked">
      <View className="flex-1 px-4 pt-4">
      <Text className="mb-1 text-sm text-slate-500">{t(language, "emergencyContactsSubtitle")}</Text>

      <FlatList
        className="flex-1"
        data={contacts}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={loadContacts}
        contentContainerStyle={{ paddingVertical: 12 }}
        {...containedScrollProps}
        bounces
        ListEmptyComponent={
          !loading ? (
            <View className="mt-8 items-center px-6">
              <Ionicons name="people-outline" size={28} color="#94A3B8" />
              <Text className="mt-3 text-center text-sm text-slate-500">{t(language, "noContacts")}</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={softShadow} className="mb-2.5 flex-row items-center rounded-2xl bg-white px-4 py-3.5">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-light">
              <Ionicons name="person" size={18} color="#0F766E" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-bold text-slate-900">{item.name}</Text>
              <Text className="mt-0.5 text-xs text-slate-500">
                {item.phone} · {item.relationship}
              </Text>
            </View>
            <Pressable onPress={() => void removeContact(item.id)} className="p-2">
              <Ionicons name="trash-outline" size={18} color="#DC2626" />
            </Pressable>
          </View>
        )}
      />

      <View style={softShadow} className="mb-4 rounded-[24px] bg-white p-4">
        <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{t(language, "addContact")}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t(language, "contactName")}
          placeholderTextColor="#94A3B8"
          className="rounded-2xl bg-[#F7FAF9] px-4 py-3 font-medium text-slate-900"
        />
        <TextInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+91XXXXXXXXXX"
          placeholderTextColor="#94A3B8"
          className="mt-2 rounded-2xl bg-[#F7FAF9] px-4 py-3 font-medium text-slate-900"
        />
        <TextInput
          value={relationship}
          onChangeText={setRelationship}
          placeholder={t(language, "relationship")}
          placeholderTextColor="#94A3B8"
          className="mt-2 rounded-2xl bg-[#F7FAF9] px-4 py-3 font-medium text-slate-900"
        />
        {error ? <Text className="mt-2 text-sm text-sos">{error}</Text> : null}
        <View className="mt-3">
          <PrimaryButton label={t(language, "addContact")} loading={saving} onPress={() => void addContact()} />
        </View>
      </View>
      </View>
    </Screen>
  );
}
