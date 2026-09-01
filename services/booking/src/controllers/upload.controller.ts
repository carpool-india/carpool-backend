import type { Request, Response } from "express";
import { z } from "zod";
import { createUserClient } from "../lib/supabase";
import type { AuthedRequest } from "../middleware/authenticate";
import { presignUploadFor } from "../services/upload.service";

const presignSchema = z.object({
  target: z.enum(["kyc", "profile"]),
  docType: z.enum(["aadhaar", "dl", "selfie"]).optional(),
});

export async function postPresignUpload(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const input = presignSchema.parse(req.body);
  const result = await presignUploadFor(
    createUserClient(authed.accessToken),
    authed.authUserId,
    input.target,
    input.docType
  );
  res.json(result);
}
