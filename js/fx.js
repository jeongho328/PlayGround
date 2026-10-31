import { rand, randInt } from './core.js';

export class FX {
  constructor() {
    this.items = [];
    this.shake = 0;
    this.flash = 0;
    this.flashColor = '255,180,80';
  }

  explode(x, y, radius, colors = {}) {
    const { fire = '#ffb347', smoke = '#4a4a55', dirt = '#8a5a33' } = colors;
    for (let i = 0; i < 26; i++) {
      const a = rand(Math.PI * 2), sp = rand(320, 40);
      this.items.push({
        type: 'fire', x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rand(50),
        life: rand(0.75, 0.25), max: 0.75, size: rand(18, 5),
        color: i % 3 === 0 ? '#fff3b0' : fire, drag: 2.6, rise: 26
      });
    }
    for (let i = 0; i < 18; i++) {
      const a = rand(Math.PI * 2), sp = rand(180, 20);
      this.items.push({
        type: 'smoke', x: x + rand(20, -20), y: y + rand(20, -20),
        vx: Math.cos(a) * sp * 0.5, vy: Math.sin(a) * sp * 0.35 - rand(50, 15),
        life: rand(1.8, 0.8), max: 1.8, size: rand(24, 8),
        color: smoke, drag: 1.1, rise: 22
      });
    }
    for (let i = 0; i < 20; i++) {
      const a = rand(Math.PI * 2), sp = rand(340, 80);
      this.items.push({
        type: 'dirt', x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rand(190, 30),
        life: rand(1.3, 0.5), max: 1.3, size: rand(6, 2), color: dirt,
        rot: rand(Math.PI * 2), vr: rand(10, -10), grav: 900, drag: 0.15
      });
    }
    for (let i = 0; i < 14; i++) {
      const a = rand(Math.PI * 2), sp = rand(460, 120);
      this.items.push({
        type: 'spark', x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rand(60),
        life: rand(0.45, 0.15), max: 0.45, size: rand(2.5, 1), color: '#ffe9a8',
        grav: 420, drag: 0.3
      });
    }
    this.items.push({ type: 'ring', x, y, vx: 0, vy: 0, life: 0.42, max: 0.42, size: 10, radius: radius * 1.15, color: '255,210,140' });
    this.items.push({ type: 'flash', x, y, vx: 0, vy: 0, life: 0.18, max: 0.18, size: radius * 1.6, color: '#fff3c4' });
    this.shake = Math.min(22, this.shake + radius * 0.28);
    this.flash = Math.min(0.5, this.flash + radius * 0.004);
    this.flashColor = '255,180,90';
  }

  muzzle(x, y, angle) {
    for (let i = 0; i < 7; i++) {
      const a = angle + rand(0.35, -0.35);
      const sp = rand(260, 60);
      this.items.push({
        type: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: rand(0.24, 0.08), max: 0.24, size: rand(2.5, 1), color: '#ffd166',
        grav: 80, drag: 2.4
      });
    }
    this.items.push({ type: 'flash', x, y, vx: 0, vy: 0, life: 0.08, max: 0.08, size: 26, color: '#ffe9a8' });
  }

  puff(x, y, color = '#b9b6a8', n = 4, up = 40) {
    for (let i = 0; i < n; i++) {
      this.items.push({
        type: 'smoke', x: x + rand(5, -5), y: y + rand(4, -4),
        vx: rand(24, -24), vy: -rand(up, 5), life: rand(0.7, 0.25), max: 0.7,
        size: rand(7, 2), color, drag: 1.4, rise: 18
      });
    }
  }

  splash(x, y, n = 26) {
    for (let i = 0; i < n; i++) {
      const a = rand(-Math.PI * 0.92, -Math.PI * 0.08);
      const sp = rand(430, 90);
      this.items.push({
        type: 'drop', x: x + rand(14, -14), y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: rand(1.1, 0.4), max: 1.1, size: rand(4.5, 1.5),
        color: i % 3 === 0 ? '#d8f7ff' : '#6fd0e8', grav: 880, drag: 0.1
      });
    }
    this.items.push({ type: 'ring', x, y, vx: 0, vy: 0, life: 0.6, max: 0.6, size: 8, radius: 60, color: '150,230,255' });
  }

  tracer(x1, y1, x2, y2, color = '#ffe0a3', width = 2) {
    this.items.push({
      type: 'tracer', x: x1, y: y1, ex: x2, ey: y2, vx: 0, vy: 0,
      life: 0.14, max: 0.14, size: width, color
    });
  }

  text(x, y, str, color = '#ffe66d', size = 18) {
    this.items.push({
      type: 'text', x, y, vx: rand(20, -20), vy: -72, life: 1.1, max: 1.1,
      size, color, str, drag: 1.2
    });
  }

  buildPop(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const a = rand(Math.PI * 2), sp = rand(140, 30);
      this.items.push({
        type: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
        life: rand(0.32, 0.1), max: 0.32, size: rand(2, 0.8),
        color, grav: 100, drag: 1.6
      });
    }
    this.items.push({ type: 'ring', x, y, vx: 0, vy: 0, life: 0.26, max: 0.26, size: 6, radius: 34, color: '120,210,255' });
  }

  debris(x, y, color, n = 14, power = 260) {
    for (let i = 0; i < n; i++) {
      const a = rand(Math.PI * 2), sp = rand(power, 50);
      this.items.push({
        type: 'dirt', x: x + rand(12, -12), y: y + rand(12, -12),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rand(180, 40),
        life: rand(1.2, 0.4), max: 1.2, size: rand(6, 2), color,
        rot: rand(Math.PI * 2), vr: rand(12, -12), grav: 1000, drag: 0.12
      });
    }
  }

  update(dt) {
    this.shake *= Math.pow(0.0015, dt);
    if (this.shake < 0.2) this.shake = 0;
    this.flash *= Math.pow(0.002, dt);
    if (this.flash < 0.01) this.flash = 0;
    const items = this.items;
    for (let i = items.length - 1; i >= 0; i--) {
      const p = items[i];
      p.life -= dt;
      if (p.life <= 0) { items.splice(i, 1); continue; }
      const drag = p.drag ? Math.pow(1 / (1 + p.drag), dt) : 1;
      p.vx *= drag;
      p.vy *= drag;
      if (p.grav) p.vy += p.grav * dt;
      if (p.rise) p.vy -= p.rise * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.vr) p.rot += p.vr * dt;
    }
    if (items.length > 700) items.splice(0, items.length - 700);
  }

  drawBehind(ctx) {
    for (const p of this.items) {
      if (p.type !== 'smoke') continue;
      const t = p.life / p.max;
      ctx.globalAlpha = t * 0.3;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1.6 - t * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  draw(ctx) {
    for (const p of this.items) {
      const t = Math.max(0, p.life / p.max);
      switch (p.type) {
        case 'spark':
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = Math.min(1, t * 1.8);
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 0.018, p.y - p.vy * 0.018);
          ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
          break;
        case 'fire':
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = t * 0.85;
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + t * 0.7), 0, Math.PI * 2); ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
          break;
        case 'smoke':
          ctx.globalAlpha = t * 0.22;
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.7 - t * 0.7), 0, Math.PI * 2); ctx.fill();
          break;
        case 'dirt':
          ctx.globalAlpha = Math.min(1, t * 1.6);
          ctx.fillStyle = p.color;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot || 0);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
          break;
        case 'drop':
          ctx.globalAlpha = Math.min(0.85, t * 1.5);
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
          break;
        case 'ring':
          ctx.globalAlpha = t * 0.75;
          ctx.strokeStyle = `rgba(${p.color},${t})`;
          ctx.lineWidth = 2 + t * 4;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * (1 - t * 0.8), 0, Math.PI * 2); ctx.stroke();
          break;
        case 'flash':
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = t * 0.5;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          g.addColorStop(0, p.color);
          g.addColorStop(0.4, 'rgba(255,200,100,.7)');
          g.addColorStop(1, 'rgba(255,140,50,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
          break;
        case 'tracer':
          ctx.globalAlpha = t;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size * (0.5 + t);
          ctx.globalCompositeOperation = 'lighter';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.ex, p.ey); ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
          break;
        case 'text':
          ctx.globalAlpha = Math.min(1, t * 2.2);
          ctx.font = `900 ${p.size}px "Arial Black", Impact, sans-serif`;
          ctx.textAlign = 'center';
          ctx.lineWidth = 4;
          ctx.strokeStyle = 'rgba(8,10,22,.8)';
          ctx.strokeText(p.str, p.x, p.y);
          ctx.fillStyle = p.color;
          ctx.fillText(p.str, p.x, p.y);
          break;
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}
