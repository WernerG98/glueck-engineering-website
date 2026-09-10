import { useEffect, useRef, useState } from "react";

export default function ModelViewer({ src, format }) {
  const containerRef = useRef(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let renderer;
    let animationFrame;
    let resizeObserver;
    let disposed = false;

    async function init() {
      const container = containerRef.current;
      if (!container) return;

      const [THREE, { OrbitControls }, loaderModule] = await Promise.all([
        import("three"),
        import("three/examples/jsm/controls/OrbitControls.js"),
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

      scene.add(new THREE.AmbientLight(0xffffff, 0.7));
      const key = new THREE.DirectionalLight(0xffffff, 1.2);
      key.position.set(2, 3, 4);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.5);
      fill.position.set(-3, -1, -2);
      scene.add(fill);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 2.2;

      function fitCameraToObject(object) {
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        object.position.sub(center);

        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const distance = maxDim / (2 * Math.tan((Math.PI * camera.fov) / 360)) * 1.6;

        camera.position.set(distance * 0.6, distance * 0.5, distance);
        camera.near = distance / 100;
        camera.far = distance * 100;
        camera.updateProjectionMatrix();
        controls.target.set(0, 0, 0);
        controls.update();
      }

      const material = new THREE.MeshStandardMaterial({
        color: 0xd4d4d8,
        metalness: 0.1,
        roughness: 0.55,
      });

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
              setStatus("ready");
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
              setStatus("ready");
            },
            undefined,
            () => setStatus("error")
          );
        }
      } catch {
        setStatus("error");
      }

      function animate() {
        controls.update();
        renderer.render(scene, camera);
        animationFrame = requestAnimationFrame(animate);
      }
      animate();

      resizeObserver = new ResizeObserver(() => {
        if (!container) return;
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
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, [src, format]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500">
          3D-Modell wird geladen…
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-neutral-500">
          3D-Modell konnte nicht geladen werden.
        </div>
      )}
    </div>
  );
}
