"""Port the RELL landing to Ora. The markup, classes and inline styles stay exactly as
in the reference; only words, links, the logo and a few hooks change.

Source: reference/rell-index.html (the rell-web index the saved tryrell.xyz page was built from)
Output: index.html
Run:    python -I _notes/port-landing.py
"""
import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
s = (root / "reference/rell-index.html").read_text(encoding="utf-8")


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if count is not None and n != count:
        raise SystemExit(f"expected {count} of {old[:70]!r}, found {n}")
    s = s.replace(old, new)


WORD = "<span style=display:inline-block;opacity:1;filter:blur(0px);transform:none;will-change:transform>"
WORD_HIDDEN = "<span style=display:inline-block;opacity:0.001;filter:blur(12px);transform:translateY(24px);will-change:transform>"


def words(old, new):
    """Swap a heading whose words sit in inline block spans."""
    for span in (WORD, WORD_HIDDEN):
        o = " ".join(span + w + "</span>" for w in old.split())
        if o in s:
            rep(o, " ".join(span + w + "</span>" for w in new.split()))
            return
    raise SystemExit("word heading not found: " + old)


def letters(old, new):
    """Swap a hero line whose letters sit in spans, grouped per word."""
    def build(text):
        return " ".join("<span style=white-space:nowrap>" + "".join(WORD + c + "</span>" for c in w) + "</span>" for w in text.split())
    rep(f'aria-label="{old}">' + build(old), f'aria-label="{new}">' + build(new))


# ------------------------------------------------------------------ head
rep("<title>RELL | Rights Intelligence for Tokenized Assets</title>", "<title>Ora | Build agents. Prove them.</title>")
desc_old = "RELL maps what a tokenized stock really gives you. Every right, with its source."
desc_new = "Build trading agents. Run them on real prices with virtual money. Rank them in public."
rep(f'content="{desc_old}"', f'content="{desc_new}"', 2)
rep('content="RELL | Rights Intelligence for Tokenized Assets"', 'content="Ora | Build agents. Prove them."')
rep('<meta property="og:site_name" content="RELL">', '<meta property="og:site_name" content="Ora">')
rep('<link rel="canonical" href="https://tryrell.xyz/">\n', "")
rep('<meta property="og:url" content="https://tryrell.xyz/">\n', "")
s = re.sub(r'<meta property="og:image[^>]*>\n', "", s)
rep('<link rel="icon" href="assets/brand/favicon.svg?v=mono" type="image/svg+xml">', '<link rel="icon" href="/assets/brand/favicon.svg" type="image/svg+xml">')
rep('<link rel="apple-touch-icon" href="assets/brand/apple-touch-icon.png?v=mono">\n', "")
# root relative paths so /index and clean urls both resolve
for a, b in [('href="assets/', 'href="/assets/'), ('href="css/', 'href="/css/'), ("src=assets/", "src=/assets/"),
             ('src="assets/', 'src="/assets/'), ('src="js/', 'src="/js/')]:
    s = s.replace(a, b)
s = s.replace("url(assets/", "url(/assets/").replace('url("assets/', 'url("/assets/')

# ------------------------------------------------------------------ hero
letters("Read the rights", "Build agents.")
letters("behind every token", "Prove them.")
rep('data-config-text="token.symbol">RELL</span>', 'data-config-text="token.symbol">ORA</span>')
rep("class=framer-text>RELL</p></foreignobject>", "class=framer-text>ORA</p></foreignobject>")
rep('aria-label="View the token on the explorer"', 'aria-label="View the token on Solscan"')
rep('aria-label="Copy the contract address"', 'aria-label="Copy the token address"')

# ------------------------------------------------------------------ statement
rep("RELL reads the rights behind tokenized stocks and turns them into clear, machine-readable claims, with every claim traced back to its source.",
    "Ora is where trading agents prove themselves. Build one in a minute. Run it on real prices. Let the public board judge it.")
rep('<a class="rell-btn rell-btn--light" href="app.html"><span class="rell-btn__label">Open the app</span>',
    '<a class="rell-btn rell-btn--light" href="/forge"><span class="rell-btn__label">Open Forge</span>')
rep('<a class="rell-btn rell-btn--outline" href="#map"><span class="rell-btn__label">Explore the map</span>',
    '<a class="rell-btn rell-btn--outline" href="/leaderboard"><span class="rell-btn__label">See leaderboard</span>')

# ------------------------------------------------------------------ problem
words("A token can look like ownership", "Anyone can claim a winning strategy")
rep("A stock token can carry the ticker, track the price and sit in your wallet. None of that proves what you hold. Voting, dividends and transfer limits sit in terms few holders ever read.",
    "Backtests bend to fit the past. Screenshots hide the losing weeks. Ora runs every agent live, in public, under the same rules.")

# ------------------------------------------------------------------ at a glance
words("Every right, with the source behind it", "Every agent, with the trades behind it")
rep(">rights categories per token<", ">minutes per decision<")
rep(">6</span>", ">15</span>")
rep("Ownership, economic claims, control, transfer, DeFi use and asset status, mapped for every token.",
    "Each agent decides buy, sell or hold for every asset it trades, every cycle.")
rep(">verification states<", ">tokenized stocks<")
rep("Each claim is marked onchain, issuer or reported, so you see how it was proven.",
    "TSLAx, AAPLx and GOOGLx on Solana, priced live from the market.")
rep(">claims with a named source<", ">virtual capital<")
rep("Nothing is asserted without saying where it came from. Gaps stay visible, never filled in.",
    "Paper trading only. No real funds move and nothing is ever at risk.")

# ------------------------------------------------------------------ how it works
words("Read the contract. Check the terms. Show the source.", "Pick a strategy. Set the limits. Let it trade.")
STEPS = [
    ("Read the contract", "Pick a strategy",
     "RELL reads token state straight from Robinhood Chain. Pauses, transfer limits and supply come from the contract itself.",
     "Start from a preset like Momentum or Dip buyer. Or connect your own AI with one key."),
    ("Check the issuer", "Set the limits",
     "Published terms, filings and disclosures are matched to each right. Every claim links back to the document behind it.",
     "Choose virtual capital, max position and stop loss. Settings lock once the agent is created."),
    ("Anchor the profile", "Run every 15 minutes",
     "The finished rights profile is hashed and anchored in the onchain registry. Anyone can confirm it was never changed.",
     "Your agent reads live prices and decides for each asset. Every fill carries a simulated cost."),
    ("Read it anywhere", "Climb the board",
     "The RELL app loads the record, checks the hash and lays out every right. No wallet is needed to read.",
     "Return, drawdown and win rate land on a public board. Anyone can open an agent and check every trade."),
]
for old_t, new_t, old_p, new_p in STEPS:
    rep(">" + old_t + "<", ">" + new_t + "<", 4)
    rep(old_p, new_p, 2)

# ------------------------------------------------------------------ markets (was the rights map)
rep(">the rights map<", ">the markets<")
words("Six categories. Every right accounted for.", "Three stocks. Three ways to trade.")
rep("Pick any stock token. RELL answers the same six questions, each with the source behind it.",
    "Agents trade tokenized stocks on Solana at real prices. Pick a rule or bring your own AI.")
CARDS = [
    ("Ownership", "TSLAx", "“Do you hold the share itself, or only a claim on the issuer?”",
     "“Tesla, tokenized. Fast moves and wide daily ranges.”", "Usual source: issuer terms", "TSLA"),
    ("Economic claims", "AAPLx", "“Does it track the price, pass through dividends and follow corporate actions?”",
     "“Apple, tokenized. Steady trends that reward patience.”", "Usual source: issuer terms", "AAPL"),
    ("Control rights", "GOOGLx", "“Can a holder vote at shareholder meetings, or does someone else hold the vote?”",
     "“Alphabet, tokenized. Clean breakouts after quiet stretches.”", "Usual source: public reporting", "GOOGL"),
    ("Transfer rights", "Momentum", "“Can it move freely between wallets, or only across an allowlist?”",
     "“Buys strength and sells weakness once a move passes your threshold.”", "Usual source: the contract", "momentum"),
    ("DeFi compatibility", "Mean reversion", "“Will open onchain protocols accept it, or do transfer rules block them?”",
     "“Buys the dip below average and sells as price returns.”", "Usual source: the contract", "reversion"),
    ("Asset status", "Connected AI", "“Is the contract live today, or has it been paused, frozen or upgraded?”",
     "“Your own model reads the market and sends one decision per asset.”", "Usual source: the contract", "ai"),
]
META = {"TSLA": "Tokenized stock on Solana", "AAPL": "Tokenized stock on Solana", "GOOGL": "Tokenized stock on Solana",
        "momentum": "Presets: Active, Balanced, Patient", "reversion": "Preset: Dip buyer", "ai": "Three calls, one key"}
Q = lambda t: t.replace("“", "&#8220;").replace("”", "&#8221;")
for old_t, new_t, old_q, new_q, old_src, key in CARDS:
    rep(">" + old_t + "<", ">" + new_t + "<")
    rep(Q(old_q), Q(new_q))
# the source line repeats, so walk the cards in order
for _, _, _, _, old_src, key in CARDS:
    i = s.find(">" + old_src + "<")
    s = s[:i] + f'><span data-ora-meta="{key}">{META[key]}</span><' + s[i + len(old_src) + 2:]

# a stock chart in each card's right panel, under the quote and its meta line
for _, _, _, _, _, key in CARDS:
    marker = f'<span data-ora-meta="{key}">'
    start = 0
    while True:
        i = s.find(marker, start)
        if i < 0:
            break
        j = s.find("</p></div></div>", i) + len("</p></div></div>")  # closes p, Copy, Quote Lockup
        s = s[:j] + f'<div class="ora-chart" data-ora-chart="{key}" aria-hidden="true"></div>' + s[j:]
        start = j

# ------------------------------------------------------------------ sources strip
rep(">Every claim is read from a public source<", ">Real prices from public markets<")
for a, b in [("Robinhood Chain", "Solana"), ("Blockscout", "Solscan"), ("Issuer filings", "xStocks"),
             ("IPFS", "Phantom"), ("Arweave", "Solflare"), ("Public reporting", "Backpack")]:
    s = s.replace("class=rell-source>" + a + "<", "class=rell-source>" + b + "<")

# ------------------------------------------------------------------ FAQ
FAQ = [
    ("What does RELL check on a token?", "What is Ora?",
     "Six rights categories: ownership, economic claims, control, transfer, DeFi use and asset status. Each answer carries its source.",
     "A place to build trading agents and prove them. Agents paper trade tokenized stocks at real prices."),
    ("Do I need a wallet to read a record?", "Is real money used?",
     "No. Every read goes through public RPC on Robinhood Chain. Connecting a wallet only shows your address.",
     "No. Every agent trades virtual capital. Prices are real, fills are simulated with a small cost."),
    ("Where does each claim come from?", "How often does an agent trade?",
     "Claims are read onchain, taken from issuer documents, or drawn from public reporting. The label always says which.",
     "It decides every 15 minutes, once per asset. Holding is a decision too."),
    ("Which tokens are covered today?", "Which assets can I trade?",
     "Stock tokens on Robinhood Chain. Coverage grows from there, one network at a time.",
     "TSLAx, AAPLx and GOOGLx, tokenized stocks on Solana. More can follow."),
    ("How do I know a profile was not changed?", "Can I use my own AI?",
     "Each profile is hashed and anchored in the onchain registry. The app checks the document against that hash before showing it.",
     "Yes. Create a key on your agent page. Your AI reads the market and sends decisions over HTTP."),
    ("Is RELL investment advice?", "Is Ora investment advice?",
     "No. RELL reports rights and where they come from. It never rates or recommends a token.",
     "No. Results are simulated. Past simulated returns say nothing about the future."),
]
for q0, q1, a0, a1 in FAQ:
    rep(">" + q0 + "<", ">" + q1 + "<")
    rep(a0, a1)

# ------------------------------------------------------------------ call to action
rep(">the rell app<", ">the forge<")
rep(">Read a token&#8217;s rights today<", ">Build your agent today<")
rep(">Find out what a token really gives you<", ">Start in a minute<")
rep("Paste a contract address. RELL reads its record straight from Robinhood Chain.",
    "Pick a preset, set your limits and press start. The board does the rest.")

# ------------------------------------------------------------------ nav, footer, sheet
rep(">Open the app<", ">Open Forge<", None)
rep("href=app.html", "href=/forge", None)
rep('href="app.html"', 'href="/forge"', None)
rep("href=docs.html", "href=/docs", None)
rep('href="docs.html"', 'href="/docs"', None)
rep('href=#map data-styles-preset=uUK50jQh9>Rights map</a>', 'href=/leaderboard data-styles-preset=uUK50jQh9>Leaderboard</a>', None)
rep('<a href="#map" data-sheet-close>Rights map</a>', '<a href="/leaderboard">Leaderboard</a>')
rep(">Rights map</a>", ">Markets</a>", None)
rep('aria-label="RELL home"', 'aria-label="Ora home"', 2)
rep('src="/assets/brand/logo-lockup.svg?v=mono" width=2305 height=745 alt="Rell"', 'src="/assets/brand/logo-lockup.svg" width=1779 height=745 alt="Ora"', None)
rep('src="/assets/brand/logo-lockup.svg?v=mono" width="2305" height="745" alt="Rell"', 'src="/assets/brand/logo-lockup.svg" width="1779" height="745" alt="Ora"', None)
s = s.replace("logo-lockup-inverse.svg?v=mono", "logo-lockup-inverse.svg").replace("width=2305", "width=1779").replace('width="2305"', 'width="1779"')
rep(">Read the rights behind every token<", ">Build agents. Prove them.<")
rep(">RELL app</a>", ">Forge</a>")
rep(">Contract address</a>", ">Token address</a>")
rep(">Contracts</h6>", ">Onchain</h6>")
rep("data-contract-link=contracts.rightsRegistry target=_blank rel=\"noopener noreferrer\">Rights registry</a>",
    "data-ora-link=token target=_blank rel=\"noopener noreferrer\">Token mint</a>")
rep("data-contract-link=contracts.verificationOracle target=_blank rel=\"noopener noreferrer\">Verification oracle</a>",
    "data-ora-link=program target=_blank rel=\"noopener noreferrer\">Program</a>")
rep("data-explorer-home target=_blank rel=\"noopener noreferrer\">Block explorer</a>",
    "data-ora-link=explorer target=_blank rel=\"noopener noreferrer\">Solscan</a>")
rep("<span data-year>2026</span> RELL.</p>", "<span data-year>2026</span> Ora.</p>")
rep(">RELL reports rights.</p>", ">Paper trading only.</p>")
rep(">It is not investment advice.</p>", ">Simulated results are not advice.</p>", None)

# ------------------------------------------------------------------ scripts and styles
rep('<link rel="stylesheet" href="/css/landing.css">',
    '<link rel="stylesheet" href="/css/landing.css">\n<link rel="stylesheet" href="/css/landing-ora.css">\n<link rel="stylesheet" href="/css/ora-modal.css">')
rep('<script src="config/contracts.js"></script>\n', "")
rep('<script src="/js/config.js"></script>', '<script src="/js/config.js"></script>')
rep('<script src="/js/wallet.js" type="module"></script>', '<script src="/js/landing-ora.js" type="module"></script>')

# config.js has to load before anything else: move it to the head, first script
rep('<script src="/js/config.js"></script>\n', "")
rep('<script>document.documentElement.classList.add("js");</script>',
    '<script src="/js/config.js"></script>\n<script>document.documentElement.classList.add("js");</script>')

left = [m.group(0) for m in re.finditer(r".{30}(?:RELL|Rell|Robinhood|rell\.xyz).{30}", s)]
(root / "index.html").write_text(s, encoding="utf-8")
print("written index.html")
for l in left:
    print("  still contains:", l)
