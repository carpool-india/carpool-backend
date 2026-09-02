import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const frontendDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(frontendDir, "..");

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, repoRoot, "");
  const pick = (viteKey: string, expoKey: string, fallback = "") =>
    rootEnv[viteKey] || rootEnv[expoKey] || fallback;

  return {
    plugins: [react()],
    server: {
      port: 5181,
    },
    // @rideshare/types and @rideshare/utils are npm-workspace symlinks whose compiled
    // output is CommonJS; their real (post-symlink) path falls outside the default
    // node_modules glob Rollup's commonjs plugin uses, so it skips the CJS->ESM
    // interop transform and named-export analysis fails at build time. Widen the
    // include so both are transformed like a normal CJS dependency.
    build: {
      commonjsOptions: {
        include: [/node_modules/, /backend[\\/]shared/],
      },
    },
    optimizeDeps: {
      include: ["@rideshare/types", "@rideshare/utils"],
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(pick("VITE_SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_URL")),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
        pick("VITE_SUPABASE_ANON_KEY", "EXPO_PUBLIC_SUPABASE_ANON_KEY"),
      ),
      "import.meta.env.VITE_BOOKING_SERVICE_URL": JSON.stringify(
        pick("VITE_BOOKING_SERVICE_URL", "EXPO_PUBLIC_BOOKING_SERVICE_URL", "http://localhost:3002"),
      ),
      "import.meta.env.VITE_MATCHING_SERVICE_URL": JSON.stringify(
        pick("VITE_MATCHING_SERVICE_URL", "EXPO_PUBLIC_MATCHING_SERVICE_URL", "http://localhost:8001"),
      ),
      "import.meta.env.VITE_PAYMENT_SERVICE_URL": JSON.stringify(
        pick("VITE_PAYMENT_SERVICE_URL", "EXPO_PUBLIC_PAYMENT_SERVICE_URL", "http://localhost:3003"),
      ),
      "import.meta.env.VITE_NOTIFICATION_SERVICE_URL": JSON.stringify(
        pick("VITE_NOTIFICATION_SERVICE_URL", "EXPO_PUBLIC_NOTIFICATION_SERVICE_URL", "http://localhost:3005"),
      ),
      "import.meta.env.VITE_SAFETY_SERVICE_URL": JSON.stringify(
        pick("VITE_SAFETY_SERVICE_URL", "EXPO_PUBLIC_SAFETY_SERVICE_URL", "http://localhost:3006"),
      ),
      "import.meta.env.VITE_CENTRIFUGO_WS_URL": JSON.stringify(
        pick("VITE_CENTRIFUGO_WS_URL", "EXPO_PUBLIC_CENTRIFUGO_WS_URL", "ws://localhost:8010/connection/websocket"),
      ),
      "import.meta.env.VITE_RAZORPAY_KEY_ID": JSON.stringify(
        pick("VITE_RAZORPAY_KEY_ID", "EXPO_PUBLIC_RAZORPAY_KEY_ID"),
      ),
      "import.meta.env.VITE_GOOGLE_MAPS_API_KEY": JSON.stringify(
        pick("VITE_GOOGLE_MAPS_API_KEY", "GOOGLE_MAPS_API_KEY"),
      ),
    },
  };
});
