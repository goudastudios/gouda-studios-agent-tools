# USAspending Federal Awards Search: Contracts, Grants, Winners

Search U.S. federal contract and grant awards from the official USAspending.gov API by keyword, recipient, agency, NAICS, state, date and amount. Award amount, recipient UEI, agency and links.


## For AI agents and developers
Agent-ready docs, pricing, an OpenAPI spec and example calls for this tool live on [Gouda Studios Agent Tools](https://gouda-studios-agent-tools.vercel.app/tools/usaspending-awards-search/). The full catalog is at [gouda-studios-agent-tools.vercel.app](https://gouda-studios-agent-tools.vercel.app) and [llms.txt](https://gouda-studios-agent-tools.vercel.app/llms.txt).

## Example inputs

**Cybersecurity contracts awarded in 2026 over $1M**
```json
{
  "keywords": [
    "cybersecurity"
  ],
  "awardType": "contracts",
  "startDate": "2026-01-01",
  "minAmount": 1000000
}
```

**All awards to a competitor**
```json
{
  "recipientNames": [
    "Booz Allen Hamilton"
  ],
  "maxResults": 200
}
```

**New HHS research grants, only new since last run**
```json
{
  "awardingAgencies": [
    "Department of Health and Human Services"
  ],
  "awardType": "grants",
  "keywords": [
    "research"
  ],
  "onlyNew": true
}
```

## Questions this actor answers

**How do I track federal contract awards?**
Search by keyword, NAICS or agency with a date range, or schedule the actor with onlyNew to get newly reported awards as they appear.

**How do I see which companies won government contracts?**
Each row includes the recipient name, award amount, awarding agency and performance period. Filter by recipientNames to follow a specific competitor.

**Does it cover grants as well as contracts?**
Yes. Set awardType to contracts or grants.

**Can an AI agent call this?**
Yes. Use it through the MCP endpoint at https://gouda-studios-agent-tools.vercel.app/mcp, the Apify API, or agentic payments (x402, Skyfire).

## Use from Claude, Cursor or any MCP client

Add `https://gouda-studios-agent-tools.vercel.app/mcp` as a remote MCP server (Streamable HTTP) in Claude, Cursor or any MCP client. Sign in with your Apify account or pass an Apify API token. Step by step guide: [https://gouda-studios-agent-tools.vercel.app/guides/use-public-data-tools-in-claude-and-cursor-with-mcp/](https://gouda-studios-agent-tools.vercel.app/guides/use-public-data-tools-in-claude-and-cursor-with-mcp/).

## Who uses it
- GovCon BD teams researching competitors' wins and incumbents
- Grant seekers and consultants checking who funds what
- AI agents answering "who won federal money for X" with sourced data

## Output (one row per award)
awardId, recipientName, recipientUei, awardAmount, totalOutlays, description, startDate, endDate, awardingAgency, awardingSubAgency, fundingAgency, awardType, naics, psc, assistanceListings, placeOfPerformanceState, lastModified, internalId, url

## Pricing
Pay per event: **$0.0015 per award row ($1.5 per 1,000)**. No platform usage is added on top, and you are never charged for rows you don't get. Set `maxResults` to cap your spend.

## For AI agents
- Call through the Apify API, the Apify MCP server (mcp.apify.com), or agentic payments (x402 / MPP prepaid token, Skyfire). No Apify account is required for agentic payments.
- Runs with **limited permissions** and no Standby. It only touches its own storages.
- Returns U.S. federal spending awards (contracts, IDVs, grants, loans) from the official USAspending.gov API, one JSON row per award, largest first. Example: {"keywords":["cybersecurity"],"awardType":"contracts","startDate":"2026-01-01","maxResults":50}. Pricing: $0.0015 per award row.
- Every input is optional except what you need to define the search. Unknown names or IDs are logged and skipped; the run still succeeds.
- Output is a flat JSON dataset; read it with `GET /v2/datasets/{datasetId}/items?format=json`. `RUN_SUMMARY` in the key-value store gives the row count.

## Data source
Official USAspending.gov API v2 (U.S. Treasury), public and keyless.

## Disclaimer
Public government/regulatory data provided as-is. Not affiliated with the data publisher. Check the original record (link in each row) before relying on it.
