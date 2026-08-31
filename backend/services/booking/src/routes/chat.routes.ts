import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../middleware/authenticate";
import { getChatToken, getMessages, getMyChatPreviews, postMessage } from "../controllers/chat.controller";

export const chatRouter = Router();

const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

chatRouter.use(authenticate);
chatRouter.get("/mine", getMyChatPreviews);
chatRouter.get("/:tripId/token", getChatToken);
chatRouter.get("/:tripId/messages", getMessages);
chatRouter.post("/:tripId/messages", sendLimiter, postMessage);
