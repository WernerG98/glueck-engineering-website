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

Lege alle Bilder in den Ordner `public/`:

- `logo.png`
- `Fuehrung_Blende_T4.png`
- `VW_T5_Clip_Verstellung_Kopfstuetze.jpg`
- `Honda_XRV_RD07_Spritzschutz_Schwinge_hinten.jpg`
- `3D-Druck_S54_Ergebnis.jpg`
- `Artwork_Stanced_E46.png`
- `Artwork_Stanced_E46_5.png`
- `Artwork_E87.png`
- `Artwork_Kein_Leben_bleibt.png`
- `Artwork_Foggy_Mountains.png`
- `Artwork_Wave.png`
- `Artwork_Stanced_E46_6.png`
- `Artwork_E46_Ergebnis.jpg`
