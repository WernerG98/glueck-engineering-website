import { useEffect, useRef, useState } from "react";

/*
 * Fixierter Hintergrund für die Startseite: ein geschlossener CoreXY-Drucker
 * (angelehnt an die Bambu Lab H2-Bauform), der beim Scrollen
 * ein Pfeilverzahnungs-Zahnrad Schicht für Schicht druckt.
 * Scroll-Fortschritt 0..1 → Aufheizen → Drucken → Fertig.
 */

const TOTAL_LAYERS = 240;
const PART_HEIGHT = 9;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;

// Fortschritt → Druckhöhe (0..1), mit Aufheiz- und Abkühlphase
const printFraction = (p) => smooth(0.06, 0.82, p);

function phaseFor(p) {
  if (p < 0.06) return "Düse heizt auf · 215 °C";
  if (p < 0.82) return "Druckt";
  if (p < 0.9) return "Kühlt ab";
  return "Fertig";
}

export default function PrinterScrollBackground({ stageRef, onProgress }) {
  const mountRef = useRef(null);
  const dimRef = useRef(null);
  const hudRef = useRef(null);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const [hud, setHud] = useState({ layer: 0, phase: phaseFor(0), p: 0 });

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    Promise.all([import("three"), import("three/examples/jsm/environments/RoomEnvironment.js")]).then(([THREE, envMod]) => {
      if (disposed || !mountRef.current) return;
      cleanup = initScene(THREE, {
        RoomEnvironment: envMod.RoomEnvironment,
        mount: mountRef.current,
        stage: stageRef?.current,
        dimEl: dimRef.current,
        hudEl: hudRef.current,
        setHud,
        onProgress: (p) => onProgressRef.current?.(p),
      });
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  const pct = Math.round(printFraction(hud.p) * 100);

  return (
    <>
      <div ref={mountRef} aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[100lvh]" />
      {/* Vignette für Lesbarkeit */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 60% 45%, transparent 0%, rgba(9,9,10,0.55) 70%, rgba(9,9,10,0.9) 100%)",
        }}
      />
      {/* Abdunkeln, sobald die Inhalte kommen */}
      <div ref={dimRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-neutral-950" style={{ opacity: 0 }} />
      {/* Druck-HUD */}
      <div
        ref={hudRef}
        style={{ opacity: 0 }}
        aria-hidden="true"
        className="pointer-events-none fixed bottom-5 left-4 z-30 hidden w-56 rounded-xl transition-opacity duration-300 border border-neutral-800 bg-neutral-950/70 p-4 font-mono text-[11px] text-neutral-400 backdrop-blur-md sm:left-6 sm:block"
      >
        <div className="flex items-center justify-between">
          <span className="uppercase tracking-[0.2em] text-accent">{hud.phase}</span>
          <span className={hud.p >= 0.06 && hud.p < 0.82 ? "animate-pulse text-accent" : ""}>●</span>
        </div>
        <div className="mt-3 flex justify-between text-neutral-300">
          <span>
            Schicht {hud.layer} / {TOTAL_LAYERS}
          </span>
          <span>{pct}%</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-neutral-800">
          <div className="h-full bg-accent transition-[width] duration-150" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </>
  );
}

function initScene(THREE, { RoomEnvironment, mount, stage, dimEl, hudEl, setHud, onProgress }) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x09090a, 1);
  renderer.localClippingEnabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  mount.appendChild(renderer.domElement);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x09090a, 150, 320);

  // Umgebungsreflexionen für Metall und Glas
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.55;

  // near = 1 statt 0.1 → deutlich bessere Tiefenauflösung, kein Flimmern
  const camera = new THREE.PerspectiveCamera(32, 1, 1, 400);

  // ---------- Maße ----------
  const W = 38; // Außenbreite
  const D = 38; // Außentiefe
  const Y0 = 1.2; // Unterkante Gehäuse (Füße darunter)
  const Y1 = 44; // Oberkante Gehäuse
  const HW = W / 2;
  const HD = D / 2;
  const Y_NOZZLE = 31; // Düsenspitze (CoreXY: Kopf bleibt oben, Bett fährt runter)
  const RAIL_Y = 37.5;
  const BED_LOW = 12;
  const S = 1.35; // Skalierung Druckteil
  const PART_H = PART_HEIGHT * S;

  // ---------- Licht ----------
  scene.add(new THREE.HemisphereLight(0x9aa3b5, 0x0a0a0c, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(40, 70, 60);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd4af37, 2.4);
  rim.position.set(-50, 40, -60);
  scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0xd4af37, 1.2);
  rim2.position.set(60, 20, -40);
  scene.add(rim2);
  // Innenbeleuchtung (LED-Leiste oben vorn)
  const chamber = new THREE.SpotLight(0xfff0dc, 900, 0, 0.85, 0.7, 2);
  chamber.position.set(0, Y1 - 2.5, HD - 4);
  chamber.target.position.set(0, 18, -2);
  scene.add(chamber, chamber.target);

  // ---------- Materialien ----------
  const mShell = new THREE.MeshStandardMaterial({ color: 0x3a3d44, metalness: 0.6, roughness: 0.35 });
  const mShellDark = new THREE.MeshStandardMaterial({ color: 0x16171a, metalness: 0.4, roughness: 0.55 });
  const mInner = new THREE.MeshStandardMaterial({ color: 0x1a1b1e, metalness: 0.2, roughness: 0.8 });
  const mRail = new THREE.MeshStandardMaterial({ color: 0xc9cdd4, metalness: 0.9, roughness: 0.4 });
  const mGold = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.28 });
  const mBrass = new THREE.MeshStandardMaterial({ color: 0xc89b4a, metalness: 1, roughness: 0.25 });
  const mHead = new THREE.MeshStandardMaterial({ color: 0x1f2024, metalness: 0.35, roughness: 0.4 });
  const mHeadCover = new THREE.MeshStandardMaterial({ color: 0xe9e9ea, metalness: 0.1, roughness: 0.35 });
  const mGlass = new THREE.MeshPhysicalMaterial({
    color: 0x2a2c30,
    metalness: 0,
    roughness: 0.05,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    side: THREE.DoubleSide,
    envMapIntensity: 1.6,
  });
  const mLed = new THREE.MeshBasicMaterial({ color: 0xfff3e0 });

  const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = scene) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };
  const cyl = (r, len, mat, x, y, z, axis = "y", parent = scene, seg = 20) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
    if (axis === "x") m.rotation.z = Math.PI / 2;
    if (axis === "z") m.rotation.x = Math.PI / 2;
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };

  // Boden (deutlich unter den Füßen → kein Z-Fighting)
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(140, 64),
    new THREE.MeshStandardMaterial({ color: 0x0b0b0d, metalness: 0.3, roughness: 0.85 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.3;
  scene.add(floor);

  // ---------- Gehäuse ----------
  const T = 0.9; // Wandstärke
  [
    [-HW + 1.5, -HD + 1.5],
    [HW - 1.5, -HD + 1.5],
    [-HW + 1.5, HD - 1.5],
    [HW - 1.5, HD - 1.5],
  ].forEach(([x, z]) => box(2.4, Y0 + 0.3, 2.4, mShellDark, x, (Y0 + 0.3) / 2 - 0.3 + 0.001, z));
  const bodyH = Y1 - Y0;
  const midY = (Y0 + Y1) / 2;
  box(T, bodyH, D, mShell, -HW + T / 2, midY, 0); // links
  box(T, bodyH, D, mShell, HW - T / 2, midY, 0); // rechts
  box(W - 2 * T, bodyH, T, mShell, 0, midY, -HD + T / 2); // hinten
  box(W - 2 * T, 4.2, D - T, mShellDark, 0, Y0 + 2.1, T / 2 - 0.001); // Unterbau
  // Innenwände dunkler (leicht nach innen versetzt)
  box(0.1, bodyH - 6, D - 3, mInner, -HW + T + 0.06, midY + 2, 0);
  box(0.1, bodyH - 6, D - 3, mInner, HW - T - 0.06, midY + 2, 0);
  box(W - 3, bodyH - 6, 0.1, mInner, 0, midY + 2, -HD + T + 0.06);

  // Front: Rahmen + Glastür
  const DOOR_Y0 = Y0 + 4.2;
  const doorH = Y1 - DOOR_Y0 - 1.6;
  const doorMidY = DOOR_Y0 + doorH / 2;
  box(W, 1.6, 1.2, mShell, 0, Y1 - 0.8, HD - 0.6); // obere Blende
  box(1.6, doorH, 1.2, mShell, -HW + 0.8, doorMidY, HD - 0.6);
  box(1.6, doorH, 1.2, mShell, HW - 0.8, doorMidY, HD - 0.6);
  const door = new THREE.Mesh(new THREE.BoxGeometry(W - 3.4, doorH - 0.4, 0.25), mGlass);
  door.position.set(0, doorMidY, HD - 0.3);
  door.renderOrder = 5;
  scene.add(door);
  // Türrahmen (dünn, dunkel) für Kontur
  const doorFrame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(W - 3.4, doorH - 0.4, 0.25)),
    new THREE.LineBasicMaterial({ color: 0x3a3c42 })
  );
  doorFrame.position.copy(door.position);
  scene.add(doorFrame);

  // Deckel: Rahmen + Glas
  box(W, 0.8, 2.2, mShell, 0, Y1 + 0.4, -HD + 1.1);
  box(W, 0.8, 1.2, mShell, 0, Y1 + 0.4, HD - 0.6);
  box(1.6, 0.8, D, mShell, -HW + 0.8, Y1 + 0.4, 0);
  box(1.6, 0.8, D, mShell, HW - 0.8, Y1 + 0.4, 0);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(W - 3.2, 0.25, D - 3.4), mGlass);
  lid.position.set(0, Y1 + 0.55, -0.5);
  lid.renderOrder = 3;
  scene.add(lid);

  // LED-Leiste innen oben vorn
  box(W - 6, 0.25, 0.5, mLed, 0, Y1 - 1.75, HD - 1.6);

  // Display unten links (CanvasTexture mit Fortschritt)
  const screenCanvas = document.createElement("canvas");
  screenCanvas.width = 256;
  screenCanvas.height = 144;
  const sctx = screenCanvas.getContext("2d");
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.6), new THREE.MeshBasicMaterial({ map: screenTex }));
  screen.position.set(-HW + 6.5, Y0 + 2.1, HD + 0.02);
  scene.add(screen);
  let lastScreen = -1;
  const drawScreen = (pct, label) => {
    sctx.fillStyle = "#0d0e10";
    sctx.fillRect(0, 0, 256, 144);
    sctx.fillStyle = "#d4af37";
    sctx.font = "600 18px Inter, sans-serif";
    sctx.fillText(label, 18, 34);
    sctx.font = "700 46px Inter, sans-serif";
    sctx.fillStyle = "#ffffff";
    sctx.fillText(`${pct}%`, 18, 92);
    sctx.fillStyle = "#2a2b2f";
    sctx.fillRect(18, 112, 220, 8);
    sctx.fillStyle = "#d4af37";
    sctx.fillRect(18, 112, 2.2 * pct, 8);
    screenTex.needsUpdate = true;
  };
  drawScreen(0, "Bereit");
  // Lichtband unten (Statusleiste)
  const statusBar = box(W - 18, 0.18, 0.1, new THREE.MeshBasicMaterial({ color: 0xd4af37 }), 5, Y0 + 0.9, HD + 0.03);

  // ---------- AMS-Einheit oben ----------
  const ams = new THREE.Group();
  ams.position.set(0, Y1 + 0.8, -1);
  scene.add(ams);
  box(W - 6, 1.2, D - 12, mShellDark, 0, 0.6, 0, ams);
  box(W - 6, 6.5, 0.8, mShell, 0, 4.4, -(D - 12) / 2 + 0.4, ams);
  box(W - 6, 1.6, 0.8, mShell, 0, 2.0, (D - 12) / 2 - 0.4, ams);
  box(0.8, 6.5, D - 12, mShell, -(W - 6) / 2 + 0.4, 4.4, 0, ams);
  box(0.8, 6.5, D - 12, mShell, (W - 6) / 2 - 0.4, 4.4, 0, ams);
  const amsLid = new THREE.Mesh(new THREE.BoxGeometry(W - 6, 0.3, D - 12), mGlass);
  amsLid.position.set(0, 7.8, 0);
  amsLid.renderOrder = 4;
  ams.add(amsLid);
  const spoolColors = [0xd4af37, 0xeeeeee, 0x1b1b1d, 0x7d8088];
  const spools = spoolColors.map((c, i) => {
    const g = new THREE.Group();
    g.position.set(-10.5 + i * 7, 4.6, 0);
    ams.add(g);
    const wound = new THREE.Mesh(
      new THREE.CylinderGeometry(3.4, 3.4, 5.4, 40),
      new THREE.MeshStandardMaterial({ color: c, metalness: 0.15, roughness: 0.55 })
    );
    wound.rotation.x = Math.PI / 2;
    wound.rotation.z = Math.PI / 2;
    g.add(wound);
    [-2.9, 2.9].forEach((x) => {
      const fl = new THREE.Mesh(new THREE.CylinderGeometry(3.9, 3.9, 0.3, 40), mShellDark);
      fl.rotation.z = Math.PI / 2;
      fl.position.x = x;
      g.add(fl);
    });
    g.rotation.y = Math.PI / 2;
    return g;
  });

  // ---------- CoreXY-Bewegungssystem ----------
  cyl(0.35, D - 6, mRail, -HW + 3, RAIL_Y, 0, "z");
  cyl(0.35, D - 6, mRail, HW - 3, RAIL_Y, 0, "z");
  box(1.6, 1.6, D - 5, mShellDark, -HW + 2.2, RAIL_Y + 1.1, 0);
  box(1.6, 1.6, D - 5, mShellDark, HW - 2.2, RAIL_Y + 1.1, 0);

  const gantry = new THREE.Group(); // fährt in Z
  scene.add(gantry);
  box(W - 5.6, 1.4, 1.6, mShellDark, 0, RAIL_Y, -1.6, gantry);
  cyl(0.25, W - 6, mRail, 0, RAIL_Y + 0.9, -0.6, "x", gantry);
  box(2.2, 2.2, 3, mHead, -HW + 3, RAIL_Y, -1.2, gantry);
  box(2.2, 2.2, 3, mHead, HW - 3, RAIL_Y, -1.2, gantry);

  const head = new THREE.Group(); // fährt in X
  gantry.add(head);
  // Werkzeugkopf: dunkler Block mit heller Frontblende
  const HEAD_Z = 1.0;
  box(4.6, 5.2, 4.4, mHead, 0, RAIL_Y - 2.2, HEAD_Z, head);
  box(4.4, 4.2, 0.3, mHeadCover, 0, RAIL_Y - 2.3, HEAD_Z + 2.3, head);
  box(1.8, 0.18, 0.05, mGold, 0, RAIL_Y - 0.9, HEAD_Z + 2.48, head);
  box(1.6, 1.0, 1.6, mBrass, 0, Y_NOZZLE + 1.8, HEAD_Z, head);
  const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.0, 16), mBrass);
  nozzle.rotation.x = Math.PI;
  nozzle.position.set(0, Y_NOZZLE + 0.55, HEAD_Z);
  head.add(nozzle);
  const hotLight = new THREE.PointLight(0xff8a2a, 0, 12, 2);
  hotLight.position.set(0, Y_NOZZLE - 0.3, HEAD_Z);
  head.add(hotLight);
  const tipGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffb35c, transparent: true, opacity: 0 })
  );
  tipGlow.position.set(0, Y_NOZZLE, HEAD_Z);
  head.add(tipGlow);

  // Hotend-Wechselstation (hinten links)
  for (let i = 0; i < 6; i++) {
    const x = -HW + 4 + i * 2.3;
    box(1.6, 2.4, 1.6, mHead, x, RAIL_Y - 3.2, -HD + 3.2);
    cyl(0.32, 0.9, mBrass, x, RAIL_Y - 4.8, -HD + 3.2, "y", scene, 12);
  }
  box(14.5, 0.6, 2.4, mShellDark, -HW + 9.8, RAIL_Y - 1.8, -HD + 3.2);

  // ---------- Z-Achse & Druckbett ----------
  [
    [-HW + 4, -HD + 4],
    [HW - 4, -HD + 4],
    [0, -HD + 2.8],
  ].forEach(([x, z]) => cyl(0.4, 30, mGold, x, Y0 + 4.2 + 15, z));

  const bed = new THREE.Group();
  scene.add(bed);
  box(W - 7, 0.7, D - 8, mShellDark, 0, -0.95, -1, bed);
  // Druckplatte mit dezentem Raster (Textur statt GridHelper → kein Z-Fighting)
  const plateCanvas = document.createElement("canvas");
  plateCanvas.width = plateCanvas.height = 512;
  const pctx = plateCanvas.getContext("2d");
  pctx.fillStyle = "#15161a";
  pctx.fillRect(0, 0, 512, 512);
  pctx.strokeStyle = "rgba(212,175,55,0.14)";
  pctx.lineWidth = 2;
  for (let i = 0; i <= 512; i += 32) {
    pctx.beginPath();
    pctx.moveTo(i, 0);
    pctx.lineTo(i, 512);
    pctx.moveTo(0, i);
    pctx.lineTo(512, i);
    pctx.stroke();
  }
  const plateTex = new THREE.CanvasTexture(plateCanvas);
  plateTex.colorSpace = THREE.SRGBColorSpace;
  plateTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const mPlate = new THREE.MeshStandardMaterial({ color: 0xffffff, map: plateTex, metalness: 0.3, roughness: 0.6 });
  const plateMats = [mShellDark, mShellDark, mPlate, mShellDark, mShellDark, mShellDark];
  const plate = new THREE.Mesh(new THREE.BoxGeometry(W - 9, 0.5, D - 10), plateMats);
  plate.position.set(0, -0.25, -1);
  bed.add(plate);

  // PTFE-Schlauch AMS → Kopf
  const tubeMat = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, metalness: 0, roughness: 0.5 });
  let tube = null;
  const tubeStart = new THREE.Vector3(6, Y1 - 0.5, -HD + 2.5);
  const curve = new THREE.QuadraticBezierCurve3(tubeStart, new THREE.Vector3(), new THREE.Vector3());
  let lastTubeKey = "";
  const updateTube = (hx, hz) => {
    const key = `${hx.toFixed(1)}|${hz.toFixed(1)}`;
    if (key === lastTubeKey) return;
    lastTubeKey = key;
    curve.v1.set((hx + tubeStart.x) / 2 + 3, Y1 + 0.2, (hz + tubeStart.z) / 2);
    curve.v2.set(hx, RAIL_Y + 0.6, hz);
    const g = new THREE.TubeGeometry(curve, 32, 0.18, 8, false);
    if (tube) {
      tube.geometry.dispose();
      tube.geometry = g;
    } else {
      tube = new THREE.Mesh(g, tubeMat);
      scene.add(tube);
    }
  };

  // ---------- Druckteil: Pfeilverzahntes Zahnrad ----------
  const TEETH = 22;
  const R_TIP = 7.2;
  const R_ROOT = 6.2;
  const shape = new THREE.Shape();
  for (let i = 0; i < TEETH; i++) {
    const a0 = (i / TEETH) * Math.PI * 2;
    const s = (Math.PI * 2) / TEETH;
    const pts = [
      [R_ROOT, a0],
      [R_TIP, a0 + s * 0.18],
      [R_TIP, a0 + s * 0.42],
      [R_ROOT, a0 + s * 0.6],
    ];
    pts.forEach(([r, a], j) => {
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0 && j === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
  }
  shape.closePath();
  const hub = new THREE.Path();
  hub.absarc(0, 0, 1.6, 0, Math.PI * 2, true);
  shape.holes.push(hub);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const h = new THREE.Path();
    h.absarc(Math.cos(a) * 3.9, Math.sin(a) * 3.9, 1.05, 0, Math.PI * 2, true);
    shape.holes.push(h);
  }

  const TWIST = 0.05;
  const twistAt = (y) => TWIST * (y < PART_HEIGHT / 2 ? y : PART_HEIGHT - y);

  const gearGeom = new THREE.ExtrudeGeometry(shape, { depth: PART_HEIGHT, steps: 60, bevelEnabled: false, curveSegments: 18 });
  gearGeom.rotateX(-Math.PI / 2);
  const pos = gearGeom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const a = twistAt(y);
    pos.setXYZ(i, x * Math.cos(a) - z * Math.sin(a), y, x * Math.sin(a) + z * Math.cos(a));
  }
  gearGeom.computeVertexNormals();

  const clipTop = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  const clipHotBand = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  const mPart = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.25,
    roughness: 0.42,
    clippingPlanes: [clipTop],
  });
  const mCap = new THREE.MeshBasicMaterial({ color: 0xffa040, side: THREE.BackSide, clippingPlanes: [clipTop] });
  // Heißes Band: gleiche Geometrie, per polygonOffset vorgezogen statt skaliert → kein Flimmern
  const mHot = new THREE.MeshBasicMaterial({
    color: 0xff9a3c,
    clippingPlanes: [clipTop, clipHotBand],
    transparent: true,
    opacity: 0.9,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    depthWrite: false,
  });

  const part = new THREE.Group();
  part.scale.setScalar(S);
  bed.add(part);
  part.add(new THREE.Mesh(gearGeom, mPart));
  part.add(new THREE.Mesh(gearGeom, mCap));
  const hotMesh = new THREE.Mesh(gearGeom, mHot);
  hotMesh.renderOrder = 1;
  part.add(hotMesh);
  const PART_Z = -1;
  // Unterseite minimal über der Druckplatte → kein Z-Fighting zwischen Platte und Teilboden
  const PART_LIFT = 0.12;
  part.position.y = PART_LIFT;

  const outline = shape.getSpacedPoints(260).map((v) => new THREE.Vector2(v.x, -v.y));
  const pathPoint = (u, yLocal) => {
    const n = outline.length - 1;
    const f = (((u % 1) + 1) % 1) * n;
    const i = Math.floor(f);
    const t = f - i;
    const a = outline[i];
    const b = outline[Math.min(i + 1, n)];
    const x = lerp(a.x, b.x, t);
    const z = lerp(a.y, b.y, t);
    const tw = twistAt(yLocal);
    return [(x * Math.cos(tw) - z * Math.sin(tw)) * S, (x * Math.sin(tw) + z * Math.cos(tw)) * S];
  };

  // ---------- Kamera-Keyframes ----------
  const keys = [
    { p: 0.0, r: 150, az: -0.5, el: 0.14, ty: 27 },
    { p: 0.22, r: 105, az: -0.28, el: 0.22, ty: 28 },
    { p: 0.55, r: 78, az: 0.12, el: 0.36, ty: 28 },
    { p: 0.8, r: 115, az: 0.36, el: 0.22, ty: 26 },
    { p: 1.0, r: 125, az: 0.5, el: 0.16, ty: 25 },
  ];
  const camAt = (p) => {
    let k = 0;
    while (k < keys.length - 2 && p > keys[k + 1].p) k++;
    const a = keys[k];
    const b = keys[k + 1];
    const t = smooth(a.p, b.p, p);
    return { r: lerp(a.r, b.r, t), az: lerp(a.az, b.az, t), el: lerp(a.el, b.el, t), ty: lerp(a.ty, b.ty, t) };
  };

  // ---------- Scroll / Resize ----------
  let target = 0;
  let current = 0;
  let after = 0;
  let afterCur = 0;
  const readScroll = () => {
    const vh = window.innerHeight;
    const docMax = document.documentElement.scrollHeight - vh;
    if (!stage) {
      target = docMax > 0 ? clamp(window.scrollY / docMax) : 0;
      return;
    }
    const rect = stage.getBoundingClientRect();
    const run = rect.height - vh;
    target = run > 0 ? clamp(-rect.top / run) : 1;
    const stageEnd = rect.bottom + window.scrollY - vh;
    const rest = docMax - stageEnd;
    after = rest > 0 ? clamp((window.scrollY - stageEnd) / rest) : 0;
  };
  readScroll();
  current = target;
  afterCur = after;

  let width = 0;
  let height = 0;
  let needsRender = true;
  const resize = () => {
    const w = mount.clientWidth;
    const h = mount.clientHeight;
    if (w === width && h === height) return;
    width = w;
    height = h;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    needsRender = true;
    if (raf) frame(); // sofort zeichnen, damit die Fläche nie leer ist
  };

  window.addEventListener("scroll", readScroll, { passive: true });
  window.addEventListener("resize", resize);
  const ro = new ResizeObserver(readScroll);
  ro.observe(document.body);

  // ---------- Loop ----------
  const hotColor = new THREE.Color(0xffa040);
  const coolColor = new THREE.Color(0xb8952c);
  let raf = 0;
  let lastHud = -1;
  const clock = new THREE.Clock();
  let nozzleU = 0; // Position der Düse auf der Kontur (Umläufe), läuft zeitbasiert
  let lastT = 0;

  const tick = () => {
    raf = requestAnimationFrame(tick);
    frame();
  };

  const frame = () => {
    const t = clock.getElapsedTime();
    const dt = Math.min(0.05, t - lastT);
    lastT = t;
    const prevP = current;
    const prevQ = afterCur;
    current = reduceMotion ? target : lerp(current, target, 0.1);
    afterCur = reduceMotion ? after : lerp(afterCur, after, 0.1);
    if (Math.abs(current - target) < 1e-5) current = target;
    if (Math.abs(afterCur - after) < 1e-5) afterCur = after;
    const p = current;
    const q = afterCur;
    const printingNow = p > 0.06 && p < 0.82 && q < 0.999;
    // Nur zeichnen, wenn sich etwas ändert: Scrollen, Größe oder laufender Druck
    if (!needsRender && !printingNow && p === prevP && q === prevQ) return;
    needsRender = false;

    const f = printFraction(p);
    const hWorld = f * PART_H;
    const printing = p > 0.06 && p < 0.82;
    const heat = smooth(0.0, 0.06, p) * (1 - smooth(0.82, 0.9, p));
    const cool = smooth(0.8, 0.95, p);
    const park = smooth(0.82, 0.97, p);

    // Bett: Oberkante folgt der Druckhöhe nach unten, am Ende fährt es zur Präsentation runter
    const bedTop = lerp(Y_NOZZLE - hWorld, BED_LOW, park);
    bed.position.y = bedTop;

    const top = bedTop + PART_LIFT + Math.max(hWorld, 0.0001);
    clipTop.constant = top;
    clipHotBand.constant = -(top - 0.25);
    part.visible = hWorld > 0.03;
    hotMesh.visible = cool < 0.99;
    mHot.opacity = 0.9 * (1 - cool);
    mCap.color.copy(hotColor).lerp(coolColor, cool);

    // Düse auf der Kontur (Teil-Koordinaten → Welt)
    // Düse fährt gleichmäßig die Kontur ab (nicht an den Scroll gekoppelt → kein Springen)
    if (printingNow && !reduceMotion) nozzleU += dt * 0.18;
    const [px, pz] = pathPoint(nozzleU, f * PART_HEIGHT);
    head.position.x = lerp(px, HW - 8, park);
    gantry.position.z = lerp(pz + PART_Z - HEAD_Z, -HD + 9, park);
    part.position.z = PART_Z;
    updateTube(head.position.x, gantry.position.z + HEAD_Z);

    hotLight.intensity = heat * (printing ? 20 : 12);
    tipGlow.material.opacity = heat;

    spools[0].rotation.x = -f * Math.PI * 10;

    // Kamera
    const cam = camAt(p);
    const az = cam.az + q * 0.55;
    camera.position.set(
      Math.sin(az) * Math.cos(cam.el) * cam.r,
      cam.ty + Math.sin(cam.el) * cam.r,
      Math.cos(az) * Math.cos(cam.el) * cam.r
    );
    camera.lookAt(0, cam.ty, 0);

    const wide = width >= 768;
    const shift = wide ? 0.2 * (1 - smooth(0.0, 0.1, q)) : 0;
    if (shift > 0.001) camera.setViewOffset(width, height, -width * shift, 0, width, height);
    else camera.clearViewOffset();

    renderer.render(scene, camera);

    const dim = smooth(0.0, 0.12, q);
    if (dimEl) dimEl.style.opacity = String(dim * 0.55);
    if (hudEl) hudEl.style.opacity = String(smooth(0.03, 0.09, p) * (1 - smooth(0.0, 0.05, q)));
    onProgress(p);

    const layer = Math.round(f * TOTAL_LAYERS);
    const pct = Math.round(f * 100);
    if (pct !== lastScreen) {
      lastScreen = pct;
      drawScreen(pct, phaseFor(p).split(" · ")[0]);
      statusBar.material.color.set(p >= 0.9 ? 0x4caf50 : 0xd4af37);
    }
    const hudKey = layer * 10 + Math.round(p * 100);
    if (hudKey !== lastHud) {
      lastHud = hudKey;
      setHud({ layer, phase: phaseFor(p), p });
    }
  };
  resize();
  frame();
  tick();

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("scroll", readScroll);
    window.removeEventListener("resize", resize);
    ro.disconnect();
    scene.traverse((o) => {
      o.geometry?.dispose();
      const m = o.material;
      if (Array.isArray(m)) m.forEach((x) => x.dispose());
      else m?.dispose();
    });
    plateTex.dispose();
    screenTex.dispose();
    envTex.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
