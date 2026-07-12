"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import GlobeGL from "react-globe.gl";
import * as THREE from "three";

export default function HomeGlobe({ isMobile }: { isMobile: boolean }) {
  const globeRef = useRef<any>(null);
  const spun = useRef(false); // giro d'entrata fatto una sola volta
  const [size, setSize] = useState({ w: 0, h: 0 });
  // materiale creato UNA volta: se ricreato ad ogni render (es. rotazione
  // schermo) perde la texture e il globo diventa nero
  const globeMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: 0x000000 }),
    [],
  );

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const dim = isMobile
        ? Math.min(vw * 1.15, vh * 0.85)
        : Math.min(vw * 0.72, vh * 1.05);
      setSize({ w: dim, h: dim });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [isMobile]);

  useEffect(() => {
    if (!globeRef.current) return;
    const g = globeRef.current;
    const controls = g.controls?.();
    if (controls) {
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.enableRotate = true;
      controls.autoRotate = false;
      controls.rotateSpeed = 0.6;
    }
    // POV centrato su Asia/SE-Asia (dove sono i luoghi visitati)
    g.pointOfView?.({ lat: 15, lng: 90, altitude: 1.85 }, 0);

    // Alza anisotropy della texture per rendering nitido (chiama dopo che texture è caricata)
    const boostTexture = () => {
      const mat = g.globeMaterial?.();
      const renderer = g.renderer?.();
      if (mat?.map && renderer) {
        const maxAniso = renderer.capabilities.getMaxAnisotropy();
        mat.map.anisotropy = maxAniso;
        mat.map.magFilter = THREE.LinearFilter;
        mat.map.minFilter = THREE.LinearMipmapLinearFilter;
        mat.map.generateMipmaps = true;
        mat.map.needsUpdate = true;
      }
    };
    const t1 = setTimeout(boostTexture, 200);
    const t2 = setTimeout(boostTexture, 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [size.w]);

  // Entrata: 2 giri (720°) a piccoli passi con pointOfView (che anima davvero,
  // al contrario di autoRotate che non si ferma). Finisce esatto sull'Asia.
  useEffect(() => {
    if (spun.current) return;
    let cancelled = false;
    let raf = 0;
    let startId = 0;
    const TURNS = 2;
    const DUR = 2600;
    const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
    const begin = () => {
      if (cancelled) return;
      const g = globeRef.current;
      const cam = g?.camera?.();
      const controls = g?.controls?.();
      if (!cam || !controls) {
        raf = window.requestAnimationFrame(begin);
        return;
      }
      spun.current = true;
      // ruoto io la camera attorno all'asse Y (deterministico, si ferma dove voglio)
      const p0 = cam.position.clone();
      const radiusXZ = Math.hypot(p0.x, p0.z);
      const y0 = p0.y;
      const a0 = Math.atan2(p0.x, p0.z);
      const t0 = performance.now();
      controls.enabled = false;
      const frame = () => {
        if (cancelled) return;
        const t = Math.min(1, (performance.now() - t0) / DUR);
        const a = a0 + 2 * Math.PI * TURNS * easeOut(t);
        cam.position.set(Math.sin(a) * radiusXZ, y0, Math.cos(a) * radiusXZ);
        cam.lookAt(0, 0, 0);
        controls.target?.set?.(0, 0, 0);
        controls.update?.();
        if (t < 1) {
          raf = window.requestAnimationFrame(frame);
        } else {
          controls.enabled = true; // fine: torna su Asia e resta interattivo
        }
      };
      raf = window.requestAnimationFrame(frame);
    };
    startId = window.setTimeout(begin, 300);
    return () => {
      cancelled = true;
      clearTimeout(startId);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (size.w === 0) return null;

  return (
    <div style={{ width: size.w, height: size.h }}>
      <GlobeGL
        ref={globeRef}
        width={size.w}
        height={size.h}
        backgroundColor="rgba(0,0,0,0)"
        // Texture custom da Figma (equirectangular 2:1) — WebP 8k, 350KB
        globeImageUrl="/world-texture.webp"
        // Fallback material — stabile (memoizzato), non ricreato ad ogni render
        globeMaterial={globeMaterial}
        showAtmosphere={false}
        showGraticules={false}
      />
    </div>
  );
}
