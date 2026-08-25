import Stripe from "stripe";
import { Resend } from "resend";

export const config = {
  api: {
    bodyParser: false,
  },
};

const resend = new Resend(process.env.RESEND_API_KEY);

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function formatAmount(cents, currency) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: currency.toUpperCase() }).format(
    cents / 100,
  );
}

function buildAddressHtml(shipping) {
  if (!shipping?.address) return "-";
  const a = shipping.address;
  return [shipping.name, a.line1, a.line2, `${a.postal_code} ${a.city}`, a.country]
    .filter(Boolean)
    .join("<br/>");
}

function buildInternalHtml(session, lineItems) {
  return `
    <h2>Neue Bestellung über den Shop</h2>
    <p><strong>Betrag:</strong> ${formatAmount(session.amount_total, session.currency)}</p>
    <p><strong>Produkt:</strong> ${session.metadata?.itemName || "-"} (Menge: ${lineItems[0]?.quantity ?? 1})</p>
    <p><strong>Kunde:</strong> ${session.customer_details?.name || "-"}</p>
    <p><strong>E-Mail:</strong> ${session.customer_details?.email || "-"}</p>
    <p><strong>Lieferadresse:</strong><br/>${buildAddressHtml(session.shipping_details)}</p>
    <p><strong>Stripe Session:</strong> ${session.id}</p>
  `;
}

function buildCustomerHtml(session, lineItems) {
  return `
    <h2>Vielen Dank für deine Bestellung</h2>
    <p>Hallo${session.customer_details?.name ? " " + session.customer_details.name : ""},</p>
    <p>deine Bestellung bei <strong>Glück Engineering</strong> ist erfolgreich eingegangen.</p>
    <hr />
    <p><strong>Produkt:</strong> ${session.metadata?.itemName || "-"} (Menge: ${lineItems[0]?.quantity ?? 1})</p>
    <p><strong>Gesamtbetrag inkl. Versand:</strong> ${formatAmount(session.amount_total, session.currency)}</p>
    <p><strong>Lieferadresse:</strong><br/>${buildAddressHtml(session.shipping_details)}</p>
    <hr />
    <p>Wir melden uns, sobald das Paket versendet wurde.</p>
    <p>Viele Grüße</p>
    <p><strong>Glück Engineering</strong><br/>M.Eng. Werner Glück</p>
  `;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Methode nicht erlaubt." });
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Stripe-Umgebungsvariablen fehlen.");
    return res.status(500).json({ error: "Server-Konfiguration unvollständig." });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const rawBody = await readRawBody(req);
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("Stripe-Webhook-Signaturprüfung fehlgeschlagen:", error.message);
    return res.status(400).json({ error: "Ungültige Signatur." });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

      const toEmail = process.env.CONTACT_TO_EMAIL;
      const fromEmail = process.env.CONTACT_FROM_EMAIL;

      if (toEmail && fromEmail) {
        await resend.emails.send({
          from: fromEmail,
          to: toEmail,
          subject: `Neue Bestellung: ${session.metadata?.itemName || "Fertigteil"}`,
          html: buildInternalHtml(session, lineItems.data),
        });

        if (session.customer_details?.email) {
          await resend.emails.send({
            from: fromEmail,
            to: session.customer_details.email,
            subject: "Bestätigung deiner Bestellung bei Glück Engineering",
            html: buildCustomerHtml(session, lineItems.data),
          });
        }
      }
    } catch (error) {
      console.error("Fehler beim Versand der Bestellbestätigung:", error);
    }
  }

  return res.status(200).json({ received: true });
}
