import type { Request, Response } from "express";
import { z } from "zod";
import { createUserClient } from "../lib/supabase";
import type { AuthedRequest } from "../middleware/authenticate";
import { verifyKycDocument } from "../services/kyc.service";

export const verifyKycSchema = z.object({
  docType: z.enum(["aadhaar", "dl", "selfie"]),
  hyperVergeTxnId: z.string().min(4),
});

export async function postKycVerify(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const input = verifyKycSchema.parse(req.body);
  const result = await verifyKycDocument(createUserClient(authed.accessToken), authed.authUserId, input);
  res.json(result);
}
