import type { NextFunction, Request, Response } from "express";
import { getAdminClient } from "../lib/supabase";
import { HttpError } from "../lib/errors";
import type { AuthedRequest } from "./authenticate";

export interface AdminRequest extends AuthedRequest {
  adminUserId: string;
}

export async function authenticateAdmin(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authed = req as AuthedRequest;
    const { data, error } = await getAdminClient()
      .from("users")
      .select("id, is_admin")
      .eq("supabase_auth_id", authed.authUserId)
      .maybeSingle();
    if (error || !data || !data.is_admin) {
      throw new HttpError(403, "forbidden", "Admin access required");
    }
    (req as AdminRequest).adminUserId = data.id as string;
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
      return;
    }
    next(new HttpError(403, "forbidden", "Admin access required"));
  }
}
