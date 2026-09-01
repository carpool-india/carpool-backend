import { Router } from "express";
import rateLimit from "express-rate-limit";
import { sosTriggerSchema } from "@rideshare/utils";
import { authenticate, type AuthedRequest } from "../middleware/authenticate";
import { triggerSos } from "../services/sos.service";

// SOS is already gated behind auth, but a compromised/buggy client spamming
// this endpoint would still spam a real user's emergency contacts and admins.
const sosLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "rate_limited", message: "Too many SOS triggers. If this is a real emergency, call 112 directly." },
});

export const sosRouter = Router();
sosRouter.use(authenticate);
sosRouter.post("/", sosLimiter, async (req, res, next) => {
  try {
    const input = sosTriggerSchema.parse(req.body);
    const authed = req as AuthedRequest;
    const result = await triggerSos(authed.accessToken, authed.authUserId, input);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});
