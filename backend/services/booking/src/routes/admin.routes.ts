import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authenticateAdmin } from "../middleware/authenticateAdmin";
import {
  getAdminBookings,
  getAdminKyc,
  getAdminKycById,
  getAdminKycByUser,
  getAdminOverview,
  getAdminTrips,
  getAdminUserContacts,
  getAdminUsers,
  getAdminVehicles,
  patchAdminKyc,
  patchAdminUser,
  patchAdminVehicle,
  postAdminCancelBooking,
  postAdminCancelTrip,
} from "../controllers/admin.controller";

export const adminRouter = Router();

adminRouter.use(authenticate, authenticateAdmin);
adminRouter.get("/overview", getAdminOverview);
adminRouter.get("/users", getAdminUsers);
adminRouter.patch("/users/:id", patchAdminUser);
adminRouter.get("/trips", getAdminTrips);
adminRouter.get("/bookings", getAdminBookings);
adminRouter.get("/kyc", getAdminKyc);
adminRouter.get("/kyc/user/:userId", getAdminKycByUser);
adminRouter.get("/kyc/:id", getAdminKycById);
adminRouter.patch("/kyc/:id", patchAdminKyc);
adminRouter.patch("/trips/:id/cancel", postAdminCancelTrip);
adminRouter.patch("/bookings/:id/cancel", postAdminCancelBooking);
adminRouter.get("/vehicles", getAdminVehicles);
adminRouter.patch("/vehicles/:id", patchAdminVehicle);
adminRouter.get("/users/:id/contacts", getAdminUserContacts);
