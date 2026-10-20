// Number, percent, date and address formatters.
// Negative values never use a minus sign: they carry ▼, positives carry ▲.

const NA = "N/A";
const isNum = (v) => typeof v === "number" && Number.isFinite(v);

const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const int = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function usd(v, decimals = 2) {
  if (!isNum(v)) return NA;
  const s = (decimals === 0 ? usd0 : usd2).format(Math.abs(v));
  return v < 0 ? "▼ " + s : s;
}

/** Signed money, for profit and loss: ▲ $12.40 or ▼ $3.10. */
export function pnl(v) {
  if (v === null || v === undefined) return NA;
  if (!isNum(v)) return NA;
  if (Math.abs(v) < 0.005) return usd2.format(0);
  return (v > 0 ? "▲ " : "▼ ") + usd2.format(Math.abs(v));
}

/** Signed percent: ▲ 2.4% or ▼ 2.4%. */
export function pct(v, digits = 1) {
  if (!isNum(v)) return NA;
  const a = Math.abs(v).toFixed(digits);
  if (Number(a) === 0) return (0).toFixed(digits) + "%";
  return (v > 0 ? "▲ " : "▼ ") + a + "%";
}

/** Plain percent with no direction, for rates and settings. */
export function pctPlain(v, digits = 1) {
  if (!isNum(v)) return NA;
  return Math.abs(v).toFixed(digits).replace(/\.0+$/, "") + "%";
}

/** Drawdown is a loss size, shown with ▼ when above zero. */
export function drawdown(v, digits = 1) {
  if (!isNum(v)) return NA;
  if (Math.abs(v) < 0.05) return (0).toFixed(digits) + "%";
  return "▼ " + Math.abs(v).toFixed(digits) + "%";
}

export function tone(v) {
  if (!isNum(v) || Math.abs(v) < 1e-9) return "flat";
  return v > 0 ? "up" : "down";
}

export function num(v, digits = 0) {
  if (!isNum(v)) return NA;
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Math.abs(v));
}

export function integer(v) { return isNum(v) ? int.format(v) : NA; }

export function qty(v) {
  if (!isNum(v)) return NA;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(Math.abs(v));
}

export function date(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return NA;
  return MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
}

export function time(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return NA;
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

/** Relative time: "just now", "3m ago", "2h ago", "4d ago", then a calendar date. */
export function ago(iso, now = Date.now()) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return NA;
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.round(m / 60);
  if (h < 24) return h + "h ago";
  const d = Math.round(h / 24);
  if (d < 7) return d + "d ago";
  return date(iso);
}

/** 7xKp…9fQa */
export function shortAddr(a, head = 4, tail = 4) {
  if (!a) return NA;
  const s = String(a);
  return s.length <= head + tail + 1 ? s : s.slice(0, head) + "…" + s.slice(-tail);
}

export function truncate(s, max = 24) {
  const str = String(s || "");
  return str.length > max ? str.slice(0, max - 1).trimEnd() + "…" : str;
}

export function price(v) {
  if (!isNum(v)) return NA;
  return usd2.format(v);
}
