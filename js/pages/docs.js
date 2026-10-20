// Docs, in the RELL docs layout: dark hero, a sticky contents list, and one white
// card per section. Text comes from copy.js; the calls and the prompt sit in code blocks.
import { boot, config, copy, $, $$, h, fill, btn, bindCopy, refreshNav } from "../app.js";
import { integer } from "../format.js";

boot({ page: "docs" });
const D = copy.docs;
const A = config.agents;
const main = $("[data-page]");
main.classList.remove("app-main");

const base = (String(config.api.publicBaseUrl || "").trim() || location.origin).replace(/\/+$/, "");
const CURL = [
  `curl ${base}/api/v1/agent -H "Authorization: Bearer ora_YOUR_KEY"`,
  `curl "${base}/api/v1/market?hours=24" -H "Authorization: Bearer ora_YOUR_KEY"`,
  `curl -X POST ${base}/api/v1/decisions -H "Authorization: Bearer ora_YOUR_KEY" -H "Content-Type: application/json" -d '{"decisions":[{"asset":"TSLA","action":"buy","reason":"Trend is up"}]}'`
].join("\n");
const PROMPT = [
  `Every ${A.cycleMinutes} minutes, manage my Ora agent.`,
  "1. Read my agent and the market.",
  "2. Decide buy, sell or hold for each asset.",
  "3. Send one decision per asset with a short market reason.",
  "Never include keys, paths or wallet addresses in a reason."
].join("\n");
const vars = {
  m: A.cycleMinutes,
  base: A.maxRunningPerWallet,
  threshold: integer(config.token.premiumThreshold),
  premium: A.maxRunningPremium
};

function codeBlock(text, copyLabel) {
  const b = btn(copyLabel, { variant: "outline", arrow: false });
  bindCopy(b, text);
  return h("div.code-block", {}, h("div.code-block__bar", {}, h("span"), b), h("pre.doc-pre", {}, h("code", {}, text)));
}

function faq(items) {
  return h("div.faq", {}, items.map(([q, a], i) => {
    const id = "faq-a-" + i;
    const answer = h("div.faq__a", { id, role: "region" }, h("p", {}, fill(a, vars)));
    const button = h("button.faq__q", { type: "button", "aria-expanded": "false", "aria-controls": id }, fill(q, vars), h("span.faq__icon", { "aria-hidden": "true" }));
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      answer.style.height = open ? answer.scrollHeight + "px" : "0px";
    });
    return h("div.faq__item", {}, button, answer);
  }));
}

function block(b) {
  if (b.p) return h("p", {}, fill(b.p, vars));
  if (b.list) return h("ul.doc-list", {}, b.list.map((t) => h("li", {}, fill(t, vars))));
  if (b.dl) return h("div.doc-table", {}, h("table", {}, h("tbody", {}, b.dl.map(([k, v]) => h("tr", {}, h("td", {}, k), h("td", {}, fill(v, vars)))))));
  if (b.code === "curl") return codeBlock(CURL, D.copyCode);
  if (b.code === "prompt") return codeBlock(PROMPT, D.copyPrompt);
  if (b.faq) return faq(b.faq);
  return null;
}

const hero = h("section.docs-hero", { "data-nav-dark": "" },
  h("div.docs-hero__art", { "aria-hidden": "true" }, h("img", { src: "/assets/img/step-compass.avif", alt: "" })),
  h("div.docs-hero__inner", {}, h("p.label", {}, D.label), h("h1.display-1", {}, D.title), h("p.lede", {}, D.sub)));

const side = h("details.docs-side", { open: true },
  h("summary.docs-side__label", {}, D.index),
  h("ol.docs-side__list", {}, D.sections.map((s) => h("li", {}, h("a", { href: "#" + s.id, "data-doc-link": "" }, s.title)))));

const docs = h("div.docs-main", {}, D.sections.map((s) =>
  h("section.doc", { id: s.id, "aria-labelledby": s.id + "-title" },
    h("h2.doc__title", { id: s.id + "-title" }, s.title),
    s.blocks.map(block))));

main.append(hero, h("div.docs-shell", {}, side, docs));
refreshNav();

// close the contents list on phones after a pick, and mark the section in view
const phone = window.matchMedia("(max-width: 959px)");
if (phone.matches) side.open = false;
$$("[data-doc-link]", side).forEach((a) => a.addEventListener("click", () => { if (phone.matches) side.open = false; }));
const links = new Map($$("[data-doc-link]", side).map((a) => [a.getAttribute("href").slice(1), a]));
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    links.forEach((a) => a.classList.remove("is-current"));
    const a = links.get(e.target.id);
    if (a) a.classList.add("is-current");
  });
}, { rootMargin: "-30% 0px -60% 0px" });
$$(".doc", docs).forEach((s) => io.observe(s));
if (location.hash) requestAnimationFrame(() => { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); });
