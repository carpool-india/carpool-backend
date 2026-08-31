import { Router } from "express";
import { sosTriggerSchema } from "@rideshare/utils";
import { authenticate, type AuthedRequest } from "../middleware/authenticate";
import { triggerSos } from "../services/sos.service";

export const sosRouter = Router();
sosRouter.use(authenticate);
sosRouter.post("/", async (req, res, next) => {
  try {
    const input = sosTriggerSchema.parse(req.body);
    const authed = req as AuthedRequest;
    const result = await triggerSos(authed.accessToken, authed.authUserId, input);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});
