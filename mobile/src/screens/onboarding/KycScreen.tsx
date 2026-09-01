import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../lib/supabase";
import { bookingPost } from "../../services/api";
import { t } from "../../i18n/translations";
import { useAuthStore } from "../../store/authStore";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { DecorativeHero } from "../../components/ui/LogoMark";
import { Screen } from "../../components/ui/Screen";
import { softShadow } from "../../theme/shadows";

type DocType = "aadhaar" | "dl" | "selfie";
type StepStatus = "idle" | "uploading" | "verifying" | "pending" | "failed";

export function KycScreen({ navigation }: { navigation: { replace: (name: string) => void } }) {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const language = useAuthStore((state) => state.language);
  const [stepStatus, setStepStatus] = useState<Record<DocType, StepStatus>>({
    aadhaar: "idle",
    dl: "idle",
    selfie: "idle",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }
    void supabase
      .from("kyc_sessions")
      .select("document_type, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!data) {
          return;
        }
        const latestByDoc: Partial<Record<DocType, string>> = {};
        for (const row of data as { document_type: DocType; status: string }[]) {
          if (!(row.document_type in latestByDoc)) {
            latestByDoc[row.document_type] = row.status;
          }
        }
        setStepStatus((prev) => {
          const next = { ...prev };
          (Object.keys(latestByDoc) as DocType[]).forEach((docType) => {
            const status = latestByDoc[docType];
            if (status === "pending") {
              next[docType] = "pending";
            } else if (status === "failed" || status === "rejected") {
              next[docType] = "failed";
            }
          });
          return next;
        });
      });
  }, [user?.id]);

  async function upload(docType: DocType) {
    if (!user) {
      setError("Please sign in again to continue verification.");
      return;
    }
    setError(null);
    const capture = docType === "selfie" && Platform.OS !== "web";
    try {
      if (capture) {
        const camera = await ImagePicker.requestCameraPermissionsAsync();
        if (!camera.granted) {
          setError("Camera access is needed for face match. Enable it in Settings and try again.");
          return;
        }
      } else if (Platform.OS !== "web") {
        const library = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!library.granted) {
          setError("Photo access is needed to upload this document. Enable it in Settings and try again.");
          return;
        }
      }

      const result = capture
        ? await ImagePicker.launchCameraAsync({
            quality: 0.8,
            cameraType: ImagePicker.CameraType.front,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
          });
      if (result.canceled) {
        return;
      }
      setStepStatus((prev) => ({ ...prev, [docType]: "uploading" }));
      const blob = await (await fetch(result.assets[0].uri)).blob();
      const path = `${user.id}/${docType}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("kyc-documents")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) {
        throw uploadError;
      }
      const txnId = `hv_${docType}_${Date.now()}`;
      await supabase.from("kyc_sessions").insert({
        user_id: user.id,
        document_type: docType,
        hyperverge_txn_id: txnId,
        status: "pending",
        storage_path: path,
      });
      setStepStatus((prev) => ({ ...prev, [docType]: "verifying" }));
      const verifyResult = await bookingPost<{ verified: boolean; status: string }>("/kyc/verify", {
        docType,
        hyperVergeTxnId: txnId,
      });
      if (verifyResult.status === "pending_review") {
        setStepStatus((prev) => ({ ...prev, [docType]: "pending" }));
        return;
      }
      if (!verifyResult.verified) {
        setStepStatus((prev) => ({ ...prev, [docType]: "failed" }));
        setError(`Verification did not pass (${verifyResult.status}). Try again with a clearer photo.`);
        return;
      }
      const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
      if (data) {
        setUser({
          ...user,
          aadhaarVerified: Boolean(data.aadhaar_verified),
          dlVerified: Boolean(data.dl_verified),
          faceMatchDone: Boolean(data.face_match_done),
        });
      }
      setStepStatus((prev) => ({ ...prev, [docType]: "idle" }));
    } catch (err) {
      setStepStatus((prev) => ({ ...prev, [docType]: "failed" }));
      setError(err instanceof Error ? err.message : "Unable to verify document");
    }
  }

  const complete = Boolean(user?.aadhaarVerified && user?.faceMatchDone);

  return (
    <Screen variant="stacked" scroll>
      <DecorativeHero>
        <View className="px-6 pb-12 pt-6">
          <Text className="text-3xl font-extrabold text-white">{t(language, "kycTitle")}</Text>
          <Text className="mt-2 text-teal-100">{t(language, "kycBody")}</Text>
        </View>
      </DecorativeHero>

      <View className="-mt-6 px-4">
        <KycStep
          icon="card-outline"
          title="Aadhaar"
          done={Boolean(user?.aadhaarVerified)}
          status={stepStatus.aadhaar}
          pendingLabel={t(language, "kycPending")}
          onPress={() => void upload("aadhaar")}
        />
        <KycStep
          icon="car-outline"
          title="Driving licence"
          done={Boolean(user?.dlVerified)}
          status={stepStatus.dl}
          pendingLabel={t(language, "kycPending")}
          onPress={() => void upload("dl")}
        />
        <KycStep
          icon="camera-outline"
          title="Face match"
          done={Boolean(user?.faceMatchDone)}
          status={stepStatus.selfie}
          pendingLabel={t(language, "kycPending")}
          onPress={() => void upload("selfie")}
        />
        {error ? <Text className="mt-2 px-1 text-sm text-sos">{error}</Text> : null}
        <View className="mt-6">
          <PrimaryButton disabled={!complete} label={t(language, "continue")} onPress={() => navigation.replace("Main")} />
        </View>
      </View>
    </Screen>
  );
}

function KycStep({
  icon,
  title,
  done,
  status,
  pendingLabel,
  onPress,
}: {
  icon: "card-outline" | "car-outline" | "camera-outline";
  title: string;
  done: boolean;
  status: StepStatus;
  pendingLabel: string;
  onPress: () => void;
}) {
  const busy = status === "uploading" || status === "verifying";
  return (
    <Pressable onPress={busy ? undefined : onPress} style={softShadow} className="mb-3 flex-row items-center rounded-[24px] bg-white p-4">
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-light">
        <Ionicons name={icon} size={22} color="#0F766E" />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-base font-bold text-slate-900">{title}</Text>
        {busy ? (
          <Text className="mt-0.5 text-xs text-slate-500">
            {status === "uploading" ? "Uploading…" : "Verifying…"}
          </Text>
        ) : status === "pending" ? (
          <Text className="mt-0.5 text-xs text-brand">{pendingLabel}</Text>
        ) : status === "failed" ? (
          <Text className="mt-0.5 text-xs text-sos">Verification failed — tap to retry</Text>
        ) : null}
      </View>
      {busy ? (
        <ActivityIndicator color="#0F766E" />
      ) : (
        <Ionicons
          name={done ? "checkmark-circle" : status === "failed" ? "alert-circle" : status === "pending" ? "time-outline" : "chevron-forward"}
          size={22}
          color={done ? "#0F766E" : status === "failed" ? "#DC2626" : status === "pending" ? "#0F766E" : "#94A3B8"}
        />
      )}
    </Pressable>
  );
}
