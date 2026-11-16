import { useEffect, useRef, useState } from "react";

// Heller "Studio"-Hintergrund: Lichtkegel von oben, feines Raster wie ein Druckbett
const STUDIO_BG = {
  backgroundColor: "#1c1c20",
  backgroundImage: [
    "radial-gradient(ellipse 70% 60% at 50% 38%, rgba(255,255,255,0.16), rgba(255,255,255,0.04) 55%, transparent 75%)",
    "radial-gradient(ellipse 60% 18% at 50% 88%, rgba(212,175,55,0.14), transparent 70%)",
    "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)",
    "linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
  ].join(","),
  backgroundSize: "100% 100%, 100% 100%, 22px 22px, 22px 22px",
  backgroundPosition: "center, center, center, center",
};

// interactive: drehbar mit Maus/Finger, dreht sich langsam von selbst.
// interactive={false}: Modell wird einmal gezeichnet und als Standbild angezeigt,
// danach wird der WebGL-Kontext wieder freigegeben (spart Leistung, z. B. auf der Startseite).
export default function ModelViewer({ src, format, interactive = true }) {
  const containerRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [visible, setVisible] = useState(false);
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return undefined;

    let renderer;
    let animationFrame;
    let resizeObserver;
    let screenObserver;
    let onScreen = true;
    let disposed = false;

    const disposeRenderer = () => {
      if (!renderer) return;
      renderer.dispose();
      renderer.forceContextLoss?.();
      renderer.domElement.remove();
      renderer = null;
    };

    async function init() {
      const container = containerRef.current;
      if (!container) return;

      const [THREE, orbitModule, loaderModule] = await Promise.all([
        import("three"),
        interactive ? import("three/examples/jsm/controls/OrbitControls.js") : Promise.resolve(null),
        format === "3mf"
          ? import("three/examples/jsm/loaders/3MFLoader.js")
          : import("three/examples/jsm/loaders/STLLoader.js"),
      ]);

      if (disposed) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      const scene = new THREE.Scene();
      scene.background = null;

      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);

      // Studio-Licht: Himmel/Boden, Hauptlicht, Aufhellung und goldenes Kantenlicht von hinten
      scene.add(new THREE.HemisphereLight(0xffffff, 0x3f3f46, 0.9));
      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(2, 3, 4);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.45);
      fill.position.set(-3, -1, -2);
      scene.add(fill);
      const rim = new THREE.DirectionalLight(0xd4af37, 1.1);
      rim.position.set(-2, 2.5, -4);
      scene.add(rim);

      let controls = null;
      if (interactive) {
        controls = new orbitModule.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 2.2;
        // Nur drehen: kein Zoom (Mausrad scrollt die Seite) und kein Verschieben
        controls.enableZoom = false;
        controls.enablePan = false;
        // Am Handy: senkrecht wischen scrollt die Seite, waagrecht wischen dreht das Modell
        renderer.domElement.style.touchAction = "pan-y";
      }

      function fitCameraToObject(object) {
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        object.position.sub(center);

        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const distance = maxDim / (2 * Math.tan((Math.PI * camera.fov) / 360)) * 1.4;

        camera.position.set(distance * 0.6, distance * 0.5, distance);
        camera.near = distance / 100;
        camera.far = distance * 100;
        camera.updateProjectionMatrix();
        camera.lookAt(0, 0, 0);
        if (controls) {
          controls.target.set(0, 0, 0);
          controls.update();
        }
      }

      const material = new THREE.MeshStandardMaterial({
        color: 0xd4d4d8,
        metalness: 0.1,
        roughness: 0.55,
      });

      let spinner = null;

      // Standbild: einmal rendern, als Bild übernehmen, Renderer freigeben
      const captureStill = () => {
        if (interactive || disposed || !renderer) return;
        renderer.render(scene, camera);
        setSnapshot(renderer.domElement.toDataURL("image/png"));
        disposeRenderer();
      };

      try {
        if (format === "3mf") {
          const loader = new loaderModule.ThreeMFLoader();
          loader.load(
            src,
            (object) => {
              if (disposed) return;
              object.traverse((child) => {
                if (child.isMesh) child.material = material;
              });
              scene.add(object);
              fitCameraToObject(object);
              spinner = object;
              setStatus("ready");
              captureStill();
            },
            undefined,
            () => setStatus("error")
          );
        } else {
          const loader = new loaderModule.STLLoader();
          loader.load(
            src,
            (geometry) => {
              if (disposed) return;
              geometry.computeVertexNormals();
              const mesh = new THREE.Mesh(geometry, material);
              scene.add(mesh);
              fitCameraToObject(mesh);
              spinner = mesh;
              setStatus("ready");
              captureStill();
            },
            undefined,
            () => setStatus("error")
          );
        }
      } catch {
        setStatus("error");
      }

      if (!interactive) return;

      // Außerhalb des Bildschirms nicht rendern (mehrere Viewer auf einer Seite)
      screenObserver = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
      });
      screenObserver.observe(container);

      function animate() {
        animationFrame = requestAnimationFrame(animate);
        if (!onScreen || !renderer) return;
        controls.update();
        renderer.render(scene, camera);
      }
      animate();

      resizeObserver = new ResizeObserver(() => {
        if (!container || !renderer) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w === 0 || h === 0) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
      resizeObserver.observe(container);
    }

    init();

    return () => {
      disposed = true;
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (resizeObserver) resizeObserver.disconnect();
      if (screenObserver) screenObserver.disconnect();
      disposeRenderer();
    };
  }, [src, format, interactive, visible]);

  return (
    <div className="relative h-full w-full" style={STUDIO_BG}>
      <div
        ref={containerRef}
        className={`h-full w-full ${interactive ? "cursor-grab active:cursor-grabbing" : ""}`}
      >
        {snapshot && <img src={snapshot} alt="" className="h-full w-full object-contain" />}
      </div>
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-450">
          3D-Modell wird geladen…
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-neutral-450">
          3D-Modell konnte nicht geladen werden.
        </div>
      )}
    </div>
  );
}
