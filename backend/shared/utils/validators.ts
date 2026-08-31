import { z } from "zod";

export const indianPhoneSchema = z
  .string()
  .regex(/^\+91[6-9]\d{9}$/, "Phone must be a valid +91 Indian mobile number");

export const uuidSchema = z.string().uuid();

export const geoPointSchema = z.object({
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
});

export const genderSchema = z.enum(["male", "female", "other"]);

export const otp6Schema = z.string().regex(/^\d{6}$/, "OTP must be 6 digits");

export const seatsSchema = z.number().int().min(1).max(4);

export const priceSchema = z.number().positive().max(20000);

export const isoDateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Must be a valid ISO date-time");

export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const luggagePolicySchema = z.enum(["none", "small", "large"]);

export const tripTypeSchema = z.enum(["intracity", "intercity"]);

export const vehicleTypeSchema = z.enum(["car", "bike"]);

export const vehicleNumberSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/, "Enter a valid vehicle number, e.g. TN09AB1234");

export const createTripSchema = z
  .object({
    originName: z.string().min(2).max(120),
    originPoint: geoPointSchema,
    destinationName: z.string().min(2).max(120),
    destinationPoint: geoPointSchema,
    routePolyline: z.string().min(8).optional(),
    departureTime: isoDateTimeSchema,
    seatsTotal: seatsSchema,
    pricePerSeat: priceSchema,
    isWomenOnly: z.boolean().optional().default(false),
    luggagePolicy: luggagePolicySchema.optional().default("small"),
    tripType: tripTypeSchema.optional().default("intracity"),
    instantBook: z.boolean().optional().default(true),
    vehicleType: vehicleTypeSchema,
    vehicleNumber: vehicleNumberSchema,
  })
  .refine((input) => input.vehicleType !== "bike" || input.seatsTotal <= 1, {
    message: "A bike can only offer 1 seat",
    path: ["seatsTotal"],
  });

export const createBookingSchema = z.object({
  tripId: uuidSchema,
  seatsBooked: seatsSchema,
  pickupPoint: geoPointSchema,
  dropoffPoint: geoPointSchema,
});

export const sosTriggerSchema = z.object({
  tripId: uuidSchema,
  bookingId: uuidSchema.optional(),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  holdDurationMs: z.number().int().min(2000),
});

export const ratingSchema = z.object({
  bookingId: uuidSchema,
  rateeId: uuidSchema,
  stars: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  tags: z.array(z.string().min(1).max(40)).max(8).optional(),
});

export const reportReasonSchema = z.enum([
  "unsafe_driving",
  "no_show",
  "harassment",
  "fraud_or_payment",
  "fake_profile",
  "other",
]);

export const createReportSchema = z.object({
  reportedId: uuidSchema,
  reason: reportReasonSchema,
  details: z.string().max(500).optional(),
  tripId: uuidSchema.optional(),
  bookingId: uuidSchema.optional(),
});

export const blockUserSchema = z.object({
  blockedId: uuidSchema,
});
