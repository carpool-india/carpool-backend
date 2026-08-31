import { Router } from "express";
import { z } from "zod";
import { authenticate, type AuthedRequest } from "../middleware/authenticate";
import { createUserClient } from "../lib/supabase";
import { isOffRoute } from "../services/deviation.service";
import { HttpError } from "../lib/errors";

const schema = z.object({
  tripId: z.string().uuid(),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  expectedPolyline: z.string().min(8),
  thresholdKm: z.number().positive().max(20).optional(),
});

export const deviationRouter = Router();
deviationRouter.use(authenticate);
deviationRouter.post("/", async (req, res, next) => {
  try {
    const input = schema.parse(req.body);
    const authed = req as AuthedRequest;
    const result = isOffRoute(
      { lat: input.lat, lng: input.lng },
      input.expectedPolyline,
      input.thresholdKm ?? 2
    );
    if (result.offRoute) {
      const client = createUserClient(authed.accessToken);
      const { data: user } = await client
        .from("users")
        .select("id")
        .eq("supabase_auth_id", authed.authUserId)
        .single();
      if (!user) {
        throw new HttpError(403, "forbidden", "User profile not found");
      }
      await client.from("safety_events").insert({
        trip_id: input.tripId,
        user_id: user.id,
        event_type: "route_deviation",
        severity: result.distanceKm > 5 ? "high" : "medium",
        lat: input.lat,
        lng: input.lng,
        metadata: { distanceKm: result.distanceKm },
      });
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
});
