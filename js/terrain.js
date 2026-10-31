import { WORLD, RES, WATER_START, clamp, hash2, mulberry32 } from './core.js';

export class Terrain {
  constructor(seed) {
    this.seed = seed;
    this.w = WORLD.w;
    this.h = WORLD.h;
    this.res = RES;
    this.mw = Math.ceil(this.w / this.res);
    this.mh = Math.ceil(this.h / this.res);
    this.mask = new Uint8Array(this.mw * this.mh);
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.w;
    this.canvas.height = this.h;
    this.ctx = this.canvas.getContext('2d');
    this.version = 0;
    this.rng = mulberry32(seed);
    this.generate();
    this.paint();
  }

  generate() {
    const { mw, mh, res, mask } = this;
    const rng = this.rng;

    for (let ix = 0; ix < mw; ix++) {
      const x = ix * res;
      let y = 812
        + Math.sin(x * 0.0048 + 1.1) * 23
        + Math.sin(x * 0.0125 + 0.2) * 8
        + Math.sin(x * 0.027 + 2.3) * 3.2
        + (rng() - 0.5) * 2.4;
      y -= 112 * Math.exp(-Math.pow((x - 900) / 162, 2));
      y -= 18 * Math.exp(-Math.pow((x - 555) / 108, 2));
      y -= 15 * Math.exp(-Math.pow((x - 1245) / 118, 2));
      y += 46 * Math.exp(-Math.pow((x - 742) / 66, 2));
      y += 40 * Math.exp(-Math.pow((x - 1068) / 74, 2));
      y -= 10 * Math.exp(-Math.pow((x - 180) / 80, 2));

      const start = clamp(Math.ceil(y / res), 0, mh);
      for (let iy = start; iy < mh; iy++) mask[iy * mw + ix] = 1;
    }

    // Rugged rock shoulders.
    this.addEllipse(230, 820, 86, 36);
    this.addEllipse(1540, 830, 110, 42);
    this.addEllipse(790, 855, 52, 30);
    this.addEllipse(1090, 870, 62, 28);

    // Floating build islands.
    this.addEllipse(900, 492, 170, 46);
    this.addEllipse(310, 626, 96, 30);
    this.addEllipse(1495, 604, 86, 28);

    // Destroyed edges on the floating island.
    this.carveMaskOnly(838, 510, 28);
    this.carveMaskOnly(963, 500, 20);
  }

  addEllipse(cx, cy, rx, ry) {
    const { mask, mw, mh, res } = this;
    for (let iy = 0; iy < mh; iy++) {
      const y = iy * res;
      const dy = (y - cy) / ry;
      if (Math.abs(dy) > 1) continue;
      const span = rx * Math.sqrt(1 - dy * dy);
      for (let ix = 0; ix < mw; ix++) {
        const x = ix * res;
        if (Math.abs(x - cx) <= span) mask[iy * mw + ix] = 1;
      }
    }
  }

  carveMaskOnly(cx, cy, r) {
    const { mask, mw, mh, res } = this;
    const r2 = r * r;
    const x0 = Math.max(0, Math.floor((cx - r) / res));
    const x1 = Math.min(mw - 1, Math.ceil((cx + r) / res));
    const y0 = Math.max(0, Math.floor((cy - r) / res));
    const y1 = Math.min(mh - 1, Math.ceil((cy + r) / res));
    for (let iy = y0; iy <= y1; iy++) {
      for (let ix = x0; ix <= x1; ix++) {
        const dx = ix * res + res / 2 - cx;
        const dy = iy * res + res / 2 - cy;
        if (dx * dx + dy * dy <= r2) mask[iy * mw + ix] = 0;
      }
    }
  }

  paint() {
    const { mw, mh, res, mask } = this;
    const small = document.createElement('canvas');
    small.width = mw; small.height = mh;
    const sctx = small.getContext('2d');
    const img = sctx.createImageData(mw, mh);
    const data = img.data;

    for (let iy = 0; iy < mh; iy++) {
      const y = iy * res;
      for (let ix = 0; ix < mw; ix++) {
        if (!mask[iy * mw + ix]) continue;
        const n = hash2(ix, iy, this.seed & 255);
        let r, g, b;

        let above = 0;
        while (above < 6 && iy - above - 1 >= 0 && mask[(iy - above - 1) * mw + ix]) above++;
        const openAbove = iy - above - 1 < 0 || !mask[(iy - above - 1) * mw + ix];

        if (openAbove && above <= 4) {
          const grass = ['#a8ee63', '#82d94f', '#5dbb40', '#3f9236', '#2d7232'][above];
          const c = parseInt(grass.slice(1), 16);
          const jitter = (n - 0.5) * 16;
          r = (c >> 16) + jitter; g = ((c >> 8) & 255) + jitter; b = (c & 255) + jitter;
        } else {
          const depth = clamp((y - 560) / 520, 0, 1);
          const baseR = 108 - depth * 34;
          const baseG = 69 - depth * 26;
          const baseB = 45 - depth * 17;
          const grain = (hash2(ix >> 1, iy, 77) - 0.5) * 21 + (n - 0.5) * 9;
          r = baseR + grain; g = baseG + grain * 0.72; b = baseB + grain * 0.52;
          if (n > 0.965 && above > 7) { r += 28; g += 20; b += 12; }
          if (hash2(ix >> 3, iy >> 2, 12) > 0.94 && above > 5) { r -= 18; g -= 14; b -= 9; }
          if (iy + 1 < mh && !mask[(iy + 1) * mw + ix]) { r -= 22; g -= 18; b -= 12; }
        }

        const p = (iy * mw + ix) * 4;
        data[p] = clamp(r, 0, 255);
        data[p + 1] = clamp(g, 0, 255);
        data[p + 2] = clamp(b, 0, 255);
        data[p + 3] = 255;
      }
    }
    sctx.putImageData(img, 0, 0);

    const c = this.ctx;
    c.clearRect(0, 0, this.w, this.h);
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = 'high';
    c.drawImage(small, 0, 0, this.w, this.h);

    // Grass blades and tiny flowers on every exposed top edge.
    const rng = mulberry32(this.seed + 91);
    for (let ix = 2; ix < mw - 2; ix += 2) {
      for (let iy = 2; iy < mh - 1; iy++) {
        if (!mask[iy * mw + ix] || mask[(iy - 1) * mw + ix]) continue;
        const x = ix * res + (rng() - 0.5) * 2;
        const y = iy * res;
        if (y > WATER_START + 10) continue;
        const blades = 1 + Math.floor(rng() * 3);
        c.lineCap = 'round';
        for (let b = 0; b < blades; b++) {
          const h = 3 + rng() * 7;
          const lean = (rng() - 0.5) * 7;
          c.strokeStyle = rng() > 0.35 ? `rgba(${90 + rng() * 55 | 0},${150 + rng() * 70 | 0},${55 + rng() * 30 | 0},.95)` : 'rgba(58,112,48,.9)';
          c.lineWidth = 1 + rng() * 0.8;
          c.beginPath();
          c.moveTo(x + (rng() - 0.5) * 3, y + 1);
          c.quadraticCurveTo(x + lean * 0.4, y - h * 0.6, x + lean, y - h);
          c.stroke();
        }
        if (rng() > 0.965) {
          const colors = ['#ffd166', '#ff8fab', '#fff3b0', '#9be7ff'];
          c.fillStyle = colors[Math.floor(rng() * colors.length)];
          c.beginPath(); c.arc(x + 4, y - 5, 1.6, 0, Math.PI * 2); c.fill();
        }
        break;
      }
    }
    this.version++;
  }

  solidAt(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false;
    const ix = (x / this.res) | 0;
    const iy = (y / this.res) | 0;
    return this.mask[iy * this.mw + ix] === 1;
  }

  surfaceBelow(x, maxY) {
    const ix = clamp((x / this.res) | 0, 0, this.mw - 1);
    let iy = clamp((maxY / this.res) | 0, 0, this.mh - 1);
    for (; iy >= 0; iy--) {
      if (this.mask[iy * this.mw + ix]) {
        let top = iy;
        while (top > 0 && this.mask[(top - 1) * this.mw + ix]) top--;
        return top * this.res;
      }
    }
    return null;
  }

  surfaceBetween(x, fromY, toY) {
    if (toY <= fromY) return null;
    const ix = clamp((x / this.res) | 0, 0, this.mw - 1);
    const start = clamp(Math.floor(fromY / this.res), 0, this.mh - 1);
    const end = clamp(Math.ceil(toY / this.res), 0, this.mh - 1);
    for (let iy = start; iy <= end; iy++) {
      if (this.mask[iy * this.mw + ix]) {
        let top = iy;
        while (top > 0 && this.mask[(top - 1) * this.mw + ix]) top--;
        return top * this.res;
      }
    }
    return null;
  }

  carve(cx, cy, r) {
    if (r <= 0) return;
    this.carveMaskOnly(cx, cy, r);
    const c = this.ctx;
    c.save();
    c.globalCompositeOperation = 'source-atop';
    const ring = c.createRadialGradient(cx, cy, Math.max(1, r - 2), cx, cy, r + 12);
    ring.addColorStop(0, 'rgba(28,14,8,0)');
    ring.addColorStop(0.56, 'rgba(38,18,10,.7)');
    ring.addColorStop(0.82, 'rgba(18,9,6,.9)');
    ring.addColorStop(1, 'rgba(18,9,6,0)');
    c.fillStyle = ring;
    c.beginPath(); c.arc(cx, cy, r + 13, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = 'destination-out';
    const hole = c.createRadialGradient(cx, cy, Math.max(0, r * 0.82), cx, cy, r);
    hole.addColorStop(0, 'rgba(0,0,0,1)');
    hole.addColorStop(0.85, 'rgba(0,0,0,1)');
    hole.addColorStop(1, 'rgba(0,0,0,.35)');
    c.fillStyle = hole;
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
    c.restore();
    this.version++;
  }

  draw(ctx) {
    ctx.drawImage(this.canvas, 0, 0);
  }
}
