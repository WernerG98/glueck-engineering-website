import { useState } from "react";
import Reveal from "../Reveal";
import LevelBar from "../LevelBar";
import materials from "../../data/materials";
import { getLevel, PROPERTY_ROWS } from "../../data/materialLevels";

const QUESTIONS = [
  {
    key: "location",
    question: "Wo wird das Bauteil eingesetzt?",
    options: [
      { value: "outside", label: "Draußen, dauerhaft Wetter ausgesetzt" },
      { value: "inside", label: "Drinnen bzw. geschützt" },
    ],
  },
  {
    key: "purpose",
    question: "Worum geht es vor allem?",
    options: [
      { value: "deko", label: "Optik & Deko, z. B. Artwork" },
      { value: "funktion", label: "Alltagstaugliches Funktionsteil" },
      { value: "hochfest", label: "Hohe Belastung, technisches Bauteil" },
    ],
  },
  {
    key: "flex",
    question: "Soll das Material nachgeben können?",
    options: [
      { value: "flex", label: "Ja, flexibel/gummiartig" },
      { value: "rigid", label: "Nein, starr und formstabil" },
      { value: "egal", label: "Egal" },
    ],
  },
  {
    key: "budget",
    question: "Wie wichtig ist der Preis?",
    options: [
      { value: "guenstig", label: "Möglichst günstig" },
      { value: "egal", label: "Zweitrangig, Hauptsache passend" },
    ],
  },
];

function scoreMaterial(material, answers) {
  let score = 0;

  if (answers.location === "outside") {
    score += getLevel("weather", material.weather.label) ?? 0;
  }

  if (answers.purpose && material.tags.includes(answers.purpose)) {
    score += 4;
  }

  if (answers.flex === "flex") {
    score += material.tags.includes("flexibel") ? 4 : -2;
  } else if (answers.flex === "rigid") {
    score += material.tags.includes("flexibel") ? -2 : 2;
  }

  if (answers.budget === "guenstig") {
    score += 6 - (getLevel("price", material.price.label) ?? 3);
  }

  return score;
}

export default function MaterialQuiz({ onRequest }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const isDone = step >= QUESTIONS.length;

  const results = isDone
    ? [...materials]
        .map((material) => ({ material, score: scoreMaterial(material, answers) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((entry) => entry.material)
    : [];

  const handleAnswer = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setStep((s) => s + 1);
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
  };

  return (
    <Reveal className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 sm:p-8">
      <span className="eyebrow">Unsicher?</span>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        Material-Empfehlungs-Quiz
      </h2>

      {!isDone ? (
        <div className="mt-6">
          <div className="mb-4 flex gap-1.5">
            {QUESTIONS.map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-neutral-800"}`}
              />
            ))}
          </div>

          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Frage {step + 1} von {QUESTIONS.length}
          </p>
          <p className="mt-2 text-lg font-medium text-white">{QUESTIONS[step].question}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {QUESTIONS[step].options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleAnswer(QUESTIONS[step].key, option.value)}
                className="rounded-lg border border-neutral-700 px-4 py-3 text-left text-sm font-medium transition hover:border-accent hover:bg-neutral-800/80"
              >
                {option.label}
              </button>
            ))}
          </div>

          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="mt-4 text-xs font-medium text-neutral-500 underline hover:text-white"
            >
              Zurück
            </button>
          )}
        </div>
      ) : (
        <div className="mt-6">
          <p className="text-sm text-neutral-400">Diese Materialien passen am besten:</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {results.map((material) => (
              <div
                key={material.id}
                className="flex flex-col rounded-xl border border-accent/50 bg-neutral-950 p-4"
              >
                <h3 className="text-base font-semibold text-white">{material.name}</h3>
                <p className="mt-1 text-xs text-neutral-400">{material.tagline}</p>

                <div className="mt-3 space-y-2">
                  {PROPERTY_ROWS.slice(0, 3).map((row) => (
                    <div key={row.key} className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-wide text-neutral-500">
                        {row.label}
                      </span>
                      <LevelBar level={getLevel(row.key, material[row.key].label)} />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => onRequest(`3D-Druck Dienstleistung: ${material.name}`, "service")}
                  className="mt-4 w-full rounded-lg border border-neutral-700 py-2 text-center text-xs font-medium transition hover:border-neutral-500 hover:bg-neutral-800"
                >
                  Anfrage mit {material.name}
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={restart}
            className="mt-5 text-xs font-medium text-neutral-500 underline hover:text-white"
          >
            Quiz neu starten
          </button>
        </div>
      )}
    </Reveal>
  );
}
