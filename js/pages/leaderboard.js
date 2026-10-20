// Leaderboard: markets, the ranked table with sort and filter, agents waiting to
// start, and the latest trades. In demo mode a new trade slides in every 8 seconds.
import { boot, config, copy, $, h, fill, btn, pageHero, load, emptyState, skeletonRows, refreshNav, reduceMotion, countWhenVisible } from "../app.js";
import { api, mockLiveTrade } from "../api.js";
import { sparkline } from "../charts.js";
import { price, pct, pctPlain, drawdown, integer, tone, truncate, ago } from "../format.js";

boot({ page: "leaderboard" });
const B = copy.leaderboard;
const L = copy.labels;
const main = $("[data-page]");

main.append(pageHero({ label: B.label, title: B.title, lede: B.sub, art: "step-stairs.avif" }));
refreshNav();

const marketsHost = h("div.mkt-grid");
const tableHost = h("div.table-wrap");
const waitHost = h("div");
const feedHost = h("div");
let sort = "return";
let filter = "all";

/* ------------------------------------------------------------ controls */

function tabs(label, options, current, onPick) {
  const group = h("div.seg.seg--quiet", { role: "group", "aria-label": label });
  const buttons = Object.entries(options).map(([value, text]) =>
    h("button", { type: "button", "aria-pressed": String(value === current), onclick: () => {
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === value)));
      onPick(value);
    }, dataset: { v: value } }, text));
  group.append(...buttons);
  return group;
}

main.append(h("section.page", {}, h("div.container", {},
  h("div.head-row", {}, h("div", {}, h("p.label", {}, B.live), h("h2.display-2", {}, B.markets))),
  marketsHost,
  h("div.head-row", {}, h("div", {}, h("p.label", {}, B.label), h("h2.display-2", {}, B.title.replace(/\.$/, "")))),
  h("div.controls", {},
    tabs(B.sortLabel, B.sort, sort, (v) => { sort = v; board(true); }),
    tabs(B.filterLabel, B.filter, filter, (v) => { filter = v; board(true); })
  ),
  h("div.card", {}, tableHost),
  h("div.split.split--even", {},
    h("div.card", {}, h("div.card__head", {}, h("h2", {}, B.waiting)), waitHost),
    h("div.card", {}, h("div.card__head", {}, h("h2", {}, B.trades), h("span.label", {}, B.live)), feedHost)
  ),
  h("p.footnote", {}, B.footnote)
)));

/* ------------------------------------------------------------ markets */

load(marketsHost, () => api.getMarkets(), (markets) => {
  marketsHost.append(...markets.map((m) => {
    const t = tone(m.change24hPct);
    return h("article.card.mcard", {},
      h("span.mcard__sym", {}, m.display),
      h("span.mcard__price", {}, price(m.price)),
      h("span.mcard__name", {}, m.name),
      h("span.mcard__chg", { class: t }, pct(m.change24hPct, 2)),
      h("div.mcard__spark", {}, sparkline(m.samples.map((s) => s.price), { width: 300, height: 60, tone: t, label: `${m.display} last 24 hours` }))
    );
  }));
}, { skeleton: () => skeletonRows(3, "skeleton--card") });

/* ------------------------------------------------------------ ranked table */

let rows = new Map(); // slug -> tr, kept so a re sort can animate rows into place

function row(a, i) {
  const ret = h("td.r.num", { class: tone(a.metrics.returnPct) });
  const tr = h("tr.is-link", { tabindex: "0", "aria-label": fill(B.rowLabel, { name: a.name }), dataset: { slug: a.slug } },
    h("td.rank", {}, String(i + 1).padStart(2, "0")),
    h("td", {}, h("div.agent-cell", {}, h("b", {}, truncate(a.name)), a.kind === "ai" ? h("span.state.state--ai", {}, L.ai) : null)),
    ret,
    h("td.r.num", { class: a.metrics.maxDrawdownPct > 0.05 ? "down" : "" }, drawdown(a.metrics.maxDrawdownPct)),
    h("td.r.num", {}, pctPlain(a.metrics.winRatePct)),
    h("td.r.num", {}, integer(a.metrics.trades))
  );
  countWhenVisible(ret, a.metrics.returnPct, (v) => pct(v));
  const go = () => { location.href = "/agent?slug=" + encodeURIComponent(a.slug); };
  tr.addEventListener("click", go);
  tr.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  return tr;
}

function table(ranked, animate) {
  const C = B.cols;
  // FLIP: remember where each row was, render, then slide from there
  const before = new Map();
  if (animate && !reduceMotion) rows.forEach((tr, slug) => before.set(slug, tr.getBoundingClientRect().top));
  const tbody = h("tbody");
  rows = new Map();
  ranked.forEach((a, i) => { const tr = row(a, i); rows.set(a.slug, tr); tbody.append(tr); });
  tableHost.replaceChildren(h("table.table", {},
    h("thead", {}, h("tr", {},
      h("th", { scope: "col" }, C.rank), h("th", { scope: "col" }, C.agent), h("th.r", { scope: "col" }, C.ret),
      h("th.r", { scope: "col" }, C.dd), h("th.r", { scope: "col" }, C.win), h("th.r", { scope: "col" }, C.trades))),
    tbody));
  if (!before.size) return;
  rows.forEach((tr, slug) => {
    const was = before.get(slug);
    const dy = was === undefined ? 0 : was - tr.getBoundingClientRect().top;
    if (was === undefined) tr.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400 });
    else if (dy) tr.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 600, easing: "cubic-bezier(.22, 1, .36, 1)" });
  });
}

function waiting(list) {
  if (!list.length) { waitHost.replaceChildren(h("p.empty-line", {}, B.waitingEmpty)); return; }
  waitHost.replaceChildren(h("ul.waitlist", {}, list.map((w) => h("li", {},
    h("a", { href: "/agent?slug=" + encodeURIComponent(w.slug) }, truncate(w.name), w.kind === "ai" ? h("span.state.state--ai", {}, L.ai) : null),
    h("span.state", { class: w.state === "starting" ? "state--running" : "state--idle" }, L.waiting[w.state] || w.state)
  ))));
}

function board(animate) {
  const fetch = () => api.getLeaderboard({ sort, filter });
  if (animate && rows.size) {
    // keep the table in place while sorting, so the rows can move
    fetch().then((data) => {
      if (!data.ranked.length) tableHost.replaceChildren(emptyState({ title: B.empty, body: B.emptyBody, plain: true, action: btn(B.openForge, { href: "/forge" }) }));
      else table(data.ranked, true);
      waiting(data.waiting);
    }).catch(() => board(false));
    return;
  }
  load(tableHost, fetch, (data) => {
    if (!data.ranked.length) tableHost.append(emptyState({ title: B.empty, body: B.emptyBody, plain: true, action: btn(B.openForge, { href: "/forge" }) }));
    else table(data.ranked, false);
    waiting(data.waiting);
  }, { errorOpts: { plain: true } });
}
board(false);
waitHost.append(...skeletonRows(3));

/* ------------------------------------------------------------ latest trades */

function tradeRow(t, fresh) {
  return h("li", { class: fresh ? "is-new" : "" },
    h("span.state", { class: t.side === "buy" ? "state--buy" : "state--sell" }, L.action[t.side]),
    h("span.num", {}, (config.assets.find((a) => a.symbol === t.asset) || { display: t.asset }).display),
    h("span.feed__agent", {}, h("a", { href: "/agent?slug=" + encodeURIComponent(t.agent.slug) }, truncate(t.agent.name)), " ", h("span.num", {}, price(t.price))),
    h("span.feed__time", { "data-ts": t.ts }, ago(t.ts))
  );
}

load(feedHost, () => api.getLatestTrades(), (trades) => {
  if (!trades.length) { feedHost.append(h("p.empty-line", {}, B.tradesEmpty)); return; }
  const list = h("ul.feed", {}, trades.slice(0, 8).map((t) => tradeRow(t, false)));
  feedHost.append(list);
  // relative times stay fresh
  setInterval(() => list.querySelectorAll("[data-ts]").forEach((el) => { el.textContent = ago(el.dataset.ts); }), 30000);
  if (config.mockMode) {
    setInterval(() => {
      if (document.hidden) return;
      list.prepend(tradeRow(mockLiveTrade(), true));
      while (list.children.length > 8) list.lastChild.remove();
    }, 8000);
  }
}, { errorOpts: { plain: true } });
