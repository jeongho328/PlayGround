import {
  WORLD, GRID, GRAVITY, WATER_START, TEAM_COLORS, clamp, lerp, TAU, hash2
} from './core.js';
import { MATERIALS } from './pieces.js';

const CLOUDS = [
  { x: 160, y: 150, s: 1.15, sp: 4 },
  { x: 620, y: 108, s: 0.8, sp: 2 },
  { x: 1040, y: 196, s: 1.35, sp: 5 },
  { x: 1450, y: 120, s: 0.65, sp: 3 },
  { x: 1780, y: 240, s: 0.9, sp: 1.5 },
  { x: 380, y: 300, s: 0.55, sp: 6 },
  { x: 1280, y: 320, s: 0.45, sp: 4.5 }
];

export class Renderer {
  constructor(game) {
    this.game = game;
    this.ctx = game.ctx;
    this.confetti = null;
  }

  render() {
    const g = this.game;
    const ctx = this.ctx;
    const v = g.view;
    ctx.save();
    ctx.clearRect(0, 0, v.w, v.h);
    this.drawSky();

    const shake = g.fx.shake;
    const sx = shake ? (Math.random() - 0.5) * shake : 0;
    const sy = shake ? (Math.random() - 0.5) * shake : 0;

    ctx.save();
    ctx.translate(v.cx + sx, v.cy + sy);
    ctx.scale(v.zoom, v.zoom);
    ctx.translate(-g.camX, -g.camY);

    this.drawBackdropObjects();
    g.terrain.draw(ctx);
    this.drawWater(ctx);
    for (const p of g.pieces) p.draw(ctx, g.time);
    this.drawCrates(ctx);
    for (const w of g.worms) this.drawWorm(ctx, w);
    for (const p of g.projectiles) this.drawProjectile(ctx, p);
    g.fx.drawBehind(ctx);
    if (g.state === 'aim' && g.activeWorm?.alive) {
      if (g.mode === 'build') this.drawBuildMode(ctx);
      else this.drawAim(ctx);
    }
    g.fx.draw(ctx);
    ctx.restore();

    this.drawBuildStatus();
    this.drawPowerText();
    this.drawScreenEffects();
    ctx.restore();
  }

  /* ---------------------------------------------------------------- sky */
  drawSky() {
    const g = this.game;
    const ctx = this.ctx;
    const v = g.view;
    const t = g.time;
    const grad = ctx.createLinearGradient(0, 0, v.w * 0.35, v.h);
    grad.addColorStop(0, '#131c45');
    grad.addColorStop(0.28, '#2d2c60');
    grad.addColorStop(0.52, '#71436e');
    grad.addColorStop(0.7, '#c9666a');
    grad.addColorStop(0.84, '#f0985f');
    grad.addColorStop(1, '#ffd073');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, v.w, v.h);

    // stars
    for (let i = 0; i < 26; i++) {
      const x = hash2(i, 1, 9) * v.w;
      const y = hash2(i, 2, 5) * v.h * 0.3;
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.7 + i));
      ctx.globalAlpha = tw * 0.4 * (1 - y / (v.h * 0.45));
      ctx.fillStyle = '#fff';
      ctx.fillRect(x, y, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;

    // sun
    const sun = g.worldToScreen(1310, 330);
    const sunR = 78 * v.zoom;
    const glow = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, sunR * 4);
    glow.addColorStop(0, 'rgba(255,230,160,.48)');
    glow.addColorStop(0.32, 'rgba(255,180,100,.16)');
    glow.addColorStop(1, 'rgba(255,140,80,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(sun.x, sun.y, sunR * 4, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,190,.9)';
    ctx.beginPath(); ctx.arc(sun.x, sun.y, sunR, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,225,.55)';
    ctx.beginPath(); ctx.arc(sun.x, sun.y, sunR * 0.7, 0, TAU); ctx.fill();

    // clouds with parallax
    for (let i = 0; i < CLOUDS.length; i++) {
      const c = CLOUDS[i];
      const drift = (t * c.sp) % (v.w + 500);
      let x = ((c.x - g.camX * 0.16 + drift) % (v.w + 500) + v.w + 500) % (v.w + 500) - 250;
      const y = c.y - (g.camY - 550) * 0.12;
      this.cloud(x, y, c.s * v.zoom, 0.11 + (i % 3) * 0.03);
    }

    // mountain silhouettes with a subtle parallax
    const horizon = g.worldToScreen(0, 852).y;
    const off = -g.camX * 0.1;
    this.ridge(horizon + 12, 74, 0.0032, off, '#2c2a54', 0.9);
    this.ridge(horizon + 36, 108, 0.0047, off * 1.5 + 90, '#222446', 1);

    // distant floating isles
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = '#24234a';
    const isleX = 240 + ((off * 0.6) % 400);
    this.distantIsle(isleX, horizon - 150, 54);
    this.distantIsle(isleX + 440, horizon - 210, 32);
    ctx.globalAlpha = 1;

    // birds
    ctx.strokeStyle = 'rgba(25,20,40,.5)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) {
      const bx = ((i * 211 + t * 7) % (v.w + 100)) - 50;
      const by = 155 + (i % 3) * 43 + Math.sin(t * 1.2 + i) * 5;
      const flap = Math.sin(t * 5 + i * 2) * 3;
      ctx.beginPath();
      ctx.moveTo(bx - 6, by + flap);
      ctx.quadraticCurveTo(bx - 2, by - 2, bx, by);
      ctx.quadraticCurveTo(bx + 2, by - 2, bx + 6, by + flap);
      ctx.stroke();
    }

    // atmospheric haze
    const haze = ctx.createLinearGradient(0, horizon - 170, 0, horizon + 30);
    haze.addColorStop(0, 'rgba(255,170,120,0)');
    haze.addColorStop(0.7, 'rgba(255,170,120,.14)');
    haze.addColorStop(1, 'rgba(255,180,120,0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, horizon - 170, v.w, 200);
  }

  cloud(x, y, scale, alpha) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale * 0.72);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffe1d3';
    for (const [dx, dy, r] of [[0, 0, 23], [20, -8, 29], [45, 1, 20], [18, 9, 25], [-20, 6, 17]]) {
      ctx.beginPath(); ctx.arc(dx, dy, r, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = 'rgba(126,100,140,.18)';
    for (const [dx, dy, r] of [[0, 8, 20], [20, 5, 24], [44, 6, 16], [17, 14, 20]]) {
      ctx.beginPath(); ctx.arc(dx, dy, r, 0, TAU); ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  ridge(baseY, height, freq, off, color, alpha) {
    const ctx = this.ctx;
    const v = this.game.view;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-40, v.h + 40);
    for (let x = -40; x <= v.w + 40; x += 24) {
      const wx = x + off;
      const y = baseY - height * (0.45 + 0.35 * Math.sin(wx * freq) + 0.2 * Math.sin(wx * freq * 2.7 + 2));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(v.w + 40, v.h + 40);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  distantIsle(x, y, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.26, 0, 0, TAU);
    ctx.moveTo(x - r, y);
    ctx.quadraticCurveTo(x, y + r * 1.5, x + r, y);
    ctx.fill();
  }

  drawBackdropObjects() {
    const g = this.game;
    const ctx = this.ctx;
    const t = g.time;
    // warm god rays
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#ffbe7a';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      const x = 1170 + i * 44;
      ctx.moveTo(x, 260);
      ctx.lineTo(x - 150 - i * 30, 1100);
      ctx.lineTo(x - 80 - i * 25, 1100);
      ctx.lineTo(x + 22, 260);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // lazy ash motes
    for (let i = 0; i < 30; i++) {
      const x = (hash2(i, 4, 8) * WORLD.w + t * (5 + (i % 4) * 3)) % WORLD.w;
      const y = 250 + ((hash2(i, 5, 7) * 780 + Math.sin(t * 0.3 + i) * 30) % 760);
      ctx.globalAlpha = 0.12 + (i % 3) * 0.05;
      ctx.fillStyle = i % 2 ? '#ffd9a1' : '#c9c0ff';
      ctx.beginPath(); ctx.arc(x, y, 1 + (i % 3) * 0.5, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* -------------------------------------------------------------- water */
  drawWater(ctx) {
    const g = this.game;
    const wl = g.waterLevel;
    const t = g.time;
    const gradient = ctx.createLinearGradient(0, wl, 0, WORLD.h);
    gradient.addColorStop(0, 'rgba(44,145,164,.74)');
    gradient.addColorStop(0.35, 'rgba(22,96,128,.82)');
    gradient.addColorStop(1, 'rgba(8,38,70,.94)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, wl, WORLD.w, WORLD.h - wl + 10);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(140,235,255,.22)';
    for (let i = 0; i < 3; i++) {
      ctx.lineWidth = 1.2 + i;
      ctx.beginPath();
      for (let x = -20; x <= WORLD.w + 20; x += 20) {
        const y = wl + 4 + i * 12 + Math.sin(x * 0.018 + t * (1.1 + i * 0.2) + i) * (2.5 + i);
        if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // foam at coastline
    ctx.strokeStyle = 'rgba(205,250,255,.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= WORLD.w; x += 14) {
      const y = wl + Math.sin(x * 0.024 + t * 1.7) * 3;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // shimmering highlights
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#bff9ff';
    for (let i = 0; i < 22; i++) {
      const x = (hash2(i, 7, 3) * WORLD.w + t * 8) % WORLD.w;
      const y = wl + 10 + hash2(i, 8, 6) * (WORLD.h - wl - 20);
      ctx.fillRect(x, y, 10 + (i % 3) * 5, 1.2);
    }
    ctx.globalAlpha = 1;
  }

  /* ------------------------------------------------------------- crates */
  drawCrates(ctx) {
    const g = this.game;
    for (const c of g.crates) {
      if (!c.alive) continue;
      const bob = Math.sin(g.time * 2.2 + c.bob) * 1.8;
      const y = c.y + bob;
      ctx.save();
      ctx.globalAlpha = 0.24;
      ctx.fillStyle = '#ffe66d';
      const beam = ctx.createLinearGradient(0, y - 90, 0, y);
      beam.addColorStop(0, 'rgba(255,230,109,0)');
      beam.addColorStop(0.7, 'rgba(255,230,109,.18)');
      beam.addColorStop(1, 'rgba(255,230,109,.4)');
      ctx.fillStyle = beam;
      ctx.fillRect(c.x - 9, y - 90, 18, 88);
      ctx.restore();

      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.beginPath(); ctx.ellipse(c.x, c.y + 1, 17, 5, 0, 0, TAU); ctx.fill();

      // parachute folded behind
      ctx.fillStyle = 'rgba(225,210,180,.55)';
      ctx.beginPath();
      ctx.moveTo(c.x - 16, y - 22);
      ctx.quadraticCurveTo(c.x, y - 34, c.x + 16, y - 22);
      ctx.quadraticCurveTo(c.x, y - 18, c.x - 16, y - 22);
      ctx.fill();

      // crate body
      const ch = 26, cw = 30;
      ctx.fillStyle = '#7a4c24';
      ctx.fillRect(c.x - cw / 2, y - ch, cw, ch);
      ctx.fillStyle = '#b97a38';
      ctx.fillRect(c.x - cw / 2 + 3, y - ch + 3, cw - 6, ch - 6);
      ctx.strokeStyle = '#5a3417';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x - cw / 2, y - ch, cw, ch);
      ctx.fillStyle = '#3f2a16';
      for (const dx of [-9, 0, 9]) {
        ctx.fillRect(c.x + dx - 1.5, y - ch + 4, 3, ch - 8);
      }
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.moveTo(c.x, y - 20); ctx.lineTo(c.x + 6, y - 13); ctx.lineTo(c.x, y - 6); ctx.lineTo(c.x - 6, y - 13);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7a4c24';
      ctx.font = '900 8px "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', c.x, y - 10);

      // beacon
      const pulse = 0.5 + 0.5 * Math.sin(g.time * 4 + c.bob);
      ctx.globalAlpha = 0.5 + pulse * 0.5;
      ctx.fillStyle = '#ffe66d';
      ctx.beginPath(); ctx.arc(c.x, y - ch - 4, 2.2 + pulse, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }

  /* --------------------------------------------------------------- worm */
  drawWorm(ctx, w) {
    const g = this.game;
    if (!w.alive) { this.drawGrave(ctx, w); return; }
    const t = g.time;
    const active = g.activeWorm === w && g.state !== 'demo';
    const bob = Math.sin(t * 2.6 + w.idleOffset) * (active ? 1.5 : 1);
    const walk = Math.abs(w.vx) > 10 && w.onGround ? Math.sin(w.walkTime * 2) * 2 : 0;
    const x = w.x + walk * 0.4;
    const feet = w.y + bob;
    const facing = w.facing || 1;
    const teamColor = TEAM_COLORS[w.team];
    const body = w.hurtFlash > 0.18 ? '#ffffff' : teamColor;
    const dark = w.team === 0 ? '#9c4d00' : '#5e2b9e';
    const light = w.team === 0 ? '#ffd08a' : '#d9b6ff';
    const headX = x + facing * 3;
    const headY = feet - 46 + bob * 0.4;

    // ground shadow
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#0a0918';
    ctx.beginPath(); ctx.ellipse(x, w.y + 2, 19, 5, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;

    if (active) {
      // active aura
      const pulse = 0.55 + 0.45 * Math.sin(t * 3.4);
      ctx.save();
      ctx.translate(x, w.y + 1);
      ctx.scale(1, 0.32);
      ctx.strokeStyle = teamColor;
      ctx.globalAlpha = 0.35 + pulse * 0.25;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 7]);
      ctx.lineDashOffset = -t * 22;
      ctx.beginPath(); ctx.arc(0, 0, 31, 0, TAU); ctx.stroke();
      ctx.restore();
      // marker chevron
      const by = w.y - 96 + Math.sin(t * 4) * 3;
      ctx.fillStyle = teamColor;
      ctx.beginPath();
      ctx.moveTo(x - 7, by - 6); ctx.lineTo(x + 7, by - 6); ctx.lineTo(x, by + 2);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(x - 4, by - 10); ctx.lineTo(x + 4, by - 10); ctx.lineTo(x, by - 6);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    }

    // tail and body
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = dark;
    ctx.lineWidth = 19;
    ctx.beginPath();
    ctx.moveTo(x - facing * 10, feet - 6);
    ctx.quadraticCurveTo(x - facing * 7, feet - 30, headX, headY + 6);
    ctx.stroke();
    ctx.strokeStyle = body;
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(x - facing * 10, feet - 6);
    ctx.quadraticCurveTo(x - facing * 7, feet - 30, headX, headY + 6);
    ctx.stroke();

    // belly highlight
    ctx.strokeStyle = light;
    ctx.globalAlpha = 0.42;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x - facing * 13, feet - 8);
    ctx.quadraticCurveTo(x - facing * 11, feet - 28, headX - facing * 3, headY + 5);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // segment rings
    ctx.strokeStyle = dark;
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) {
      const yy = feet - 12 - i * 10;
      ctx.beginPath();
      ctx.moveTo(x - facing * 6, yy);
      ctx.quadraticCurveTo(x, yy - 2, x + facing * 5, yy + 1);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // head
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.ellipse(headX, headY, 17, 16, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.ellipse(headX, headY - 1, 14.5, 13.5, 0, 0, TAU); ctx.fill();
    // cheek
    ctx.fillStyle = 'rgba(255,110,140,.3)';
    ctx.beginPath(); ctx.ellipse(headX + facing * 7, headY + 6, 4, 2.6, 0, 0, TAU); ctx.fill();

    // eyes
    const look = Math.cos(w.aimAngle || 0) * 1.7;
    const lookY = Math.sin(w.aimAngle || 0) * 1.3;
    const ex = headX + facing * 3;
    for (const off of [-5.5, 4.5]) {
      const eyeX = ex + off;
      ctx.fillStyle = '#fffdf2';
      ctx.beginPath(); ctx.ellipse(eyeX, headY - 3, 4, 5.4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#15182c';
      ctx.beginPath(); ctx.arc(eyeX + look * 0.75, headY - 2 + lookY * 0.7, 2.1, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.beginPath(); ctx.arc(eyeX + look * 0.75 - 0.7, headY - 3 + lookY * 0.7, 0.65, 0, TAU); ctx.fill();
    }
    // mouth
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(headX + facing * 4, headY + 6.5, 3.4, 0.15, Math.PI - 0.15);
    ctx.stroke();

    // helmet
    ctx.save();
    ctx.translate(headX, headY - 7);
    ctx.rotate(facing * -0.08);
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 12, 0, Math.PI, TAU);
    ctx.fill();
    ctx.fillStyle = w.team === 0 ? '#ffd166' : '#7e4bc0';
    ctx.beginPath();
    ctx.ellipse(0, -1, 14.5, 10.5, 0, Math.PI, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.beginPath();
    ctx.ellipse(-3, -6, 8, 4, -0.25, Math.PI, TAU);
    ctx.fill();
    // brim
    ctx.fillStyle = dark;
    ctx.fillRect(-17, -1, 34, 3);
    // team flair
    if (w.team === 0) {
      ctx.fillStyle = '#7ee081';
      ctx.beginPath();
      ctx.ellipse(0, -10, 4.5, 2.6, -0.6, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#4d9c45'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(2, -17); ctx.stroke();
    } else {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.moveTo(-9, -4); ctx.lineTo(-5, -13); ctx.lineTo(0, -5);
      ctx.lineTo(5, -13); ctx.lineTo(8, -4);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    // weapon + arms
    const angle = w.aimAngle ?? (facing > 0 ? -0.5 : -Math.PI + 0.5);
    const mx = w.muzzle(angle).x;
    const my = w.muzzle(angle).y + bob * 0.3;
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(angle);
    ctx.scale(1, 1);
    this.drawWeapon(ctx, g.weapon, false);
    ctx.restore();

    // arm
    ctx.strokeStyle = dark;
    ctx.lineWidth = 6.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + facing * 7, feet - 29);
    ctx.quadraticCurveTo(x + facing * 16, feet - 32, mx - Math.cos(angle) * 6, my - Math.sin(angle) * 6);
    ctx.stroke();
    ctx.strokeStyle = body;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + facing * 7, feet - 29);
    ctx.quadraticCurveTo(x + facing * 16, feet - 32, mx - Math.cos(angle) * 6, my - Math.sin(angle) * 6);
    ctx.stroke();

    // health bar + label
    const showBar = active || w.hp < w.maxHp;
    if (showBar) {
      const bw = 42, bx = x - bw / 2, by = headY - 34;
      ctx.fillStyle = 'rgba(6,9,20,.72)';
      ctx.fillRect(bx - 2, by - 2, bw + 4, 8);
      ctx.fillStyle = 'rgba(255,255,255,.14)';
      ctx.fillRect(bx, by, bw, 4);
      const frac = w.hp / w.maxHp;
      ctx.fillStyle = frac > 0.55 ? '#7ee081' : frac > 0.25 ? '#ffd166' : '#ff4d6d';
      ctx.fillRect(bx, by, bw * frac, 4);
      ctx.fillStyle = 'rgba(255,255,255,.88)';
      ctx.font = '800 8px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(w.name, x, by - 6);
    }
    ctx.globalAlpha = 1;
  }

  drawWeapon(ctx, weapon, small) {
    const scale = small ? 0.8 : 1;
    ctx.save();
    ctx.scale(scale, scale);
    if (weapon === 'bazooka') {
      ctx.fillStyle = '#3f4f3d';
      ctx.fillRect(-12, -5, 40, 10);
      ctx.fillStyle = '#748d61';
      ctx.fillRect(-10, -4, 36, 6);
      ctx.fillStyle = '#2c382b';
      ctx.fillRect(18, -7, 9, 14);
      ctx.fillStyle = '#ff9f1c';
      ctx.fillRect(26, -5.5, 5, 11);
      ctx.fillStyle = 'rgba(0,0,0,.3)';
      ctx.fillRect(-6, 4, 22, 2.5);
    } else if (weapon === 'shotgun') {
      ctx.fillStyle = '#6d4425';
      ctx.fillRect(-14, -3, 20, 9);
      ctx.fillStyle = '#8a5a30';
      ctx.fillRect(-14, -3, 9, 9);
      ctx.fillStyle = '#5c6670';
      ctx.fillRect(4, -4, 32, 7);
      ctx.fillStyle = '#8b97a3';
      ctx.fillRect(6, -3, 26, 3);
      ctx.fillStyle = '#37424c';
      ctx.fillRect(30, -3.5, 6, 6);
    } else {
      ctx.fillStyle = '#4d6b3e';
      ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#88a765';
      ctx.beginPath(); ctx.arc(-1, -1, 5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#b0c894';
      ctx.fillRect(-3, -5, 6, 2);
      ctx.strokeStyle = '#8b8f96'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(5, -4, 3, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }

  drawGrave(ctx, w) {
    const g = this.game;
    const t = w.deathTimer;
    if (t < 1.1) {
      const a = 1 - t / 1.1;
      ctx.save();
      ctx.globalAlpha = a * 0.8;
      ctx.translate(w.x, w.y - 38 - t * 46);
      ctx.rotate(t * 2.4);
      ctx.scale(0.9 + t * 0.2, 0.9 + t * 0.2);
      ctx.fillStyle = TEAM_COLORS[w.team];
      ctx.beginPath(); ctx.ellipse(0, 0, 15, 18, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fffdf2';
      for (const ox of [-5, 4]) {
        ctx.beginPath(); ctx.arc(ox, -3, 3.4, 0, TAU); ctx.fill();
      }
      ctx.restore();
      return;
    }
    if (w.drowned) return;
    const x = w.x, y = w.y;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath(); ctx.ellipse(x, y + 1, 16, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#59606d';
    ctx.beginPath();
    ctx.moveTo(x - 12, y); ctx.lineTo(x - 12, y - 26); ctx.quadraticCurveTo(x, y - 36, x + 12, y - 26);
    ctx.lineTo(x + 12, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#767f8c';
    ctx.beginPath();
    ctx.moveTo(x - 9, y - 2); ctx.lineTo(x - 9, y - 25); ctx.quadraticCurveTo(x, y - 33, x + 9, y - 25);
    ctx.lineTo(x + 9, y - 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(20,22,32,.55)';
    ctx.fillRect(x - 1.5, y - 26, 3, 15);
    ctx.fillRect(x - 6, y - 21, 12, 3);
    ctx.fillStyle = TEAM_COLORS[w.team];
    ctx.fillRect(x - 9, y - 8, 18, 2);
    ctx.restore();
  }

  drawProjectile(ctx, p) {
    const g = this.game;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.type === 'grenade') {
      ctx.rotate(g.time * 7);
      ctx.fillStyle = '#3e5b39';
      ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#2b3f27'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-4, -3); ctx.lineTo(4, 3); ctx.moveTo(-4, 3); ctx.lineTo(4, -3); ctx.stroke();
      ctx.fillStyle = '#a5b58a';
      ctx.fillRect(-2, -9, 4, 3);
      ctx.strokeStyle = '#b9c0c6'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(4, -7, 3, 0, TAU); ctx.stroke();
      const blink = Math.sin(g.time * 14) > 0 ? '#ff4d6d' : '#ffd166';
      ctx.fillStyle = blink;
      ctx.beginPath(); ctx.arc(0, -11, 2, 0, TAU); ctx.fill();
    } else {
      const a = Math.atan2(p.vy, p.vx);
      ctx.rotate(a);
      ctx.fillStyle = '#e6e0cf';
      ctx.fillRect(-9, -3.5, 18, 7);
      ctx.fillStyle = '#ff6b35';
      ctx.beginPath(); ctx.moveTo(9, -4); ctx.lineTo(15, 0); ctx.lineTo(9, 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#a19a89';
      ctx.fillRect(-10, -3, 5, 6);
      ctx.fillStyle = 'rgba(255,220,140,.9)';
      ctx.beginPath(); ctx.arc(-12, 0, 3 + Math.random() * 2, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  /* ---------------------------------------------------------- aim/build */
  aimPreview() {
    const g = this.game;
    const w = g.activeWorm;
    if (!w) return { points: [], hit: null };
    const angle = w.aimAngle, power = w.aimPower;
    const muzzle = w.muzzle(angle);
    const points = [{ x: muzzle.x, y: muzzle.y }];
    let x = muzzle.x, y = muzzle.y;
    let hit = null;
    if (g.weapon === 'shotgun') {
      const range = 390 + power * 210;
      for (let d = 0; d <= range; d += 22) points.push({ x: muzzle.x + Math.cos(angle) * d, y: muzzle.y + Math.sin(angle) * d });
      return { points, hit: { x: muzzle.x + Math.cos(angle) * range, y: muzzle.y + Math.sin(angle) * range } };
    }
    const speed = 290 + power * 410;
    let vx = Math.cos(angle) * speed, vy = Math.sin(angle) * speed;
    const dt = 0.045;
    for (let t = 0; t < 4.2; t += dt) {
      vx += g.windAccel * dt;
      vy += GRAVITY * dt;
      x += vx * dt; y += vy * dt;
      if (y > g.waterLevel || x < 0 || x > WORLD.w || y < -100) {
        hit = { x, y };
        break;
      }
      if (g.terrain.solidAt(x, y) || g.pieceAt(x, y)) {
        hit = { x, y };
        break;
      }
      points.push({ x, y });
      if (points.length > 60) break;
    }
    if (!hit) hit = points[points.length - 1];
    return { points, hit };
  }

  drawAim(ctx) {
    const g = this.game;
    const w = g.activeWorm;
    const { points, hit } = this.aimPreview();
    const color = g.weapon === 'shotgun' ? '#ffd166' : '#ffb347';
    ctx.save();

    // dots
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const fade = 1 - i / Math.max(1, points.length);
      const r = g.weapon === 'shotgun' ? (i % 3 === 0 ? 2.2 : 1) : 1.5 + fade * 2.6;
      ctx.globalAlpha = 0.22 + fade * 0.6;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
      if (i < points.length - 1) {
        const n = points[i + 1];
        ctx.globalAlpha = 0.08 + fade * 0.2;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(n.x, n.y); ctx.stroke();
      }
    }

    // landing reticle
    if (hit) {
      const pulse = 0.75 + 0.25 * Math.sin(g.time * 7);
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.7;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(hit.x, hit.y, 10 * pulse, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(hit.x - 15, hit.y); ctx.lineTo(hit.x - 5, hit.y);
      ctx.moveTo(hit.x + 5, hit.y); ctx.lineTo(hit.x + 15, hit.y);
      ctx.moveTo(hit.x, hit.y - 15); ctx.lineTo(hit.x, hit.y - 5);
      ctx.moveTo(hit.x, hit.y + 5); ctx.lineTo(hit.x, hit.y + 15);
      ctx.stroke();
    }

    // aim stick + drag ring
    const muzzle = w.muzzle(w.aimAngle);
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 6]);
    ctx.beginPath(); ctx.moveTo(muzzle.x, muzzle.y); ctx.lineTo(muzzle.x + Math.cos(w.aimAngle) * w.aimPower * 150, muzzle.y + Math.sin(w.aimAngle) * w.aimPower * 150); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // power arc around the worm
    const power = w.aimPower;
    const baseA = -Math.PI * 0.82;
    ctx.translate(w.x, w.y - 26);
    ctx.strokeStyle = 'rgba(8,10,22,.55)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, 27, baseA, baseA + Math.PI * 1.44); ctx.stroke();
    ctx.strokeStyle = power > 0.85 ? '#ff4d6d' : power > 0.55 ? '#ff9f1c' : '#7ee081';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, 27, baseA, baseA + Math.PI * 1.44 * power); ctx.stroke();
    ctx.restore();
  }

  drawPowerText() {
    const g = this.game;
    if (g.state !== 'aim' || g.mode !== 'blast' || !g.activeWorm?.alive || g.activeTeam !== 0) return;
    const w = g.activeWorm;
    const wp = g.worldToScreen(w.x, w.y - 66);
    const ctx2 = this.ctx;
    ctx2.save();
    ctx2.font = '900 9px "Arial Black", sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillStyle = 'rgba(8,10,22,.65)';
    ctx2.fillRect(wp.x - 20, wp.y - 8, 40, 13);
    ctx2.fillStyle = '#ffe66d';
    ctx2.fillText(`${Math.round(w.aimPower * 100)}%`, wp.x, wp.y + 2);
    ctx2.restore();
  }

  drawBuildMode(ctx) {
    const g = this.game;
    const w = g.activeWorm;
    if (!w) return;
    ctx.save();
    // grid in build range
    const range = 252;
    ctx.beginPath(); ctx.arc(w.x, w.y - 22, range, 0, TAU); ctx.clip();
    const gx0 = Math.floor((w.x - range) / GRID) * GRID;
    const gx1 = w.x + range;
    const gy0 = Math.floor((w.y - 22 - range) / GRID) * GRID;
    const gy1 = w.y - 22 + range;
    ctx.lineWidth = 1;
    for (let x = gx0; x <= gx1; x += GRID) {
      for (let y = gy0; y <= gy1; y += GRID) {
        const shade = ((x / GRID + y / GRID) & 1) ? 0.045 : 0.02;
        ctx.fillStyle = `rgba(90,200,255,${shade})`;
        ctx.fillRect(x, y, GRID, GRID);
        ctx.strokeStyle = 'rgba(110,215,255,.15)';
        ctx.strokeRect(x + 0.5, y + 0.5, GRID - 1, GRID - 1);
      }
    }
    ctx.restore();

    // range ring
    ctx.save();
    ctx.translate(w.x, w.y - 22);
    ctx.strokeStyle = 'rgba(90,205,255,.35)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 9]);
    ctx.lineDashOffset = -g.time * 16;
    ctx.beginPath(); ctx.arc(0, 0, range, 0, TAU); ctx.stroke();
    ctx.restore();

    // ghost piece
    const gh = g.buildGhost;
    if (gh) {
      const mat = MATERIALS[gh.material];
      const piece = g.makePiece(gh.type, gh.gx, gh.gy, 0, gh.material, gh.dir);
      ctx.save();
      ctx.globalAlpha = gh.valid ? 0.48 : 0.4;
      piece.drawShape(ctx, mat);
      ctx.globalAlpha = gh.valid ? 0.24 : 0.28;
      ctx.fillStyle = gh.valid ? '#38bdf8' : '#ff4d6d';
      ctx.fillRect(gh.gx * GRID, gh.gy * GRID, GRID, GRID);
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = gh.valid ? '#7ddcff' : '#ff6b84';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(gh.gx * GRID + 1, gh.gy * GRID + 1, GRID - 2, GRID - 2);
      ctx.setLineDash([]);
      if (gh.valid) {
        // corner brackets
        const x = gh.gx * GRID, y = gh.gy * GRID;
        ctx.lineWidth = 2.5;
        for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + GRID, y, -1, 1], [x, y + GRID, 1, -1], [x + GRID, y + GRID, -1, -1]]) {
          ctx.beginPath(); ctx.moveTo(cx + dx * 12, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + dy * 12); ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  drawBuildStatus(ctx) {
    const g = this.game;
    if (g.state !== 'aim' || g.mode !== 'build' || !g.buildGhost || g.activeTeam !== 0) return;
    const gh = g.buildGhost;
    const pos = g.worldToScreen(gh.gx * GRID + GRID / 2, gh.gy * GRID - 8);
    const ctx2 = this.ctx;
    const label = gh.valid
      ? `${MATERIALS[gh.material].label} ${gh.type.toUpperCase()} · ${gh.cost} MATS`
      : gh.reason || 'INVALID';
    ctx2.save();
    ctx2.font = '900 9px "Arial Black", sans-serif';
    const tw = ctx2.measureText(label).width;
    const boxW = tw + 14;
    // Keep the label inside the viewport when building near an edge.
    const lx = clamp(pos.x, boxW / 2 + 6, g.view.w - boxW / 2 - 6);
    const ly = Math.max(pos.y, 34);
    ctx2.fillStyle = 'rgba(5,9,22,.78)';
    ctx2.fillRect(lx - tw / 2 - 7, ly - 20, boxW, 15);
    ctx2.strokeStyle = gh.valid ? 'rgba(56,189,248,.6)' : 'rgba(255,77,109,.7)';
    ctx2.lineWidth = 1;
    ctx2.strokeRect(lx - tw / 2 - 7, ly - 20, boxW, 15);
    ctx2.fillStyle = gh.valid ? '#bdefff' : '#ff8da0';
    ctx2.textAlign = 'center';
    ctx2.fillText(label, lx, ly - 10);
    ctx2.restore();
  }

  /* ------------------------------------------------------- screen effects */
  drawScreenEffects() {
    const g = this.game;
    const ctx = this.ctx;
    const v = g.view;
    if (g.fx.flash > 0.01) {
      ctx.fillStyle = `rgba(${g.fx.flashColor || '255,180,90'},${Math.min(0.5, g.fx.flash)})`;
      ctx.fillRect(0, 0, v.w, v.h);
    }
    // storm tint
    const storm = clamp((WATER_START - g.waterLevel) / 150, 0, 1);
    if (storm > 0.02) {
      const grad = ctx.createLinearGradient(0, 0, 0, v.h);
      grad.addColorStop(0, `rgba(92,42,160,${storm * 0.2})`);
      grad.addColorStop(0.6, 'rgba(92,42,160,0)');
      grad.addColorStop(1, `rgba(28,8,50,${storm * 0.25})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, v.w, v.h);
    }
    if (g.state === 'over' && g.winner === 0) this.drawConfetti();
    if (g.state === 'over' && g.winner === 1) {
      ctx.fillStyle = 'rgba(80,10,35,.12)';
      ctx.fillRect(0, 0, v.w, v.h);
    }
  }

  drawConfetti() {
    const g = this.game;
    const ctx = this.ctx;
    const v = g.view;
    const t = g.time;
    const colors = ['#ff9f1c', '#ffe66d', '#38bdf8', '#b06bff', '#7ee081', '#ff6b35'];
    for (let i = 0; i < 70; i++) {
      const x = (hash2(i, 11, 3) * v.w + Math.sin(t * 2 + i) * 24) % v.w;
      const speed = 70 + hash2(i, 12, 4) * 90;
      const y = ((hash2(i, 13, 6) * v.h + t * speed) % (v.h + 40)) - 20;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * (1 + i % 4) + i);
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.75;
      ctx.fillRect(-2.5, -1, 5, 2.5);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}
