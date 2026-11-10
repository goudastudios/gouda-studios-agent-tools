# POST /api/x402/transcript

Pay-per-call Instagram Reels and TikTok transcripts.

- **Price:** $0.03 USDC per video (one URL per paid request).
- **payTo:** `0x19dD41Db74AB8E5dc52E46d0d8bf470E27cFf886` on Base.
- **Until CDP keys are set:** the route uses the public x402.org facilitator on Base Sepolia (`eip155:84532`). A request without payment returns HTTP 402.
- **When `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET` are set on Vercel:** the route switches to the CDP facilitator on Base mainnet (`eip155:8453`). One successful mainnet payment indexes it in the Bazaar.
- **After payment:** the handler calls `gouda_studios/instagram-tiktok-transcript-scraper` via Apify `run-sync-get-dataset-items`. Set `APIFY_TOKEN` on Vercel.

Body: `{ "videoUrl": "https://www.tiktok.com/@user/video/..." }` (Instagram Reel URLs also work).
