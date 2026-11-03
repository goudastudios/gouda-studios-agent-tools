import asyncio, json, random
import xml.etree.ElementTree as ET
import httpx
from apify import Actor

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
BASE = 'https://trends.google.com/trends/api'

def strip(t):
    i = t.find('{'); j = t.find('[')
    k = min(x for x in (i, j) if x >= 0)
    return json.loads(t[k:])

class Trends:
    def __init__(self, proxy_cfg, hl, tz):
        self.proxy_cfg, self.hl, self.tz, self.c = proxy_cfg, hl, tz, None

    async def new_client(self):
        if self.c: await self.c.aclose()
        pu = await self.proxy_cfg.new_url() if self.proxy_cfg else None
        self.c = httpx.AsyncClient(timeout=30, proxy=pu, follow_redirects=True, headers={'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9'})
        try: await self.c.get('https://trends.google.com/?geo=US')
        except Exception: pass

    async def get(self, path, params, tries=6):
        last = None
        for a in range(tries):
            if self.c is None: await self.new_client()
            try:
                r = await self.c.get(f'{BASE}/{path}', params={'hl': self.hl, 'tz': self.tz, **params})
                if r.status_code == 200: return strip(r.text)
                last = f'HTTP {r.status_code}'
            except Exception as e:
                last = str(e)
            Actor.log.info(f'{path}: {last}, rotating session (try {a+1})')
            await asyncio.sleep(1 + random.random() * 2)
            await self.new_client()
        raise RuntimeError(f'Google Trends blocked {path}: {last}')

    async def widgets(self, kw, geo, time, cat, prop):
        req = {'comparisonItem': [{'keyword': kw, 'geo': geo, 'time': time}], 'category': cat, 'property': prop}
        return (await self.get('explore', {'req': json.dumps(req)}))['widgets']


def ranked(d, kind):
    out = {}
    lists = d.get('default', {}).get('rankedList', [])
    for name, rl in zip(('top', 'rising'), lists):
        rows = []
        for k in rl.get('rankedKeyword', []):
            if kind == 'q': rows.append({'query': k.get('query'), 'value': k.get('value'), 'formattedValue': k.get('formattedValue'), 'link': 'https://trends.google.com' + k.get('link', '')})
            else:
                t = k.get('topic', {}); rows.append({'title': t.get('title'), 'type': t.get('type'), 'mid': t.get('mid'), 'value': k.get('value'), 'formattedValue': k.get('formattedValue')})
        out[name] = rows
    return out

async def trending_now(geo):
    async with httpx.AsyncClient(timeout=30, headers={'User-Agent': UA}) as c:
        r = await c.get('https://trends.google.com/trending/rss', params={'geo': geo or 'US'})
    ns = {'ht': 'https://trends.google.com/trending/rss'}
    root = ET.fromstring(r.text); rows = []
    for it in root.iter('item'):
        news = [{'title': n.findtext('ht:news_item_title', namespaces=ns), 'url': n.findtext('ht:news_item_url', namespaces=ns), 'source': n.findtext('ht:news_item_source', namespaces=ns)} for n in it.findall('ht:news_item', ns)]
        rows.append({'type': 'trendingNow', 'geo': geo or 'US', 'title': it.findtext('title'), 'approxTraffic': it.findtext('ht:approx_traffic', namespaces=ns), 'pubDate': it.findtext('pubDate'), 'picture': it.findtext('ht:picture', namespaces=ns), 'news': news})
    return rows

async def main():
    async with Actor:
        inp = await Actor.get_input() or {}
        terms = [t.strip() for t in inp.get('searchTerms', []) if t and t.strip()][: int(inp.get('maxTerms', 100))]
        geo = (inp.get('geo') or '').upper(); time = inp.get('timeRange') or 'today 12-m'
        cat = int(inp.get('category') or 0); prop = inp.get('property') or ''
        want = {k: inp.get(k, True) for k in ('interestOverTime', 'interestByRegion', 'relatedQueries', 'relatedTopics')}
        if inp.get('trendingNow'):
            rows = await trending_now(geo)
            for r in rows: await Actor.push_data(r, charged_event_name='result')
            Actor.log.info(f'Trending now: {len(rows)} topics')
        if not terms:
            if not inp.get('trendingNow'): await Actor.fail(status_message='Add at least one search term or turn on Trending now.')
            return
        proxy_cfg = None
        pi = inp.get('proxyConfiguration')
        if pi and (pi.get('useApifyProxy') or pi.get('proxyUrls')):
            proxy_cfg = await Actor.create_proxy_configuration(actor_proxy_input=pi)
        elif Actor.is_at_home():
            try: proxy_cfg = await Actor.create_proxy_configuration(groups=['RESIDENTIAL'], country_code='US')
            except Exception as e: Actor.log.warning(f'Residential proxy unavailable: {e}')
        tr = Trends(proxy_cfg, inp.get('language') or 'en-US', '0'); ok = 0
        for kw in terms:
            row = {'type': 'keyword', 'searchTerm': kw, 'geo': geo or 'WORLDWIDE', 'timeRange': time, 'category': cat, 'property': prop or 'web'}
            try:
                ws = await tr.widgets(kw, geo, time, cat, prop)
                for w in ws:
                    wid = w['id']
                    if wid == 'TIMESERIES' and want['interestOverTime']:
                        d = await tr.get('widgetdata/multiline', {'req': json.dumps(w['request']), 'token': w['token']})
                        row['interestOverTime'] = [{'date': p.get('formattedTime'), 'timestamp': int(p['time']), 'value': p['value'][0], 'isPartial': bool(p.get('isPartial'))} for p in d['default']['timelineData']]
                    elif wid == 'GEO_MAP' and want['interestByRegion']:
                        d = await tr.get('widgetdata/comparedgeo', {'req': json.dumps(w['request']), 'token': w['token']})
                        row['interestByRegion'] = [{'geoCode': p.get('geoCode'), 'geoName': p.get('geoName'), 'value': p['value'][0]} for p in d['default']['geoMapData'] if p.get('hasData', [True])[0]]
                    elif wid == 'RELATED_QUERIES' and want['relatedQueries']:
                        row['relatedQueries'] = ranked(await tr.get('widgetdata/relatedsearches', {'req': json.dumps(w['request']), 'token': w['token']}), 'q')
                    elif wid == 'RELATED_TOPICS' and want['relatedTopics']:
                        d = await tr.get('widgetdata/relatedsearches', {'req': json.dumps(w['request']), 'token': w['token']})
                        row['relatedTopics'] = ranked(d, 't')
                iot = row.get('interestOverTime') or []
                if iot:
                    vals = [p['value'] for p in iot]; row['averageInterest'] = round(sum(vals) / len(vals), 1); row['peakInterest'] = max(vals)
                    row['peakDate'] = iot[vals.index(max(vals))]['date']
                row['status'] = 'ok'; ok += 1
                await Actor.push_data(row, charged_event_name='result')
            except Exception as e:
                row['status'] = 'error'; row['error'] = str(e)[:300]
                await Actor.push_data(row)
            await asyncio.sleep(0.5 + random.random())
        await Actor.set_status_message(f'Done: {ok}/{len(terms)} search terms. Failed terms are free.')
