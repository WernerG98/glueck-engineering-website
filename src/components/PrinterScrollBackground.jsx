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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    let fallbackTimer = 0;
    Promise.all([
      import("three"),
      import("three/examples/jsm/environments/RoomEnvironment.js"),
      import("three/examples/jsm/loaders/GLTFLoader.js"),
      import("three/examples/jsm/loaders/DRACOLoader.js"),
    ]).then(([THREE, envMod, gltfMod, dracoMod]) => {
      if (disposed || !mountRef.current) return;
      const show = () => !disposed && setReady(true);
      cleanup = initScene(THREE, {
        RoomEnvironment: envMod.RoomEnvironment,
        GLTFLoader: gltfMod.GLTFLoader,
        DRACOLoader: dracoMod.DRACOLoader,
        mount: mountRef.current,
        stage: stageRef?.current,
        dimEl: dimRef.current,
        hudEl: hudRef.current,
        setHud,
        onProgress: (p) => onProgressRef.current?.(p),
        onModelReady: show,
      });
      // Falls das detaillierte Modell hängt: nach 5 s die einfache Szene zeigen
      fallbackTimer = window.setTimeout(show, 5000);
    });

    return () => {
      disposed = true;
      window.clearTimeout(fallbackTimer);
      cleanup();
    };
  }, []);

  const pct = Math.round(printFraction(hud.p) * 100);

  return (
    <>
      <div
        ref={mountRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[100lvh] transition-opacity duration-1000"
        style={{ opacity: ready ? 1 : 0 }}
      />
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

function initScene(THREE, { RoomEnvironment, GLTFLoader, DRACOLoader, mount, stage, dimEl, hudEl, setHud, onProgress, onModelReady }) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x09090a, 1);
  renderer.localClippingEnabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
  const Y1 = 49; // Oberkante Gehäuse (H2C-Proportionen, Kopfband 6 hoch)
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
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -55;
  key.shadow.camera.right = 55;
  key.shadow.camera.top = 65;
  key.shadow.camera.bottom = -25;
  key.shadow.camera.near = 10;
  key.shadow.camera.far = 220;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.06;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd4af37, 2.4);
  rim.position.set(-50, 40, -60);
  scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0xd4af37, 1.2);
  rim2.position.set(60, 20, -40);
  scene.add(rim2);
  // Innenbeleuchtung (LED-Leiste oben vorn)
  const chamber = new THREE.SpotLight(0xfff0dc, 900, 0, 0.85, 0.7, 2);
  chamber.castShadow = true;
  chamber.shadow.mapSize.set(1024, 1024);
  chamber.shadow.bias = -0.0005;
  chamber.shadow.normalBias = 0.05;
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
    roughness: 0.04,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    side: THREE.DoubleSide,
    envMapIntensity: 1.8,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  });
  const mRubber = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, metalness: 0.1, roughness: 0.95 });
  const mScrew = new THREE.MeshStandardMaterial({ color: 0x55585f, metalness: 1, roughness: 0.35 });
  const mLed = new THREE.MeshBasicMaterial({ color: 0xfff3e0 });

  // Einfache Ersatzgeometrie: wird durch das Blender-Modell (public/models/drucker.glb) ersetzt,
  // sobald es geladen ist. Ohne Modell (Fehler/zu langsam) bleibt sie stehen.
  const legacy = new THREE.Group();
  scene.add(legacy);

  const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = legacy) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const cyl = (r, len, mat, x, y, z, axis = "y", parent = legacy, seg = 20) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
    if (axis === "x") m.rotation.z = Math.PI / 2;
    if (axis === "z") m.rotation.x = Math.PI / 2;
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  // ---------- Studio: Boden mit Goldraster, Rundhorizont mit Lichtleisten, Lichtkegel, Staub ----------
  // Boden: dunkler, leicht glänzender Studioboden. Feines Konstruktionsraster in Gold, das zur Mitte hin
  // sichtbar ist und nach außen ausläuft, plus ein leuchtender Bühnenring um den Drucker.
  const FLOOR_R = 140;
  const FN = 2048;
  const unit = FN / (2 * FLOOR_R); // Pixel pro Szenen-Einheit
  const floorCanvas = document.createElement("canvas");
  floorCanvas.width = floorCanvas.height = FN;
  {
    const f = floorCanvas.getContext("2d");
    const c = FN / 2;
    const g = f.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0, "#1d1b16");
    g.addColorStop(0.18, "#131215");
    g.addColorStop(1, "#08080a");
    f.fillStyle = g;
    f.fillRect(0, 0, FN, FN);

    const grid = document.createElement("canvas");
    grid.width = grid.height = FN;
    const q = grid.getContext("2d");
    const lines = (step, alpha, width) => {
      q.strokeStyle = `rgba(212,175,55,${alpha})`;
      q.lineWidth = width;
      q.beginPath();
      for (let k = -FLOOR_R; k <= FLOOR_R; k += step) {
        const p = c + k * unit;
        q.moveTo(p, 0);
        q.lineTo(p, FN);
        q.moveTo(0, p);
        q.lineTo(FN, p);
      }
      q.stroke();
    };
    lines(2, 0.07, 1);
    lines(10, 0.22, 1.6);
    // kleine Kreuze an den Hauptlinien
    q.strokeStyle = "rgba(240,210,120,0.45)";
    q.lineWidth = 2;
    for (let i = -FLOOR_R; i <= FLOOR_R; i += 10) {
      for (let j = -FLOOR_R; j <= FLOOR_R; j += 10) {
        const x = c + i * unit;
        const y = c + j * unit;
        q.beginPath();
        q.moveTo(x - 5, y);
        q.lineTo(x + 5, y);
        q.moveTo(x, y - 5);
        q.lineTo(x, y + 5);
        q.stroke();
      }
    }
    // Raster nach außen ausblenden
    q.globalCompositeOperation = "destination-in";
    const m = q.createRadialGradient(c, c, 22 * unit, c, c, 95 * unit);
    m.addColorStop(0, "rgba(0,0,0,1)");
    m.addColorStop(1, "rgba(0,0,0,0)");
    q.fillStyle = m;
    q.fillRect(0, 0, FN, FN);
    f.drawImage(grid, 0, 0);

    // Bühnenring + feiner Innenring
    f.shadowColor = "rgba(212,175,55,0.9)";
    f.shadowBlur = 18;
    f.strokeStyle = "rgba(226,190,80,0.85)";
    f.lineWidth = 3;
    f.beginPath();
    f.arc(c, c, 33 * unit, 0, Math.PI * 2);
    f.stroke();
    f.shadowBlur = 0;
    f.strokeStyle = "rgba(212,175,55,0.25)";
    f.lineWidth = 1.5;
    f.beginPath();
    f.arc(c, c, 35.5 * unit, 0, Math.PI * 2);
    f.stroke();
    // Skalenstriche auf dem Ring
    f.strokeStyle = "rgba(212,175,55,0.35)";
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * Math.PI * 2;
      const r0 = 35.5 * unit;
      const r1 = r0 + (i % 10 === 0 ? 2.2 : 0.9) * unit;
      f.beginPath();
      f.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0);
      f.lineTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1);
      f.stroke();
    }
  }
  const floorTex = new THREE.CanvasTexture(floorCanvas);
  floorTex.colorSpace = THREE.SRGBColorSpace;
  floorTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(FLOOR_R, 96),
    new THREE.MeshStandardMaterial({ map: floorTex, color: 0xffffff, metalness: 0.55, roughness: 0.38 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.3;
  floor.receiveShadow = true;
  scene.add(floor);

  // Rundhorizont hinter dem Drucker: dunkle Wand mit senkrechten Gold-Lichtleisten
  {
    const BW = 2048;
    const BH = 512;
    const bc = document.createElement("canvas");
    bc.width = BW;
    bc.height = BH;
    const b = bc.getContext("2d");
    const g = b.createLinearGradient(0, 0, 0, BH);
    g.addColorStop(0, "#060607");
    g.addColorStop(0.75, "#0e0d0f");
    g.addColorStop(1, "#141210");
    b.fillStyle = g;
    b.fillRect(0, 0, BW, BH);
    // feine Paneelfugen
    b.fillStyle = "rgba(0,0,0,0.55)";
    for (let x = 0; x < BW; x += BW / 32) b.fillRect(x, 0, 2, BH);
    // Lichtleisten (mit Glühen, oben und unten ausgeblendet)
    const SLATS = 11;
    for (let i = 0; i < SLATS; i++) {
      const x = ((i + 0.5) / SLATS) * BW;
      const lg = b.createLinearGradient(0, BH * 0.12, 0, BH * 0.92);
      lg.addColorStop(0, "rgba(212,175,55,0)");
      lg.addColorStop(0.35, "rgba(232,196,90,0.55)");
      lg.addColorStop(0.7, "rgba(232,196,90,0.45)");
      lg.addColorStop(1, "rgba(212,175,55,0)");
      b.shadowColor = "rgba(212,175,55,0.8)";
      b.shadowBlur = 24;
      b.fillStyle = lg;
      b.fillRect(x - 2, BH * 0.12, 4, BH * 0.8);
    }
    b.shadowBlur = 0;
    // Bodenlinie, wo Wand und Boden sich treffen
    const fl = b.createLinearGradient(0, BH - 40, 0, BH);
    fl.addColorStop(0, "rgba(212,175,55,0)");
    fl.addColorStop(1, "rgba(212,175,55,0.18)");
    b.fillStyle = fl;
    b.fillRect(0, BH - 40, BW, 40);
    const tex = new THREE.CanvasTexture(bc);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    // Bogen gegenüber den Kamerapositionen (Azimut -0.5 … 1.1) → von hinten links bis hinten rechts
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(125, 125, 140, 128, 1, true, 1.75, 3.3),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, fog: false })
    );
    wall.position.y = 70 - 0.3;
    scene.add(wall);
  }

  // Lichtkegel von oben (additiv, sehr dezent) + schwebender Staub darin
  const gradTex = (() => {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 256;
    const g = c.getContext("2d");
    const lg = g.createLinearGradient(0, 0, 0, 256);
    lg.addColorStop(0, "rgba(255,255,255,1)");
    lg.addColorStop(0.6, "rgba(255,255,255,0.25)");
    lg.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = lg;
    g.fillRect(0, 0, 4, 256);
    return new THREE.CanvasTexture(c);
  })();
  [
    [-34, -42, 0.16, 0.055],
    [38, -36, -0.12, 0.045],
    [0, 8, 0.0, 0.03],
  ].forEach(([x, z, tilt, op]) => {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(24, 110, 48, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xe6c36a,
        map: gradTex,
        transparent: true,
        opacity: op,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
      })
    );
    cone.position.set(x, 54, z);
    cone.rotation.z = tilt;
    cone.renderOrder = 8;
    scene.add(cone);
  });

  const dustTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const g = c.getContext("2d");
    const rg = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    rg.addColorStop(0, "rgba(255,255,255,1)");
    rg.addColorStop(0.35, "rgba(255,240,200,0.5)");
    rg.addColorStop(1, "rgba(255,240,200,0)");
    g.fillStyle = rg;
    g.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  })();
  const DUST = 420;
  const dustPos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 140;
    dustPos[i * 3 + 1] = Math.random() * 90;
    dustPos[i * 3 + 2] = -60 + Math.random() * 80;
  }
  const dustGeom = new THREE.BufferGeometry();
  dustGeom.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeom,
    new THREE.PointsMaterial({
      size: 0.55,
      map: dustTex,
      color: 0xf0d58c,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
  );
  dust.renderOrder = 9;
  scene.add(dust);

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
  legacy.add(door);
  // Türrahmen (dünn, dunkel) für Kontur
  const doorFrame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(W - 3.4, doorH - 0.4, 0.25)),
    new THREE.LineBasicMaterial({ color: 0x3a3c42 })
  );
  doorFrame.position.copy(door.position);
  legacy.add(doorFrame);

  // Deckel: Rahmen + Glas
  box(W, 0.8, 2.2, mShell, 0, Y1 + 0.4, -HD + 1.1);
  box(W, 0.8, 1.2, mShell, 0, Y1 + 0.4, HD - 0.6);
  box(1.6, 0.8, D, mShell, -HW + 0.8, Y1 + 0.4, 0);
  box(1.6, 0.8, D, mShell, HW - 0.8, Y1 + 0.4, 0);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(W - 3.2, 0.25, D - 3.4), mGlass);
  lid.position.set(0, Y1 + 0.55, -0.5);
  lid.renderOrder = 3;
  legacy.add(lid);

  // LED-Leiste innen oben vorn
  box(W - 6, 0.25, 0.5, mLed, 0, Y1 - 1.75, HD - 1.6);

  // Gummifüße unter den Standfüßen
  [
    [-HW + 1.5, -HD + 1.5],
    [HW - 1.5, -HD + 1.5],
    [-HW + 1.5, HD - 1.5],
    [HW - 1.5, HD - 1.5],
  ].forEach(([x, z]) => cyl(1.1, 0.35, mRubber, x, -0.18, z, "y", legacy, 18));

  // Lüftungsschlitze unten in beiden Seitenwänden
  for (let i = 0; i < 7; i++) {
    const z = -9 + i * 3;
    box(0.25, 0.5, 2.2, mShellDark, -HW - 0.03, Y0 + 2.1, z);
    box(0.25, 0.5, 2.2, mShellDark, HW + 0.03, Y0 + 2.1, z);
  }
  // Abluftgitter hinten oben
  for (let i = 0; i < 5; i++) box(3.2, 0.4, 0.2, mShellDark, HW - 6, Y1 - 4 - i * 1.1, -HD - 0.04);

  // Schrauben an den Frontpfosten
  [DOOR_Y0 + 2, doorMidY, Y1 - 3.4].forEach((y) => {
    cyl(0.22, 0.12, mScrew, -HW + 0.8, y, HD - 0.02 + 0.06, "z", legacy, 12);
    cyl(0.22, 0.12, mScrew, HW - 0.8, y, HD - 0.02 + 0.06, "z", legacy, 12);
  });

  // Türgriff (vertikale Goldleiste) + Scharniere
  box(0.5, 7, 0.5, mGold, HW - 2.6, doorMidY, HD + 0.12);
  box(0.6, 1.6, 0.7, mShellDark, -HW + 1.9, doorMidY + doorH / 2 - 2, HD - 0.25);
  box(0.6, 1.6, 0.7, mShellDark, -HW + 1.9, doorMidY - doorH / 2 + 2, HD - 0.25);

  // Markenschild oben auf der Frontblende
  const brandCanvas = document.createElement("canvas");
  brandCanvas.width = 1024;
  brandCanvas.height = 128;
  {
    // Text wird Zeichen für Zeichen mit eigenem Abstand gesetzt und vorher vermessen,
    // damit er garantiert vollständig in die Textur passt (kein abgeschnittenes "G").
    const b = brandCanvas.getContext("2d");
    const text = "GLÜCK ENGINEERING";
    const maxW = 1024 * 0.9;
    let size = 64;
    let spacing = 0;
    let total = 0;
    for (; size > 20; size -= 2) {
      b.font = `600 ${size}px Inter, sans-serif`;
      spacing = size * 0.32;
      total = [...text].reduce((w, ch) => w + b.measureText(ch).width, 0) + spacing * (text.length - 1);
      if (total <= maxW) break;
    }
    b.clearRect(0, 0, 1024, 128);
    b.fillStyle = "#d4af37";
    b.textAlign = "left";
    b.textBaseline = "middle";
    let x = (1024 - total) / 2;
    for (const ch of text) {
      b.fillText(ch, x, 66);
      x += b.measureText(ch).width + spacing;
    }
  }
  const brandTex = new THREE.CanvasTexture(brandCanvas);
  brandTex.colorSpace = THREE.SRGBColorSpace;
  brandTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const brand = new THREE.Mesh(
    new THREE.PlaneGeometry(13, 1.62),
    new THREE.MeshBasicMaterial({ map: brandTex, transparent: true, opacity: 0.92 })
  );
  brand.position.set(0, Y1 - 0.8, HD + 0.01);
  legacy.add(brand);

  // Display unten links (CanvasTexture mit Fortschritt)
  const screenCanvas = document.createElement("canvas");
  screenCanvas.width = 256;
  screenCanvas.height = 144;
  const sctx = screenCanvas.getContext("2d");
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 3.7), new THREE.MeshBasicMaterial({ map: screenTex }));
  // Display sitzt wie beim H2C oben links im schwarzen Kopfband
  screen.position.set(-HW + 6.2, Y1 - 2.9, HD + 0.06);
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
  const statusBar = box(W - 18, 0.18, 0.1, new THREE.MeshBasicMaterial({ color: 0xd4af37 }), 5, Y0 + 0.9, HD + 0.03, scene);

  // ---------- AMS-Einheit oben ----------
  const ams = new THREE.Group();
  ams.position.set(0, Y1 + 0.8, -1);
  legacy.add(ams);
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
  let spools = spoolColors.map((c, i) => {
    const g = new THREE.Group();
    // Spulen stehen nebeneinander, Drehachse = Welt-X (links ↔ rechts) wie im echten AMS
    g.position.set(-10.5 + i * 7, 4.3, 0);
    ams.add(g);
    const wound = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 2.8, 5.4, 40),
      new THREE.MeshStandardMaterial({ color: c, metalness: 0.15, roughness: 0.55 })
    );
    wound.rotation.z = Math.PI / 2;
    g.add(wound);
    [-2.9, 2.9].forEach((x) => {
      const fl = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.3, 40), mShellDark);
      fl.rotation.z = Math.PI / 2;
      fl.position.x = x;
      g.add(fl);
      // Speichen + Nabe auf der Außenseite, damit die Drehung sichtbar ist
      const out = x + Math.sign(x) * 0.18;
      const hubM = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 24), mShell);
      hubM.rotation.z = Math.PI / 2;
      hubM.position.x = out;
      g.add(hubM);
      for (let k = 0; k < 3; k++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.2, 0.45), mShell);
        const a = (k / 3) * Math.PI * 2;
        spoke.position.set(out, Math.cos(a) * 1.9, Math.sin(a) * 1.9);
        spoke.rotation.x = a;
        g.add(spoke);
      }
    });
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
  // Zahnriemen entlang der X-Achse
  box(W - 7, 0.18, 0.5, mRubber, 0, RAIL_Y + 0.55, -1.95, gantry);
  box(W - 7, 0.18, 0.5, mRubber, 0, RAIL_Y - 0.55, -1.95, gantry);
  cyl(0.25, W - 6, mRail, 0, RAIL_Y + 0.9, -0.6, "x", gantry);
  box(2.2, 2.2, 3, mHead, -HW + 3, RAIL_Y, -1.2, gantry);
  box(2.2, 2.2, 3, mHead, HW - 3, RAIL_Y, -1.2, gantry);

  const head = new THREE.Group(); // fährt in X
  gantry.add(head);
  // Werkzeugkopf: dunkler Block mit heller Frontblende
  const HEAD_Z = 1.0;
  box(4.6, 5.2, 4.4, mHead, 0, RAIL_Y - 2.2, HEAD_Z, head);
  box(4.4, 4.2, 0.3, mHeadCover, 0, RAIL_Y - 2.3, HEAD_Z + 2.3, head);
  // Logo auf der weißen Frontblende (knapp vor der Fläche + polygonOffset → kein Z-Fighting)
  const logoTex = new THREE.TextureLoader().load("/logo.webp", (tex) => {
    logo.scale.set(3.6, (3.6 * tex.image.height) / tex.image.width, 1);
    logo.visible = true;
    needsRender = true;
  });
  logoTex.colorSpace = THREE.SRGBColorSpace;
  const logoMat = new THREE.MeshStandardMaterial({
    map: logoTex,
    transparent: true,
    metalness: 0.1,
    roughness: 0.4,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), logoMat);
  logo.position.set(0, RAIL_Y - 2.3, HEAD_Z + 2.47);
  logo.visible = false;
  head.add(logo);
  // Kühlrippen am Hotend
  for (let i = 0; i < 4; i++) box(2.0, 0.14, 2.0, mScrew, 0, Y_NOZZLE + 2.6 + i * 0.3, HEAD_Z, head);
  // Bauteillüfter seitlich
  const fanRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.14, 10, 28), mShellDark);
  fanRing.rotation.y = Math.PI / 2;
  fanRing.position.set(2.42, RAIL_Y - 2.4, HEAD_Z);
  fanRing.castShadow = true;
  head.add(fanRing);
  const fanHub = cyl(0.34, 0.1, mScrew, 2.46, RAIL_Y - 2.4, HEAD_Z, "x", head, 14);
  // Status-LED am Kopf
  const headLed = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), new THREE.MeshBasicMaterial({ color: 0x4caf50 }));
  headLed.position.set(1.6, RAIL_Y - 0.6, HEAD_Z + 2.35);
  head.add(headLed);
  // Kabelschlaufe am Kopf nach hinten oben
  {
    const cablePts = [
      new THREE.Vector3(0.8, RAIL_Y + 0.4, HEAD_Z - 1.6),
      new THREE.Vector3(1.6, RAIL_Y + 2.2, HEAD_Z - 3.2),
      new THREE.Vector3(0.4, RAIL_Y + 2.6, HEAD_Z - 4.6),
      new THREE.Vector3(-1.2, RAIL_Y + 1.4, HEAD_Z - 4.2),
    ];
    const cable = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cablePts), 24, 0.14, 8, false),
      mRubber
    );
    cable.castShadow = true;
    head.add(cable);
  }
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
    cyl(0.32, 0.9, mBrass, x, RAIL_Y - 4.8, -HD + 3.2, "y", legacy, 12);
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
  const tubeStart = new THREE.Vector3(6, Y1 - 1.2, -HD + 4);
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
  // Feineres Profil: 30 Zähne mit runden Flanken (Evolventen-ähnlich), Nabe mit Passfedernut,
  // sechs Erleichterungsbohrungen auf Lochkreis
  const TEETH = 30;
  const R_TIP = 7.2;
  const R_ROOT = 6.45;
  const shape = new THREE.Shape();
  {
    const SAMPLES = 9;
    const sm = (a, b, v) => {
      const t = clamp((v - a) / (b - a));
      return t * t * (3 - 2 * t);
    };
    for (let i = 0; i < TEETH * SAMPLES; i++) {
      const u = i / (TEETH * SAMPLES);
      const ph = (u * TEETH) % 1;
      const r = R_ROOT + (R_TIP - R_ROOT) * (sm(0.04, 0.34, ph) - sm(0.5, 0.8, ph));
      const a = u * Math.PI * 2;
      if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    shape.closePath();
  }
  {
    // Nabe: Bohrung mit Passfedernut
    const hub = new THREE.Path();
    const R_HUB = 1.5;
    const k = 0.32; // halbe Nutbreite
    const aK = Math.asin(k / R_HUB);
    hub.moveTo(Math.cos(aK) * R_HUB, k);
    hub.absarc(0, 0, R_HUB, aK, Math.PI * 2 - aK, false);
    hub.lineTo(R_HUB + 0.45, -k);
    hub.lineTo(R_HUB + 0.45, k);
    hub.closePath();
    shape.holes.push(hub);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const h = new THREE.Path();
    h.absarc(Math.cos(a) * 4.1, Math.sin(a) * 4.1, 0.95, 0, Math.PI * 2, true);
    shape.holes.push(h);
  }

  const TWIST = 0.05;
  const twistAt = (y) => TWIST * (y < PART_HEIGHT / 2 ? y : PART_HEIGHT - y);

  const gearGeom = new THREE.ExtrudeGeometry(shape, { depth: PART_HEIGHT, steps: 72, bevelEnabled: false, curveSegments: 20 });
  gearGeom.rotateX(-Math.PI / 2);
  const pos = gearGeom.attributes.position;
  // Unverdrehte Ausgangspunkte merken: daraus wird das Teil bei jeder Druckhöhe neu "gestaucht"
  const base = Float32Array.from(pos.array);
  const applyHeight = (hLocal) => {
    const arr = pos.array;
    for (let i = 0; i < arr.length; i += 3) {
      const y = Math.min(base[i + 1], hLocal);
      // Schichtlinien kommen jetzt aus der Normal-Map (feiner und ohne Zusatzgeometrie)
      const x = base[i];
      const z = base[i + 2];
      const a = twistAt(y);
      const c = Math.cos(a);
      const sn = Math.sin(a);
      arr[i] = x * c - z * sn;
      arr[i + 1] = y;
      arr[i + 2] = x * sn + z * c;
    }
    pos.needsUpdate = true;
  };
  // Normalen einmal am vollständigen Teil berechnen; beim Stauchen bleiben sie gültig
  applyHeight(PART_HEIGHT);
  gearGeom.computeVertexNormals();
  gearGeom.computeBoundingSphere();
  let lastHLocal = PART_HEIGHT;

  // Echtes, geschlossenes Teil statt Schnittebene + Rückseiten-Trick → kein GPU-abhängiges Flackern
  const clipHotBand = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  // Normal-Maps aus Canvas: Flanken = Schichtlinien, Deckfläche = diagonale Füllung (±45°)
  const stripeNormalMap = (diagonal) => {
    const N = 64;
    const c = document.createElement("canvas");
    c.width = c.height = N;
    const g = c.getContext("2d");
    const img = g.createImageData(N, N);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const t = diagonal ? (x + y) / N : y / N;
        // runde Wülste je Schicht: Ableitung einer Sinus-Höhe
        const d = Math.cos(t * Math.PI * 2 * (diagonal ? 4 : 1)) * 0.55;
        const nx = diagonal ? d * 0.7071 : 0;
        const ny = diagonal ? d * 0.7071 : d;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        const o = (y * N + x) * 4;
        img.data[o] = (nx * 0.5 + 0.5) * 255;
        img.data[o + 1] = (ny * 0.5 + 0.5) * 255;
        img.data[o + 2] = (nz * 0.5 + 0.5) * 255;
        img.data[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return tex;
  };
  const LAYER_LOCAL = 0.075; // sichtbare Schichthöhe in Teil-Einheiten (~120 Schichten)
  const layerTex = stripeNormalMap(false);
  layerTex.repeat.set(1, 1 / LAYER_LOCAL);
  const infillTex = stripeNormalMap(true);
  infillTex.repeat.set(0.9, 0.9);
  const partBase = { color: 0xd4af37, metalness: 0.32, roughness: 0.4 };
  // ExtrudeGeometry: Gruppe 0 = Deck-/Bodenfläche, Gruppe 1 = Flanken
  const mPart = [
    new THREE.MeshStandardMaterial({ ...partBase, normalMap: infillTex, normalScale: new THREE.Vector2(0.5, 0.5) }),
    new THREE.MeshStandardMaterial({ ...partBase, normalMap: layerTex, normalScale: new THREE.Vector2(0.9, 0.9) }),
  ];
  // Heißes Band an der Oberkante: gleiche Geometrie, gleiche Tiefe, leicht vorgezogen
  const mHot = new THREE.MeshBasicMaterial({
    color: 0xff9a3c,
    clippingPlanes: [clipHotBand],
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
  const hotMesh = new THREE.Mesh(gearGeom, [mHot, mHot]);
  hotMesh.renderOrder = 1;
  part.add(hotMesh);
  const PART_Z = -1;
  // Unterseite minimal über der Druckplatte → kein Z-Fighting zwischen Platte und Teilboden
  const PART_LIFT = 0.12;
  part.position.y = PART_LIFT;
  part.children.forEach((c) => {
    c.castShadow = true;
    c.receiveShadow = true;
  });
  // Skirt: dünne Umrisslinie auf der Platte, wie beim echten Druckstart
  const skirt = new THREE.Mesh(
    new THREE.RingGeometry(R_TIP * S + 1.1, R_TIP * S + 1.45, 64),
    new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.25, roughness: 0.45 })
  );
  skirt.rotation.x = -Math.PI / 2;
  skirt.position.set(0, 0.05, PART_Z);
  skirt.visible = false;
  bed.add(skirt);

  // ---------- Detailliertes Blender-Modell (blender/drucker_modell.py → public/models/drucker.glb) ----------
  // Gleiche Maße wie oben. Gantry/Druckkopf/Bett/Spulen stehen im Modell in Ruhelage und werden
  // in die Gruppen dieser Szene umgehängt, damit die Animation unverändert weiterläuft.
  let disposed = false;
  const draco = new DRACOLoader();
  draco.setDecoderPath("/draco/");
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(draco);
  gltfLoader.load(
    "/models/drucker.glb",
    (gltf) => {
      if (disposed) return;
      const root = gltf.scene;
      const node = (n) => root.getObjectByName(n);
      const gNode = node("Gantry");
      const hNode = node("Druckkopf");
      const bNode = node("Bett");
      if (!gNode || !hNode || !bNode) {
        onModelReady?.();
        return;
      }
      // Blender-Materialien "Glas"/"Glas_AMS" (Tür, Seitenfenster, AMS-Hauben) → leichtes Web-Glas
      root.traverse((o) => {
        if (!o.isMesh) return;
        if (o.material.name === "Glas" || o.material.name === "Glas_AMS") {
          o.material = mGlass;
          o.renderOrder = 5;
          return;
        }
        o.castShadow = true;
        o.receiveShadow = true;
        // Transmission (z. B. PTFE) würde einen teuren Extra-Renderdurchgang auslösen
        if (o.material.transmission) o.material.transmission = 0;
      });

      // Ersatzgeometrie raus, dynamische Teile (Druckteil, Glut, Kopf) bleiben
      const keep = new Set([part, skirt, hotLight, tipGlow, head]);
      for (const g of [gantry, head, bed]) for (const c of [...g.children]) if (!keep.has(c)) g.remove(c);
      scene.remove(legacy);

      [...hNode.children].forEach((c) => head.add(c));
      [...gNode.children].forEach((c) => c !== hNode && gantry.add(c));
      [...bNode.children].forEach((c) => bed.add(c));
      const s = [0, 1, 2, 3, 4].map((i) => node(`Spule_${i}`));
      if (s.slice(0, 4).every(Boolean)) spools = s;
      scene.add(root);

      legacy.traverse((o) => {
        o.geometry?.dispose();
      });
      needsRender = true;
      onModelReady?.();
    },
    undefined,
    () => onModelReady?.()
  );

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
    { p: 0.0, r: 165, az: -0.5, el: 0.14, ty: 31 },
    { p: 0.22, r: 112, az: -0.28, el: 0.22, ty: 30 },
    { p: 0.55, r: 80, az: 0.12, el: 0.36, ty: 29 },
    { p: 0.8, r: 122, az: 0.4, el: 0.22, ty: 29 },
    { p: 1.0, r: 135, az: 0.55, el: 0.16, ty: 29 },
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

    const hLocal = f * PART_HEIGHT;
    part.visible = hLocal > 0.03;
    skirt.visible = p > 0.055 && park < 0.5;
    if (part.visible && Math.abs(hLocal - lastHLocal) > 1e-4) {
      applyHeight(hLocal);
      lastHLocal = hLocal;
    }
    const top = bedTop + PART_LIFT + hWorld;
    clipHotBand.constant = -(top - 0.3);
    hotMesh.visible = cool < 0.99;
    mHot.opacity = 0.85 * (1 - cool);
    mHot.color.copy(hotColor).lerp(coolColor, cool);

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
    if (spools[4]) spools[4].rotation.x = -f * Math.PI * 3;
    // Staub treibt langsam (nur wenn ohnehin neu gezeichnet wird)
    if (!reduceMotion) {
      dust.rotation.y = t * 0.012;
      dust.position.y = Math.sin(t * 0.25) * 1.2;
    }

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
    disposed = true;
    draco.dispose();
    cancelAnimationFrame(raf);
    window.removeEventListener("scroll", readScroll);
    window.removeEventListener("resize", resize);
    ro.disconnect();
    scene.traverse((o) => {
      o.geometry?.dispose();
      const m = o.material;
      (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => {
        x.map?.dispose();
        x.dispose();
      });
    });
    plateTex.dispose();
    screenTex.dispose();
    envTex.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
