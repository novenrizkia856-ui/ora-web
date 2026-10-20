// Data layer. mockMode true resolves from mock-data.js with a short delay and keeps
// demo mutations in localStorage (keys start with "ora.mock."). mockMode false calls
// config.api.baseUrl with cookies included.
import { buildDataset, newAgent, liveTrade } from "./mock-data.js";

const cfg = () => window.ORA_CONFIG;
const isMock = () => cfg().mockMode !== false;

export class ApiError extends Error {
  constructor(code, message, status) {
    super(message || code);
    this.code = code;
    this.status = status || 0;
  }
}

/* ------------------------------------------------------------ real backend */

async function http(method, path, body) {
  const base = String(cfg().api.baseUrl || "").trim().replace(/\/+$/, "");
  if (!base) throw new ApiError("no_backend", "api.baseUrl is empty");
  let res;
  try {
    res = await fetch(base + path, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json", Accept: "application/json" } : { Accept: "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (err) {
    throw new ApiError("network", err.message);
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  // ora-api errors are { error: { code, message } }
  const error = data && data.error;
  if (!res.ok) throw new ApiError((error && error.code) || "http", (error && error.message) || res.statusText, res.status);
  return data;
}

/* ------------------------------------------------------------ mock store */

const K = { agents: "ora.mock.agents", status: "ora.mock.status", keys: "ora.mock.keys" };

function read(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked, the demo still works for this page */ }
}

// in memory copies, so the demo also works when storage is blocked
let memAgents = null, memStatus = null, memKeys = null;
const userAgents = () => (memAgents ??= read(K.agents, []));
const statusMap = () => (memStatus ??= read(K.status, {}));
const keyMap = () => (memKeys ??= read(K.keys, {}));

function session() {
  try { const s = JSON.parse(localStorage.getItem("ora.session") || "null"); return s && s.address ? s.address : null; } catch { return null; }
}

function wait() {
  return new Promise((r) => setTimeout(r, 250 + Math.random() * 350));
}
async function mock(fn) {
  await wait();
  return structuredClone(fn());
}

function dataset() {
  const ds = buildDataset();
  const overrides = statusMap();
  const all = ds.agents.concat(userAgents()).map((a) => (overrides[a.slug] ? { ...a, status: overrides[a.slug] } : a));
  const keys = keyMap();
  all.forEach((a) => { a.apiKeyActive = Boolean(keys[a.slug] && keys[a.slug].active); });
  return { markets: ds.markets, agents: all };
}

const hasHistory = (a) => a.trades.length > 0 || a.equitySeries.length > 1;

const SORTS = {
  return: (a, b) => b.metrics.returnPct - a.metrics.returnPct,
  drawdown: (a, b) => a.metrics.maxDrawdownPct - b.metrics.maxDrawdownPct,
  winrate: (a, b) => b.metrics.winRatePct - a.metrics.winRatePct,
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
};

function leaderboard({ sort = "return", filter = "all" } = {}) {
  const { agents } = dataset();
  const pass = (a) => filter === "all" || a.kind === filter;
  const ranked = agents.filter((a) => a.status !== "created" && hasHistory(a) && pass(a)).sort(SORTS[sort] || SORTS.return);
  const waiting = agents
    .filter((a) => pass(a) && (a.status === "created" || !hasHistory(a)))
    .map((a) => ({ slug: a.slug, name: a.name, kind: a.kind, state: a.status === "created" ? "not started" : "starting" }));
  return { ranked, waiting };
}

function latestTrades() {
  const { agents } = dataset();
  return agents
    .flatMap((a) => a.trades.map((t) => ({ ...t, agent: { slug: a.slug, name: a.name, kind: a.kind } })))
    .sort((x, y) => new Date(y.ts) - new Date(x.ts))
    .slice(0, 12);
}

function findAgent(slug) {
  const a = dataset().agents.find((x) => x.slug === slug);
  if (!a) throw new ApiError("not_found", "agent not found", 404);
  return a;
}

function requireOwner(slug) {
  const me = session();
  if (!me) throw new ApiError("unauthorized", "connect a wallet", 401);
  const a = findAgent(slug);
  if (a.ownerWallet !== me) throw new ApiError("forbidden", "not your agent", 403);
  return a;
}

function slugFor(name) {
  const base = String(name).toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20) || "agent";
  const taken = new Set(dataset().agents.map((a) => a.slug));
  let slug = base, n = 2;
  while (taken.has(slug)) slug = base + n++;
  return slug;
}

function setStatus(slug, status) {
  const map = statusMap();
  map[slug] = status;
  write(K.status, map);
}

function randomKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const a = new Uint8Array(32);
  crypto.getRandomValues(a);
  return "ora_" + Array.from(a, (b) => chars[b % chars.length]).join("");
}

/* ------------------------------------------------------------ public api */

const enc = encodeURIComponent;

export const api = {
  getMarkets() {
    return isMock() ? mock(() => dataset().markets) : http("GET", "/api/markets");
  },

  getLeaderboard({ sort = "return", filter = "all" } = {}) {
    return isMock()
      ? mock(() => leaderboard({ sort, filter }))
      : http("GET", `/api/leaderboard?sort=${enc(sort)}&filter=${enc(filter)}`);
  },

  getLatestTrades() {
    return isMock() ? mock(latestTrades) : http("GET", "/api/trades/latest");
  },

  getAgent(slug) {
    return isMock() ? mock(() => findAgent(slug)) : http("GET", `/api/agents/${enc(slug)}`);
  },

  /** { wallet, agents: [Agent], premium: boolean } */
  getMe() {
    if (!isMock()) return http("GET", "/api/me");
    return mock(() => {
      const me = session();
      if (!me) throw new ApiError("unauthorized", "connect a wallet", 401);
      return { wallet: me, agents: dataset().agents.filter((a) => a.ownerWallet === me), premium: false };
    });
  },

  createAgent(payload) {
    if (!isMock()) return http("POST", "/api/agents", payload);
    return mock(() => {
      const me = session();
      if (!me) throw new ApiError("unauthorized", "connect a wallet", 401);
      const agent = newAgent({ ...payload, slug: slugFor(payload.name) }, me);
      const list = userAgents();
      list.push(agent);
      write(K.agents, list);
      return agent;
    });
  },

  startAgent(slug) {
    if (!isMock()) return http("POST", `/api/agents/${enc(slug)}/start`);
    return mock(() => {
      const a = requireOwner(slug);
      const running = dataset().agents.filter((x) => x.ownerWallet === a.ownerWallet && x.status === "running" && x.slug !== slug).length;
      if (running >= cfg().agents.maxRunningPerWallet) throw new ApiError("limit", "running limit reached", 409);
      setStatus(slug, "running");
      return { ...a, status: "running" };
    });
  },

  pauseAgent(slug) {
    if (!isMock()) return http("POST", `/api/agents/${enc(slug)}/pause`);
    return mock(() => {
      const a = requireOwner(slug);
      setStatus(slug, "paused");
      return { ...a, status: "paused" };
    });
  },

  /** Returns { key } once. Only a flag is kept afterwards. */
  createKey(slug) {
    if (!isMock()) return http("POST", `/api/agents/${enc(slug)}/key`);
    return mock(() => {
      const a = requireOwner(slug);
      if (a.kind !== "ai") throw new ApiError("bad_request", "keys are for AI agents", 400);
      const key = randomKey();
      const map = keyMap();
      map[slug] = { active: true, createdAt: new Date().toISOString() };
      write(K.keys, map);
      return { key };
    });
  },

  revokeKey(slug) {
    if (!isMock()) return http("DELETE", `/api/agents/${enc(slug)}/key`);
    return mock(() => {
      requireOwner(slug);
      const map = keyMap();
      delete map[slug];
      write(K.keys, map);
      return { revoked: true };
    });
  },

  auth: {
    requestNonce(walletAddress) {
      if (isMock()) return mock(() => ({ nonce: Math.random().toString(36).slice(2) }));
      return http("POST", "/api/auth/nonce", { wallet: walletAddress });
    },
    verify(walletAddress, signatureBase64) {
      if (isMock()) return mock(() => ({ ok: true, wallet: walletAddress }));
      return http("POST", "/api/auth/verify", { wallet: walletAddress, signature: signatureBase64 });
    },
    logout() {
      if (isMock()) return mock(() => ({ ok: true }));
      return http("POST", "/api/auth/logout");
    }
  }
};

/** Demo only: the next trade for the live feed on the leaderboard. */
let liveCount = 0;
export function mockLiveTrade() {
  const { agents, markets } = dataset();
  return liveTrade(liveCount++, agents, markets);
}
