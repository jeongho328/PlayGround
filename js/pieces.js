import { GRID, clamp, hash2, easeOut, lerp } from './core.js';

export const MATERIALS = {
  wood: {
    key: 'wood', label: 'WOOD', hp: 82, cost: 8,
    base: '#a9682f', light: '#c98a4b', dark: '#6f3f1b', line: '#5b3013',
    accent: '#e6a35d', dust: '#b97b3f'
  },
  brick: {
    key: 'brick', label: 'BRICK', hp: 155, cost: 13,
    base: '#b34b3c', light: '#d16b59', dark: '#7c2c24', line: '#5c1f1a',
    accent: '#ee8d7c', dust: '#c06050'
  },
  metal: {
    key: 'metal', label: 'METAL', hp: 255, cost: 20,
    base: '#577089', light: '#7d97b0', dark: '#34475b', line: '#22313f',
    accent: '#a9c3d9', dust: '#91a6ba'
  }
};

const PIECE_COST = { wall: 1, floor: 0.8, ramp: 1.12 };
const PIECE_HP = { wall: 1, floor: 0.62, ramp: 0.88 };

export class Piece {
  constructor({ type, gx, gy, material, team, dir = 1, t = 0 }) {
    this.type = type;
    this.gx = gx;
    this.gy = gy;
    this.material = material;
    this.team = team;
    this.dir = dir;
    this.x = gx * GRID;
    this.y = gy * GRID;
    this.maxHp = Math.round(MATERIALS[material].hp * PIECE_HP[type]);
    this.hp = this.maxHp;
    this.cost = Math.max(3, Math.round(MATERIALS[material].cost * PIECE_COST[type]));
    this.solids = this.computeSolids();
    this.builtAt = t;
    this.flash = 0;
    this.dead = false;
    this.seed = (gx * 73856093) ^ (gy * 19349663) ^ (team * 83492791);
    this.sinceHit = 99;
  }

  computeSolids() {
    const { x, y } = this;
    if (this.type === 'wall') {
      return [{ x: x + 1, y, w: GRID - 2, h: GRID }];
    }
    if (this.type === 'floor') {
      return [{ x: x + 1, y: y + GRID - 13, w: GRID - 2, h: 13 }];
    }
    const out = [];
    for (let i = 0; i < 6; i++) {
      const top = y + GRID - (i + 1) * 8;
      const sx = this.dir > 0 ? x + i * 8 : x + GRID - (i + 1) * 8;
      out.push({ x: sx, y: top, w: 8, h: (i + 1) * 8 });
    }
    return out;
  }

  center() {
    if (this.type === 'floor') return { x: this.x + GRID / 2, y: this.y + GRID - 6 };
    return { x: this.x + GRID / 2, y: this.y + GRID / 2 };
  }

  contains(x, y) {
    for (const s of this.solids) {
      if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return true;
    }
    return false;
  }

  topAt(x, maxY) {
    let best = null;
    for (const s of this.solids) {
      if (x < s.x - 1 || x > s.x + s.w + 1) continue;
      if (s.y <= maxY && (best === null || s.y > best)) best = s.y;
    }
    return best;
  }

  damage(amount, game) {
    if (this.dead) return;
    this.hp -= amount;
    this.flash = 0.18;
    this.sinceHit = 0;
    if (this.hp <= 0) {
      this.dead = true;
      game.onPieceDestroyed(this);
    }
  }

  draw(ctx, time) {
    if (this.dead) return;
    const mat = MATERIALS[this.material];
    const age = time - this.builtAt;
    let scale = 1, alpha = 1;
    if (age < 0.24) {
      const p = clamp(age / 0.24, 0, 1);
      scale = lerp(0.55, 1.04, easeOut(p));
      alpha = clamp(p * 1.8, 0, 1);
    } else if (age < 0.34) {
      scale = lerp(1.04, 1, (age - 0.24) / 0.1);
    }
    const cx = this.x + GRID / 2, cy = this.y + GRID / 2;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);
    if (this.flash > 0) ctx.globalAlpha *= 1 + 0;
    this.drawShape(ctx, mat);
    ctx.restore();
  }

  drawShape(ctx, mat) {
    const { x, y } = this;
    const flash = this.flash > 0 ? this.flash / 0.18 : 0;
    const hpFrac = this.hp / this.maxHp;

    if (this.type === 'wall') {
      ctx.fillStyle = flash > 0.4 ? '#ffffff' : mat.dark;
      ctx.fillRect(x + 1, y, GRID - 2, GRID);
      ctx.fillStyle = flash > 0.4 ? '#ffffff' : mat.base;
      ctx.fillRect(x + 5, y + 4, GRID - 10, GRID - 8);
      ctx.strokeStyle = mat.line;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 5, y + 4, GRID - 10, GRID - 8);
      // frame planks
      ctx.strokeStyle = mat.line;
      ctx.globalAlpha *= 0.55;
      ctx.beginPath();
      ctx.moveTo(x + 5, y + 4); ctx.lineTo(x + GRID - 5, y + GRID - 4);
      ctx.moveTo(x + GRID - 5, y + 4); ctx.lineTo(x + 5, y + GRID - 4);
      ctx.stroke();
      ctx.globalAlpha /= 0.55;
      ctx.fillStyle = mat.light;
      ctx.fillRect(x + 4, y + 4, GRID - 8, 3);
      ctx.fillRect(x + 4, y + 4, 3, GRID - 8);
      // material texture
      if (this.material === 'brick') {
        ctx.strokeStyle = mat.line;
        ctx.lineWidth = 1;
        ctx.globalAlpha *= 0.6;
        for (let row = 0; row < 4; row++) {
          const yy = y + 9 + row * 9;
          ctx.beginPath(); ctx.moveTo(x + 6, yy); ctx.lineTo(x + GRID - 6, yy); ctx.stroke();
          for (let col = 0; col < 2; col++) {
            const xx = x + 6 + ((row % 2) * 16) + col * 32;
            ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + 9); ctx.stroke();
          }
        }
        ctx.globalAlpha /= 0.6;
      } else if (this.material === 'metal') {
        ctx.fillStyle = mat.light;
        for (const [dx, dy] of [[9, 9], [GRID - 9, 9], [9, GRID - 9], [GRID - 9, GRID - 9]]) {
          ctx.beginPath(); ctx.arc(x + dx, y + dy, 1.8, 0, Math.PI * 2); ctx.fill();
        }
        ctx.strokeStyle = mat.accent;
        ctx.globalAlpha *= 0.35;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x + 8, y + GRID - 8); ctx.lineTo(x + GRID - 8, y + 8); ctx.stroke();
        ctx.globalAlpha /= 0.35;
      } else {
        ctx.strokeStyle = mat.line;
        ctx.globalAlpha *= 0.5;
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
          ctx.beginPath(); ctx.moveTo(x + 6, y + i * 10 + 4); ctx.lineTo(x + GRID - 6, y + i * 10 + 4); ctx.stroke();
        }
        ctx.globalAlpha /= 0.5;
      }
      // team marker
      ctx.fillStyle = this.team === 0 ? '#ff9f1c' : '#b06bff';
      ctx.fillRect(x + GRID - 11, y + 4, 6, 2.5);
    } else if (this.type === 'floor') {
      ctx.fillStyle = mat.dark;
      ctx.fillRect(x + 1, y + GRID - 13, GRID - 2, 13);
      ctx.fillStyle = flash > 0.4 ? '#fff' : mat.base;
      ctx.fillRect(x + 3, y + GRID - 12, GRID - 6, 7);
      ctx.fillStyle = mat.light;
      ctx.fillRect(x + 3, y + GRID - 12, GRID - 6, 2);
      ctx.strokeStyle = mat.line;
      ctx.lineWidth = 1;
      ctx.globalAlpha *= 0.6;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(x + i * 16, y + GRID - 11); ctx.lineTo(x + i * 16, y + GRID - 5); ctx.stroke();
      }
      ctx.globalAlpha /= 0.6;
      // diagonal supports underneath
      ctx.strokeStyle = mat.dark;
      ctx.lineWidth = 3;
      ctx.globalAlpha *= 0.55;
      ctx.beginPath();
      ctx.moveTo(x + 6, y + GRID); ctx.lineTo(x + GRID / 2, y + GRID - 11);
      ctx.lineTo(x + GRID - 6, y + GRID);
      ctx.stroke();
      ctx.globalAlpha /= 0.55;
      ctx.fillStyle = this.team === 0 ? '#ff9f1c' : '#b06bff';
      ctx.fillRect(x + GRID / 2 - 3, y + GRID - 13, 6, 2);
    } else {
      // ramp
      const up = this.dir > 0;
      ctx.save();
      ctx.beginPath();
      if (up) {
        ctx.moveTo(x, y + GRID); ctx.lineTo(x + GRID, y + GRID); ctx.lineTo(x + GRID, y + 7);
      } else {
        ctx.moveTo(x, y + GRID); ctx.lineTo(x + GRID, y + GRID); ctx.lineTo(x, y + 7);
      }
      ctx.closePath();
      ctx.fillStyle = mat.dark;
      ctx.fill();
      ctx.clip();
      ctx.fillStyle = flash > 0.4 ? '#fff' : mat.base;
      ctx.fillRect(x, y, GRID, GRID);
      ctx.strokeStyle = mat.line;
      ctx.globalAlpha *= 0.7;
      ctx.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        if (up) { ctx.moveTo(x + i * 9 - 6, y + GRID); ctx.lineTo(x + i * 9 + 16, y); }
        else { ctx.moveTo(x + GRID - i * 9 + 6, y + GRID); ctx.lineTo(x + GRID - i * 9 - 16, y); }
        ctx.stroke();
      }
      ctx.globalAlpha /= 0.7;
      // steps highlight
      ctx.strokeStyle = mat.light;
      ctx.globalAlpha *= 0.55;
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const top = y + GRID - (i + 1) * 8;
        const sx = up ? x + i * 8 : x + GRID - (i + 1) * 8;
        ctx.beginPath(); ctx.moveTo(sx, top); ctx.lineTo(sx + 8, top); ctx.stroke();
      }
      ctx.globalAlpha /= 0.55;
      ctx.restore();
      ctx.strokeStyle = mat.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (up) { ctx.moveTo(x, y + GRID - 1); ctx.lineTo(x + GRID, y + 7); }
      else { ctx.moveTo(x, y + 7); ctx.lineTo(x + GRID, y + GRID - 1); }
      ctx.stroke();
      ctx.fillStyle = this.team === 0 ? '#ff9f1c' : '#b06bff';
      const markerX = up ? x + GRID - 14 : x + 9;
      ctx.fillRect(markerX, y + 4, 6, 2.5);
    }

    // damage cracks
    if (hpFrac < 0.82) {
      const count = hpFrac < 0.4 ? 4 : 2;
      ctx.strokeStyle = 'rgba(14,9,6,.75)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < count; i++) {
        const sx = x + 8 + hash2(this.seed, i, 1) * (GRID - 16);
        const sy = y + 7 + hash2(this.seed, i, 2) * (GRID - 14);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + (hash2(this.seed, i, 3) - 0.5) * 15, sy + 5);
        ctx.lineTo(sx + (hash2(this.seed, i, 4) - 0.5) * 20, sy + 12);
        ctx.stroke();
      }
    }
    if (flash > 0.4) {
      ctx.fillStyle = `rgba(255,255,255,${(flash - 0.4) * 0.8})`;
      ctx.fillRect(x - 1, y - 1, GRID + 2, GRID + 2);
    }
  }
}
