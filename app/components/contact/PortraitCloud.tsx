"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  buildPointSizes,
  createHeroCloudMaterial,
  createSoftSpriteMap,
  heroPixelRatio,
  heroPointCount,
} from "@/app/lib/heroCloudMaterial";
import { fallbackCloud, PORTRAIT_GLB_FIT, sampleGlb } from "@/app/lib/sampleGlb";
import { samplePortrait } from "@/app/lib/samplePortrait";
import type { PortraitSample } from "@/app/lib/samplePortrait";

const MESH_SRC = "/portrait-mesh.glb";
const PORTRAIT_SRC = "/portrait.png";

const HOME_CAMERA = { x: 0, y: 0, z: 2.6 };
const RESET_COMPLETE_THRESHOLD = 0.97;
const PORTRAIT_CAMERA_FOV = 36;

type Pointer = { x: number; y: number };
type HoverStage = "idle" | "resetting" | "revealing" | "photo";

type PortraitCloudState = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  points: THREE.Points;
  material: THREE.ShaderMaterial;
  spriteMap: THREE.CanvasTexture;
  time: number;
};

function normalizeAngle(angle: number) {
  return THREE.MathUtils.euclideanModulo(angle + Math.PI, Math.PI * 2) - Math.PI;
}

function lerpAngle(current: number, target: number, alpha: number) {
  return current + normalizeAngle(target - current) * alpha;
}

function buildPortraitCloud(
  host: HTMLElement,
  sample: PortraitSample,
): PortraitCloudState {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(PORTRAIT_CAMERA_FOV, 1, 0.1, 20);
  camera.position.set(0, 0, HOME_CAMERA.z);

  const rest = sample.positions.slice();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(rest.slice(), 3));
  geometry.setAttribute("aRest", new THREE.BufferAttribute(rest, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(sample.colors, 3));
  geometry.setAttribute(
    "aSize",
    new THREE.BufferAttribute(buildPointSizes(sample.count), 1),
  );
  geometry.computeBoundingSphere();

  const spriteMap = createSoftSpriteMap();
  const material = createHeroCloudMaterial(spriteMap);

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  host.appendChild(canvas);

  return {
    scene,
    camera,
    renderer,
    points,
    material,
    spriteMap,
    time: 0,
  };
}

function resizePortraitCloud(state: PortraitCloudState, width: number, height: number) {
  if (width < 8 || height < 8) return;
  state.renderer.setPixelRatio(heroPixelRatio());
  state.renderer.setSize(width, height, false);
  state.camera.aspect = width / height;
  state.camera.updateProjectionMatrix();
}

function disposePortraitCloud(state: PortraitCloudState) {
  state.renderer.domElement.remove();
  state.points.geometry.dispose();
  state.material.dispose();
  state.spriteMap.dispose();
  state.renderer.dispose();
}

type PortraitCloudProps = {
  reduced: boolean;
};

export function PortraitCloud({ reduced }: PortraitCloudProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const photoLayerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [missing, setMissing] = useState(false);
  const [photoActive, setPhotoActive] = useState(false);

  const hoverStageRef = useRef<HoverStage>("idle");
  const pointerRef = useRef<Pointer>({ x: 0, y: 0 });
  const pointerTargetRef = useRef<Pointer>({ x: 0, y: 0 });
  const revealRef = useRef(0);
  const photoActiveRef = useRef(false);
  const spinAngleRef = useRef(0);

  const updatePointer = useCallback((clientX: number, clientY: number) => {
    const root = rootRef.current;
    if (!root) return;

    const rect = root.getBoundingClientRect();
    const next = {
      x: ((clientX - rect.left) / rect.width) * 2 - 1,
      y: -(((clientY - rect.top) / rect.height) * 2 - 1),
    };
    pointerTargetRef.current = next;
    if (hoverStageRef.current === "idle") {
      pointerRef.current = next;
    }
  }, []);

  const beginHoverSequence = useCallback(() => {
    if (hoverStageRef.current === "idle") {
      hoverStageRef.current = "resetting";
      pointerTargetRef.current = { x: 0, y: 0 };
      spinAngleRef.current = 0;
    }
  }, []);

  const endHoverSequence = useCallback(() => {
    hoverStageRef.current = "idle";
    pointerRef.current = { x: 0, y: 0 };
    pointerTargetRef.current = { x: 0, y: 0 };
    photoActiveRef.current = false;
    setPhotoActive(false);
    revealRef.current = 0;
  }, []);

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host || reduced) return;

    let disposed = false;
    let frameId = 0;
    let cloud: PortraitCloudState | null = null;
    let cleanupMount: (() => void) | undefined;
    let pageHidden = document.hidden;
    let resettingSince = 0;

    const onVisibility = () => {
      pageHidden = document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);

    const getResetProgress = () => {
      if (!cloud) return 0;
      const rotDist = Math.hypot(
        cloud.points.rotation.x,
        cloud.points.rotation.y,
        cloud.points.rotation.z,
      );
      const camDist = Math.hypot(
        cloud.camera.position.x - HOME_CAMERA.x,
        cloud.camera.position.y - HOME_CAMERA.y,
      );
      return (
        1 -
        Math.max(
          Math.min(1, rotDist / 0.22),
          Math.min(1, camDist / 0.16),
        )
      );
    };

    const mount = (sample: PortraitSample) => {
      if (disposed) return;

      cloud = buildPortraitCloud(host, sample);
      setReady(true);

      const resize = () => {
        if (!cloud) return;
        resizePortraitCloud(cloud, host.clientWidth, host.clientHeight);
      };

      resize();
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);

      const clock = new THREE.Clock();

      const animate = () => {
        frameId = window.requestAnimationFrame(animate);
        if (!cloud || pageHidden) return;

        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();
        let stage = hoverStageRef.current;
        const pointer = pointerRef.current;
        const pointsGroup = cloud.points;

        if (stage === "resetting" && resettingSince === 0) {
          resettingSince = elapsed;
        }
        if (stage === "idle") {
          resettingSince = 0;
        }

        cloud.time += delta;
        cloud.material.uniforms.uTime.value = cloud.time;

        if (stage === "idle") {
          const depthStrength = 0.22;
          const tiltX = pointer.y * depthStrength;
          const tiltY = pointer.x * depthStrength;

          spinAngleRef.current = normalizeAngle(spinAngleRef.current + delta * 0.05);
          const targetY = normalizeAngle(tiltY + spinAngleRef.current);
          const targetX = tiltX + Math.sin(elapsed * 0.55) * 0.03;
          pointsGroup.rotation.y = lerpAngle(pointsGroup.rotation.y, targetY, 0.08);
          pointsGroup.rotation.x = lerpAngle(pointsGroup.rotation.x, targetX, 0.08);

          cloud.camera.position.x = THREE.MathUtils.lerp(
            cloud.camera.position.x,
            pointer.x * 0.14,
            0.1,
          );
          cloud.camera.position.y = THREE.MathUtils.lerp(
            cloud.camera.position.y,
            pointer.y * 0.12,
            0.1,
          );
          revealRef.current = THREE.MathUtils.lerp(revealRef.current, 0, 0.12);
        } else {
          spinAngleRef.current = lerpAngle(spinAngleRef.current, 0, 0.12);
          pointsGroup.rotation.x = lerpAngle(pointsGroup.rotation.x, 0, 0.12);
          pointsGroup.rotation.y = lerpAngle(pointsGroup.rotation.y, 0, 0.12);
          pointsGroup.rotation.z = lerpAngle(pointsGroup.rotation.z, 0, 0.12);

          pointerRef.current.x = THREE.MathUtils.lerp(pointerRef.current.x, 0, 0.16);
          pointerRef.current.y = THREE.MathUtils.lerp(pointerRef.current.y, 0, 0.16);
          cloud.camera.position.x = THREE.MathUtils.lerp(
            cloud.camera.position.x,
            HOME_CAMERA.x,
            0.14,
          );
          cloud.camera.position.y = THREE.MathUtils.lerp(
            cloud.camera.position.y,
            HOME_CAMERA.y,
            0.14,
          );

          const resetProgress = getResetProgress();
          const resetTimedOut =
            resettingSince > 0 && elapsed - resettingSince > 0.45;

          if (
            stage === "resetting" &&
            (resetProgress >= RESET_COMPLETE_THRESHOLD || resetTimedOut)
          ) {
            hoverStageRef.current = "revealing";
            stage = "revealing";
          }

          if (stage === "revealing" || stage === "photo") {
            revealRef.current = THREE.MathUtils.lerp(revealRef.current, 1, 0.2);
            if (revealRef.current > 0.96) {
              hoverStageRef.current = "photo";
              stage = "photo";
            }
          }
        }

        cloud.camera.position.z = HOME_CAMERA.z;
        cloud.camera.lookAt(0, 0, 0);

        const reveal = revealRef.current;
        cloud.material.opacity = THREE.MathUtils.lerp(0.92, 0, reveal);
        cloud.renderer.domElement.style.opacity = String(THREE.MathUtils.lerp(1, 0, reveal));

        if (photoLayerRef.current) {
          photoLayerRef.current.style.opacity = String(reveal);
          photoLayerRef.current.style.transform = `perspective(900px) rotateX(${-pointerRef.current.y * reveal * 5}deg) rotateY(${pointerRef.current.x * reveal * 5}deg) scale(${1 + reveal * 0.02})`;
          photoLayerRef.current.style.pointerEvents = reveal > 0.85 ? "auto" : "none";
        }

        const isPhotoActive = reveal > 0.85;
        if (isPhotoActive !== photoActiveRef.current) {
          photoActiveRef.current = isPhotoActive;
          setPhotoActive(isPhotoActive);
        }

        cloud.renderer.render(cloud.scene, cloud.camera);
      };

      animate();

      return () => {
        resizeObserver.disconnect();
        window.cancelAnimationFrame(frameId);
        if (cloud) {
          disposePortraitCloud(cloud);
        }
        cloud = null;
      };
    };

    const pointCount = heroPointCount();

    sampleGlb(MESH_SRC, pointCount, PORTRAIT_GLB_FIT)
      .then((result) => {
        if (disposed) return;
        if (result) {
          setMissing(false);
          cleanupMount = mount(result);
          return;
        }
        return samplePortrait(PORTRAIT_SRC, pointCount).then((pngResult) => {
          if (disposed) return;
          if (pngResult) {
            setMissing(false);
            cleanupMount = mount(pngResult);
          } else {
            setMissing(true);
            cleanupMount = mount(fallbackCloud(pointCount));
          }
        });
      })
      .catch(() => {
        if (disposed) return;
        setMissing(true);
        cleanupMount = mount(fallbackCloud(pointCount));
      });

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibility);
      cleanupMount?.();
      cloud = null;
      setReady(false);
    };
  }, [reduced]);

  const handleClick = () => {
    if (window.matchMedia("(hover: none)").matches) {
      beginHoverSequence();
    }
  };

  if (reduced) {
    return (
      <div
        className="portrait-frame portrait-frame--static"
        role="img"
        aria-label="Profilfoto Lorenzo Seminara"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PORTRAIT_SRC}
          alt="Lorenzo Seminara"
          className="portrait-photo"
        />
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="portrait-frame"
      onMouseEnter={beginHoverSequence}
      onMouseLeave={endHoverSequence}
      onMouseMove={(event) => updatePointer(event.clientX, event.clientY)}
      onClick={handleClick}
      onFocus={beginHoverSequence}
      onBlur={endHoverSequence}
      tabIndex={0}
      role="button"
      aria-label={
        photoActive
          ? "Profilfoto — Foto angezeigt"
          : "Profil-Scan — Foto anzeigen"
      }
    >
      <div
        ref={canvasHostRef}
        className={`portrait-canvas-host${ready ? " is-ready" : ""}`}
        aria-hidden="true"
      />

      {!missing ? (
        <div
          ref={photoLayerRef}
          className="portrait-photo-layer"
          aria-hidden={!photoActive}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PORTRAIT_SRC}
            alt="Lorenzo Seminara"
            className="portrait-photo"
          />
        </div>
      ) : null}

      <p className="portrait-hint">
        {missing
          ? "Lege public/portrait-mesh.glb ab"
          : photoActive
            ? ""
            : (
              <>
                <span className="portrait-hint-hover">Hover — das Bild erscheint</span>
                <span className="portrait-hint-touch">Tippen — das Bild erscheint</span>
              </>
            )}
      </p>
    </div>
  );
}
