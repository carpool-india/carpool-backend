import { Router } from "express";
import { ratingSchema } from "@rideshare/utils";
import { authenticate, type AuthedRequest } from "../middleware/authenticate";
import { createUserClient } from "../lib/supabase";
import { submitRating } from "../services/rating.service";

export const ratingRouter = Router();
ratingRouter.use(authenticate);
ratingRouter.post("/", async (req, res, next) => {
  try {
    const input = ratingSchema.parse(req.body);
    const authed = req as AuthedRequest;
    const result = await submitRating(createUserClient(authed.accessToken), authed.authUserId, input);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});
