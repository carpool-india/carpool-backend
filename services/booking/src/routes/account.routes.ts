import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { postDeleteAccount } from "../controllers/account.controller";

export const accountRouter = Router();

accountRouter.use(authenticate);
accountRouter.post("/delete", postDeleteAccount);
