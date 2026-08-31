import type { NextFunction, Request, Response } from "express";
import { getAuthUser } from "../lib/supabase";
import { HttpError } from "../lib/errors";

export interface AuthedRequest extends Request {
  accessToken: string;
  authUserId: string;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer ")) {
      throw new HttpError(401, "unauthorized", "Missing bearer token");
    }
    const token = header.slice(7).trim();
    const user = await getAuthUser(token);
    (req as AuthedRequest).accessToken = token;
    (req as AuthedRequest).authUserId = user.id;
    next();
  } catch (error) {
    next(error);
  }
}
