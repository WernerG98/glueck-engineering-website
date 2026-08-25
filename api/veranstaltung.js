import { Redis } from "@upstash/redis";
import { BUS_OPTIONS, MAX_PARTICIPANTS, REGISTRATION_DEADLINE } from "../src/data/veranstaltung.js";

const SIGNUPS_KEY = "veranstaltung:haslinger-hof-2026:signups";
const ADMIN_PASSWORD = process.env.EVENT_ADMIN_PASSWORD || "admin";

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
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error("Upstash-Redis-Umgebungsvariablen fehlen.");
    return res.status(500).json({ error: "Server-Konfiguration unvollständig." });
  }

  if (!checkPassword(req)) {
    return res.status(401).json({ error: "Falsches Passwort." });
  }

  const redis = Redis.fromEnv();

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
