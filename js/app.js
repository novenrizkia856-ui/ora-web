// Shared shell for the app pages, in the RELL app language (css/site.css):
// the floating bar, the mobile sheet, the footer, two part buttons, result states.
// Also the helpers every page uses: config guard, toast, modal with focus trap,
// copy, count up and the load pattern (skeleton, then data, empty or error).
import { copy } from "./copy.js";
import { wallet, openWalletModal } from "./wallet.js";
import { shortAddr } from "./format.js";

/* ------------------------------------------------------------ config guard */

if (!window.ORA_CONFIG) {
  const banner = document.createElement("div");
  banner.setAttribute("role", "alert");
  banner.style.cssText = "position:fixed;inset:16px 16px auto;z-index:200;padding:16px 20px;border-radius:8px;background:#000;color:#fff;font:500 14px/1.4 sans-serif";
  banner.textContent = copy.common.configMissing;
  document.body.appendChild(banner);
  throw new Error("ORA_CONFIG missing: load js/config.js first.");
}

export { copy };
export const config = window.ORA_CONFIG;
export const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------ small helpers */

export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

/** Fill {placeholders} in a copy string. */
export function fill(str, vars = {}) {
  return String(str).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** Tiny element builder: h("a.btn.btn--dark", { href: "/forge" }, "Open Forge"). */
export function h(tag, attrs = {}, ...children) {
  const [name, ...classes] = tag.split(".");
  const el = document.createElement(name || "div");
  if (classes.length) el.className = classes.join(" ");
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") el.className += (el.className ? " " : "") + v;
    else if (k === "html") el.innerHTML = v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "dataset") Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

const ICONS = {
  copy: '<rect x="5" y="5" width="9" height="9" rx="2"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"/>',
  check: '<path d="m3 8.5 3 3 7-7"/>',
  external: '<path d="M6 3H3.5A1.5 1.5 0 0 0 2 4.5v8A1.5 1.5 0 0 0 3.5 14h8a1.5 1.5 0 0 0 1.5-1.5V10M9 2h5v5M14 2 7 9"/>',
  close: '<path d="m3.5 3.5 9 9m0-9-9 9"/>',
  back: '<path d="M14 8H3M7.5 3.5 3 8l4.5 4.5"/>'
};
export function icon(name, cls = "icon") {
  return `<svg class="${cls}" viewBox="0 0 16 16" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}

/**
 * The template's two part button: a mono label block plus an arrow block.
 * variant: "dark" | "light" | "outline" | "danger". Pass href for a link.
 */
export function btn(text, { href, variant = "dark", arrow = variant === "dark" || variant === "light", onclick, cls = "", type = "button", label, disabled, target } = {}) {
  const el = h(href ? "a" : "button", {
    class: `btn btn--${variant === "danger" ? "outline btn--danger" : variant} ${cls}`.trim(),
    href, type: href ? null : type, onclick, "aria-label": label, disabled,
    target, rel: target ? "noopener noreferrer" : null
  }, h("span.btn__label", {}, text));
  if (arrow) el.append(h("span.btn__arrow", {}, h("span.arrow", { "aria-hidden": "true" })));
  return el;
}

export function setBtnText(el, text) {
  const l = el.querySelector(".btn__label");
  if (l) l.textContent = text; else el.textContent = text;
}

/* ------------------------------------------------------------ storage that never throws */

export const store = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* storage blocked */ } }
};

/* ------------------------------------------------------------ toast */

export function toast(message, { error = false, duration = 2600 } = {}) {
  let region = $(".toasts");
  if (!region) {
    region = h("div.toasts", { role: "status", "aria-live": "polite" });
    document.body.appendChild(region);
  }
  const t = h("div.toast", { class: error ? "is-error" : "" }, message);
  region.appendChild(t);
  while (region.children.length > 3) region.firstChild.remove();
  setTimeout(() => { t.classList.add("is-leaving"); setTimeout(() => t.remove(), 260); }, duration);
}

/* ------------------------------------------------------------ copy to clipboard */

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = h("textarea", { style: { position: "fixed", opacity: "0", top: "0", left: "0" }, "aria-hidden": "true" });
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

/** Wire a button that copies a value, shows the toast and resets after 1.6s. */
export function bindCopy(button, getText, { toastText } = {}) {
  const labelEl = button.querySelector(".btn__label") || button;
  const original = labelEl.textContent;
  let timer = null;
  button.addEventListener("click", async () => {
    const ok = await copyText(typeof getText === "function" ? getText() : getText);
    if (!ok) { toast(copy.common.copyFailed, { error: true }); return; }
    toast(toastText || copy.common.copied);
    button.classList.add("is-copied");
    labelEl.textContent = copy.common.copied;
    clearTimeout(timer);
    timer = setTimeout(() => { button.classList.remove("is-copied"); labelEl.textContent = original; }, 1600);
  });
}

/* ------------------------------------------------------------ modal with focus trap */

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export function trapFocus(container, event) {
  if (event.key !== "Tab") return;
  const items = $$(FOCUSABLE, container).filter((el) => el.offsetParent !== null || el === document.activeElement);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

let openModalCount = 0;
export function openModal({ title, body, actions = [], onClose } = {}) {
  const previous = document.activeElement;
  const titleId = "modal-title-" + Math.random().toString(36).slice(2, 8);
  const closeBtn = h("button.modal__close", { type: "button", "aria-label": copy.common.close, html: icon("close", "") });
  const panel = h("div.modal__panel", { role: "dialog", "aria-modal": "true", "aria-labelledby": titleId },
    h("div.modal__head", {}, h("h2", { id: titleId }, title), closeBtn),
    h("div.modal__body", {}, body || ""),
    actions.length ? h("div.modal__actions", {}, actions) : null
  );
  const scrim = h("div.modal__scrim");
  const root = h("div.modal", {}, scrim, panel);
  document.body.appendChild(root);
  openModalCount++;
  document.documentElement.style.overflow = "hidden";

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    root.classList.add("is-closing");
    document.removeEventListener("keydown", onKey, true);
    setTimeout(() => {
      root.remove();
      openModalCount--;
      if (!openModalCount && !$(".sheet:not([hidden])")) document.documentElement.style.overflow = "";
    }, reduceMotion ? 0 : 200);
    if (previous && previous.focus) previous.focus();
    if (onClose) onClose();
  }
  function onKey(e) {
    // stop here so a sheet or menu underneath does not close on the same key
    if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); close(); }
    else trapFocus(panel, e);
  }
  document.addEventListener("keydown", onKey, true);
  scrim.addEventListener("click", close);
  closeBtn.addEventListener("click", close);
  requestAnimationFrame(() => {
    const first = $$(FOCUSABLE, $(".modal__body", panel))[0] || $$(FOCUSABLE, panel).find((el) => el !== closeBtn) || closeBtn;
    first.focus();
  });
  return { close, panel, root };
}

/* ------------------------------------------------------------ count up */

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/** Animate a number into an element once. fmt turns the number into display text. */
export function countUp(el, to, fmt, duration = 800) {
  if (reduceMotion || typeof to !== "number" || !Number.isFinite(to)) { el.textContent = fmt(to); return; }
  const t0 = performance.now();
  const frame = (now) => {
    const p = easeOut(Math.min(1, (now - t0) / duration));
    el.textContent = fmt(to * p);
    if (p < 1) requestAnimationFrame(frame);
    else el.textContent = fmt(to);
  };
  requestAnimationFrame(frame);
}

/** Count up when the element first becomes visible. */
export function countWhenVisible(el, to, fmt) {
  if (reduceMotion || !("IntersectionObserver" in window)) { el.textContent = fmt(to); return; }
  el.textContent = fmt(0);
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    countUp(el, to, fmt);
  }, { threshold: 0.15 });
  io.observe(el);
}

/* ------------------------------------------------------------ states */

export function skeletonRows(n = 4, cls = "skeleton--row") {
  return Array.from({ length: n }, () => h("div.skeleton", { class: cls }));
}

/** The RELL app result state: a round mark, a serif title, a grey line, an optional action. */
export function emptyState({ title, body, action, mark = "01", kind = "empty", center = false, plain = false } = {}) {
  return h("div.result-state", { "data-state": kind, class: [center ? "result-state--center" : "", plain ? "result-state--plain" : ""].join(" ").trim() },
    h("div.result-state__mark", { "aria-hidden": "true" }, mark),
    h("div", {}, h("h3", {}, title), body ? h("p", {}, body) : null, action || null)
  );
}

/** Error state with a Retry button. err.code "no_backend" gets its own short copy. */
export function errorState(err, retry, opts = {}) {
  const noBackend = err && err.code === "no_backend";
  return emptyState({
    kind: "error", mark: "!", ...opts,
    title: noBackend ? copy.common.noBackend : copy.common.errorTitle,
    body: noBackend ? copy.common.noBackendBody : copy.common.errorBody,
    action: retry ? btn(copy.common.retry, { variant: "outline", onclick: retry }) : null
  });
}

/** Load into a container with skeleton, then render, error or empty. */
export async function load(container, fetcher, render, { skeleton, errorOpts } = {}) {
  container.replaceChildren(...(skeleton ? skeleton() : skeletonRows(4)));
  container.setAttribute("aria-busy", "true");
  try {
    const data = await fetcher();
    container.removeAttribute("aria-busy");
    container.replaceChildren();
    render(data);
    return data;
  } catch (err) {
    console.info("[ora] load failed:", err && err.message);
    container.removeAttribute("aria-busy");
    container.replaceChildren(errorState(err, () => load(container, fetcher, render, { skeleton, errorOpts }), errorOpts));
    return null;
  }
}

/* ------------------------------------------------------------ page hero */

/** The dark painted hero from the RELL app, used at the top of every app page. */
export function pageHero({ label, title, lede, art = "hero-valley.avif", children = [], id = "page-title" }) {
  return h("section.app-hero.app-hero--page", { "data-nav-dark": "", "aria-labelledby": id },
    h("div.app-hero__art", { "aria-hidden": "true" }, h("img", { src: "/assets/img/" + art, alt: "", fetchpriority: "high" })),
    h("div.container.app-hero__inner", {},
      h("div.app-hero__copy", {},
        label ? h("p.label", {}, label) : null,
        h("h1.display-1", { id }, title),
        lede ? h("p.lede", {}, lede) : null
      ),
      children
    )
  );
}

/* ------------------------------------------------------------ nav, sheet, footer */

const NAV = [
  { key: "forge", href: "/forge" },
  { key: "leaderboard", href: "/leaderboard" },
  { key: "docs", href: "/docs" }
];

function logo(cls = "") {
  return [
    h("img", { class: ("logo--ink " + cls).trim(), src: "/assets/brand/logo-lockup.svg", width: "1779", height: "745", alt: "Ora" }),
    h("img", { class: ("logo--paper " + cls).trim(), src: "/assets/brand/logo-lockup-inverse.svg", width: "1779", height: "745", alt: "" })
  ];
}

function paintWalletButtons() {
  const connected = wallet.state === "connected";
  $$("[data-wallet-connect]").forEach((b) => {
    const text = connected ? shortAddr(wallet.address) : wallet.state === "connecting" ? copy.wallet.connecting : copy.wallet.connect;
    setBtnText(b, text);
    b.dataset.state = connected ? "connected" : "idle";
    b.setAttribute("aria-label", connected ? copy.wallet.menuLabel + ", " + text : copy.wallet.connect);
    b.disabled = wallet.state === "connecting";
  });
}

export function accountModal() {
  const m = openModal({
    title: shortAddr(wallet.address),
    body: [h("p", { class: "mono" }, wallet.address)],
    actions: [
      btn(copy.wallet.myAgents, { href: "/me" }),
      btn(copy.wallet.disconnect, { variant: "outline", onclick: () => { m.close(); wallet.disconnect(); } })
    ]
  });
}

function onWalletClick() {
  if (wallet.state === "connected") accountModal();
  else openWalletModal();
}

function renderNav(page) {
  const C = copy.common;
  const primary = page === "forge" ? btn(C.nav.me, { href: "/me" }) : btn(copy.forge.openForge, { href: "/forge" });
  const burger = h("button.site-nav__burger", { type: "button", "aria-expanded": "false", "aria-controls": "mobile-sheet", "aria-label": C.menu }, h("span"), h("span"));
  const header = h("header.site-nav", { "data-header": "" },
    h("nav.site-nav__bar", { "aria-label": "Primary" },
      h("div.site-nav__brand-wrap", {}, config.mockMode ? h("span.nav-chip", {}, C.demo) : null),
      h("a.site-nav__brand", { href: "/", "aria-label": C.homeLabel }, logo()),
      h("div.site-nav__links", {},
        NAV.map((n) => h("a.site-nav__link", { href: n.href, class: page === n.key ? "is-active" : "", "aria-current": page === n.key ? "page" : null }, C.nav[n.key])),
        h("button.site-nav__connect", { type: "button", "data-wallet-connect": "", onclick: onWalletClick }, copy.wallet.connect),
        burger,
        primary
      )
    )
  );
  document.body.prepend(header);

  const sheet = h("div.sheet", { id: "mobile-sheet", hidden: true },
    h("div.sheet__panel", { role: "dialog", "aria-modal": "true", "aria-label": C.menu },
      h("div.sheet__head", {},
        h("a", { href: "/", "aria-label": C.homeLabel }, h("img", { src: "/assets/brand/logo-lockup.svg", width: "1779", height: "745", alt: "Ora" })),
        h("button.sheet__close", { type: "button", "aria-label": C.close, "data-sheet-close": "" }, h("span"), h("span"))
      ),
      h("nav.sheet__links", { "aria-label": "Mobile" },
        [...NAV, { key: "me", href: "/me" }].map((n) => h("a", { href: n.href, "aria-current": page === n.key ? "page" : null }, C.nav[n.key]))),
      h("div.sheet__actions", {},
        btn(copy.forge.openForge, { href: "/forge" }),
        h("button.btn.btn--outline", { type: "button", "data-wallet-connect": "", onclick: onWalletClick }, h("span.btn__label", {}, copy.wallet.connect))
      )
    )
  );
  header.after(sheet);
  initSheet(sheet, burger);
  initScrollState(header);
}

function initSheet(sheet, opener) {
  const open = () => {
    sheet.hidden = false;
    opener.setAttribute("aria-expanded", "true");
    document.documentElement.style.overflow = "hidden";
    const first = $("a, button", sheet);
    if (first) first.focus({ preventScroll: true });
  };
  const close = () => {
    if (sheet.hidden) return;
    sheet.hidden = true;
    opener.setAttribute("aria-expanded", "false");
    document.documentElement.style.overflow = "";
  };
  opener.addEventListener("click", open);
  $$("[data-sheet-close]", sheet).forEach((el) => el.addEventListener("click", close));
  sheet.addEventListener("click", (e) => { if (e.target === sheet || e.target.closest(".sheet__links a")) close(); });
  document.addEventListener("keydown", (e) => {
    if (sheet.hidden) return;
    if (e.key === "Escape") { close(); opener.focus({ preventScroll: true }); }
    else if (!$(".modal")) trapFocus(sheet, e);
  });
  const desktop = window.matchMedia("(min-width: 1200px)");
  desktop.addEventListener("change", (mq) => { if (mq.matches) close(); });
}

/** Light bar over the cream canvas, dark bar over the painted hero. */
function initScrollState(header) {
  let queued = false;
  const update = () => {
    queued = false;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
    header.classList.toggle("is-dark", $$("[data-nav-dark]").some((el) => {
      const r = el.getBoundingClientRect();
      return r.top <= 50 && r.bottom >= 50;
    }));
  };
  const request = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  // the hero is rendered by the page module, so check again once it is in
  requestAnimationFrame(update);
  setTimeout(update, 60);
}

function renderFooter() {
  const C = copy.common;
  const F = copy.footer;
  const base = String(config.chain.explorerBase || "").replace(/\/+$/, "");
  const mint = String(config.token.mint || "").trim();
  const program = String(config.program.id || "").trim();
  const cluster = config.chain.cluster === "devnet" ? "?cluster=devnet" : "";
  const ext = (text, href) => h("a", { href: href || null, target: href ? "_blank" : null, rel: href ? "noopener noreferrer" : null }, text);
  const social = Object.entries(config.links || {})
    .filter(([, url]) => typeof url === "string" && url.trim() !== "")
    .map(([k, url]) => ext(C.social[k] || k, url));
  const footer = h("footer.site-foot", {},
    h("div.container", {},
      h("div.site-foot__top", {},
        h("div", {}, h("p.site-foot__tagline", {}, F.tagline), btn(F.cta, { href: "/forge" })),
        h("div.site-foot__cols", {},
          h("div.site-foot__col", {}, h("h2", {}, F.product), h("a", { href: "/forge" }, C.nav.forge), h("a", { href: "/leaderboard" }, C.nav.leaderboard), h("a", { href: "/me" }, C.nav.me)),
          h("div.site-foot__col", {}, h("h2", {}, F.resources), h("a", { href: "/docs" }, C.nav.docs), h("a", { href: "/#process" }, F.how), h("a", { href: "/#faq" }, F.faq)),
          h("div.site-foot__col", {}, h("h2", {}, F.onchain),
            ext(F.mint, base && mint ? base + "/token/" + mint + cluster : ""),
            ext(F.program, base && program ? base + "/account/" + program + cluster : ""),
            ext(F.explorer, base)),
          social.length ? h("div.site-foot__col", {}, h("h2", {}, F.social), social) : null
        )
      ),
      h("div.site-foot__base", {}, h("span", {}, C.copyright), h("span", {}, C.footerDisclaimer))
    )
  );
  document.body.appendChild(footer);
}

/* ------------------------------------------------------------ boot */

export function boot({ page } = {}) {
  document.documentElement.classList.add("js");
  renderNav(page);
  renderFooter();
  window.addEventListener("wallet:change", paintWalletButtons);
  wallet.init();
  paintWalletButtons();
  window.addEventListener("storage", (e) => { if (e.key === "ora.session") wallet.init(); });
}

/** Re run the bar's dark check after the page module has rendered its hero. */
export function refreshNav() {
  window.dispatchEvent(new Event("scroll"));
}
