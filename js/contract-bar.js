/* Contract address pill in the hero.
   Reads token.mint from window.ORA_CONFIG (js/config.js).
     mint empty   shows Coming soon with a shimmer; Copy copies that text
     mint filled  shows the address (shortened on phones), Copy copies the full
                  address, and the link icon opens it on the explorer */
(function (ORA) {
  "use strict";

  var FEEDBACK_MS = 1600;
  var COMPACT_MQ = "(max-width: 767px)";
  var SOON = "Coming soon";

  function shorten(address) {
    return address.slice(0, 4) + "…" + address.slice(-4);
  }

  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "0";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (err) {
        ok = false;
      }
      document.body.removeChild(area);
      if (ok) resolve();
      else reject(new Error("copy failed"));
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text);
      });
    }
    return legacyCopy(text);
  }

  ORA.initContractBar = function (config) {
    var bar = document.querySelector("[data-ca-bar]");
    if (!bar) return;

    var text = bar.querySelector("[data-ca-text]");
    var button = bar.querySelector("[data-ca-copy]");
    var label = bar.querySelector("[data-ca-copy-text]");
    var explorer = bar.querySelector("[data-ca-explorer]");

    var token = (config && config.token) || {};
    var chain = (config && config.chain) || {};
    var mint = String(token.mint || "").trim();
    var live = mint.length > 0;
    var compact = window.matchMedia(COMPACT_MQ);
    var timer = null;

    function render() {
      bar.setAttribute("data-state", live ? "live" : "soon");
      if (live) {
        text.textContent = compact.matches ? shorten(mint) : mint;
        text.title = mint;
        text.classList.remove("ora-shimmer");
        button.setAttribute("aria-label", "Copy the token address " + mint);
      } else {
        text.textContent = SOON;
        text.removeAttribute("title");
        text.classList.add("ora-shimmer");
        button.setAttribute("aria-label", "Copy the token address. Available at launch.");
      }
      var base = String(chain.explorerBase || "").replace(/\/+$/, "");
      if (live && base) {
        explorer.href = base + "/token/" + mint + (chain.cluster === "devnet" ? "?cluster=devnet" : "");
        explorer.hidden = false;
      } else {
        explorer.hidden = true;
      }
    }

    function setState(state, message) {
      button.setAttribute("data-copy-state", state);
      label.textContent = message;
      window.clearTimeout(timer);
      if (state !== "idle") {
        timer = window.setTimeout(function () {
          setState("idle", "Copy");
        }, FEEDBACK_MS);
      }
    }

    button.addEventListener("click", function () {
      copyText(live ? mint : SOON).then(
        function () {
          setState("copied", "Copied");
          ORA.toast("Copied");
        },
        function () {
          setState("idle", "Copy");
          ORA.toast("Copy was blocked. Select the address instead.");
        }
      );
    });

    render();
    if (compact.addEventListener) compact.addEventListener("change", render);
  };
})(window.ORA = window.ORA || {});
