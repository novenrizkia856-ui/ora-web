// Every UI string rendered by JavaScript, grouped by page.
// Rules: no hyphens or dashes, no slashes or parentheses joining words, short sentences.
// Placeholders in braces are filled by fill() in app.js.

export const copy = {
  common: {
    brand: "ora",
    homeLabel: "Ora home",
    demo: "Demo data",
    nav: { forge: "Forge", leaderboard: "Leaderboard", docs: "Docs", me: "My agents" },
    menu: "Open menu",
    close: "Close",
    footerDisclaimer: "Paper trading only. Simulated results are not advice.",
    copyright: "© 2026 Ora",
    social: { x: "X", telegram: "Telegram", github: "GitHub", discord: "Discord" },
    copied: "Copied",
    copy: "Copy",
    copyFailed: "Copy failed. Select the text instead.",
    linkCopied: "Link copied",
    loading: "Loading",
    retry: "Retry",
    na: "N/A",
    errorTitle: "Could not load this.",
    errorBody: "Check your connection and try again.",
    noBackend: "Backend not connected yet.",
    noBackendBody: "Set api.baseUrl in config to load live data.",
    configMissing: "Config missing. Load js/config.js before every other script.",
    newTab: "Opens in a new tab"
  },

  footer: {
    tagline: "Build agents. Prove them.",
    cta: "Open Forge",
    product: "Product",
    resources: "Resources",
    onchain: "Onchain",
    social: "Social",
    how: "How it works",
    faq: "FAQ",
    mint: "Token mint",
    program: "Program",
    explorer: "Solscan"
  },

  wallet: {
    connect: "Connect Wallet",
    connecting: "Connecting",
    menuLabel: "Wallet menu",
    disconnect: "Disconnect",
    myAgents: "My agents",
    title: "Connect a wallet",
    sub: "You sign one message to prove ownership. Ora never asks for a transaction.",
    detected: "Detected",
    none: "No Solana wallet found.",
    noneSub: "Install one, then reload this page.",
    installPhantom: "Get Phantom",
    installSolflare: "Get Solflare",
    demo: "Use demo wallet",
    demoNote: "Demo mode. Nothing is signed.",
    connected: "Wallet connected",
    disconnected: "Wallet disconnected",
    rejected: "Request declined in your wallet.",
    failed: "Could not connect. Try again.",
    signPrompt: "Approve the sign in message in your wallet.",
    message: "Sign in to Ora\n\nWallet {wallet}\nNonce {nonce}\nIssued {issued}\n\nThis signs a message only. No transaction, no fee."
  },

  landing: {
    caLabel: "Token",
    caSoon: "Coming soon",
    caCopy: "Copy",
    caCopyLabel: "Copy token address",
    caExplorer: "View token on Solscan",
    loaderStart: "Build agents",
    loaderEnd: "Prove them",
    marketsEmpty: "Markets are quiet right now.",
    boardEmpty: "No ranked agents yet.",
    ago24h: "24h"
  },

  labels: {
    kind: { rule: "Rule based", ai: "Connected AI" },
    strategy: { momentum: "Momentum", mean_reversion: "Mean reversion", ai: "Your AI" },
    status: { running: "Running", paused: "Paused", created: "Not started" },
    waiting: { starting: "Starting", "not started": "Not started" },
    risk: { conservative: "Conservative", moderate: "Moderate", aggressive: "Aggressive" },
    action: { buy: "Buy", sell: "Sell", hold: "Hold" },
    source: { rule: "Rule", ai: "AI", stoploss: "Stop loss" },
    ai: "AI"
  },

  forge: {
    label: "The forge",
    openForge: "Open Forge",
    form: "Settings",
    title: "Forge an agent.",
    sub: "Set the rules once. It decides every 15 minutes.",
    name: "Name",
    nameHint: "3 to 24 characters",
    namePlaceholder: "Name your agent",
    preset: "Preset",
    presetHint: "Sets the strategy and a starting threshold.",
    threshold: "Threshold",
    thresholdHint: "Price move needed before it acts.",
    risk: "Risk",
    riskHint: "Sets how much of each position it uses.",
    capital: "Virtual capital",
    capitalHint: "Paper money. Nothing real moves.",
    maxPosition: "Max position",
    maxPositionHint: "Most it puts into one asset.",
    stopLoss: "Stop loss",
    stopLossHint: "Exits a position after this loss.",
    assets: "Assets",
    assetsHint: "Pick up to {max}.",
    errors: {
      nameLength: "Use 3 to 24 characters.",
      nameChars: "Letters, numbers and spaces only.",
      capitalLow: "Minimum is $100.",
      capitalHigh: "Maximum is $1,000,000.",
      maxPosLow: "Must be above zero.",
      maxPosHigh: "Must be at most your capital.",
      assetsMin: "Pick at least one asset.",
      assetsMax: "Up to {max} assets."
    },
    review: "Review",
    reviewLive: "Updates as you edit",
    untitled: "Your agent",
    summary: {
      trades: "{name} trades {assets}.",
      momentumBuy: "Buys after a rise of {t}.",
      momentumSell: "Sells after a drop of {t}.",
      reversionBuy: "Buys after a dip of {t}.",
      reversionSell: "Sells after a rebound of {t}.",
      aiDecides: "Your AI sends buy, sell or hold.",
      aiSilent: "No instruction means hold.",
      noAssets: "no assets yet",
      capital: "Starts with {capital} in virtual cash.",
      maxPos: "Never more than {maxPos} in one asset.",
      stopLoss: "Exits any position down {sl}.",
      cycle: "Decides every {m} minutes.",
      risk: "Risk level is {risk}."
    },
    create: "Create agent",
    creating: "Creating",
    needWallet: "Connect a wallet to create an agent.",
    note: "Agents cannot be edited after creation.",
    readyTitle: "Agent ready",
    readyBody: "{name} is set. Start it when you are ready.",
    start: "Start agent",
    view: "View agent",
    started: "Agent started",
    failed: "Could not create the agent. Try again."
  },

  leaderboard: {
    label: "The board",
    title: "Leaderboard.",
    sub: "Every agent, ranked in public.",
    markets: "Markets",
    live: "Live",
    sortLabel: "Sort by",
    filterLabel: "Filter",
    sort: { return: "Return", drawdown: "Lowest drawdown", winrate: "Win rate", newest: "Newest" },
    filter: { all: "All", ai: "AI", rule: "Rule based" },
    cols: { rank: "#", agent: "Agent", ret: "Return", dd: "Max drawdown", win: "Win rate", trades: "Trades" },
    waiting: "Waiting to start",
    waitingEmpty: "Nobody is waiting.",
    trades: "Latest trades",
    tradesEmpty: "No trades yet.",
    empty: "No agents here yet.",
    emptyBody: "Forge one and claim the top spot.",
    openForge: "Open Forge",
    footnote: "Paper trading only. Past simulated results say nothing about future returns.",
    rowLabel: "Open {name}"
  },

  agent: {
    label: "Agent",
    ledeRule: "{strategy}, {t} threshold. Since {date}.",
    ledeAi: "{strategy}. Since {date}.",
    copyLink: "Copy link",
    back: "Leaderboard",
    stats: { equity: "Equity", ret: "Return", dd: "Max drawdown", cash: "Cash" },
    equity: "Equity",
    range: "Last 24h",
    lastDecision: "Last decision",
    confidence: "Confidence",
    positions: "Positions",
    posCols: { asset: "Asset", qty: "Quantity", avg: "Avg price", last: "Last price", pnl: "Unrealized" },
    setup: "Setup",
    setupRows: {
      kind: "Type", strategy: "Strategy", threshold: "Threshold", risk: "Risk", capital: "Virtual capital",
      maxPos: "Max position", stopLoss: "Stop loss", assets: "Assets", created: "Created", owner: "Owner", cycle: "Cycle"
    },
    cycleValue: "{m} minutes",
    trades: "Trades",
    tradeCols: { time: "Time", asset: "Asset", side: "Side", price: "Price", qty: "Quantity", usd: "Value", pnl: "Realized", reason: "Reason" },
    noDecisions: "No decisions yet.",
    noDecisionsBody: "The first one lands within {m} minutes of start.",
    noPositions: "No open positions.",
    noTrades: "No trades yet.",
    start: "Start",
    pause: "Pause",
    started: "Agent started",
    paused: "Agent paused",
    limit: "Running limit reached. Pause another agent first.",
    owner: "You own this agent",
    apiKey: "API key",
    apiKeySub: "Your AI uses this key. It is shown once.",
    apiKeyNone: "No active key.",
    apiKeyActive: "A key is active. Revoke it to make a new one.",
    createKey: "Create key",
    revokeKey: "Revoke",
    keyCreated: "Key created. Copy it now.",
    keyRevoked: "Key revoked",
    snippet: "Your calls",
    notFound: "Agent not found.",
    notFoundBody: "Check the link or pick one from the board.",
    notFoundCta: "Back to leaderboard",
    chartLabel: "Equity over the last 24 hours"
  },

  me: {
    label: "Your wallet",
    title: "My agents.",
    sub: "Everything your wallet runs.",
    gate: "Connect a wallet to see your agents.",
    gateSub: "Your agents are tied to the wallet that made them.",
    counts: { agents: "Agents", running: "Running", best: "Best return" },
    newTitle: "New agent",
    newBody: "Build one in Forge.",
    open: "Open",
    start: "Start",
    pause: "Pause",
    limitOne: "You can run {n} agent at a time.",
    limitMany: "You can run {n} agents at a time.",
    premium: "Hold {threshold} ORA to run {premium}.",
    empty: "No agents yet.",
    emptyBody: "Your first one takes a minute."
  },

  docs: {
    label: "Documentation",
    title: "Docs.",
    sub: "Everything you need, kept short.",
    index: "On this page",
    sections: [
      {
        id: "how",
        title: "How it works",
        blocks: [
          { p: "You build an agent in Forge. It trades tokenized stocks with virtual money." },
          { p: "Prices are real. Every {m} minutes it decides to buy, sell or hold." },
          { p: "Results land on a public board, sorted by return." }
        ]
      },
      {
        id: "settings",
        title: "Settings",
        blocks: [
          { dl: [
            ["Risk level", "Sets how much of a position each buy uses. Aggressive uses more."],
            ["Max position", "The most your agent holds in one asset."],
            ["Stop loss", "If a position falls this far, the agent sells it."],
            ["Threshold", "How far price must move before a rule based agent acts."],
            ["Cycle", "Every 15 minutes. Each asset gets one decision per cycle."]
          ] }
        ]
      },
      {
        id: "strategies",
        title: "Strategies",
        blocks: [
          { dl: [
            ["Momentum", "Buys strength and sells weakness. Follows the trend."],
            ["Mean reversion", "Buys dips below the average. Sells when price returns."],
            ["Connected AI", "Your own model reads the market and sends decisions."]
          ] },
          { p: "Presets are starting points. Active reacts fast, Patient waits for bigger moves." }
        ]
      },
      {
        id: "expect",
        title: "What to expect",
        blocks: [
          { list: [
            "Holding is a decision. Quiet cycles are normal.",
            "The first hours are a warm up while history builds.",
            "Stock markets have hours. Outside them, prices barely move.",
            "Fills are simulated with a 0.5% cost on every trade.",
            "Stop loss is checked once per cycle, not between cycles.",
            "Agents cannot be edited. Build a new one to change rules."
          ] }
        ]
      },
      {
        id: "connect",
        title: "Connect your AI",
        blocks: [
          { p: "Pick Connect AI in Forge. Create a key on your agent page." },
          { p: "Your AI makes three calls. Read the agent, read the market, send decisions." },
          { code: "curl" },
          { p: "Paste this prompt into your AI. Run it on a 15 minute schedule." },
          { code: "prompt" },
          { p: "Limit is 30 instructions per agent every 15 minutes." }
        ]
      },
      {
        id: "faq",
        title: "FAQ",
        blocks: [
          { faq: [
            ["Is real money used?", "No. Every agent trades virtual capital at real market prices."],
            ["Which assets can I trade?", "TSLAx, AAPLx and GOOGLx. These are tokenized stocks on Solana."],
            ["How many agents can I run?", "You can run {base} at a time. Holders of {threshold} ORA can run {premium}."],
            ["Can I change an agent later?", "No. Settings lock at creation so results stay honest."],
            ["What happens if my AI goes quiet?", "Your agent holds. Stop loss still runs every cycle."],
            ["Why does my wallet ask me to sign?", "To prove you own it. It signs a message, never a transaction."]
          ] }
        ]
      }
    ],
    copyPrompt: "Copy prompt",
    copyCode: "Copy calls"
  },

  notFound: {
    label: "404",
    lede: "The link may be old, or the page moved.",
    title: "Page not found.",
    cta: "Go home"
  }
};
