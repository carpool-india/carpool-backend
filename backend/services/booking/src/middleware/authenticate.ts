import type { NextFunction, Request, Response } from "express";
import { getAuthUser } from "../lib/supabase";
import { HttpError } from "../lib/errors";

export interface AuthedRequest extends Request {
  accessToken: string;
  authUserId: string;
  authPhone: string | undefined;
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer ")) {
      throw new HttpError(401, "unauthorized", "Missing bearer token");
    }
    const accessToken = header.slice("Bearer ".length).trim();
    const user = await getAuthUser(accessToken);
    const authed = req as AuthedRequest;
    authed.accessToken = accessToken;
    authed.authUserId = user.id;
    authed.authPhone = user.phone;
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
      return;
    }
    next(new HttpError(401, "unauthorized", "Invalid or expired session"));
  }
}
