import { Actor, log } from 'apify';

await Actor.init();
const input = (await Actor.getInput()) || {};
const { keywords = [], recipientNames = [], awardingAgencies = [], naicsCodes = [], states = [],
  awardType = 'contracts', startDate, endDate, minAmount, maxAmount, maxResults = 100, onlyNew = false } = input;
const max = Math.max(1, Math.min(10000, maxResults));
const TYPES = { contracts: ['A', 'B', 'C', 'D'], grants: ['02', '03', '04', '05'], idvs: ['IDV_A', 'IDV_B', 'IDV_B_A', 'IDV_B_B', 'IDV_B_C', 'IDV_C', 'IDV_D', 'IDV_E'],
  loans: ['07', '08'], direct_payments: ['06', '10'], other: ['09', '11', '-1'] };
const isContract = awardType === 'contracts' || awardType === 'idvs';
const today = new Date().toISOString().slice(0, 10);
const filters = {
  award_type_codes: TYPES[awardType] || TYPES.contracts,
  time_period: [{ start_date: startDate || new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10), end_date: endDate || today }],
};
if (keywords.length) filters.keywords = keywords;
if (recipientNames.length) filters.recipient_search_text = recipientNames;
if (awardingAgencies.length) filters.agencies = awardingAgencies.map((name) => ({ type: 'awarding', tier: 'toptier', name }));
if (naicsCodes.length) filters.naics_codes = { require: naicsCodes };
if (states.length) filters.place_of_performance_locations = states.map((s) => ({ country: 'USA', state: s.toUpperCase() }));
if (minAmount != null || maxAmount != null) filters.award_amounts = [{ ...(minAmount != null && { lower_bound: minAmount }), ...(maxAmount != null && { upper_bound: maxAmount }) }];
const F = isContract
  ? ['Award ID', 'Recipient Name', 'Recipient UEI', 'Award Amount', 'Total Outlays', 'Description', 'Start Date', 'End Date', 'Awarding Agency', 'Awarding Sub Agency', 'Funding Agency', 'Contract Award Type', 'NAICS', 'PSC', 'Place of Performance State Code', 'Place of Performance City Code', 'Last Modified Date', 'generated_internal_id']
  : ['Award ID', 'Recipient Name', 'Recipient UEI', 'Award Amount', 'Total Outlays', 'Description', 'Start Date', 'End Date', 'Awarding Agency', 'Awarding Sub Agency', 'Funding Agency', 'Award Type', 'Assistance Listings', 'Place of Performance State Code', 'Last Modified Date', 'generated_internal_id'];

const store = await Actor.openKeyValueStore('usaspending-feed-state');
const key = 'seen-' + Buffer.from(JSON.stringify({ keywords, recipientNames, awardingAgencies, naicsCodes, states, awardType })).toString('base64url').slice(0, 200);
const seen = new Set(onlyNew ? (await store.getValue(key)) || [] : []);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pushed = 0; const delivered = [];
for (let page = 1; pushed < max; page++) {
  let data;
  for (let i = 1; i <= 4; i++) {
    const res = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'MoneyBot-USAspending/0.1' },
      body: JSON.stringify({ filters, fields: F, page, limit: 100, sort: 'Award Amount', order: 'desc', subawards: false }) });
    if (res.ok) { data = await res.json(); break; }
    const t = await res.text();
    if (res.status === 400 || res.status === 422) { await Actor.fail(`USAspending rejected the filters: ${t.slice(0, 300)}`); }
    log.warning(`HTTP ${res.status}, retry ${i}`); await sleep(1500 * 2 ** i);
  }
  if (!data) throw new Error('USAspending API unavailable');
  for (const r of data.results || []) {
    const id = r.generated_internal_id;
    if (seen.has(id)) continue;
    await Actor.pushData({
      awardId: r['Award ID'], recipientName: r['Recipient Name'], recipientUei: r['Recipient UEI'] || null,
      awardAmount: r['Award Amount'], totalOutlays: r['Total Outlays'] ?? null, description: r.Description,
      startDate: r['Start Date'], endDate: r['End Date'], awardingAgency: r['Awarding Agency'], awardingSubAgency: r['Awarding Sub Agency'],
      fundingAgency: r['Funding Agency'], awardType: r['Contract Award Type'] || r['Award Type'] || awardType,
      naics: r.NAICS || null, psc: r.PSC || null, assistanceListings: r['Assistance Listings'] || null,
      placeOfPerformanceState: r['Place of Performance State Code'] || null, lastModified: r['Last Modified Date'] || null,
      internalId: id, url: `https://www.usaspending.gov/award/${id}` }, 'award');
    pushed++; delivered.push(id);
    if (pushed >= max) break;
  }
  if (!data.page_metadata?.hasNext) break;
}
if (onlyNew) await store.setValue(key, [...seen, ...delivered].slice(-50000));
await Actor.setValue('RUN_SUMMARY', { delivered: pushed, filters, finishedAt: new Date().toISOString() });
log.info(`Delivered ${pushed} awards`);
await Actor.exit();
