# Website Contact Extractor: Emails, Phones and Social Links per Site

Turn a list of websites into a clean lead sheet. Paste domains or URLs, and get **one deduplicated row per website** with emails, phone numbers, social media profiles and the business address.

**You pay only for websites where we find at least one email or phone number.** Sites that fail to load or have no contact details are still returned so you can see what happened, but they are free.

## Why use this contact extractor?

- **One row per website, not per page.** No merge or dedupe step. Ready for CSV, Excel, Google Sheets or your CRM.
- **Priced per website, not per page.** $2.50 per 1,000 websites with contacts found, no matter how many pages we read on each site (up to 40).
- **Finds what simple scrapers miss.** Decodes Cloudflare-protected emails, reads `mailto:` and `tel:` links, schema.org data, and common obfuscation like `name [at] company [dot] com`.
- **Cleaner phones.** Every phone number is validated and returned in E.164 format (`+12125551234`) plus national format, country and line type. Random digit strings are dropped instead of being dumped into an "uncertain" list.
- **Email quality hints.** Each email is flagged as role account (info@, sales@) or personal, whether it matches the website's own domain, and whether its domain has MX records that can receive mail.
- **Smart page selection.** Reads the homepage first, then the pages most likely to hold contacts: Contact, About, Team, Impressum, Support and Locations.
- **Polite by default.** Respects robots.txt and needs no login, cookies or proxy for most business sites.

## What data do you get?

| Field | Example |
| --- | --- |
| `domain` | `acme-plumbing.com` |
| `siteName` | `Acme Plumbing` |
| `primaryEmail` | `info@acme-plumbing.com` |
| `emails` | all emails found on the site |
| `primaryPhone` / `phones` | `+15125550199` |
| `linkedin`, `facebook`, `instagram`, `x`, `youtube`, `tiktok` | profile URLs |
| `otherSocials` | GitHub, Pinterest, Threads, Telegram, WhatsApp, Discord, Reddit, Bluesky |
| `addresses` | street, city, region, postal code, country (from schema.org) |
| `contactPageUrls` | links to the site's contact pages |
| `emailDetails` | per email: page found on, source, role account, domain match, MX check |
| `phoneDetails` | per phone: E.164, international and national format, country, type, source |
| `status` | `ok`, `no_contacts_found` or `failed` |
| `charged` | `true` only for rows you paid for |

## How to use it

1. Paste your websites into **Websites**, one per line. Bare domains like `example.com` work.
2. Optional: change **Max pages per site** (default 8), **Default phone country** (default US) or turn on a proxy.
3. Click **Start**. Download results as CSV, Excel, JSON or HTML, or pull them with the API.

### Input example

```json
{
  "startUrls": ["https://apify.com", "python.org", "acme-plumbing.com"],
  "maxPagesPerSite": 8,
  "defaultCountry": "US",
  "checkMx": true,
  "respectRobotsTxt": true
}
```

### Output example

```json
{
  "domain": "apify.com",
  "siteName": "Apify",
  "status": "ok",
  "primaryEmail": "support@apify.com",
  "emails": ["support@apify.com", "hello@apify.com"],
  "phones": [],
  "linkedin": ["https://www.linkedin.com/company/apify"],
  "x": ["https://x.com/apify"],
  "otherSocials": { "github": ["https://github.com/apify"], "discord": ["https://discord.gg/..."] },
  "addresses": [{ "street": "Na Prikope 959/27", "city": "Prague", "postalCode": "11000", "country": "CZ" }],
  "contactPageUrls": ["https://apify.com/contact"],
  "pagesScanned": 4,
  "charged": true
}
```

## Pricing

Pay per event:

- **Website with contacts:** $0.0025 per website ($2.50 per 1,000) where at least one email or phone is found.
- **Actor start:** $0.0005 per run.
- Websites with no contacts, or that fail to load: **free**.

Example: 1,000 websites where 700 have contacts costs about $1.75. Set a maximum charge per run in the run options and the Actor stops cleanly when it is reached.

## Use cases

- Enrich a list of company domains from a CRM, trade show or directory export
- Find contact emails and phones for local businesses, agencies, law firms, clinics and contractors
- Collect official social media profiles for brand monitoring or outreach
- Feed AI agents and automations (Make, Zapier, n8n, MCP) with structured contact data

## Use with AI agents and MCP

This Actor works through the Apify MCP server and the Apify API, so agents like Claude or ChatGPT can call it with a list of URLs and get JSON back. It is also listed on [Gouda Studios Agent Tools](https://gouda-studios-agent-tools.vercel.app/).

## FAQ

**Does it log in to sites or bypass paywalls?** No. It reads only public pages that any visitor can see, and it respects robots.txt by default.

**Why is a site marked `failed`?** The domain did not resolve, timed out, or blocked automated requests. Failed rows are free. Turning on Apify Proxy often helps with sites that block datacenter traffic.

**Is it legal to extract contact details?** Collecting publicly listed business contact information is generally lawful, but results can include personal data (for example a named employee's email). Privacy laws such as GDPR and CCPA, and anti-spam laws such as CAN-SPAM, still apply to how you store and use it. You are responsible for having a lawful basis. If in doubt, ask a lawyer.

**Does it handle JavaScript-heavy sites?** It reads the HTML the server returns, which covers the vast majority of business websites and keeps runs fast and cheap. Contact details that only appear after JavaScript runs may be missed.

## Feedback

Found a site where we missed a contact? Open an issue in the Issues tab with the URL and we will look at it.
