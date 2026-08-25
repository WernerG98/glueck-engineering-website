import { Redis } from "@upstash/redis";
import { BUS_OPTIONS, MAX_PARTICIPANTS, REGISTRATION_DEADLINE } from "../src/data/veranstaltung.js";

const SIGNUPS_KEY = "veranstaltung:haslinger-hof-2026:signups";
const ADMIN_PASSWORD = process.env.EVENT_ADMIN_PASSWORD || "admin";

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

function busCounts(signups) {
  return BUS_OPTIONS.reduce((acc, bus) => {
    acc[bus.id] = signups.filter((entry) => entry.bus === bus.id).length;
    return acc;
  }, {});
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
    const bus = typeof req.body?.bus === "string" ? req.body.bus : "";
    const busOption = BUS_OPTIONS.find((option) => option.id === bus);

    if (!firstName || !lastName || !busOption) {
      return res.status(400).json({ error: "Bitte Vorname, Nachname und Bus angeben." });
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
      bus,
      paid: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [...signups, entry];
    await redis.set(SIGNUPS_KEY, updated);

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

    signups[index] = { ...signups[index], paid };
    await redis.set(SIGNUPS_KEY, signups);

    return res.status(200).json({ signups, counts: busCounts(signups), total: signups.length });
  }

  return res.status(405).json({ error: "Methode nicht erlaubt." });
}
