import type { Request, Response } from "express";
import { z } from "zod";
import { uuidSchema } from "@rideshare/utils";
import { createUserClient } from "../lib/supabase";
import type { AuthedRequest } from "../middleware/authenticate";
import { issueChatToken, listMessages, listMyChatPreviews, sendMessage } from "../services/chat.service";

const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(1000),
});

export async function getMyChatPreviews(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const previews = await listMyChatPreviews(createUserClient(authed.accessToken), authed.authUserId);
  res.json({ previews });
}

export async function getChatToken(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const tripId = uuidSchema.parse(req.params.tripId);
  const result = await issueChatToken(createUserClient(authed.accessToken), authed.authUserId, tripId);
  res.json(result);
}

export async function getMessages(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const tripId = uuidSchema.parse(req.params.tripId);
  const messages = await listMessages(createUserClient(authed.accessToken), authed.authUserId, tripId);
  res.json({ messages });
}

export async function postMessage(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const tripId = uuidSchema.parse(req.params.tripId);
  const input = sendMessageSchema.parse(req.body);
  const message = await sendMessage(createUserClient(authed.accessToken), authed.authUserId, tripId, input.body);
  res.status(201).json({ message });
}
