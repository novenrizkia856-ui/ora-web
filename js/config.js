// Every value that changes between environments lives here.
// After the smart contract is deployed, fill the empty strings. No other file needs editing.
window.ORA_CONFIG = {
  app: { name: "Ora", tagline: "Build agents. Prove them." },

  // true: use js/mock-data.js (demo). false: call the real backend at api.baseUrl.
  mockMode: true,

  chain: {
    name: "Solana",
    cluster: "mainnet-beta",                 // "devnet" | "mainnet-beta"
    rpcUrl: "https://api.mainnet-beta.solana.com",
    explorerBase: "https://solscan.io"       // token link: explorerBase + "/token/" + mint
  },

  token: {
    symbol: "ORA",
    mint: "",                                // FILL AFTER TOKEN LAUNCH. Empty means "Coming soon".
    decimals: 6,
    premiumThreshold: 500000                 // holders at or above this can run 3 agents
  },

  program: {
    id: "",                                  // FILL AFTER ANCHOR DEPLOY. Empty means off chain mode.
    anchorOnchain: false                     // true only after program.id is filled
  },

  api: {
    baseUrl: "",                             // FILL AFTER BACKEND DEPLOY, e.g. "https://api.example.com"
    publicBaseUrl: ""                        // shown in docs snippets. Empty uses window.location.origin
  },

  agents: {
    cycleMinutes: 15,
    maxAssets: 3,
    maxRunningPerWallet: 1,
    maxRunningPremium: 3,
    presets: [
      { id: "active",   label: "Active",    strategy: "momentum",       thresholdPct: 0.75 },
      { id: "balanced", label: "Balanced",  strategy: "momentum",       thresholdPct: 2 },
      { id: "patient",  label: "Patient",   strategy: "momentum",       thresholdPct: 4 },
      { id: "dip",      label: "Dip buyer", strategy: "mean_reversion", thresholdPct: 1.5 },
      { id: "ai",       label: "Connect AI", strategy: null,            thresholdPct: null }
    ],
    risk: ["conservative", "moderate", "aggressive"]
  },

  // Tokenized stocks (xStocks on Solana). Verify each mint on Solscan before launch.
  assets: [
    { symbol: "TSLA",  display: "TSLAx",  name: "Tesla",    mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB" },
    { symbol: "AAPL",  display: "AAPLx",  name: "Apple",    mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp" },
    { symbol: "GOOGL", display: "GOOGLx", name: "Alphabet", mint: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN" }
  ],

  // Leave a URL empty to hide that link everywhere.
  links: { x: "", telegram: "", github: "", discord: "" }
};
