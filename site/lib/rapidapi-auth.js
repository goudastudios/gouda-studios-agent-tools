import { timingSafeEqual } from "node:crypto";

/**
 * RapidAPI gateway auth: the proxy sets X-RapidAPI-Proxy-Secret, which must
 * match RAPIDAPI_PROXY_SECRET. If the env var is unset, every request is 401.
 */
export function isRapidApiAuthorized(headerValue) {
  const expected = process.env.RAPIDAPI_PROXY_SECRET || "";
  const got = typeof headerValue === "string" ? headerValue : "";
  if (!expected || !got) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(got);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function unauthorizedBody() {
  return { error: "Unauthorized" };
}
