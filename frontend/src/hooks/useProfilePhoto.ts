import { useCallback, useState } from "react";
import { bookingPost } from "../services/api";

/**
 * Uploads a picked image to the fixed per-user storage path via an R2 presigned
 * URL, and returns a cache-busted public URL. The path is fixed (not unique per
 * upload) so re-uploads overwrite the previous photo; the "?t=" query param
 * forces clients to fetch the new image instead of a cached copy at the same URL.
 */
export function useProfilePhoto() {
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const { uploadUrl, publicUrl } = await bookingPost<{ uploadUrl: string; publicUrl: string }>(
        "/uploads/presign",
        { target: "profile" },
      );
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "image/jpeg" },
      });
      if (!uploadRes.ok) {
        throw new Error("Unable to upload photo");
      }
      return `${publicUrl}?t=${Date.now()}`;
    } finally {
      setUploading(false);
    }
  }, []);

  return { upload, uploading };
}
