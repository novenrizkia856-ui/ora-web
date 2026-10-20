/* Ora landing behaviour, carried over from the RELL landing unchanged except for
   the config binding and the loader captions.
   The page is the Aureum Framer export with Ora copy. The export kept markup and
   styles but none of Framer's runtime, so this file restores the motion and the
   interactive parts: the intro, scroll linked hero and sections, word reveals,
   count ups, the process fade, both tickers, the accordion and the nav.
   It also binds window.ORA_CONFIG (js/config.js): the token symbol and the onchain links. */
(function (ORA) {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var vh = window.innerHeight;
  var vw = window.innerWidth;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
  var $ = function (s, root) { return (root || document).querySelector(s); };
  var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };
  var byName = function (name, root) { return $('[data-framer-name="' + name + '"]', root); };
  var allByName = function (name, root) { return $$('[data-framer-name="' + name + '"]', root); };

  /* Scroll work is batched into one frame per scroll event. */
  var scrollers = [];
  var ticking = false;
  function onScroll(fn) { scrollers.push(fn); }
  function runScroll() {
    ticking = false;
    var y = window.scrollY;
    for (var i = 0; i < scrollers.length; i++) scrollers[i](y);
  }
  function requestScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(runScroll); }
  }

  /* ---------------------------------------------------------------- toast */

  var toastTimer = null;
  ORA.toast = function (message) {
    var region = $("[data-toast-region]");
    if (!region) return;
    region.textContent = "";
    var toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    region.appendChild(toast);
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2600);
  };

  /* ---------------------------------------------------------------- config */

  function getPath(obj, path) {
    return path.split(".").reduce(function (acc, key) { return acc == null ? undefined : acc[key]; }, obj);
  }

  function bindConfig(config) {
    $$("[data-config-text]").forEach(function (el) {
      var value = getPath(config, el.getAttribute("data-config-text"));
      if (value !== undefined && value !== null && String(value).trim() !== "") el.textContent = String(value);
    });
    var base = String((config.chain && config.chain.explorerBase) || "").replace(/\/+$/, "");
    var mint = String((config.token && config.token.mint) || "").trim();
    var program = String((config.program && config.program.id) || "").trim();
    var cluster = config.chain && config.chain.cluster === "devnet" ? "?cluster=devnet" : "";
    var targets = {
      token: base && mint ? base + "/token/" + mint + cluster : "",
      program: base && program ? base + "/account/" + program + cluster : "",
      explorer: base
    };
    $$("[data-ora-link]").forEach(function (link) {
      var href = targets[link.getAttribute("data-ora-link")];
      if (href) {
        link.href = href;
        link.setAttribute("aria-label", link.textContent + " on Solscan");
      } else {
        link.removeAttribute("href");
        link.removeAttribute("target");
      }
    });
  }

  /* ---------------------------------------------------------------- nav */

  function initNav() {
    var nav = $(".framer-1q9s9l2");
    if (!nav) return;
    var hero = $(".framer-ja4jg9");
    var statement = $(".rell-statement");
    var process = $(".framer-1js9xbn");
    var panel = byName("Sticky Panel");
    var dark = [hero, statement, $("#map"), $(".framer-h5kyxz")].filter(Boolean);
    var probe = 50;

    onScroll(function (y) {
      nav.classList.toggle("is-hidden", !reduce && y < vh * 0.55);
      var isDark = dark.some(function (el) {
        var r = el.getBoundingClientRect();
        return r.top <= probe && r.bottom >= probe;
      });
      if (!isDark && process && panel) {
        var r = process.getBoundingClientRect();
        isDark = r.top <= probe && r.bottom >= probe && parseFloat(panel.style.opacity || "0") > 0.5;
      }
      nav.classList.toggle("is-dark", isDark);
    });
  }

  function initSheet() {
    var sheet = $("[data-sheet]");
    var openers = $$("[data-sheet-open]");
    if (!sheet || !openers.length) return;
    var last = null;
    function open() {
      last = document.activeElement;
      sheet.hidden = false;
      openers.forEach(function (b) { b.setAttribute("aria-expanded", "true"); });
      document.documentElement.style.overflow = "hidden";
      var first = $("a, button", sheet);
      if (first) first.focus();
    }
    function close() {
      sheet.hidden = true;
      openers.forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
      document.documentElement.style.overflow = "";
      if (last && last.focus) last.focus();
    }
    openers.forEach(function (b) { b.addEventListener("click", open); });
    $$("[data-sheet-close]", sheet).forEach(function (el) { el.addEventListener("click", close); });
    sheet.addEventListener("click", function (e) { if (e.target === sheet) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !sheet.hidden) close(); });
  }

  /* ---------------------------------------------------------------- intro */

  var LOADER_ART =
    '<svg viewBox="0 0 220 260" aria-hidden="true">' +
    '<path pathLength="1" d="M70 118 L150 118 L158 70 L78 70 Z"/>' +
    '<path pathLength="1" d="M62 124 L162 124 L150 118 L70 118"/>' +
    '<ellipse pathLength="1" cx="110" cy="132" rx="62" ry="10"/>' +
    '<path pathLength="1" d="M58 140 L58 222 M162 140 L162 222"/>' +
    '<path pathLength="1" d="M76 146 L76 216 M94 148 L94 218 M110 148 L110 218 M126 148 L126 218 M144 146 L144 216"/>' +
    '<ellipse pathLength="1" cx="110" cy="226" rx="64" ry="11"/>' +
    '<path pathLength="1" d="M40 244 L180 244 M46 236 L174 236"/>' +
    "</svg>";

  function initIntro() {
    var main = $("main");
    var cols = $(".framer-1md2tua-container [aria-hidden=true]");
    if (cols) cols.classList.add("rell-cols");
    $$(".framer-5bwy8n h1").forEach(function (h1) {
      $$(":scope > span > span", h1).forEach(function (s, i) { s.style.setProperty("--i", i); });
    });

    function start() {
      if (main) main.classList.add("is-intro");
      if (cols) window.setTimeout(function () { cols.classList.add("is-open"); }, 60);
      document.documentElement.classList.add("is-ready");
    }

    if (reduce || window.scrollY > vh) {
      if (cols) cols.classList.add("is-open");
      start();
      return;
    }

    var loader = document.createElement("div");
    loader.className = "rell-loader";
    loader.setAttribute("aria-hidden", "true");
    for (var i = 0; i < 7; i++) {
      var c = document.createElement("div");
      c.className = "rell-loader__col";
      c.style.transitionDelay = (i * 55) + "ms";
      loader.appendChild(c);
    }
    var art = document.createElement("div");
    art.className = "rell-loader__art";
    art.innerHTML = '<p class="rell-loader__caption">Trading agents<br>on real prices</p>' + LOADER_ART +
      '<p class="rell-loader__caption rell-loader__caption--end">Virtual capital<br>public results</p>';
    loader.appendChild(art);
    document.body.appendChild(loader);

    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    var minTime = new Promise(function (r) { window.setTimeout(r, 1500); });
    Promise.all([ready, minTime]).then(function () {
      loader.classList.add("is-leaving");
      window.setTimeout(start, 380);
      window.setTimeout(function () { loader.remove(); }, 1600);
    });
  }

  /* ---------------------------------------------------------------- hero scroll */

  function initHero() {
    var image = $(".framer-1md2tua-container");
    var left = $(".framer-nl91j1");
    var right = $(".framer-144lxoz");
    var hero = $(".framer-ja4jg9");
    if (!image || !hero) return;
    var entered = reduce;
    var enter = 0;
    var wide = window.matchMedia("(min-width: 810px)");

    /* As on the live template: the painting sits as a half scale card in the
       middle of the dark hero. On wider screens it grows slowly while the
       page scrolls; on phones it stays at half scale. */
    function paint(y) {
      if (y > hero.offsetHeight + vh) return;
      var s = 0.5 + 0.06 * (1 - enter) + (wide.matches ? Math.min(y * 0.0000677, 0.25) : 0);
      image.style.transform = "scale(" + s.toFixed(4) + ")";
      var slide = (1 - enter) * 100;
      if (left) left.style.transform = "translateX(" + (-slide) + "px) translateY(" + (-y * 0.3).toFixed(1) + "px) rotate(-19deg)";
      if (right) right.style.transform = "translateX(" + slide + "px) translateY(" + (-y * 0.4).toFixed(1) + "px) rotate(9deg)";
      if (left) left.style.opacity = String(enter);
      if (right) right.style.opacity = String(enter);
    }
    onScroll(paint);

    function animateEnter() {
      var t0 = performance.now();
      (function frame(now) {
        enter = ease(clamp((now - t0) / 1600, 0, 1));
        paint(window.scrollY);
        if (enter < 1) window.requestAnimationFrame(frame);
      })(t0);
    }
    if (entered) { enter = 1; paint(window.scrollY); return; }
    paint(window.scrollY);
    var check = window.setInterval(function () {
      if (document.documentElement.classList.contains("is-ready")) {
        window.clearInterval(check);
        window.setTimeout(animateEnter, 250);
      }
    }, 50);
  }

  /* ---------------------------------------------------------------- statement */

  function splitWords(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.textContent = "";
    return words.map(function (w, i) {
      var s = document.createElement("span");
      s.className = "rell-word";
      s.setAttribute("aria-hidden", "true");
      s.textContent = w;
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
      return s;
    });
  }

  function initStatement() {
    var text = $("[data-word-reveal]");
    if (!text) return;
    var words = splitWords(text);
    if (reduce) { words.forEach(function (w) { w.classList.add("is-on"); }); return; }
    onScroll(function () {
      var r = text.getBoundingClientRect();
      var p = clamp((vh * 0.85 - r.top) / (vh * 0.55), 0, 1);
      var on = Math.round(p * words.length);
      for (var i = 0; i < words.length; i++) words[i].classList.toggle("is-on", i < on);
    });
  }

  /* ---------------------------------------------------------------- problem card */

  function initProblem() {
    var section = $(".framer-3xiqpm");
    var card = $(".framer-653lwf");
    if (!section || !card) return;
    var small = window.matchMedia("(max-width: 809.98px)");
    onScroll(function () {
      if (small.matches) { card.style.width = ""; return; }
      var r = section.getBoundingClientRect();
      var p = clamp((vh * 0.9 - r.top) / (vh * 1.4), 0, 1);
      card.style.width = (52 + 48 * ease(p)).toFixed(2) + "%";
    });
  }

  /* ---------------------------------------------------------------- word reveals and count ups */

  function initReveals() {
    var targets = $$("h2").filter(function (h) {
      var spans = $$(":scope > span", h);
      return spans.length > 1 && spans.every(function (s) { return /inline-block/.test(s.getAttribute("style") || ""); });
    });
    targets.forEach(function (h) {
      h.setAttribute("data-reveal-words", "");
      h.setAttribute("aria-label", h.textContent.replace(/\s+/g, " ").trim());
      $$(":scope > span", h).forEach(function (s, i) {
        s.style.cssText = "display:inline-block;--i:" + i;
        s.setAttribute("aria-hidden", "true");
      });
    });

    var counters = $$(".framer-t7jknc-container span, .framer-11luyi0-container span, .framer-x7gnq2-container span");
    counters.forEach(function (el) {
      var m = el.textContent.trim().match(/^(\d+)(.*)$/);
      if (!m) return;
      el.dataset.target = m[1];
      el.dataset.suffix = m[2];
      if (!reduce) el.textContent = "0" + m[2];
    });

    function count(el) {
      var target = Number(el.dataset.target);
      var t0 = performance.now();
      (function frame(now) {
        var p = ease(clamp((now - t0) / 1600, 0, 1));
        el.textContent = Math.round(target * p) + el.dataset.suffix;
        if (p < 1) window.requestAnimationFrame(frame);
      })(t0);
    }

    var imageReveals = $$('[data-framer-name="Image Reveal"] [aria-hidden=true], [data-framer-name^="Process Image"] [aria-hidden=true]');
    imageReveals.forEach(function (c) { c.classList.add("rell-cols"); });

    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach(function (h) { h.classList.add("is-in"); });
      imageReveals.forEach(function (c) { c.classList.add("is-open"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        if (el.dataset.target) count(el);
        else el.classList.add(el.classList.contains("rell-cols") ? "is-open" : "is-in");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    targets.concat(imageReveals).forEach(function (el) { io.observe(el); });
    counters.forEach(function (el) { if (el.dataset.target) io.observe(el); });
  }

  /* ---------------------------------------------------------------- process */

  function initProcess() {
    var panel = byName("Sticky Panel");
    // The export's #fade-trigger sits at a fixed offset that only fits the
    // desktop layout, so the fade keys off the last step instead.
    var trigger = $("#process-step-4");
    var darkSet = allByName("Steps Dark").concat($$('[data-framer-name$=" Text"]').filter(function (el) {
      return /^Step 0\d Text$/.test(el.getAttribute("data-framer-name"));
    }));
    var lightSet = allByName("Steps Light").concat(allByName("Step 01 Text Light"), allByName("Step 02 Text Light"),
      allByName("Step 03 Text Light"), allByName("Step 04 Text Light"));
    var steps = [1, 2, 3, 4].map(function (n) { return $("#process-step-" + n); }).filter(Boolean);
    var items = $$('a[href^="#process-step-"]');
    var menu = $(".framer-ggsqc8");
    if (!panel || !trigger) return;

    // The light menu is the second menu block in the export.
    if (!allByName("Steps Light").length) {
      var menus = $$(".framer-ggsqc8 > div");
      if (menus[1]) lightSet.push(menus[1]);
    }

    onScroll(function () {
      var r = trigger.getBoundingClientRect();
      var f = clamp((vh * 0.75 - r.top - 100) / 450, 0, 1);
      panel.style.opacity = f.toFixed(3);
      darkSet.forEach(function (el) { el.style.opacity = (1 - f).toFixed(3); });
      lightSet.forEach(function (el) { el.style.opacity = f.toFixed(3); });
      if (menu) menu.classList.toggle("is-night", f > 0.5);

      var active = 0;
      steps.forEach(function (s, i) { if (s.getBoundingClientRect().top < vh * 0.55) active = i; });
      items.forEach(function (a) {
        var n = Number(a.getAttribute("href").slice(-1)) - 1;
        a.style.opacity = n === active ? "1" : "0.4";
      });
    });
  }

  /* ---------------------------------------------------------------- tickers */

  function ticker(track, speed) {
    if (!track || reduce) return;
    var originals = Array.prototype.slice.call(track.children);
    if (!originals.length) return;
    track.style.transform = "translateX(0px)";
    var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
    function setWidth() {
      return originals.reduce(function (w, el) { return w + el.getBoundingClientRect().width + gap; }, 0);
    }
    var width = setWidth();
    var copies = Math.max(1, Math.ceil((track.parentNode.getBoundingClientRect().width * 2) / Math.max(width, 1)));
    for (var c = 0; c < copies; c++) {
      originals.forEach(function (el) {
        var clone = el.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        $$("a, button", clone).forEach(function (a) { a.setAttribute("tabindex", "-1"); });
        track.appendChild(clone);
      });
    }
    var x = 0;
    var factor = 1;
    var target = 1;
    var visible = true;
    var last = performance.now();
    var host = track.parentNode;
    host.addEventListener("mouseenter", function () { target = 0.25; });
    host.addEventListener("mouseleave", function () { target = 1; });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(host);
    }
    window.addEventListener("resize", function () { width = setWidth(); });
    (function frame(now) {
      var dt = Math.min(64, now - last);
      last = now;
      if (visible) {
        factor += (target - factor) * 0.08;
        x -= speed * factor * dt / 1000;
        if (-x >= width) x += width;
        track.style.transform = "translateX(" + x.toFixed(2) + "px)";
      }
      window.requestAnimationFrame(frame);
    })(last);
  }

  /* ---------------------------------------------------------------- FAQ */

  function initFaq() {
    var list = byName("FAQ List");
    if (!list) return;
    var items = $$(":scope > div", list);
    function set(item, open, animate) {
      var card = $(".framer-fjbQp", item);
      if (!card) return;
      var from = item.getBoundingClientRect().height;
      card.classList.toggle("faq-open", open);
      card.classList.toggle("faq-closed", !open);
      card.classList.toggle("framer-v-1auk74y", open);
      card.classList.toggle("framer-v-2ht4oy", !open);
      card.setAttribute("aria-expanded", open ? "true" : "false");
      item.style.height = "auto";
      var to = card.getBoundingClientRect().height;
      if (!animate) { item.style.height = to + "px"; return; }
      item.style.height = from + "px";
      item.getBoundingClientRect();
      item.style.height = to + "px";
    }
    items.forEach(function (item, i) {
      var card = $(".framer-fjbQp", item);
      if (!card) return;
      item.setAttribute("data-faq-item", "");
      card.setAttribute("role", "button");
      var q = $("h5", card);
      if (q) card.setAttribute("aria-label", q.textContent);
      set(item, i === 0, false);
      function toggle() {
        var open = !card.classList.contains("faq-open");
        items.forEach(function (other) { if (other !== item) set(other, false, true); });
        set(item, open, true);
      }
      card.addEventListener("click", toggle);
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      });
    });
    window.addEventListener("resize", function () {
      items.forEach(function (item) {
        var card = $(".framer-fjbQp", item);
        if (card) item.style.height = card.getBoundingClientRect().height + "px";
      });
    });
  }

  /* ---------------------------------------------------------------- start */

  function start() {
    $$("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
    initIntro();
    initNav();
    initSheet();
    initHero();
    initStatement();
    initProblem();
    initReveals();
    initProcess();
    ticker($(".framer-1atvnh1 ul"), 40);
    ticker($(".framer-1rfskho-container ul"), 50);
    initFaq();

    window.addEventListener("scroll", requestScroll, { passive: true });
    window.addEventListener("resize", function () { vh = window.innerHeight; vw = window.innerWidth; requestScroll(); });
    runScroll();

    var config = window.ORA_CONFIG;
    if (config) {
      ORA.config = config;
      bindConfig(config);
      if (ORA.initContractBar) ORA.initContractBar(config);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})(window.ORA = window.ORA || {});
