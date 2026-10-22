# Gouda Studios Agent Tools

Pay-per-result data tools for AI agents and developers: U.S. federal contract opportunities (SAM.gov), SEC EDGAR filings, USAspending federal awards, global company LEI lookup (GLEIF), and website contact extraction (emails, phones, social links). Every tool runs on [Apify](https://apify.com/gouda_studios), returns clean JSON, and can be called by an agent with an Apify token, through the Apify MCP server, or paid per run with x402 or Skyfire.

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

Pricing is Apify pay per event: a small start charge per run plus the per-result price. No platform usage fee is added.

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
      "url": "https://mcp.apify.com/?tools=gouda_studios/sam-gov-opportunities-feed,gouda_studios/sec-edgar-filings-feed,gouda_studios/usaspending-awards-search,gouda_studios/gleif-company-lei-lookup",
      "headers": { "Authorization": "Bearer <APIFY_TOKEN>" }
    }
  }
}
```

### Agentic payments (x402 and Skyfire)

These actors are listed for Apify agentic payments, so an AI agent can pay per run with x402 or Skyfire without creating an Apify account. See the [Apify agentic payments docs](https://docs.apify.com/actors/publishing/monetize) for setup.

## Repository layout

- `actors/` - source for the four Apify actors (Node.js, Apify SDK)
- `openapi.json` - OpenAPI 3.1 description of the tools
- `llms.txt` - summary for LLMs and AI agents

## Data sources

All data comes from official public sources: SAM.gov, SEC EDGAR, USAspending.gov and GLEIF.

## Contact

m0f@mail.grokbot.com

## License

[MIT](LICENSE)
