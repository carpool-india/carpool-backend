import type { SupabaseClient } from "@supabase/supabase-js";
import { badRequest } from "../lib/errors";
import { presignUpload, publicUrl } from "../lib/r2";
import { resolveAppUserId } from "./trip.service";

export type KycDocType = "aadhaar" | "dl" | "selfie";
export type UploadTarget = "kyc" | "profile";

export function kycKey(userId: string, docType: KycDocType): string {
  return `kyc-documents/${userId}/${docType}.jpg`;
}

export function profileKey(userId: string): string {
  return `profile-photos/${userId}/profile.jpg`;
}

export async function presignUploadFor(
  client: SupabaseClient,
  supabaseAuthId: string,
  target: UploadTarget,
  docType?: KycDocType
): Promise<{ uploadUrl: string; key: string; publicUrl?: string }> {
  const userId = await resolveAppUserId(client, supabaseAuthId);

  if (target === "kyc") {
    if (!docType) {
      throw badRequest("docType is required for kyc uploads");
    }
    const key = kycKey(userId, docType);
    const uploadUrl = await presignUpload(key, "image/jpeg");
    return { uploadUrl, key };
  }

  const key = profileKey(userId);
  const uploadUrl = await presignUpload(key, "image/jpeg");
  return { uploadUrl, key, publicUrl: publicUrl(key) };
}
