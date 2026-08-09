import { Resend } from "resend";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

const resend = new Resend(process.env.RESEND_API_KEY);

function parseForm(req) {
  const form = formidable({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 15 * 1024 * 1024,
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

function getFieldValue(value) {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function buildInternalHtml(data) {
  return `
    <h2>Neue Anfrage über die Website</h2>
    <p><strong>Betreff:</strong> ${data.subject}</p>
    <p><strong>Typ:</strong> ${data.type}</p>
    <hr />
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>E-Mail:</strong> ${data.email}</p>
    <p><strong>Telefon:</strong> ${data.phone || "-"}</p>
    <p><strong>Nachricht / Hinweise:</strong><br/>${(data.notes || "-").replace(/\n/g, "<br/>")}</p>

    <hr />
    <h3>Details</h3>
    <p><strong>Anzahl Produkt:</strong> ${data.quantity || "-"}</p>
    <p><strong>Artwork Ausführung:</strong> ${data.artworkColorMode || "-"}</p>
    <p><strong>Artwork Breite:</strong> ${data.artworkWidth || "-"}</p>
    <p><strong>Artwork Höhe:</strong> ${data.artworkHeight || "-"}</p>
    <p><strong>Rahmen:</strong> ${data.artworkFrame || "-"}</p>
    <p><strong>Rahmenfarbe:</strong> ${data.artworkFrameColor || "-"}</p>
    <p><strong>Artwork Anzahl:</strong> ${data.artworkQuantity || "-"}</p>
    <p><strong>Service Material:</strong> ${data.serviceMaterial || "-"}</p>
    <p><strong>Service Einsatzbereich:</strong> ${data.serviceApplication || "-"}</p>
    <p><strong>Service Anzahl:</strong> ${data.serviceQuantity || "-"}</p>
  `;
}

function buildCustomerHtml(data) {
  return `
    <h2>Vielen Dank für deine Anfrage</h2>
    <p>Hallo ${data.name},</p>
    <p>
      wir haben deine Anfrage bei <strong>Glück Engineering</strong> erfolgreich erhalten.
    </p>
    <p>
      Wir prüfen dein Anliegen und melden uns schnellstmöglich bei dir zurück.
    </p>

    <hr />

    <p><strong>Betreff deiner Anfrage:</strong> ${data.subject}</p>
    <p><strong>Typ:</strong> ${data.type}</p>

    ${
      data.notes
        ? `<p><strong>Deine Angaben:</strong><br/>${data.notes.replace(/\n/g, "<br/>")}</p>`
        : ""
    }

    <hr />

    <p>Viele Grüße</p>
    <p><strong>Glück Engineering</strong><br/>M.Eng. Werner Glück</p>
  `;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Methode nicht erlaubt." });
  }

  try {
    const { fields, files } = await parseForm(req);

    const data = {
      subject: getFieldValue(fields.subject),
      type: getFieldValue(fields.type),
      name: getFieldValue(fields.name),
      email: getFieldValue(fields.email),
      phone: getFieldValue(fields.phone),
      notes: getFieldValue(fields.notes),
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

    const toEmail = process.env.CONTACT_TO_EMAIL;
    const fromEmail = process.env.CONTACT_FROM_EMAIL;

    if (!toEmail || !fromEmail) {
      return res.status(500).json({
        error: "Server-Konfiguration unvollständig.",
      });
    }

    let attachments = [];

    const uploadedFile = files.attachment;
    const file = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;

    if (file?.filepath) {
      const content = fs.readFileSync(file.filepath);
      attachments.push({
        filename: file.originalFilename || "anhang",
        content,
      });
    }

    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: data.email,
      subject: `Neue Anfrage: ${data.subject}`,
      html: buildInternalHtml(data),
      attachments,
    });

    await resend.emails.send({
      from: fromEmail,
      to: data.email,
      subject: `Bestätigung deiner Anfrage bei Glück Engineering`,
      html: buildCustomerHtml(data),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Fehler beim Versand:", error);
    return res.status(500).json({
      error: "Beim Versand ist ein Fehler aufgetreten.",
    });
  }
}
