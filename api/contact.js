import { Resend } from "resend";
import formidable from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

const REQUEST_TYPES = ["general", "product", "custom", "service"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".svg", ".pdf", ".step", ".stp", ".stl", ".3mf", ".zip"];

// Vercel nimmt Anfragen nur bis ca. 4,5 MB an - darüber käme eine HTML-Fehlerseite statt JSON
const MAX_FILE_SIZE = 4 * 1024 * 1024;

// Maximale Zeichenzahl je Feld
const LIMITS = {
  subject: 150,
  type: 20,
  name: 100,
  email: 200,
  phone: 50,
  notes: 5000,
  default: 200,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Einfache Begrenzung pro IP: bei Serverless nur "best effort" (gilt je laufender Instanz).
// Zusätzlich sollte im Vercel-Dashboard unter Firewall eine Rate-Limit-Regel für /api/contact stehen.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQUESTS = 5;
const hits = new Map();

function isRateLimited(ip) {
  const now = Date.now();

  for (const [key, list] of hits) {
    const recent = list.filter((t) => now - t < RATE_WINDOW_MS);
    if (recent.length) hits.set(key, recent);
    else hits.delete(key);
  }

  const recent = hits.get(ip) || [];
  if (recent.length >= RATE_MAX_REQUESTS) return true;

  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function isSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;

  try {
    const originHost = new URL(origin).host;
    return originHost === req.headers.host || originHost.startsWith("localhost");
  } catch {
    return false;
  }
}

function parseForm(req) {
  const form = formidable({
    multiples: false,
    keepExtensions: true,
    maxFiles: 1,
    maxFields: 30,
    maxFieldsSize: 100 * 1024,
    maxFileSize: MAX_FILE_SIZE,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });
}

function getFieldValue(value, limit = LIMITS.default) {
  const raw = Array.isArray(value) ? value[0] : value;
  return String(raw ?? "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, limit);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Escapen und Zeilenumbrüche erhalten
function multiline(value) {
  return escapeHtml(value).replace(/\n/g, "<br/>");
}

function orDash(value) {
  return value ? escapeHtml(value) : "-";
}

// Keine Zeilenumbrüche in E-Mail-Betreffs (Header-Injection)
function singleLine(value) {
  return String(value ?? "").replace(/[\r\n\t]+/g, " ").trim();
}

function safeFilename(name) {
  const base = path.basename(String(name || "anhang")).replace(/[^\w.\- ()äöüÄÖÜß]/g, "_");
  return base.slice(0, 120) || "anhang";
}

function buildInternalHtml(data) {
  return `
    <h2>Neue Anfrage über die Website</h2>
    <p><strong>Betreff:</strong> ${orDash(data.subject)}</p>
    <p><strong>Typ:</strong> ${orDash(data.type)}</p>
    <hr />
    <p><strong>Name:</strong> ${orDash(data.name)}</p>
    <p><strong>E-Mail:</strong> ${orDash(data.email)}</p>
    <p><strong>Telefon:</strong> ${orDash(data.phone)}</p>
    <p><strong>Nachricht / Hinweise:</strong><br/>${data.notes ? multiline(data.notes) : "-"}</p>

    <hr />
    <h3>Details</h3>
    <p><strong>Anzahl Produkt:</strong> ${orDash(data.quantity)}</p>
    <p><strong>Artwork Ausführung:</strong> ${orDash(data.artworkColorMode)}</p>
    <p><strong>Artwork Breite:</strong> ${orDash(data.artworkWidth)}</p>
    <p><strong>Artwork Höhe:</strong> ${orDash(data.artworkHeight)}</p>
    <p><strong>Rahmen:</strong> ${orDash(data.artworkFrame)}</p>
    <p><strong>Rahmenfarbe:</strong> ${orDash(data.artworkFrameColor)}</p>
    <p><strong>Artwork Anzahl:</strong> ${orDash(data.artworkQuantity)}</p>
    <p><strong>Service Material:</strong> ${orDash(data.serviceMaterial)}</p>
    <p><strong>Service Einsatzbereich:</strong> ${orDash(data.serviceApplication)}</p>
    <p><strong>Service Anzahl:</strong> ${orDash(data.serviceQuantity)}</p>
  `;
}

function buildCustomerHtml(data) {
  return `
    <h2>Vielen Dank für deine Anfrage</h2>
    <p>Hallo ${escapeHtml(data.name)},</p>
    <p>
      wir haben deine Anfrage bei <strong>Glück Engineering</strong> erfolgreich erhalten.
    </p>
    <p>
      Wir prüfen dein Anliegen und melden uns schnellstmöglich bei dir zurück.
    </p>

    <hr />

    <p><strong>Betreff deiner Anfrage:</strong> ${orDash(data.subject)}</p>

    ${data.notes ? `<p><strong>Deine Angaben:</strong><br/>${multiline(data.notes)}</p>` : ""}

    <hr />

    <p>Viele Grüße</p>
    <p><strong>Glück Engineering</strong><br/>M.Eng. Werner Glück</p>
  `;
}

function removeTempFile(file) {
  if (!file?.filepath) return;
  fs.unlink(file.filepath, () => {});
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Methode nicht erlaubt." });
  }

  if (!isSameOrigin(req)) {
    return res.status(403).json({ error: "Anfrage nicht erlaubt." });
  }

  if (isRateLimited(getClientIp(req))) {
    return res.status(429).json({
      error: "Zu viele Anfragen in kurzer Zeit. Bitte in ein paar Minuten erneut versuchen.",
    });
  }

  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;

  if (!toEmail || !fromEmail || !apiKey) {
    console.error("Server-Konfiguration unvollständig (RESEND_API_KEY / CONTACT_TO_EMAIL / CONTACT_FROM_EMAIL).");
    return res.status(500).json({ error: "Server-Konfiguration unvollständig." });
  }

  let file = null;

  try {
    let parsed;
    try {
      parsed = await parseForm(req);
    } catch (err) {
      if (err?.httpCode === 413) {
        return res.status(413).json({
          error: "Die Datei ist zu groß (maximal 4 MB). Bitte verkleinern oder per E-Mail senden.",
        });
      }
      console.warn("Formular konnte nicht gelesen werden:", err?.message || err);
      return res.status(400).json({ error: "Die Anfrage konnte nicht gelesen werden." });
    }

    const { fields, files } = parsed;

    const uploadedFile = files.attachment;
    file = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;

    // Honeypot: das Feld ist für Menschen unsichtbar. Bots füllen es aus, bekommen aber "Erfolg" gemeldet.
    if (getFieldValue(fields.contact_hp, 200)) {
      return res.status(200).json({ success: true });
    }

    const data = {
      subject: singleLine(getFieldValue(fields.subject, LIMITS.subject)),
      type: getFieldValue(fields.type, LIMITS.type),
      name: singleLine(getFieldValue(fields.name, LIMITS.name)),
      email: singleLine(getFieldValue(fields.email, LIMITS.email)),
      phone: singleLine(getFieldValue(fields.phone, LIMITS.phone)),
      notes: getFieldValue(fields.notes, LIMITS.notes),
      quantity: getFieldValue(fields.quantity),
      artworkColorMode: getFieldValue(fields.artworkColorMode),
      artworkWidth: getFieldValue(fields.artworkWidth),
      artworkHeight: getFieldValue(fields.artworkHeight),
      artworkFrame: getFieldValue(fields.artworkFrame),
      artworkFrameColor: getFieldValue(fields.artworkFrameColor),
      artworkQuantity: getFieldValue(fields.artworkQuantity),
      serviceMaterial: getFieldValue(fields.serviceMaterial),
      serviceApplication: getFieldValue(fields.serviceApplication),
      serviceQuantity: getFieldValue(fields.serviceQuantity),
    };

    if (!REQUEST_TYPES.includes(data.type)) {
      return res.status(400).json({ error: "Ungültiger Anfragetyp." });
    }

    if (!data.name || !data.email) {
      return res.status(400).json({ error: "Bitte Name und E-Mail ausfüllen." });
    }

    if (!EMAIL_REGEX.test(data.email)) {
      return res.status(400).json({ error: "Bitte eine gültige E-Mail-Adresse eingeben." });
    }

    if (data.type === "general" && !data.notes) {
      return res.status(400).json({ error: "Bitte eine Nachricht eingeben." });
    }

    const attachments = [];

    if (file?.filepath) {
      const extension = path.extname(file.originalFilename || "").toLowerCase();

      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        return res.status(400).json({
          error: "Dieses Dateiformat wird nicht akzeptiert. Erlaubt sind JPG, PNG, WEBP, SVG, PDF, STEP, STL, 3MF und ZIP.",
        });
      }

      attachments.push({
        filename: safeFilename(file.originalFilename),
        content: await fs.promises.readFile(file.filepath),
      });
    }

    const resend = new Resend(apiKey);

    const { error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: data.email,
      subject: singleLine(`Neue Anfrage: ${data.subject || data.type}`),
      html: buildInternalHtml(data),
      attachments,
    });

    if (sendError) {
      console.error("Resend hat die Anfrage abgelehnt:", sendError);
      return res.status(502).json({
        error: "Die Anfrage konnte nicht zugestellt werden. Bitte später erneut versuchen oder per E-Mail melden.",
      });
    }

    // Die Anfrage ist bereits angekommen. Scheitert nur die Bestätigung, bleibt es trotzdem ein Erfolg.
    try {
      const { error: confirmError } = await resend.emails.send({
        from: fromEmail,
        to: data.email,
        subject: "Bestätigung deiner Anfrage bei Glück Engineering",
        html: buildCustomerHtml(data),
      });
      if (confirmError) console.warn("Bestätigungsmail nicht versendet:", confirmError);
    } catch (confirmError) {
      console.warn("Bestätigungsmail nicht versendet:", confirmError);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Fehler beim Versand:", error);
    return res.status(500).json({ error: "Beim Versand ist ein Fehler aufgetreten." });
  } finally {
    removeTempFile(file);
  }
}
