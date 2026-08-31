import type { Request, Response } from "express";
import { z } from "zod";
import type { AdminRequest } from "../middleware/authenticateAdmin";
import { flagUserAsAdmin, hideRating, listRatings, listSafetyEvents, resolveSafetyEvent } from "../services/admin.service";

const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function getAdminSafetyEvents(req: Request, res: Response): Promise<void> {
  const { page, limit } = pageSchema.parse(req.query);
  const eventType = typeof req.query.eventType === "string" ? req.query.eventType : undefined;
  const severity = typeof req.query.severity === "string" ? req.query.severity : undefined;
  const resolved =
    req.query.resolved === "true" ? true : req.query.resolved === "false" ? false : undefined;
  const result = await listSafetyEvents(page, limit, eventType, severity, resolved);
  res.json(result);
}

export async function postResolveSafetyEvent(req: Request, res: Response): Promise<void> {
  const admin = req as AdminRequest;
  const eventId = z.string().uuid().parse(req.params.id);
  const event = await resolveSafetyEvent(eventId, admin.adminUserId);
  res.json({ event });
}

export async function getAdminRatings(req: Request, res: Response): Promise<void> {
  const { page, limit } = pageSchema.parse(req.query);
  const maxStars = req.query.maxStars ? Number(req.query.maxStars) : undefined;
  const result = await listRatings(page, limit, maxStars);
  res.json(result);
}

export async function patchAdminHideRating(req: Request, res: Response): Promise<void> {
  const id = z.string().uuid().parse(req.params.id);
  const rating = await hideRating(id);
  res.json({ rating });
}

const flagSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(3).max(300),
});

export async function postAdminFraudFlag(req: Request, res: Response): Promise<void> {
  const { userId, reason } = flagSchema.parse(req.body);
  const event = await flagUserAsAdmin(userId, reason);
  res.json({ event });
}
