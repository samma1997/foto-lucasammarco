"use client";

import { useEffect, useRef, useState } from "react";
import GlobeGL from "react-globe.gl";
import * as THREE from "three";

export default function HomeGlobe({ isMobile }: { isMobile: boolean }) {
  const globeRef = useRef<any>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

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
        // Fallback material — se PNG non caricato, sfera nera
        globeMaterial={new THREE.MeshBasicMaterial({ color: 0x000000 })}
        showAtmosphere={false}
        showGraticules={false}
      />
    </div>
  );
}
