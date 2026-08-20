import * as THREE from "three";

export const HERO_POINT_SIZE = 0.006;
export const HERO_CLOUD_CAMERA_FOV = 38;
export const HERO_CLOUD_CAMERA_Z = 3.5;
export const HERO_CLOUD_LOOK_AT_Y = -0.05;
export const HERO_CLOUD_OFFSET_X = -0.1;
export const HERO_CLOUD_OFFSET_Y = -0.07;
export const HERO_CLOUD_ROTATION: [number, number, number] = [0.1, -0.28, 0.02];

export function configureHeroCloudCamera(camera: THREE.PerspectiveCamera) {
  camera.fov = HERO_CLOUD_CAMERA_FOV;
  camera.position.set(0, 0, HERO_CLOUD_CAMERA_Z);
  camera.lookAt(0, HERO_CLOUD_LOOK_AT_Y, 0);
}

export function applyHeroCloudTransform(points: THREE.Points) {
  points.position.set(HERO_CLOUD_OFFSET_X, HERO_CLOUD_OFFSET_Y, 0);
  points.rotation.set(...HERO_CLOUD_ROTATION);
}

export function createSoftSpriteMap(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new THREE.CanvasTexture(document.createElement("canvas"));
  }

  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.2, "rgba(255,255,255,0.9)");
  gradient.addColorStop(0.45, "rgba(255,255,255,0.35)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export const heroCloudVertexShader = /* glsl */ `
  attribute vec3 aRest;
  attribute float aSize;

  uniform float uTime;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = color;
    vec3 n = normalize(aRest);
    float phase = sin(uTime * 0.55 + aRest.x * 5.0 + aRest.y * 3.2);
    vec3 pos = aRest + n * phase * 0.0045;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (320.0 / max(-mvPosition.z, 0.25));
    vAlpha = 0.76;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const heroCloudFragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec4 sprite = texture2D(uMap, gl_PointCoord);
    if (sprite.a < 0.02) discard;
    gl_FragColor = vec4(vColor * sprite.rgb, sprite.a * vAlpha);
  }
`;

export function createHeroCloudMaterial(map: THREE.Texture): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMap: { value: map },
    },
    vertexShader: heroCloudVertexShader,
    fragmentShader: heroCloudFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });
}

export const heroGpuCloudVertexShader = /* glsl */ `
  attribute vec2 reference;
  attribute float aSize;

  uniform sampler2D texturePosition;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 pos = texture2D(texturePosition, reference).xyz;
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (320.0 / max(-mvPosition.z, 0.25));
    vAlpha = 0.76;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export function createHeroGpuCloudMaterial(
  map: THREE.Texture,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      texturePosition: { value: null },
      uMap: { value: map },
    },
    vertexShader: heroGpuCloudVertexShader,
    fragmentShader: heroCloudFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });
}

export function heroPixelRatio(): number {
  if (typeof window === "undefined") {
    return 1;
  }
  return Math.min(window.devicePixelRatio || 1, 2);
}

export function heroPointCount(): number {
  if (typeof window === "undefined") {
    return 100_000;
  }
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (memory !== undefined && memory <= 4) {
    return 80_000;
  }
  return 120_000;
}

export function buildPointSizes(count: number, baseSize = HERO_POINT_SIZE): Float32Array {
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const seed = Math.sin((i + 1) * 78.233) * 43758.5453;
    const variance = 0.8 + (seed - Math.floor(seed)) * 0.4;
    sizes[i] = baseSize * variance;
  }
  return sizes;
}
