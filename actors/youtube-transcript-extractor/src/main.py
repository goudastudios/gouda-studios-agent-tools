import asyncio, re, html
import httpx
from apify import Actor
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import GenericProxyConfig

ID_RE = re.compile(r'(?:v=|/shorts/|youtu\.be/|/embed/|/live/|/v/)([A-Za-z0-9_-]{11})')

def video_id(s):
    s = (s or '').strip()
    if re.fullmatch(r'[A-Za-z0-9_-]{11}', s):
        return s
    m = ID_RE.search(s)
    return m.group(1) if m else None

def fmt_ts(sec):
    sec = int(sec); h, r = divmod(sec, 3600); m, s = divmod(r, 60)
    return f'{h}:{m:02d}:{s:02d}' if h else f'{m}:{s:02d}'

def to_srt(snips):
    def t(x):
        ms = int(round(x * 1000)); h, r = divmod(ms, 3600000); m, r = divmod(r, 60000); s, ms = divmod(r, 1000)
        return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
    return '\n'.join(f'{i}\n{t(x.start)} --> {t(x.start + x.duration)}\n{x.text}\n' for i, x in enumerate(snips, 1))


IOS_CLIENT = {'clientName': 'IOS', 'clientVersion': '20.10.4', 'deviceMake': 'Apple', 'deviceModel': 'iPhone16,2', 'osName': 'iPhone', 'osVersion': '18.3.2.22D82', 'hl': 'en'}
IOS_UA = 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)'

class Snip:
    def __init__(self, text, start, duration):
        self.text, self.start, self.duration = text, start, duration

class Tr:
    def __init__(self, code, name, gen, translatable):
        self.language_code, self.language, self.is_generated, self.is_translatable = code, name, gen, translatable

def innertube_fetch(vid, langs, prefer_manual, translate_to, proxy_url=None):
    with httpx.Client(timeout=25, proxy=proxy_url, headers={'User-Agent': IOS_UA}) as c:
        r = c.post('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', json={'context': {'client': IOS_CLIENT}, 'videoId': vid})
        j = r.json()
        ps = j.get('playabilityStatus', {})
        tracks = j.get('captions', {}).get('playerCaptionsTracklistRenderer', {}).get('captionTracks', [])
        if not tracks:
            st = ps.get('status')
            if st in ('OK', None):
                raise RuntimeError('NoTranscriptFound: this video has no captions')
            if 'bot' in (ps.get('reason') or '') or st == 'LOGIN_REQUIRED' and 'confirm' in (ps.get('reason') or ''):
                raise RuntimeError(f'RequestBlocked: {ps.get("reason", "")}')
            raise RuntimeError(f'Unavailable: {st} {ps.get("reason", "")}'.strip())
        def name(t):
            n = t.get('name', {}); return n.get('simpleText') or ''.join(x.get('text', '') for x in n.get('runs', []))
        avail = [{'languageCode': t['languageCode'], 'language': name(t), 'isGenerated': t.get('kind') == 'asr'} for t in tracks]
        pick = None
        for code in langs:
            cands = [t for t in tracks if t['languageCode'] == code or t['languageCode'].split('-')[0] == code]
            if prefer_manual:
                cands.sort(key=lambda t: t.get('kind') == 'asr')
            if cands:
                pick = cands[0]; break
        pick = pick or tracks[0]
        url = pick['baseUrl'] + '&fmt=json3'
        if translate_to and pick['languageCode'] != translate_to:
            url += f'&tlang={translate_to}'
        x = c.get(url)
        if x.status_code != 200 or not x.text.strip():
            raise RuntimeError(f'RequestBlocked: timedtext HTTP {x.status_code}')
        snips = []
        for ev in x.json().get('events', []):
            if 'segs' not in ev:
                continue
            t = ''.join(sg.get('utf8', '') for sg in ev['segs']).strip()
            if t:
                snips.append(Snip(t, ev.get('tStartMs', 0) / 1000, ev.get('dDurationMs', 0) / 1000))
        if not snips:
            raise RuntimeError('NoTranscriptFound: empty caption track')
        tr = Tr(translate_to if (translate_to and pick['languageCode'] != translate_to) else pick['languageCode'], name(pick), pick.get('kind') == 'asr', pick.get('isTranslatable', False))
        vd = j.get('videoDetails', {})
        return tr, snips, avail, vd

async def oembed(client, vid):
    try:
        r = await client.get('https://www.youtube.com/oembed', params={'url': f'https://www.youtube.com/watch?v={vid}', 'format': 'json'})
        if r.status_code == 200:
            j = r.json(); return j.get('title'), j.get('author_name'), j.get('author_url')
    except Exception:
        pass
    return None, None, None

def fetch_one(api, vid, langs, prefer_manual, translate_to):
    tl = api.list(vid)
    tr = None
    try:
        tr = (tl.find_manually_created_transcript(langs) if prefer_manual else tl.find_transcript(langs))
    except Exception:
        try:
            tr = tl.find_transcript(langs)
        except Exception:
            tr = next(iter(tl))
    if translate_to and tr.language_code != translate_to and tr.is_translatable:
        tr = tr.translate(translate_to)
    data = tr.fetch()
    avail = [{'languageCode': t.language_code, 'language': t.language, 'isGenerated': t.is_generated} for t in tl]
    return tr, data, avail

async def main():
    async with Actor:
        inp = await Actor.get_input() or {}
        raw = list(inp.get('videos') or []) + [x.get('url') if isinstance(x, dict) else x for x in (inp.get('startUrls') or [])]
        langs = inp.get('languages') or ['en']
        translate_to = (inp.get('translateTo') or '').strip() or None
        prefer_manual = inp.get('preferManual', True)
        include_segments = inp.get('includeSegments', True)
        include_srt = inp.get('includeSrt', False)
        max_videos = int(inp.get('maxVideos') or 1000)
        ids, seen = [], set()
        for s in raw:
            v = video_id(s if isinstance(s, str) else '')
            if v and v not in seen:
                seen.add(v); ids.append(v)
        ids = ids[:max_videos]
        if not ids:
            await Actor.fail(status_message='No valid YouTube video URLs or IDs in input.'); return
        proxy_cfg = None
        pi = inp.get('proxyConfiguration')
        if pi and (pi.get('useApifyProxy') or pi.get('proxyUrls')):
            proxy_cfg = await Actor.create_proxy_configuration(actor_proxy_input=pi)
        elif Actor.is_at_home():
            # Built-in residential proxy, included in the price.
            try:
                proxy_cfg = await Actor.create_proxy_configuration(groups=['RESIDENTIAL'])
            except Exception as e:
                Actor.log.warning(f'Residential proxy unavailable, running direct: {e}')
        Actor.log.info(f'Fetching transcripts for {len(ids)} videos')
        ok = 0
        async with httpx.AsyncClient(timeout=20) as client:
            for vid in ids:
                title, channel, channel_url = await oembed(client, vid)
                row = {'videoId': vid, 'url': f'https://www.youtube.com/watch?v={vid}', 'title': title, 'channel': channel, 'channelUrl': channel_url}
                err = None
                for attempt in range(3):
                    try:
                        px = None; pu = None
                        if proxy_cfg:
                            pu = await proxy_cfg.new_url()
                            px = GenericProxyConfig(http_url=pu, https_url=pu)
                        try:
                            tr, snips, avail, vd = await asyncio.to_thread(innertube_fetch, vid, langs, prefer_manual, translate_to, pu if proxy_cfg else None)
                            row['title'] = row['title'] or vd.get('title'); row['channel'] = row['channel'] or vd.get('author')
                        except Exception as e1:
                            if str(e1).startswith(('NoTranscriptFound', 'Unavailable')):
                                raise
                            api = YouTubeTranscriptApi(proxy_config=px)
                            tr, data, avail = await asyncio.to_thread(fetch_one, api, vid, langs, prefer_manual, translate_to)
                            snips = list(data.snippets)
                        text = ' '.join(html.unescape(s.text).replace('\n', ' ') for s in snips)
                        row.update({'status': 'ok', 'languageCode': tr.language_code, 'language': tr.language, 'isGenerated': tr.is_generated,
                                    'translatedTo': translate_to, 'wordCount': len(text.split()),
                                    'durationSeconds': round(snips[-1].start + snips[-1].duration, 2) if snips else 0,
                                    'text': text,
                                    'timestampedText': '\n'.join(f'[{fmt_ts(s.start)}] {html.unescape(s.text)}' for s in snips),
                                    'availableLanguages': avail})
                        if include_segments:
                            row['segments'] = [{'start': s.start, 'duration': s.duration, 'text': html.unescape(s.text)} for s in snips]
                        if include_srt:
                            row['srt'] = to_srt(snips)
                        err = None; break
                    except Exception as e:
                        err = f'{type(e).__name__}: {str(e).splitlines()[0][:300] if str(e) else ""}'
                        name = type(e).__name__
                        if err.startswith('RuntimeError: NoTranscriptFound') or err.startswith('RuntimeError: Unavailable'):
                            err = err.replace('RuntimeError: ', ''); break
                        if name in ('TranscriptsDisabled', 'NoTranscriptFound', 'VideoUnavailable', 'InvalidVideoId', 'AgeRestricted', 'VideoUnplayable'):
                            break
                        await asyncio.sleep(2 * (attempt + 1))
                if err:
                    row.update({'status': 'error', 'error': err})
                    await Actor.push_data(row)
                else:
                    ok += 1
                    await Actor.push_data(row, charged_event_name='transcript')
        await Actor.set_status_message(f'Done: {ok}/{len(ids)} transcripts extracted. Failed videos are free.')
