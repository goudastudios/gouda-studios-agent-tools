/** Adapt a Hono app to Vercel's Web Request runtime and Node (req, res). */
export function vercelHandler(app) {
  return async function handler(req, res) {
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
  };
}
