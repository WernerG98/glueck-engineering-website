import { Redis } from "@upstash/redis";
import { Resend } from "resend";
import { google } from "googleapis";
import { BUS_OPTIONS, EVENT_TITLE, MAX_PARTICIPANTS, PRICE_PER_PERSON_LABEL, REGISTRATION_DEADLINE } from "../src/data/veranstaltung.js";

const SIGNUPS_KEY = "veranstaltung:haslinger-hof-2026:signups";
const ADMIN_PASSWORD = process.env.EVENT_ADMIN_PASSWORD || "admin";
const resend = new Resend(process.env.RESEND_API_KEY);

// Google-Sheet-Sync ist optional: solange die drei Variablen fehlen, wird
// einfach nichts synchronisiert (kein Fehler für die eigentliche Anmeldung).
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

async function syncToGoogleSheet(signups) {
  if (!GOOGLE_SHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    return;
  }

  try {
    const auth = new google.auth.JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const header = ["Vorname", "Nachname", "E-Mail", "Bus", "Newsletter", "Bezahlt", "Angemeldet am"];
    const rows = signups.map((entry) => [
      entry.firstName,
      entry.lastName,
      entry.email,
      BUS_OPTIONS.find((option) => option.id === entry.bus)?.label || entry.bus,
      entry.newsletter ? "Ja" : "Nein",
      entry.paid ? "Ja" : "Nein",
      new Date(entry.createdAt).toLocaleString("de-DE"),
    ]);

    await sheets.spreadsheets.values.clear({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: "Anmeldungen!A1:Z1000",
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: "Anmeldungen!A1",
      valueInputOption: "RAW",
      requestBody: { values: [header, ...rows] },
    });
  } catch (error) {
    console.error("Fehler beim Sync mit Google Sheets:", error);
  }
}

// Vercels Marketplace-Integrationen für Upstash Redis setzen die
// Umgebungsvariablen je nach Anbindung unter unterschiedlichen Namen.
// Hier werden die gängigen Varianten abgedeckt.
const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.REDIS_URL;
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.REDIS_TOKEN;

function checkPassword(req) {
  const password = req.method === "GET" ? req.query?.password : req.body?.password;
  return password === ADMIN_PASSWORD;
}

async function getSignups(redis) {
  const raw = await redis.get(SIGNUPS_KEY);
  return Array.isArray(raw) ? raw : [];
}

// Ein Platz gilt erst als belegt, wenn die Zahlung bestätigt (Haken bei "Bezahlt") wurde.
function busCounts(signups) {
  return BUS_OPTIONS.reduce((acc, bus) => {
    acc[bus.id] = signups.filter((entry) => entry.bus === bus.id && entry.paid).length;
    return acc;
  }, {});
}

function buildConfirmationHtml(entry, busOption) {
  return `
    <h2>Zahlung bestätigt – dein Platz ist gesichert!</h2>
    <p>Hallo ${entry.firstName},</p>
    <p>deine Zahlung für <strong>${EVENT_TITLE}</strong> ist bei uns eingegangen. Dein Platz ist damit gesichert.</p>
    <hr />
    <p><strong>Veranstaltung:</strong> ${EVENT_TITLE}</p>
    <p><strong>Teilnehmer:</strong> ${entry.firstName} ${entry.lastName}</p>
    <p><strong>Bus:</strong> ${busOption ? busOption.label : entry.bus}</p>
    <p><strong>Preis:</strong> ${PRICE_PER_PERSON_LABEL}</p>
    <p><strong>Anmeldefrist:</strong> ${REGISTRATION_DEADLINE}</p>
    <hr />
    <p>Bei Fragen einfach auf diese E-Mail antworten.</p>
    <p>Viele Grüße</p>
  `;
}

export default async function handler(req, res) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    console.error("Redis-Umgebungsvariablen fehlen (weder UPSTASH_REDIS_REST_* noch KV_REST_API_* gesetzt).");
    return res.status(500).json({ error: "Server-Konfiguration unvollständig." });
  }

  if (!checkPassword(req)) {
    return res.status(401).json({ error: "Falsches Passwort." });
  }

  const redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });

  if (req.method === "GET") {
    const signups = await getSignups(redis);
    return res.status(200).json({ signups, counts: busCounts(signups), total: signups.length });
  }

  if (req.method === "POST") {
    const firstName = typeof req.body?.firstName === "string" ? req.body.firstName.trim() : "";
    const lastName = typeof req.body?.lastName === "string" ? req.body.lastName.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const newsletter = Boolean(req.body?.newsletter);
    const bus = typeof req.body?.bus === "string" ? req.body.bus : "";
    const busOption = BUS_OPTIONS.find((option) => option.id === bus);

    if (!firstName || !lastName || !busOption) {
      return res.status(400).json({ error: "Bitte Vorname, Nachname und Bus angeben." });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Bitte eine gültige E-Mail-Adresse angeben." });
    }

    if (new Date() > new Date(`${REGISTRATION_DEADLINE}T23:59:59`)) {
      return res.status(400).json({ error: "Die Anmeldefrist ist bereits abgelaufen." });
    }

    const signups = await getSignups(redis);

    if (signups.length >= MAX_PARTICIPANTS) {
      return res.status(400).json({ error: "Die maximale Teilnehmerzahl ist erreicht." });
    }

    const counts = busCounts(signups);
    if (counts[busOption.id] >= busOption.capacity) {
      return res.status(400).json({ error: `${busOption.label} ist bereits voll.` });
    }

    const entry = {
      id: crypto.randomUUID(),
      firstName,
      lastName,
      email,
      newsletter,
      bus,
      paid: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [...signups, entry];
    await redis.set(SIGNUPS_KEY, updated);
    await syncToGoogleSheet(updated);

    return res.status(200).json({ signups: updated, counts: busCounts(updated), total: updated.length });
  }

  if (req.method === "PATCH") {
    const id = typeof req.body?.id === "string" ? req.body.id : "";
    const paid = Boolean(req.body?.paid);

    const signups = await getSignups(redis);
    const index = signups.findIndex((entry) => entry.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Anmeldung nicht gefunden." });
    }

    const wasPaid = signups[index].paid;
    signups[index] = { ...signups[index], paid };
    await redis.set(SIGNUPS_KEY, signups);
    await syncToGoogleSheet(signups);

    if (paid && !wasPaid && process.env.CONTACT_FROM_EMAIL) {
      const entry = signups[index];
      const busOption = BUS_OPTIONS.find((option) => option.id === entry.bus);

      try {
        await resend.emails.send({
          from: process.env.CONTACT_FROM_EMAIL,
          to: entry.email,
          subject: `Zahlung bestätigt – ${EVENT_TITLE}`,
          html: buildConfirmationHtml(entry, busOption),
        });
      } catch (error) {
        console.error("Fehler beim Versand der Zahlungsbestätigung:", error);
      }
    }

    return res.status(200).json({ signups, counts: busCounts(signups), total: signups.length });
  }

  if (req.method === "DELETE") {
    const id = typeof req.body?.id === "string" ? req.body.id : "";

    const signups = await getSignups(redis);
    const updated = signups.filter((entry) => entry.id !== id);

    if (updated.length === signups.length) {
      return res.status(404).json({ error: "Anmeldung nicht gefunden." });
    }

    await redis.set(SIGNUPS_KEY, updated);
    await syncToGoogleSheet(updated);

    return res.status(200).json({ signups: updated, counts: busCounts(updated), total: updated.length });
  }

  return res.status(405).json({ error: "Methode nicht erlaubt." });
}
