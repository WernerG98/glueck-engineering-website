# Glueck Engineering – Vercel Projekt

## Lokal starten

```bash
npm install
npm run dev
```

## Auf Vercel hochladen

1. Projekt als ZIP entpacken
2. In GitHub als neues Repository hochladen
3. Bei Vercel `Add New Project` wählen
4. GitHub-Repository importieren
5. Vercel erkennt Vite automatisch
6. Unter `Settings -> Environment Variables` diese Variablen anlegen:
   - `RESEND_API_KEY`
   - `CONTACT_TO_EMAIL`
   - `CONTACT_FROM_EMAIL`
7. Danach neu deployen

## Wichtiger Hinweis zum E-Mail-Versand

Für produktiven Versand solltest du bei Resend deine eigene Domain verifizieren.
Solange du `onboarding@resend.dev` nutzt, ist das nur für Tests gedacht.

## Bilder

Lege alle Bilder im Format WebP in den Ordner `public/`, höchstens 1200 px
Kantenlänge (das Logo `logo.webp` reicht mit 256 px Breite). Größere Dateien
verlangsamen die Seite spürbar.

Wenn eine Bilddatei ersetzt wird, am besten unter neuem Namen speichern:
Bilder werden vom Browser bis zu 7 Tage zwischengespeichert (siehe `vercel.json`).
