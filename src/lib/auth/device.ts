import type { NextRequest, NextResponse } from "next/server";

const DEVICE_COOKIE = "device_id";
const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function getClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}

/** Reads the device_id cookie if present, without creating one. */
export function getDeviceId(request: NextRequest): string | null {
  return request.cookies.get(DEVICE_COOKIE)?.value ?? null;
}

/**
 * Returns the request's device id, generating and attaching a new one to
 * `response` if the request didn't already have one. Callers must use the
 * returned id (not re-read the request cookie) since a freshly-generated id
 * isn't visible on `request` until the response round-trips.
 */
export function ensureDeviceId(request: NextRequest, response: NextResponse): string {
  const existing = getDeviceId(request);
  if (existing) return existing;

  const deviceId = crypto.randomUUID();
  response.cookies.set(DEVICE_COOKIE, deviceId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: DEVICE_COOKIE_MAX_AGE,
  });
  return deviceId;
}
