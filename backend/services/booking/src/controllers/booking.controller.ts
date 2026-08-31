import type { Request, Response } from "express";
import { z } from "zod";
import { createBookingSchema, uuidSchema } from "@rideshare/utils";
import { createUserClient } from "../lib/supabase";
import type { AuthedRequest } from "../middleware/authenticate";
import {
  cancelBooking,
  createBooking,
  getBooking,
  listMyBookings,
  respondToBooking,
  startTrip,
} from "../services/booking.service";
import { generateInvoicePdf } from "../services/invoice.service";
import { getTrip } from "../services/trip.service";
import { buildPriceBreakdown } from "../services/invoice.service";

const cancelSchema = z.object({
  reason: z.string().min(3).max(240),
  cancelledBy: z.enum(["passenger", "driver"]),
});

const respondSchema = z.object({
  decision: z.enum(["accept", "reject"]),
});

export async function postBooking(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const input = createBookingSchema.parse(req.body);
  const result = await createBooking(createUserClient(authed.accessToken), authed.authUserId, input);
  res.status(201).json(result);
}

export async function postCancel(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const bookingId = uuidSchema.parse(req.params.id);
  const input = cancelSchema.parse(req.body);
  const result = await cancelBooking(
    createUserClient(authed.accessToken),
    authed.authUserId,
    bookingId,
    input.cancelledBy,
    input.reason
  );
  res.json(result);
}

export async function postRespond(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const bookingId = uuidSchema.parse(req.params.id);
  const input = respondSchema.parse(req.body);
  const booking = await respondToBooking(
    createUserClient(authed.accessToken),
    authed.authUserId,
    bookingId,
    input.decision
  );
  res.json({ booking });
}

export async function postStartTrip(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const bookingId = uuidSchema.parse(req.params.id);
  const booking = await startTrip(createUserClient(authed.accessToken), authed.authUserId, bookingId);
  res.json({ booking });
}

export async function getMyBookings(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const bookings = await listMyBookings(createUserClient(authed.accessToken), authed.authUserId);
  res.json({ bookings });
}

export async function getBookingInvoice(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const bookingId = uuidSchema.parse(req.params.id);
  const client = createUserClient(authed.accessToken);
  const booking = await getBooking(client, bookingId);
  const trip = await getTrip(client, booking.tripId);
  const pdf = generateInvoicePdf({
    invoiceNumber: `RSI-${booking.id.slice(0, 8).toUpperCase()}`,
    bookingId: booking.id,
    passengerName: authed.authPhone ?? "Passenger",
    driverName: "Driver",
    originName: trip.originName,
    destinationName: trip.destinationName,
    departureTime: trip.departureTime,
    breakdown: buildPriceBreakdown(trip.pricePerSeat, booking.seatsBooked),
  });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="invoice-${booking.id}.pdf"`);
  res.send(pdf);
}
