import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { postPresignUpload } from "../controllers/upload.controller";

export const uploadRouter = Router();

uploadRouter.use(authenticate);
uploadRouter.post("/presign", postPresignUpload);
