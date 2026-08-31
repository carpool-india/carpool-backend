import type { Request, Response } from "express";
import { z } from "zod";
import { adminRefundBooking, cancelSubscription, getRevenueSummary, listPayments, listSubscriptions } from "../services/admin.service";

const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function getAdminSubscriptions(req: Request, res: Response): Promise<void> {
  const { page, limit } = pageSchema.parse(req.query);
  const planType = typeof req.query.planType === "string" ? req.query.planType : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const result = await listSubscriptions(page, limit, planType, status);
  res.json(result);
}

export async function getAdminPayments(req: Request, res: Response): Promise<void> {
  const { page, limit } = pageSchema.parse(req.query);
  const type = typeof req.query.type === "string" ? req.query.type : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const result = await listPayments(page, limit, type, status);
  res.json(result);
}

export async function getAdminRevenueSummary(_req: Request, res: Response): Promise<void> {
  const summary = await getRevenueSummary();
  res.json(summary);
}

const refundSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().min(3).max(300).default("Admin refund"),
});

export async function postAdminRefund(req: Request, res: Response): Promise<void> {
  const { bookingId, reason } = refundSchema.parse(req.body);
  const result = await adminRefundBooking(bookingId, reason);
  res.json(result);
}

export async function patchAdminSubscription(req: Request, res: Response): Promise<void> {
  const id = z.string().uuid().parse(req.params.id);
  const sub = await cancelSubscription(id);
  res.json({ subscription: sub });
}
