# Ora web

Static frontend for Ora. You build a trading agent, run it on paper (virtual money, real market
prices) and rank it on a public leaderboard. Assets are tokenized stocks on Solana: TSLAx, AAPLx,
GOOGLx. Agents decide every 15 minutes.

Plain HTML, CSS and ES modules. There is no build step, no bundler and no package.json.
It runs offline except for wallet extensions; the fonts are self hosted in `assets/fonts`.

## Local preview

```bash
npx serve .
```

Then open the printed address. `serve` maps clean URLs (`/forge` to `forge.html`), as Vercel does.

## Deploy on Vercel

1. Import this folder as a new project.
2. Framework Preset: **Other**.
3. Build command: none. Output directory: `.`
4. Deploy. `vercel.json` sets clean URLs and the headers, and `.vercelignore` keeps `_notes`,
   `reference` and `scripts` out of the upload.

## After contract deploy

Everything that changes between environments lives in `js/config.js`. No other file needs editing.

1. Set `token.mint`.
2. Set `program.id` and `program.anchorOnchain`.
3. Set `api.baseUrl`, `api.publicBaseUrl` and `mockMode: false`.
4. Set `links`.
5. Redeploy on Vercel.

Once `token.mint` is filled, the hero pill on the landing shows the address, Copy copies it,
and the link icon opens `explorerBase + "/token/" + mint`. The footer Token mint and Program links
switch on by themselves.

## Mock and real data

`mockMode: true` (the default) serves seeded demo data from `js/mock-data.js`. Demo agents you create
or start are kept in `localStorage` under `ora.mock.*`, and the wallet modal offers a demo wallet.

`mockMode: false` calls `api.baseUrl` with cookies included:

| Call | Route |
|---|---|
| `getMarkets` | `GET /api/markets` |
| `getLeaderboard` | `GET /api/leaderboard?sort=&filter=` |
| `getLatestTrades` | `GET /api/trades/latest` |
| `getAgent` | `GET /api/agents/:slug` |
| `getMe` | `GET /api/me` |
| `createAgent` | `POST /api/agents` |
| `startAgent`, `pauseAgent` | `POST /api/agents/:slug/start`, `/pause` |
| `createKey`, `revokeKey` | `POST`, `DELETE /api/agents/:slug/key` |
| `auth.requestNonce`, `auth.verify`, `auth.logout` | `POST /api/auth/nonce`, `/verify`, `/logout` |

With `mockMode: false` and an empty `api.baseUrl`, pages show "Backend not connected yet." with a
Retry button.

The wallet supports Phantom, Solflare and Backpack. It only ever signs a message, never a transaction.

## File map

| Path | What it is |
|---|---|
| `index.html` | Landing. Generated from `reference/rell-index.html` by `_notes/port-landing.py`. Edit the script, not this file. |
| `forge.html`, `leaderboard.html`, `agent.html`, `me.html`, `docs.html`, `404.html` | App pages. A shell only; content comes from `js/pages/*.js`. |
| `css/template.css`, `css/landing.css` | The landing template styles, kept as they are |
| `css/landing-ora.css` | Ora additions on the landing: market card charts, shimmer, touch hit areas |
| `css/site.css`, `css/app.css`, `css/docs.css` | The template's app shell: nav bar, sheet, buttons, painted heroes, doc cards |
| `css/ora-app.css` | Ora app components: forms, tables, stats, charts, cards |
| `css/ora-modal.css` | Wallet modal and toasts, shared by every page |
| `js/config.js` | Every configurable value |
| `js/copy.js` | Every string rendered by JavaScript |
| `js/app.js` | App shell and helpers: nav, sheet, footer, modal, toast, load states |
| `js/wallet.js`, `js/api.js`, `js/mock-data.js`, `js/format.js`, `js/charts.js` | Wallet, data layer, demo data, formatters, sparkline and equity chart |
| `js/landing.js`, `js/contract-bar.js`, `js/landing-ora.js` | Landing motion (template), token pill, Ora landing pieces |
| `js/pages/*.js` | One module per app page |
| `assets/` | Fonts, paintings, logo files, `og.svg` |
| `scripts/check-copy.mjs` | Copy rule checker |
| `_notes/` | Decisions, the reference analysis, the port and logo scripts, screenshots |
| `reference/` | The supplied RELL landing. Read only. |

## Copy rules

Visible copy has no hyphens, en dashes or em dashes, and sentences stay short. Run the checker
before shipping. It exits 1 on any finding:

```bash
node scripts/check-copy.mjs
```

## Social card

`assets/og.svg` is the source. Open it in a browser from `assets/` so the fonts load, export a
1200 × 630 PNG as `assets/og.png`, then add an `og:image` meta to each page.

## Rerunning from the reference (Mode A)

The landing is the RELL landing with Ora words. To rebuild it after the reference changes, replace
`reference/rell-index.html`, adjust the replacements in `_notes/port-landing.py` and run:

```bash
python -I _notes/port-landing.py
```

Each replacement checks its match count, and the script lists anything RELL specific left over.
To rebuild the logo from the template font:

```bash
python -I _notes/make-logo.py
```
