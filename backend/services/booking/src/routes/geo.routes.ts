import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { getGeocode, getPlace, getReverse, getSuggest } from "../controllers/geo.controller";

const querySchema = z.object({
  q: z.string().trim().min(2).max(160),
});

const placeIdSchema = z.object({
  placeId: z.string().trim().min(3).max(256),
});

const reverseSchema = z.object({
  lat: z.coerce.number().gte(-90).lte(90),
  lng: z.coerce.number().gte(-180).lte(180),
});

export const geoRouter = Router();

geoRouter.use(authenticate);
geoRouter.get("/suggest", validate(querySchema, "query"), getSuggest);
geoRouter.get("/geocode", validate(querySchema, "query"), getGeocode);
geoRouter.get("/place", validate(placeIdSchema, "query"), getPlace);
geoRouter.get("/reverse", validate(reverseSchema, "query"), getReverse);
