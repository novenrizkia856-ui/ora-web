// Sparkline and equity chart. Plain SVG, no library. Colors come from css/ora-app.css.
import { usd, date, time } from "./format.js";

const NS = "http://www.w3.org/2000/svg";
const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function svg(tag, attrs = {}) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function scale(values, w, h, pad = 2) {
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  return values.map((v, i) => [
    pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2),
    pad + (1 - (v - min) / span) * (h - pad * 2)
  ]);
}

/** Smooth path through points (Catmull Rom to Bezier). */
export function smoothPath(pts, tension = 0.5) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension * 2, c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension * 2;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension * 2, c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension * 2;
    d += `C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
}

/**
 * Sparkline that draws itself the first time it is visible.
 * tone: "up" | "down" | "flat" picks the stroke color.
 */
export function sparkline(values, { width = 120, height = 36, tone = "flat", label = "", draw = true } = {}) {
  const root = svg("svg", { viewBox: `0 0 ${width} ${height}`, class: "spark spark--" + tone, preserveAspectRatio: "none", role: label ? "img" : "presentation" });
  if (label) root.setAttribute("aria-label", label); else root.setAttribute("aria-hidden", "true");
  if (!values || values.length < 2) return root;
  const pts = scale(values, width, height, 3);
  const id = "sg" + Math.random().toString(36).slice(2, 8);
  const defs = svg("defs");
  const grad = svg("linearGradient", { id, x1: "0", y1: "0", x2: "0", y2: "1" });
  grad.append(svg("stop", { offset: "0", class: "spark__stop-a" }), svg("stop", { offset: "1", class: "spark__stop-b" }));
  defs.append(grad);
  const line = smoothPath(pts);
  const area = svg("path", { d: `${line}L${pts[pts.length - 1][0]} ${height}L${pts[0][0]} ${height}Z`, fill: `url(#${id})`, class: "spark__area" });
  const path = svg("path", { d: line, class: "spark__line", pathLength: "1", "vector-effect": "non-scaling-stroke" });
  root.append(defs, area, path);
  if (!draw || reduce() || !("IntersectionObserver" in window)) { root.classList.add("is-drawn"); return root; }
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    requestAnimationFrame(() => root.classList.add("is-drawn"));
  }, { threshold: 0.3 });
  io.observe(root);
  return root;
}

/**
 * Equity chart: ink line, soft area, hover crosshair with tooltip, draws on load.
 * Re renders on resize. Returns { destroy }.
 */
export function equityChart(container, series, { label = "" } = {}) {
  container.classList.add("eq");
  const values = series.map((p) => p.equity);
  const tip = document.createElement("div");
  tip.className = "eq__tip";
  tip.setAttribute("aria-hidden", "true");
  const live = document.createElement("div");
  live.className = "sr-only";
  live.setAttribute("aria-live", "polite");
  let first = true;
  let idx = values.length - 1;
  let geom = null;

  function render() {
    const w = Math.max(280, container.clientWidth);
    const h = Math.max(220, Math.min(360, Math.round(w * 0.42)));
    const padL = 8, padR = 64, padT = 20, padB = 32;
    const min = Math.min(...values), max = Math.max(...values);
    const span = (max - min) || max * 0.01 || 1;
    const lo = min - span * 0.12, hi = max + span * 0.12;
    const x = (i) => padL + (i / Math.max(1, values.length - 1)) * (w - padL - padR);
    const y = (v) => padT + (1 - (v - lo) / (hi - lo)) * (h - padT - padB);
    const pts = values.map((v, i) => [x(i), y(v)]);
    geom = { x, y, pts, w, h, padT, padB };

    const root = svg("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: "eq__svg", role: "img", "aria-label": label });
    const gid = "eqg" + Math.random().toString(36).slice(2, 8);
    const defs = svg("defs");
    const areaGrad = svg("linearGradient", { id: gid + "a", x1: "0", y1: "0", x2: "0", y2: "1" });
    areaGrad.append(svg("stop", { offset: "0", "stop-color": "#000", "stop-opacity": "0.08" }), svg("stop", { offset: "1", "stop-color": "#000", "stop-opacity": "0" }));
    defs.append(areaGrad);
    root.append(defs);

    // grid and value labels
    const grid = svg("g", { class: "eq__grid" });
    for (let k = 0; k <= 3; k++) {
      const v = lo + ((hi - lo) * k) / 3;
      const gy = y(v);
      grid.append(svg("line", { x1: padL, x2: w - padR + 8, y1: gy, y2: gy }));
      const t = svg("text", { x: w - padR + 14, y: gy + 4, class: "eq__label" });
      t.textContent = usd(v, 0);
      grid.append(t);
    }
    // time labels
    [0, Math.floor((values.length - 1) / 2), values.length - 1].forEach((i, n) => {
      const t = svg("text", { x: x(i), y: h - 10, class: "eq__label", "text-anchor": n === 0 ? "start" : n === 2 ? "end" : "middle" });
      t.textContent = time(series[i].ts);
      grid.append(t);
    });
    root.append(grid);

    const d = smoothPath(pts, 0.4);
    const area = svg("path", { d: `${d}L${pts[pts.length - 1][0]} ${h - padB}L${pts[0][0]} ${h - padB}Z`, fill: `url(#${gid}a)`, class: "eq__area" });
    const line = svg("path", { d, class: "eq__line", pathLength: "1" });
    const cross = svg("g", { class: "eq__cross" });
    const vline = svg("line", { y1: padT, y2: h - padB });
    const dot = svg("circle", { r: "4.5" });
    const halo = svg("circle", { r: "11", class: "eq__halo" });
    cross.append(vline, halo, dot);
    root.append(area, line, cross);

    container.replaceChildren(root, tip, live);
    if (first && !reduce()) {
      first = false;
      root.classList.add("is-drawing");
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("is-drawn")));
    } else root.classList.add("is-drawn");
    setIndex(idx, false);
  }

  function setIndex(i, announce = true) {
    if (!geom) return;
    idx = Math.max(0, Math.min(values.length - 1, i));
    const [px, py] = geom.pts[idx];
    const cross = container.querySelector(".eq__cross");
    if (!cross) return;
    cross.querySelector("line").setAttribute("x1", px);
    cross.querySelector("line").setAttribute("x2", px);
    cross.querySelectorAll("circle").forEach((c) => { c.setAttribute("cx", px); c.setAttribute("cy", py); });
    const text = `${usd(values[idx])}`;
    const when = `${date(series[idx].ts)} ${time(series[idx].ts)}`;
    tip.innerHTML = `<b>${text}</b><span>${when}</span>`;
    const tw = 150;
    const left = Math.min(Math.max(px - tw / 2, 0), geom.w - tw);
    tip.style.transform = `translate(${left.toFixed(1)}px, ${Math.max(0, py - 64).toFixed(1)}px)`;
    if (announce) live.textContent = `${text}, ${when}`;
  }

  function onMove(e) {
    if (!geom) return;
    const r = container.getBoundingClientRect();
    const px = e.clientX - r.left;
    let best = 0, bd = Infinity;
    geom.pts.forEach(([x], i) => { const dd = Math.abs(x - px); if (dd < bd) { bd = dd; best = i; } });
    container.classList.add("is-hover");
    setIndex(best, false);
  }
  function onLeave() { container.classList.remove("is-hover"); setIndex(values.length - 1, false); }
  function onKey(e) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      container.classList.add("is-hover");
      setIndex(idx + (e.key === "ArrowRight" ? 1 : -1));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      setIndex(e.key === "Home" ? 0 : values.length - 1);
    }
  }

  container.tabIndex = 0;
  container.addEventListener("pointermove", onMove);
  container.addEventListener("pointerleave", onLeave);
  container.addEventListener("keydown", onKey);
  container.addEventListener("blur", onLeave);
  let raf = 0;
  let lastW = container.clientWidth;
  const ro = new ResizeObserver(() => {
    if (container.clientWidth === lastW) return;
    lastW = container.clientWidth;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(render);
  });
  ro.observe(container);
  render();
  return { destroy() { ro.disconnect(); container.replaceChildren(); } };
}
