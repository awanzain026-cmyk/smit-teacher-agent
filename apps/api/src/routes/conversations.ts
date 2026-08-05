import { Router } from "express";

import { asyncHandler } from "../lib/asyncHandler.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { conversationService } from "../services/conversationService.js";
import {
  createConversationSchema,
  idParamsSchema,
  renameConversationSchema,
  searchConversationsSchema,
} from "../validators/schemas.js";
import { reqParam } from "../lib/params.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const conversations = await conversationService.listForUser(req.auth!.userId);
    res.json({ success: true, conversations });
  }),
);

router.post(
  "/",
  validate(createConversationSchema),
  asyncHandler(async (req, res) => {
    const conversation = await conversationService.getOrCreate({
      userId: req.auth!.userId,
      courseId: req.body.courseId ?? null,
      firstMessage: "New conversation",
    });
    res.status(201).json({ success: true, conversation: conversation.conversation });
  }),
);

router.get(
  "/search",
  validate(searchConversationsSchema),
  asyncHandler(async (req, res) => {
    const conversations = await conversationService.searchForUser(req.auth!.userId, String(req.query.q));
    res.json({ success: true, conversations });
  }),
);

router.get(
  "/:id",
  validate(idParamsSchema),
  asyncHandler(async (req, res) => {
    const result = await conversationService.getWithMessages(req.auth!.userId, reqParam(req, "id"));
    res.json({ success: true, ...result });
  }),
);

router.patch(
  "/:id",
  validate(renameConversationSchema),
  asyncHandler(async (req, res) => {
    const conversation = await conversationService.rename(req.auth!.userId, reqParam(req, "id"), req.body.title);
    res.json({ success: true, conversation });
  }),
);

router.delete(
  "/:id",
  validate(idParamsSchema),
  asyncHandler(async (req, res) => {
    await conversationService.remove(req.auth!.userId, reqParam(req, "id"));
    res.json({ success: true });
  }),
);

export const conversationRouter = router;
