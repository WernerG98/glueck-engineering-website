// Ordnet die vorhandenen Text-Labels aus materials.js einer 1-5-Skala für die
// visuelle Balkenanzeige zu. Bei Flexibilität ist die Skala eine reine
// Ausprägungsstärke (starr -> flexibel), keine Wertung "besser/schlechter".
const LEVELS = {
  heat: {
    "–": null,
    "Niedrig": 1,
    "Niedrig-mittel": 2,
    "Mittel": 2,
    "Mittel-hoch": 3,
    "Hoch": 3,
    "Sehr hoch": 4,
    "Extrem hoch": 5,
  },
  strength: {
    "Sehr stoßfest": 3,
  },
  flex: {
    "Sehr starr": 1,
    "Leicht nachgiebig": 3,
    "Sehr weich, stark dehnbar": 5,
    "Flexibel": 4,
    "Gummiartig flexibel": 4,
  },
  uv: {
    "Schlecht": 1,
    "Mäßig": 2,
    "Gut": 4,
    "Sehr gut": 5,
  },
  weather: {
    "Nicht außentauglich": 1,
    "Nicht für Dauereinsatz draußen": 1,
    "Mäßig außentauglich": 2,
    "Bedingt außentauglich": 2,
    "Mittel": 3,
    "Sehr gut außentauglich": 4,
    "Sehr gut": 5,
  },
  difficulty: {
    "Einfach": 1,
    "Mittel": 3,
    "Anspruchsvoll": 5,
  },
  price: {
    "Günstig": 1,
    "Mittel": 3,
    "Gehoben": 5,
  },
};

export const PROPERTY_ROWS = [
  { key: "heat", label: "Hitzebeständigkeit" },
  { key: "strength", label: "Festigkeit" },
  { key: "flex", label: "Flexibilität" },
  { key: "uv", label: "UV-Beständigkeit" },
  { key: "weather", label: "Außentauglichkeit" },
  { key: "difficulty", label: "Druckschwierigkeit" },
  { key: "price", label: "Preisklasse" },
];

export function getLevel(property, label) {
  const table = LEVELS[property];
  if (!table) return null;
  if (label in table) return table[label];
  if (label.startsWith("Extrem hoch")) return 5;
  if (label.startsWith("Sehr hoch")) return 4;
  if (label.startsWith("Mittel")) return property === "strength" ? 2 : 3;
  if (label.startsWith("Hoch")) return 3;
  if (label.startsWith("Starr")) return 2;
  return null;
}

export default LEVELS;
