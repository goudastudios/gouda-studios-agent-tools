# SEC EDGAR Filings Feed: 8-K, 10-K, 10-Q, Form 4, Form D, S-1

New SEC EDGAR filings by ticker, CIK or form type from the official SEC APIs: form, filing date, 8-K items, company, SIC and direct document links. Change-only monitoring mode.


## For AI agents and developers
Agent-ready docs, pricing, an OpenAPI spec and example calls for this tool live on [Gouda Studios Agent Tools](https://gouda-studios-agent-tools.vercel.app/tools/sec-edgar-filings-feed/). The full catalog is at [gouda-studios-agent-tools.vercel.app](https://gouda-studios-agent-tools.vercel.app) and [llms.txt](https://gouda-studios-agent-tools.vercel.app/llms.txt).

## Who uses it
- Investors and analysts watching 8-Ks and insider Form 4s for a watchlist
- AI research agents that need "what did company X file this week" as JSON
- Deal, IR and compliance teams tracking Form D raises, S-1s and 13D stakes

## Output (one row per filing)
companyName, cik, tickers, sic, sicDescription, form, filingDate, reportDate, acceptedAt, accessionNumber, items (8-K item codes), description, isXBRL, documentUrl, indexUrl

## Pricing
Pay per event: **$0.002 per filing row ($2 per 1,000)**. No platform usage is added on top, and you are never charged for rows you don't get. Set `maxResults` to cap your spend.

## For AI agents
- Call through the Apify API, the Apify MCP server (mcp.apify.com), or agentic payments (x402 / MPP prepaid token, Skyfire). No Apify account is required for agentic payments.
- Runs with **limited permissions** and no Standby. It only touches its own storages.
- Returns SEC EDGAR filings as one JSON row per filing, from official sec.gov / data.sec.gov endpoints. With tickers or CIKs it reads each company's filing history; with neither it returns the latest market-wide filings of the chosen form types. Example: {"tickers":["AAPL","TSLA"],"formTypes":["8-K","10-Q"],"filedWithinDays":30}. Pricing: $0.002 per filing row.
- Every input is optional except what you need to define the search. Unknown names or IDs are logged and skipped; the run still succeeds.
- Output is a flat JSON dataset; read it with `GET /v2/datasets/{datasetId}/items?format=json`. `RUN_SUMMARY` in the key-value store gives the row count.

## Data source
Official SEC endpoints: data.sec.gov submissions API, sec.gov company_tickers.json and the EDGAR latest-filings Atom feed. The Actor sends a declared User-Agent and stays well under the SEC 10 requests/second fair-access limit.

## Disclaimer
Public government/regulatory data provided as-is. Not affiliated with the data publisher. Check the original record (link in each row) before relying on it.
