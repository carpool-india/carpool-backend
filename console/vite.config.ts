import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const adminDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(adminDir, "..");

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, repoRoot, "");
  const mapsKey = rootEnv.VITE_GOOGLE_MAPS_API_KEY || rootEnv.GOOGLE_MAPS_API_KEY || "";
  return {
    plugins: [react()],
    server: {
      port: 5180,
    },
    define: {
      "import.meta.env.VITE_GOOGLE_MAPS_API_KEY": JSON.stringify(mapsKey),
    },
  };
});
