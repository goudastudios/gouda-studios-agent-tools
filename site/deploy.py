# Manual production deploy (fallback only; normal path is git push -> Vercel GitHub integration).
# Deploys the pushed HEAD commit from GitHub, so Vercel's Root Directory "site" (public/ + api/ + vercel.json) is used as-is.
# Run from site/ after pushing. Needs VERCEL_TOKEN in env; never print it.
import os,json,subprocess,urllib.request
T=os.environ['VERCEL_TOKEN'];TEAM='team_OjSneKmlC7KPQFMdCrQvMDcC';PROJECT='gouda-studios-agent-tools'
def req(m,u,body=None):
  r=urllib.request.Request('https://api.vercel.com'+u+('&' if '?' in u else '?')+'teamId='+TEAM,data=json.dumps(body).encode() if body is not None else None,method=m,headers={'Authorization':'Bearer '+T,'Content-Type':'application/json'})
  try: return json.load(urllib.request.urlopen(r))
  except urllib.error.HTTPError as e: return {'httpError':e.code,'body':e.read().decode()[:500]}
sha=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
remote=subprocess.check_output(['git','ls-remote','origin','main'],text=True).split()[0]
if sha!=remote: raise SystemExit(f'HEAD {sha[:7]} is not pushed (origin/main is {remote[:7]}). Push first.')
p=req('GET',f'/v9/projects/{PROJECT}')
print('rootDirectory:',p.get('rootDirectory'),'| git deploys:',(p.get('gitProviderOptions') or {}).get('createDeployments'))
d=req('POST','/v13/deployments',{'name':PROJECT,'project':PROJECT,'target':'production','gitSource':{'type':'github','repoId':p['link']['repoId'],'ref':'main','sha':sha}})
print({k:d.get(k) for k in ('id','url','readyState','httpError','body')})
