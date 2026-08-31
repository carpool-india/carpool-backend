import { Router } from "express";
import { createTripSchema, uuidSchema } from "@rideshare/utils";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import {
  deleteTrip,
  getTripById,
  getTripPassengers,
  getTrips,
  patchTrip,
  postTrip,
} from "../controllers/trip.controller";

export const tripRouter = Router();

tripRouter.use(authenticate);
tripRouter.post("/", validate(createTripSchema), postTrip);
tripRouter.get("/", getTrips);
tripRouter.get("/:id", validate(z.object({ id: uuidSchema }), "params"), getTripById);
tripRouter.get(
  "/:id/passengers",
  validate(z.object({ id: uuidSchema }), "params"),
  getTripPassengers
);
tripRouter.patch("/:id", validate(z.object({ id: uuidSchema }), "params"), patchTrip);
tripRouter.delete("/:id", validate(z.object({ id: uuidSchema }), "params"), deleteTrip);
