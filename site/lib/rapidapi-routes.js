import { runActorSync } from "./apify.js";

function asArray(value, limit) {
  if (value == null || value === "") return [];
  let list;
  if (Array.isArray(value)) list = value;
  else if (typeof value === "string") {
    list = value
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  } else list = [value];
  const out = [];
  for (const item of list) {
    if (out.length >= limit) break;
    if (item == null) continue;
    if (typeof item === "string") {
      const s = item.trim();
      if (s) out.push(s);
    } else if (typeof item === "object" && typeof item.url === "string" && item.url.trim()) {
      out.push(item.url.trim());
    } else {
      out.push(item);
    }
  }
  return out;
}

function clampInt(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function pickBool(value, fallback) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return fallback;
}

export const ACTORS = {
  transcript: "K6gy5przjaK3aGBui",
  reviews: "WxaibafRzqMEbw3a1",
  "ats-jobs": "Sg9IBSe6bU8pHQhqq",
  youtube: "hBFgxuPGYhbyPvRLZ",
  spotify: "e7AkjYtpI9wqg1ZhP",
  "google-trends": "hXY7zZLseNSqsI1ra",
};

export const ENDPOINTS = Object.keys(ACTORS);

export function buildActorInput(endpoint, body) {
  const b = body && typeof body === "object" ? body : {};
  switch (endpoint) {
    case "transcript": {
      const videoUrls = asArray(b.videoUrls || b.videoUrl || b.url, 2);
      const instagramUsernames = asArray(b.instagramUsernames, 2);
      if (!videoUrls.length && !instagramUsernames.length) {
        return {
          error:
            'Send JSON { "videoUrl": "https://www.tiktok.com/@user/video/..." } or instagramUsernames.',
        };
      }
      return {
        input: {
          videoUrls,
          instagramUsernames,
          maxReelsPerProfile: clampInt(b.maxReelsPerProfile, 3, 1, 3),
          speechToText: typeof b.speechToText === "string" ? b.speechToText : "auto",
          sttModel: typeof b.sttModel === "string" ? b.sttModel : "base",
          maxTranscribeSeconds: clampInt(b.maxTranscribeSeconds, 180, 15, 180),
          language: typeof b.language === "string" ? b.language : undefined,
          includeSegments: pickBool(b.includeSegments, true),
          includeSrt: pickBool(b.includeSrt, false),
          maxVideos: 2,
        },
        timeoutSec: 120,
      };
    }
    case "reviews": {
      const apps = asArray(b.apps || b.app, 2);
      if (!apps.length) {
        return { error: 'Send JSON { "apps": ["Spotify"] }.' };
      }
      const stores = ["both", "appstore", "play"].includes(b.stores) ? b.stores : "both";
      return {
        input: {
          apps,
          stores,
          maxReviewsPerStore: clampInt(b.maxReviewsPerStore, 20, 1, 50),
          sort: typeof b.sort === "string" ? b.sort : "newest",
          country: typeof b.country === "string" ? b.country : "us",
          language: typeof b.language === "string" ? b.language : "en",
          includeSummary: pickBool(b.includeSummary, true),
        },
        timeoutSec: 90,
      };
    }
    case "ats-jobs": {
      const companies = asArray(b.companies || b.company, 3);
      if (!companies.length) {
        return { error: 'Send JSON { "companies": ["openai", "stripe"] }.' };
      }
      return {
        input: {
          companies,
          keywords: asArray(b.keywords, 10),
          titleKeywords: asArray(b.titleKeywords, 10),
          locations: asArray(b.locations, 10),
          remoteOnly: pickBool(b.remoteOnly, false),
          postedWithinDays: b.postedWithinDays != null ? clampInt(b.postedWithinDays, 0, 0, 365) : undefined,
          withSalaryOnly: pickBool(b.withSalaryOnly, false),
          atsPlatforms: asArray(b.atsPlatforms, 8),
          includeDescription: pickBool(b.includeDescription, true),
          maxJobsPerCompany: clampInt(b.maxJobsPerCompany, 25, 1, 25),
          maxJobsTotal: clampInt(b.maxJobsTotal, 50, 1, 50),
          includeSummary: pickBool(b.includeSummary, true),
        },
        timeoutSec: 90,
      };
    }
    case "youtube": {
      const videoUrls = asArray(b.videoUrls || b.videoUrl, 10);
      const channels = asArray(b.channels || b.channel, 3);
      const searchQueries = asArray(b.searchQueries || b.query || b.searchQuery, 3);
      const playlistUrls = asArray(b.playlistUrls || b.playlistUrl, 2);
      if (!videoUrls.length && !channels.length && !searchQueries.length && !playlistUrls.length) {
        return {
          error:
            'Send JSON with videoUrls, channels, searchQueries, and/or playlistUrls.',
        };
      }
      return {
        input: {
          videoUrls,
          channels,
          channelTabs: asArray(b.channelTabs, 3).length ? asArray(b.channelTabs, 3) : ["videos"],
          maxVideosPerChannel: clampInt(b.maxVideosPerChannel, 15, 1, 15),
          searchQueries,
          maxResultsPerQuery: clampInt(b.maxResultsPerQuery, 15, 1, 15),
          sortBy: typeof b.sortBy === "string" ? b.sortBy : "relevance",
          uploadedWithin: typeof b.uploadedWithin === "string" ? b.uploadedWithin : "any",
          playlistUrls,
          maxVideosPerPlaylist: clampInt(b.maxVideosPerPlaylist, 15, 1, 15),
          fullDetails: pickBool(b.fullDetails, true),
          maxTotalResults: clampInt(b.maxTotalResults, 25, 1, 25),
        },
        timeoutSec: 90,
      };
    }
    case "spotify": {
      const startUrls = asArray(b.startUrls || b.urls || b.url, 10);
      if (!startUrls.length) {
        return { error: 'Send JSON { "startUrls": ["https://open.spotify.com/track/..."] }.' };
      }
      return {
        input: {
          startUrls,
          maxTracksPerInput: clampInt(b.maxTracksPerInput, 20, 1, 20),
          includeAlbumSummary: pickBool(b.includeAlbumSummary, true),
        },
        timeoutSec: 60,
      };
    }
    case "google-trends": {
      const searchTerms = asArray(b.searchTerms || b.term || b.q, 3);
      const trendingNow = pickBool(b.trendingNow, false);
      if (!searchTerms.length && !trendingNow) {
        return { error: 'Send JSON { "searchTerms": ["bitcoin"] } or { "trendingNow": true }.' };
      }
      return {
        input: {
          searchTerms,
          geo: typeof b.geo === "string" ? b.geo : "US",
          timeRange: typeof b.timeRange === "string" ? b.timeRange : "today 12-m",
          customTimeRange: typeof b.customTimeRange === "string" ? b.customTimeRange : undefined,
          category: clampInt(b.category, 0, 0, 1000),
          property: typeof b.property === "string" ? b.property : "",
          interestOverTime: pickBool(b.interestOverTime, true),
          interestByRegion: pickBool(b.interestByRegion, true),
          relatedQueries: pickBool(b.relatedQueries, true),
          relatedTopics: pickBool(b.relatedTopics, true),
          compareMode: pickBool(b.compareMode, false),
          trendingNow,
          language: typeof b.language === "string" ? b.language : "en-US",
          maxTerms: 3,
        },
        timeoutSec: 90,
      };
    }
    default:
      return { error: "Unknown endpoint" };
  }
}

export async function handleEndpoint(endpoint, body) {
  const built = buildActorInput(endpoint, body);
  if (built.error) return { status: 400, body: { error: built.error } };
  return runActorSync(ACTORS[endpoint], built.input, { timeoutSec: built.timeoutSec });
}
