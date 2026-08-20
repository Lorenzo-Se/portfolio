import fs from "fs";
import zlib from "zlib";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const W = 640;
const H = 800;

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function insideHead(nx, ny) {
  const dx = nx / 0.36;
  const dy = (ny + 0.28) / 0.44;
  const head = dx * dx + dy * dy <= 1;
  const neck = Math.abs(nx) < 0.11 && ny > 0.12 && ny < 0.42;
  const shoulders =
    ny > 0.36 &&
    ny < 0.92 &&
    Math.abs(nx) < 0.22 + (ny - 0.36) * 0.85;
  return head || neck || shoulders;
}

const pixels = Buffer.alloc(W * H * 4);

for (let y = 0; y < H; y += 1) {
  for (let x = 0; x < W; x += 1) {
    const nx = (x / (W - 1)) * 2 - 1;
    const ny = (y / (H - 1)) * 2 - 1;
    const i = (y * W + x) * 4;
    if (!insideHead(nx, ny)) {
      continue;
    }
    const light = Math.max(0, 1 - Math.hypot(nx + 0.22, ny + 0.42) * 0.85);
    const shade = 0.18 + light * 0.82;
    pixels[i] = Math.round(255 * (0.55 * shade + 0.45));
    pixels[i + 1] = Math.round(207 * shade + 30);
    pixels[i + 2] = Math.round(74 * shade + 90 * (1 - shade));
    pixels[i + 3] = Math.round(230 * Math.min(1, shade + 0.25));
  }
}

const raw = Buffer.alloc((W * 4 + 1) * H);
for (let y = 0; y < H; y += 1) {
  raw[y * (W * 4 + 1)] = 0;
  pixels.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;
ihdr[9] = 6;

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(raw)),
  chunk("IEND", Buffer.alloc(0)),
]);

const out = path.join(__dirname, "..", "public", "portrait.png");
fs.writeFileSync(out, png);
console.log("wrote", out, png.length);
