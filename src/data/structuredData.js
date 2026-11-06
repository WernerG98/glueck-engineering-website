// Strukturierte Daten (schema.org) für FAQ und Fertigteile.
// Wird von den Seiten zur Laufzeit UND vom Prerender-Skript (scripts/prerender.mjs) genutzt,
// damit Crawler ohne JavaScript dieselben Daten sehen.
import faq from "./faq.js";
import fertigteile from "./fertigteile.js";

export const SITE_URL = "https://glueck-engineering.com";

function parsePrice(price) {
  return price.replace(/[^\d,]/g, "").replace(",", ".");
}

export const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export const fertigteileStructuredData = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: fertigteile.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Product",
      name: item.name,
      description: item.text,
      ...(item.image ? { image: `${SITE_URL}${item.image}` } : {}),
      url: `${SITE_URL}/fertigteile`,
      offers: {
        "@type": "Offer",
        price: parsePrice(item.price),
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/fertigteile`,
      },
    },
  })),
};
