"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";
import {
  fallbackCloud,
  samplePortrait,
  type PortraitSample,
} from "@/app/lib/samplePortrait";
import { cinematicDpr } from "@/app/lib/reducedMotion";

const PORTRAIT_SRC = "/portrait.png";

function CloudMesh({
  sample,
  hovered,
}: {
  sample: PortraitSample;
  hovered: boolean;
}) {
  const points = useRef<THREE.Points>(null);
  const hover = useRef(0);
  const lastHover = useRef(-1);
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute(
      "position",
      new THREE.BufferAttribute(sample.positions.slice(), 3),
    );
    geom.setAttribute("color", new THREE.BufferAttribute(sample.colors, 3));
    geom.setAttribute(
      "rest",
      new THREE.BufferAttribute(sample.positions.slice(), 3),
    );
    return geom;
  }, [sample]);

  useFrame((_, delta) => {
    const cloud = points.current;
    if (!cloud) {
      return;
    }
    hover.current = THREE.MathUtils.damp(
      hover.current,
      hovered ? 1 : 0,
      4.2,
      delta,
    );
    if (Math.abs(hover.current - lastHover.current) > 0.001) {
      const positions = cloud.geometry.getAttribute("position");
      const rest = cloud.geometry.getAttribute("rest");
      for (let i = 0; i < positions.count; i += 1) {
        const z = THREE.MathUtils.lerp(rest.getZ(i), 0.02, hover.current);
        positions.setZ(i, z);
      }
      positions.needsUpdate = true;
      lastHover.current = hover.current;
    }
    if (hovered) {
      cloud.rotation.y = THREE.MathUtils.damp(cloud.rotation.y, 0, 4, delta);
    } else {
      cloud.rotation.y += delta * 0.16;
    }
    const material = cloud.material as THREE.PointsMaterial;
    material.opacity = 1 - hover.current * 0.78;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        size={0.028}
        vertexColors
        transparent
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

type PortraitCloudProps = {
  reduced: boolean;
};

export function PortraitCloud({ reduced }: PortraitCloudProps) {
  const photoRef = useRef<HTMLImageElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const [sample, setSample] = useState<PortraitSample | null>(null);
  const [hovered, setHovered] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let ignore = false;
    samplePortrait(PORTRAIT_SRC)
      .then((result) => {
        if (ignore) {
          return;
        }
        if (result) {
          setSample(result);
          setMissing(false);
        } else {
          setSample(fallbackCloud());
          setMissing(true);
        }
      })
      .catch(() => {
        if (!ignore) {
          setSample(fallbackCloud());
          setMissing(true);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const photo = photoRef.current;
    if (photo) {
      photo.style.opacity = hovered && !missing ? "0.92" : "0";
    }
    if (hintRef.current) {
      hintRef.current.style.opacity = hovered ? "0" : "1";
    }
  }, [hovered, missing]);

  return (
    <div
      className="portrait-frame"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {!reduced && sample ? (
        <Canvas
          dpr={[1, cinematicDpr()]}
          camera={{ position: [0, 0, 3.1], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
        >
          <AdaptiveDpr pixelated />
          <CloudMesh sample={sample} hovered={hovered} />
        </Canvas>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={PORTRAIT_SRC}
          alt=""
          className="portrait-photo"
          style={{ opacity: reduced ? 1 : 0, position: "relative" }}
        />
      )}
      {!missing ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={photoRef}
          src={PORTRAIT_SRC}
          alt="Profilbild"
          className="portrait-photo"
        />
      ) : null}
      <p ref={hintRef} className="portrait-hint">
        {missing
          ? "Lege public/portrait.png ab"
          : "Hover — das Bild erscheint"}
      </p>
    </div>
  );
}
