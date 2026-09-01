import { useCallback, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { bookingPost } from "../services/api";

/**
 * Picks an image, uploads it to the fixed per-user storage path via an R2
 * presigned URL, and returns a cache-busted public URL. The path is fixed
 * (not unique per upload) so re-uploads overwrite the previous photo rather
 * than accumulating orphaned files; the "?t=" query param forces clients to
 * fetch the new image instead of a cached copy at the same URL.
 */
export function useProfilePhoto() {
  const [uploading, setUploading] = useState(false);

  const pick = useCallback(async (_userId: string): Promise<string | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) {
      return null;
    }
    setUploading(true);
    try {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const { uploadUrl, publicUrl } = await bookingPost<{ uploadUrl: string; publicUrl: string }>(
        "/uploads/presign",
        { target: "profile" }
      );
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": "image/jpeg" },
      });
      if (!uploadRes.ok) {
        throw new Error("Unable to upload photo");
      }
      return `${publicUrl}?t=${Date.now()}`;
    } finally {
      setUploading(false);
    }
  }, []);

  return { pick, uploading };
}
