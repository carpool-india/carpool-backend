import type { Request, Response } from "express";
import { z } from "zod";
import { createTripSchema, tripTypeSchema, uuidSchema } from "@rideshare/utils";
import { createUserClient } from "../lib/supabase";
import type { AuthedRequest } from "../middleware/authenticate";
import {
  cancelTrip,
  createTrip,
  getTrip,
  listTripPassengers,
  listTrips,
  resolveAppUserId,
  updateTrip,
} from "../services/trip.service";

const updateTripSchema = z.object({
  departureTime: z.string().datetime({ offset: true }).optional(),
  seatsTotal: z.number().int().min(1).max(4).optional(),
  pricePerSeat: z.number().positive().max(20000).optional(),
  isWomenOnly: z.boolean().optional(),
  luggagePolicy: z.enum(["none", "small", "large"]).optional(),
  tripType: tripTypeSchema.optional(),
  status: z.enum(["active", "in_progress", "completed", "cancelled"]).optional(),
  routePolyline: z.string().min(8).optional(),
});

export async function postTrip(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const input = createTripSchema.parse(req.body);
  const trip = await createTrip(createUserClient(authed.accessToken), authed.authUserId, input);
  res.status(201).json({ trip });
}

export async function getTrips(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const parsedStatus = status
    ? z.enum(["active", "in_progress", "completed", "cancelled"]).parse(status)
    : undefined;
  const client = createUserClient(authed.accessToken);
  const driverId = await resolveAppUserId(client, authed.authUserId);
  const trips = await listTrips(client, { status: parsedStatus, driverId });
  res.json({ trips });
}

export async function getTripById(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const tripId = uuidSchema.parse(req.params.id);
  const trip = await getTrip(createUserClient(authed.accessToken), tripId);
  res.json({ trip });
}

export async function getTripPassengers(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const tripId = uuidSchema.parse(req.params.id);
  const passengers = await listTripPassengers(createUserClient(authed.accessToken), authed.authUserId, tripId);
  res.json({ passengers });
}

export async function patchTrip(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const tripId = uuidSchema.parse(req.params.id);
  const input = updateTripSchema.parse(req.body);
  const trip = await updateTrip(createUserClient(authed.accessToken), authed.authUserId, tripId, input);
  res.json({ trip });
}

export async function deleteTrip(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const tripId = uuidSchema.parse(req.params.id);
  const trip = await cancelTrip(createUserClient(authed.accessToken), authed.authUserId, tripId);
  res.json({ trip });
}
