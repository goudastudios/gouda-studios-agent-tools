import json,os,html,re,shutil
BADGE2='<a href="https://aiagentslisting.com/gouda-studios-agent-tools">\n  <img src="https://aiagentslisting.com/gouda-studios-agent-tools/badge.svg?theme=light" alt="Gouda Studios Agent Tools badge" width="200" height="50" loading="lazy" />\n</a>'
BADGE='<a href="https://aiagentsdirectory.com/agent/gouda-studios-agent-tools" target="_blank" rel="noopener" title="Discover Gouda Studios Agent Tools on AI Agents Directory"><img src="https://aiagentsdirectory.com/featured-badge.svg?v=2024" alt="Gouda Studios Agent Tools - Featured on AI Agents Directory" width="200" height="50" /></a> '
SRC='/workspace/moneybot-apify'; OUT='public'; BASE='https://gouda-studios-agent-tools.vercel.app'; EMAIL='m0f@mail.grokbot.com'
TOOLS=[
 dict(slug='sam-gov-opportunities-feed',name='SAM.gov Contract Opportunities',unit='opportunity',price=0.002,cat='Government contracting',
  ex={"keywords":"cybersecurity","naicsCodes":["541512"],"setAsides":["SBA"],"postedWithinDays":7,"maxResults":25},
  uses=["Small businesses and 8(a), HUBZone, SDVOSB and WOSB firms watching set-asides in their NAICS codes","Bid and capture teams building a daily opportunity pipeline","GovCon consultants running alerts for many clients","AI agents answering which federal RFPs are open for a capability"]),
 dict(slug='sec-edgar-filings-feed',name='SEC EDGAR Filings',unit='filing',price=0.002,cat='Financial filings',
  ex={"tickers":["AAPL","TSLA"],"formTypes":["8-K","10-Q"],"filedWithinDays":30,"maxResults":50},
  uses=["Investors and analysts watching 8-Ks and insider Form 4s for a watchlist","AI research agents that need what a company filed this week as JSON","Deal, IR and compliance teams tracking Form D raises, S-1s and 13D stakes"]),
 dict(slug='usaspending-awards-search',name='USAspending Federal Awards',unit='award',price=0.0015,cat='Government spending',
  ex={"keywords":["cybersecurity"],"awardType":"contracts","startDate":"2026-01-01","maxResults":50},
  uses=["GovCon BD teams researching competitor wins and incumbents","Grant seekers and consultants checking who funds what","AI agents answering who won federal money for a topic, with sourced data"]),
 dict(slug='gleif-company-lei-lookup',name='GLEIF Company LEI Lookup',unit='company',price=0.003,cat='Company data / KYB',
  ex={"companyNames":["Apple Inc."],"country":"US","maxResults":10},
  uses=["KYB, onboarding and compliance checks","CRM and lead enrichment with verified legal names, addresses and parents","AI agents that must confirm a company exists and who owns it"]),
]
START=0.001
def clean(s):
  if isinstance(s,str): return s.replace('\u2014',', ').replace('\u2013','-')
  if isinstance(s,list): return [clean(x) for x in s]
  if isinstance(s,dict): return {k:clean(v) for k,v in s.items()}
  return s
def trunc(v):
  if isinstance(v,str) and len(v)>300: return v[:300]+'...'
  if isinstance(v,list): return [trunc(x) for x in v[:5]]
  if isinstance(v,dict): return {k:trunc(x) for k,x in v.items()}
  return v
for t in TOOLS:
  d=f"{SRC}/{t['slug']}/.actor/"
  a=json.load(open(d+'actor.json')); i=json.load(open(d+'input_schema.json')); ds=json.load(open(d+'dataset_schema.json'))
  t['title']=clean(a.get('title')); t['desc']=clean(a.get('description'))
  t['actor']=f"gouda_studios/{t['slug']}"; t['apify']=f"https://apify.com/{t['actor']}"
  t['inputs']=[dict(name=k,type=v.get('type'),title=clean(v.get('title','')),description=clean(v.get('description','')),default=v.get('default'),**({'enum':v['enum']} if 'enum' in v else {})) for k,v in i['properties'].items()]
  t['input_schema']=clean(i)
  f=ds.get('fields',{}); t['dataset_fields']=clean(f)
  t['outputs']=[dict(name=k,type=v.get('type'),description=clean(v.get('description',''))) for k,v in f.get('properties',{}).items()]
  sd=f"{SRC}/{t['slug']}/storage/datasets/default/000000001.json"
  t['sample']=clean(trunc(json.load(open(sd)))) if os.path.exists(sd) else {}
  t['per1k']=round(t['price']*1000,2)
def curl(t): return f"""curl -X POST "https://api.apify.com/v2/acts/gouda_studios~{t['slug']}/run-sync-get-dataset-items?token=$APIFY_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{json.dumps(t['ex'])}'"""
def ld(t): return {"@context":"https://schema.org","@type":["SoftwareApplication","WebAPI"],"name":t['name'],"alternateName":t['title'],"description":t['desc'],"url":f"{BASE}/tools/{t['slug']}/","sameAs":t['apify'],"applicationCategory":"BusinessApplication","operatingSystem":"Cloud (Apify)","documentation":f"{BASE}/tools/{t['slug']}.json","provider":{"@type":"Organization","name":"Gouda Studios","email":EMAIL,"url":"https://apify.com/gouda_studios"},
 "offers":[{"@type":"Offer","name":"Actor start","price":str(START),"priceCurrency":"USD"},{"@type":"Offer","name":f"Per {t['unit']}","price":str(t['price']),"priceCurrency":"USD","priceSpecification":{"@type":"UnitPriceSpecification","price":t['price'],"priceCurrency":"USD","unitText":t['unit']}}]}
CSS="body{font-family:system-ui,sans-serif;max-width:860px;margin:2rem auto;padding:0 1rem;line-height:1.5;color:#222}pre{background:#f5f5f5;padding:1rem;overflow:auto;font-size:.85rem}table{border-collapse:collapse;width:100%;font-size:.9rem}td,th{border:1px solid #ddd;padding:.35rem;text-align:left;vertical-align:top}code{background:#f0f0f0;padding:0 .2rem}a{color:#0a58ca}"
def page(title,desc,body,jl,path):
  return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="google-site-verification" content="_Ybr6wmY-W34MNXBKQ_hFFmODi8KMyzlrg7Q5fC0v-k"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)}</title><meta name="description" content="{html.escape(desc)}"><link rel="canonical" href="{BASE}{path}"><link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt"><link rel="alternate" type="application/json" href="/tools.json" title="Tool catalog"><style>{CSS}</style><script type="application/ld+json">{json.dumps(jl)}</script></head><body><p><a href="/">Gouda Studios Agent Tools</a></p>{body}<hr><p>Contact: <a href="mailto:{EMAIL}">{EMAIL}</a> | Machine-readable: <a href="/llms.txt">llms.txt</a>, <a href="/llms-full.txt">llms-full.txt</a>, <a href="/tools.json">tools.json</a>, <a href="/openapi.json">openapi.json</a> | Source: <a href="https://github.com/goudastudios/gouda-studios-agent-tools">GitHub</a></p><p>{BADGE if path=="/" else ""}{BADGE2}</p></body></html>"""
E=html.escape
shutil.rmtree(OUT,ignore_errors=True); os.makedirs(OUT+'/tools'); os.makedirs(OUT+'/.well-known')
HOWPAY="Pay per event, with no platform usage fee added. AI agents can pay per run through Apify agentic payments (x402, Skyfire) with no Apify account, or call the tools with an Apify API token, or through the Apify MCP server at https://mcp.apify.com. One-URL MCP endpoint for all tools: https://gouda-studios-agent-tools.vercel.app/mcp (Streamable HTTP, Apify OAuth or Bearer Apify token)."
for t in TOOLS:
  ins=''.join(f"<tr><td><code>{E(p['name'])}</code></td><td>{E(str(p['type']))}</td><td>{E(json.dumps(p['default'])) if p['default'] is not None else ''}</td><td>{E(p['description'])}</td></tr>" for p in t['inputs'])
  outs=''.join(f"<tr><td><code>{E(o['name'])}</code></td><td>{E(str(o['type']))}</td><td>{E(o['description'])}</td></tr>" for o in t['outputs'])
  body=f"""<h1>{E(t['name'])}</h1><p>{E(t['desc'])}</p><p><a href="{t['apify']}">Open on Apify: {t['actor']}</a></p>
<h2>Use cases</h2><ul>{''.join(f'<li>{E(u)}</li>' for u in t['uses'])}</ul>
<h2>Pricing</h2><ul><li>Actor start: ${START} per run</li><li>${t['price']} per {t['unit']} returned (${t['per1k']} per 1,000)</li><li>No platform usage fee. Set <code>maxResults</code> to cap spend.</li></ul>
<h2>Input parameters</h2><table><tr><th>Name</th><th>Type</th><th>Default</th><th>Description</th></tr>{ins}</table>
<h2>Example input</h2><pre>{E(json.dumps(t['ex'],indent=2))}</pre>
<h2>Output fields (one row per {t['unit']})</h2><table><tr><th>Field</th><th>Type</th><th>Description</th></tr>{outs}</table>
<h2>Sample output row</h2><pre>{E(json.dumps(t['sample'],indent=2))}</pre>
<h2>How to call</h2><h3>Apify API (synchronous, returns dataset items)</h3><pre>{E(curl(t))}</pre>
<h3>Apify MCP server</h3><p>Connect an MCP client to <code>https://mcp.apify.com</code> and add the actor <code>{t['actor']}</code>, for example <code>https://mcp.apify.com/?tools={t['actor']}</code>.</p>
<h3>Agentic payments (x402 / Skyfire)</h3><p>This actor is eligible for Apify agentic payments, so an AI agent can pay per run without an Apify account. See <a href="https://docs.apify.com/platform/integrations/x402">Apify x402 docs</a>.</p>
<p>Machine-readable: <a href="/tools/{t['slug']}.json">/tools/{t['slug']}.json</a></p>"""
  os.makedirs(f"{OUT}/tools/{t['slug']}")
  open(f"{OUT}/tools/{t['slug']}/index.html",'w').write(page(f"{t['name']} API | Gouda Studios Agent Tools",t['desc'],body,ld(t),f"/tools/{t['slug']}/"))
  j={k:t[k] for k in ('slug','name','title','desc','actor','apify','cat','uses','inputs','outputs')}; j['description']=j.pop('desc')
  j.update(page=f"{BASE}/tools/{t['slug']}/",pricing={"model":"pay-per-event","currency":"USD","platformUsageFee":False,"events":[{"name":"apify-actor-start","price":START},{"name":t['unit'],"price":t['price'],"per":t['unit']}]},
    call={"apifyApi":{"method":"POST","url":f"https://api.apify.com/v2/acts/gouda_studios~{t['slug']}/run-sync-get-dataset-items","auth":"Bearer APIFY_TOKEN or ?token=","body":"input JSON"},"mcp":{"server":"https://mcp.apify.com","actor":t['actor']},"agenticPayments":["x402","Skyfire"]},
    exampleInput=t['ex'],sampleOutput=t['sample'],inputSchema=t['input_schema'],contact=EMAIL)
  t['json']=j; json.dump(j,open(f"{OUT}/tools/{t['slug']}.json",'w'),indent=2)
cards=''.join(f"<h2><a href=\"/tools/{t['slug']}/\">{E(t['name'])}</a></h2><p>{E(t['desc'])}</p><p>${START} per run + ${t['price']} per {t['unit']}. <a href=\"{t['apify']}\">Apify</a> | <a href=\"/tools/{t['slug']}.json\">JSON</a></p>" for t in TOOLS)
idx_ld={"@context":"https://schema.org","@type":"WebSite","name":"Gouda Studios Agent Tools","url":BASE+"/","publisher":{"@type":"Organization","name":"Gouda Studios","email":EMAIL},"hasPart":[ld(t) for t in TOOLS]}
open(OUT+'/index.html','w').write(page("Gouda Studios Agent Tools: public records APIs for AI agents","Four agent-payable data tools for SAM.gov, SEC EDGAR, USAspending and GLEIF. Pay per result, JSON output, Apify API and MCP.",
 f"<h1>Gouda Studios Agent Tools</h1><p>Clean, low-cost data tools for public government and company records, built for people and AI agents. All four run on Apify. {E(HOWPAY)}</p>{cards}",idx_ld,"/"))
cat={"name":"Gouda Studios Agent Tools","url":BASE+"/","repository":"https://github.com/goudastudios/gouda-studios-agent-tools","contact":EMAIL,"payment":HOWPAY,"tools":[{k:t['json'][k] for k in ('slug','name','description','actor','apify','page','pricing','call')}|{"json":f"{BASE}/tools/{t['slug']}.json"} for t in TOOLS]}
json.dump(cat,open(OUT+'/tools.json','w'),indent=2)
llms="# Gouda Studios Agent Tools\n\n> Agent-payable data tools for SAM.gov contract opportunities, SEC EDGAR filings, USAspending federal awards and GLEIF company LEI lookup. "+HOWPAY+"\n\nContact: "+EMAIL+"\n\n## Tools\n\n"+''.join(f"- [{t['name']}]({BASE}/tools/{t['slug']}/): {t['desc']} Pricing: ${START} per run + ${t['price']} per {t['unit']}. Apify actor: {t['actor']} ({t['apify']}). JSON: {BASE}/tools/{t['slug']}.json\n" for t in TOOLS)+f"\n## Machine-readable\n\n- [Tool catalog]({BASE}/tools.json)\n- [OpenAPI 3.1]({BASE}/openapi.json)\n- [Full docs]({BASE}/llms-full.txt)\n- [GitHub repo](https://github.com/goudastudios/gouda-studios-agent-tools)\n"
open(OUT+'/llms.txt','w').write(llms)
full="# Gouda Studios Agent Tools (full)\n\n"+HOWPAY+"\nContact: "+EMAIL+"\n"
for t in TOOLS:
  full+=f"\n\n## {t['name']}\n\n{t['desc']}\n\nApify: {t['apify']}\nActor ID for MCP: {t['actor']}\nPricing: ${START} per run start + ${t['price']} per {t['unit']}, no platform usage fee.\n\nUse cases:\n"+''.join(f"- {u}\n" for u in t['uses'])+"\nInput parameters:\n"+''.join(f"- {p['name']} ({p['type']}{', default '+json.dumps(p['default']) if p['default'] is not None else ''}): {p['description']}\n" for p in t['inputs'])+f"\nOutput fields: {', '.join(o['name'] for o in t['outputs'])}\n\nExample input:\n```json\n{json.dumps(t['ex'],indent=2)}\n```\n\nCall:\n```bash\n{curl(t)}\n```\n\nSample output row:\n```json\n{json.dumps(t['sample'],indent=2)}\n```\n"
open(OUT+'/llms-full.txt','w').write(full)
paths={}
for t in TOOLS:
  paths[f"/acts/gouda_studios~{t['slug']}/run-sync-get-dataset-items"]={"post":{"operationId":"run_"+t['slug'].replace('-','_'),"summary":f"Run {t['name']} and return dataset items","description":t['desc']+f" Pricing: ${START} per run + ${t['price']} per {t['unit']}.","externalDocs":{"url":t['apify']},
   "parameters":[{"name":"timeout","in":"query","schema":{"type":"integer"},"description":"Run timeout in seconds"},{"name":"format","in":"query","schema":{"type":"string","default":"json"}}],
   "requestBody":{"required":True,"content":{"application/json":{"schema":{"type":"object","properties":{p['name']:{k:v for k,v in dict(type=p['type'],description=p['description'],default=p['default'],enum=p.get('enum')).items() if v is not None} for p in t['inputs']}},"example":t['ex']}}},
   "responses":{"201":{"description":"Dataset items","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{o['name']:({"type":o['type']} if isinstance(o['type'],str) else {}) | {"description":o['description']} for o in t['outputs']}}}}}}}}}
api={"openapi":"3.1.0","info":{"title":"Gouda Studios Agent Tools (via Apify)","version":"1.0.0","description":HOWPAY,"contact":{"email":EMAIL,"url":BASE}},"servers":[{"url":"https://api.apify.com/v2"}],"security":[{"bearer":[]}],"components":{"securitySchemes":{"bearer":{"type":"http","scheme":"bearer","description":"Apify API token"}}},"paths":paths}
json.dump(api,open(OUT+'/openapi.json','w'),indent=2)
json.dump({"schema_version":"v1","name_for_human":"Gouda Studios Agent Tools","name_for_model":"gouda_studios_agent_tools","description_for_human":"Public records data tools: SAM.gov, SEC EDGAR, USAspending, GLEIF.","description_for_model":"Use to fetch federal contract opportunities (SAM.gov), SEC filings, federal awards (USAspending) and company LEI records (GLEIF) as JSON via Apify actors. "+HOWPAY,"auth":{"type":"user_http","authorization_type":"bearer"},"api":{"type":"openapi","url":BASE+"/openapi.json"},"logo_url":BASE+"/favicon.svg","contact_email":EMAIL,"legal_info_url":BASE+"/"},open(OUT+'/.well-known/ai-plugin.json','w'),indent=2)
json.dump({"name":"Gouda Studios Agent Tools","description":"Agent-payable public records data tools on Apify.","url":BASE,"contact":EMAIL,"catalog":BASE+"/tools.json","openapi":BASE+"/openapi.json","llms":BASE+"/llms.txt","repository":"https://github.com/goudastudios/gouda-studios-agent-tools","mcp":{"server":"https://mcp.apify.com","tools":[t['actor'] for t in TOOLS]},"payments":["x402","Skyfire","Apify API token"]},open(OUT+'/.well-known/agents.json','w'),indent=2)
open(OUT+'/favicon.svg','w').write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M2 24 L16 6 L30 24 Z" fill="#f2c14e"/></svg>')
bots=["GPTBot","ChatGPT-User","OAI-SearchBot","ClaudeBot","Claude-Web","anthropic-ai","PerplexityBot","Google-Extended","CCBot","Applebot-Extended","Bytespider","cohere-ai","*"]
open(OUT+'/robots.txt','w').write(''.join(f"User-agent: {b}\nAllow: /\n\n" for b in bots)+f"Sitemap: {BASE}/sitemap.xml\n")
urls=['/','/llms.txt','/llms-full.txt','/tools.json','/openapi.json']+[f"/tools/{t['slug']}/" for t in TOOLS]+[f"/tools/{t['slug']}.json" for t in TOOLS]
open(OUT+'/sitemap.xml','w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f"<url><loc>{BASE}{u}</loc><lastmod>2026-10-16</lastmod></url>" for u in urls)+'</urlset>\n')
json.dump({"headers":[{"source":"/(.*)\\.(json|txt)","headers":[{"key":"Access-Control-Allow-Origin","value":"*"}]}]},open(OUT+'/vercel.json','w'),indent=2)
open('urls.txt','w').write('\n'.join(urls+['/robots.txt','/sitemap.xml','/.well-known/ai-plugin.json','/.well-known/agents.json']))
open(OUT+'/e8cf6b9751f94a61bbcae58f0d4ec4b0.txt','w').write('e8cf6b9751f94a61bbcae58f0d4ec4b0')
# APIs.json (apisjson.org v0.19) for APIs.io and other API search engines
apisj={"aid":"gouda-studios-agent-tools.vercel.app","name":"Gouda Studios Agent Tools","description":"Agent-payable public records data tools on Apify: SAM.gov contract opportunities, SEC EDGAR filings, USAspending federal awards and GLEIF company LEI lookup. Clean JSON, pay per result.","image":BASE+"/favicon.svg","url":BASE+"/apis.json","created":"2026-10-17","modified":"2026-10-17","specificationVersion":"0.19","tags":["government data","SEC","federal contracts","KYB","company data","MCP","Apify","AI agents"],
 "apis":[{"aid":"gouda-studios-agent-tools.vercel.app:"+t['slug'],"name":t['name'],"description":t['desc']+f" Pricing: ${START} per run + ${t['price']} per {t['unit']}.","humanURL":BASE+f"/tools/{t['slug']}/","baseURL":"https://api.apify.com/v2","tags":[t['cat'],"Apify","JSON"],
   "properties":[{"type":"OpenAPI","url":BASE+"/openapi.json"},{"type":"Documentation","url":t['apify']},{"type":"JSONSchema","url":BASE+f"/tools/{t['slug']}.json"},{"type":"LLMsTxt","url":BASE+"/llms.txt"},{"type":"MCPServer","url":"https://mcp.apify.com/?tools="+t['actor']},{"type":"Pricing","url":t['apify']+"/pricing"}]} for t in TOOLS],
 "common":[{"type":"Catalog","url":BASE+"/tools.json"},{"type":"LLMsTxt","url":BASE+"/llms.txt"},{"type":"GitHubRepository","url":"https://github.com/goudastudios/gouda-studios-agent-tools"},{"type":"MCPServer","url":"https://mcp.apify.com/?tools="+",".join(t['actor'] for t in TOOLS)}],
 "maintainers":[{"FN":"Gouda Studios","email":EMAIL,"url":BASE}]}
json.dump(apisj,open(OUT+'/apis.json','w'),indent=2); json.dump(apisj,open(OUT+'/.well-known/apis.json','w'),indent=2)
open('urls.txt','a').write('\n/apis.json\n/.well-known/apis.json')

# MCP proxy discovery (actor list: mcp-tools.json)
import shutil as _sh
MCPT=json.load(open('mcp-tools.json')); _sh.copy('mcp-tools.json',OUT+'/mcp-tools.json'); _sh.copy('mcp-static.json',OUT+'/mcp-static.json')
MCPURL=BASE+'/mcp'; os.makedirs(OUT+'/.well-known/mcp',exist_ok=True); os.makedirs(OUT+'/.well-known/oauth-protected-resource',exist_ok=True)
_prm={"resource":MCPURL,"authorization_servers":["https://console-backend.apify.com"],"scopes_supported":["full_api_access"],"bearer_methods_supported":["header"],"resource_name":"Gouda Studios Agent Tools MCP"}
json.dump(_prm,open(OUT+'/.well-known/oauth-protected-resource/mcp','w'),indent=2)
_by={t['actor']:t for t in TOOLS}
json.dump({"serverInfo":{"name":"gouda-studios-agent-tools","version":"1.0.0"},"name":"Gouda Studios Agent Tools","description":"Agent-payable public records data tools (SAM.gov, SEC EDGAR, USAspending, GLEIF) via Apify's hosted MCP server.","url":MCPURL,"transport":{"type":"streamable-http","url":MCPURL},"authentication":{"required":True,"schemes":["oauth2","bearer"],"protectedResourceMetadata":BASE+"/.well-known/oauth-protected-resource/mcp"},"tools":[{"name":a,"description":_by[a]['desc'] if a in _by else a} for a in MCPT],"resources":[],"prompts":[]},open(OUT+'/.well-known/mcp/server-card.json','w'),indent=2)
# Glama connector ownership claim
open(OUT+'/.well-known/glama.json','w').write('{\n  "$schema": "https://glama.ai/mcp/schemas/connector.json",\n  "claim": "glama_claim_5LOKEA2JmFwW533jziqAJqtT-KMEJZgk"\n}\n')
# aiagentslisting verification (no trailing newline)
open(OUT+'/.well-known/aiagentslisting-verify.txt','w').write('190d96e100c67cadba422e4ee564f233')
