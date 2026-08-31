import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authenticateAdmin } from "../middleware/authenticateAdmin";
import { getAdminPayments, getAdminRevenueSummary, getAdminSubscriptions, patchAdminSubscription, postAdminRefund } from "../controllers/admin.controller";

export const adminRouter = Router();

adminRouter.use(authenticate, authenticateAdmin);
adminRouter.get("/subscriptions", getAdminSubscriptions);
adminRouter.patch("/subscriptions/:id/cancel", patchAdminSubscription);
adminRouter.get("/payments", getAdminPayments);
adminRouter.post("/refunds", postAdminRefund);
adminRouter.get("/revenue-summary", getAdminRevenueSummary);
