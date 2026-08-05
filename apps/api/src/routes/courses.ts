import { Router } from "express";

import { asyncHandler } from "../lib/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { courseService } from "../services/courseService.js";
import { createCourseSchema, idParamsSchema, updateCourseSchema } from "../validators/schemas.js";
import { reqParam } from "../lib/params.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const courses = await courseService.list();
    res.json({ success: true, courses });
  }),
);

router.post(
  "/",
  requireRole("ADMIN"),
  validate(createCourseSchema),
  asyncHandler(async (req, res) => {
    const course = await courseService.create({ ...req.body, adminId: req.auth!.userId });
    res.status(201).json({ success: true, course });
  }),
);

router.patch(
  "/:id",
  requireRole("ADMIN"),
  validate(updateCourseSchema),
  asyncHandler(async (req, res) => {
    const course = await courseService.update(reqParam(req, "id"), req.body);
    res.json({ success: true, course });
  }),
);

router.delete(
  "/:id",
  requireRole("ADMIN"),
  validate(idParamsSchema),
  asyncHandler(async (req, res) => {
    await courseService.remove(reqParam(req, "id"));
    res.json({ success: true });
  }),
);

export const courseRouter = router;
