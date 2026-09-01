import type { Request, Response } from "express";
import { createUserClient } from "../lib/supabase";
import type { AuthedRequest } from "../middleware/authenticate";
import { deleteAccount } from "../services/account.service";

export async function postDeleteAccount(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const result = await deleteAccount(createUserClient(authed.accessToken), authed.authUserId);
  res.json({ deleted: true, ...result });
}
