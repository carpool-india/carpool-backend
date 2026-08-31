import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { HttpError } from "../lib/errors";

export function validate(schema: ZodSchema, source: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      next(
        new HttpError(
          400,
          "validation_error",
          parsed.error.issues.map((issue) => issue.message).join("; ")
        )
      );
      return;
    }
    req[source] = parsed.data;
    next();
  };
}
