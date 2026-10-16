# USAspending Federal Awards Search: Contracts, Grants, Recipients

Search U.S. federal contract and grant awards from the official USAspending.gov API by keyword, recipient, agency, NAICS, state, date and amount. Award amount, recipient UEI, agency and links.


## For AI agents and developers
Agent-ready docs, pricing, an OpenAPI spec and example calls for this tool live on [Gouda Studios Agent Tools](https://gouda-studios-agent-tools.vercel.app/tools/usaspending-awards-search/). The full catalog is at [gouda-studios-agent-tools.vercel.app](https://gouda-studios-agent-tools.vercel.app) and [llms.txt](https://gouda-studios-agent-tools.vercel.app/llms.txt).

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
