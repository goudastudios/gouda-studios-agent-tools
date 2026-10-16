import { Actor, log } from 'apify';

await Actor.init();
const input = (await Actor.getInput()) || {};
const { companyNames = [], leis = [], registrationNumbers = [], country = '', activeOnly = true,
  maxMatchesPerName = 3, includeParents = true, maxResults = 100 } = input;
const max = Math.max(1, Math.min(5000, maxResults));
const API = 'https://api.gleif.org/api/v1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(path) {
  for (let i = 1; i <= 4; i++) {
    const res = await fetch(API + path, { headers: { Accept: 'application/vnd.api+json', 'User-Agent': 'MoneyBot-GLEIF-Lookup/0.1' } });
    if (res.ok) return res.json();
    if (res.status === 404) return null;
    log.warning(`HTTP ${res.status} ${path}, retry ${i}`); await sleep(1000 * 2 ** i);
  }
  throw new Error(`GLEIF API failed for ${path}`);
}
const addr = (a) => a && { lines: a.addressLines, city: a.city, region: a.region, postalCode: a.postalCode, country: a.country };
async function parent(lei, kind) {
  const d = await get(`/lei-records/${lei}/${kind}-parent`);
  const a = d?.data?.attributes; return a ? { lei: a.lei, name: a.entity.legalName.name, country: a.entity.legalAddress.country } : null;
}
let pushed = 0;
async function emit(rec, query) {
  if (pushed >= max) return;
  const a = rec.attributes, e = a.entity, reg = a.registration;
  const row = { query, lei: a.lei, legalName: e.legalName.name, otherNames: (e.otherNames || []).map((n) => n.name),
    status: e.status, registrationStatus: reg.status, category: e.category, legalFormId: e.legalForm?.id || null,
    jurisdiction: e.jurisdiction, registeredAs: e.registeredAs, registrationAuthorityId: e.registeredAt?.id || null,
    legalAddress: addr(e.legalAddress), headquartersAddress: addr(e.headquartersAddress),
    entityCreatedAt: e.creationDate || null, initialRegistrationDate: reg.initialRegistrationDate, lastUpdateDate: reg.lastUpdateDate,
    nextRenewalDate: reg.nextRenewalDate, bic: a.bic || [], successorLei: e.successorEntity?.lei || null,
    url: `https://search.gleif.org/#/record/${a.lei}` };
  if (includeParents) { row.directParent = await parent(a.lei, 'direct'); row.ultimateParent = await parent(a.lei, 'ultimate'); }
  await Actor.pushData(row, 'company'); pushed++;
}
const f = (k, v) => `filter[${k}]=${encodeURIComponent(v)}`;
const extra = [country && f('entity.legalAddress.country', country.toUpperCase()), activeOnly && f('entity.status', 'ACTIVE')].filter(Boolean).join('&');
for (const lei of leis) { const d = await get(`/lei-records/${lei.trim().toUpperCase()}`); if (d?.data) await emit(d.data, lei); else log.warning(`LEI not found: ${lei}`); }
for (const rn of registrationNumbers) {
  const d = await get(`/lei-records?${f('entity.registeredAs', rn)}${extra ? '&' + extra : ''}&page[size]=${maxMatchesPerName}`);
  for (const r of d?.data || []) await emit(r, rn);
}
for (const name of companyNames) {
  // Exact legal-name match first, then GLEIF full-text search as a fallback.
  let d = await get(`/lei-records?${f('entity.legalName', name)}${extra ? '&' + extra : ''}&page[size]=${maxMatchesPerName}`);
  if (!d?.data?.length) d = await get(`/lei-records?${f('fulltext', name)}${extra ? '&' + extra : ''}&page[size]=${maxMatchesPerName}`);
  if (!d?.data?.length) log.warning(`No match for "${name}"`);
  for (const r of d?.data || []) await emit(r, name);
}
await Actor.setValue('RUN_SUMMARY', { delivered: pushed, finishedAt: new Date().toISOString() });
log.info(`Delivered ${pushed} company records`);
await Actor.exit();
