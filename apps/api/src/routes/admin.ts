import { Router } from "express";

import { asyncHandler } from "../lib/asyncHandler.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { adminService } from "../services/adminService.js";
import { userRepo } from "../repositories/userRepo.js";
import { ApiError } from "../lib/apiError.js";
import { adminDocumentsSchema, changeRoleSchema, idParamsSchema, listUsersSchema } from "../validators/schemas.js";
import { reqParam, reqQuery } from "../lib/params.js";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const stats = await adminService.stats();
    res.json({ success: true, stats });
  }),
);

router.get(
  "/users",
  validate(listUsersSchema),
  asyncHandler(async (req, res) => {
    const result = await adminService.listUsers({
      page: Number(reqQuery(req, "page") ?? 1),
      limit: Number(reqQuery(req, "limit") ?? 20),
      search: reqQuery(req, "search"),
    });
    res.json({ success: true, ...result });
  }),
);

router.patch(
  "/users/:id/role",
  validate(changeRoleSchema),
  asyncHandler(async (req, res) => {
    const targetId = reqParam(req, "id");
    if (targetId === req.auth!.userId) {
      throw ApiError.badRequest("You cannot change your own role");
    }
    const user = await userRepo.findById(targetId);
    if (!user) throw ApiError.notFound("User not found");
    const updated = await userRepo.updateRole(targetId, req.body.role);
    res.json({ success: true, user: { id: updated.id, role: updated.role } });
  }),
);

router.delete(
  "/users/:id",
  validate(idParamsSchema),
  asyncHandler(async (req, res) => {
    const targetId = reqParam(req, "id");
    if (targetId === req.auth!.userId) {
      throw ApiError.badRequest("You cannot delete your own account");
    }
    const user = await userRepo.findById(targetId);
    if (!user) throw ApiError.notFound("User not found");
    await userRepo.delete(targetId);
    res.json({ success: true });
  }),
);

router.get(
  "/documents",
  validate(adminDocumentsSchema),
  asyncHandler(async (req, res) => {
    const result = await adminService.listDocuments({
      page: Number(reqQuery(req, "page") ?? 1),
      limit: Number(reqQuery(req, "limit") ?? 20),
      search: reqQuery(req, "search"),
      status: reqQuery(req, "status"),
    });
    res.json({ success: true, ...result });
  }),
);

export const adminRouter = router;
