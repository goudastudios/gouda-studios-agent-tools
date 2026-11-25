# Gouda Studios Agent Tools

[![Listed on MCP Collection](https://mcpcollection.com/badge/gouda-studios-agent-tools.svg)](https://mcpcollection.com/server/gouda-studios-agent-tools)

Pay-per-result data tools for AI agents and developers: U.S. federal contract opportunities (SAM.gov), SEC EDGAR filings, USAspending federal awards, global company LEI lookup (GLEIF), website contact extraction (emails, phones, social links), YouTube videos, comments and transcripts, Google Trends data, App Store, Google Play, Chrome Web Store and Shopify App Store reviews, ATS job listings, Instagram Reels, TikTok and podcast transcripts, Telegram channel posts, Spotify play counts, USPTO trademark screening, merch marketplace counts and Adobe Stock keyword gaps. Every tool runs on [Apify](https://apify.com/gouda_studios), returns clean JSON, and can be called by an agent with an Apify token, through the Apify MCP server, or paid per run with x402 or Skyfire.

- Agent site: https://gouda-studios-agent-tools.vercel.app
- llms.txt: https://gouda-studios-agent-tools.vercel.app/llms.txt
- OpenAPI 3.1: [openapi.json](openapi.json) (also at https://gouda-studios-agent-tools.vercel.app/openapi.json)
- Tool catalog: https://gouda-studios-agent-tools.vercel.app/tools.json

## Tools

| Tool | Apify actor | What it returns | Price |
|---|---|---|---|
| SAM.gov Contract Opportunities | [gouda_studios/sam-gov-opportunities-feed](https://apify.com/gouda_studios/sam-gov-opportunities-feed) | Federal contract opportunities with NAICS, PSC, set-aside, place of performance, deadlines, contacts, new-only monitoring mode. No API key needed. | $0.001 per run + $0.002 per opportunity |
| SEC EDGAR Filings | [gouda_studios/sec-edgar-filings-feed](https://apify.com/gouda_studios/sec-edgar-filings-feed) | New filings by ticker, CIK or form type: form, date, 8-K items, company, SIC, document links. Change-only monitoring. | $0.001 per run + $0.002 per filing |
| USAspending Federal Awards | [gouda_studios/usaspending-awards-search](https://apify.com/gouda_studios/usaspending-awards-search) | Contract and grant awards by keyword, recipient, agency, NAICS, state, date and amount. | $0.001 per run + $0.0015 per award |
| GLEIF Company LEI Lookup | [gouda_studios/gleif-company-lei-lookup](https://apify.com/gouda_studios/gleif-company-lei-lookup) | Legal name, status, jurisdiction, registration number, addresses, direct and ultimate parent for 2.9M+ entities. | $0.001 per run + $0.003 per company |
| Website Contact Extractor | [gouda_studios/website-contact-extractor](https://apify.com/gouda_studios/website-contact-extractor) | One row per website: emails (Cloudflare-protected ones decoded, MX checked), validated phones, social profiles, address. Only sites with contacts are charged. | $0.0005 per run + $0.0025 per website with contacts |
| YouTube Transcript Extractor | [gouda_studios/youtube-transcript-extractor](https://apify.com/gouda_studios/youtube-transcript-extractor) | Transcript of any YouTube video or Short as text, timestamped text, segments and SRT. Any language, auto-translate, residential proxy built in. Failed videos are free. | $0.0005 per run + $0.0025 per transcript |
| Google Trends Scraper | [gouda_studios/google-trends-scraper](https://apify.com/gouda_studios/google-trends-scraper) | Google Trends API alternative: interest over time (0-100 timeline, average, peak), interest by region, top and rising related queries, optional trending now. Many keywords per run, any country and time range, residential proxy built in. Blocked terms are free. | $0.0005 per run + $0.004 per keyword |
| Merch Marketplace Counts | [gouda_studios/merch-marketplace-counts](https://apify.com/gouda_studios/merch-marketplace-counts) | Result counts and top listings per merch keyword from Redbubble, TeePublic, Etsy and Merch by Amazon. Blocked stores are flagged, never guessed. | $0.00005 per run + $0.002 per keyword |
| Adobe Stock Keyword Gap Scanner | [gouda_studios/adobe-stock-keyword-gap-scanner](https://apify.com/gouda_studios/adobe-stock-keyword-gap-scanner) | Adobe Stock result counts per keyword (total, photo, video, generative AI share) plus related search and autocomplete expansion. | $0.00005 per run + $0.002 per keyword, $0.0005 per suggestion batch |
| App Store and Google Play Reviews | [gouda_studios/app-store-google-play-reviews](https://apify.com/gouda_studios/app-store-google-play-reviews) | Reviews from both stores in one schema: rating, text, date, version, developer reply. | $0.0001 per review |
| ATS Jobs Scraper | [gouda_studios/ats-jobs-scraper](https://apify.com/gouda_studios/ats-jobs-scraper) | Open jobs from Greenhouse, Lever, Ashby, Workable, SmartRecruiters and Workday career sites with salary, remote type and descriptions. | $0.00005 per run + $0.001 per job |
| Chrome Web Store Reviews | [gouda_studios/chrome-web-store-reviews](https://apify.com/gouda_studios/chrome-web-store-reviews) | Extension reviews past the 500 review cap, with star filters, user count, rating and version. | $0.00005 per run + $0.0001 per review |
| Instagram Reels, TikTok and Podcast Transcripts | [gouda_studios/instagram-tiktok-transcript-scraper](https://apify.com/gouda_studios/instagram-tiktok-transcript-scraper) | Timestamped transcripts for Reels, TikToks, podcast RSS episodes and audio or video file URLs, with optional speaker labels. | $0.0005 per run + $0.002 per caption transcript, $0.006 per speech-to-text transcript |
| Shopify App Store Reviews | [gouda_studios/shopify-app-store-reviews](https://apify.com/gouda_studios/shopify-app-store-reviews) | App reviews with rating, store, country and developer replies, plus listing rating, pricing plans and category listings. | $0.00005 per run + $0.00002 per review |
| Spotify Play Count Scraper | [gouda_studios/spotify-play-count-scraper](https://apify.com/gouda_studios/spotify-play-count-scraper) | Exact play counts for tracks, albums, artists and playlists, plus monthly listeners, followers and top cities. | $0.00005 per run + $0.001 per track, $0.002 per artist profile |
| Telegram Channel Scraper | [gouda_studios/telegram-channel-scraper](https://apify.com/gouda_studios/telegram-channel-scraper) | Public channel posts with text, date, views, reactions, links and media, plus subscriber counts. | $0.00005 per run + $0.0003 per post |
| USPTO Trademark Phrase Screener | [gouda_studios/uspto-trademark-screener](https://apify.com/gouda_studios/uspto-trademark-screener) | Exact and close USPTO wordmarks per phrase with live or dead status, classes and class 25 and 16 flags. | $0.00005 per run + $0.001 per phrase |
| YouTube Video, Channel, Search and Comments Scraper | [gouda_studios/youtube-video-channel-scraper](https://apify.com/gouda_studios/youtube-video-channel-scraper) | Video details, channel videos, keyword search, channel search, playlists and comments with views, likes and subscribers. | $0.00005 per run + $0.0003 per video or comment, $0.002 per channel |

Pricing is Apify pay per event: a small start charge per run (none for some tools) plus the per-result price. No platform usage fee is added.

## How to call

### Apify API

Run a tool synchronously and get the results back as JSON:

```bash
curl -X POST "https://api.apify.com/v2/acts/gouda_studios~sec-edgar-filings-feed/run-sync-get-dataset-items?token=$APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tickers": ["AAPL"], "maxResults": 10}'
```

Replace the actor name with any tool above. Input fields for each tool are in `actors/<tool>/.actor/input_schema.json` and in [openapi.json](openapi.json).

### Apify MCP server

One stable URL for all tools: `https://gouda-studios-agent-tools.vercel.app/mcp` (Streamable HTTP, sign in with your Apify account via OAuth or pass `Authorization: Bearer <APIFY_TOKEN>`). The actor list lives in `site/mcp-tools.json`.


Add the hosted Apify MCP server to any MCP client (Claude, Cursor, Cline, and others) and load the tools by name:

```json
{
  "mcpServers": {
    "gouda-studios": {
      "url": "https://mcp.apify.com/?tools=gouda_studios/sam-gov-opportunities-feed,gouda_studios/sec-edgar-filings-feed,gouda_studios/usaspending-awards-search,gouda_studios/gleif-company-lei-lookup,gouda_studios/website-contact-extractor,gouda_studios/youtube-transcript-extractor,gouda_studios/google-trends-scraper,gouda_studios/merch-marketplace-counts,gouda_studios/adobe-stock-keyword-gap-scanner,gouda_studios/app-store-google-play-reviews,gouda_studios/ats-jobs-scraper,gouda_studios/chrome-web-store-reviews,gouda_studios/instagram-tiktok-transcript-scraper,gouda_studios/shopify-app-store-reviews,gouda_studios/spotify-play-count-scraper,gouda_studios/telegram-channel-scraper,gouda_studios/uspto-trademark-screener,gouda_studios/youtube-video-channel-scraper",
      "headers": { "Authorization": "Bearer <APIFY_TOKEN>" }
    }
  }
}
```

### Agentic payments (x402 and Skyfire)

These actors are listed for Apify agentic payments, so an AI agent can pay per run with x402 or Skyfire without creating an Apify account. See the [Apify agentic payments docs](https://docs.apify.com/actors/publishing/monetize) for setup.

## Repository layout

- `actors/` - source for the seven Apify actors (Node.js and Python, Apify SDK)
- `openapi.json` - OpenAPI 3.1 description of the tools
- `llms.txt` - summary for LLMs and AI agents

## Data sources

All data comes from public sources: SAM.gov, SEC EDGAR, USAspending.gov, GLEIF, public websites, YouTube, Google Trends, app and extension stores, company career sites, Instagram, TikTok, Telegram, Spotify, USPTO, merch marketplaces and Adobe Stock.

## Contact

m0f@mail.grokbot.com

## License

[MIT](LICENSE)
