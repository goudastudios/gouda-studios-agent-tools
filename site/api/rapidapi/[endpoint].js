/**
 * POST /api/rapidapi/:endpoint
 *
 * RapidAPI gateway proxy. Requires header X-RapidAPI-Proxy-Secret to match
 * env RAPIDAPI_PROXY_SECRET (401 if missing or wrong; the env can be set later).
 * After auth, runs the matching gouda_studios Apify actor synchronously and
 * returns dataset items as JSON.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { isRapidApiAuthorized, unauthorizedBody } from "../../lib/rapidapi-auth.js";
import { ENDPOINTS, handleEndpoint } from "../../lib/rapidapi-routes.js";
import { vercelHandler } from "../../lib/vercel-handler.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 120,
};

const app = new Hono();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Accept", "X-RapidAPI-Proxy-Secret", "X-RapidAPI-Key", "X-RapidAPI-Host"],
  }),
);

app.use("*", async (c, next) => {
  const secret = c.req.header("X-RapidAPI-Proxy-Secret") || c.req.header("x-rapidapi-proxy-secret") || "";
  if (!isRapidApiAuthorized(secret)) {
    return c.json(unauthorizedBody(), 401);
  }
  await next();
});

async function readBody(c) {
  const query = {};
  const url = new URL(c.req.url);
  for (const [k, v] of url.searchParams.entries()) query[k] = v;
  if (c.req.method === "GET" || c.req.method === "HEAD") return query;
  try {
    const json = await c.req.json();
    return { ...query, ...(json && typeof json === "object" ? json : {}) };
  } catch {
    return query;
  }
}

async function dispatch(c) {
  const endpoint = c.req.param("endpoint");
  if (!ENDPOINTS.includes(endpoint)) {
    return c.json({ error: "Not found", endpoints: ENDPOINTS }, 404);
  }
  try {
    const result = await handleEndpoint(endpoint, await readBody(c));
    return c.json(result.body, result.status);
  } catch (err) {
    console.error("rapidapi route error", endpoint, String(err).slice(0, 300));
    return c.json({ error: "Request failed" }, 502);
  }
}

app.get("/api/rapidapi/:endpoint", dispatch);
app.post("/api/rapidapi/:endpoint", dispatch);
app.get("/api/rapidapi/:endpoint/", dispatch);
app.post("/api/rapidapi/:endpoint/", dispatch);

export default vercelHandler(app);
export { app };
