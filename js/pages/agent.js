// Agent detail, from ?slug=. Hero with name and status, stats, equity chart,
// last decisions, setup, positions and trades. The owner also gets Start or Pause,
// and for a Connected AI agent the API key panel with the three calls.
import { boot, config, copy, $, h, fill, btn, setBtnText, pageHero, emptyState, errorState, skeletonRows, refreshNav, bindCopy, toast, countWhenVisible, icon } from "../app.js";
import { api } from "../api.js";
import { wallet } from "../wallet.js";
import { equityChart } from "../charts.js";
import { usd, pct, pctPlain, drawdown, pnl, price, qty, date, ago, time, shortAddr, tone, truncate } from "../format.js";

boot({ page: "agent" });
const G = copy.agent;
const L = copy.labels;
const main = $("[data-page]");
const slug = new URLSearchParams(location.search).get("slug") || "";
const display = (sym) => (config.assets.find((a) => a.symbol === sym) || { display: sym }).display;
const statusState = { running: "state--running", paused: "state--paused", created: "state--idle" };

function card(title, body, { label, flush = true } = {}) {
  return h("section.card", {},
    h("div.card__head", {}, h("h2", {}, title), label ? h("span.label", {}, label) : null),
    h("div.card__body", { class: flush ? "card__body--flush" : "" }, body)
  );
}

/* ------------------------------------------------------------ loading and not found */

main.append(pageHero({ label: G.label, title: " ", art: "step-survey.avif" }));
const page = h("section.page", {}, h("div.container", {}, skeletonRows(3, "skeleton--card")));
main.append(page);
refreshNav();

function notFound() {
  main.replaceChildren(
    pageHero({ label: G.label, title: G.notFound, lede: G.notFoundBody, art: "step-survey.avif", children: [h("div.agent-hero__actions", {}, btn(G.notFoundCta, { href: "/leaderboard", variant: "light" }))] })
  );
  refreshNav();
}

async function start() {
  if (!slug) { notFound(); return; }
  let agent;
  try {
    agent = await api.getAgent(slug);
  } catch (err) {
    if (err && (err.code === "not_found" || err.status === 404)) { notFound(); return; }
    page.firstChild.replaceChildren(errorState(err, start));
    return;
  }
  render(agent);
}
start();
window.addEventListener("wallet:change", () => { if (main.dataset.slug) start(); });

/* ------------------------------------------------------------ render */

function render(a) {
  main.dataset.slug = a.slug;
  document.title = `${a.name} | Ora`;
  const owner = wallet.state === "connected" && wallet.address === a.ownerWallet;
  const strategyText = a.kind === "ai" ? L.strategy.ai : L.strategy[a.strategy];
  const lede = a.kind === "ai"
    ? fill(G.ledeAi, { strategy: strategyText, date: date(a.createdAt) })
    : fill(G.ledeRule, { strategy: strategyText, t: pctPlain(a.thresholdPct, 2), date: date(a.createdAt) });

  // hero
  const copyBtn = btn(G.copyLink, { variant: "light", arrow: false });
  bindCopy(copyBtn, () => location.href, { toastText: copy.common.linkCopied });
  const actions = [copyBtn];
  if (owner) {
    const running = a.status === "running";
    const toggle = btn(running ? G.pause : G.start, {
      variant: "outline",
      onclick: async () => {
        toggle.disabled = true;
        try {
          if (running) { await api.pauseAgent(a.slug); toast(G.paused); }
          else { await api.startAgent(a.slug); toast(G.started); }
          start();
        } catch (err) {
          toast(err && err.code === "limit" ? G.limit : copy.common.errorTitle, { error: true });
          toggle.disabled = false;
        }
      }
    });
    actions.push(toggle);
  }
  const hero = pageHero({
    label: owner ? G.owner : G.label, title: a.name, lede, art: "step-survey.avif",
    children: [
      h("div.agent-hero__badges", {},
        a.kind === "ai" ? h("span.state.state--ai", {}, L.ai) : h("span.state.state--idle", {}, L.kind.rule),
        h("span.state", { class: statusState[a.status] }, h("span.state__dot", { "aria-hidden": "true" }), L.status[a.status])),
      h("div.agent-hero__actions", {}, actions),
      h("a.backlink", { href: "/leaderboard", html: icon("back", "icon") + G.back })
    ]
  });

  const M = a.metrics;
  const statEls = {
    equity: h("p.stat__value"), ret: h("p.stat__value", { class: tone(M.returnPct) }),
    dd: h("p.stat__value", { class: M.maxDrawdownPct > 0.05 ? "down" : "" }), cash: h("p.stat__value")
  };
  const stats = h("div.stats", {},
    [["equity", G.stats.equity], ["ret", G.stats.ret], ["dd", G.stats.dd], ["cash", G.stats.cash]].map(([k, label]) =>
      h("div.stat", {}, statEls[k], h("p.stat__label", {}, label))));
  countWhenVisible(statEls.equity, M.equityUsd, (v) => usd(v, 0));
  countWhenVisible(statEls.ret, M.returnPct, (v) => pct(v));
  countWhenVisible(statEls.dd, M.maxDrawdownPct, (v) => drawdown(v));
  countWhenVisible(statEls.cash, M.cashUsd, (v) => usd(v, 0));

  // equity chart
  const chartHost = h("div");
  const chartCard = card(G.equity, a.equitySeries.length > 1 ? chartHost : emptyState({ title: G.noDecisions, body: fill(G.noDecisionsBody, { m: config.agents.cycleMinutes }), plain: true }), { label: G.range, flush: false });

  // last decisions
  const decisions = a.lastDecisions.length
    ? h("div", {}, a.lastDecisions.map((d) => h("div.decision", {},
        h("span.decision__asset", {}, display(d.asset)),
        h("span", {}, h("span.state", { class: "state--" + d.action }, L.action[d.action])),
        h("div.decision__body", {},
          h("p.decision__reason", {}, d.reason),
          h("div.confidence", {}, G.confidence, h("span.confidence__bar", {}, h("i", { style: { transform: `scaleX(${Math.max(0, Math.min(1, d.confidence))})` } })), pctPlain(d.confidence * 100, 0), " · ", L.source[d.source], " · ", ago(d.ts))
        ))))
    : h("p.empty-line", {}, G.noDecisions + " " + fill(G.noDecisionsBody, { m: config.agents.cycleMinutes }));

  // setup
  const S = G.setupRows;
  const base = String(config.chain.explorerBase || "").replace(/\/+$/, "");
  const setupRows = [
    [S.kind, a.kind === "ai" ? L.kind.ai : L.kind.rule],
    [S.strategy, strategyText],
    a.kind === "ai" ? null : [S.threshold, pctPlain(a.thresholdPct, 2)],
    [S.risk, L.risk[a.riskLevel]],
    [S.capital, usd(a.capitalUsd, 0)],
    [S.maxPos, usd(a.maxPositionUsd, 0)],
    [S.stopLoss, pctPlain(a.stopLossPct, 0)],
    [S.assets, a.assets.map(display).join(", ")],
    [S.cycle, fill(G.cycleValue, { m: config.agents.cycleMinutes })],
    [S.created, date(a.createdAt)],
    [S.owner, shortAddr(a.ownerWallet)]
  ].filter(Boolean);
  const setup = h("dl.setup", {}, setupRows.flatMap(([k, v]) => [h("dt", {}, k), h("dd", { title: k === S.owner ? a.ownerWallet : null }, v)]));

  // positions
  const P = G.posCols;
  const positions = a.positions.length
    ? h("div.table-wrap", {}, h("table.table", {},
        h("thead", {}, h("tr", {}, h("th", { scope: "col" }, P.asset), h("th.r", { scope: "col" }, P.qty), h("th.r", { scope: "col" }, P.avg), h("th.r", { scope: "col" }, P.last), h("th.r", { scope: "col" }, P.pnl))),
        h("tbody", {}, a.positions.map((p) => h("tr", {},
          h("td.num", {}, display(p.asset)), h("td.r.num", {}, qty(p.qty)), h("td.r.num", {}, price(p.avgPrice)),
          h("td.r.num", {}, price(p.lastPrice)), h("td.r.num", { class: tone(p.unrealizedPnl) }, pnl(p.unrealizedPnl)))))))
    : h("p.empty-line", {}, G.noPositions);

  // trades
  const T = G.tradeCols;
  const trades = a.trades.length
    ? h("div.table-wrap", {}, h("table.table", {},
        h("thead", {}, h("tr", {}, [T.time, T.asset, T.side, T.price, T.qty, T.usd, T.pnl, T.reason].map((c, i) => h(i >= 3 && i <= 6 ? "th.r" : "th", { scope: "col" }, c)))),
        h("tbody", {}, a.trades.map((t) => h("tr", {},
          h("td.num", { title: date(t.ts) + " " + time(t.ts) }, ago(t.ts)),
          h("td.num", {}, display(t.asset)),
          h("td", {}, h("span.state", { class: t.side === "buy" ? "state--buy" : "state--sell" }, L.action[t.side])),
          h("td.r.num", {}, price(t.price)), h("td.r.num", {}, qty(t.qty)), h("td.r.num", {}, usd(t.usd)),
          h("td.r.num", { class: tone(t.realizedPnl) }, t.realizedPnl === null ? copy.common.na : pnl(t.realizedPnl)),
          h("td.wrap", {}, t.reason))))))
    : h("p.empty-line", {}, G.noTrades);

  const blocks = [
    stats,
    chartCard,
    h("div.split", {}, card(G.lastDecision, decisions), card(G.setup, setup, { flush: false })),
    card(G.positions, positions),
    card(G.trades, trades)
  ];
  if (owner && a.kind === "ai") blocks.splice(2, 0, keyPanel(a));

  main.replaceChildren(hero, h("section.page", {}, h("div.container", {}, blocks)));
  refreshNav();
  if (a.equitySeries.length > 1) equityChart(chartHost, a.equitySeries, { label: G.chartLabel });
}

/* ------------------------------------------------------------ API key panel */

function snippet(key) {
  const base = (String(config.api.publicBaseUrl || "").trim() || location.origin).replace(/\/+$/, "");
  const k = key || "ora_YOUR_KEY";
  return [
    `curl ${base}/api/v1/agent -H "Authorization: Bearer ${k}"`,
    `curl "${base}/api/v1/market?hours=24" -H "Authorization: Bearer ${k}"`,
    `curl -X POST ${base}/api/v1/decisions -H "Authorization: Bearer ${k}" -H "Content-Type: application/json" -d '{"decisions":[{"asset":"TSLA","action":"buy","reason":"Trend is up"}]}'`
  ].join("\n");
}

function keyPanel(a) {
  const body = h("div.keypanel");
  const codeEl = h("code");
  const copyCode = btn(copy.docs.copyCode, { variant: "outline", arrow: false });
  let current = "";
  bindCopy(copyCode, () => snippet(current));
  const code = h("div.code-block", {}, h("div.code-block__bar", {}, h("span.label", {}, G.snippet), copyCode), h("pre.code-pre", {}, codeEl));

  function paint(active, key) {
    current = key || "";
    codeEl.textContent = snippet(key);
    const rows = [];
    if (key) {
      const keyCopy = btn(copy.common.copy, { variant: "dark", arrow: false });
      bindCopy(keyCopy, key);
      rows.push(h("p", {}, G.keyCreated), h("div.copy-field", {}, h("code", {}, key), keyCopy));
    } else {
      rows.push(h("p.quiet", {}, active ? G.apiKeyActive : G.apiKeyNone));
    }
    const create = btn(G.createKey, { onclick: async () => {
      create.disabled = true; setBtnText(create, copy.common.loading);
      try { const res = await api.createKey(a.slug); paint(true, res.key); }
      catch { toast(copy.common.errorTitle, { error: true }); create.disabled = false; setBtnText(create, G.createKey); }
    } });
    const revoke = btn(G.revokeKey, { variant: "danger", arrow: false, onclick: async () => {
      revoke.disabled = true;
      try { await api.revokeKey(a.slug); toast(G.keyRevoked); paint(false); }
      catch { toast(copy.common.errorTitle, { error: true }); revoke.disabled = false; }
    } });
    rows.push(h("div.btn-row", {}, active ? null : create, active ? revoke : null));
    body.replaceChildren(...rows, code);
  }
  paint(Boolean(a.apiKeyActive));
  return card(G.apiKey, body, { label: G.apiKeySub, flush: false });
}
