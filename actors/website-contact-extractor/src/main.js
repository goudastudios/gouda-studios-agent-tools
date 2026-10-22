import { Actor, log } from 'apify';
import { CheerioCrawler, RobotsTxtFile } from 'crawlee';
import { findPhoneNumbersInText, parsePhoneNumberFromString } from 'libphonenumber-js';
import dns from 'node:dns/promises';

await Actor.init();
const input = (await Actor.getInput()) || {};
const {
  startUrls = [], maxPagesPerSite = 8, defaultCountry = 'US', checkMx = true,
  respectRobotsTxt = true, proxyConfiguration: proxyInput,
} = input;
const maxPages = Math.max(1, Math.min(40, Number(maxPagesPerSite) || 8));
const country = (defaultCountry || 'US').toUpperCase().slice(0, 2);
const CHARGE_EVENT = 'site-with-contacts';

// ---------- input normalisation ----------
function normalise(raw) {
  let s = (typeof raw === 'string' ? raw : raw?.url || '').trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try { const u = new URL(s); u.hash = ''; return u; } catch { return null; }
}
const hostKey = (h) => h.toLowerCase().replace(/^www\./, '');
const sites = new Map(); // key -> state
for (const raw of startUrls) {
  const u = normalise(raw);
  if (!u) { log.warning(`Skipping invalid URL: ${JSON.stringify(raw)}`); continue; }
  const key = hostKey(u.hostname);
  if (sites.has(key)) continue;
  sites.set(key, {
    key, inputUrl: typeof raw === 'string' ? raw : raw.url, startUrl: u.href, finalUrl: null, siteName: null,
    pages: new Set(), queued: new Set([u.href]), budget: maxPages - 1, triedAlt: false, homeOk: false, homeError: null,
    pending: 0, done: false, aliases: new Set(), emails: new Map(), phones: new Map(), socials: {}, addresses: [], contactPages: new Set(), fallbackQueued: false,
  });
}
if (!sites.size) throw new Error('No valid websites in input. Add at least one URL or domain to "startUrls".');
log.info(`Extracting contacts from ${sites.size} site(s), up to ${maxPages} page(s) each.`);

// ---------- extractors ----------
const EMAIL_RE = /[a-z0-9][a-z0-9._%+-]{0,63}@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}/gi;
const BAD_EMAIL_TLD = /\.(png|jpe?g|gif|webp|svg|bmp|ico|css|js|mjs|json|xml|pdf|mp4|webm|woff2?|ttf|eot|avif|heic)$/i;
const BAD_EMAIL_DOMAINS = /(^|\.)(example\.(com|org|net)|domain\.com|email\.com|yourdomain\.com|yoursite\.com|company\.com|sentry\.io|sentry-next\.wixpress\.com|wixpress\.com|sentry\.wixpress\.com|ingest\.sentry\.io|godaddy\.com|test\.com|mysite\.com|website\.com|address\.com|placeholder\.com)$/i;
const BAD_LOCAL = /^(your|name|first|firstname|user|username|email|someone|john\.?doe|jane\.?doe|test|xxx+|example)$/i;
const ROLE_LOCAL = /^(info|contact|hello|hi|sales|support|help|admin|office|enquiries|inquiries|team|service|billing|press|media|marketing|careers|jobs|hr|privacy|legal|webmaster|mail|accounts|customerservice|bookings|reservations|orders)$/i;
const NOREPLY = /^(no-?reply|do-?not-?reply|mailer-daemon|postmaster)$/i;

function cleanEmail(e) {
  let x = e.toLowerCase().replace(/^mailto:/, '').split('?')[0].trim();
  try { x = decodeURIComponent(x); } catch { /* keep */ }
  x = x.replace(/^[^a-z0-9]+/, '').replace(/[^a-z]+$/, '');
  const m = x.match(/^([^@\s]+)@([^@\s]+)$/);
  if (!m) return null;
  const [, local, domain] = m;
  if (BAD_EMAIL_TLD.test(x) || BAD_EMAIL_DOMAINS.test(domain) || BAD_LOCAL.test(local)) return null;
  if (/^[0-9a-f]{16,}$/.test(local)) return null; // tracking hashes
  if (/@\d+x\./.test(x)) return null; // image@2x.png
  if (!domain.includes('.') || domain.length > 253) return null;
  return x;
}
function decodeCfEmail(hex) {
  try {
    const key = parseInt(hex.slice(0, 2), 16); let out = '';
    for (let i = 2; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key);
    return out;
  } catch { return null; }
}
function deobfuscate(text) {
  return text
    .replace(/\s*[[({<]\s*(?:at|@)\s*[\])}>]\s*/gi, '@')
    .replace(/\s+(?:at)\s+(?=[a-z0-9-]+\s*[[({<]\s*(?:dot|\.)\s*[\])}>])/gi, '@')
    .replace(/\s*[[({<]\s*(?:dot|\.)\s*[\])}>]\s*/gi, '.');
}

const SOCIALS = {
  linkedin: /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/(company|in|school|showcase)\/[^/?#\s]+/i,
  facebook: /^https?:\/\/(www\.|m\.|web\.)?(facebook|fb)\.com\/(?!sharer|share|dialog|plugins|tr\b|login|policies|help|privacy)[^?#\s]+/i,
  instagram: /^https?:\/\/(www\.)?instagram\.com\/(?!p\/|reel\/|explore|accounts|about)[^/?#\s]+/i,
  x: /^https?:\/\/(www\.)?(twitter|x)\.com\/(?!intent|share|home|search|hashtag|i\/)[A-Za-z0-9_]{1,15}\/?$/i,
  youtube: /^https?:\/\/(www\.)?youtube\.com\/(channel\/|c\/|user\/|@)[^/?#\s]+/i,
  tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@[^/?#\s]+/i,
  pinterest: /^https?:\/\/([a-z]{2}\.|www\.)?pinterest\.[a-z.]+\/(?!pin\/)[^/?#\s]+/i,
  github: /^https?:\/\/(www\.)?github\.com\/(?!features|about|pricing|login|sponsors)[^/?#\s]+\/?$/i,
  threads: /^https?:\/\/(www\.)?threads\.(net|com)\/@[^/?#\s]+/i,
  telegram: /^https?:\/\/(www\.)?(t\.me|telegram\.me)\/[^/?#\s]+/i,
  whatsapp: /^https?:\/\/(wa\.me|api\.whatsapp\.com\/send|chat\.whatsapp\.com)\/?[^\s]*/i,
  discord: /^https?:\/\/(www\.)?(discord\.gg|discord\.com\/invite)\/[^/?#\s]+/i,
  reddit: /^https?:\/\/(www\.)?reddit\.com\/(r|user|u)\/[^/?#\s]+/i,
  bluesky: /^https?:\/\/bsky\.app\/profile\/[^/?#\s]+/i,
};
const CONTACT_WORDS = /(contact|kontakt|contacto|contato|contatti|about|ueber-uns|uber-uns|über|team|staff|people|leadership|management|impressum|imprint|legal-notice|mentions-legales|support|help|customer-service|location|offices|find-us|reach|get-in-touch|enquir|inquir|company|who-we-are|our-story)/i;

function addEmail(site, email, pageUrl, source) {
  const e = cleanEmail(email); if (!e) return;
  if (!site.emails.has(e)) site.emails.set(e, { email: e, foundOn: pageUrl, source });
}
function addPhone(site, raw, pageUrl, source) {
  let p = null;
  try { p = parsePhoneNumberFromString(String(raw).replace(/^tel:/i, '').replace(/%20/g, ' '), country); } catch { /* ignore */ }
  if (!p || !p.isValid()) return;
  const nat = String(p.nationalNumber);
  const seq = (x) => [...Array(Math.max(0, x.length - 6)).keys()].some((i) => '01234567890123456789'.includes(x.slice(i, i + 7)) || '98765432109876543210'.includes(x.slice(i, i + 7)));
  if (/^(\d)\1+$/.test(nat) || /(\d)\1{5,}/.test(nat) || seq(nat) || (p.countryCallingCode === '1' && /^\d{3}55501\d\d$/.test(nat))) return; // placeholders
  const e164 = p.number;
  if (!site.phones.has(e164)) site.phones.set(e164, { e164, international: p.formatInternational(), national: p.formatNational(), country: p.country || null, type: p.getType() || null, foundOn: pageUrl, source });
}

function walkJsonLd(node, site, pageUrl) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((n) => walkJsonLd(n, site, pageUrl)); return; }
  if (node['@graph']) walkJsonLd(node['@graph'], site, pageUrl);
  const type = [].concat(node['@type'] || []).join(',');
  if (/Organization|LocalBusiness|Corporation|Store|Restaurant|Dentist|Attorney|Hotel|MedicalBusiness|ProfessionalService|Person|Place|Brand|NGO|School|Physician|Service/i.test(type)) {
    if (!site.siteName && node.name && typeof node.name === 'string' && !/Person/.test(type)) site.siteName = node.name.trim();
    for (const t of [].concat(node.telephone || [])) addPhone(site, t, pageUrl, 'schema.org');
    for (const e of [].concat(node.email || [])) addEmail(site, String(e), pageUrl, 'schema.org');
    for (const s of [].concat(node.sameAs || [])) addSocial(site, String(s));
    for (const a of [].concat(node.address || [])) {
      if (a && typeof a === 'object') {
        const addr = { street: a.streetAddress || null, city: a.addressLocality || null, region: a.addressRegion || null, postalCode: a.postalCode || null, country: (typeof a.addressCountry === 'object' ? a.addressCountry?.name : a.addressCountry) || null };
        const sig = JSON.stringify(addr);
        if (Object.values(addr).some(Boolean) && !site.addresses.some((x) => JSON.stringify(x) === sig)) site.addresses.push(addr);
      } else if (typeof a === 'string' && a.trim() && !site.addresses.some((x) => x.full === a.trim())) site.addresses.push({ full: a.trim() });
    }
  }
  for (const k of ['contactPoint', 'publisher', 'author', 'organization', 'brand', 'parentOrganization', 'location', 'department']) if (node[k]) walkJsonLd(node[k], site, pageUrl);
  if (node.contactPoint) for (const c of [].concat(node.contactPoint)) { if (c?.telephone) addPhone(site, c.telephone, pageUrl, 'schema.org'); if (c?.email) addEmail(site, c.email, pageUrl, 'schema.org'); }
}
function addSocial(site, href) {
  for (const [net, re] of Object.entries(SOCIALS)) {
    if (re.test(href)) {
      const clean = href.split('#')[0].replace(/\?.*$/, '').replace(/\/$/, '');
      site.socials[net] ??= [];
      if (!site.socials[net].some((x) => x.toLowerCase() === clean.toLowerCase())) site.socials[net].push(clean);
      return;
    }
  }
}

// ---------- robots.txt (own fetch with a hard timeout) + DNS precheck ----------
const robotsCache = new Map();
async function robotsFor(origin) {
  if (!robotsCache.has(origin)) {
    robotsCache.set(origin, (async () => {
      try {
        const res = await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(8000), redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WebsiteContactExtractor/1.0)' } });
        if (!res.ok) return null;
        const txt = (await res.text()).slice(0, 500000);
        return RobotsTxtFile.from(`${origin}/robots.txt`, txt);
      } catch { return null; }
    })());
  }
  return robotsCache.get(origin);
}
async function allowed(url) {
  if (!respectRobotsTxt) return true;
  const r = await robotsFor(new URL(url).origin);
  try { return r ? r.isAllowed(url) : true; } catch { return true; }
}
const resolves = (h) => Promise.race([dns.lookup(h).then(() => true, () => false), new Promise((r) => setTimeout(() => r(false), 6000))]);
async function enqueue(reqs) {
  const ok = [];
  for (const r of reqs) {
    if (await allowed(r.url)) { ok.push(r); sites.get(r.userData.siteKey).pending++; }
    else { const site = sites.get(r.userData.siteKey); site.robotsBlocked = (site.robotsBlocked || 0) + 1; if (r.userData.home) site.homeError = 'Blocked by robots.txt'; }
  }
  if (ok.length) await crawler.addRequests(ok);
}

// ---------- assemble one row per site ----------
const mxCache = new Map();
async function hasMx(domain) {
  if (!mxCache.has(domain)) {
    mxCache.set(domain, dns.resolveMx(domain).then((r) => r.length > 0).catch(async (e) => {
      if (e.code !== 'ENODATA' && e.code !== 'ENOTFOUND') return null; // unknown, do not guess
      // No MX: RFC 5321 allows delivery to the A record, but most providers treat this as undeliverable.
      return false;
    }));
  }
  return mxCache.get(domain);
}
let charged = 0, delivered = 0, limitReached = false;
async function finalize(site) {
  if (site.done || limitReached) return;
  site.done = true;

  const emailDetails = [];
  for (const e of site.emails.values()) {
    const [local, domain] = e.email.split('@');
    if (NOREPLY.test(local)) continue;
    emailDetails.push({ ...e, isRoleAccount: ROLE_LOCAL.test(local), matchesSiteDomain: [site.key, ...site.aliases].some((k) => hostKey(domain) === k || hostKey(domain).endsWith(`.${k}`) || k.endsWith(`.${hostKey(domain)}`)), domainHasMx: checkMx ? await hasMx(domain) : null });
  }
  emailDetails.sort((a, b) => (b.matchesSiteDomain - a.matchesSiteDomain) || (b.isRoleAccount - a.isRoleAccount) || ((b.domainHasMx === true) - (a.domainHasMx === true)));
  const homeUrl = site.finalUrl;
  const rank = (p) => (p.source === 'text' ? 2 : 0) + (p.foundOn === homeUrl ? 0 : 1);
  const phoneDetails = [...site.phones.values()].sort((a, b) => rank(a) - rank(b));
  const hasContacts = emailDetails.length > 0 || phoneDetails.length > 0;
  const status = !site.homeOk ? 'failed' : hasContacts ? 'ok' : 'no_contacts_found';
  const row = {
    inputUrl: site.inputUrl, domain: site.key, finalUrl: site.finalUrl, siteName: site.siteName, status,
    primaryEmail: emailDetails[0]?.email || null, primaryPhone: phoneDetails[0]?.e164 || null,
    emails: emailDetails.map((e) => e.email), phones: phoneDetails.map((p) => p.e164),
    linkedin: site.socials.linkedin || [], facebook: site.socials.facebook || [], instagram: site.socials.instagram || [],
    x: site.socials.x || [], youtube: site.socials.youtube || [], tiktok: site.socials.tiktok || [],
    otherSocials: Object.fromEntries(Object.entries(site.socials).filter(([k]) => !['linkedin', 'facebook', 'instagram', 'x', 'youtube', 'tiktok'].includes(k))),
    addresses: site.addresses, contactPageUrls: [...site.contactPages].slice(0, 5),
    emailDetails, phoneDetails, pagesScanned: site.pages.size, scannedUrls: [...site.pages],
    charged: hasContacts, error: site.homeOk ? null : site.homeError, scrapedAt: new Date().toISOString(),
  };
  if (hasContacts) {
    let room = Infinity;
    try { room = Actor.getChargingManager().calculateMaxEventChargeCountWithinLimit(CHARGE_EVENT); } catch { /* not PPE */ }
    if (room < 1) {
      limitReached = true; log.warning('Maximum charge per run reached. Stopping cleanly; rows already delivered are kept.');
      await crawler.autoscaledPool?.abort(); return;
    }
    const res = await Actor.pushData(row, CHARGE_EVENT);
    charged++;
    if (res?.eventChargeLimitReached || room === 1) {
      limitReached = true; log.warning('Maximum charge per run reached. Stopping cleanly; rows already delivered are kept.');
      await crawler.autoscaledPool?.abort();
    }
  } else await Actor.pushData(row);
  delivered++;
}
async function settle(site) { site.pending--; if (site.pending <= 0) await finalize(site); }

// ---------- crawler ----------
const proxyConfiguration = proxyInput?.useApifyProxy ? await Actor.createProxyConfiguration(proxyInput) : undefined;
const crawler = new CheerioCrawler({
  proxyConfiguration,
  maxConcurrency: 30,
  maxRequestRetries: 1,
  requestHandlerTimeoutSecs: 40,
  navigationTimeoutSecs: 20,
    additionalMimeTypes: ['application/xhtml+xml', 'text/plain'],
  ignoreSslErrors: true,
  async requestHandler({ request, $, body }) {
    const site = sites.get(request.userData.siteKey);
    if (site.done || limitReached) return;
    const pageUrl = request.loadedUrl || request.url;
    site.pages.add(pageUrl);
    if (request.userData.home) { site.homeOk = true; site.finalUrl = pageUrl; site.aliases.add(hostKey(new URL(pageUrl).hostname)); }
    if (!site.siteName) site.siteName = ($('meta[property="og:site_name"]').attr('content') || '').trim() || null;
    if (request.userData.home && !site.siteName) site.siteName = ($('title').first().text() || '').trim().split(/\s[|\-–]\s/)[0] || null;

    // Cloudflare-protected emails
    $('[data-cfemail]').each((_, el) => { const d = decodeCfEmail($(el).attr('data-cfemail')); if (d) addEmail(site, d, pageUrl, 'cloudflare-decoded'); });
    $('a[href*="/cdn-cgi/l/email-protection#"]').each((_, el) => { const d = decodeCfEmail(($(el).attr('href') || '').split('#')[1] || ''); if (d) addEmail(site, d, pageUrl, 'cloudflare-decoded'); });

    // JSON-LD
    $('script[type="application/ld+json"]').each((_, el) => { try { walkJsonLd(JSON.parse($(el).contents().text()), site, pageUrl); } catch { /* bad json */ } });

    const base = new URL(pageUrl);
    const internal = [];
    $('a[href]').each((_, el) => {
      const href = ($(el).attr('href') || '').trim();
      if (/^mailto:/i.test(href)) { addEmail(site, href, pageUrl, 'mailto'); return; }
      if (/^tel:/i.test(href)) { addPhone(site, href, pageUrl, 'tel-link'); return; }
      if (/^(https?:\/\/)?(wa\.me|api\.whatsapp\.com)/i.test(href)) { addSocial(site, href); }
      let abs; try { abs = new URL(href, base); } catch { return; }
      if (!/^https?:$/.test(abs.protocol)) return;
      const h = hostKey(abs.hostname);
      if (h === site.key || site.aliases.has(h)) {
        abs.hash = '';
        const text = $(el).text().trim().slice(0, 80);
        const path = abs.pathname.toLowerCase();
        if (/\.(pdf|jpe?g|png|gif|zip|docx?|xlsx?|mp4|mp3|svg|webp)$/.test(path)) return;
        let score = 0;
        if (CONTACT_WORDS.test(path)) score += 3;
        if (CONTACT_WORDS.test(text)) score += 2;
        if (/contact|kontakt|impressum|imprint/i.test(path + text)) score += 3;
        if (score > 0) internal.push({ url: abs.href, score });
      } else addSocial(site, abs.href);
    });

    // visible text: emails, deobfuscated emails, formatted phone numbers
    $('script, style, noscript, svg, template').remove();
    $('body *').each((_, el) => { $(el).append(' '); });
    const text = $('body').text().replace(/\s+/g, ' ');
    for (const m of text.match(EMAIL_RE) || []) addEmail(site, m, pageUrl, 'text');
    for (const m of deobfuscate(text).match(EMAIL_RE) || []) addEmail(site, m, pageUrl, 'text-deobfuscated');
    for (const m of String(body).match(EMAIL_RE) || []) { const e = cleanEmail(m); if (e && (hostKey(e.split('@')[1]) === site.key || site.aliases.has(hostKey(e.split('@')[1])))) addEmail(site, e, pageUrl, 'html'); }
    try {
      for (const f of findPhoneNumbersInText(text, { defaultCountry: country, v2: true })) {
        const raw = text.slice(f.startsAt, f.endsAt);
        const digits = raw.replace(/\D/g, '');
        if (digits.length >= 9 && /[\s().+-]/.test(raw) && f.number.isValid()) addPhone(site, f.number.number, pageUrl, 'text');
      }
    } catch { /* ignore */ }

    if (request.userData.home) {
      const seen = new Set(); const picks = internal.sort((a, b) => b.score - a.score).filter((x) => !seen.has(x.url) && seen.add(x.url));
      const add = [];
      for (const p of picks) { if (site.budget <= 0) break; if (site.queued.has(p.url)) continue; site.queued.add(p.url); site.budget--; add.push(p.url); }
      if (!picks.some((p) => /contact|kontakt/i.test(p.url))) {
        for (const guess of ['/contact', '/contact-us', '/about']) {
          if (site.budget <= 0) break; const g = new URL(guess, base).href; if (site.queued.has(g)) continue; site.queued.add(g); site.budget--; add.push(g);
        }
      }
      if (add.length) await enqueue(add.map((u) => ({ url: u, userData: { siteKey: site.key } })));
    }
    for (const p of internal) if (/contact|kontakt|impressum|imprint/i.test(p.url)) site.contactPages.add(p.url);
    await settle(site);
  },
  async failedRequestHandler({ request }, error) {
    const site = sites.get(request.userData.siteKey);
    if (!request.userData.home) { await settle(site); return; }
    site.homeError = error?.message?.slice(0, 200) || 'Failed to load';
    if (!site.triedAlt) {
      site.triedAlt = true;
      const u = new URL(request.url);
      const alt = u.hostname.startsWith('www.') ? `https://${u.hostname.slice(4)}/` : `https://www.${u.hostname}/`;
      const alts = [];
      if (await resolves(new URL(alt).hostname)) alts.push(alt);
      if (u.protocol === 'https:') alts.push(`http://${u.hostname}/`);
      log.info(`Homepage failed for ${site.key}, trying ${alts.join(' and ')}`);
      await enqueue(alts.map((url, i) => ({ url, uniqueKey: `alt${i}:${url}`, userData: { siteKey: site.key, home: true } })));
    }
    await settle(site);
  },
});

const homes = [];
await Promise.all([...sites.values()].map(async (s) => {
  const h = new URL(s.startUrl).hostname;
  const alt = h.startsWith('www.') ? h.slice(4) : `www.${h}`;
  if (await resolves(h)) homes.push({ url: s.startUrl, userData: { siteKey: s.key, home: true } });
  else if (await resolves(alt)) { s.triedAlt = true; homes.push({ url: s.startUrl.replace(h, alt), userData: { siteKey: s.key, home: true } }); }
  else { s.triedAlt = true; s.homeError = 'Domain does not resolve (DNS lookup failed)'; }
}));
await enqueue(homes);
await crawler.run();

// ---------- finish any sites that never got a request (DNS failure, robots.txt block) ----------
for (const site of sites.values()) await finalize(site);
await Actor.setValue('RUN_SUMMARY', { sites: sites.size, delivered, chargedSites: charged, limitReached, finishedAt: new Date().toISOString() });
log.info(`Done: ${delivered} site rows, ${charged} with contacts (charged), ${delivered - charged} free.`);
await Actor.exit();
