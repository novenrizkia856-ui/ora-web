# Reference analysis

Reference: the RELL landing (tryrell.xyz, saved 19 Oct 2026). It is the Aureum Framer template
with RELL copy. The export kept markup and styles but none of Framer's runtime; `js/landing.js`
restores the motion. Ora keeps every value below unchanged, at the user's request.

## Motion inventory

| Element | Trigger | Animated | Duration | Delay / stagger | Easing | How |
|---|---|---|---|---|---|---|
| Intro curtain, 7 columns | load, once per visit unless scrolled past 1 vh | transform translateY to -102% | 900ms | 55ms per column; leaves after fonts + 1500ms min | cubic-bezier(.76,0,.24,1) | JS builds it, CSS transition |
| Intro line drawing (temple) | load | stroke-dashoffset 1 to 0 | 1300ms | none | cubic-bezier(.22,1,.36,1) | SVG + CSS keyframes |
| Intro captions | curtain leaving | opacity | 350ms | none | ease | CSS |
| Hero title letters | intro end | opacity, blur 10px to 0 | 700ms opacity, 1100ms blur | 28ms per letter + 150ms | ease-out / (.22,1,.36,1) | CSS with --i per letter |
| Hero wordmark (big ORA) | intro end | opacity, blur 16px to 0 | 720ms / 1200ms | 500ms | ease-out / (.22,1,.36,1) | CSS |
| Contract pill | intro end | opacity, translateY 8px | 800ms | 900ms | ease / (.22,1,.36,1) | CSS |
| Hero painting card | intro end, then scroll | scale 0.56 to 0.5, then grows with scroll on 810px+ | 1600ms enter | 250ms after ready | cubic ease out | JS rAF |
| Hero sculptures | intro end, then scroll | translateX 100px to 0, opacity; parallax 0.3 and 0.4 of scroll; rotate -19 and 9 deg | 1600ms | with the card | cubic ease out | JS |
| Nav bar | scroll | hidden until 55% vh (translateY -140%), dark or light over sections | 600ms / 400ms | none | (.22,1,.36,1) | JS toggles classes |
| Statement words | scroll | opacity .18 to 1, blur 4px to 0, word by word with scroll | 500ms | scroll linked | ease | JS + CSS |
| Problem card | scroll | width 52% to 100% | scroll linked | none | cubic | JS |
| h2 word reveals | 12% into view | opacity, blur 12px, translateY 10px | 800ms / 1000ms | 60ms per word | ease / (.22,1,.36,1) | IO + CSS |
| Stat count ups | into view | number 0 to target | 1600ms | none | cubic ease out | IO + rAF |
| Image reveal curtains | into view | 7 columns translateY -102% | 900ms | none | (.76,0,.24,1) | IO + CSS |
| How it works panel | scroll at step 4 | night panel opacity, dark and light text swap | scroll linked over 450px | none | linear | JS |
| Step index | scroll | active 1, others .4 opacity | 400ms | none | ease | JS |
| Markets ticker | timer, rAF | translateX at 40px/s; hover eases to .25 speed (lerp .08) | continuous | none | lerp | JS, pauses offscreen |
| Sources strip | timer, rAF | translateX at 50px/s | continuous | none | lerp | JS |
| Buttons | hover | arrow slides through, label padding | 450ms | none | (.22,1,.36,1) | CSS |
| FAQ | click | height, plus icon rotates 45deg | 500ms / 450ms | none | (.22,1,.36,1) | JS + CSS |
| Mobile sheet | click | opacity, translateY -12px | 450ms | none | (.22,1,.36,1) | CSS keyframes |

Cursor effects: none. Page transitions: none.

## Fonts and color roles

- Display: Ancizar Serif 300 and 400. UI: TASA Orbiter 400 and 500. Labels and buttons: Bitcount
  Grid Single. Numbers and addresses: Azeret Mono. All are self hosted.
- Cream canvas `#f3f1ed`, night sections `#1d1d1d` and `#000`, ink `#000` and brand ink `#16181a`,
  grey `#949494`, FAQ blue `#acc0d2`. State washes on the app pages: green (onchain), purple
  (issuer), amber (reported).

## Layout and section order

Full width sections with 40px gutters (16px on phones), cards at an 8px radius, and a floating
20px radius nav bar. Breakpoints are 1440, 1200, 810 and 810 down.

| Reference | Ora |
|---|---|
| Hero | Hero, with the Ora token pill |
| Statement | Statement |
| Problem card | Problem card |
| At a glance stats | At a glance stats |
| How it works, 4 sticky steps | How it works, 4 steps |
| Rights map ticker, 6 cards | Markets ticker, 6 cards with stock charts |
| Sources strip | Sources strip |
| FAQ | FAQ |
| Call to action | Call to action |
| Footer | Footer |

Nothing was dropped. The brief's separate sections fit into the existing ones: the contract strip
is the template's hero pill, the markets are the ticker cards, and the AI calls live in Docs and on
the agent page.
