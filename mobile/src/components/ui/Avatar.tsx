import { useEffect, useState } from "react";
import { Image, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function Avatar({
  photoUrl,
  size = 40,
}: {
  photoUrl?: string | null;
  name?: string | null;
  size?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [photoUrl]);

  const showPhoto = Boolean(photoUrl) && !failed;

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2 }}>
      <View
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className="items-center justify-center bg-brand-light"
      >
        <Ionicons name="person" size={size * 0.55} color="#0F766E" />
      </View>
      {showPhoto ? (
        <Image
          source={{ uri: photoUrl as string }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity: loaded ? 1 : 0,
          }}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : null}
    </View>
  );
}
