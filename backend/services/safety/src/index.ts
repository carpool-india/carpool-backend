import path from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../../../.env"), override: true });
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { loadEnv } from "./lib/env";
import { HttpError } from "./lib/errors";
import { deviationRouter } from "./routes/deviation.routes";
import { ratingRouter } from "./routes/rating.routes";
import { sosRouter } from "./routes/sos.routes";
import { adminRouter } from "./routes/admin.routes";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "safety", ts: Date.now() });
});

app.use("/sos", sosRouter);
app.use("/ratings", ratingRouter);
app.use("/deviation", deviationRouter);
app.use("/admin", adminRouter);

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
  app.listen(env.SAFETY_SERVICE_PORT, () => {
    console.log(`safety service listening on ${env.SAFETY_SERVICE_PORT}`);
  });
}

export { app };
