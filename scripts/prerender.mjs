// Läuft nach "vite build": erzeugt pro Seite eine eigene HTML-Datei mit passendem
// Titel, Beschreibung, Canonical, Open-Graph-Daten, strukturierten Daten und einem
// <noscript>-Inhalt. So sehen Link-Vorschauen (WhatsApp, LinkedIn ...) und Crawler ohne
// JavaScript sofort die richtigen Angaben. Zusätzlich entsteht 404.html, damit unbekannte
// Adressen auch wirklich mit Status 404 antworten.
//
// Die React-App übernimmt im Browser wie bisher (createRoot) und ersetzt/aktualisiert alles.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

const SITE_URL = "https://glueck-engineering.com";
const SITE_NAME = "Glück Engineering";
const HOME_TITLE = `${SITE_NAME} – Fertigteile, 3D-Druck & 3D-Artworks`;
const HOME_DESCRIPTION =
  "Individuelle Fertigteile, technische 3D-Drucklösungen und mehrschichtige 3D-Artworks aus einer Hand.";
const CONTACT_EMAIL = "info@glueckengineering.com";

// Muss zu den <PageMeta>-Angaben in src/pages passen (wird unten geprüft).
const ROUTES = [
  { path: "/service", file: "ServicePage.jsx", title: "3D-Druck Dienstleistung", description: "Individuelle 3D-Drucklösungen für funktionale Bauteile, Prototypen und Kleinserien – von der Beratung bis zur fertigen Bauteilproduktion." },
  { path: "/fertigteile", file: "FertigteilePage.jsx", title: "Fertigteile", description: "Passgenaue Ersatz- und Zubehörteile für VW Bus (T3/T4/T5/T6) und weitere Fahrzeuge, direkt ab Lager fertigbar.", jsonLd: { id: "fertigteile-structured-data", key: "fertigteileStructuredData" } },
  { path: "/artworks", file: "ArtworksPage.jsx", title: "3D-Artworks", description: "Individuelle, mehrschichtige 3D-Artworks mit ausgeprägter Tiefenwirkung, schwarz-weiß oder mehrfarbig nach deinem Motiv." },
  { path: "/materialien", file: "MaterialienPage.jsx", title: "Material-Guide", description: "Vergleich aller verwendeten 3D-Druck-Filamente nach Hitzebeständigkeit, Festigkeit, Flexibilität, UV-Beständigkeit und Preisklasse." },
  { path: "/faq", file: "FAQPage.jsx", title: "Häufige Fragen", description: "Antworten auf häufige Fragen zu Lieferzeit, Materialien, Ablauf und Bestellung bei Glück Engineering.", jsonLd: { id: "faq-structured-data", key: "faqStructuredData" } },
  { path: "/impressum", file: "ImpressumPage.jsx", title: "Impressum", description: "Impressum und Anbieterkennzeichnung von Glück Engineering." },
  { path: "/datenschutz", file: "DatenschutzPage.jsx", title: "Datenschutzerklärung", description: "Datenschutzerklärung von Glück Engineering gemäß DSGVO." },
  { path: "/agb", file: "AGBPage.jsx", title: "AGB & Widerrufsbelehrung", description: "Allgemeine Geschäftsbedingungen und Widerrufsbelehrung von Glück Engineering." },
];

const NAV_LINKS = [
  { path: "/", label: "Startseite" },
  { path: "/service", label: "3D-Druck Dienstleistung" },
  { path: "/fertigteile", label: "Fertigteile" },
  { path: "/artworks", label: "3D-Artworks" },
  { path: "/materialien", label: "Material-Guide" },
  { path: "/faq", label: "Häufige Fragen" },
  { path: "/impressum", label: "Impressum" },
  { path: "/datenschutz", label: "Datenschutz" },
  { path: "/agb", label: "AGB & Widerruf" },
];

const escapeHtml = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const jsonForScript = (data) => JSON.stringify(data).replace(/</g, "\\u003c");

function replaceOnce(html, pattern, replacement, label) {
  if (!pattern.test(html)) {
    throw new Error(`Prerender: "${label}" im Template nicht gefunden (index.html geändert?)`);
  }
  return html.replace(pattern, () => replacement);
}

function setHead(html, { title, ogTitle, description, url }) {
  let out = html;
  out = replaceOnce(out, /<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`, "title");
  out = replaceOnce(out, /<meta\s+name="description"\s+content="[^"]*"\s*\/>/, `<meta name="description" content="${escapeHtml(description)}" />`, "description");
  out = replaceOnce(out, /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/, `<meta property="og:title" content="${escapeHtml(ogTitle)}" />`, "og:title");
  out = replaceOnce(out, /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`, "og:description");
  out = replaceOnce(out, /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/, `<meta property="og:url" content="${url}" />`, "og:url");
  out = replaceOnce(out, /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${escapeHtml(ogTitle)}" />`, "twitter:title");
  out = replaceOnce(out, /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`, "twitter:description");
  return out;
}

function addToHead(html, snippet) {
  return replaceOnce(html, /<\/head>/, `    ${snippet}\n  </head>`, "</head>");
}

function buildNoscript({ heading, description, extra = "" }) {
  const links = NAV_LINKS.map((l) => `<li><a href="${l.path}">${escapeHtml(l.label)}</a></li>`).join("");
  return `<noscript>
      <main style="max-width:48rem;margin:0 auto;padding:2rem 1rem;font-family:system-ui,sans-serif;line-height:1.6;color:#e5e5e5">
        <h1>${escapeHtml(heading)}</h1>
        <p>${escapeHtml(description)}</p>
        ${extra}
        <nav aria-label="Seiten"><ul>${links}</ul></nav>
        <p>${SITE_NAME} · Inhaber M.Eng. Werner Glück · 94424 Arnstorf · <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
      </main>
    </noscript>`;
}

function addNoscript(html, noscript) {
  return replaceOnce(html, /<div id="root"><\/div>/, `<div id="root"></div>\n    ${noscript}`, 'div#root');
}

const read = (p) => fs.readFileSync(p, "utf8");
const write = (p, content) => fs.writeFileSync(p, content);

async function main() {
  const templatePath = path.join(dist, "index.html");
  if (!fs.existsSync(templatePath)) throw new Error("dist/index.html fehlt. Zuerst 'vite build' ausführen.");
  const template = read(templatePath);

  const faq = (await import(pathToFileURL(path.join(root, "src/data/faq.js")).href)).default;
  const fertigteile = (await import(pathToFileURL(path.join(root, "src/data/fertigteile.js")).href)).default;
  const structured = await import(pathToFileURL(path.join(root, "src/data/structuredData.js")).href);

  const extras = {
    "/faq": `<h2>Häufige Fragen</h2><dl>${faq
      .map((item) => `<dt><strong>${escapeHtml(item.question)}</strong></dt><dd>${escapeHtml(item.answer)}</dd>`)
      .join("")}</dl>`,
    "/fertigteile": `<h2>Fertigteile</h2><ul>${fertigteile
      .map((item) => `<li><strong>${escapeHtml(item.name)}</strong> (${escapeHtml(item.price)}): ${escapeHtml(item.text)}</li>`)
      .join("")}</ul>`,
  };

  // Abgleich mit den PageMeta-Angaben der Seiten, damit nichts auseinanderläuft
  for (const route of ROUTES) {
    const source = read(path.join(root, "src/pages", route.file));
    for (const [label, value] of [["Titel", route.title], ["Beschreibung", route.description]]) {
      if (!source.includes(value)) {
        console.warn(`Prerender-Warnung: ${label} von ${route.path} weicht von src/pages/${route.file} ab: "${value}"`);
      }
    }
  }

  // Startseite: vorhandene index.html ergänzen (Titel/Beschreibung stehen dort schon)
  let home = template;
  home = addToHead(home, `<link rel="canonical" href="${SITE_URL}" />`);
  home = addNoscript(home, buildNoscript({ heading: HOME_TITLE, description: HOME_DESCRIPTION }));
  write(templatePath, home);

  // Unterseiten als <pfad>.html (Vercel liefert sie mit "cleanUrls" unter /<pfad> aus)
  for (const route of ROUTES) {
    const url = `${SITE_URL}${route.path}`;
    const fullTitle = `${route.title} – ${SITE_NAME}`;
    let html = setHead(template, { title: fullTitle, ogTitle: fullTitle, description: route.description, url });
    html = addToHead(html, `<link rel="canonical" href="${url}" />`);
    if (route.jsonLd) {
      html = addToHead(
        html,
        `<script type="application/ld+json" id="${route.jsonLd.id}">${jsonForScript(structured[route.jsonLd.key])}</script>`
      );
    }
    html = addNoscript(
      html,
      buildNoscript({ heading: route.title, description: route.description, extra: extras[route.path] || "" })
    );
    write(path.join(dist, `${route.path.slice(1)}.html`), html);
  }

  // 404: gleiche App (zeigt die Fehlerseite), aber ohne Canonical und mit noindex
  const notFoundTitle = `Seite nicht gefunden – ${SITE_NAME}`;
  let notFound = setHead(template, {
    title: notFoundTitle,
    ogTitle: notFoundTitle,
    description: "Diese Seite existiert nicht.",
    url: SITE_URL,
  });
  notFound = addToHead(notFound, `<meta name="robots" content="noindex, follow" />`);
  notFound = addNoscript(
    notFound,
    buildNoscript({ heading: "Seite nicht gefunden", description: "Diese Seite existiert nicht. Hier geht es zurück zu den Angeboten." })
  );
  write(path.join(dist, "404.html"), notFound);

  console.log(`Prerender: Startseite, ${ROUTES.length} Unterseiten und 404.html geschrieben.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
