# Google Trends Scraper: interest over time, regions, related queries

A fast, cheap **Google Trends API alternative**. Paste a list of keywords and get Google Trends data for all of them in one run, as clean JSON, CSV, Excel or via API. No Google account, no pytrends rate-limit headaches, no proxy setup: a residential proxy is built in.

## What data you get

For each search term, one row with:

- **Interest over time**: the full 0-100 timeline from Google Trends, plus `averageInterest`, `peakInterest` and `peakDate`
- **Interest by region**: 0-100 per US state, country, or sub-region
- **Related queries**: top and rising searches, including "Breakout" values
- **Related topics** (best effort): top and rising topics. Google often withholds topics from automated sessions, so this can be empty; related queries still return in full and the price is the same.
- Optional **Trending now**: today's trending searches in a country, with approximate traffic and news links

Works for any country or worldwide, any time range from the past hour back to 2004, any category, and web, image, news, Google Shopping or **YouTube search trends**.

## Pricing: pay per keyword

| What | Price |
|---|---|
| Each search term that returns data | $0.004 |
| Run start | $0.0005 |

That is about **$4 per 1,000 keywords**, proxy included. If Google blocks a term after retries, that row is marked `status: "error"` and **you are not charged** for it.

## How to use it

1. Click **Try for free**.
2. Enter your keywords in **Search terms** (one per line).
3. Pick a country code (for example `US`, `GB`, `DE`, `US-CA`, or empty for worldwide) and a time range.
4. Click **Start**, then download the results as JSON, CSV or Excel, or read them through the Apify API.

### Input example

```json
{
  "searchTerms": ["bitcoin", "ai agents", "christmas gifts"],
  "geo": "US",
  "timeRange": "today 12-m",
  "property": "",
  "trendingNow": false
}
```

### Output example (shortened)

```json
{
  "searchTerm": "ai agents",
  "geo": "US",
  "timeRange": "today 12-m",
  "property": "web",
  "averageInterest": 45,
  "peakInterest": 100,
  "peakDate": "Jun 7 - 13, 2026",
  "interestOverTime": [
    { "date": "Nov 2 - 8, 2025", "timestamp": 1762041600, "value": 25, "isPartial": false }
  ],
  "interestByRegion": [
    { "geoCode": "US-CA", "geoName": "California", "value": 21 }
  ],
  "relatedQueries": {
    "top": [{ "query": "best ai agents", "value": 100 }],
    "rising": [{ "query": "hermes agent", "value": 25000, "formattedValue": "Breakout" }]
  },
  "status": "ok"
}
```

## Use cases

- **SEO and content planning**: find rising keywords and breakout queries before competitors do.
- **Seasonality**: see when demand for a product or topic peaks each year.
- **E-commerce and product research**: compare products with Google Shopping trends.
- **YouTube creators**: check YouTube search interest for video ideas.
- **Market and investment signals**: track search interest in stocks, crypto, brands and events over time.
- **Brand monitoring**: compare your brand against competitors by region.
- **AI agents and LLM workflows**: call it from the Apify API, MCP, Make, Zapier or n8n and feed trend data to your agent.

## API and integrations

Run it from Python, JavaScript, or any HTTP client with the Apify API, schedule it daily or weekly, and connect results to Google Sheets, Slack, Make, Zapier or n8n. Each run's dataset is available at a stable API URL.

## FAQ

**Is this an official Google Trends API?** No. Google has no general public Trends API; this actor reads the same public data you see on trends.google.com.

**Why are values 0-100?** Google Trends reports relative interest. 100 is the peak for that term in the chosen place and time; values are not absolute search volumes.

**Can I compare several keywords on one scale?** Each term is fetched on its own scale. For a direct comparison, run the terms with the same country and time range and compare their shapes and peaks.

**Do I need my own proxy?** No. A residential proxy is included in the price.

**What if a keyword fails?** It comes back with `status: "error"` and is free. Rerun just those terms.

**Is scraping Google Trends legal?** The actor only collects publicly available, aggregated data. You are responsible for how you use it.

## Feedback

Missing a field or a country? Open an issue on the **Issues** tab and we usually respond within a day.
