"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  buildPointSizes,
  configureHeroCloudCamera,
  createHeroCloudMaterial,
  createSoftSpriteMap,
  applyHeroCloudTransform,
  heroPixelRatio,
  heroPointCount,
} from "@/app/lib/heroCloudMaterial";
import {
  createHeroGpuCloud,
  disposeHeroGpuCloud,
  projectPointerToLocalMouse,
  stepHeroGpuCloud,
  type HeroGpuCloud,
} from "@/app/lib/heroGpuCloud";
import {
  fallbackCloud,
  sampleGlb,
} from "@/app/lib/sampleGlb";
import type { PortraitSample } from "@/app/lib/samplePortrait";
import { useReducedMotion } from "@/app/lib/reducedMotion";

const HERO_CLOUD_SRC = "/hero-cloud.glb";

type CpuCloudState = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  points: THREE.Points;
  material: THREE.ShaderMaterial;
  spriteMap: THREE.CanvasTexture;
  hover: number;
  time: number;
  usesGpu: false;
};

type CloudState = HeroGpuCloud | CpuCloudState;

function buildCpuCloud(root: HTMLElement, sample: PortraitSample): CpuCloudState {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  configureHeroCloudCamera(camera);

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
  applyHeroCloudTransform(points);
  scene.add(points);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = "hero-bubble__canvas";
  root.appendChild(renderer.domElement);

  return {
    scene,
    camera,
    renderer,
    points,
    material,
    spriteMap,
    hover: 0,
    time: 0,
    usesGpu: false,
  };
}

function buildCloud(root: HTMLElement, sample: PortraitSample): CloudState {
  const gpuCloud = createHeroGpuCloud(root, sample);
  if (gpuCloud) {
    return gpuCloud;
  }
  return buildCpuCloud(root, sample);
}

function resizeCloud(state: CloudState, width: number, height: number) {
  if (width <= 0 || height <= 0) {
    return;
  }
  state.camera.aspect = width / height;
  state.camera.updateProjectionMatrix();
  state.renderer.setPixelRatio(heroPixelRatio());
  state.renderer.setSize(width, height, false);
}

function animateCloud(
  state: CloudState,
  delta: number,
  pointerActive: boolean,
) {
  if (state.usesGpu) {
    stepHeroGpuCloud(state, delta, pointerActive);
    return;
  }

  state.time += delta;
  state.material.uniforms.uTime.value = state.time;

  state.points.rotation.y += delta * 0.045;
  state.points.rotation.x = THREE.MathUtils.damp(
    state.points.rotation.x,
    0.1,
    3,
    delta,
  );

  state.renderer.render(state.scene, state.camera);
}

function disposeCloud(state: CloudState) {
  if (state.usesGpu) {
    disposeHeroGpuCloud(state);
    return;
  }

  state.renderer.domElement.remove();
  state.points.geometry.dispose();
  state.material.dispose();
  state.spriteMap.dispose();
  state.renderer.dispose();
}

export function HeroPointCloud() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerActiveRef = useRef(false);
  const pointerRef = useRef({ x: 0, y: 0 });

  const projectMouse = (cloud: CloudState, clientX: number, clientY: number) => {
    if (!cloud.usesGpu) {
      return;
    }

    projectPointerToLocalMouse(
      clientX,
      clientY,
      cloud.renderer.domElement,
      cloud.camera,
      cloud.points,
      cloud.mouseLocal,
      cloud.mouseNDC,
    );
  };

  useEffect(() => {
    const root = rootRef.current;
    if (reduced || !root) {
      return;
    }

    let disposed = false;
    let frame = 0;
    let cloud: CloudState | null = null;
    const timer = new THREE.Timer();
    timer.connect(document);
    let cleanupMount: (() => void) | undefined;
    const pointCount = heroPointCount();

    const mount = (sample: PortraitSample) => {
      if (disposed) {
        return;
      }

      cloud = buildCloud(root, sample);

      const syncSize = () => {
        if (!cloud) {
          return;
        }
        resizeCloud(cloud, root.clientWidth, root.clientHeight);
      };

      syncSize();
      const observer = new ResizeObserver(syncSize);
      observer.observe(root);

      const hitTarget = root.parentElement ?? root;

      const onPointerEnter = (event: PointerEvent) => {
        pointerActiveRef.current = true;
        pointerRef.current.x = event.clientX;
        pointerRef.current.y = event.clientY;
        if (cloud) {
          projectMouse(cloud, event.clientX, event.clientY);
        }
      };

      const onPointerMove = (event: PointerEvent) => {
        pointerActiveRef.current = true;
        pointerRef.current.x = event.clientX;
        pointerRef.current.y = event.clientY;

        if (cloud) {
          projectMouse(cloud, event.clientX, event.clientY);
        }
      };

      hitTarget.addEventListener("pointerenter", onPointerEnter);
      hitTarget.addEventListener("pointermove", onPointerMove);

      const tick = (timestamp: number) => {
        if (!cloud || disposed) {
          return;
        }

        timer.update(timestamp);

        if (cloud?.usesGpu && pointerActiveRef.current) {
          projectMouse(cloud, pointerRef.current.x, pointerRef.current.y);
        }

        animateCloud(cloud, timer.getDelta(), pointerActiveRef.current);
        frame = window.requestAnimationFrame(tick);
      };
      frame = window.requestAnimationFrame(tick);

      return () => {
        hitTarget.removeEventListener("pointerenter", onPointerEnter);
        hitTarget.removeEventListener("pointermove", onPointerMove);
        observer.disconnect();
        window.cancelAnimationFrame(frame);
        if (cloud) {
          disposeCloud(cloud);
        }
        cloud = null;
        timer.dispose();
      };
    };

    sampleGlb(HERO_CLOUD_SRC, pointCount)
      .then((result) => {
        if (disposed) {
          return;
        }
        cleanupMount = mount(result ?? fallbackCloud(pointCount));
      })
      .catch(() => {
        if (disposed) {
          return;
        }
        cleanupMount = mount(fallbackCloud(pointCount));
      });

    return () => {
      disposed = true;
      cleanupMount?.();
    };
  }, [reduced]);

  if (reduced) {
    return null;
  }

  return (
    <div
      ref={rootRef}
      className="hero-bubble__host"
      aria-hidden="true"
      onPointerEnter={() => {
        pointerActiveRef.current = true;
      }}
      onPointerMove={(event) => {
        pointerActiveRef.current = true;
        pointerRef.current.x = event.clientX;
        pointerRef.current.y = event.clientY;
      }}
      onPointerLeave={() => {
        pointerActiveRef.current = false;
      }}
    />
  );
}
