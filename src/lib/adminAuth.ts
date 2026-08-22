import crypto from "crypto";
import type { NextRequest, NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 4; // 4 hours

/**
 * Admin panel is dev-only: `next build`/`next start` (including every
 * Vercel production and preview build) set NODE_ENV to "production", so this
 * is never reachable on a deployed environment regardless of URL/IP — unlike
 * an IP-allowlist check, this can't be spoofed via headers on serverless
 * infra.
 */
export function isAdminPanelEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

function sessionSecret(): string {
  const secret = process.env.ADMIN_PANEL_PASSWORD;
  if (!secret) throw new Error("ADMIN_PANEL_PASSWORD is not set.");
  return secret;
}

export function checkAdminPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PANEL_PASSWORD;
  if (!expected) return false;

  const expectedBuf = Buffer.from(expected);
  const candidateBuf = Buffer.from(candidate);
  // Buffers must be equal length for timingSafeEqual; pad the shorter one so
  // the comparison itself doesn't leak length via an early throw, then also
  // check the real lengths match.
  const maxLen = Math.max(expectedBuf.length, candidateBuf.length);
  const a = Buffer.alloc(maxLen);
  const b = Buffer.alloc(maxLen);
  expectedBuf.copy(a);
  candidateBuf.copy(b);

  return (
    expectedBuf.length === candidateBuf.length && crypto.timingSafeEqual(a, b)
  );
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

function makeSessionValue(): string {
  const expires = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${expires}`;
  return `${payload}.${sign(payload)}`;
}

function verifySessionValue(value: string): boolean {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length) return false;
  if (!crypto.timingSafeEqual(expectedBuf, actualBuf)) return false;

  const expires = Number(payload);
  return Number.isFinite(expires) && Date.now() < expires;
}

export function setAdminSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_SESSION_COOKIE, makeSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.delete(ADMIN_SESSION_COOKIE);
}

/** Verifies a raw admin_session cookie value, e.g. from next/headers `cookies()`. */
export function verifyAdminSessionCookie(value: string | undefined | null): boolean {
  if (!isAdminPanelEnabled()) return false;
  if (!value) return false;
  return verifySessionValue(value);
}

export function hasValidAdminSession(request: NextRequest): boolean {
  return verifyAdminSessionCookie(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}
