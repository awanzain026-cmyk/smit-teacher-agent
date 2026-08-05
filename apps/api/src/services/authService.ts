import bcrypt from "bcryptjs";

import { userRepo } from "../repositories/userRepo.js";
import { refreshTokenRepo } from "../repositories/refreshTokenRepo.js";
import {
  generateTokenId,
  refreshExpiryDays,
  sha256,
  signAccessToken,
  signRefreshToken,
  toDateAfterDays,
  verifyRefreshToken,
} from "../lib/tokens.js";
import { ApiError } from "../lib/apiError.js";
import type { User } from "@prisma/client";

const BCRYPT_ROUNDS = 12;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export class AuthService {
  async register(params: { name: string; email: string; password: string }): Promise<{ user: User; tokens: AuthTokens }> {
    const existing = await userRepo.findByEmail(params.email);
    if (existing) {
      throw ApiError.conflict("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(params.password, BCRYPT_ROUNDS);
    const user = await userRepo.create({
      name: params.name.trim(),
      email: params.email.toLowerCase().trim(),
      passwordHash,
      role: "STUDENT",
    });

    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  async login(params: { email: string; password: string; userAgent?: string }): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await userRepo.findByEmail(params.email.toLowerCase().trim());
    if (!user) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const ok = await bcrypt.compare(params.password, user.passwordHash);
    if (!ok) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const tokens = await this.issueTokens(user, params.userAgent);
    return { user, tokens };
  }

  async refresh(refreshToken: string, userAgent?: string): Promise<AuthTokens> {
    let payload: { jti: string; sub: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized("Invalid refresh token");
    }

    const stored = await refreshTokenRepo.findByHash(sha256(refreshToken));
    if (!stored || stored.revokedAt) {
      // Possible reuse: revoke the whole token family for the claimed user
      if (stored?.userId) {
        await refreshTokenRepo.revokeAllForUser(stored.userId);
      }
      throw ApiError.unauthorized("Invalid refresh token");
    }

    if (stored.expiresAt < new Date()) {
      await refreshTokenRepo.revoke(stored.id);
      throw ApiError.unauthorized("Refresh token expired");
    }

    const user = await userRepo.findById(stored.userId);
    if (!user) {
      throw ApiError.unauthorized("User no longer exists");
    }

    // One-time use: revoke the presented token, issue a new one (rotation)
    await refreshTokenRepo.revoke(stored.id);
    return this.issueTokens(user, userAgent);
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    const stored = await refreshTokenRepo.findByHash(sha256(refreshToken));
    if (stored && !stored.revokedAt) {
      await refreshTokenRepo.revoke(stored.id);
    }
  }

  async issueTokens(user: User, userAgent?: string): Promise<AuthTokens> {
    const accessToken = signAccessToken({ sub: user.id, role: user.role });

    const tokenId = generateTokenId();
    const days = refreshExpiryDays();
    const expiresAt = toDateAfterDays(days);
    const refreshToken = signRefreshToken({ jti: tokenId, sub: user.id });

    await refreshTokenRepo.create({
      tokenHash: sha256(refreshToken),
      userId: user.id,
      userAgent: userAgent?.slice(0, 300) ?? null,
      expiresAt,
    });

    return { accessToken, refreshToken, expiresAt };
  }

  toPublic(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    };
  }
}

export const authService = new AuthService();
