// Solana wallet connect and message sign in. Never asks for a transaction signature.
// Providers are checked in order: Phantom, Solflare, Backpack.
import { copy } from "./copy.js";
import { api } from "./api.js";
import { DEMO_WALLET } from "./mock-data.js";
import { openModal, toast, fill, h, store, icon } from "./app.js";

const SESSION_KEY = "ora.session";
const cfg = () => window.ORA_CONFIG;

const PROVIDERS = [
  { id: "phantom", name: "Phantom", get: () => window.phantom && window.phantom.solana },
  { id: "solflare", name: "Solflare", get: () => window.solflare },
  { id: "backpack", name: "Backpack", get: () => window.backpack }
];

function detected() {
  return PROVIDERS.map((p) => ({ ...p, provider: p.get() })).filter((p) => p.provider && typeof p.provider.connect === "function");
}

function toBase64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function randomNonce() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

function emit() {
  window.dispatchEvent(new CustomEvent("wallet:change", { detail: { state: wallet.state, address: wallet.address } }));
}

export const wallet = {
  state: "disconnected",
  address: null,
  providerId: null,

  /** Restore a saved session. Demo sessions only count while mockMode is on. */
  init() {
    const s = store.get(SESSION_KEY);
    const valid = s && s.address && (s.provider !== "demo" || cfg().mockMode);
    const prev = this.address;
    if (valid) { this.state = "connected"; this.address = s.address; this.providerId = s.provider; }
    else { this.state = "disconnected"; this.address = null; this.providerId = null; }
    if (prev !== this.address) emit();
    else if (!this._painted) emit();
    this._painted = true;
  },

  async connectDemo() {
    this.state = "connected";
    this.address = DEMO_WALLET;
    this.providerId = "demo";
    store.set(SESSION_KEY, { address: DEMO_WALLET, provider: "demo", ts: Date.now() });
    emit();
    toast(copy.wallet.connected);
  },

  async connect(providerId) {
    const entry = detected().find((p) => p.id === providerId);
    if (!entry) throw new Error("provider missing");
    const provider = entry.provider;
    this.state = "connecting";
    emit();
    try {
      const res = await provider.connect();
      const pk = (res && res.publicKey) || provider.publicKey;
      const address = pk && pk.toString ? pk.toString() : String(pk || "");
      if (!address) throw new Error("no public key");

      // real mode signs the exact single use message issued by ora-api; demo mode builds its own
      const message = cfg().mockMode
        ? fill(copy.wallet.message, { wallet: address, nonce: randomNonce(), issued: new Date().toUTCString() })
        : (await api.auth.requestNonce(address)).message;
      if (!message) throw new Error("no sign in message");
      toast(copy.wallet.signPrompt);
      const signed = await provider.signMessage(new TextEncoder().encode(message), "utf8");
      const sig = signed && signed.signature ? signed.signature : signed;
      const signatureBase64 = toBase64(sig instanceof Uint8Array ? sig : new Uint8Array(sig));
      if (!cfg().mockMode) await api.auth.verify(address, signatureBase64);

      this.state = "connected";
      this.address = address;
      this.providerId = providerId;
      store.set(SESSION_KEY, { address, provider: providerId, ts: Date.now() });
      emit();
      toast(copy.wallet.connected);
    } catch (err) {
      this.state = "disconnected";
      this.address = null;
      emit();
      const declined = err && (err.code === 4001 || /reject|declin|cancel/i.test(String(err.message || "")));
      toast(declined ? copy.wallet.rejected : copy.wallet.failed, { error: true });
      throw err;
    }
  },

  async disconnect() {
    const entry = detected().find((p) => p.id === this.providerId);
    try { if (entry && entry.provider.disconnect) await entry.provider.disconnect(); } catch { /* provider already gone */ }
    try { if (!cfg().mockMode) await api.auth.logout(); } catch { /* session already ended */ }
    store.remove(SESSION_KEY);
    this.state = "disconnected";
    this.address = null;
    this.providerId = null;
    emit();
    toast(copy.wallet.disconnected);
  },

  /** Resolve once a wallet is connected, opening the modal when needed. */
  require() {
    if (this.state === "connected") return Promise.resolve(this.address);
    return new Promise((resolve, reject) => {
      let closed = false;
      const finish = (ok) => {
        window.removeEventListener("wallet:change", check);
        if (ok) resolve(wallet.address); else reject(new Error("wallet not connected"));
      };
      // the modal closes before a provider finishes connecting, so settle on the final state
      const check = () => {
        if (wallet.state === "connected") finish(true);
        else if (closed && wallet.state === "disconnected") finish(false);
      };
      window.addEventListener("wallet:change", check);
      openWalletModal({ onClose: () => { closed = true; setTimeout(check, 0); } });
    });
  }
};

/** The connect modal: detected wallets, install links, and a demo wallet in mockMode. */
export function openWalletModal({ onClose } = {}) {
  const c = copy.wallet;
  const found = detected();
  const body = [h("p", {}, c.sub)];
  let modal = null;

  if (found.length) {
    body.push(h("div.wallet-list", {}, found.map((p) =>
      h("button.wallet-option", {
        type: "button",
        onclick: async () => {
          modal.close();
          try { await wallet.connect(p.id); } catch { /* toast already shown */ }
        }
      }, h("span", {}, p.name), h("span", {}, c.detected))
    )));
  } else {
    body.push(
      h("div.wallet-list", {},
        h("p", { style: { color: "var(--text)" } }, c.none),
        h("p", { class: "small faint" }, c.noneSub)
      ),
      h("div.row.gap-8.wrap", {},
        h("a.btn.btn--secondary.btn--sm", { href: "https://phantom.app", target: "_blank", rel: "noopener noreferrer", html: c.installPhantom + " " + icon("external") }),
        h("a.btn.btn--secondary.btn--sm", { href: "https://solflare.com", target: "_blank", rel: "noopener noreferrer", html: c.installSolflare + " " + icon("external") })
      )
    );
  }

  if (cfg().mockMode) {
    body.push(
      h("div.stack.gap-8", { style: { marginTop: "8px", paddingTop: "18px", borderTop: "1px solid var(--line)" } },
        h("button.btn.btn--primary.btn--block", { type: "button", onclick: () => { modal.close(); wallet.connectDemo(); } }, c.demo),
        h("p", { class: "small faint center", style: { maxWidth: "none" } }, c.demoNote)
      )
    );
  }

  modal = openModal({ title: c.title, body, onClose });
  return modal;
}
