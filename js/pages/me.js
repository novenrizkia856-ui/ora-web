// My agents: everything the connected wallet runs. Without a wallet it shows
// a centered prompt to connect.
import { boot, config, copy, $, h, fill, btn, pageHero, load, emptyState, skeletonRows, refreshNav, toast, countWhenVisible } from "../app.js";
import { api } from "../api.js";
import { wallet, openWalletModal } from "../wallet.js";
import { sparkline } from "../charts.js";
import { pct, integer, tone, truncate, shortAddr } from "../format.js";

boot({ page: "me" });
const M = copy.me;
const L = copy.labels;
const main = $("[data-page]");
const statusState = { running: "state--running", paused: "state--paused", created: "state--idle" };

const heroHost = h("div");
const body = h("div.container");
main.append(heroHost, h("section.page", {}, body));

function hero() {
  const lede = wallet.state === "connected" ? shortAddr(wallet.address) + ". " + M.sub : M.sub;
  heroHost.replaceChildren(pageHero({ label: M.label, title: M.title, lede, art: "step-hands.avif" }));
  refreshNav();
}

function gate() {
  body.replaceChildren(emptyState({
    title: M.gate, body: M.gateSub, mark: "01", center: true,
    action: btn(copy.wallet.connect, { onclick: () => openWalletModal() })
  }));
}

function agentCard(a, refresh) {
  const values = a.equitySeries.map((p) => p.equity);
  const running = a.status === "running";
  const toggle = btn(running ? M.pause : M.start, {
    variant: "outline", arrow: false,
    onclick: async () => {
      toggle.disabled = true;
      try {
        if (running) { await api.pauseAgent(a.slug); toast(copy.agent.paused); }
        else { await api.startAgent(a.slug); toast(copy.agent.started); }
        refresh();
      } catch (err) {
        toast(err && err.code === "limit" ? copy.agent.limit : copy.common.errorTitle, { error: true });
        toggle.disabled = false;
      }
    }
  });
  return h("article.card.acard", {},
    h("div.acard__top", {},
      h("h3.acard__name", { title: a.name }, truncate(a.name)),
      h("span.state", { class: statusState[a.status] }, L.status[a.status])),
    h("div.badges", {}, a.kind === "ai" ? h("span.state.state--ai", {}, L.ai) : h("span.state.state--idle", {}, L.kind.rule)),
    h("p.acard__ret", { class: tone(a.metrics.returnPct) }, pct(a.metrics.returnPct)),
    h("div.acard__spark", {}, values.length > 1 ? sparkline(values, { width: 300, height: 48, tone: tone(a.metrics.returnPct) }) : null),
    h("div.acard__actions", {}, toggle, btn(M.open, { href: "/agent?slug=" + encodeURIComponent(a.slug) }))
  );
}

function render() {
  hero();
  if (wallet.state !== "connected") { gate(); return; }
  load(body, () => api.getMe(), (me) => {
    const agents = me.agents || [];
    const running = agents.filter((a) => a.status === "running").length;
    const best = agents.reduce((m, a) => (a.metrics.trades ? Math.max(m, a.metrics.returnPct) : m), -Infinity);
    const vals = [h("p.stat__value"), h("p.stat__value"), h("p.stat__value", { class: Number.isFinite(best) ? tone(best) : "" })];
    countWhenVisible(vals[0], agents.length, (v) => integer(Math.round(v)));
    countWhenVisible(vals[1], running, (v) => integer(Math.round(v)));
    if (Number.isFinite(best)) countWhenVisible(vals[2], best, (v) => pct(v)); else vals[2].textContent = copy.common.na;

    const A = config.agents;
    const limit = me.premium ? A.maxRunningPremium : A.maxRunningPerWallet;
    const limitText = fill(limit === 1 ? M.limitOne : M.limitMany, { n: limit });
    const premiumText = me.premium ? "" : " " + fill(M.premium, { threshold: integer(config.token.premiumThreshold), premium: A.maxRunningPremium });

    const newCard = h("a.card.card--dashed.acard.acard--new", { href: "/forge" },
      h("span.plus", { "aria-hidden": "true" }, "+"), h("h3", {}, M.newTitle), h("p", {}, M.newBody));
    body.append(
      h("div.stats.stats--3", {},
        h("div.stat", {}, vals[0], h("p.stat__label", {}, M.counts.agents)),
        h("div.stat", {}, vals[1], h("p.stat__label", {}, M.counts.running)),
        h("div.stat", {}, vals[2], h("p.stat__label", {}, M.counts.best))),
      agents.length ? null : emptyState({ title: M.empty, body: M.emptyBody, plain: true }),
      h("div.agent-cards", {}, agents.map((a) => agentCard(a, render)), newCard),
      h("p.limit-note", {}, limitText + premiumText)
    );
  }, { skeleton: () => skeletonRows(3, "skeleton--card") });
}

render();
window.addEventListener("wallet:change", () => { if (wallet.state !== "connecting") render(); });
