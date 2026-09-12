import type { NextFunction, Request, Response } from "express";

// /push, /sms, /whatsapp/booking, and /sos are meant to be called by other backend
// services only — never directly by the mobile app. When a secret is configured,
// every request must present it via x-internal-secret or get rejected outright.
// When no secret is configured (bare dev/local runs), the check is a no-op so the
// service still works without a full .env.
export function createRequireInternalSecret(secret: string | undefined) {
  return function requireInternalSecret(req: Request, res: Response, next: NextFunction): void {
    if (!secret) {
      next();
      return;
    }
    if (req.header("x-internal-secret") !== secret) {
      res.status(401).json({ error: "unauthorized", message: "Missing or invalid internal service credential" });
      return;
    }
    next();
  };
}
