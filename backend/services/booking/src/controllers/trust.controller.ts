import type { Request, Response } from "express";
import { z } from "zod";
import { blockUserSchema, createReportSchema } from "@rideshare/utils";
import { createUserClient } from "../lib/supabase";
import type { AuthedRequest } from "../middleware/authenticate";
import {
  blockUser,
  createReport,
  getTrustScoreBreakdown,
  listBlockedUsers,
  unblockUser,
} from "../services/trust.service";

export async function getTrustScore(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const userId = req.query.userId ? z.string().uuid().parse(req.query.userId) : undefined;
  const breakdown = await getTrustScoreBreakdown(createUserClient(authed.accessToken), authed.authUserId, userId);
  res.json(breakdown);
}

export async function postReport(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const input = createReportSchema.parse(req.body);
  const report = await createReport(createUserClient(authed.accessToken), authed.authUserId, input);
  res.status(201).json({ report });
}

export async function postBlock(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const input = blockUserSchema.parse(req.body);
  await blockUser(createUserClient(authed.accessToken), authed.authUserId, input.blockedId);
  res.status(201).json({ blocked: true });
}

export async function deleteBlock(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const input = blockUserSchema.parse(req.body);
  await unblockUser(createUserClient(authed.accessToken), authed.authUserId, input.blockedId);
  res.json({ blocked: false });
}

export async function getBlocked(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const users = await listBlockedUsers(createUserClient(authed.accessToken), authed.authUserId);
  res.json({ users });
}
