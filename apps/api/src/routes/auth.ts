import { Router } from "express";

import { asyncHandler } from "../lib/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { authLimiter, loginLimiter } from "../middleware/rateLimit.js";
import { authService } from "../services/authService.js";
import { userRepo } from "../repositories/userRepo.js";
import { ApiError } from "../lib/apiError.js";
import { adminSeedSchema, loginSchema, refreshSchema, registerSchema } from "../validators/schemas.js";
import { env } from "../config/env.js";

const router = Router();

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await userRepo.findById(req.auth!.userId);
    if (!user) throw ApiError.notFound("User not found");
    res.json({ success: true, user: authService.toPublic(user) });
  }),
);

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const { user, tokens } = await authService.register({ name, email, password });
    res.status(201).json({
      success: true,
      user: authService.toPublic(user),
      tokens,
    });
  }),
);

router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { user, tokens } = await authService.login({
      email,
      password,
      userAgent: req.headers["user-agent"],
    });
    res.json({ success: true, user: authService.toPublic(user), tokens });
  }),
);

router.post(
  "/refresh",
  authLimiter,
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    const tokens = await authService.refresh(req.body.refreshToken, req.headers["user-agent"]);
    res.json({ success: true, tokens });
  }),
);

router.post(
  "/logout",
  authLimiter,
  asyncHandler(async (req, res) => {
    const token = req.body?.refreshToken as string | undefined;
    await authService.logout(token);
    res.json({ success: true });
  }),
);

router.post(
  "/admin/seed",
  authLimiter,
  validate(adminSeedSchema),
  asyncHandler(async (req, res) => {
    const { secret, name, email, password } = req.body;
    if (secret !== env.ADMIN_SEED_SECRET) {
      throw ApiError.forbidden("Invalid seed secret");
    }
    const existing = await userRepo.findByEmail(email.toLowerCase().trim());
    if (existing) {
      const upgraded = await userRepo.updateRole(existing.id, "ADMIN");
      res.json({ success: true, user: authService.toPublic(upgraded), upgraded: true });
      return;
    }
    const { user } = await authService.register({ name, email, password });
    const admin = await userRepo.updateRole(user.id, "ADMIN");
    res.status(201).json({ success: true, user: authService.toPublic(admin), upgraded: false });
  }),
);

export const authRouter = router;
