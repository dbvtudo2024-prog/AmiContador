import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  // PNG generation using raw deflate
  const rowBytes = width * 4;
  const rawData = Buffer.alloc((rowBytes + 1) * height);
  for (let y = 0; y < height; y++) {
    rawData[y * (rowBytes + 1)] = 0; // Filter type 0 (None)
    buffer.copy(rawData, y * (rowBytes + 1) + 1, y * rowBytes, (y + 1) * rowBytes);
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression: 0
  ihdr[11] = 0; // Filter: 0
  ihdr[12] = 0; // Interlace: 0

  function createChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    const crc = crc32(Buffer.concat([Buffer.from(type), data]));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let n = 0; n < buf.length; n++) {
      c ^= buf[n];
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Yarn ball drawing function
function drawYarnIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background
  const bgR = 250, bgG = 245, bgB = 237; // #FAF5ED
  if (isMaskable) {
    // Fill full bleed background for maskable icon
    const radius = w * 0.38;
    if (dist <= radius) {
      // Yarn ball body (#C85A32 / #8C5E47 terracotta gradient)
      const t = (x + y) / (w + h);
      const r = Math.round(200 * (1 - t) + 140 * t);
      const g = Math.round(90 * (1 - t) + 94 * t);
      const b = Math.round(50 * (1 - t) + 71 * t);

      // Yarn texture rings
      const ring = Math.sin(dist * 0.18 + Math.atan2(dy, dx) * 3);
      if (Math.abs(ring) > 0.8) {
        return [Math.min(255, r + 30), Math.min(255, g + 20), Math.min(255, b + 20), 255];
      }
      return [r, g, b, 255];
    }
    return [bgR, bgG, bgB, 255];
  } else {
    // Normal icon with soft rounded container
    const outerR = w * 0.46;
    if (dist > outerR) return [0, 0, 0, 0]; // Transparent outer

    const radius = w * 0.35;
    if (dist <= radius) {
      // Yarn ball
      const t = (x + y) / (w + h);
      const r = Math.round(200 * (1 - t) + 140 * t);
      const g = Math.round(90 * (1 - t) + 94 * t);
      const b = Math.round(50 * (1 - t) + 71 * t);
      const ring = Math.sin(dist * 0.18 + Math.atan2(dy, dx) * 3);
      if (Math.abs(ring) > 0.8) {
        return [Math.min(255, r + 30), Math.min(255, g + 20), Math.min(255, b + 20), 255];
      }
      return [r, g, b, 255];
    }
    // Warm background circle
    return [bgR, bgG, bgB, 255];
  }
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, (x, y, w, h) => drawYarnIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, (x, y, w, h) => drawYarnIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, (x, y, w, h) => drawYarnIcon(x, y, w, h, true)));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, (x, y, w, h) => drawYarnIcon(x, y, w, h, false)));

console.log('PWA PNG icons generated successfully!');
