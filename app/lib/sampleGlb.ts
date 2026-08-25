import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as THREE from "three";
import type { PortraitSample } from "@/app/lib/samplePortrait";

const FLOW = { r: 1.0, g: 207 / 255, b: 74 / 255 };
const FLOW_DIM = { r: 0.82, g: 0.58, b: 0.16 };

export type GlbSampleFit = {
  maxDimScale: number;
  offsetX: number;
  offsetY: number;
};

export const HERO_GLB_FIT: GlbSampleFit = {
  maxDimScale: 2.18,
  offsetX: 0,
  offsetY: 0,
};

export const PORTRAIT_GLB_FIT: GlbSampleFit = {
  maxDimScale: 1.38,
  offsetX: 0.1,
  offsetY: -0.1,
};

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function samplerArea(sampler: MeshSurfaceSampler): number {
  const distribution = sampler.distribution;
  if (!distribution || distribution.length === 0) {
    return 0;
  }
  return distribution[distribution.length - 1];
}

type BuiltMeshSampler = {
  mesh: THREE.Mesh;
  sampler: MeshSurfaceSampler;
  area: number;
};

function buildMeshSamplers(meshes: THREE.Mesh[]): BuiltMeshSampler[] {
  return meshes
    .map((mesh) => {
      const sampler = new MeshSurfaceSampler(mesh).build();
      return {
        mesh,
        sampler,
        area: samplerArea(sampler),
      };
    })
    .filter((entry) => entry.area > 0);
}

function allocateSampleCounts(
  entries: BuiltMeshSampler[],
  maxPoints: number,
): number[] {
  const totalArea = entries.reduce((sum, entry) => sum + entry.area, 0);
  if (totalArea <= 0) {
    return entries.map(() => 0);
  }

  const counts = entries.map((entry) =>
    Math.floor(maxPoints * (entry.area / totalArea)),
  );
  let remaining =
    maxPoints - counts.reduce((sum, count) => sum + count, 0);

  const ranked = entries
    .map((entry, index) => ({
      index,
      remainder: maxPoints * (entry.area / totalArea) - counts[index],
    }))
    .sort((a, b) => b.remainder - a.remainder);

  for (let i = 0; i < remaining; i += 1) {
    counts[ranked[i % ranked.length].index] += 1;
  }

  return counts;
}

function sampleMeshes(
  entries: BuiltMeshSampler[],
  counts: number[],
): THREE.Vector3[] {
  const sample = new THREE.Vector3();
  const raw: THREE.Vector3[] = [];

  for (let index = 0; index < entries.length; index += 1) {
    const count = counts[index];
    if (count <= 0) {
      continue;
    }

    const { mesh, sampler } = entries[index];
    for (let i = 0; i < count; i += 1) {
      sampler.sample(sample);
      raw.push(sample.clone().applyMatrix4(mesh.matrixWorld));
    }
  }

  return raw;
}

function applyColorVariance(colors: Float32Array) {
  for (let i = 0; i < colors.length; i += 3) {
    const seed = Math.sin((i + 1) * 12.9898) * 43758.5453;
    const variance = 0.8 + (seed - Math.floor(seed)) * 0.4;
    colors[i] *= variance;
    colors[i + 1] *= variance;
    colors[i + 2] *= variance;
  }
}

export function fallbackSphere(count = 80_000): PortraitSample {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const radius = 1.2;

  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / Math.max(count - 1, 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    const x = Math.cos(theta) * ring * radius;
    const py = y * radius;
    const z = Math.sin(theta) * ring * radius;
    positions[i * 3] = x;
    positions[i * 3 + 1] = py;
    positions[i * 3 + 2] = z;
    const t = py / (radius * 2) + 0.5;
    colors[i * 3] = mix(FLOW_DIM.r, FLOW.r, t);
    colors[i * 3 + 1] = mix(FLOW_DIM.g, FLOW.g, t);
    colors[i * 3 + 2] = mix(FLOW_DIM.b, FLOW.b, t);
  }

  applyColorVariance(colors);
  return { positions, colors, count };
}

export async function sampleGlb(
  src: string,
  maxPoints = 120_000,
  fit: GlbSampleFit = HERO_GLB_FIT,
): Promise<PortraitSample | null> {
  const loader = new GLTFLoader();
  let gltf: Awaited<ReturnType<GLTFLoader["loadAsync"]>>;

  try {
    gltf = await loader.loadAsync(src);
  } catch {
    return null;
  }

  gltf.scene.updateMatrixWorld(true);

  const meshes: THREE.Mesh[] = [];
  gltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry.getAttribute("position")) {
      meshes.push(child);
    }
  });

  if (meshes.length === 0) {
    return null;
  }

  const entries = buildMeshSamplers(meshes);
  if (entries.length === 0) {
    return null;
  }

  const counts = allocateSampleCounts(entries, maxPoints);
  const raw = sampleMeshes(entries, counts);

  if (raw.length === 0) {
    return null;
  }

  const box = new THREE.Box3();
  for (const point of raw) {
    box.expandByPoint(point);
  }
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const scale = fit.maxDimScale / Math.max(size.x, size.y, size.z, 0.001);

  const count = raw.length;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const point = raw[i].clone().sub(center).multiplyScalar(scale);
    positions[i * 3] = point.x + fit.offsetX;
    positions[i * 3 + 1] = point.y + fit.offsetY;
    positions[i * 3 + 2] = point.z;

    const t = THREE.MathUtils.clamp((point.y + 1.2) / 2.4, 0, 1);
    colors[i * 3] = mix(FLOW_DIM.r, FLOW.r, t);
    colors[i * 3 + 1] = mix(FLOW_DIM.g, FLOW.g, t);
    colors[i * 3 + 2] = mix(FLOW_DIM.b, FLOW.b, t);
  }

  applyColorVariance(colors);
  return { positions, colors, count };
}

export { fallbackSphere as fallbackCloud };
