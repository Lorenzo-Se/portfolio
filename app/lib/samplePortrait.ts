export type PortraitSample = {
  positions: Float32Array;
  colors: Float32Array;
  count: number;
};

const GOLD = { r: 255 / 255, g: 207 / 255, b: 74 / 255 };
const BLUE = { r: 182 / 255, g: 203 / 255, b: 255 / 255 };

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export async function samplePortrait(
  src: string,
  maxPoints = 14000,
): Promise<PortraitSample | null> {
  const image = await loadImage(src);
  if (!image) {
    return null;
  }

  const targetW = Math.min(640, Math.max(320, Math.round(Math.sqrt(maxPoints) * 2.2)));
  const scale = targetW / image.width;
  const w = targetW;
  const h = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return null;
  }

  ctx.drawImage(image, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  const aspect = h / w;
  const candidates: { x: number; y: number; z: number; r: number; g: number; b: number; lum: number }[] = [];

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      const alpha = data[i + 3];
      if (alpha < 28) {
        continue;
      }
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      const lum = r * 0.22 + g * 0.7 + b * 0.08;
      if (lum < 0.04) {
        continue;
      }
      candidates.push({
        x: (x / w - 0.5) * 2.2,
        y: -(y / h - 0.5) * 2.2 * aspect,
        z: (0.5 - lum) * 0.72,
        r,
        g,
        b,
        lum,
      });
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  const stride = Math.max(1, Math.ceil(candidates.length / maxPoints));
  const picked = candidates.filter((_, index) => index % stride === 0);
  const count = picked.length;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const point = picked[i];
    positions[i * 3] = point.x;
    positions[i * 3 + 1] = point.y;
    positions[i * 3 + 2] = point.z;
    const t = 0.22 + point.lum * 0.78;
    colors[i * 3] = mix(BLUE.r, GOLD.r, t);
    colors[i * 3 + 1] = mix(BLUE.g, GOLD.g, t);
    colors[i * 3 + 2] = mix(BLUE.b, GOLD.b, t);
  }

  return { positions, colors, count };
}

export function fallbackCloud(count = 2200): PortraitSample {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const seed = Math.sin(i * 12.9898) * 43758.5453;
    const u = seed - Math.floor(seed);
    const v = Math.sin(i * 78.233) * 43758.5453;
    const w = v - Math.floor(v);
    const theta = u * Math.PI * 2;
    const phi = Math.acos(2 * w - 1);
    const radius = 0.55 + (Math.sin(i * 3.1) * 0.5 + 0.5) * 0.7;
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
    positions[i * 3 + 1] = Math.cos(phi) * radius * 1.15;
    positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius * 0.6;
    const t = u;
    colors[i * 3] = mix(BLUE.r, GOLD.r, t);
    colors[i * 3 + 1] = mix(BLUE.g, GOLD.g, t);
    colors[i * 3 + 2] = mix(BLUE.b, GOLD.b, t);
  }
  return { positions, colors, count };
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}
