// Builds one indexable page per card (/cards/<slug>/), a hub page (/cards/) and sitemap.xml.
// Source of truth stays in index.html (CATEGORY_INTERPRETATIONS, CARD_IMAGES) so a wording fix
// made there reaches the card pages on the next build.
//
//   node tools/build-cards.mjs                 # uses SITE_URL below
//   SITE_URL=https://example.co.il node tools/build-cards.mjs
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { loadCards } from "./extract.mjs";

const SITE = (process.env.SITE_URL || "https://veredvi061080-ai.github.io/baba").replace(/\/$/, "");
const slugs = JSON.parse(readFileSync("data/slugs.json", "utf8"));
const verses = existsSync("data/verses.json") ? JSON.parse(readFileSync("data/verses.json", "utf8")) : {};
const { cards, meta } = loadCards();

const GROUP_LABEL = {
  days: "ימי הבריאה",
  seasons: "עונות השנה",
  tree: meta.tree?.he || "עץ הבריאה",
  fire: meta.fire?.he || "אלמנט אש",
  water: meta.water?.he || "אלמנט מים",
  earth: meta.earth?.he || "אלמנט אדמה",
  air: meta.air?.he || "אלמנט אוויר",
};

const missing = cards.filter((c) => !slugs[c.name]).map((c) => c.name);
if (missing.length) throw new Error(`data/slugs.json is missing a slug for: ${missing.join(", ")}`);

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const clip = (s, n) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(" ", n - 1)) + "…");

const CSS = `
:root{--gold-2:#c9962f;--gold-3:#8a621c;--gold-deep:#6b4a17;--black-1:#0e0c0a;--cream-1:#faf5e8;--cream-2:#f1e6cc;--ink:#241d15;
--serif:'Frank Ruhl Libre','David Libre',serif;--sans:'Heebo',sans-serif}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--sans);background:var(--cream-1);color:var(--ink);line-height:1.8}
a{color:var(--gold-deep)}
.top{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-bottom:1px solid rgba(201,150,47,.3)}
.top .logo{font-family:var(--serif);font-size:26px;font-weight:700;color:var(--gold-deep);text-decoration:none}
.top nav a{margin-inline-start:16px;text-decoration:none;font-weight:500}
main{max-width:760px;margin:0 auto;padding:28px 20px 60px}
.crumbs{font-size:13px;color:var(--gold-3);margin-bottom:18px}
.crumbs a{text-decoration:none}
h1{font-family:var(--serif);font-size:40px;line-height:1.2;color:var(--gold-deep)}
.group{color:var(--gold-3);font-size:15px;margin:6px 0 22px}
.card{display:grid;grid-template-columns:minmax(0,260px) 1fr;gap:28px;align-items:start}
.card img{width:100%;height:auto;display:block;border-radius:14px;box-shadow:0 14px 40px rgba(0,0,0,.18)}
.verse cite{display:block;font-family:var(--sans);font-style:normal;font-size:14px;color:var(--gold-3);margin-top:6px}
.verse{font-family:var(--serif);font-size:20px;border-inline-start:3px solid var(--gold-2);padding-inline-start:14px;margin-bottom:18px}
.meaning h2,.more h2{font-family:var(--serif);font-size:22px;color:var(--gold-deep);margin-bottom:6px}
.meaning p{font-size:18px}
.cta{display:inline-block;margin-top:24px;background:var(--black-1);color:var(--cream-1);padding:13px 26px;border-radius:999px;text-decoration:none;font-weight:600}
.pager{display:flex;justify-content:space-between;gap:12px;margin-top:40px;padding-top:18px;border-top:1px solid rgba(201,150,47,.3)}
.pager a{text-decoration:none}
.more{margin-top:34px}
.grid{display:flex;flex-wrap:wrap;gap:8px 14px;list-style:none}
.grid a{text-decoration:none}
.hub section{margin-bottom:30px}
.hub h2{font-family:var(--serif);font-size:24px;color:var(--gold-deep);margin-bottom:8px}
footer{text-align:center;font-size:13px;color:var(--gold-3);padding:24px}
@media (max-width:620px){.card{grid-template-columns:1fr}.card img{max-width:260px;margin:0 auto}h1{font-size:32px}}
`;

const head = ({ title, desc, path, image, ld }) => `<!doctype html>
<html lang="he" dir="rtl"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${path}">
<meta property="og:type" content="article"><meta property="og:locale" content="he_IL">
<meta property="og:url" content="${SITE}${path}"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
${image ? `<meta property="og:image" content="${SITE}/${image}">` : ""}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;700&family=Heebo:wght@400;500;600&display=swap" rel="stylesheet">
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head><body>
<header class="top"><a class="logo" href="${SITE}/">באבא</a>
<nav><a href="${SITE}/cards/">כל הקלפים</a><a href="${SITE}/order/">להזמנת החפיסה</a></nav></header>`;

const foot = `<footer>חפיסת באבא · 72 קלפי ייעוץ והכוונה בהשראת ספר בראשית</footer></body></html>\n`;

// Internal links/images become relative (canonical, og and JSON-LD stay absolute), so the
// same files work on GitHub Pages under /baba/, on the final domain and in local preview.
const relativize = (html, depth) => {
  const up = "../".repeat(depth);
  const cut = html.indexOf("</head>");
  return html.slice(0, cut) + html.slice(cut).replace(new RegExp(`(href|src)="${SITE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/`, "g"), `$1="${up}`);
};

const crumbsLd = (items) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, url], i) => ({ "@type": "ListItem", position: i + 1, name, item: url })),
});

// ---- card pages ----
rmSync("cards", { recursive: true, force: true });
cards.forEach((c, i) => {
  const slug = slugs[c.name];
  const path = `/cards/${slug}/`;
  const prev = cards[(i - 1 + cards.length) % cards.length];
  const next = cards[(i + 1) % cards.length];
  const siblings = cards.filter((x) => x.group === c.group && x !== c);
  const verse = verses[c.name];
  const title = `${c.name} - פירוש הקלף | חפיסת באבא`;
  const desc = clip(`פירוש קלף "${c.name}" (${GROUP_LABEL[c.group]}) מחפיסת באבא: ${c.text}`, 155);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "DefinedTerm", name: c.name, description: verse ? `${c.text} (${verse.ref})` : c.text, url: SITE + path,
        inDefinedTermSet: { "@type": "DefinedTermSet", name: "חפיסת באבא - 72 קלפים", url: `${SITE}/cards/` },
        ...(c.image ? { image: `${SITE}/${c.image}` } : {}) },
      crumbsLd([["באבא", `${SITE}/`], ["כל הקלפים", `${SITE}/cards/`], [c.name, SITE + path]]),
    ],
  };
  const html = `${head({ title, desc, path, image: c.image, ld })}
<main>
<div class="crumbs"><a href="${SITE}/">באבא</a> › <a href="${SITE}/cards/">כל הקלפים</a> › ${esc(GROUP_LABEL[c.group])}</div>
<div class="card">
${c.image ? `<img src="${SITE}/${c.image}" alt="קלף ${esc(c.name)} מחפיסת באבא" loading="eager">` : `<div></div>`}
<div>
<h1>${esc(c.name)}</h1>
<div class="group">${esc(GROUP_LABEL[c.group])}</div>
${verse ? `<blockquote class="verse">"${esc(verse.text)}"<cite>${esc(verse.ref)}</cite></blockquote>` : ""}
<div class="meaning"><h2>משמעות הקלף</h2><p>${esc(c.text)}</p></div>
<a class="cta" href="${SITE}/order/">להזמנת חפיסת באבא</a>
</div></div>
${siblings.length ? `<div class="more"><h2>עוד קלפים ב${esc(GROUP_LABEL[c.group])}</h2><ul class="grid">${siblings
    .map((s) => `<li><a href="${SITE}/cards/${slugs[s.name]}/">${esc(s.name)}</a></li>`).join("")}</ul></div>` : ""}
<div class="pager"><a href="${SITE}/cards/${slugs[next.name]}/">→ ${esc(next.name)}</a><a href="${SITE}/cards/${slugs[prev.name]}/">${esc(prev.name)} ←</a></div>
</main>
${foot}`;
  mkdirSync(`cards/${slug}`, { recursive: true });
  writeFileSync(`cards/${slug}/index.html`, relativize(html, 2));
});

// ---- hub ----
const groups = [...new Set(cards.map((c) => c.group))];
const hubLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "DefinedTermSet", name: "חפיסת באבא - 72 קלפים", url: `${SITE}/cards/`,
      hasDefinedTerm: cards.map((c) => ({ "@type": "DefinedTerm", name: c.name, url: `${SITE}/cards/${slugs[c.name]}/` })) },
    crumbsLd([["באבא", `${SITE}/`], ["כל הקלפים", `${SITE}/cards/`]]),
  ],
};
writeFileSync("cards/index.html", relativize(`${head({
  title: "72 הקלפים והפירושים | חפיסת באבא",
  desc: "כל 72 הקלפים של חפיסת באבא עם הפירוש של כל קלף: ימי הבריאה, עונות השנה, עץ הבריאה ו-4 האלמנטים.",
  path: "/cards/", image: cards.find((c) => c.image)?.image, ld: hubLd })}
<main class="hub">
<div class="crumbs"><a href="${SITE}/">באבא</a> › כל הקלפים</div>
<h1>72 הקלפים של באבא</h1>
<p class="group">לכל קלף דף עם המשמעות שלו. בחרו קלף:</p>
${groups.map((g) => `<section><h2>${esc(GROUP_LABEL[g])}</h2><ul class="grid">${cards.filter((c) => c.group === g)
    .map((c) => `<li><a href="${SITE}/cards/${slugs[c.name]}/">${esc(c.name)}</a></li>`).join("")}</ul></section>`).join("\n")}
<a class="cta" href="${SITE}/order/">להזמנת חפיסת באבא</a>
</main>
${foot}`, 1));

// ---- sitemap ----
const today = new Date().toISOString().slice(0, 10);
const urls = ["/", "/order/", "/cards/", ...cards.map((c) => `/cards/${slugs[c.name]}/`)];
writeFileSync("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`);

console.log(`built ${cards.length} card pages + hub, sitemap ${urls.length} URLs, verses ${Object.keys(verses).length}/72, images ${cards.filter((c) => c.image).length}/72, base ${SITE}`);
