# Question-style guide pages. Exec'd from build.py (uses BASE, TOOLS, OUT, page, E, json).
MCP=BASE+'/mcp'
TB={t['slug']:t for t in TOOLS}
G=[
 dict(slug='how-to-find-a-company-lei-number',tool='gleif-company-lei-lookup',
  q='How to find a company\'s LEI number',
  d='Find the Legal Entity Identifier (LEI) for any company by name, country or registration number using the official GLEIF registry, from a script, a spreadsheet workflow or an AI agent.',
  a='Search the GLEIF global LEI registry by the company\'s legal name, ideally with its country. The Company LEI Lookup tool does this in one call and returns the 20-character LEI, legal name, status, address and parent companies as JSON.',
  steps=['Write the company\'s legal name as precisely as you can, for example "Apple Inc.".','Add the ISO country code of its legal address (US, GB, DE) to narrow matches.','Run the tool with companyNames and country. Exact legal-name matches come first, then fuzzy matches.','Check status and registrationStatus: ACTIVE and ISSUED mean the LEI is current.'],
  ex={"companyNames":["Apple Inc."],"country":"US"},
  faq=[('What is an LEI?','A Legal Entity Identifier is a 20-character code from the ISO 17442 standard that uniquely identifies a legal entity taking part in financial transactions. GLEIF publishes every LEI for free.'),('Can I search by registration number instead of name?','Yes. Pass registrationNumbers with the company registry number, for example a UK Companies House number, plus the country.'),('How much does a lookup cost?','$0.003 per company row plus $0.001 per run. There is no subscription.')]),
 dict(slug='how-to-check-if-an-lei-is-valid-and-find-the-parent-company',tool='gleif-company-lei-lookup',
  q='How to check if an LEI is valid and find the parent company',
  d='Verify that an LEI is active and see a company\'s direct and ultimate parent from the GLEIF registry, for KYC, KYB and vendor onboarding.',
  a='Look the LEI up in the GLEIF registry and read its registration status, renewal date and parent relationships. The Company LEI Lookup tool returns all of that per LEI, with includeParents turned on by default.',
  steps=['Collect the LEIs you need to verify.','Run the tool with leis and includeParents set to true.','Treat registrationStatus ISSUED as valid. LAPSED means the LEI was not renewed.','Read directParent and ultimateParent to see the ownership chain.'],
  ex={"leis":["HWUPKR0MPOU8FGXBT394"],"includeParents":True},
  faq=[('What does a LAPSED LEI mean?','The entity did not renew its LEI on time. The code still identifies the company, but many regulators and banks expect an ISSUED status.'),('Does every company report a parent?','No. GLEIF records parents only when the entity reports them or files an exception reason.')]),
 dict(slug='how-to-track-federal-contract-awards',tool='usaspending-awards-search',
  q='How to track federal contract awards',
  d='Track U.S. federal contract and grant awards by keyword, agency, NAICS code or recipient using USAspending.gov data, as a one-off search or a scheduled feed.',
  a='Query USAspending.gov, the official source for federal spending, with your keywords, agencies or NAICS codes and a date range. The USAspending Awards Search tool returns each award with amount, recipient, agency and dates, and its onlyNew mode turns a schedule into an awards feed.',
  steps=['Pick your filters: keywords, NAICS codes, awarding agencies, states and a minimum amount.','Choose awardType: contracts, idvs, grants, loans, direct_payments or other.','Run once for research, or schedule it daily with onlyNew set to true to get only newly reported awards.','Send the JSON rows to a sheet, CRM or Slack.'],
  ex={"keywords":["cybersecurity"],"awardType":"contracts","startDate":"2026-01-01","minAmount":1000000},
  faq=[('How current is USAspending data?','Agencies report contract awards within days to weeks of signing, so recent awards appear with a short lag.'),('Can I filter by NAICS code?','Yes. Pass naicsCodes, for example ["541512"] for computer systems design.')]),
 dict(slug='how-to-see-who-won-a-government-contract',tool='usaspending-awards-search',
  q='How to see who won a government contract',
  d='Find the companies that won U.S. federal contracts and follow a competitor\'s federal wins using USAspending.gov award data.',
  a='Every federal award on USAspending.gov names its recipient. Search by keyword or agency to see the winners for a type of work, or filter by recipient name to list everything a competitor has won.',
  steps=['To find winners for a type of work, search by keywords and NAICS codes.','To follow a competitor, put its name or UEI in recipientNames.','Sort the results by amount or date in your sheet or database.'],
  ex={"recipientNames":["Booz Allen Hamilton"],"maxResults":200},
  faq=[('Can I see subcontractors?','This tool returns prime awards. Subaward data is published separately by USAspending.'),('Is the data free to use?','Yes. USAspending.gov data is public. You pay only per result returned by the tool.')]),
 dict(slug='how-to-get-sam-gov-opportunities-as-a-feed',tool='sam-gov-opportunities-feed',
  q='How to get SAM.gov opportunities as a feed',
  d='Turn SAM.gov contract opportunities into a daily feed of only new RFPs, RFQs and sources sought notices that match your keywords, NAICS codes and set-asides.',
  a='Schedule the SAM.gov Contract Opportunities tool daily with your filters and onlyNew set to true. Each run returns only the notices that were not in the previous run, so you get a clean feed without duplicates and without a SAM.gov API key.',
  steps=['Set your filters: keywords, naicsCodes, setAsides, noticeTypes and states.','Turn on onlyNew.','Create a daily schedule for the actor in Apify, or call it on a timer from your own code or agent.','Route the new rows to email, Slack, a sheet or a CRM with an Apify integration or webhook.'],
  ex={"keywords":"software","naicsCodes":["541511","541512"],"onlyNew":True,"maxResults":50},
  faq=[('Do I need a SAM.gov API key?','No. You can add your own key in apiKey for higher rate limits.'),('Which notice types are included?','All of them by default. Use noticeTypes codes to narrow it, for example o for solicitations and r for sources sought.')]),
 dict(slug='how-to-find-small-business-set-aside-contracts',tool='sam-gov-opportunities-feed',
  q='How to find small business set-aside contracts',
  d='Find open federal contract opportunities set aside for small businesses, 8(a), HUBZone, SDVOSB and WOSB firms, filtered by NAICS code and state.',
  a='Filter SAM.gov opportunities by set-aside code. The SAM.gov Contract Opportunities tool accepts codes like SBA, 8A, HZC, SDVOSBC and WOSB, plus your NAICS codes, and shows the days left to respond on each notice.',
  steps=['Choose the set-aside codes that match your certifications.','Add your NAICS codes and, if needed, states for the place of performance.','Use minDaysUntilResponse to skip notices that close too soon to bid.','Schedule it with onlyNew for a daily list of new set-aside opportunities.'],
  ex={"setAsides":["SBA","8A"],"naicsCodes":["541512"],"minDaysUntilResponse":10,"maxResults":100},
  faq=[('What does SBA mean as a set-aside?','A total small business set-aside, open only to firms that qualify as small under the NAICS size standard.'),('Can I search several set-aside types at once?','Yes. setAsides takes a list.')]),
 dict(slug='how-to-monitor-sec-filings-automatically',tool='sec-edgar-filings-feed',
  q='How to monitor SEC filings automatically',
  d='Get alerts for new SEC EDGAR filings such as 8-K, 10-Q, 10-K and S-1 for the companies you follow, by ticker or CIK, with no polling code to maintain.',
  a='Schedule the SEC EDGAR Filings Feed with your tickers and form types and set onlyNew to true. Each run returns only filings that are new since the last run, with links to the documents on EDGAR.',
  steps=['List the tickers or CIKs you follow.','Choose form types, for example 8-K for material events.','Set onlyNew to true and schedule the actor hourly or daily.','Send new rows to Slack, email or your research database.'],
  ex={"tickers":["AAPL","TSLA"],"formTypes":["8-K"],"filedWithinDays":7,"onlyNew":True},
  faq=[('Can I monitor all companies, not just a watchlist?','Yes. Leave tickers and CIKs empty and pick at least one form type to get the latest filings market-wide.'),('Does this respect SEC rate limits?','Yes. The tool uses the SEC public APIs within their fair access limits.')]),
 dict(slug='how-to-track-insider-trading-form-4-filings',tool='sec-edgar-filings-feed',
  q='How to track insider trading (Form 4) filings',
  d='Follow insider buys and sells by tracking SEC Form 4 filings for a watchlist of tickers, as a scheduled feed of new filings.',
  a='Insiders report trades on SEC Form 4. Run the SEC EDGAR Filings Feed with formTypes ["4"] and your tickers, with onlyNew on, to get each new insider filing with a direct link to the document.',
  steps=['Add your watchlist tickers.','Set formTypes to ["4"].','Turn on onlyNew and schedule the actor.','Open the linked document to read the transaction details.'],
  ex={"tickers":["NVDA","MSFT","AMZN"],"formTypes":["4"],"onlyNew":True},
  faq=[('How fast are Form 4s filed?','Insiders must file within two business days of the trade.'),('Can I add Form 144 or 13D?','Yes. Add those form types to formTypes, for example "144" or "SC 13D".')]),
 dict(slug='use-public-data-tools-in-claude-and-cursor-with-mcp',tool=None,
  q='How to use SAM.gov, SEC EDGAR, USAspending and LEI data in Claude or Cursor with MCP',
  d='Connect Claude, Cursor or any MCP client to one remote MCP URL and ask questions about federal contracts, SEC filings, federal awards and company LEIs.',
  a='Add '+MCP+' as a remote MCP server (Streamable HTTP). Your client signs in with your Apify account through OAuth, or you pass an Apify API token as a Bearer header. The tools then appear in the client and you pay per result.',
  steps=['Cursor: add the server to .cursor/mcp.json as {"mcpServers":{"gouda-studios":{"url":"'+MCP+'"}}}.','Claude: add a custom connector with the URL '+MCP+'.','Other clients: use the same URL with Streamable HTTP transport, and either OAuth or an Authorization: Bearer header with your Apify token.','Ask a question, for example "find open SBA set-aside software RFPs on SAM.gov" or "what is the LEI for Siemens AG".'],
  ex={"mcpServers":{"gouda-studios":{"url":MCP}}},
  faq=[('Do I need an Apify account?','For MCP use, yes, a free Apify account. Agents can also pay per run without an account through x402 or Skyfire on the Apify API.'),('Which tools are included?','SAM.gov Contract Opportunities, SEC EDGAR Filings Feed, USAspending Awards Search and Company LEI Lookup, plus Apify helper tools to fetch run results.')]),
]
def _links(cur):
  return '<h2>More guides</h2><ul>'+''.join(f'<li><a href="/guides/{g["slug"]}/">{E(g["q"])}</a></li>' for g in G if g['slug']!=cur)+'</ul>'
os.makedirs(OUT+'/guides',exist_ok=True)
for g in G:
  t=TB.get(g['tool'])
  tl=(f'<p>Tool: <a href="/tools/{t["slug"]}/">{E(t["name"])}</a> | <a href="{t["apify"]}">Run it on Apify</a> | MCP: <a href="/mcp">{MCP}</a></p>') if t else ('<p>Tools: '+' | '.join(f'<a href="/tools/{x["slug"]}/">{E(x["name"])}</a> (<a href="{x["apify"]}">Apify</a>)' for x in TOOLS)+f' | MCP: <a href="/mcp">{MCP}</a></p>')
  body=(f'<h1>{E(g["q"])}</h1><p><strong>Short answer:</strong> {E(g["a"])}</p>{tl}<h2>Steps</h2><ol>'+''.join(f'<li>{E(s)}</li>' for s in g['steps'])+'</ol>'
        f'<h2>Example input</h2><pre>{E(json.dumps(g["ex"],indent=2))}</pre>'
        f'<h2>Use it from an AI agent</h2><p>Connect any MCP client to <a href="/mcp">{MCP}</a>, or see <a href="/guides/use-public-data-tools-in-claude-and-cursor-with-mcp/">the Claude and Cursor guide</a>.</p>'
        '<h2>FAQ</h2>'+''.join(f'<h3>{E(q)}</h3><p>{E(a)}</p>' for q,a in g['faq'])+_links(g['slug']))
  allfaq=[(g['q'],g['a'])]+g['faq']
  jl={"@context":"https://schema.org","@graph":[{"@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in allfaq]},{"@type":"HowTo","name":g['q'],"step":[{"@type":"HowToStep","text":s} for s in g['steps']]}]}
  os.makedirs(f"{OUT}/guides/{g['slug']}",exist_ok=True)
  open(f"{OUT}/guides/{g['slug']}/index.html",'w').write(page(g['q']+' | Gouda Studios Agent Tools',g['d'],body,jl,f"/guides/{g['slug']}/"))
GUIDE_URLS=[f"/guides/{g['slug']}/" for g in G]
GUIDE_HTML='<h2>Guides</h2><ul>'+''.join(f'<li><a href="/guides/{g["slug"]}/">{E(g["q"])}</a></li>' for g in G)+'</ul>'
GUIDE_LLMS='\n## Guides\n\n'+''.join(f"- [{g['q']}]({BASE}/guides/{g['slug']}/): {g['d']}\n" for g in G)+f"\n## MCP\n\n- Remote MCP endpoint (Streamable HTTP, Apify OAuth or Bearer token): {MCP}\n"
