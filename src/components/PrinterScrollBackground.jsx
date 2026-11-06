import { useEffect, useRef, useState } from "react";

/*
 * Fixierter Hintergrund für die Startseite: ein 3D-Drucker, der beim Scrollen
 * ein Pfeilverzahnungs-Zahnrad Schicht für Schicht druckt.
 * Scroll-Fortschritt 0..1 → Aufheizen → Drucken → Fertig.
 */

const TOTAL_LAYERS = 240;
const PART_HEIGHT = 9;
const BED_TOP = 3;
const LOOPS = 70; // Umläufe der Düse über die gesamte Druckhöhe

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

    import("three").then((THREE) => {
      if (disposed || !mountRef.current) return;
      cleanup = initScene(THREE, {
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
      <div ref={mountRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />
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

function initScene(THREE, { mount, stage, dimEl, hudEl, setHud, onProgress }) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x09090a, 1);
  renderer.localClippingEnabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  mount.appendChild(renderer.domElement);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x09090a, 90, 190);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 300);

  // ---------- Licht ----------
  scene.add(new THREE.HemisphereLight(0x9aa3b5, 0x0a0a0c, 1.0));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(18, 34, 22);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd4af37, 2.6);
  rim.position.set(-24, 18, -26);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0x6f86ff, 0.35);
  fill.position.set(-20, 6, 20);
  scene.add(fill);

  // ---------- Materialien ----------
  const mFrame = new THREE.MeshStandardMaterial({ color: 0x2a2c31, metalness: 0.6, roughness: 0.38 });
  const mFrameLight = new THREE.MeshStandardMaterial({ color: 0x2c2e34, metalness: 0.75, roughness: 0.3 });
  const mRod = new THREE.MeshStandardMaterial({ color: 0xcfd3da, metalness: 1, roughness: 0.18 });
  const mGold = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.3 });
  const mBed = new THREE.MeshStandardMaterial({ color: 0x141416, metalness: 0.3, roughness: 0.75 });
  const mBrass = new THREE.MeshStandardMaterial({ color: 0xc89b4a, metalness: 1, roughness: 0.25 });
  const mHead = new THREE.MeshStandardMaterial({ color: 0x232429, metalness: 0.5, roughness: 0.45 });

  const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = scene) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };
  const rod = (len, r, mat, x, y, z, axis = "y", parent = scene) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 20), mat);
    if (axis === "x") m.rotation.z = Math.PI / 2;
    if (axis === "z") m.rotation.x = Math.PI / 2;
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };

  // ---------- Grundrahmen & Y-Achse ----------
  box(6, 1.6, 40, mFrame, -9, 0.8, 0);
  box(6, 1.6, 40, mFrame, 9, 0.8, 0);
  box(24, 1.6, 3, mFrame, 0, 0.8, -18.5);
  box(24, 1.6, 3, mFrame, 0, 0.8, 18.5);
  rod(38, 0.35, mRod, -5, 2.0, 0, "z");
  rod(38, 0.35, mRod, 5, 2.0, 0, "z");

  // Bodenplatte / Schatten-Disc
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(60, 64),
    new THREE.MeshStandardMaterial({ color: 0x0c0c0e, metalness: 0.2, roughness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  scene.add(floor);

  // ---------- Druckbett (bewegt sich in Z) ----------
  const bed = new THREE.Group();
  scene.add(bed);
  box(22, 0.5, 22, mFrameLight, 0, 2.45, 0, bed);
  box(21, 0.3, 21, mBed, 0, 2.85, 0, bed);
  const grid = new THREE.GridHelper(20, 20, 0xd4af37, 0xd4af37);
  grid.material.transparent = true;
  grid.material.opacity = 0.08;
  grid.position.y = BED_TOP + 0.01;
  bed.add(grid);

  // ---------- Z-Portal ----------
  const POST_X = 15;
  box(2.2, 31, 2.2, mFrame, -POST_X, 15.5, -1.8);
  box(2.2, 31, 2.2, mFrame, POST_X, 15.5, -1.8);
  box(32.4, 2.2, 2.2, mFrame, 0, 32, -1.8);
  rod(29, 0.4, mGold, -POST_X + 2.1, 16, -1.8); // Gewindespindeln
  rod(29, 0.4, mGold, POST_X - 2.1, 16, -1.8);
  rod(29, 0.3, mRod, -POST_X + 2.1, 16, 0.2);
  rod(29, 0.3, mRod, POST_X - 2.1, 16, 0.2);
  box(4, 3, 4, mHead, -POST_X, 1.5 + 0.01, -1.8); // Motoren
  box(4, 3, 4, mHead, POST_X, 1.5 + 0.01, -1.8);

  // ---------- X-Achse (fährt in Z hoch) ----------
  const gantry = new THREE.Group();
  scene.add(gantry);
  box(4, 3.6, 3.2, mFrameLight, -POST_X + 2.1, 0, -0.8, gantry);
  box(4, 3.6, 3.2, mFrameLight, POST_X - 2.1, 0, -0.8, gantry);
  rod(26, 0.3, mRod, 0, 0.9, -0.3, "x", gantry);
  rod(26, 0.3, mRod, 0, -0.9, -0.3, "x", gantry);

  // Druckkopf (fährt in X)
  const head = new THREE.Group();
  gantry.add(head);
  box(3.6, 4.2, 2.6, mHead, 0, 0.3, 0.9, head);
  box(3.62, 0.25, 2.62, mGold, 0, 2.3, 0.9, head);
  const fan = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.12, 10, 32), mGold);
  fan.position.set(0, 0.5, 2.22);
  head.add(fan);
  const fanHub = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16), mRod);
  fanHub.rotation.x = Math.PI / 2;
  fanHub.position.set(0, 0.5, 2.22);
  head.add(fanHub);
  box(1.4, 0.8, 1.4, mBrass, 0, -2.1, 1.0, head); // Heizblock
  const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.9, 16), mBrass);
  nozzle.rotation.x = Math.PI;
  nozzle.position.set(0, -2.95, 1.0);
  head.add(nozzle);
  const NOZZLE_DROP = 3.4; // Kopf-Ursprung → Düsenspitze
  const NOZZLE_Z = 1.0;

  const hotLight = new THREE.PointLight(0xff8a2a, 0, 9, 2);
  hotLight.position.set(0, -3.2, 1.0);
  head.add(hotLight);
  const tipGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffb35c, transparent: true, opacity: 0 })
  );
  tipGlow.position.set(0, -3.42, 1.0);
  head.add(tipGlow);

  // ---------- Filamentrolle ----------
  const spool = new THREE.Group();
  spool.position.set(0, 36.4, -1.8);
  scene.add(spool);
  const flange = new THREE.CylinderGeometry(3.6, 3.6, 0.3, 48);
  [-1.7, 1.7].forEach((x) => {
    const f = new THREE.Mesh(flange, mFrameLight);
    f.rotation.z = Math.PI / 2;
    f.position.x = x;
    spool.add(f);
  });
  const filamentWound = new THREE.Mesh(
    new THREE.CylinderGeometry(3.0, 3.0, 3.1, 48),
    new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.35, roughness: 0.5 })
  );
  filamentWound.rotation.z = Math.PI / 2;
  spool.add(filamentWound);
  box(1, 3.2, 1, mFrame, -3, 34.6, -1.8);
  box(1, 3.2, 1, mFrame, 3, 34.6, -1.8);

  // Filamentstrang Rolle → Kopf
  const FIL_PTS = 24;
  const filGeom = new THREE.BufferGeometry();
  filGeom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(FIL_PTS * 3), 3));
  const filament = new THREE.Line(filGeom, new THREE.LineBasicMaterial({ color: 0xd4af37 }));
  scene.add(filament);

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

  const TWIST = 0.05; // rad pro Einheit Höhe
  const twistAt = (y) => TWIST * (y < PART_HEIGHT / 2 ? y : PART_HEIGHT - y);

  const gearGeom = new THREE.ExtrudeGeometry(shape, { depth: PART_HEIGHT, steps: 60, bevelEnabled: false, curveSegments: 18 });
  gearGeom.rotateX(-Math.PI / 2); // Extrusion zeigt jetzt nach +Y
  const pos = gearGeom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const a = twistAt(y);
    pos.setXYZ(i, x * Math.cos(a) - z * Math.sin(a), y, x * Math.sin(a) + z * Math.cos(a));
  }
  gearGeom.computeVertexNormals();

  const clipTop = new THREE.Plane(new THREE.Vector3(0, -1, 0), BED_TOP);
  const clipHotBand = new THREE.Plane(new THREE.Vector3(0, 1, 0), -BED_TOP);

  const mPart = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.25,
    roughness: 0.42,
    clippingPlanes: [clipTop],
    side: THREE.FrontSide,
  });
  // Rückseiten als "Deckel" → frische Schicht glüht
  const mCap = new THREE.MeshBasicMaterial({ color: 0xffa040, side: THREE.BackSide, clippingPlanes: [clipTop] });
  // dünnes, heißes Band an der Oberkante
  const mHot = new THREE.MeshBasicMaterial({
    color: 0xff9a3c,
    clippingPlanes: [clipTop, clipHotBand],
    transparent: true,
    opacity: 0.9,
  });

  const part = new THREE.Group();
  part.position.y = BED_TOP;
  bed.add(part);
  part.add(new THREE.Mesh(gearGeom, mPart));
  part.add(new THREE.Mesh(gearGeom, mCap));
  const hotMesh = new THREE.Mesh(gearGeom, mHot);
  hotMesh.scale.set(1.004, 1, 1.004);
  part.add(hotMesh);

  // Düsenpfad = Außenkontur
  const outline = shape.getSpacedPoints(260).map((v) => new THREE.Vector2(v.x, -v.y));
  const pathPoint = (u, y) => {
    const n = outline.length - 1;
    const f = (((u % 1) + 1) % 1) * n;
    const i = Math.floor(f);
    const t = f - i;
    const a = outline[i];
    const b = outline[Math.min(i + 1, n)];
    const x = lerp(a.x, b.x, t);
    const z = lerp(a.y, b.y, t);
    const tw = twistAt(y);
    return [x * Math.cos(tw) - z * Math.sin(tw), x * Math.sin(tw) + z * Math.cos(tw)];
  };

  // ---------- Kamera-Keyframes (Fortschritt → Kugelkoordinaten) ----------
  const keys = [
    { p: 0.0, r: 82, az: -0.62, el: 0.16, ty: 17 },
    { p: 0.22, r: 58, az: -0.32, el: 0.3, ty: 12 },
    { p: 0.55, r: 50, az: 0.35, el: 0.55, ty: 9 },
    { p: 0.8, r: 60, az: 0.9, el: 0.3, ty: 13 },
    { p: 1.0, r: 48, az: 1.45, el: 0.36, ty: 10 },
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
  let after = 0; // Fortschritt nach dem Druck-Abschnitt (0..1)
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

  let width = 0;
  let height = 0;
  const resize = () => {
    width = mount.clientWidth;
    height = mount.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();

  window.addEventListener("scroll", readScroll, { passive: true });
  window.addEventListener("resize", resize);
  const ro = new ResizeObserver(readScroll);
  ro.observe(document.body);

  // ---------- Loop ----------
  const hotColor = new THREE.Color(0xffa040);
  const coolColor = new THREE.Color(0xb8952c);
  const tmpColor = new THREE.Color();
  let raf = 0;
  let lastHud = -1;
  const clock = new THREE.Clock();

  const tick = () => {
    raf = requestAnimationFrame(tick);
    const t = clock.getElapsedTime();
    current = reduceMotion ? target : lerp(current, target, 0.08);
    afterCur = reduceMotion ? after : lerp(afterCur, after, 0.08);
    const p = current;
    const q = afterCur;

    const f = printFraction(p);
    const h = f * PART_HEIGHT;
    const printing = p > 0.06 && p < 0.82;
    const heat = smooth(0.0, 0.06, p) * (1 - smooth(0.82, 0.9, p));
    const cool = smooth(0.8, 0.95, p);

    // Clipping auf aktuelle Schichthöhe
    const worldTop = BED_TOP + Math.max(h, 0.0001);
    clipTop.constant = worldTop;
    clipHotBand.constant = -(worldTop - 0.22);
    part.visible = h > 0.02;
    hotMesh.visible = h > 0.01 && cool < 0.99;
    mHot.opacity = 0.9 * (1 - cool);
    tmpColor.copy(hotColor).lerp(coolColor, cool);
    mCap.color.copy(tmpColor);

    // Düse auf der Kontur
    const u = f * LOOPS;
    const [px, pz] = pathPoint(u, h);
    // Am Ende: Kopf fährt zur Seite, Bett nach vorn
    const park = smooth(0.82, 0.95, p);
    const headX = lerp(px, -10, park);
    head.position.x = headX;
    bed.position.z = lerp(NOZZLE_Z - pz, 6, park);
    gantry.position.y = lerp(worldTop + NOZZLE_DROP, BED_TOP + PART_HEIGHT + NOZZLE_DROP + 6, park);
    gantry.position.z = 0;

    // Glühen
    hotLight.intensity = heat * (printing ? 14 : 8) * (0.85 + 0.15 * Math.sin(t * 9));
    tipGlow.material.opacity = heat;

    // Spule dreht sich mit dem Fortschritt
    spool.rotation.x = -f * Math.PI * 14;

    // Filament: Rolle → Kopf (quadratische Kurve)
    const fp = filGeom.attributes.position;
    const sx = 0;
    const sy = 33.6;
    const sz = 1.0;
    const ex = head.position.x;
    const ey = gantry.position.y + 2.4;
    const ez = 0.9;
    const cx = (sx + ex) / 2;
    const cy = Math.max(sy, ey) + 3;
    const cz = 4;
    for (let i = 0; i < FIL_PTS; i++) {
      const s = i / (FIL_PTS - 1);
      const a = (1 - s) * (1 - s);
      const b = 2 * (1 - s) * s;
      const c = s * s;
      fp.setXYZ(i, a * sx + b * cx + c * ex, a * sy + b * cy + c * ey, a * sz + b * cz + c * ez);
    }
    fp.needsUpdate = true;

    // Kamera
    const cam = camAt(p);
    const breathe = reduceMotion ? 0 : Math.sin(t * 0.25) * 0.04;
    const az = cam.az + breathe + q * 1.6;
    camera.position.set(
      Math.sin(az) * Math.cos(cam.el) * cam.r,
      cam.ty + Math.sin(cam.el) * cam.r,
      Math.cos(az) * Math.cos(cam.el) * cam.r
    );
    camera.lookAt(0, cam.ty, 0);

    // Auf breiten Bildschirmen steht der Drucker im Hero rechts neben dem Text
    const wide = width >= 768;
    const shift = wide ? 0.2 * (1 - smooth(0.0, 0.1, q)) : 0;
    if (shift > 0.001) camera.setViewOffset(width, height, -width * shift, 0, width, height);
    else camera.clearViewOffset();

    renderer.render(scene, camera);

    const dim = smooth(0.0, 0.12, q);
    if (dimEl) dimEl.style.opacity = String(dim * 0.55);
    if (hudEl) hudEl.style.opacity = String(1 - smooth(0.0, 0.05, q));
    onProgress(p);

    const layer = Math.round(f * TOTAL_LAYERS);
    const key = layer * 10 + Math.round(p * 100);
    if (key !== lastHud) {
      lastHud = key;
      setHud({ layer, phase: phaseFor(p), p });
    }
  };
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
    renderer.dispose();
    renderer.domElement.remove();
  };
}
