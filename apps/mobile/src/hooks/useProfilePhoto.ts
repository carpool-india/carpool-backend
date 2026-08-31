import { useCallback, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";

/**
 * Picks an image, uploads it to the fixed per-user storage path, and returns a
 * cache-busted public URL. The path is fixed (not unique per upload) so re-uploads
 * overwrite the previous photo rather than accumulating orphaned files; the "?t="
 * query param forces clients to fetch the new image instead of a cached copy at
 * the same URL.
 */
export function useProfilePhoto() {
  const [uploading, setUploading] = useState(false);

  const pick = useCallback(async (userId: string): Promise<string | null> => {
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
      const path = `${userId}/profile.jpg`;
      const { error } = await supabase.storage
        .from("profile-photos")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (error) {
        throw error;
      }
      const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
      return `${data.publicUrl}?t=${Date.now()}`;
    } finally {
      setUploading(false);
    }
  }, []);

  return { pick, uploading };
}
