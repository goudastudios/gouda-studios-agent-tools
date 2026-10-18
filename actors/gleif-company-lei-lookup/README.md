# Company LEI Lookup by Name or LEI: Entity, Address, Parent

Verify companies worldwide from the official GLEIF LEI API: legal name, status, jurisdiction, registration number, legal and HQ address, direct and ultimate parent. KYB and enrichment for 2.9M+ entities.


## For AI agents and developers
Agent-ready docs, pricing, an OpenAPI spec and example calls for this tool live on [Gouda Studios Agent Tools](https://gouda-studios-agent-tools.vercel.app/tools/gleif-company-lei-lookup/). The full catalog is at [gouda-studios-agent-tools.vercel.app](https://gouda-studios-agent-tools.vercel.app) and [llms.txt](https://gouda-studios-agent-tools.vercel.app/llms.txt).

## Example inputs

**Find the LEI for a company name**
```json
{
  "companyNames": [
    "Apple Inc."
  ],
  "country": "US"
}
```

**Verify a list of LEIs and get parents**
```json
{
  "leis": [
    "HWUPKR0MPOU8FGXBT394"
  ],
  "includeParents": true
}
```

**Look up by UK Companies House number (Tesco PLC)**
```json
{
  "registrationNumbers": [
    "00445790"
  ],
  "country": "GB"
}
```

## Questions this actor answers

**How do I find a company LEI number?**
Put the company legal name in companyNames, optionally with a country code. The actor returns the best matching LEI records with status and address.

**How do I check whether an LEI is valid and active?**
Put the LEI in leis. Each row shows status, registrationStatus and nextRenewalDate.

**Who owns a company?**
Keep includeParents on. Rows include the direct and ultimate parent entity where GLEIF has that relationship.

**Can an AI agent call this?**
Yes. Use it through the MCP endpoint at https://gouda-studios-agent-tools.vercel.app/mcp, the Apify API, or agentic payments (x402, Skyfire).

## Use from Claude, Cursor or any MCP client

Add `https://gouda-studios-agent-tools.vercel.app/mcp` as a remote MCP server (Streamable HTTP) in Claude, Cursor or any MCP client. Sign in with your Apify account or pass an Apify API token. Step by step guide: [https://gouda-studios-agent-tools.vercel.app/guides/use-public-data-tools-in-claude-and-cursor-with-mcp/](https://gouda-studios-agent-tools.vercel.app/guides/use-public-data-tools-in-claude-and-cursor-with-mcp/).

## Who uses it
- KYB/onboarding and compliance checks
- CRM and lead enrichment with verified legal names, addresses and parents
- AI agents that must confirm a company exists and who owns it

## Output (one row per company)
query, lei, legalName, otherNames, status, registrationStatus, category, legalFormId, jurisdiction, registeredAs, registrationAuthorityId, legalAddress, headquartersAddress, entityCreatedAt, initialRegistrationDate, lastUpdateDate, nextRenewalDate, bic, successorLei, directParent, ultimateParent, url

## Pricing
Pay per event: **$0.003 per company row ($3 per 1,000)**. No platform usage is added on top, and you are never charged for rows you don't get. Set `maxResults` to cap your spend.

## For AI agents
- Call through the Apify API, the Apify MCP server (mcp.apify.com), or agentic payments (x402 / MPP prepaid token, Skyfire). No Apify account is required for agentic payments.
- Runs with **limited permissions** and no Standby. It only touches its own storages.
- Looks up legal entities worldwide in the official GLEIF Legal Entity Identifier (LEI) database and returns one JSON row per matched company with legal name, status, address, registration number and parent companies. Example: {"companyNames":["Apple Inc."],"country":"US"} or {"leis":["HWUPKR0MPOU8FGXBT394"]}. Pricing: $0.003 per company row.
- Every input is optional except what you need to define the search. Unknown names or IDs are logged and skipped; the run still succeeds.
- Output is a flat JSON dataset; read it with `GET /v2/datasets/{datasetId}/items?format=json`. `RUN_SUMMARY` in the key-value store gives the row count.

## Data source
Official GLEIF API (api.gleif.org), public and keyless; GLEIF data is published under CC0.

## Disclaimer
Public government/regulatory data provided as-is. Not affiliated with the data publisher. Check the original record (link in each row) before relying on it.
