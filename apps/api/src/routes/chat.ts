import { Router } from "express";

import { asyncHandler } from "../lib/asyncHandler.js";
import { authenticate } from "../middleware/auth.js";
import { chatLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { chatService } from "../services/chatService.js";
import { chatSchema } from "../validators/schemas.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  chatLimiter,
  validate(chatSchema),
  asyncHandler(async (req, res) => {
    await chatService.streamChat({
      userId: req.auth!.userId,
      body: req.body,
      res,
    });
  }),
);

export const chatRouter = router;
