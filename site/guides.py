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
 dict(slug='how-to-get-a-youtube-video-transcript',tool='youtube-transcript-extractor',
  q='How to get the transcript of a YouTube video',
  d='Get the full transcript of any YouTube video, Short or livestream as plain text, timestamped text or SRT subtitles, without an API key or login.',
  a='Paste the video URL or 11-character ID into the YouTube Transcript Extractor. It returns one row per video with the full transcript as one clean string, timestamped lines, timed segments and optional SRT, plus the title and channel. It costs $0.004 per transcript, and videos without captions are free.',
  steps=['Copy the video link. Watch URLs, youtu.be links, Shorts, live and embed URLs and bare video IDs all work.','Run the tool with videos set to that link. Set languages if you want something other than English.','Read the text field for the whole transcript, or timestampedText and segments if you need timings.','Turn on includeSrt to get a subtitle file you can load into an editor.'],
  ex={"videos":["https://www.youtube.com/watch?v=UF8uR6Z6KLc"],"languages":["en"],"includeSrt":True},
  faq=[('Do I need a YouTube API key or a Google login?','No. The tool reads the captions YouTube already publishes, and a residential proxy is built in so YouTube bot checks are handled for you.'),('What if a video has no captions?','The row comes back with status error and the reason, and you are not charged for it.'),('Can I get a transcript in another language?','Yes. List language codes in priority order in languages, or set translateTo to use YouTube\'s own auto-translation when the video offers it.')]),
 dict(slug='how-to-download-youtube-transcripts-in-bulk',tool='youtube-transcript-extractor',
  q='How to download YouTube transcripts in bulk for AI and RAG',
  d='Pull transcripts for hundreds or thousands of YouTube videos in one run and feed them to ChatGPT, Claude, a summarizer or a vector database.',
  a='Pass a list of video URLs or IDs to the YouTube Transcript Extractor. Duplicates are removed, each video becomes one JSON row with a clean text field ready for chunking and embedding, and you can export everything as JSON, CSV or Excel or pull it with the API. At $4 per 1,000 transcripts it is cheaper than most transcript scrapers.',
  steps=['Collect the video URLs or IDs, for example from a channel or playlist export.','Run the tool with videos set to the full list and maxVideos high enough to cover it.','Keep includeSegments on if you want to cite timestamps in answers; turn it off for smaller rows.','Chunk the text field and send it to your embedding model or LLM, or download the dataset as CSV.'],
  ex={"videos":["UF8uR6Z6KLc","https://youtu.be/8jPQjjsBbIc","https://www.youtube.com/shorts/aqz-KE-bpKQ"],"languages":["en"],"includeSegments":True,"maxVideos":1000},
  faq=[('How many videos can one run handle?','Up to 1,000 by default through maxVideos. Raise it for bigger batches.'),('Can an AI agent call this directly?','Yes. Connect any MCP client to the Gouda Studios MCP endpoint, or call the Apify API with run-sync-get-dataset-items and get the transcripts back in the same request.'),('What does it cost?','$0.004 per transcript returned plus $0.0005 per run. Failed or caption-less videos are free.')]),
 dict(slug='how-to-scrape-emails-from-a-list-of-websites',tool='website-contact-extractor',
  q='How to scrape emails from a list of websites',
  d='Turn a list of company websites or domains into emails, phone numbers and social profiles, one clean row per company, with a free check that each email domain can receive mail.',
  a='Give the Website Contact Extractor your list of domains. It reads each homepage and the most likely contact pages, then returns the emails, phones and social links it found as one row per site. It costs $0.0025 per website with contacts found, and sites with nothing found are not charged.',
  steps=['Put your websites or bare domains in startUrls, one per line.','Leave maxPagesPerSite at 8 for most sites, or raise it for large sites with deep contact pages.','Set defaultCountry so local phone numbers without a + prefix are read correctly.','Keep checkMx on to flag typo emails and dead domains, then export to CSV or your CRM.'],
  ex={"startUrls":["https://www.python.org","apify.com"],"maxPagesPerSite":8,"defaultCountry":"US","checkMx":True},
  faq=[('Does it respect robots.txt?','Yes, by default. respectRobotsTxt skips pages a site asks crawlers not to visit.'),('Do I need a proxy?','Usually not. Most business sites work without one. Turn on Apify Proxy if many sites time out or block requests.'),('Is it legal to collect business emails?','Collecting publicly listed business contact details is common, but how you use them is covered by laws such as CAN-SPAM and GDPR. Check the rules for your market before emailing.')]),
 dict(slug='how-to-find-contact-emails-for-google-maps-leads',tool='website-contact-extractor',
  q='How to find contact emails for Google Maps business leads',
  d='Enrich a Google Maps or local business lead list with emails, phone numbers and social profiles from each business website.',
  a='Google Maps listings usually include a website but not an email. Export the website column from your Google Maps scrape and run it through the Website Contact Extractor, which visits each site and its contact pages and returns the emails, phones and social profiles it finds as one row per business.',
  steps=['Scrape or export your Google Maps results and keep the website column.','Paste those websites into startUrls. Rows without a website can be skipped.','Set defaultCountry to the country of the businesses.','Join the results back to your lead list on the domain and load it into your CRM or outreach tool.'],
  ex={"startUrls":["https://www.example-dental-clinic.com","example-law-firm.com"],"maxPagesPerSite":8,"defaultCountry":"US"},
  faq=[('Why not get emails straight from Google Maps?','Google Maps rarely shows email addresses. They are usually on the business website, which is what this tool reads.'),('What does it cost per lead?','$0.0025 per website where contacts are found plus $0.0005 per run, so 1,000 enriched leads cost about $2.50.')]),
 dict(slug='use-public-data-tools-in-claude-and-cursor-with-mcp',tool=None,
  q='How to use SAM.gov, SEC EDGAR, USAspending, LEI, website contact and YouTube transcript tools in Claude or Cursor with MCP',
  d='Connect Claude, Cursor or any MCP client to one remote MCP URL and ask questions about federal contracts, SEC filings, federal awards and company LEIs.',
  a='Add '+MCP+' as a remote MCP server (Streamable HTTP). Your client signs in with your Apify account through OAuth, or you pass an Apify API token as a Bearer header. The tools then appear in the client and you pay per result.',
  steps=['Cursor: add the server to .cursor/mcp.json as {"mcpServers":{"gouda-studios":{"url":"'+MCP+'"}}}.','Claude: add a custom connector with the URL '+MCP+'.','Other clients: use the same URL with Streamable HTTP transport, and either OAuth or an Authorization: Bearer header with your Apify token.','Ask a question, for example "find open SBA set-aside software RFPs on SAM.gov" or "what is the LEI for Siemens AG".'],
  ex={"mcpServers":{"gouda-studios":{"url":MCP}}},
  faq=[('Do I need an Apify account?','For MCP use, yes, a free Apify account. Agents can also pay per run without an account through x402 or Skyfire on the Apify API.'),('Which tools are included?','SAM.gov Contract Opportunities, SEC EDGAR Filings Feed, USAspending Awards Search, Company LEI Lookup, Website Contact Extractor and YouTube Transcript Extractor, plus Apify helper tools to fetch run results.')]),
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
