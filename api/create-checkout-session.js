import Stripe from "stripe";
import fertigteile from "../src/data/fertigteile.js";
import { SHIPPING_COST_CENTS } from "../src/data/siteStatus.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Methode nicht erlaubt." });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("STRIPE_SECRET_KEY fehlt.");
    return res.status(500).json({ error: "Server-Konfiguration unvollständig." });
  }

  const itemId = typeof req.body?.itemId === "string" ? req.body.itemId : "";
  const item = fertigteile.find((entry) => entry.id === itemId);

  if (!item) {
    return res.status(400).json({ error: "Unbekanntes Produkt." });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = req.headers.origin || `https://${req.headers.host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "de",
      payment_method_types: ["card", "sepa_debit"],
      shipping_address_collection: { allowed_countries: ["DE", "AT", "CH"] },
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: item.name,
              images: [`${origin}${item.image}`],
            },
            unit_amount: item.priceCents,
            tax_behavior: "inclusive",
          },
          quantity: 1,
          adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 },
        },
      ],
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: SHIPPING_COST_CENTS, currency: "eur" },
            display_name: "Versand",
            tax_behavior: "inclusive",
          },
        },
      ],
      metadata: {
        itemId: item.id,
        itemName: item.name,
      },
      success_url: `${origin}/fertigteile?checkout=success`,
      cancel_url: `${origin}/fertigteile?checkout=cancelled`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Fehler beim Erstellen der Checkout-Session:", error);
    return res.status(500).json({ error: "Beim Start der Bezahlung ist ein Fehler aufgetreten." });
  }
}
