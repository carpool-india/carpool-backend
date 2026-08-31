import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { Gender } from "@rideshare/types";
import { supabase } from "../../lib/supabase";
import { t } from "../../i18n/translations";
import { useAuthStore } from "../../store/authStore";
import { useProfilePhoto } from "../../hooks/useProfilePhoto";
import { Avatar } from "../../components/ui/Avatar";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { IconField } from "../../components/ui/IconField";
import { Screen } from "../../components/ui/Screen";

export function ProfileSetupScreen({ navigation }: { navigation: { replace: (name: string) => void } }) {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const language = useAuthStore((state) => state.language);
  const [name, setName] = useState(user?.name ?? "");
  const [gender, setGender] = useState<Gender>(user?.gender ?? "male");
  const [photoUrl, setPhotoUrl] = useState<string | null>(user?.photoUrl ?? null);
  const { pick, uploading } = useProfilePhoto();

  async function pickPhoto() {
    if (!user) {
      return;
    }
    const publicUrl = await pick(user.id);
    if (publicUrl) {
      setPhotoUrl(publicUrl);
    }
  }

  async function save() {
    if (!user || name.trim().length < 2) {
      return;
    }
    const { data: updated, error } = await supabase
      .from("users")
      .update({ name: name.trim(), gender, photo_url: photoUrl })
      .eq("id", user.id)
      .select("*")
      .single();
    if (error || !updated) {
      return;
    }
    setUser({
      ...user,
      name: updated.name as string,
      gender: updated.gender as Gender,
      photoUrl: (updated.photo_url as string | null) ?? null,
    });
    navigation.replace("Kyc");
  }

  return (
    <Screen variant="stacked" scroll>
      <View className="px-5 pt-8">
        <Text className="text-3xl font-extrabold text-slate-900">{t(language, "profileTitle")}</Text>
        <Text className="mt-2 text-slate-500">A photo and name help co-riders trust you.</Text>
        <View className="mt-6 rounded-[28px] bg-white p-4">
          <View className="mb-4 items-center">
            <Pressable onPress={() => void pickPhoto()} disabled={uploading} style={{ opacity: uploading ? 0.5 : 1 }}>
              <Avatar photoUrl={photoUrl} name={name} size={72} />
            </Pressable>
            <Pressable onPress={() => void pickPhoto()} disabled={uploading} className="mt-2">
              <Text className="text-sm font-bold text-brand">{photoUrl ? "Change photo" : "Add a photo"}</Text>
            </Pressable>
          </View>
          <IconField icon="person-outline" label={t(language, "name")} value={name} onChange={setName} />
          <Text className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{t(language, "gender")}</Text>
          <View className="flex-row gap-2">
            {(["male", "female", "other"] as const).map((value) => (
              <Pressable
                key={value}
                onPress={() => setGender(value)}
                className={`flex-1 rounded-full py-3 ${gender === value ? "bg-brand" : "bg-[#F7FAF9]"}`}
              >
                <Text className={`text-center text-sm font-bold ${gender === value ? "text-white" : "text-slate-700"}`}>
                  {t(language, value)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View className="mt-6">
          <PrimaryButton label={t(language, "save")} onPress={() => void save()} />
        </View>
      </View>
    </Screen>
  );
}
