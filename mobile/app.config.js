// Dynamic config (instead of a static app.json) so the Google Maps API key
// comes from the environment at build time and is never committed to git —
// app.json used to ship a live key in plaintext.
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

module.exports = {
  expo: {
    name: "RideShare India",
    slug: "rideshare-india",
    scheme: "rideshareindia",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    splash: {
      backgroundColor: "#0F766E",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "in.rideshareindia.app",
      config: {
        googleMapsApiKey,
      },
      infoPlist: {
        UIViewControllerBasedStatusBarAppearance: true,
        NSLocationWhenInUseUsageDescription:
          "RideShare India uses your location to match rides and share live GPS during trips.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Background location is used only during an active trip for live GPS sharing.",
        NSCameraUsageDescription: "Camera is used for KYC selfie and profile photo.",
      },
    },
    android: {
      package: "in.rideshareindia.app",
      adaptiveIcon: {
        backgroundColor: "#0F766E",
      },
      permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION", "POST_NOTIFICATIONS", "CAMERA"],
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    plugins: [
      [
        "expo-location",
        {
          isIosBackgroundLocationEnabled: true,
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true,
        },
      ],
      "expo-secure-store",
      "expo-notifications",
      [
        "expo-image-picker",
        {
          photosPermission: "Allow RideShare India to use photos for your profile and KYC.",
          cameraPermission: "Camera is used for KYC selfie and face match.",
        },
      ],
      "@react-native-community/datetimepicker",
    ],
    extra: {
      googleMapsApiKey,
      EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: googleMapsApiKey,
      eas: {
        projectId: "2df2c732-c0f8-411f-821e-5a538d4f3fb0",
      },
    },
    owner: "carpoolindia",
  },
};
