import type { Request, Response } from "express";
import { placeDetails, requireGeocode, reverseGeocodePlace, suggestPlaces } from "../services/geo.service";
import { badRequest } from "../lib/errors";

export async function getSuggest(req: Request, res: Response): Promise<void> {
  const suggestions = await suggestPlaces(String(req.query.q ?? ""));
  res.json({ suggestions });
}

export async function getGeocode(req: Request, res: Response): Promise<void> {
  const place = await requireGeocode(String(req.query.q ?? ""));
  res.json({ place });
}

export async function getPlace(req: Request, res: Response): Promise<void> {
  const place = await placeDetails(String(req.query.placeId ?? ""));
  res.json({ place });
}

export async function getReverse(req: Request, res: Response): Promise<void> {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw badRequest("lat and lng are required");
  }
  const place = await reverseGeocodePlace(lat, lng);
  if (!place) {
    throw badRequest("Unable to reverse geocode that pin");
  }
  res.json({ place });
}
