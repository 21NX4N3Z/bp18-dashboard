import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

/**
 * Hero backdrop: the team's real BP18 SolidWorks assembly when it can be
 * loaded, otherwise a procedural low-poly stand-in.
 *
 * The assembly is exported from SolidWorks as STL, decimated to a web-sized
 * mesh with pymeshlab and shipped as a static asset in public/models. It is
 * Z-up and in millimetres, so it is rotated and scaled to metres on load.
 *
 * Motion is a slow turntable plus pointer parallax; fully disabled under
 * prefers-reduced-motion and paused when the canvas is off-screen.
 */

const MODEL_URL = "/models/bp18_web.obj";

type Mat = { color: number; metal?: number; rough?: number; emissive?: number; emissiveIntensity?: number };

function cssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function std({ color, metal = 0.4, rough = 0.45, emissive, emissiveIntensity = 0 }: Mat) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: metal,
    roughness: rough,
    emissive: emissive ?? 0x000000,
    emissiveIntensity,
  });
}

export function CarScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(3.3, 1.75, 4.1);
    camera.lookAt(-1.15, 0.38, 0);

    /* ---------------- palette (theme aware) ---------------- */

    const accent = new THREE.Color(cssVar("--accent", "#2e7bff"));
    const carbon = std({ color: 0x39414b, metal: 0.72, rough: 0.3 });
    const bodyMat = std({ color: 0x4a545f, metal: 0.6, rough: 0.36 });
    const accentMat = std({
      color: accent.getHex(),
      metal: 0.4,
      rough: 0.3,
      emissive: accent.getHex(),
      emissiveIntensity: 0.45,
    });
    const tireMat = std({ color: 0x17191d, metal: 0.15, rough: 0.88 });
    const rimMat = std({ color: 0xc7ced6, metal: 1, rough: 0.18 });
    const glassMat = std({ color: 0x1d2530, metal: 0.9, rough: 0.1 });

    /* ---------------- lights ---------------- */

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    scene.add(new THREE.HemisphereLight(0xe8eef7, 0x14171c, 2.1));
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(4, 6, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(accent, 2.4);
    rim.position.set(-5, 2.5, -4);
    scene.add(rim);
    const fill = new THREE.PointLight(accent, 40, 14);
    fill.position.set(0, 1.5, -3.2);
    scene.add(fill);
    const under = new THREE.PointLight(0xffffff, 12, 8);
    under.position.set(0, 0.25, 0);
    scene.add(under);

    /* ---------------- ground ---------------- */

    const grid = new THREE.GridHelper(14, 28, accent.getHex(), 0x3a424c);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.3;
    grid.position.y = -0.002;
    scene.add(grid);

    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(3.1, 64),
      std({ color: 0x1a1f26, metal: 0.5, rough: 0.5 })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = -0.02;
    scene.add(disc);

    /* ---------------- the car ---------------- */

    const car = new THREE.Group();
    scene.add(car);

    const box = (
      w: number,
      h: number,
      d: number,
      mat: THREE.Material,
      x = 0,
      y = 0,
      z = 0,
      rx = 0,
      ry = 0,
      rz = 0
    ) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, y, z);
      mesh.rotation.set(rx, ry, rz);
      car.add(mesh);
      return mesh;
    };

    const cyl = (
      rt: number,
      rb: number,
      h: number,
      seg: number,
      mat: THREE.Material,
      x = 0,
      y = 0,
      z = 0,
      rx = 0,
      ry = 0,
      rz = 0
    ) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
      mesh.position.set(x, y, z);
      mesh.rotation.set(rx, ry, rz);
      car.add(mesh);
      return mesh;
    };

    // floor + diffuser
    box(1.42, 0.02, 3.5, carbon, 0, 0.055, 0.05);
    box(1.34, 0.015, 0.62, carbon, 0, 0.19, 1.72, -0.34);
    box(1.36, 0.09, 0.03, carbon, 0, 0.13, 2.0);

    // monocoque / tub
    box(0.86, 0.5, 1.7, bodyMat, 0, 0.42, 0.06);
    box(0.9, 0.06, 1.5, carbon, 0, 0.68, 0.1);
    cyl(0.09, 0.3, 1.25, 4, bodyMat, 0, 0.33, -0.95, Math.PI / 2, 0, Math.PI / 4);
    box(0.3, 0.16, 0.5, bodyMat, 0, 0.26, -1.42);
    box(0.62, 0.1, 0.72, glassMat, 0, 0.66, 0.06);
    box(0.4, 0.16, 0.26, carbon, 0, 0.72, 0.42);
    box(0.26, 0.34, 0.44, bodyMat, 0, 0.78, 0.78);
    cyl(0.1, 0.13, 0.2, 12, carbon, 0, 0.98, 0.78);
    box(0.26, 0.34, 1.15, bodyMat, 0.6, 0.4, 0.62);
    box(0.26, 0.34, 1.15, bodyMat, -0.6, 0.4, 0.62);
    box(0.28, 0.2, 0.12, glassMat, 0.6, 0.44, 0.08);
    box(0.28, 0.2, 0.12, glassMat, -0.6, 0.44, 0.08);
    box(0.12, 0.05, 0.06, carbon, 0.52, 0.66, 0.02);
    box(0.12, 0.05, 0.06, carbon, -0.52, 0.66, 0.02);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.028, 8, 20, Math.PI), carbon);
    halo.position.set(0, 0.78, -0.06);
    halo.rotation.set(Math.PI / 2, 0, Math.PI);
    car.add(halo);
    box(0.05, 0.2, 0.05, carbon, 0, 0.74, -0.34);

    // front wing
    box(1.72, 0.018, 0.34, carbon, 0, 0.09, -1.62);
    box(1.5, 0.014, 0.2, accentMat, 0, 0.19, -1.44, -0.22);
    box(0.02, 0.24, 0.52, carbon, 0.86, 0.17, -1.55);
    box(0.02, 0.24, 0.52, carbon, -0.86, 0.17, -1.55);
    box(0.02, 0.06, 0.4, accentMat, 0.86, 0.3, -1.55);
    box(0.02, 0.06, 0.4, accentMat, -0.86, 0.3, -1.55);

    // rear wing + swan mounts
    box(1.02, 0.018, 0.3, carbon, 0, 0.98, 1.62);
    box(1.0, 0.014, 0.24, accentMat, 0, 1.12, 1.74, -0.3);
    box(0.02, 0.36, 0.56, carbon, 0.52, 0.99, 1.66);
    box(0.02, 0.36, 0.56, carbon, -0.52, 0.99, 1.66);
    box(0.05, 0.34, 0.05, carbon, 0.12, 0.86, 1.5, -0.16);
    box(0.05, 0.34, 0.05, carbon, -0.12, 0.86, 1.5, -0.16);

    // wheels + suspension
    const wheels: THREE.Group[] = [];
    const wheel = (x: number, z: number, r: number, w: number) => {
      const g = new THREE.Group();
      g.position.set(x, r, z);
      const tyre = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 26), tireMat);
      tyre.rotation.z = Math.PI / 2;
      g.add(tyre);
      const rimDisc = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.62, w + 0.012, 18), rimMat);
      rimDisc.rotation.z = Math.PI / 2;
      g.add(rimDisc);
      const nut = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.16, r * 0.16, w + 0.04, 10), accentMat);
      nut.rotation.z = Math.PI / 2;
      g.add(nut);
      car.add(g);
      wheels.push(g);
    };
    wheel(0.62, -0.82, 0.27, 0.28);
    wheel(-0.62, -0.82, 0.27, 0.28);
    wheel(0.64, 0.86, 0.29, 0.36);
    wheel(-0.64, 0.86, 0.29, 0.36);

    const arm = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) => {
      const a = new THREE.Vector3(x1, y1, z1);
      const b = new THREE.Vector3(x2, y2, z2);
      const len = a.distanceTo(b);
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, len, 6), rimMat);
      mesh.position.copy(a).add(b).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      car.add(mesh);
    };
    for (const sx of [1, -1]) {
      arm(sx * 0.42, 0.42, -0.72, sx * 0.62, 0.46, -0.82);
      arm(sx * 0.42, 0.24, -0.66, sx * 0.62, 0.2, -0.82);
      arm(sx * 0.44, 0.44, 0.78, sx * 0.64, 0.5, 0.86);
      arm(sx * 0.44, 0.24, 0.72, sx * 0.64, 0.22, 0.86);
    }

    // everything above is the stand-in; it is hidden once the real model lands
    const standIn = car;

    /* ---------------- real assembly ---------------- */

    const applyRealModel = (obj: THREE.Object3D) => {
      const bounds = new THREE.Box3().setFromObject(obj);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const longest = Math.max(size.x, size.y, size.z) || 1;
      const scale = 3.4 / longest;

      obj.scale.setScalar(scale);
      // SolidWorks is Z-up, three.js is Y-up
      obj.rotation.x = -Math.PI / 2;
      obj.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

      const paint = std({ color: 0x353c45, metal: 0.78, rough: 0.3 });
      const trim = std({ color: accent.getHex(), metal: 0.45, rough: 0.32 });
      let i = 0;
      obj.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.material = i % 7 === 0 ? trim : paint;
        i += 1;
      });

      car.add(obj);
      standIn.visible = false;
      wheels.length = 0; // a merged mesh has no separate wheels to spin
    };

    try {
      new OBJLoader().load(
        MODEL_URL,
        applyRealModel,
        undefined,
        () => {
          /* model missing or blocked: the stand-in stays */
        }
      );
    } catch {
      /* loader unavailable: stand-in stays */
    }

    /* ---------------- interaction + animation ---------------- */

    let raf = 0;
    let running = true;
    let pointerX = 0;
    let pointerY = 0;
    const clock = new THREE.Clock();

    const resize = () => {
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onPointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointerX = ((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1;
      pointerY = ((e.clientY - r.top) / Math.max(1, r.height)) * 2 - 1;
    };
    canvas.addEventListener("pointermove", onPointer);

    const tick = () => {
      if (!running) return;
      const t = clock.getElapsedTime();
      car.rotation.y = t * 0.32;
      car.position.y = Math.sin(t * 0.9) * 0.018;
      for (const w of wheels) w.rotation.x = t * 1.6;
      camera.position.x += (3.3 + pointerX * 0.45 - camera.position.x) * 0.04;
      camera.position.y += (1.75 - pointerY * 0.3 - camera.position.y) * 0.04;
      camera.lookAt(-1.15, 0.38, 0);
      renderer.render(scene, camera);
      if (!reduced) raf = requestAnimationFrame(tick);
    };
    tick();

    const onVisibility = () => {
      running = document.visibilityState === "visible";
      if (running && reduced) {
        renderer.render(scene, camera);
      } else if (running) {
        clock.getDelta();
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const themeObserver = new MutationObserver(() => {
      accentMat.color.copy(accent);
      accentMat.emissive.copy(accent);
      rim.color.copy(accent);
      fill.color.copy(accent);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointermove", onPointer);
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = (mesh as unknown as { material?: THREE.Material | THREE.Material[] }).material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      });
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
