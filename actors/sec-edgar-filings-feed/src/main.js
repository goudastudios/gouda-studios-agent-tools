import { Actor, log } from 'apify';

// SEC fair-access policy: declare who you are, stay under 10 requests/second.
await Actor.init();
const input = (await Actor.getInput()) || {};
const { tickers = [], ciks = [], formTypes = ['8-K'], filedWithinDays = 7, onlyNew = false, maxResults = 100,
  contactEmail = 'apify-actor@users.noreply.apify.com' } = input;
const UA = `MoneyBot-EDGAR-Feed/0.1 ${contactEmail}`;
const max = Math.max(1, Math.min(5000, maxResults));
const forms = new Set(formTypes.map((f) => f.toUpperCase()));
const cutoff = filedWithinDays > 0 ? new Date(Date.now() - filedWithinDays * 86400000).toISOString().slice(0, 10) : '0000';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, json = true) {
  for (let i = 1; i <= 4; i++) {
    await sleep(150);
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Encoding': 'gzip, deflate' } });
    if (res.ok) return json ? res.json() : res.text();
    if (res.status === 404) return null;
    log.warning(`HTTP ${res.status} for ${url}, retry ${i}`); await sleep(1000 * 2 ** i);
  }
  throw new Error(`Failed ${url}`);
}
const store = await Actor.openKeyValueStore('sec-edgar-feed-state');
const key = 'seen-' + Buffer.from(JSON.stringify({ tickers, ciks, formTypes })).toString('base64url').slice(0, 200);
const seen = new Set(onlyNew ? (await store.getValue(key)) || [] : []);
let pushed = 0; const delivered = [];
async function emit(r) {
  if (pushed >= max || seen.has(r.accessionNumber)) return;
  await Actor.pushData(r, 'filing'); pushed++; delivered.push(r.accessionNumber);
}
const pad = (c) => String(c).padStart(10, '0');

let cikList = ciks.map((c) => String(c).replace(/\D/g, '')).filter(Boolean);
if (tickers.length) {
  const map = await get('https://www.sec.gov/files/company_tickers.json');
  const byT = Object.fromEntries(Object.values(map).map((x) => [x.ticker.toUpperCase(), x.cik_str]));
  for (const t of tickers) { const c = byT[t.toUpperCase()]; if (c) cikList.push(String(c)); else log.warning(`Unknown ticker ${t}`); }
}

if (cikList.length) {
  for (const cik of [...new Set(cikList)]) {
    const s = await get(`https://data.sec.gov/submissions/CIK${pad(cik)}.json`);
    if (!s) { log.warning(`No submissions for CIK ${cik}`); continue; }
    const f = s.filings.recent;
    for (let i = 0; i < f.accessionNumber.length && pushed < max; i++) {
      if (forms.size && !forms.has(f.form[i].toUpperCase())) continue;
      if (f.filingDate[i] < cutoff) break;
      const acc = f.accessionNumber[i], nodash = acc.replace(/-/g, '');
      await emit({ companyName: s.name, cik: String(Number(cik)), tickers: s.tickers, sic: s.sic, sicDescription: s.sicDescription,
        stateOfIncorporation: s.stateOfIncorporation || null, form: f.form[i], filingDate: f.filingDate[i], reportDate: f.reportDate[i] || null,
        acceptedAt: f.acceptanceDateTime[i], accessionNumber: acc, items: f.items[i] ? f.items[i].split(',') : [],
        description: f.primaryDocDescription[i] || null, isXBRL: !!f.isXBRL[i],
        documentUrl: `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${nodash}/${f.primaryDocument[i]}`,
        indexUrl: `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${nodash}/${acc}-index.htm` });
    }
  }
} else {
  // Market-wide latest filings (official EDGAR "current events" Atom feed), per form type.
  for (const form of (forms.size ? [...forms] : [''])) {
    for (let start = 0; pushed < max && start < 2000; start += 100) {
      const xml = await get(`https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=${encodeURIComponent(form)}&company=&dateb=&owner=include&start=${start}&count=100&output=atom`, false);
      const entries = [...(xml || '').matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => m[1]);
      if (!entries.length) break;
      let old = false;
      for (const e of entries) {
        const g = (re) => (e.match(re) || [])[1];
        const title = g(/<title>(.*?)<\/title>/) || '';
        const sum = (g(/<summary[^>]*>([\s\S]*?)<\/summary>/) || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        const filed = (sum.match(/Filed:<\/b>\s*([\d-]+)/) || [])[1];
        if (filed && filed < cutoff) { old = true; break; }
        const tm = title.match(/^(.*?) - (.*) \((\d+)\) \((.*?)\)$/) || [];
        const formType = g(/term="([^"]+)"/) || tm[1];
        if (forms.size && !forms.has(formType.toUpperCase())) continue;
        const href = g(/href="([^"]+)"/);
        await emit({ companyName: tm[2] || title, cik: tm[3] ? String(Number(tm[3])) : null, filerRole: tm[4] || null, form: formType,
          filingDate: filed || null, acceptedAt: g(/<updated>(.*?)<\/updated>/), accessionNumber: (g(/accession-number=([\d-]+)/) || ''),
          items: [...sum.matchAll(/Item (\d+\.\d+): ([^<\n]+)/g)].map((m) => `${m[1]} ${m[2].trim()}`),
          indexUrl: href, documentUrl: null });
        if (pushed >= max) break;
      }
      if (old || entries.length < 100) break;
    }
  }
}
if (onlyNew) await store.setValue(key, [...seen, ...delivered].slice(-20000));
await Actor.setValue('RUN_SUMMARY', { delivered: pushed, finishedAt: new Date().toISOString() });
log.info(`Delivered ${pushed} filings`);
await Actor.exit();
