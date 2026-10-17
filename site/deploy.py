import os,hashlib,json,urllib.request
T=os.environ['VERCEL_TOKEN'];TEAM='team_OjSneKmlC7KPQFMdCrQvMDcC';R='public'
def req(m,u,data=None,h={}):
  r=urllib.request.Request('https://api.vercel.com'+u+('&' if '?' in u else '?')+'teamId='+TEAM,data=data,method=m,headers={'Authorization':'Bearer '+T,**h})
  try: return json.load(urllib.request.urlopen(r))
  except urllib.error.HTTPError as e: return {'httpError':e.code,'body':e.read().decode()[:500]}
files=[]
for d,_,fs in os.walk(R):
  for f in fs:
    p=os.path.join(d,f);b=open(p,'rb').read();sha=hashlib.sha1(b).hexdigest()
    x=req('POST','/v2/files',b,{'x-vercel-digest':sha,'Content-Type':'application/octet-stream','Content-Length':str(len(b))})
    if x: print(p,x)
    files.append({'file':os.path.relpath(p,R),'sha':sha,'size':len(b)})
print(json.dumps(req('PATCH','/v9/projects/gouda-studios-agent-tools',json.dumps({'ssoProtection':None,'framework':None}).encode(),{'Content-Type':'application/json'}).get('ssoProtection','ok-null')))
d=req('POST','/v13/deployments',json.dumps({'name':'gouda-studios-agent-tools','project':'gouda-studios-agent-tools','target':'production','files':files,'projectSettings':{'framework':None,'buildCommand':None,'outputDirectory':None}}).encode(),{'Content-Type':'application/json'})
print({k:d.get(k) for k in ('id','url','readyState','alias','httpError','body')})
