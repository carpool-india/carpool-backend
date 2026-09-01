import path from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../../../.env"), override: true });
import express, { type NextFunction, type Request, type Response } from "express";
import "express-async-errors";
import cors from "cors";
import helmet from "helmet";
import { loadEnv } from "./lib/env";
import { HttpError } from "./lib/errors";
import { bookingRouter } from "./routes/booking.routes";
import { tripRouter } from "./routes/trip.routes";
import { kycRouter } from "./routes/kyc.routes";
import { adminRouter } from "./routes/admin.routes";
import { geoRouter } from "./routes/geo.routes";
import { chatRouter } from "./routes/chat.routes";
import { trustRouter } from "./routes/trust.routes";
import { accountRouter } from "./routes/account.routes";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
// CORS_ORIGIN unset -> permissive (current/dev behavior). Set it once the console's
// domain is known to restrict browser access to just that origin; mobile isn't
// subject to CORS so this never affects the app.
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors(corsOrigin ? { origin: corsOrigin.split(",").map((value) => value.trim()) } : undefined));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "booking", ts: Date.now() });
});

app.use("/trips", tripRouter);
app.use("/bookings", bookingRouter);
app.use("/kyc", kycRouter);
app.use("/geo", geoRouter);
app.use("/admin", adminRouter);
app.use("/chat", chatRouter);
app.use("/trust", trustRouter);
app.use("/account", accountRouter);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.code, message: error.message });
    return;
  }
  const message = error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({ error: "internal_error", message });
});

if (process.env.NODE_ENV !== "test") {
  const env = loadEnv();
  app.listen(env.BOOKING_SERVICE_PORT, () => {
    console.log(`booking service listening on ${env.BOOKING_SERVICE_PORT}`);
  });
}

export { app };
