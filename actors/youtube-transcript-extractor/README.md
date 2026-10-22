# YouTube Transcript Extractor: Get Captions, Subtitles and SRT from Any Video

This **YouTube transcript extractor** turns YouTube links into clean transcripts. Paste video URLs, Shorts or IDs and get **one row per video** with the full transcript as plain text, timestamped text, timed segments and optional SRT subtitles, plus the video title and channel.

**You pay only for transcripts you get.** Videos with captions turned off, private or deleted videos and other failures are still returned with the reason, but they are free.

## Why use this YouTube transcript scraper?

- **$4 per 1,000 transcripts.** Cheaper than most transcript scrapers on the Store, with no monthly rental.
- **Bulk input.** Watch URLs, `youtu.be` links, Shorts, live and embed URLs, or bare 11-character IDs. Duplicates are removed.
- **Any language, plus translation.** Pick languages in priority order, prefer human-made captions over auto-generated ones, or auto-translate into another language with YouTube's own translation when the video offers it.
- **Ready for AI.** The `text` field is one clean string you can drop straight into ChatGPT, Claude, a RAG pipeline, a summarizer or a vector database.
- **Subtitles too.** Turn on SRT output to get a subtitle file for each video.
- **No login, no API key, no cookies, no proxy setup.** A residential proxy is built in and included in the price, so YouTube's "Sign in to confirm you're not a bot" blocks are handled for you.

## What data do you get?

| Field | Example |
| --- | --- |
| `videoId` | `dQw4w9WgXcQ` |
| `title`, `channel`, `channelUrl` | video title and channel |
| `status` | `ok` or `error` |
| `languageCode`, `language` | `en`, `English` |
| `isGenerated` | `true` for auto-generated captions |
| `text` | the full transcript as one string |
| `timestampedText` | `[0:18] We're no strangers to love` |
| `segments` | `{start, duration, text}` for every caption line |
| `srt` | SRT subtitle file (optional) |
| `wordCount`, `durationSeconds` | size of the transcript |
| `availableLanguages` | every caption track on the video |
| `error` | why a video failed (free) |

## How to get a YouTube transcript

1. Paste one or more YouTube links into **YouTube video URLs or IDs**.
2. Optional: set **Preferred languages** (default `en`), **Translate to**, or turn on **Include SRT subtitles**.
3. Click **Start**. Download transcripts as JSON, CSV, Excel or HTML, or pull them with the API.

## Use cases

- **Summarize YouTube videos with AI.** Feed transcripts to an LLM for summaries, notes, show notes or blog posts.
- **Repurpose content.** Turn videos and Shorts into articles, newsletters, tweets and LinkedIn posts.
- **Research and monitoring.** Search what creators, competitors or experts said across many videos.
- **Subtitles and accessibility.** Export SRT captions for editing or re-uploading.
- **Datasets.** Build training or evaluation sets from spoken content.

## Use it from code or an AI agent

Call it from the Apify API, the Python or JavaScript client, Make, Zapier, n8n, or as an MCP tool for Claude, Cursor and other AI agents.

```json
{ "videos": ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://youtu.be/9bZkp7q19f0"], "languages": ["en"], "includeSrt": true }
```

## Step-by-step guides

- [How to get a YouTube video transcript](https://gouda-studios-agent-tools.vercel.app/guides/how-to-get-a-youtube-video-transcript/), with or without code.
- [How to download YouTube transcripts in bulk](https://gouda-studios-agent-tools.vercel.app/guides/how-to-download-youtube-transcripts-in-bulk/) for a whole list of videos at once.

## Pricing

Pay per event: **$0.004 per transcript extracted** plus a tiny start fee per run. Failed videos cost nothing.

## FAQ

**Does it work for Shorts and live streams?** Yes, if the video has captions. Paste the Shorts or live URL as is.

**What if a video has no captions?** You get a row with `status: error` and the reason, and you are not charged. This tool reads YouTube's caption tracks; it does not run speech-to-text on audio.

**Can I get transcripts in another language?** Yes. Add language codes to **Preferred languages**, or set **Translate to** to auto-translate.

**Do I need a YouTube API key?** No.

**Is it legal to scrape YouTube transcripts?** This tool reads publicly available captions. Use the data in line with YouTube's terms and applicable copyright law, especially when republishing.

**Do I need a proxy?** No. Residential proxies are built in and included in the price. You can still supply your own under **Proxy**.
