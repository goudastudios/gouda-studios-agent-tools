/**
 * POST /api/x402/transcript
 *
 * x402 pay-per-call Instagram Reels / TikTok transcripts.
 *
 * Env (set on the Vercel project; see site/env.example):
 *   APIFY_TOKEN              required to run the actor after payment
 *   CDP_API_KEY_ID           when both CDP keys are set, use CDP facilitator + Base mainnet
 *   CDP_API_KEY_SECRET
 *   X402_PAY_TO              optional, default Mark's payout address
 *   X402_PRICE               optional, default $0.03
 *   X402_NETWORK             optional override (eip155:8453 or eip155:84532)
 *
 * Until the CDP keys exist, this uses https://x402.org/facilitator on Base Sepolia.
 * It never provisions a wallet. Funds always go to X402_PAY_TO / the default address.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";

export const config = {
  runtime: "nodejs",
  maxDuration: 300,
};

const PAY_TO = (
  process.env.X402_PAY_TO || "0x19dD41Db74AB8E5dc52E46d0d8bf470E27cFf886"
).trim();
const PRICE = (process.env.X402_PRICE || "$0.03").trim();
const ACTOR = "gouda_studios~instagram-tiktok-transcript-scraper";
const PATH = "/api/x402/transcript";

const hasCdpKeys = Boolean(
  process.env.CDP_API_KEY_ID && process.env.CDP_API_KEY_SECRET,
);

function network() {
  if (process.env.X402_NETWORK) return process.env.X402_NETWORK.trim();
  return hasCdpKeys ? "eip155:8453" : "eip155:84532";
}

async function facilitatorClient() {
  if (hasCdpKeys) {
    const { createCdpFacilitatorClient } = await import("@coinbase/cdp-sdk/x402");
    return createCdpFacilitatorClient({
      apiKeyId: process.env.CDP_API_KEY_ID,
      apiKeySecret: process.env.CDP_API_KEY_SECRET,
    });
  }
  return new HTTPFacilitatorClient({ url: "https://x402.org/facilitator" });
}

const EXAMPLE_URL = "https://www.tiktok.com/@brittany_broski/video/7257949160907935022";

const inputSchema = {
  type: "object",
  properties: {
    videoUrl: {
      type: "string",
      description:
        "A public Instagram Reel/post URL (instagram.com/reel/..., /p/..., /tv/...) or TikTok video URL (tiktok.com/@user/video/..., vm.tiktok.com/...). One URL per paid request.",
    },
  },
  required: ["videoUrl"],
};

const outputExample = {
  items: [
    {
      platform: "tiktok",
      url: EXAMPLE_URL,
      author: { username: "brittany_broski" },
      durationSec: 15,
      language: "en",
      transcriptSource: "native_captions",
      transcript: "example transcript text",
      segments: [{ start: 0, end: 2.1, text: "example transcript text" }],
      status: "ok",
    },
  ],
};

const routeConfig = {
  accepts: [
    {
      scheme: "exact",
      price: PRICE,
      network: network(),
      payTo: PAY_TO,
    },
  ],
  description:
    "Transcript of one public Instagram Reel or TikTok video, with timestamps, caption, author, views and likes. Native TikTok captions first; built-in speech-to-text when there are no captions. No login.",
  mimeType: "application/json",
  serviceName: "Reels TikTok Transcript",
  tags: ["transcript", "tiktok", "instagram", "reels"],
  extensions: {
    ...declareDiscoveryExtension({
      method: "POST",
      bodyType: "json",
      input: { videoUrl: EXAMPLE_URL },
      inputSchema,
      output: {
        example: outputExample,
        schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  platform: { type: "string" },
                  url: { type: "string" },
                  transcript: { type: "string" },
                  segments: { type: "array" },
                  status: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
  },
};

const routes = {
  [`POST ${PATH}`]: routeConfig,
  [`POST ${PATH}/`]: routeConfig,
};

const resourceServer = new x402ResourceServer(await facilitatorClient()).register(
  network(),
  new ExactEvmScheme(),
);
// Fetch the facilitator's supported kinds so 402 responses can be built
// without waiting on a first-request middleware sync (serverless-safe).
await resourceServer.initialize();

const app = new Hono();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Accept",
      "PAYMENT-SIGNATURE",
      "PAYMENT-REQUIRED",
      "X-PAYMENT",
    ],
    exposeHeaders: ["PAYMENT-REQUIRED", "PAYMENT-RESPONSE", "X-PAYMENT-RESPONSE"],
  }),
);

// Payment protection: verify first, settle only after a 2xx from the handler.
// Fifth arg (syncFacilitatorOnStart) is false so a Vercel cold start does not block on a facilitator sync.
app.use(paymentMiddleware(routes, resourceServer, undefined, undefined, false));

function infoBody() {
  const apifyToken = process.env.APIFY_TOKEN || "";
  console.log(
    JSON.stringify({
      apifyTokenSet: Boolean(apifyToken),
      apifyTokenLength: apifyToken.length,
    }),
  );
  return {
    name: "Reels TikTok Transcript",
    path: PATH,
    method: "POST",
    price: PRICE,
    network: network(),
    payTo: PAY_TO,
    facilitator: hasCdpKeys
      ? "cdp"
      : "x402.org testnet (set CDP_API_KEY_ID and CDP_API_KEY_SECRET to switch to Base mainnet)",
    body: { videoUrl: EXAMPLE_URL },
  };
}

function extractVideoUrl(body) {
  if (!body || typeof body !== "object") return null;
  if (typeof body.videoUrl === "string" && body.videoUrl.trim()) return body.videoUrl.trim();
  if (typeof body.url === "string" && body.url.trim()) return body.url.trim();
  const list = body.videoUrls;
  if (Array.isArray(list) && typeof list[0] === "string" && list[0].trim()) return list[0].trim();
  if (Array.isArray(list) && list[0] && typeof list[0].url === "string") return list[0].url.trim();
  return null;
}

function isVideoUrl(u) {
  try {
    const h = new URL(u).hostname.toLowerCase();
    return h.includes("tiktok.com") || h.includes("instagram.com") || h.includes("instagr.am");
  } catch {
    return false;
  }
}

async function transcribe(videoUrl) {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    return {
      status: 503,
      body: {
        error: "APIFY_TOKEN is not set on this deployment. The payment was not settled.",
      },
    };
  }
  const qs = new URLSearchParams({ timeout: "280" });
  const res = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?${qs}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        videoUrls: [videoUrl],
        speechToText: "auto",
        includeSegments: true,
      }),
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
      status: 502,
      body: {
        error: "Transcript actor failed",
        status: res.status,
        detail: data,
      },
    };
  }
  const items = Array.isArray(data) ? data : data?.items || data;
  return { status: 200, body: { items } };
}

const paidHandler = async (c) => {
  let body = {};
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }
  const videoUrl = extractVideoUrl(body);
  if (!videoUrl) {
    return c.json(
      { error: 'Send JSON { "videoUrl": "https://www.tiktok.com/@user/video/..." } or an Instagram Reel URL.' },
      400,
    );
  }
  if (!isVideoUrl(videoUrl)) {
    return c.json(
      { error: "videoUrl must be a public Instagram Reel/post or TikTok video URL." },
      400,
    );
  }
  try {
    const result = await transcribe(videoUrl);
    return c.json(result.body, result.status);
  } catch (err) {
    console.error("transcript actor error", err);
    return c.json({ error: "Transcript actor request failed", detail: String(err).slice(0, 300) }, 502);
  }
};

app.get(PATH, (c) => c.json(infoBody()));
app.get(`${PATH}/`, (c) => c.json(infoBody()));
app.post(PATH, paidHandler);
app.post(`${PATH}/`, paidHandler);

export { app };

// Works on both the Web Request runtime and Node.js (req, res) serverless.
export default async function handler(req, res) {
  const isWebRequest =
    typeof Request !== "undefined" &&
    (req instanceof Request || typeof req?.headers?.get === "function");
  if (isWebRequest) {
    return app.fetch(req);
  }
  const host = req.headers.host || "localhost";
  const proto = req.headers["x-forwarded-proto"] || "https";
  const url = `${proto}://${host}${req.url}`;
  const chunks = [];
  if (req.method !== "GET" && req.method !== "HEAD") {
    await new Promise((resolve, reject) => {
      req.on("data", (c) => chunks.push(c));
      req.on("end", resolve);
      req.on("error", reject);
    });
  }
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v === undefined) continue;
    headers.set(k, Array.isArray(v) ? v.join(", ") : String(v));
  }
  const request = new Request(url, { method: req.method, headers, body });
  const response = await app.fetch(request);
  res.statusCode = response.status;
  response.headers.forEach((val, key) => {
    res.setHeader(key, val);
  });
  const buf = Buffer.from(await response.arrayBuffer());
  res.end(buf);
}
