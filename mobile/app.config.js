const fs = require("fs");
const path = require("path");

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const env = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const rootEnv = readEnvFile(path.resolve(__dirname, "../.env"));
const localEnv = readEnvFile(path.resolve(__dirname, ".env"));
const mapsKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  localEnv.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  localEnv.GOOGLE_MAPS_API_KEY ||
  rootEnv.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  rootEnv.GOOGLE_MAPS_API_KEY ||
  "";

module.exports = ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    config: {
      ...config.ios?.config,
      googleMapsApiKey: mapsKey,
    },
  },
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: {
        apiKey: mapsKey,
      },
    },
  },
  extra: {
    ...config.extra,
    googleMapsApiKey: mapsKey,
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: mapsKey,
  },
});
