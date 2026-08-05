import { Router } from "express";

import { asyncHandler } from "../lib/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { upload, validateFileSignature, assertKnownFileType, deleteStoredFile, storedPath } from "../middleware/upload.js";
import { uploadLimiter } from "../middleware/rateLimit.js";
import { documentService } from "../services/documentService.js";
import { idParamsSchema, listDocumentsSchema } from "../validators/schemas.js";
import { reqParam, reqQuery } from "../lib/params.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  validate(listDocumentsSchema),
  asyncHandler(async (req, res) => {
    const auth = req.auth!;
    const result = await documentService.listForUser({
      userId: auth.userId,
      courseId: reqQuery(req, "courseId"),
      search: reqQuery(req, "search"),
      page: Number(reqQuery(req, "page") ?? 1),
      limit: Number(reqQuery(req, "limit") ?? 20),
    });
    res.json({ success: true, ...result });
  }),
);

router.post(
  "/",
  uploadLimiter,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const auth = req.auth!;
    const courseId = reqQuery(req, "courseId") || null;

    const file = validateFileSignature(req);
    await assertKnownFileType(storedPath(file.filename), file.mimetype);

    const doc = await documentService.create({
      userId: auth.userId,
      courseId,
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });

    await documentService.queueProcessing(doc);

    res.status(201).json({ success: true, document: doc });
  }),
);

router.get(
  "/:id",
  validate(idParamsSchema),
  asyncHandler(async (req, res) => {
    const auth = req.auth!;
    const doc = await documentService.getOwned(reqParam(req, "id"), auth.userId, auth.role === "ADMIN");
    res.json({ success: true, document: doc });
  }),
);

router.delete(
  "/:id",
  validate(idParamsSchema),
  asyncHandler(async (req, res) => {
    const auth = req.auth!;
    await documentService.delete(reqParam(req, "id"), auth.userId, auth.role === "ADMIN");
    res.json({ success: true });
  }),
);

router.post(
  "/:id/reprocess",
  validate(idParamsSchema),
  asyncHandler(async (req, res) => {
    const auth = req.auth!;
    const doc = await documentService.reprocess(reqParam(req, "id"), auth.userId, auth.role === "ADMIN");
    res.json({ success: true, document: doc });
  }),
);

export const documentRouter = router;
