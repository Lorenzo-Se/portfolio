import * as THREE from "three";

export const BUBBLE_CAMERA_DISTANCE = 8;
export const BUBBLE_CAMERA_FOV = 50;
export const FLOW_COLOR: [number, number, number] = [0.85, 0.88, 0.92];

export type HeroShellLayer = {
  id: string;
  radius: number;
  rotationSpeed: number;
  positions: Float32Array;
  count: number;
};

export type HeroSphereData = {
  layers: HeroShellLayer[];
  totalCount: number;
};

function fibonacciSphere(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / Math.max(count - 1, 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    positions[i * 3] = Math.cos(theta) * ring * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = Math.sin(theta) * ring * radius;
  }

  return positions;
}

function jitterSphere(
  base: Float32Array,
  jitter = 0.12,
  seed = 54321,
): Float32Array {
  const out = new Float32Array(base.length);
  let state = seed;

  const rand = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };

  for (let i = 0; i < base.length; i += 3) {
    const x = base[i];
    const y = base[i + 1];
    const z = base[i + 2];
    const len = Math.max(Math.hypot(x, y, z), 0.0001);
    const nx = x / len;
    const ny = y / len;
    const nz = z / len;
    const radial = 1 + (rand() - 0.5) * jitter * 0.4;
    const push = jitter * 0.3;
    out[i] = (x + nx * push) * radial;
    out[i + 1] = (y + ny * push) * radial;
    out[i + 2] = (z + nz * push) * radial;
  }

  return out;
}

export function buildHeroSphere(totalCount = 14000): HeroSphereData {
  const outerCount = Math.round(totalCount * 0.72);
  const innerCount = totalCount - outerCount;

  const outer = jitterSphere(fibonacciSphere(outerCount, 1), 0.14, 54321);
  const inner = jitterSphere(fibonacciSphere(innerCount, 0.54), 0.1, 98765);

  return {
    layers: [
      {
        id: "outer",
        radius: 1,
        rotationSpeed: 0.71,
        positions: outer,
        count: outerCount,
      },
      {
        id: "inner",
        radius: 0.54,
        rotationSpeed: -0.28,
        positions: inner,
        count: innerCount,
      },
    ],
    totalCount,
  };
}

export function alignCameraToTarget(
  camera: THREE.PerspectiveCamera,
  targetX: number,
  targetY: number,
  width: number,
  height: number,
  distance = BUBBLE_CAMERA_DISTANCE,
) {
  camera.fov = BUBBLE_CAMERA_FOV;
  camera.aspect = width / height;
  camera.position.set(0, 0, distance);
  camera.rotation.set(0, 0, 0);
  camera.clearViewOffset();
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);

  const offsetX = Math.round(width * 0.5 - targetX);
  const offsetY = Math.round(height * 0.5 - targetY);

  if (offsetX !== 0 || offsetY !== 0) {
    camera.setViewOffset(width, height, offsetX, offsetY, width, height);
    camera.updateProjectionMatrix();
  }
}

export const heroSphereVertexShader = /* glsl */ `
  attribute vec3 aRest;
  attribute float aSize;

  uniform float uTime;
  uniform float uWobble;
  uniform mat3 uShellRotation;

  varying vec3 vColor;
  varying float vAlpha;

  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float vnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);

    float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

    float nx00 = mix(n000, n100, u.x);
    float nx10 = mix(n010, n110, u.x);
    float nx01 = mix(n001, n101, u.x);
    float nx11 = mix(n011, n111, u.x);
    float nxy0 = mix(nx00, nx10, u.y);
    float nxy1 = mix(nx01, nx11, u.y);
    return mix(nxy0, nxy1, u.z) * 2.0 - 1.0;
  }

  float wobbleNebula(vec3 pos, float time) {
    vec3 n = normalize(pos);
    float flow1 = vnoise(n * 2.5 + vec3(0.0, time * 0.2, time * 0.15));
    float flow2 = vnoise(n * 5.0 + vec3(time * 0.1, 0.0, time * 0.25));
    float filament = pow(abs(flow1 + flow2 * 0.5), 0.55);
    float band = vnoise(n * 1.2 + vec3(0.0, time * 0.08, 0.0));
    return band * 0.35 + filament * 0.75;
  }

  void main() {
    vec3 rest = aRest;
    vec3 shellPos = uShellRotation * rest;
    vec3 normal = normalize(shellPos);
    float noise = wobbleNebula(shellPos, uTime);
    vec3 displaced = shellPos + normal * noise * uWobble * 0.18;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    gl_PointSize = aSize * (220.0 / max(-mvPosition.z, 0.35));
    vAlpha = smoothstep(4.5, 1.0, -mvPosition.z);

    float depth = normal.z * 0.5 + 0.5;
    vec3 base = vec3(0.85, 0.88, 0.92);
    vColor = mix(base * 0.72, base * 1.08, depth);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const heroSphereFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float dist = length(uv);
    if (dist > 0.5) discard;

    float core = 1.0 - smoothstep(0.0, 0.22, dist);
    float halo = 1.0 - smoothstep(0.18, 0.5, dist);
    float alpha = (core * 0.92 + halo * 0.28) * vAlpha;
    vec3 color = vColor + core * 0.08;
    gl_FragColor = vec4(color, alpha);
  }
`;
