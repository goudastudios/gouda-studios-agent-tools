# SAM.gov Contract Opportunities Feed: RFPs, Set-Asides, Deadlines

Get every U.S. federal contract opportunity from **SAM.gov** as clean rows: solicitations, RFQs, sources sought, presolicitations and award notices. Each row has the NAICS code, PSC code, set-aside, place of performance, response deadline, **days left to respond**, contracting officer contacts and a direct SAM.gov link.

No SAM.gov account or API key needed. Schedule it daily with **Only new since last run** and you get a feed of just the new opportunities that match your filters.


## For AI agents and developers
Agent-ready docs, pricing, an OpenAPI spec and example calls for this tool live on [Gouda Studios Agent Tools](https://gouda-studios-agent-tools.vercel.app/tools/sam-gov-opportunities-feed/). The full catalog is at [gouda-studios-agent-tools.vercel.app](https://gouda-studios-agent-tools.vercel.app) and [llms.txt](https://gouda-studios-agent-tools.vercel.app/llms.txt).

## Who uses it
- **Small businesses and 8(a), HUBZone, SDVOSB and WOSB firms** watching set-asides in their NAICS codes
- **Bid and capture teams** building a daily pipeline without clicking through SAM.gov
- **GovCon consultants and proposal writers** running opportunity alerts for many clients
- **Sales and market-research teams** tracking which agencies are buying what

## What you get (per opportunity)
| Field | Example |
|---|---|
| `title` | Defense Health Agency (DHA) Program Acquisition... |
| `noticeType` | Solicitation / Combined Synopsis/Solicitation / Sources Sought / Award Notice |
| `solicitationNumber` | N68335-27-Q-1021 |
| `department`, `subTier`, `office`, `agencyPath` | DEPT OF DEFENSE > DEPT OF THE NAVY > NAVAIR |
| `naicsCodes`, `pscCode` | ["541512"], "DA01" |
| `setAside` | SBA, 8A, HZC, SDVOSBC, WOSB... |
| `postedDate`, `responseDeadline`, `daysUntilResponse` | 2026-10-30T15:00-04:00, 13 |
| `placeOfPerformanceCity/State/Country` | Joint Base MDL, NJ, USA |
| `awardee`, `awardAmount`, `awardDate` | for award notices |
| `description` | full notice text, HTML removed |
| `contacts` | contracting officer name, email, phone (can be turned off) |
| `url` | https://sam.gov/opp/<id>/view |

## Input
| Field | What it does |
|---|---|
| `keywords` | Full-text search, e.g. `cybersecurity`, `janitorial`, `drone` |
| `naicsCodes` | One or more NAICS codes, any match |
| `noticeTypes` | Solicitation, Combined Synopsis, Presolicitation, Sources Sought, Award... |
| `setAsides` | Total Small Business, 8(a), HUBZone, SDVOSB, WOSB, EDWOSB, VOSB |
| `states` | Place-of-performance state codes, e.g. `VA`, `MD`, `DC` |
| `agencyContains` | e.g. `Navy`, `Veterans Affairs` |
| `postedWithinDays` | Only notices posted or updated in the last N days |
| `minDaysUntilResponse` | Skip anything closing sooner than N days (set 1 to drop expired) |
| `onlyNew` | Monitor mode. Returns only notices this filter has not delivered before |
| `maxResults` | Hard cap on rows, which caps your spend |
| `apiKey` | Optional. Your own free api.sam.gov key to read the official Opportunities API instead |

Example: open IT work in the DC area, at least a day left to respond:
```json
{ "naicsCodes": ["541511","541512"], "noticeTypes": ["o","k","r"], "states": ["VA","MD","DC"], "minDaysUntilResponse": 1, "maxResults": 200 }
```

## Pricing
**$2.00 per 1,000 opportunities** ($0.002 each), pay per result. You pay only for rows delivered. Notices removed by your state, agency, deadline or "only new" filters are free. A daily alert for one NAICS code usually costs a few cents.

## Daily alerts in 2 minutes
1. Set your filters and turn on **Only new since last run**.
2. Save as a task, then add a daily **Schedule**.
3. Connect the dataset to Google Sheets, Slack, email, Zapier or Make with Apify integrations.

## For AI agents
- Call through the Apify API, the Apify MCP server (mcp.apify.com), or agentic payments (x402 / MPP prepaid token, Skyfire). No Apify account needed for agentic payments.
- Runs with **limited permissions** and no Standby. It only uses its own storages (one named key-value store for the "only new" state).
- Pay per event only: **$0.002 per opportunity row**, no platform usage added. `maxResults` caps spend.
- All inputs are optional. Good default: `{"keywords":"software","postedWithinDays":7,"maxResults":50}`.
- Output: flat JSON dataset (`GET /v2/datasets/{datasetId}/items?format=json`); `RUN_SUMMARY` in the key-value store has counts.

## Reliability
Plain HTTP and JSON, no browser and no proxy needed. Retries with backoff, polite request pacing, and every run writes a `RUN_SUMMARY` (scanned, delivered, skipped).

## Data source and use
Data comes from SAM.gov, the U.S. government's official contract opportunities system. Federal procurement notices are public information. This Actor is not affiliated with or endorsed by GSA or SAM.gov. Always check the official notice and its attachments before you bid. Contact fields are the work contacts government officers publish on each notice. Use them only for bid-related communication.
