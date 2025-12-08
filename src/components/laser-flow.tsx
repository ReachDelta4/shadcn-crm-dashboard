"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type LaserFlowProps = {
  horizontalBeamOffset?: number;
  verticalBeamOffset?: number;
  color?: string;
};

export default function LaserFlow({
  horizontalBeamOffset = 0.1,
  verticalBeamOffset = 0.0,
  color = "#FF79C6",
}: LaserFlowProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const beamMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.7,
    });

    const horizontalGeometry = new THREE.PlaneGeometry(8, 0.08);
    const horizontalBeam = new THREE.Mesh(horizontalGeometry, beamMaterial);
    scene.add(horizontalBeam);

    const verticalGeometry = new THREE.PlaneGeometry(0.08, 8);
    const verticalBeam = new THREE.Mesh(verticalGeometry, beamMaterial);
    scene.add(verticalBeam);

    const clock = new THREE.Clock();

    const updateBeamPositions = (time: number) => {
      const baseX = (verticalBeamOffset - 0.5) * 2;
      const baseY = (horizontalBeamOffset - 0.5) * 2;
      const pulse = Math.sin(time * 1.5) * 0.4;

      horizontalBeam.position.y = baseY + pulse * 0.4;
      verticalBeam.position.x = baseX - pulse * 0.4;
    };

    const handleResize = () => {
      const nextWidth = container.clientWidth || 1;
      const nextHeight = container.clientHeight || 1;
      renderer.setSize(nextWidth, nextHeight);
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);

    let frameId: number;

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      updateBeamPositions(elapsed);

      const flicker = 0.4 + 0.3 * Math.sin(elapsed * 3);
      beamMaterial.opacity = flicker;

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      scene.clear();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [horizontalBeamOffset, verticalBeamOffset, color]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
    />
  );
}

