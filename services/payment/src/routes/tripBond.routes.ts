import type { Request, Response } from "express";
import { z } from "zod";
import { HttpError } from "../lib/errors";
import { createUserClient } from "../lib/supabase";
import type { AuthedRequest } from "../middleware/authenticate";
import { createBondOrder, pollBondStatus } from "../services/tripBond.service";

const orderSchema = z.object({ tripId: z.string().uuid() });

async function resolveAppUserId(client: ReturnType<typeof createUserClient>, supabaseAuthId: string): Promise<string> {
  const { data, error } = await client
    .from("users")
    .select("id")
    .eq("supabase_auth_id", supabaseAuthId)
    .maybeSingle();
  if (error || !data) {
    throw new HttpError(403, "forbidden", "No RideShare profile is linked to this session");
  }
  return data.id as string;
}

export async function createTripBondOrder(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const input = orderSchema.parse(req.body);
  const client = createUserClient(authed.accessToken);
  const userId = await resolveAppUserId(client, authed.authUserId);
  const result = await createBondOrder(client, userId, input.tripId);
  res.status(201).json(result);
}

export async function getTripBondStatus(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const tripId = z.string().uuid().parse(req.query.tripId);
  const client = createUserClient(authed.accessToken);
  const userId = await resolveAppUserId(client, authed.authUserId);
  const result = await pollBondStatus(client, userId, tripId);
  res.json(result);
}
