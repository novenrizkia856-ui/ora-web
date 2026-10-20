// Forge: the agent builder. Form on the left, a live review card on the right
// with a small preview of the strategy on a sample price path.
import { boot, config, copy, $, $$, h, fill, btn, setBtnText, pageHero, openModal, toast, refreshNav } from "../app.js";
import { api } from "../api.js";
import { wallet } from "../wallet.js";
import { rng } from "../mock-data.js";
import { usd, pctPlain, truncate } from "../format.js";

boot({ page: "forge" });
const F = copy.forge;
const L = copy.labels;
const A = config.agents;
const main = $("[data-page]");

/* ------------------------------------------------------------ state */

const firstPreset = A.presets[1] || A.presets[0];
const state = {
  name: "",
  preset: firstPreset.id,
  threshold: firstPreset.thresholdPct ?? 2,
  risk: "moderate",
  capital: 10000,
  maxPos: 2500,
  maxPosTouched: false,
  stopLoss: 5,
  assets: new Set([config.assets[0].symbol])
};
const preset = () => A.presets.find((p) => p.id === state.preset);
const isAI = () => preset().strategy === null;
const errors = {};

/* ------------------------------------------------------------ controls */

/** Radio group drawn as the template's segmented buttons, with arrow key support. */
function segmented(name, options, value, onChange) {
  const group = h("div.seg", { role: "radiogroup", "aria-label": name });
  const buttons = options.map((o) => h("button", {
    type: "button", role: "radio", "aria-checked": String(o.value === value), tabindex: o.value === value ? "0" : "-1",
    onclick: () => select(o.value)
  }, o.label));
  function select(v, focus) {
    buttons.forEach((b, i) => {
      const on = options[i].value === v;
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    onChange(v);
  }
  group.addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const i = buttons.indexOf(document.activeElement);
    const n = (i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
    select(options[n].value, true);
  });
  group.append(...buttons);
  group.select = select;
  return group;
}

function slider({ id, min, max, step, value, fmt, onInput }) {
  const input = h("input", { type: "range", id, min, max, step, value });
  const out = h("output", { for: id }, fmt(value));
  const paint = () => {
    const v = Number(input.value);
    input.style.setProperty("--p", ((v - min) / (max - min)) * 100 + "%");
    out.textContent = fmt(v);
    input.setAttribute("aria-valuetext", fmt(v));
  };
  input.addEventListener("input", () => { paint(); onInput(Number(input.value)); });
  paint();
  const wrap = h("div.slider", {}, input, out);
  wrap.set = (v) => { input.value = v; paint(); };
  return wrap;
}

function field({ label, hint, forId, control, errorKey }) {
  return h("div.field", {},
    h("label.field__label", { for: forId }, h("span", {}, label), hint ? h("span.field__hint", {}, hint) : null),
    control,
    errorKey ? h("p.field__error", { id: "err-" + errorKey, "data-error": errorKey, role: "alert" }) : null
  );
}
// segmented and toggle groups are not single inputs, so their label is a heading
function group({ label, hint, control, errorKey }) {
  const id = "lbl-" + Math.random().toString(36).slice(2, 7);
  control.setAttribute("aria-labelledby", id);
  return h("div.field", {},
    h("div.field__label", {}, h("span", { id }, label), hint ? h("span.field__hint", {}, hint) : null),
    control,
    errorKey ? h("p.field__error", { "data-error": errorKey, role: "alert" }) : null
  );
}

/* ------------------------------------------------------------ build the page */

main.append(pageHero({ label: F.label, title: F.title, lede: F.sub, art: "step-compass.avif" }));
refreshNav();

const nameInput = h("input.input", { id: "f-name", type: "text", maxlength: "24", autocomplete: "off", spellcheck: "false", placeholder: F.namePlaceholder, "aria-describedby": "err-name" });
const thresholdSlider = slider({ id: "f-threshold", min: 0.25, max: 6, step: 0.25, value: state.threshold, fmt: (v) => pctPlain(v, 2), onInput: (v) => { state.threshold = v; update(); } });
const thresholdField = field({ label: F.threshold, hint: F.thresholdHint, forId: "f-threshold", control: thresholdSlider });
const capitalInput = h("input.input", { id: "f-capital", type: "number", inputmode: "numeric", min: "100", max: "1000000", step: "100", value: state.capital, "aria-describedby": "err-capital" });
const maxPosInput = h("input.input", { id: "f-maxpos", type: "number", inputmode: "numeric", min: "1", step: "50", value: state.maxPos, "aria-describedby": "err-maxpos" });
const stopSlider = slider({ id: "f-stop", min: 1, max: 20, step: 1, value: state.stopLoss, fmt: (v) => pctPlain(v, 0), onInput: (v) => { state.stopLoss = v; update(); } });

const presetSeg = segmented(F.preset, A.presets.map((p) => ({ value: p.id, label: p.label })), state.preset, (v) => {
  state.preset = v;
  const p = preset();
  if (p.thresholdPct !== null && p.thresholdPct !== undefined) { state.threshold = p.thresholdPct; thresholdSlider.set(p.thresholdPct); }
  thresholdField.hidden = isAI();
  update();
});
const riskSeg = segmented(F.risk, A.risk.map((r) => ({ value: r, label: L.risk[r] })), state.risk, (v) => { state.risk = v; update(); });

const assetToggles = h("div.toggles", { role: "group" }, config.assets.map((a) => {
  const b = h("button.toggle", { type: "button", "aria-pressed": String(state.assets.has(a.symbol)) }, a.display, h("small", {}, a.name));
  b.addEventListener("click", () => {
    if (state.assets.has(a.symbol)) state.assets.delete(a.symbol);
    else if (state.assets.size < A.maxAssets) state.assets.add(a.symbol);
    else { errors.assets = fill(F.errors.assetsMax, { max: A.maxAssets }); paintErrors(); return; }
    b.setAttribute("aria-pressed", String(state.assets.has(a.symbol)));
    update(true);
  });
  return b;
}));

const createBtn = btn(F.create, { type: "submit", cls: "btn--lg btn--block" });
const form = h("form.form", { novalidate: true },
  field({ label: F.name, hint: F.nameHint, forId: "f-name", control: nameInput, errorKey: "name" }),
  group({ label: F.preset, hint: F.presetHint, control: presetSeg }),
  thresholdField,
  group({ label: F.risk, hint: F.riskHint, control: riskSeg }),
  h("div.field-row", {},
    field({ label: F.capital, hint: F.capitalHint, forId: "f-capital", control: h("div.input-affix", {}, h("span", { "aria-hidden": "true" }, "$"), capitalInput), errorKey: "capital" }),
    field({ label: F.maxPosition, hint: F.maxPositionHint, forId: "f-maxpos", control: h("div.input-affix", {}, h("span", { "aria-hidden": "true" }, "$"), maxPosInput), errorKey: "maxpos" })
  ),
  field({ label: F.stopLoss, hint: F.stopLossHint, forId: "f-stop", control: stopSlider }),
  group({ label: F.assets, hint: fill(F.assetsHint, { max: A.maxAssets }), control: assetToggles, errorKey: "assets" }),
  h("div.forge__submit", {}, createBtn, h("p.forge__note", {}, F.note))
);

// review card
const rName = h("p.review__name");
const rBadges = h("div.badges");
const rList = h("ul.review__list");
const rChart = h("div.review__chart", { "aria-hidden": "true" });
const review = h("aside.card.card--night.forge__review", { "aria-label": F.review },
  h("div.card__head", {}, h("h2", {}, F.review), h("span.label", {}, F.reviewLive)),
  h("div.card__body.review", {}, rName, rBadges, rChart, rList)
);

main.append(h("section.page", {}, h("div.container", {},
  h("div.forge", {},
    h("div.card", {}, h("div.card__head", {}, h("h2", {}, F.form)), h("div.card__body", {}, form)),
    review
  )
)));

/* ------------------------------------------------------------ validation */

function validate() {
  for (const k of Object.keys(errors)) delete errors[k];
  const name = state.name.trim();
  if (name.length < 3 || name.length > 24) errors.name = F.errors.nameLength;
  else if (!/^[A-Za-z0-9 ]+$/.test(name)) errors.name = F.errors.nameChars;
  if (!(state.capital >= 100)) errors.capital = F.errors.capitalLow;
  else if (state.capital > 1000000) errors.capital = F.errors.capitalHigh;
  if (!(state.maxPos > 0)) errors.maxpos = F.errors.maxPosLow;
  else if (state.maxPos > state.capital) errors.maxpos = F.errors.maxPosHigh;
  if (state.assets.size < 1) errors.assets = F.errors.assetsMin;
  return Object.keys(errors).length === 0;
}

const touched = new Set();
function paintErrors(all = false) {
  $$("[data-error]", form).forEach((el) => {
    const k = el.dataset.error;
    el.textContent = all || touched.has(k) ? errors[k] || "" : "";
  });
  [[nameInput, "name"], [capitalInput, "capital"], [maxPosInput, "maxpos"]].forEach(([input, k]) => {
    input.setAttribute("aria-invalid", String(Boolean((all || touched.has(k)) && errors[k])));
  });
}

nameInput.addEventListener("input", () => { state.name = nameInput.value; update(); });
nameInput.addEventListener("blur", () => { touched.add("name"); validate(); paintErrors(); });
capitalInput.addEventListener("input", () => {
  state.capital = Number(capitalInput.value);
  if (!state.maxPosTouched && state.capital > 0) { state.maxPos = Math.round(state.capital * 0.25); maxPosInput.value = state.maxPos; }
  touched.add("capital"); update();
});
maxPosInput.addEventListener("input", () => { state.maxPos = Number(maxPosInput.value); state.maxPosTouched = true; touched.add("maxpos"); update(); });

/* ------------------------------------------------------------ review */

function summary() {
  const S = F.summary;
  const names = config.assets.filter((a) => state.assets.has(a.symbol)).map((a) => a.display);
  const assets = names.length ? names.join(names.length > 2 ? ", " : " and ").replace(/, ([^,]*)$/, " and $1") : S.noAssets;
  const t = pctPlain(state.threshold, 2);
  const lines = [fill(S.trades, { name: truncate(state.name.trim() || F.untitled), assets })];
  const p = preset();
  if (isAI()) lines.push(S.aiDecides, S.aiSilent);
  else if (p.strategy === "mean_reversion") lines.push(fill(S.reversionBuy, { t }), fill(S.reversionSell, { t }));
  else lines.push(fill(S.momentumBuy, { t }), fill(S.momentumSell, { t }));
  lines.push(
    fill(S.capital, { capital: usd(state.capital || 0, 0) }),
    fill(S.maxPos, { maxPos: usd(state.maxPos || 0, 0) }),
    fill(S.stopLoss, { sl: pctPlain(state.stopLoss, 0) }),
    fill(S.cycle, { m: A.cycleMinutes }),
    fill(S.risk, { risk: L.risk[state.risk].toLowerCase() })
  );
  return lines;
}

// a fixed sample path; the threshold line and the signals move with the settings
const path = (() => { const r = rng(9091); const v = [100]; for (let i = 1; i < 60; i++) v.push(v[i - 1] * (1 + (r() - 0.49) * 0.02)); return v; })();
const NS = "http://www.w3.org/2000/svg";
const sv = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.append(e); return e; };

function signals() {
  const p = preset();
  const marks = [];
  let open = false;
  if (isAI()) {
    for (let i = 7; i < path.length - 3; i += 11) { marks.push({ i, side: open ? "sell" : "buy" }); open = !open; }
    return marks;
  }
  const t = state.threshold;
  for (let i = 8; i < path.length; i++) {
    if (p.strategy === "mean_reversion") {
      const avg = path.slice(i - 8, i).reduce((a, b) => a + b, 0) / 8;
      const gap = (path[i] / avg - 1) * 100;
      if (!open && gap < -t) { marks.push({ i, side: "buy" }); open = true; }
      else if (open && gap > t * 0.4) { marks.push({ i, side: "sell" }); open = false; }
    } else {
      const ch = (path[i] / path[i - 5] - 1) * 100;
      if (!open && ch > t) { marks.push({ i, side: "buy" }); open = true; }
      else if (open && ch < -t) { marks.push({ i, side: "sell" }); open = false; }
    }
  }
  return marks;
}

function drawPreview() {
  const w = Math.max(1, rChart.clientWidth), hh = Math.max(1, rChart.clientHeight);
  const min = Math.min(...path), max = Math.max(...path), span = max - min;
  const pts = path.map((v, i) => [10 + (i / (path.length - 1)) * (w - 20), 14 + (1 - (v - min) / span) * (hh - 34)]);
  const svg = sv("svg", { viewBox: `0 0 ${w} ${hh}`, preserveAspectRatio: "none" });
  sv("path", { d: pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(""), class: "rc-line" }, svg);
  if (!isAI()) {
    // the threshold line sits above the mid price by the chosen move, scaled to the path
    const y = 14 + (1 - Math.min(1, (state.threshold / 6))) * (hh - 34);
    sv("line", { x1: 0, x2: w, y1: y, y2: y, class: "rc-th" }, svg);
  }
  signals().slice(0, 8).forEach((m) => {
    const [x, y] = pts[m.i];
    sv("circle", { cx: x, cy: y, r: 4, class: m.side === "buy" ? "rc-dot" : "rc-ring" }, svg);
    const t = sv("text", { x, y: m.side === "buy" ? y + 16 : y - 9, "text-anchor": "middle", class: "rc-tag" }, svg);
    t.textContent = m.side === "buy" ? "BUY" : "SELL";
  });
  rChart.replaceChildren(svg);
}

function update(assetsChanged) {
  validate();
  if (assetsChanged) touched.add("assets");
  paintErrors();
  rName.textContent = truncate(state.name.trim() || F.untitled);
  rBadges.replaceChildren(
    h("span.state", { class: isAI() ? "state--ai" : "state--idle" }, isAI() ? L.kind.ai : L.kind.rule),
    h("span.state.state--idle", {}, isAI() ? L.strategy.ai : L.strategy[preset().strategy]),
    h("span.state.state--idle", {}, L.risk[state.risk])
  );
  rList.replaceChildren(...summary().map((l) => h("li", {}, l)));
  drawPreview();
}
new ResizeObserver(() => drawPreview()).observe(rChart);
update();

/* ------------------------------------------------------------ create */

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  state.name = nameInput.value;
  if (!validate()) {
    ["name", "capital", "maxpos", "assets"].forEach((k) => touched.add(k));
    paintErrors(true);
    const first = form.querySelector('[aria-invalid="true"]') || form.querySelector(".field__error:not(:empty)");
    if (first) first.focus ? first.focus() : first.scrollIntoView({ block: "center" });
    return;
  }
  try { await wallet.require(); } catch { toast(F.needWallet); return; }

  createBtn.disabled = true;
  setBtnText(createBtn, F.creating);
  const p = preset();
  const payload = {
    name: state.name.trim(),
    kind: isAI() ? "ai" : "rule",
    preset: p.id,
    strategy: p.strategy,
    thresholdPct: isAI() ? null : state.threshold,
    riskLevel: state.risk,
    capitalUsd: state.capital,
    maxPositionUsd: state.maxPos,
    stopLossPct: state.stopLoss,
    assets: [...state.assets]
  };
  let agent;
  try {
    agent = await api.createAgent(payload);
  } catch (err) {
    toast(F.failed, { error: true });
    return;
  } finally {
    createBtn.disabled = false;
    setBtnText(createBtn, F.create);
  }

  const href = "/agent?slug=" + encodeURIComponent(agent.slug);
  const startBtn = btn(F.start, {
    onclick: async () => {
      startBtn.disabled = true;
      try {
        await api.startAgent(agent.slug);
        toast(F.started);
        location.href = href;
      } catch (err) {
        toast(err && err.code === "limit" ? copy.agent.limit : F.failed, { error: true });
        startBtn.disabled = false;
      }
    }
  });
  openModal({
    title: F.readyTitle,
    body: [h("p", {}, fill(F.readyBody, { name: agent.name }))],
    actions: [startBtn, btn(F.view, { href, variant: "outline" })]
  });
});
