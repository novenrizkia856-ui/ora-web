"""Build the Ora logo files from the template's Ancizar Serif, so the wordmark matches the page type.
Run: python -I _notes/make-logo.py   (needs fontTools and brotli)"""
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from pathlib import Path

root = Path(__file__).resolve().parent.parent
font = TTFont(root / "assets/fonts/ancizar-serif-400-1.woff2")
gs, cmap, upm = font.getGlyphSet(), font.getBestCmap(), font["head"].unitsPerEm
H = 745                      # same height as the RELL lockup, so the nav sizing carries over
size = 820 / upm * 1.0       # glyph scale
base = 600                   # baseline y

def word(text, x0):
    pen = SVGPathPen(gs)
    x = x0
    for ch in text:
        g = cmap[ord(ch)]
        tp = TransformPen(pen, (size, 0, 0, -size, x, base))
        gs[g].draw(tp)
        x += gs[g].width * size
    return pen.getCommands(), x

# mark: an open ring with a heavier lower arc and an orbit dot sitting in the gap,
# so it reads as a mark and not as a letter O next to the wordmark
import math
cx, cy, r = 300, 372, 232
def pt(deg, rad=r):
    a = math.radians(deg)
    return cx + rad * math.cos(a), cy - rad * math.sin(a)
g0, g1 = 20, 70                      # the gap, in degrees, at the top right
x0, y0 = pt(g1); x1, y1 = pt(g0 + 360)
ring = f'M{x0:.1f} {y0:.1f} A{r} {r} 0 1 0 {x1:.1f} {y1:.1f}'
lx0, ly0 = pt(200); lx1, ly1 = pt(340)
low = f'M{lx0:.1f} {ly0:.1f} A{r} {r} 0 0 0 {lx1:.1f} {ly1:.1f}'
dx, dy = pt(45, r + 20)
mark = (f'<path d="{ring}" fill="none" stroke="INK" stroke-width="70" stroke-linecap="round"/>'
        f'<path d="{low}" fill="none" stroke="INK" stroke-width="150" stroke-linecap="round"/>'
        f'<circle cx="{dx:.1f}" cy="{dy:.1f}" r="62" fill="INK"/>')
d, end = word("ora", 640)
W = int(end + 40)

def svg(ink, w, body, label="Ora"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {H}" role="img" aria-label="{label}">'
            + body.replace("INK", ink) + "</svg>\n")

lock = mark + f'<path fill="INK" d="{d}"/>'
brand = root / "assets/brand"
(brand / "logo-lockup.svg").write_text(svg("#16181a", W, lock), encoding="utf-8")
(brand / "logo-lockup-inverse.svg").write_text(svg("#ffffff", W, lock), encoding="utf-8")
(brand / "logo-mark.svg").write_text(svg("#16181a", 600, mark), encoding="utf-8")
(brand / "logo-mark-inverse.svg").write_text(svg("#ffffff", 600, mark), encoding="utf-8")
fav = mark
(brand / "favicon.svg").write_text(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 745"><rect y="72" width="600" height="600" rx="120" fill="#16181a"/>'
    + fav.replace("INK", "#ffffff") + "</svg>\n", encoding="utf-8")
print("lockup width", W)
