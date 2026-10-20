// Deterministic demo data. Values come from fixed seeds, so every load shows the same
// agents, prices and trades. Timestamps are placed relative to the current 15 minute cycle.

const CYCLE_MS = 15 * 60 * 1000;
const POINTS = 96; // 24 hours of 15 minute cycles

/* ------------------------------------------------------------ seeded random */

export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(r) {
  const u = Math.max(r(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}
const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
/** A base58 string from a seed. Only used for demo wallets, never for contracts or mints. */
function base58(seed, len = 44) {
  const r = rng(seed);
  let s = "";
  for (let i = 0; i < len; i++) s += B58[Math.floor(r() * 58)];
  return s;
}

export const DEMO_WALLET = "7xKp" + base58(424242, 36) + "9fQa";

/* ------------------------------------------------------------ markets */

const MARKET_SPECS = [
  { asset: "TSLA", start: 431.2, vol: 0.0062, drift: 0.00022, seed: 11 },
  { asset: "AAPL", start: 247.9, vol: 0.0031, drift: 0.00009, seed: 23 },
  { asset: "GOOGL", start: 251.6, vol: 0.0041, drift: -0.00011, seed: 37 }
];

export function cycleNow(now = Date.now()) {
  return Math.floor(now / CYCLE_MS) * CYCLE_MS;
}

export function buildMarkets(now = Date.now()) {
  const assets = (globalThis.ORA_CONFIG && globalThis.ORA_CONFIG.assets) || [];
  const end = cycleNow(now);
  return MARKET_SPECS.map((spec) => {
    const meta = assets.find((a) => a.symbol === spec.asset) || { display: spec.asset, name: spec.asset };
    const r = rng(spec.seed);
    let p = spec.start;
    const samples = [];
    for (let i = 0; i < POINTS; i++) {
      if (i > 0) p *= 1 + spec.drift + spec.vol * gauss(r);
      samples.push({ ts: new Date(end - (POINTS - 1 - i) * CYCLE_MS).toISOString(), price: round(p) });
    }
    const last = samples[POINTS - 1].price;
    return {
      asset: spec.asset,
      display: meta.display,
      name: meta.name,
      price: last,
      change1hPct: round((last / samples[POINTS - 5].price - 1) * 100),
      change24hPct: round((last / samples[0].price - 1) * 100),
      samples
    };
  });
}

/* ------------------------------------------------------------ agents */

const AGENT_SPECS = [
  { slug: "atlas", name: "Atlas", kind: "rule", strategy: "momentum", thresholdPct: 2, riskLevel: "moderate", status: "running", assets: ["TSLA", "AAPL"], target: 18.4, win: 0.64, days: 21, seed: 101 },
  { slug: "helix", name: "Helix", kind: "rule", strategy: "mean_reversion", thresholdPct: 1.5, riskLevel: "conservative", status: "running", assets: ["AAPL", "GOOGL"], target: 11.2, win: 0.61, days: 18, seed: 202 },
  { slug: "novadrift", name: "Nova Drift", kind: "ai", strategy: null, thresholdPct: null, riskLevel: "aggressive", status: "running", assets: ["TSLA", "AAPL", "GOOGL"], target: 23.6, win: 0.58, days: 9, seed: 303 },
  { slug: "quill", name: "Quill", kind: "rule", strategy: "momentum", thresholdPct: 0.75, riskLevel: "aggressive", status: "running", assets: ["TSLA"], target: 6.1, win: 0.52, days: 14, seed: 404 },
  { slug: "meridian", name: "Meridian", kind: "ai", strategy: null, thresholdPct: null, riskLevel: "moderate", status: "paused", assets: ["GOOGL", "AAPL"], target: 2.4, win: 0.5, days: 7, seed: 505, demoOwned: true },
  { slug: "kite", name: "Kite", kind: "rule", strategy: "momentum", thresholdPct: 4, riskLevel: "conservative", status: "paused", assets: ["GOOGL"], target: -3.2, win: 0.42, days: 26, seed: 606 },
  { slug: "sable", name: "Sable", kind: "rule", strategy: "mean_reversion", thresholdPct: 1.5, riskLevel: "aggressive", status: "running", assets: ["TSLA", "GOOGL"], target: -7.6, win: 0.37, days: 12, seed: 707 },
  { slug: "orbit", name: "Orbit", kind: "ai", strategy: null, thresholdPct: null, riskLevel: "moderate", status: "created", assets: ["AAPL"], target: 0, win: 0, days: 1, seed: 808 }
];

const REASONS = {
  buy: {
    momentum: ["Momentum above threshold", "Breakout above the range", "Strong close, trend is up", "Higher highs on rising volume"],
    mean_reversion: ["Price below average", "Dip under the band", "Oversold after a sharp drop", "Price far below the mean"],
    ai: ["Trend is up on strong closes", "Earnings drift looks positive", "Buyers held the morning low", "Sector strength carries over"]
  },
  sell: {
    momentum: ["Trend turned down", "Momentum faded below threshold", "Lower highs, taking profit", "Range broke to the downside"],
    mean_reversion: ["Rebound to average", "Price back at the mean", "Stretched above the band", "Target reached on the bounce"],
    ai: ["Risk is high, trimming size", "Momentum is fading into the close", "Locking gains after a fast run", "Sellers in control today"]
  },
  hold: {
    momentum: ["No move past threshold", "Trend intact, holding"],
    mean_reversion: ["Price near average", "No stretch to fade"],
    ai: ["Waiting for a clearer signal", "Holding through noise"]
  },
  stoploss: "Stop loss hit"
};

function equityPath(spec, capital, end) {
  const r = rng(spec.seed);
  const walk = [0];
  for (let i = 1; i < POINTS; i++) walk.push(walk[i - 1] + 0.0042 * gauss(r));
  const goal = Math.log(1 + spec.target / 100);
  return walk.map((w, i) => {
    const f = i / (POINTS - 1);
    const b = w - f * walk[POINTS - 1] + f * goal;
    return { ts: new Date(end - (POINTS - 1 - i) * CYCLE_MS).toISOString(), equity: round(capital * Math.exp(b)) };
  });
}

function maxDrawdown(series) {
  let peak = -Infinity, dd = 0;
  for (const p of series) {
    peak = Math.max(peak, p.equity);
    dd = Math.max(dd, (peak - p.equity) / peak);
  }
  return round(dd * 100);
}

function key(spec) { return spec.kind === "ai" ? "ai" : spec.strategy; }

function buildAgent(spec, markets, end) {
  const capitalUsd = 10000;
  const maxPositionUsd = spec.riskLevel === "aggressive" ? 4000 : spec.riskLevel === "moderate" ? 2500 : 1500;
  const owner = spec.demoOwned ? DEMO_WALLET : base58(spec.seed * 7 + 3);
  const createdAt = new Date(end - spec.days * 96 * CYCLE_MS - (spec.seed % 37) * CYCLE_MS).toISOString();
  const base = {
    slug: spec.slug, name: spec.name, kind: spec.kind, strategy: spec.strategy, thresholdPct: spec.thresholdPct,
    riskLevel: spec.riskLevel, capitalUsd, maxPositionUsd, stopLossPct: spec.riskLevel === "aggressive" ? 8 : 5,
    assets: spec.assets.slice(), status: spec.status, ownerWallet: owner, createdAt
  };

  if (spec.status === "created") {
    return {
      ...base,
      metrics: { equityUsd: capitalUsd, returnPct: 0, maxDrawdownPct: 0, winRatePct: 0, trades: 0, cashUsd: capitalUsd },
      equitySeries: [{ ts: createdAt, equity: capitalUsd }],
      lastDecisions: [], positions: [], trades: []
    };
  }

  const r = rng(spec.seed + 1);
  const series = equityPath(spec, capitalUsd, end);
  const bySymbol = Object.fromEntries(markets.map((m) => [m.asset, m]));

  // 20 trades on distinct cycles, alternating buy and sell per asset
  const slots = new Set();
  while (slots.size < 20) slots.add(4 + Math.floor(r() * (POINTS - 8)));
  const idx = [...slots].sort((a, b) => a - b);
  const open = {};
  const trades = [];
  let sells = 0, wins = 0;
  idx.forEach((i, n) => {
    const asset = spec.assets[n % spec.assets.length];
    const px = bySymbol[asset].samples[i].price;
    const side = open[asset] ? "sell" : "buy";
    const usd = round(maxPositionUsd * (0.55 + r() * 0.4));
    const q = round(usd / px, 4);
    const k = key(spec);
    let realizedPnl = null;
    let reason;
    if (side === "sell") {
      sells++;
      const win = r() < spec.win;
      if (win) wins++;
      const stop = !win && r() < 0.3;
      realizedPnl = round((win ? 1 : -1) * usd * (0.004 + r() * (win ? 0.028 : 0.02)));
      reason = stop ? REASONS.stoploss : REASONS.sell[k][Math.floor(r() * REASONS.sell[k].length)];
      delete open[asset];
    } else {
      reason = REASONS.buy[k][Math.floor(r() * REASONS.buy[k].length)];
      open[asset] = { qty: q, avgPrice: px };
    }
    trades.push({ ts: bySymbol[asset].samples[i].ts, asset, side, price: px, qty: q, usd, realizedPnl, reason });
  });
  trades.reverse(); // newest first

  const positions = Object.entries(open).map(([asset, p]) => {
    const lastPrice = bySymbol[asset].price;
    return { asset, qty: p.qty, avgPrice: p.avgPrice, lastPrice, unrealizedPnl: round((lastPrice - p.avgPrice) * p.qty) };
  });
  const equityUsd = series[POINTS - 1].equity;
  const held = positions.reduce((s, p) => s + p.qty * p.lastPrice, 0);

  const lastTs = spec.status === "paused" ? series[POINTS - 9].ts : series[POINTS - 1].ts;
  const lastDecisions = spec.assets.map((asset) => {
    const k = key(spec);
    const action = open[asset] ? (r() < 0.6 ? "hold" : "sell") : (r() < 0.5 ? "hold" : "buy");
    const pool = REASONS[action][k];
    return {
      asset, action, reason: pool[Math.floor(r() * pool.length)],
      confidence: round(spec.kind === "ai" ? 0.55 + r() * 0.4 : 0.7 + r() * 0.25, 2),
      ts: lastTs, source: spec.kind === "ai" ? "ai" : "rule"
    };
  });

  return {
    ...base,
    metrics: {
      equityUsd,
      returnPct: round((equityUsd / capitalUsd - 1) * 100),
      maxDrawdownPct: maxDrawdown(series),
      winRatePct: sells ? round((wins / sells) * 100, 1) : 0,
      trades: trades.length,
      cashUsd: round(Math.max(0, equityUsd - held))
    },
    equitySeries: series,
    lastDecisions,
    positions,
    trades
  };
}

/** The full seeded dataset for the current cycle. */
export function buildDataset(now = Date.now()) {
  const end = cycleNow(now);
  const markets = buildMarkets(now);
  const agents = AGENT_SPECS.map((s) => buildAgent(s, markets, end));
  return { markets, agents };
}

/** A fresh agent made in Forge. It has no history until its first cycle. */
export function newAgent(payload, owner, now = Date.now()) {
  const capitalUsd = Number(payload.capitalUsd);
  const createdAt = new Date(now).toISOString();
  return {
    slug: payload.slug,
    name: payload.name,
    kind: payload.kind,
    strategy: payload.kind === "ai" ? null : payload.strategy,
    thresholdPct: payload.kind === "ai" ? null : Number(payload.thresholdPct),
    riskLevel: payload.riskLevel,
    capitalUsd,
    maxPositionUsd: Number(payload.maxPositionUsd),
    stopLossPct: Number(payload.stopLossPct),
    assets: payload.assets.slice(),
    status: "created",
    ownerWallet: owner,
    createdAt,
    metrics: { equityUsd: capitalUsd, returnPct: 0, maxDrawdownPct: 0, winRatePct: 0, trades: 0, cashUsd: capitalUsd },
    equitySeries: [{ ts: createdAt, equity: capitalUsd }],
    lastDecisions: [],
    positions: [],
    trades: []
  };
}

/** A deterministic stream of fresh trades for the live feed in demo mode. */
export function liveTrade(n, agents, markets, now = Date.now()) {
  const r = rng(9000 + n);
  const ranked = agents.filter((a) => a.status === "running" && a.trades.length);
  const agent = ranked[Math.floor(r() * ranked.length)];
  const asset = agent.assets[Math.floor(r() * agent.assets.length)];
  const m = markets.find((x) => x.asset === asset);
  const side = r() < 0.52 ? "buy" : "sell";
  const k = agent.kind === "ai" ? "ai" : agent.strategy;
  const price = round(m.price * (1 + (r() - 0.5) * 0.004));
  const usd = round(agent.maxPositionUsd * (0.5 + r() * 0.4));
  return {
    ts: new Date(now).toISOString(), asset, side, price, qty: round(usd / price, 4), usd,
    realizedPnl: side === "sell" ? round((r() - 0.4) * usd * 0.03) : null,
    reason: REASONS[side][k][Math.floor(r() * REASONS[side][k].length)],
    agent: { slug: agent.slug, name: agent.name, kind: agent.kind }
  };
}
