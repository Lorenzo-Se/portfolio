import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";
import * as THREE from "three";
import type { PortraitSample } from "@/app/lib/samplePortrait";
import {
  applyHeroCloudTransform,
  buildPointSizes,
  configureHeroCloudCamera,
  createHeroGpuCloudMaterial,
  createSoftSpriteMap,
} from "@/app/lib/heroCloudMaterial";

export const HERO_MOUSE_SCREEN_RADIUS = 0.13;
export const HERO_MOUSE_PUSH_STRENGTH = 0.14;

export const heroPositionComputeShader = /* glsl */ `
  uniform sampler2D textureRest;
  uniform float uTime;
  uniform vec2 uMouseNDC;
  uniform vec3 uMouseLocal;
  uniform float uMouseStrength;
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  vec3 flowField(vec3 p, float t) {
    vec3 q = p * 4.2 + vec3(t * 0.35, t * 0.28, t * 0.31);
    vec3 a = vec3(
      sin(q.y + q.z * 1.3),
      sin(q.z + q.x * 1.1),
      sin(q.x + q.y * 1.2)
    );
    vec3 b = vec3(
      sin(q.y * 1.7 - t * 0.42),
      sin(q.z * 1.5 - t * 0.38),
      sin(q.x * 1.6 - t * 0.44)
    );
    return cross(a, b);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 rest = texture2D(textureRest, uv).xyz;

    vec3 curl = flowField(rest, uTime);
    vec3 pos = rest + curl * 0.0045;

    vec4 mv = uModelViewMatrix * vec4(rest, 1.0);
    vec4 clip = uProjectionMatrix * mv;
    vec2 particleNDC = clip.xy / clip.w;
    float screenDist = length(particleNDC - uMouseNDC);
    float screenRadius = ${HERO_MOUSE_SCREEN_RADIUS.toFixed(2)};

    if (screenDist < screenRadius && uMouseStrength > 0.001) {
      float falloff = pow(1.0 - screenDist / screenRadius, 1.8);
      vec3 diff = rest - uMouseLocal;
      pos += normalize(diff + vec3(0.0001)) * falloff * uMouseStrength * ${HERO_MOUSE_PUSH_STRENGTH.toFixed(2)};
    }

    gl_FragColor = vec4(pos, 1.0);
  }
`;

export function computeTextureSize(count: number): { width: number; height: number } {
  const width = Math.ceil(Math.sqrt(count));
  const height = Math.ceil(count / width);
  return { width, height };
}

function fillRestTexture(
  texture: THREE.DataTexture,
  positions: Float32Array,
  count: number,
) {
  const data = texture.image.data as Float32Array;
  const capacity = data.length / 4;

  for (let i = 0; i < capacity; i += 1) {
    const offset = i * 4;
    if (i < count) {
      data[offset] = positions[i * 3];
      data[offset + 1] = positions[i * 3 + 1];
      data[offset + 2] = positions[i * 3 + 2];
      data[offset + 3] = 1;
    } else {
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
      data[offset + 3] = 0;
    }
  }

  texture.needsUpdate = true;
}

export function buildReferenceAttribute(
  count: number,
  width: number,
  height: number,
): Float32Array {
  const refs = new Float32Array(count * 2);

  for (let i = 0; i < count; i += 1) {
    const x = (i % width) + 0.5;
    const y = Math.floor(i / width) + 0.5;
    refs[i * 2] = x / width;
    refs[i * 2 + 1] = y / height;
  }

  return refs;
}

export type HeroGpuCloud = {
  gpuCompute: GPUComputationRenderer;
  posVar: ReturnType<GPUComputationRenderer["addVariable"]>;
  restTexture: THREE.DataTexture;
  textureWidth: number;
  textureHeight: number;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  points: THREE.Points;
  material: THREE.ShaderMaterial;
  spriteMap: THREE.CanvasTexture;
  mouseLocal: THREE.Vector3;
  mouseNDC: THREE.Vector2;
  modelViewMatrix: THREE.Matrix4;
  mouseStrength: number;
  time: number;
  usesGpu: true;
};

export function createHeroGpuCloud(
  root: HTMLElement,
  sample: PortraitSample,
): HeroGpuCloud | null {
  const { width: textureWidth, height: textureHeight } = computeTextureSize(sample.count);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  configureHeroCloudCamera(camera);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = "hero-bubble__canvas";
  root.appendChild(renderer.domElement);

  if (renderer.capabilities.maxVertexTextures === 0) {
    renderer.dispose();
    renderer.domElement.remove();
    return null;
  }

  const gpuCompute = new GPUComputationRenderer(textureWidth, textureHeight, renderer);

  const restTexture = gpuCompute.createTexture();
  fillRestTexture(restTexture, sample.positions, sample.count);

  const posVar = gpuCompute.addVariable(
    "texturePosition",
    heroPositionComputeShader,
    restTexture,
  );
  gpuCompute.setVariableDependencies(posVar, []);

  posVar.material.uniforms.textureRest = { value: restTexture };
  posVar.material.uniforms.uTime = { value: 0 };
  posVar.material.uniforms.uMouseNDC = { value: new THREE.Vector2(0, 10) };
  posVar.material.uniforms.uMouseLocal = { value: new THREE.Vector3(0, 0, 10) };
  posVar.material.uniforms.uMouseStrength = { value: 0 };
  posVar.material.uniforms.uModelViewMatrix = { value: new THREE.Matrix4() };
  posVar.material.uniforms.uProjectionMatrix = { value: camera.projectionMatrix.clone() };

  const error = gpuCompute.init();
  if (error !== null) {
    gpuCompute.dispose();
    restTexture.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    return null;
  }

  const references = buildReferenceAttribute(sample.count, textureWidth, textureHeight);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(sample.count * 3), 3),
  );
  geometry.setAttribute("reference", new THREE.BufferAttribute(references, 2));
  geometry.setAttribute("color", new THREE.BufferAttribute(sample.colors, 3));
  geometry.setAttribute(
    "aSize",
    new THREE.BufferAttribute(buildPointSizes(sample.count), 1),
  );
  geometry.computeBoundingSphere();

  const spriteMap = createSoftSpriteMap();
  const material = createHeroGpuCloudMaterial(spriteMap);
  material.uniforms.texturePosition.value =
    gpuCompute.getCurrentRenderTarget(posVar).texture;

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  applyHeroCloudTransform(points);
  scene.add(points);

  return {
    gpuCompute,
    posVar,
    restTexture,
    textureWidth,
    textureHeight,
    scene,
    camera,
    renderer,
    points,
    material,
    spriteMap,
    mouseLocal: new THREE.Vector3(0, 0, 10),
    mouseNDC: new THREE.Vector2(0, 10),
    modelViewMatrix: new THREE.Matrix4(),
    mouseStrength: 0,
    time: 0,
    usesGpu: true,
  };
}

export function clientToNdc(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  target: THREE.Vector2,
): boolean {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }

  target.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  target.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  return true;
}

export function projectPointerToLocalMouse(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  camera: THREE.PerspectiveCamera,
  points: THREE.Points,
  targetLocal: THREE.Vector3,
  targetNDC: THREE.Vector2,
): boolean {
  if (!clientToNdc(clientX, clientY, canvas, targetNDC)) {
    return false;
  }

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(targetNDC, camera);

  points.updateMatrixWorld(true);
  const planeNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(
    points.getWorldQuaternion(new THREE.Quaternion()),
  );
  const planePoint = new THREE.Vector3().setFromMatrixPosition(points.matrixWorld);
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, planePoint);

  const world = new THREE.Vector3();
  const hit = raycaster.ray.intersectPlane(plane, world);
  if (!hit) {
    return false;
  }

  points.worldToLocal(world);
  targetLocal.copy(world);
  return true;
}

export function stepHeroGpuCloud(
  state: HeroGpuCloud,
  delta: number,
  pointerActive: boolean,
) {
  state.mouseStrength = pointerActive ? 1 : THREE.MathUtils.damp(state.mouseStrength, 0, 10, delta);
  state.time += delta;

  state.camera.updateMatrixWorld(true);
  state.points.updateMatrixWorld(true);
  state.modelViewMatrix.multiplyMatrices(
    state.camera.matrixWorldInverse,
    state.points.matrixWorld,
  );

  const simUniforms = state.posVar.material.uniforms;
  simUniforms.uTime.value = state.time;
  simUniforms.uMouseNDC.value.copy(state.mouseNDC);
  simUniforms.uMouseLocal.value.copy(state.mouseLocal);
  simUniforms.uMouseStrength.value = state.mouseStrength;
  simUniforms.uModelViewMatrix.value.copy(state.modelViewMatrix);
  simUniforms.uProjectionMatrix.value.copy(state.camera.projectionMatrix);

  state.gpuCompute.compute();
  state.material.uniforms.texturePosition.value =
    state.gpuCompute.getCurrentRenderTarget(state.posVar).texture;

  state.points.rotation.y += delta * 0.045;
  state.points.rotation.x = THREE.MathUtils.damp(
    state.points.rotation.x,
    0.1,
    3,
    delta,
  );

  state.renderer.render(state.scene, state.camera);
}

export function disposeHeroGpuCloud(state: HeroGpuCloud) {
  state.renderer.domElement.remove();
  state.gpuCompute.dispose();
  state.restTexture.dispose();
  state.points.geometry.dispose();
  state.material.dispose();
  state.spriteMap.dispose();
  state.renderer.dispose();
}
