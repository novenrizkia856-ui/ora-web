// Ora pieces on the RELL template landing: the Solana wallet behind the Connect
// buttons, and the stock charts drawn over the market card paintings.
// js/landing.js keeps the template motion; this module only adds to it.
import { wallet, openWalletModal } from "./wallet.js";
import { openModal, h, copy } from "./app.js";
import { api } from "./api.js";
import { rng } from "./mock-data.js";
import { shortAddr, price, pct } from "./format.js";

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ready = new Promise((r) => (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", r) : r()));

/* ------------------------------------------------------------ wallet buttons */

function paintWallet() {
  document.querySelectorAll("[data-wallet-connect]").forEach((b) => {
    const connected = wallet.state === "connected";
    const text = connected ? shortAddr(wallet.address) : wallet.state === "connecting" ? copy.wallet.connecting : "Connect";
    const label = b.querySelector("[data-wallet-label]");
    if (label) label.textContent = text; else b.textContent = text;
    b.dataset.state = connected ? "connected" : "idle";
    b.setAttribute("aria-label", connected ? copy.wallet.menuLabel + ", " + text : copy.wallet.connect);
    b.disabled = wallet.state === "connecting";
  });
}

function accountModal() {
  const m = openModal({
    title: shortAddr(wallet.address),
    body: [h("p", { class: "mono" }, wallet.address)],
    actions: [
      h("a.btn.btn--primary", { href: "/me" }, copy.wallet.myAgents),
      h("button.btn.btn--secondary", { type: "button", onclick: () => { m.close(); wallet.disconnect(); } }, copy.wallet.disconnect)
    ]
  });
}

ready.then(() => {
  window.addEventListener("wallet:change", paintWallet);
  document.querySelectorAll("[data-wallet-connect]").forEach((b) => {
    b.hidden = false;
    b.addEventListener("click", () => {
      // the phone sheet stays open underneath; the modal sits above it
      if (wallet.state === "connected") accountModal();
      else openWalletModal();
    });
  });
  wallet.init();
  paintWallet();
});

/* ------------------------------------------------------------ chart drawing */

const NS = "http://www.w3.org/2000/svg";
const node = (tag, attrs, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
};

function smooth(pts) {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ` +
      `${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Draw a price line into box, with optional buy and sell marks: [{ i, side }]. */
function draw(box, values, marks = []) {
  const w = Math.max(1, box.clientWidth), hgt = Math.max(1, box.clientHeight);
  // the plot sits under the label row and fills the rest of the panel
  const top = Math.min(48, hgt * 0.34), bottom = hgt - 6, left = 0, right = w - 6;
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const pts = values.map((v, i) => [left + (i / (values.length - 1)) * (right - left), bottom - ((v - min) / span) * (bottom - top)]);
  box.querySelector("svg")?.remove();
  const svg = node("svg", { viewBox: `0 0 ${w} ${hgt}`, preserveAspectRatio: "none" });
  const id = "oc" + Math.random().toString(36).slice(2, 8);
  const defs = node("defs", {}, svg);
  const g = node("linearGradient", { id, x1: "0", y1: "0", x2: "0", y2: "1" }, defs);
  node("stop", { offset: "0", "stop-color": "#fff", "stop-opacity": ".12" }, g);
  node("stop", { offset: "1", "stop-color": "#fff", "stop-opacity": "0" }, g);
  [0.33, 0.66].forEach((f) => node("line", { x1: 0, x2: w, y1: top + (bottom - top) * f, y2: top + (bottom - top) * f, class: "ora-chart__grid" }, svg));
  const d = smooth(pts);
  node("path", { d: `${d}L${right} ${bottom}L${left} ${bottom}Z`, fill: `url(#${id})`, class: "ora-chart__area" }, svg);
  node("path", { d, class: "ora-chart__line", pathLength: "1" }, svg);
  const mg = node("g", { class: "ora-chart__marks" }, svg);
  marks.forEach((m) => {
    const [x, y] = pts[m.i];
    node(m.side === "buy" ? "circle" : "circle", { cx: x, cy: y, r: 4.5, class: m.side === "buy" ? "ora-chart__dot" : "ora-chart__ring" }, mg);
    const t = node("text", { x, y: m.side === "buy" ? y + 18 : y - 11, "text-anchor": "middle", class: "ora-chart__tag" }, mg);
    t.textContent = m.side === "buy" ? "BUY" : "SELL";
  });
  const [lx, ly] = pts[pts.length - 1];
  node("circle", { cx: lx - 3, cy: ly, r: 3.5, class: "ora-chart__halo" }, svg);
  node("circle", { cx: lx - 3, cy: ly, r: 3.5, class: "ora-chart__last" }, svg);
  box.appendChild(svg);
}

function label(box, big, small) {
  let el = box.querySelector(".ora-chart__label");
  if (!el) { el = h("div.ora-chart__label"); box.appendChild(el); }
  el.replaceChildren(h("b", {}, big), h("span", {}, small));
}

function whenSeen(box) {
  if (reduce || !("IntersectionObserver" in window)) { box.classList.add("is-drawn"); return; }
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    requestAnimationFrame(() => box.classList.add("is-drawn"));
  }, { threshold: 0.3 });
  io.observe(box);
}

function mount(box, values, marks, big, small) {
  label(box, big, small);
  draw(box, values, marks);
  whenSeen(box);
  let lastW = box.clientWidth;
  new ResizeObserver(() => {
    if (box.clientWidth === lastW) return;
    lastW = box.clientWidth;
    draw(box, values, marks);
  }).observe(box);
}

/* ------------------------------------------------------------ strategy sample paths */

function samplePath(seed, n = 72, vol = 1) {
  const r = rng(seed);
  const out = [100];
  for (let i = 1; i < n; i++) out.push(out[i - 1] * (1 + (r() - 0.49) * 0.018 * vol));
  return out;
}

/** Momentum: buy once the move over the last bars passes the threshold, sell when it reverses past it. */
function momentumMarks(v, look = 6, t = 1.6) {
  const marks = [];
  let open = false;
  for (let i = look; i < v.length - 2; i++) {
    const ch = (v[i] / v[i - look] - 1) * 100;
    if (!open && ch > t) { marks.push({ i, side: "buy" }); open = true; i += 3; }
    else if (open && ch < -t * 0.6) { marks.push({ i, side: "sell" }); open = false; i += 3; }
  }
  return marks.slice(0, 6);
}

/** Mean reversion: buy a stretch below the average, sell back at it. */
function reversionMarks(v, win = 10, t = 1.4) {
  const marks = [];
  let open = false;
  for (let i = win; i < v.length - 2; i++) {
    const avg = v.slice(i - win, i).reduce((a, b) => a + b, 0) / win;
    const gap = (v[i] / avg - 1) * 100;
    if (!open && gap < -t) { marks.push({ i, side: "buy" }); open = true; i += 3; }
    else if (open && gap > 0.3) { marks.push({ i, side: "sell" }); open = false; i += 3; }
  }
  return marks.slice(0, 6);
}

/** Connected AI: a handful of decisions on its own schedule. */
function aiMarks(v) {
  const r = rng(77);
  const marks = [];
  let open = false;
  for (let i = 8; i < v.length - 4; i += 9 + Math.floor(r() * 5)) {
    marks.push({ i, side: open ? "sell" : "buy" });
    open = !open;
  }
  return marks;
}

const STRATEGY = {
  momentum: () => { const v = samplePath(4101, 72, 1.2); return [v, momentumMarks(v)]; },
  reversion: () => { const v = samplePath(5203, 72, 1.1); return [v, reversionMarks(v)]; },
  ai: () => { const v = samplePath(6307, 72, 1); return [v, aiMarks(v)]; }
};
const STRATEGY_LABEL = { momentum: "Momentum", reversion: "Mean reversion", ai: "Connected AI" };

/* ------------------------------------------------------------ render all cards, ticker copies included */

ready.then(async () => {
  const boxes = () => Array.from(document.querySelectorAll("[data-ora-chart]"));

  boxes().forEach((box) => {
    const key = box.dataset.oraChart;
    if (!STRATEGY[key]) return;
    const [v, marks] = STRATEGY[key]();
    mount(box, v, marks, STRATEGY_LABEL[key], "Sample signals");
  });

  let markets = null;
  try { markets = await api.getMarkets(); } catch { markets = null; }
  boxes().forEach((box) => {
    const key = box.dataset.oraChart;
    if (STRATEGY[key]) return;
    const m = markets && markets.find((x) => x.asset === key);
    if (!m) { label(box, key + "x", "Prices at launch"); return; }
    // every third sample keeps the 24h shape without the tick noise
    const v = m.samples.filter((_, i) => i % 3 === 0 || i === m.samples.length - 1).map((s) => s.price);
    mount(box, v, [], price(m.price), "24h " + pct(m.change24hPct, 2));
  });
});
