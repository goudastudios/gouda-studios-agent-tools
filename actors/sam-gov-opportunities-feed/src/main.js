import { Actor, log } from 'apify';

const UA = 'MoneyBot-SAMgovFeed/0.1 (+https://apify.com; contact via Apify Store)';
const SEARCH = 'https://sam.gov/api/prod/sgs/v1/search/';
const DETAIL = 'https://sam.gov/api/prod/opps/v2/opportunities/';
const OFFICIAL = 'https://api.sam.gov/prod/opportunities/v2/search';
const TYPES = { p: 'Presolicitation', k: 'Combined Synopsis/Solicitation', o: 'Solicitation', r: 'Sources Sought',
  s: 'Special Notice', a: 'Award Notice', g: 'Sale of Surplus Property', i: 'Intent to Bundle', u: 'Justification (J&A)' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(url, tries = 4) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/hal+json, application/json' } });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) { const t = await res.text(); throw Object.assign(new Error(`HTTP ${res.status}: ${t.slice(0, 200)}`), { fatal: true }); }
      return await res.json();
    } catch (e) {
      if (e.fatal || i === tries) throw e;
      const wait = 1000 * 2 ** i; log.warning(`Retry ${i} for ${url.split('?')[0]} in ${wait}ms: ${e.message}`); await sleep(wait);
    }
  }
}
const stripHtml = (h) => (h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const daysUntil = (iso) => { if (!iso) return null; const t = Date.parse(iso); return Number.isNaN(t) ? null : Math.ceil((t - Date.now()) / 86400000); };

await Actor.init();
const input = (await Actor.getInput()) || {};
const {
  keywords = '', naicsCodes = [], noticeTypes = [], setAsides = [], states = [], agencyContains = '',
  postedWithinDays = 0, minDaysUntilResponse = null, activeOnly = true, includeDetails = true,
  includeContacts = true, onlyNew = false, maxResults = 100, apiKey = '',
} = input;
const max = Math.max(1, Math.min(10000, maxResults));
const cutoff = postedWithinDays > 0 ? Date.now() - postedWithinDays * 86400000 : null;
const stateSet = new Set(states.map((s) => s.toUpperCase()));

const store = await Actor.openKeyValueStore('sam-gov-feed-state');
const stateKey = 'seen-' + Buffer.from(JSON.stringify({ keywords, naicsCodes, noticeTypes, setAsides, states, agencyContains })).toString('base64url').slice(0, 200);
const seen = new Set(onlyNew ? ((await store.getValue(stateKey)) || []) : []);

let pushed = 0, scanned = 0, skippedSeen = 0;
const newIds = [];

async function emit(rec) {
  if (onlyNew && seen.has(rec.noticeId)) { skippedSeen++; return; }
  if (stateSet.size && !stateSet.has((rec.placeOfPerformanceState || '').toUpperCase())) return;
  if (agencyContains && !(rec.agencyPath || '').toLowerCase().includes(agencyContains.toLowerCase())) return;
  if (minDaysUntilResponse != null && (rec.daysUntilResponse == null || rec.daysUntilResponse < minDaysUntilResponse)) return;
  if (!includeContacts) delete rec.contacts;
  await Actor.pushData(rec, 'opportunity');
  newIds.push(rec.noticeId); pushed++;
}

function fromPublic(r, d) {
  const org = (r.organizationHierarchy || []).map((o) => o.name).filter(Boolean);
  const d2 = d?.data2 || {};
  const pop = d2.placeOfPerformance || {};
  const naics = (d2.naics || []).flatMap((n) => n.code || []);
  const resp = d2.solicitation?.deadlines?.response || r.responseDateActual || r.responseDate || null;
  return {
    noticeId: r._id,
    title: r.title,
    solicitationNumber: r.solicitationNumber || d2.solicitationNumber || null,
    noticeType: r.type?.value || TYPES[d2.type] || null,
    noticeTypeCode: r.type?.code || d2.type || null,
    department: org[0] || null,
    subTier: org[1] || null,
    office: org[org.length - 1] || null,
    agencyPath: org.join(' > '),
    postedDate: r.publishDate || d?.postedDate || null,
    modifiedDate: r.modifiedDate || null,
    responseDeadline: resp,
    daysUntilResponse: daysUntil(resp),
    naicsCodes: naics,
    pscCode: d2.classificationCode || null,
    setAside: d2.solicitation?.setAside && d2.solicitation.setAside !== 'NONE' ? d2.solicitation.setAside : null,
    placeOfPerformanceCity: pop.city?.name || null,
    placeOfPerformanceState: pop.state?.code || null,
    placeOfPerformanceCountry: pop.country?.code || null,
    awardee: r.award?.awardee?.name || d2.award?.awardee?.name || null,
    awardAmount: d2.award?.amount ?? null,
    awardDate: d2.award?.date || null,
    isActive: r.isActive ?? null,
    isCanceled: r.isCanceled ?? null,
    description: stripHtml(d?.description?.[0]?.body || r.descriptions?.[0]?.content || ''),
    contacts: (d2.pointOfContact || []).map((c) => ({ type: c.type, name: c.fullName, title: c.title, email: c.email, phone: c.phone })),
    url: `https://sam.gov/opp/${r._id}/view`,
    detailFetched: !!d,
    source: 'sam.gov public search',
    scrapedAt: new Date().toISOString(),
  };
}

async function runPublic() {
  const pageSize = 100;
  for (let page = 0; pushed < max && page * pageSize < 10000; page++) {
    const p = new URLSearchParams({ index: 'opp', page: String(page), size: String(pageSize), sort: '-modifiedDate', mode: 'search', is_active: String(activeOnly) });
    if (keywords) p.set('q', keywords);
    if (naicsCodes.length) p.set('naics', naicsCodes.join(','));
    if (noticeTypes.length) p.set('notice_type', noticeTypes.join(','));
    if (setAsides.length) p.set('set_aside', setAsides.join(','));
    const data = await getJson(`${SEARCH}?${p}`);
    const results = data?._embedded?.results || [];
    if (page === 0) log.info(`SAM.gov reports ${data?.page?.totalElements ?? 0} matching notices`);
    if (!results.length) break;
    let stop = false;
    for (const r of results) {
      if (pushed >= max) break;
      scanned++;
      if (cutoff && Date.parse(r.modifiedDate || r.publishDate) < cutoff) { stop = true; break; }
      if (onlyNew && seen.has(r._id)) { skippedSeen++; continue; }
      let d = null;
      if (includeDetails) {
        try { d = await getJson(DETAIL + r._id); } catch (e) { log.warning(`Detail failed for ${r._id}: ${e.message}`); }
        await sleep(150);
      }
      await emit(fromPublic(r, d));
    }
    if (stop) break;
    await sleep(300);
  }
}

async function runOfficial() {
  const fmt = (t) => { const d = new Date(t); return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`; };
  const from = cutoff || Date.now() - 364 * 86400000;
  for (let offset = 0; pushed < max; offset += 1000) {
    const p = new URLSearchParams({ api_key: apiKey, limit: '1000', offset: String(offset), postedFrom: fmt(from), postedTo: fmt(Date.now()) });
    if (keywords) p.set('title', keywords);
    if (naicsCodes[0]) p.set('ncode', String(naicsCodes[0]));
    if (noticeTypes[0]) p.set('ptype', noticeTypes[0]);
    if (setAsides[0]) p.set('typeOfSetAside', setAsides[0]);
    const data = await getJson(`${OFFICIAL}?${p}`);
    const rows = data.opportunitiesData || [];
    if (!rows.length) break;
    for (const o of rows) {
      if (pushed >= max) break; scanned++;
      if (activeOnly && o.active !== 'Yes') continue;
      const pop = o.placeOfPerformance || {};
      await emit({
        noticeId: o.noticeId, title: o.title, solicitationNumber: o.solicitationNumber || null, noticeType: o.type, noticeTypeCode: null,
        department: o.department || null, subTier: o.subTier || null, office: o.office || null, agencyPath: o.fullParentPathName || '',
        postedDate: o.postedDate, modifiedDate: null, responseDeadline: o.responseDeadLine || null, daysUntilResponse: daysUntil(o.responseDeadLine),
        naicsCodes: o.naicsCode ? [o.naicsCode] : [], pscCode: o.classificationCode || null, setAside: o.typeOfSetAside || null,
        placeOfPerformanceCity: pop.city?.name || null, placeOfPerformanceState: pop.state?.code || null, placeOfPerformanceCountry: pop.country?.code || null,
        awardee: o.award?.awardee?.name || null, awardAmount: o.award?.amount ?? null, awardDate: o.award?.date || null,
        isActive: o.active === 'Yes', isCanceled: null, description: o.description || '',
        contacts: (o.pointOfContact || []).map((c) => ({ type: c.type, name: c.fullName, title: c.title, email: c.email, phone: c.phone })),
        url: o.uiLink, detailFetched: false, source: 'api.sam.gov (your key)', scrapedAt: new Date().toISOString(),
      });
    }
    if (rows.length < 1000) break;
  }
}

try {
  if (apiKey) await runOfficial(); else await runPublic();
} catch (e) {
  log.error(`Run stopped: ${e.message}`);
  if (!pushed) { await Actor.fail(`Could not read SAM.gov: ${e.message}`); }
}
if (onlyNew) await store.setValue(stateKey, [...seen, ...newIds].slice(-50000));
log.info(`Done. Scanned ${scanned}, delivered ${pushed}, skipped already-seen ${skippedSeen}.`);
await Actor.setValue('RUN_SUMMARY', { scanned, delivered: pushed, skippedAlreadySeen: skippedSeen, finishedAt: new Date().toISOString() });
await Actor.exit();
