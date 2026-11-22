// Builds one indexable page per card (/cards/<slug>/), a gallery hub (/cards/) and sitemap.xml.
// Source of truth stays in index.html (CATEGORY_INTERPRETATIONS, CARD_IMAGES) so a wording fix
// made there reaches the card pages on the next build. Styles live in css/cards.css.
//
//   python3 tools/thumbs.py                    # after adding card images
//   node tools/build-cards.mjs                 # uses SITE_URL below
//   SITE_URL=https://example.co.il node tools/build-cards.mjs
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { loadCards } from "./extract.mjs";

const SITE = (process.env.SITE_URL || "https://veredvi061080-ai.github.io/baba").replace(/\/$/, "");
const slugs = JSON.parse(readFileSync("data/slugs.json", "utf8"));
const verses = existsSync("data/verses.json") ? JSON.parse(readFileSync("data/verses.json", "utf8")) : {};
const config = readFileSync("js/config.js", "utf8");
const PRICE = Number((config.match(/price:\s*(\d+)/) || [])[1] || 250);
const { cards, meta } = loadCards();
// Cache-buster for css/js links: GitHub Pages lets browsers keep files for 10 minutes.
const V = Date.now().toString(36);

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
const url = (c) => `${SITE}/cards/${slugs[c.name]}/`;
const thumb = (img) => img.replace(/^assets\/(.+)\.jpg$/, "assets/thumbs/$1.webp");

// One card face: the photo when there is one, otherwise the deck's back with a name plaque.
const face = (c, { big = false, lazy = true } = {}) =>
  c.image
    ? `<img src="${SITE}/${big ? c.image : thumb(c.image)}" alt="קלף ${esc(c.name)} מחפיסת באבא" ${big ? 'fetchpriority="high"' : lazy ? 'loading="lazy"' : ""} decoding="async" width="${big ? 900 : 360}" height="${big ? 1350 : 540}">`
    : `<div class="ph" role="img" aria-label="קלף ${esc(c.name)}"><span>${esc(c.name)}</span></div>`;

const tile = (c, showGroup = false) =>
  `<a class="tile" href="${url(c)}"><span class="face">${face(c)}</span><span class="nm">${esc(c.name)}</span>${
    showGroup ? `<span class="gp">${esc(GROUP_LABEL[c.group])}</span>` : ""}</a>`;

const ORN = `<svg class="orn" viewBox="0 0 180 18" aria-hidden="true"><path d="M0 9h70M110 9h70" stroke="currentColor" stroke-width="1"/><path d="M90 1l8 8-8 8-8-8z" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="90" cy="9" r="2.4" fill="currentColor"/><circle cx="76" cy="9" r="1.6" fill="currentColor"/><circle cx="104" cy="9" r="1.6" fill="currentColor"/></svg>`;

const head = ({ title, desc, path, image, ld, preload }) => `<!doctype html>
<html lang="he" dir="rtl"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#faf5e8">
<link rel="canonical" href="${SITE}${path}">
<meta property="og:type" content="article"><meta property="og:locale" content="he_IL"><meta property="og:site_name" content="באבא">
<meta property="og:url" content="${SITE}${path}"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
${image ? `<meta property="og:image" content="${SITE}/${image}">` : ""}
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;700;900&family=Heebo:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${SITE}/css/cards.css?v=${V}">
${preload ? `<link rel="preload" as="image" href="${SITE}/${preload}">` : ""}
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
</head><body>
<header class="top"><div class="wrap">
<a class="logo" href="${SITE}/">באבא<span>.</span></a>
<nav><a class="hide-sm" href="${SITE}/">הבית</a><a href="${SITE}/cards/"${path === "/cards/" ? ' aria-current="page"' : ""}>כל הקלפים</a><a class="pill pill-gold" href="${SITE}/order/">להזמנה</a></nav>
</div></header>`;

const band = `<section class="wrap"><div class="band">
<div><h2>72 קלפים כאלה, <em>בקופסה אחת</em></h2>
<p>חפיסת באבא בהשראת שלושת הפרקים הראשונים בספר בראשית: קלף, פסוק ופירוש לכל מצב, לעבודה אישית, זוגית או טיפולית.</p></div>
<div class="buy"><div class="price">${PRICE} <small>₪</small></div><a class="pill pill-gold" href="${SITE}/order/">להזמנת החפיסה</a></div>
</div></section>`;

const foot = (track = "") => `<footer><div class="wrap">
<span>חפיסת באבא · 72 קלפי ייעוץ והכוונה בהשראת ספר בראשית</span>
<span><a href="${SITE}/cards/">כל הקלפים</a> · <a href="${SITE}/order/">הזמנה</a> · <a href="https://www.instagram.com/baba713994" target="_blank" rel="noopener">אינסטגרם</a></span>
</div></footer>
<script src="${SITE}/js/config.js?v=${V}"></script><script src="${SITE}/js/track.js?v=${V}"></script>${track}
</body></html>\n`;

// Gentle 3D tilt of the hero card toward the pointer (skipped for touch and reduced motion).
const TILT = `<script>(function(){var s=document.querySelector('.stage'),t=s&&s.querySelector('.tilt');if(!t||matchMedia('(hover:none),(prefers-reduced-motion:reduce)').matches)return;
s.addEventListener('pointermove',function(e){var r=s.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;t.style.transform='rotateY('+(x*14)+'deg) rotateX('+(-y*12)+'deg)'});
s.addEventListener('pointerleave',function(){t.style.transform=''})})()</script>`;

// Internal links/images become relative (canonical, og and JSON-LD stay absolute), so the
// same files work on GitHub Pages under /baba/, on the final domain and in local preview.
const relativize = (html, depth) => {
  const up = "../".repeat(depth);
  const cut = html.indexOf("<link rel=\"stylesheet\"");
  return html.slice(0, cut) + html.slice(cut).replace(new RegExp(`(href|src)="${SITE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/`, "g"), `$1="${up}`);
};

const crumbsLd = (items) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, u], i) => ({ "@type": "ListItem", position: i + 1, name, item: u })),
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
  const group = GROUP_LABEL[c.group];
  const title = `${c.name} - פירוש הקלף | חפיסת באבא`;
  const desc = clip(`פירוש קלף "${c.name}" (${group}) מחפיסת באבא: ${c.text}`, 155);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "DefinedTerm", name: c.name, description: verse ? `${c.text} (${verse.ref})` : c.text, url: SITE + path,
        inDefinedTermSet: { "@type": "DefinedTermSet", name: "חפיסת באבא - 72 קלפים", url: `${SITE}/cards/` },
        ...(c.image ? { image: `${SITE}/${c.image}` } : {}) },
      crumbsLd([["באבא", `${SITE}/`], ["כל הקלפים", `${SITE}/cards/`], [c.name, SITE + path]]),
    ],
  };
  const pagerLink = (x, cls, label) =>
    `<a class="${cls}" href="${url(x)}"><span class="mini">${face(x)}</span><span><small>${label}</small><strong>${esc(x.name)}</strong></span></a>`;
  const html = `${head({ title, desc, path, image: c.image, ld, preload: c.image })}
<main class="wrap">
<nav class="crumbs rise" aria-label="פירורי לחם"><a href="${SITE}/">באבא</a><i>/</i><a href="${SITE}/cards/">כל הקלפים</a><i>/</i><span>${esc(group)}</span></nav>
<article class="hero">
<div class="stage rise d1"><div class="float"><div class="tilt">${face(c, { big: true })}</div></div></div>
<div>
<div class="eyebrow rise d1"><b>${i + 1}/72</b>${esc(group)}</div>
<h1 class="rise d2">${esc(c.name)}</h1>
${ORN.replace('class="orn"', 'class="orn rise d2"')}
${verse ? `<blockquote class="verse rise d3">${esc(verse.text)}<cite>${esc(verse.ref)}</cite></blockquote>` : ""}
<section class="meaning rise d4"><h2>משמעות הקלף</h2><p>${esc(c.text)}</p></section>
<div class="actions rise d5"><a class="pill pill-gold" href="${SITE}/order/">להזמנת החפיסה · ${PRICE} ₪</a><a class="pill pill-ghost" href="${SITE}/cards/">לכל 72 הקלפים</a></div>
</div>
</article>
${siblings.length ? `<section class="sec"><div class="sec-h"><h2>עוד מ${esc(group)}</h2><a href="${SITE}/cards/#${c.group}">לכל הקבוצה ←</a></div>
<div class="strip">${siblings.map((s) => tile(s)).join("")}</div></section>` : ""}
<nav class="pager" aria-label="קלפים סמוכים">${pagerLink(prev, "pv", "הקלף הקודם")}${pagerLink(next, "nx", "הקלף הבא")}</nav>
</main>
${band}
${foot(`${TILT}<script>babaTrack('ViewContent',{content_name:${JSON.stringify(c.name).replace(/</g, "\\u003c")},content_category:${JSON.stringify(group)}})</script>`)}`;
  mkdirSync(`cards/${slug}`, { recursive: true });
  writeFileSync(`cards/${slug}/index.html`, relativize(html, 2));
});

// ---- hub (gallery with group filter) ----
const groups = [...new Set(cards.map((c) => c.group))];
const hubLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "DefinedTermSet", name: "חפיסת באבא - 72 קלפים", url: `${SITE}/cards/`,
      hasDefinedTerm: cards.map((c) => ({ "@type": "DefinedTerm", name: c.name, url: url(c) })) },
    crumbsLd([["באבא", `${SITE}/`], ["כל הקלפים", `${SITE}/cards/`]]),
  ],
};
const FILTER = `<script>(function(){var chips=[].slice.call(document.querySelectorAll('.chip')),grps=[].slice.call(document.querySelectorAll('.grp'));
function show(g){chips.forEach(function(c){c.setAttribute('aria-pressed',c.dataset.g===g)});grps.forEach(function(s){s.hidden=g!=='all'&&s.id!==g})}
chips.forEach(function(c){c.addEventListener('click',function(){show(c.dataset.g);history.replaceState(null,'',c.dataset.g==='all'?location.pathname:'#'+c.dataset.g);
var top=document.querySelector('.chips').offsetTop-60;if(scrollY>top)scrollTo({top:top})})});
var h=location.hash.slice(1);if(h&&document.getElementById(h))show(h)})()</script>`;
writeFileSync("cards/index.html", relativize(`${head({
  title: "72 הקלפים והפירושים | חפיסת באבא",
  desc: "כל 72 הקלפים של חפיסת באבא עם הפירוש של כל קלף: ימי הבריאה, עונות השנה, עץ הבריאה ו-4 האלמנטים.",
  path: "/cards/", image: cards.find((c) => c.image)?.image, ld: hubLd })}
<main class="wrap">
<section class="hub-hero">
<nav class="crumbs rise" aria-label="פירורי לחם" style="justify-content:center"><a href="${SITE}/">באבא</a><i>/</i><span>כל הקלפים</span></nav>
<div class="eyebrow rise d1" style="margin-top:22px">72 קלפים · 7 קבוצות</div>
<h1 class="rise d2">הקלפים של באבא</h1>
<p class="rise d3">לכל קלף פסוק מספר בראשית ופירוש. בחרו קבוצה, או פשוט קלף שמושך אתכם.</p>
${ORN.replace('class="orn"', 'class="orn rise d3"')}
</section>
<div class="chips rise d4" role="toolbar" aria-label="סינון לפי קבוצה">
<button class="chip" type="button" data-g="all" aria-pressed="true">הכל<span>72</span></button>
${groups.map((g) => `<button class="chip" type="button" data-g="${g}" aria-pressed="false">${esc(GROUP_LABEL[g])}<span>${cards.filter((c) => c.group === g).length}</span></button>`).join("\n")}
</div>
${groups.map((g) => {
    const list = cards.filter((c) => c.group === g);
    return `<section class="grp" id="${g}"><h2>${esc(GROUP_LABEL[g])} <small>${list.length} קלפים</small></h2>
<ul class="grid">${list.map((c) => `<li>${tile(c)}</li>`).join("")}</ul></section>`;
  }).join("\n")}
</main>
${band}
${foot(FILTER)}`, 1));

// ---- sitemap ----
const today = new Date().toISOString().slice(0, 10);
const urls = ["/", "/order/", "/cards/", ...cards.map((c) => `/cards/${slugs[c.name]}/`)];
writeFileSync("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`);

console.log(`built ${cards.length} card pages + hub, sitemap ${urls.length} URLs, verses ${Object.keys(verses).length}/72, images ${cards.filter((c) => c.image).length}/72, base ${SITE}`);
