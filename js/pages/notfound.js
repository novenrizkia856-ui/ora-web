// 404: the dark painted hero, full height, with one way home.
import { boot, copy, $, btn, pageHero, refreshNav } from "../app.js";

boot({ page: "404" });
const N = copy.notFound;
const hero = pageHero({ label: N.label, title: N.title, lede: N.lede, art: "hero-valley.avif", children: [btn(N.cta, { href: "/", variant: "light" })] });
hero.classList.add("lost");
$("[data-page]").append(hero);
refreshNav();
