import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { bookingPost } from "../services/api";
import { useAuthStore, type AppLanguage } from "../store/authStore";
import { t } from "../i18n/translations";
import { Alert, Card, Page, PageHeader } from "../components/ui";
import { Icon, icons } from "../components/Icon";

type DocType = "aadhaar" | "dl" | "selfie";
type StepStatus = "idle" | "uploading" | "verifying" | "pending" | "verified" | "failed";

const DOC_TYPES: DocType[] = ["aadhaar", "dl", "selfie"];

function initialStatus(user: { aadhaarVerified: boolean; dlVerified: boolean; faceMatchDone: boolean }): Record<DocType, StepStatus> {
  return {
    aadhaar: user.aadhaarVerified ? "verified" : "idle",
    dl: user.dlVerified ? "verified" : "idle",
    selfie: user.faceMatchDone ? "verified" : "idle",
  };
}

export function KycPage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const language = useAuthStore((state) => state.language);
  const [stepStatus, setStepStatus] = useState<Record<DocType, StepStatus>>(() =>
    user ? initialStatus(user) : { aadhaar: "idle", dl: "idle", selfie: "idle" },
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }
    supabase
      .from("kyc_sessions")
      .select("document_type, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(fetchError.message);
          return;
        }
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
            if (next[docType] === "verified") {
              return;
            }
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

  async function upload(docType: DocType, file: File) {
    if (!user) {
      return;
    }
    setError(null);
    setStepStatus((prev) => ({ ...prev, [docType]: "uploading" }));
    try {
      const { uploadUrl, key } = await bookingPost<{ uploadUrl: string; key: string }>("/uploads/presign", {
        target: "kyc",
        docType,
      });
      // The presigned URL is always signed for image/jpeg (backend/services/booking's
      // upload.service.ts hardcodes it, storing every doc as .jpg regardless of the
      // source file type) — sending the browser's real file.type here would mismatch
      // the signature and R2 would reject the PUT for any non-JPEG picked file.
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": "image/jpeg" },
      });
      if (!uploadRes.ok) {
        throw new Error(t(language, "kycUnableToUpload"));
      }

      const txnId = `hv_${docType}_${Date.now()}`;
      const { error: insertError } = await supabase.from("kyc_sessions").insert({
        user_id: user.id,
        document_type: docType,
        hyperverge_txn_id: txnId,
        status: "pending",
        storage_path: key,
      });
      if (insertError) {
        throw insertError;
      }

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
        setError(`${t(language, "kycUnableToVerify")} (${verifyResult.status})`);
        return;
      }

      const { data, error: fetchUserError } = await supabase.from("users").select("*").eq("id", user.id).single();
      if (fetchUserError) {
        throw fetchUserError;
      }
      if (data) {
        setUser({
          ...user,
          aadhaarVerified: Boolean(data.aadhaar_verified),
          dlVerified: Boolean(data.dl_verified),
          faceMatchDone: Boolean(data.face_match_done),
        });
      }
      setStepStatus((prev) => ({ ...prev, [docType]: "verified" }));
    } catch (err) {
      setStepStatus((prev) => ({ ...prev, [docType]: "failed" }));
      setError(err instanceof Error ? err.message : t(language, "kycUnableToVerify"));
    }
  }

  if (!user) {
    return null;
  }

  const complete = Boolean(user.aadhaarVerified && user.dlVerified && user.faceMatchDone);
  const labelFor: Record<DocType, string> = {
    aadhaar: t(language, "aadhaar"),
    dl: t(language, "drivingLicence"),
    selfie: t(language, "faceMatchDoc"),
  };
  const iconFor: Record<DocType, ReactNode> = {
    aadhaar: icons.lock,
    dl: icons.car,
    selfie: icons.person,
  };

  return (
    <Page width="md">
      <PageHeader title={t(language, "kycTitle")} subtitle={t(language, "kycBody")} />

      {error ? (
        <div className="mb-5">
          <Alert tone="red">{error}</Alert>
        </div>
      ) : null}

      {complete ? (
        <div className="mb-5">
          <Alert tone="emerald">{t(language, "kycAllDone")}</Alert>
        </div>
      ) : null}

      <div className="space-y-4">
        {DOC_TYPES.map((docType) => (
          <KycDocCard
            key={docType}
            docType={docType}
            label={labelFor[docType]}
            icon={iconFor[docType]}
            status={stepStatus[docType]}
            language={language}
            onFile={(file) => void upload(docType, file)}
          />
        ))}
      </div>
    </Page>
  );
}

function KycDocCard({
  docType,
  label,
  icon,
  status,
  language,
  onFile,
}: {
  docType: DocType;
  label: string;
  icon: ReactNode;
  status: StepStatus;
  language: AppLanguage;
  onFile: (file: File) => void;
}) {
  const inputId = `kyc-upload-${docType}`;
  const busy = status === "uploading" || status === "verifying";
  const verified = status === "verified";

  const statusLabel =
    status === "uploading"
      ? t(language, "uploadingStatus")
      : status === "verifying"
        ? t(language, "kycVerifyingStatus")
        : status === "pending"
          ? t(language, "kycPending")
          : status === "verified"
            ? t(language, "kycVerifiedDoc")
            : status === "failed"
              ? t(language, "kycFailedRetry")
              : t(language, "kycNoFileChosen");

  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-light text-brand-dark">
          <Icon path={icon} className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">{label}</p>
          <p
            className={`mt-0.5 text-xs font-semibold ${
              status === "failed" ? "text-red-600" : status === "verified" ? "text-brand-dark" : "text-ink-faint"
            }`}
          >
            {statusLabel}
          </p>
        </div>
        {verified ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white">
            <Icon path={icons.check} className="h-4 w-4" />
          </span>
        ) : null}
      </div>

      {!verified ? (
        <div className="mt-4">
          <label
            htmlFor={inputId}
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:border-brand hover:text-brand ${
              busy ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {busy ? t(language, "uploadingStatus") : status === "failed" ? t(language, "retry") : t(language, "kycUploadCta")}
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) {
                onFile(file);
              }
            }}
          />
        </div>
      ) : null}
    </Card>
  );
}
