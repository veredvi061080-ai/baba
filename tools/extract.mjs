// Reads the card data that lives inside index.html (the site owner edits it there),
// so the generated card pages can never drift from the popup text.
import { readFileSync } from "node:fs";

const grab = (src, name) => {
  const m = src.match(new RegExp(`var ${name} *= *(\\{[\\s\\S]*?\\});\\n`));
  if (!m) throw new Error(`index.html: ${name} not found`);
  return JSON.parse(m[1]);
};

export function loadCards(indexPath = "index.html") {
  const src = readFileSync(indexPath, "utf8");
  const groups = grab(src, "CATEGORY_INTERPRETATIONS");
  const meta = grab(src, "CATEGORY_META");
  const images = grab(src, "CARD_IMAGES");
  // Day and season cards are not in CARD_IMAGES; their images sit in the gallery as
  // <figure data-card="name"><img src="assets/x.jpg">. Fill any gaps from there.
  for (const m of src.matchAll(/data-card="([^"]+)"[^>]*>\s*<img[^>]*src="(assets\/[^"]+\.jpg)"/g)) {
    if (!images[m[1]]) images[m[1]] = m[2];
  }
  const cards = [];
  for (const [group, entries] of Object.entries(groups)) {
    for (const [name, text] of Object.entries(entries)) {
      cards.push({ name, group, text, image: images[name] || null });
    }
  }
  return { cards, meta };
}

// Hebrew -> ASCII slug. Flat ASCII URLs avoid percent-encoded Hebrew in links and shares.
const MAP = { א:"a",ב:"b",ג:"g",ד:"d",ה:"h",ו:"v",ז:"z",ח:"ch",ט:"t",י:"y",כ:"k",ך:"ch",ל:"l",מ:"m",ם:"m",
  נ:"n",ן:"n",ס:"s",ע:"a",פ:"p",ף:"f",צ:"tz",ץ:"tz",ק:"k",ר:"r",ש:"sh",ת:"t" };
export const slugify = (he) =>
  he.replace(/[֑-ׇ]/g, "").split("").map((c) => MAP[c] ?? (/\s|-/.test(c) ? "-" : /[a-z0-9]/i.test(c) ? c.toLowerCase() : ""))
    .join("").replace(/-+/g, "-").replace(/^-|-$/g, "");
