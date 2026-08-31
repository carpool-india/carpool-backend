import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { postKycVerify, verifyKycSchema } from "../controllers/kyc.controller";

export const kycRouter = Router();

kycRouter.use(authenticate);
kycRouter.post("/verify", validate(verifyKycSchema), postKycVerify);
