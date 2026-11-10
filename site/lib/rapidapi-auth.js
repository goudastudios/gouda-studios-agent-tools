import { timingSafeEqual } from "node:crypto";

/**
 * RapidAPI gateway auth: the proxy sets X-RapidAPI-Proxy-Secret, which must
 * match RAPIDAPI_PROXY_SECRET. The env var may be a single secret or a
 * comma-separated list (one per RapidAPI listing). If it is unset or empty
 * after splitting, every request is 401.
 */
function proxySecrets() {
  const raw = process.env.RAPIDAPI_PROXY_SECRET || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isRapidApiAuthorized(headerValue) {
  const got = typeof headerValue === "string" ? headerValue : "";
  if (!got) return false;
  const candidates = proxySecrets();
  if (!candidates.length) return false;
  const presented = Buffer.from(got);
  let matched = false;
  for (const expected of candidates) {
    const want = Buffer.from(expected);
    if (want.length !== presented.length) continue;
    if (timingSafeEqual(want, presented)) matched = true;
  }
  return matched;
}

export function unauthorizedBody() {
  return { error: "Unauthorized" };
}
