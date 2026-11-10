/**
 * Shared Apify token resolution and synchronous actor runs.
 * Token sources (first match that looks like an Apify token):
 *   GOUDA_RUNNER_KEY (plain, XOR-hex, reversed, or base64)
 *   GOUDA_APIFY_TOKEN, APIFY_TOKEN (same encodings)
 * Never log or return the token value.
 */

function resolveApifyTokenRaw() {
  return (
    process.env.GOUDA_RUNNER_KEY ||
    process.env.GOUDA_APIFY_TOKEN ||
    process.env.APIFY_TOKEN ||
    ""
  );
}

function xorDecodeHex(hex, key = 0x5a) {
  if (!hex || hex.length % 2 !== 0 || /[^0-9a-fA-F]/.test(hex)) return "";
  const buf = Buffer.from(hex, "hex");
  for (let i = 0; i < buf.length; i++) buf[i] ^= key;
  return buf.toString("utf8");
}

function looksLikeApifyToken(value) {
  return typeof value === "string" && value.startsWith("apify_api_") && value.length > 20;
}

export function apifyToken() {
  const raw = resolveApifyTokenRaw();
  if (looksLikeApifyToken(raw)) return raw;
  const xored = xorDecodeHex(raw);
  if (looksLikeApifyToken(xored)) return xored;
  const reversed = [...raw].reverse().join("");
  if (looksLikeApifyToken(reversed)) return reversed;
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf8");
    if (looksLikeApifyToken(decoded)) return decoded;
    const reversedDecoded = [...decoded].reverse().join("");
    if (looksLikeApifyToken(reversedDecoded)) return reversedDecoded;
  } catch {
    // fall through
  }
  return raw;
}

/**
 * Run an actor synchronously and return its dataset items.
 * @returns {{ status: number, body: any }}
 */
export async function runActorSync(actorId, input, { timeoutSec = 90 } = {}) {
  const token = apifyToken();
  if (!token || !looksLikeApifyToken(token)) {
    return {
      status: 503,
      body: { error: "Actor backend is not configured." },
    };
  }
  const qs = new URLSearchParams({ timeout: String(timeoutSec) });
  const res = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?${qs}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(input),
    },
  );
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text.slice(0, 2000) };
  }
  if (!res.ok) {
    return {
      status: res.status === 408 || res.status === 504 ? 504 : 502,
      body: {
        error: "Upstream actor failed",
        status: res.status,
        detail: data,
      },
    };
  }
  const items = Array.isArray(data) ? data : data?.items || data;
  return { status: 200, body: items };
}
