import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authenticateAdmin } from "../middleware/authenticateAdmin";
import { getAdminRatings, getAdminSafetyEvents, patchAdminHideRating, postAdminFraudFlag, postResolveSafetyEvent } from "../controllers/admin.controller";

export const adminRouter = Router();

adminRouter.use(authenticate, authenticateAdmin);
adminRouter.get("/safety-events", getAdminSafetyEvents);
adminRouter.patch("/safety-events/:id/resolve", postResolveSafetyEvent);
adminRouter.get("/ratings", getAdminRatings);
adminRouter.patch("/ratings/:id/hide", patchAdminHideRating);
adminRouter.post("/fraud-flag", postAdminFraudFlag);
