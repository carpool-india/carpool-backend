import { Router } from "express";
import { blockUserSchema, createReportSchema } from "@rideshare/utils";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { deleteBlock, getBlocked, postBlock, postReport } from "../controllers/trust.controller";

export const trustRouter = Router();

trustRouter.use(authenticate);
trustRouter.post("/reports", validate(createReportSchema), postReport);
trustRouter.post("/blocks", validate(blockUserSchema), postBlock);
trustRouter.get("/blocks", getBlocked);
trustRouter.delete("/blocks", validate(blockUserSchema), deleteBlock);
