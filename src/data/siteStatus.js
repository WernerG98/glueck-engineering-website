// Schnellzugriff für den Betrieb: hier anpassen, wenn sich Lieferzeit oder
// Kapazität ändert. Keine weiteren Code-Änderungen nötig.

// Auf false setzen, um das Kontaktformular vorübergehend zu pausieren
// (z. B. bei zu vielen Anfragen). Alle "Anfrage senden"-Buttons bleiben
// sichtbar, öffnen dann aber einen Hinweis statt des Formulars.
export const ACCEPTING_REQUESTS = true;

// Wird im Banner oben auf jeder Seite angezeigt, solange ACCEPTING_REQUESTS true ist.
export const LEAD_TIME = "1 Woche";

// Pauschale Versandkosten für den Direktkauf von Fertigteilen, in Cent.
// Wird sowohl im Stripe-Checkout als auch im Preishinweis auf der Seite verwendet.
export const SHIPPING_COST_CENTS = 499;
export const SHIPPING_COST_LABEL = "4,99 €";
