import { Router } from "express";
import { z } from "zod";
import { createBookingSchema, uuidSchema } from "@rideshare/utils";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import {
  getBookingInvoice,
  getMyBookings,
  postBooking,
  postCancel,
  postRespond,
  postStartTrip,
} from "../controllers/booking.controller";

export const bookingRouter = Router();

bookingRouter.use(authenticate);
bookingRouter.post("/", validate(createBookingSchema), postBooking);
bookingRouter.get("/me", getMyBookings);
bookingRouter.post(
  "/:id/respond",
  validate(z.object({ id: uuidSchema }), "params"),
  postRespond
);
bookingRouter.post(
  "/:id/start",
  validate(z.object({ id: uuidSchema }), "params"),
  postStartTrip
);
bookingRouter.post(
  "/:id/cancel",
  validate(z.object({ id: uuidSchema }), "params"),
  postCancel
);
bookingRouter.get(
  "/:id/invoice",
  validate(z.object({ id: uuidSchema }), "params"),
  getBookingInvoice
);
