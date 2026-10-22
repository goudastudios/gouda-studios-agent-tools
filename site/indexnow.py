# Submit homepage, tool pages and guide pages to IndexNow. Run after the deploy is live.
import json,re,urllib.request
src=open('build.py').read(); KEY=re.search(r"INDEXNOW_KEY='(\w+)'",src).group(1)
BASE='https://gouda-studios-agent-tools.vercel.app'; HOST=BASE.split('//')[1]
urls=[l.strip() for l in open('urls.txt') if l.strip()=='/' or l.strip().startswith(('/tools/','/guides/'))]
urls=[BASE+u for u in urls if u.endswith('/')]
body={'host':HOST,'key':KEY,'keyLocation':f'{BASE}/{KEY}.txt','urlList':urls}
r=urllib.request.Request('https://api.indexnow.org/indexnow',data=json.dumps(body).encode(),headers={'Content-Type':'application/json; charset=utf-8'})
try: print(len(urls),'urls ->',urllib.request.urlopen(r).status)
except urllib.error.HTTPError as e: print(len(urls),'urls ->',e.code,e.read().decode()[:300])
