import type { Request, Response } from "express";
import { z } from "zod";
import type { AdminRequest } from "../middleware/authenticateAdmin";
import {
  cancelBookingAsAdmin,
  cancelTripAsAdmin,
  getKycSession,
  getOverview,
  listBookings,
  listEmergencyContacts,
  listKycSessions,
  listTrips,
  listUsers,
  listVehicles,
  reviewKycSession,
  updateUser,
  updateVehicle,
} from "../services/admin.service";

const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function getAdminOverview(_req: Request, res: Response): Promise<void> {
  const overview = await getOverview();
  res.json(overview);
}

export async function getAdminUsers(req: Request, res: Response): Promise<void> {
  const { page, limit } = pageSchema.parse(req.query);
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const role = typeof req.query.role === "string" ? req.query.role : undefined;
  const result = await listUsers(page, limit, search, role);
  res.json(result);
}

const updateUserSchema = z.object({
  isAdmin: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function patchAdminUser(req: Request, res: Response): Promise<void> {
  const admin = req as AdminRequest;
  const userId = z.string().uuid().parse(req.params.id);
  const patch = updateUserSchema.parse(req.body);
  const updated = await updateUser(userId, admin.adminUserId, patch);
  res.json({ user: updated });
}

export async function getAdminTrips(req: Request, res: Response): Promise<void> {
  const { page, limit } = pageSchema.parse(req.query);
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const tripType = typeof req.query.tripType === "string" ? req.query.tripType : undefined;
  const result = await listTrips(page, limit, status, tripType);
  res.json(result);
}

export async function getAdminBookings(req: Request, res: Response): Promise<void> {
  const { page, limit } = pageSchema.parse(req.query);
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const result = await listBookings(page, limit, status);
  res.json(result);
}

export async function getAdminKyc(req: Request, res: Response): Promise<void> {
  const { page, limit } = pageSchema.parse(req.query);
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const docType = typeof req.query.docType === "string" ? req.query.docType : undefined;
  const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
  const result = await listKycSessions(page, limit, status, docType, userId);
  res.json(result);
}

export async function getAdminKycById(req: Request, res: Response): Promise<void> {
  const id = z.string().uuid().parse(req.params.id);
  const session = await getKycSession(id);
  res.json(session);
}

const reviewKycSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  note: z.string().max(500).optional(),
});

export async function patchAdminKyc(req: Request, res: Response): Promise<void> {
  const admin = req as AdminRequest;
  const id = z.string().uuid().parse(req.params.id);
  const input = reviewKycSchema.parse(req.body);
  const updated = await reviewKycSession(id, admin.adminUserId, input);
  res.json({ session: updated });
}

export async function postAdminCancelTrip(req: Request, res: Response): Promise<void> {
  const tripId = z.string().uuid().parse(req.params.id);
  const trip = await cancelTripAsAdmin(tripId);
  res.json({ trip });
}

export async function postAdminCancelBooking(req: Request, res: Response): Promise<void> {
  const bookingId = z.string().uuid().parse(req.params.id);
  const booking = await cancelBookingAsAdmin(bookingId);
  res.json({ booking });
}

export async function getAdminVehicles(req: Request, res: Response): Promise<void> {
  const { page, limit } = pageSchema.parse(req.query);
  const verified =
    req.query.verified === "true" ? true : req.query.verified === "false" ? false : undefined;
  const result = await listVehicles(page, limit, verified);
  res.json(result);
}

const updateVehicleSchema = z.object({
  isVerified: z.boolean(),
});

export async function patchAdminVehicle(req: Request, res: Response): Promise<void> {
  const vehicleId = z.string().uuid().parse(req.params.id);
  const { isVerified } = updateVehicleSchema.parse(req.body);
  const vehicle = await updateVehicle(vehicleId, isVerified);
  res.json({ vehicle });
}

export async function getAdminUserContacts(req: Request, res: Response): Promise<void> {
  const userId = z.string().uuid().parse(req.params.id);
  const result = await listEmergencyContacts(userId);
  res.json(result);
}
