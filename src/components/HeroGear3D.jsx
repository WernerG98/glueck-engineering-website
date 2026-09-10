import { useEffect, useRef } from "react";

function buildGearShape(THREE, { innerRadius, outerRadius, teeth, toothDepth }) {
  const shape = new THREE.Shape();
  const steps = teeth * 2;
  const angleStep = (Math.PI * 2) / steps;

  for (let i = 0; i <= steps; i++) {
    const angle = i * angleStep;
    const radius = i % 2 === 0 ? outerRadius : outerRadius - toothDepth;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const hole = new THREE.Path();
  hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  return shape;
}

export default function HeroGear3D({ className = "" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let renderer;
    let animationFrame;
    let resizeObserver;
    let disposed = false;

    async function init() {
      const container = containerRef.current;
      if (!container) return;

      const THREE = await import("three");
      if (disposed) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
      camera.position.set(0, 0, 13);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const key = new THREE.DirectionalLight(0xd4af37, 1.4);
      key.position.set(3, 4, 5);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.5);
      fill.position.set(-4, -2, -3);
      scene.add(fill);

      const shape = buildGearShape(THREE, {
        innerRadius: 1.6,
        outerRadius: 4,
        teeth: 14,
        toothDepth: 0.55,
      });

      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 1,
        bevelEnabled: true,
        bevelThickness: 0.12,
        bevelSize: 0.1,
        bevelSegments: 3,
        curveSegments: 8,
      });
      geometry.center();

      const material = new THREE.MeshStandardMaterial({
        color: 0xa3a3a3,
        metalness: 0.6,
        roughness: 0.35,
      });

      const gear = new THREE.Mesh(geometry, material);
      gear.rotation.x = 0.5;
      scene.add(gear);

      function animate() {
        gear.rotation.z += 0.0035;
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
  }, []);

  return <div ref={containerRef} className={className} aria-hidden="true" />;
}
