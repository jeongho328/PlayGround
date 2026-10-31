import {
  WORLD, GRID, WATER_START, GRAVITY, TEAM_COLORS, TEAM_NAMES, WORM_NAMES,
  DEFAULT_SEED, clamp, lerp, rand, randInt, TAU, dist2, mulberry32
} from './core.js';
import { Terrain } from './terrain.js';
import { Piece, MATERIALS } from './pieces.js';
import { Worm } from './worm.js';
import { FX } from './fx.js';
import { AI } from './ai.js';

const WEAPONS = {
  bazooka: { name: 'BAZOOKA', radius: 58, damage: 54, speed: [315, 350], gravity: GRAVITY },
  grenade: { name: 'GRENADE', radius: 72, damage: 45, speed: [330, 320], gravity: GRAVITY, fuse: 2.25 },
  shotgun: { name: 'PUMP', radius: 13, damage: 11, speed: [500, 130] }
};
const WEAPON_ORDER = ['bazooka', 'grenade', 'shotgun'];
const BUILD_ORDER = ['wall', 'floor', 'ramp'];
const BUILD_COST = { wall: 1, floor: 0.8, ramp: 1.12 };
const BUILD_HP = { wall: 1, floor: 0.62, ramp: 0.88 };
const STEP = 15;

class Projectile {
  constructor({ type, owner, team, x, y, angle, power, wind }) {
    this.type = type;
    this.owner = owner;
    this.team = team;
    this.x = x;
    this.y = y;
    this.age = 0;
    if (type === 'grenade') {
      const speed = 300 + power * 330;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.fuse = WEAPONS.grenade.fuse;
      this.bounces = 0;
      this.radius = 6;
    } else {
      const speed = 290 + power * 410;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.fuse = Infinity;
      this.radius = 4;
    }
    this.wind = wind;
    this.trailTimer = 0;
    this.spin = rand(TAU);
  }
}

export class Game {
  constructor(canvas, audio) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audio = audio;
    this.ui = null;
    this.time = 0;
    this.lastTickSecond = 99;
    this.paused = false;

    this.view = {
      w: 0, h: 0, dpr: 1, zoom: 0.8, camX: 900, camY: 550,
      cx: 0, cy: 0, bottomInset: 148, topInset: 70
    };
    this.keys = { left: false, right: false };
    this.aiming = false;
    this.painting = false;
    this.lastPaintCell = '';
    this.pointer = { x: 900, y: 500, active: false };
    this.buildGhost = null;

    this.weapon = 'bazooka';
    this.mode = 'blast';
    this.buildType = 'wall';
    this.material = 'wood';
    this.rampDir = 1;
    this.state = 'demo';
    this.winner = -1;
    this.timeLeft = 60;
    this.matchTime = 0;
    this.effectsTimer = 0;

    this.reset(DEFAULT_SEED, true);
    this.ai = new AI(this);
    this.resize(window.innerWidth, window.innerHeight);
    this.camX = 900;
    this.camY = 550;
  }

  reset(seed = DEFAULT_SEED, demo = false) {
    this.seed = seed;
    this.terrain = new Terrain(seed);
    this.pieces = [];
    this.projectiles = [];
    this.worms = [];
    this.crates = [];
    this.fx = new FX();
    this.mats = [62, 62];
    this.waterLevel = WATER_START;
    this.round = 1;
    this.buildCount = [0, 0];
    this.crateCount = [0, 0];
    this.activeTeam = 0;
    this.activeWorm = null;
    this.lastActiveSlot = [-1, -1];
    this.turnInTeam = [0, 0];
    this.windDisplay = randInt(-18, 18);
    this.windAccel = this.windDisplay * 4.2;
    this.timeLeft = 60;
    this.lastTickSecond = 99;
    this.aiming = false;
    this.painting = false;
    this.state = demo ? 'demo' : 'aim';
    this.winner = -1;
    this.pendingWinner = null;
    this.matchTime = 0;
    this.mode = 'blast';
    this.weapon = 'bazooka';
    this.buildType = 'wall';
    this.material = 'wood';
    this.buildGhost = null;
    this.turnStart = 0;

    const spawns = [
      { x: 548, team: 0, slot: 0 },
      { x: 648, team: 0, slot: 1 },
      { x: 1252, team: 1, slot: 0 },
      { x: 1148, team: 1, slot: 1 }
    ];
    this.worms = spawns.map(({ x, team, slot }) => {
      const y = this.terrain.surfaceBelow(x, WORLD.h) ?? 800;
      const w = new Worm({
        team, slot, x, y: y - 1,
        name: WORM_NAMES[team][slot]
      });
      w.aimAngle = team === 0 ? -0.62 : -Math.PI + 0.62;
      w.aimPower = 0.74;
      return w;
    });
    if (demo) this.activeWorm = this.worms[0];
    this.setupCrates();
  }

  setupCrates() {
    const spots = [
      { x: 900, maxY: 520 },
      { x: 705, maxY: WORLD.h },
      { x: 1092, maxY: WORLD.h },
      { x: 1470, maxY: WORLD.h }
    ];
    this.crates = spots.map((s, i) => {
      const y = this.terrain.surfaceBelow(s.x, s.maxY) ?? 800;
      return { x: s.x, y: y - 1, vy: 0, alive: true, bob: rand(TAU), id: i, takenBy: -1 };
    }).filter((c, i) => i !== 3 || Math.random() > 0.5);
  }

  setUI(ui) { this.ui = ui; }

  resize(w, h) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const controls = document.getElementById('controls');
    const bottomInset = controls ? Math.max(70, controls.getBoundingClientRect().height - 6) : 148;
    this.view.w = w;
    this.view.h = h;
    this.view.dpr = dpr;
    this.view.bottomInset = bottomInset;
    this.view.cx = w / 2;
    this.view.cy = Math.max(180, (h - bottomInset) / 2 + 10);

    const portrait = w / h < 0.84;
    let zoom;
    if (portrait) {
      zoom = clamp(Math.min((w - 18) / 760, (h - bottomInset) / 1120), 0.4, 0.66);
    } else {
      const targetWidth = h < 500 ? 1700 : 1800;
      zoom = clamp(Math.max(w / targetWidth, (h - bottomInset) / 1100), 0.47, 1.14);
    }
    this.view.zoom = zoom;
  }

  get teamColorA() { return TEAM_COLORS[0]; }

  startMatch(seed = DEFAULT_SEED) {
    const finalSeed = seed ?? (Math.floor(Math.random() * 1e9) + 1);
    this.reset(finalSeed, false);
    this.round = 1;
    this.lastActiveSlot = [-1, -1];
    this.state = 'aim';
    this.startTurn(0, true);
    this.ui?.setPlaying(true);
    this.ui?.hideStart();
    this.fx.flash = 0.18;
    this.fx.flashColor = '255,200,120';
  }

  startTurn(team, first = false, surge = false) {
    const members = this.worms.filter(w => w.team === team && w.alive).sort((a, b) => a.slot - b.slot);
    if (!members.length) {
      this.finishMatch(team === 0 ? 1 : 0);
      return;
    }
    const last = this.lastActiveSlot[team];
    let next = members.find(w => w.slot > last);
    if (!next) next = members[0];
    this.lastActiveSlot[team] = next.slot;
    this.activeTeam = team;
    this.activeWorm = next;
    this.turnInTeam[team]++;
    next.resetTurn();
    this.mats[team] = Math.min(128, this.mats[team] + (first ? 0 : 18));
    this.timeLeft = 60;
    this.lastTickSecond = 99;
    this.aiming = false;
    this.painting = false;
    this.mode = 'blast';
    this.buildGhost = null;
    this.projectiles = [];
    this.windDisplay = randInt(-26, 26);
    this.windAccel = this.windDisplay * 4.2;
    this.turnStart = this.time;

    const target = this.nearestEnemy(next);
    if (target) {
      next.facing = target.x >= next.x ? 1 : -1;
      next.aimAngle = target.x >= next.x ? -0.62 : -Math.PI + 0.62;
      next.aimPower = 0.74;
    }
    this.state = team === 0 ? 'aim' : 'ai';
    this.fx.shake = Math.min(this.fx.shake, 2);

    if (team === 0) {
      if (!surge) this.ui?.banner('YOUR TURN', `${next.name} IS UP`, 'Build cover, then blast the Syndicate.', TEAM_COLORS[0], 2300);
      this.audio.play('turn');
    } else {
      this.ui?.banner('SYNDICATE TURN', `${next.name} IS MAKING A MOVE`, 'Watch the sky. Watch the walls.', TEAM_COLORS[1], 2100);
      this.audio.play('turn');
      this.ai.begin();
    }
    this.ui?.syncAll();
    this.ui?.setMode(this.mode);
  }

  nearestEnemy(worm) {
    if (!worm) return null;
    let best = null, bd = Infinity;
    for (const w of this.worms) {
      if (!w.alive || w.team === worm.team) continue;
      const d = dist2(w.x, w.y, worm.x, worm.y);
      if (d < bd) { bd = d; best = w; }
    }
    return best;
  }

  aliveCount(team) {
    return this.worms.filter(w => w.team === team && w.alive).length;
  }

  /* ------------------------------------------------------------- viewport */
  screenToWorld(sx, sy) {
    const v = this.view;
    return {
      x: v.camX + (sx - v.cx) / v.zoom,
      y: v.camY + (sy - v.cy) / v.zoom
    };
  }

  worldToScreen(x, y) {
    const v = this.view;
    return { x: v.cx + (x - v.camX) * v.zoom, y: v.cy + (y - v.camY) * v.zoom };
  }

  inField(sx, sy) {
    const v = this.view;
    return sy > 52 && sy < v.h - Math.max(60, v.bottomInset - 12);
  }

  updateCamera(dt) {
    const v = this.view;
    let fx = 900, fy = 560;
    if (this.state === 'demo') {
      fx = 900 + Math.sin(this.time * 0.08) * 60;
      fy = 552;
    } else if (this.activeWorm) {
      const active = this.activeWorm;
      fx = active.x;
      fy = 552;
      const target = this.nearestEnemy(active);
      if (target && (this.state === 'aim' || this.state === 'ai')) {
        if (v.w / v.h < 0.84) {
          // Portrait screens are narrow: frame the whole squad spread, not just
          // the active worm and its nearest target.
          const alive = this.worms.filter(w => w.alive);
          const xs = alive.map(w => w.x);
          fx = (Math.min(...xs) + Math.max(...xs)) / 2;
        } else {
          fx = active.x * 0.56 + target.x * 0.44;
        }
      }
      if (this.state === 'firing' && this.projectiles.length) {
        const p = this.projectiles[0];
        fx = p.x;
        fy = clamp(p.y, 380, 760);
      }
      if (this.state === 'settle' && this.lastHitPoint) {
        fx = this.lastHitPoint.x;
        fy = clamp(this.lastHitPoint.y, 380, 760);
      }
    }
    const halfW = v.w / (2 * v.zoom);
    const halfH = v.h / (2 * v.zoom);
    if (halfW * 2 >= WORLD.w) fx = WORLD.w / 2;
    else fx = clamp(fx, halfW, WORLD.w - halfW);
    if (halfH * 2 >= WORLD.h) fy = WORLD.h / 2;
    else fy = clamp(fy, halfH, WORLD.h - halfH);

    const speed = this.state === 'firing' ? 6.5 : 3.4;
    const k = 1 - Math.exp(-dt * speed);
    this.camX = lerp(this.camX, fx, k);
    this.camY = lerp(this.camY, fy, k);
  }

  /* ---------------------------------------------------------------- input */
  pointerDown(sx, sy) {
    if (this.paused || this.state !== 'aim' || this.activeTeam !== 0 || !this.activeWorm?.alive) return;
    if (!this.inField(sx, sy)) return;
    const p = this.screenToWorld(sx, sy);
    this.pointer = { x: p.x, y: p.y, active: true };
    if (this.mode === 'build') {
      this.painting = true;
      this.lastPaintCell = '';
      this.updateBuildGhost(p.x, p.y);
      this.buildAtGhost();
    } else {
      this.aiming = true;
      this.updateAim(p.x, p.y);
      this.ui?.hideAimHint();
    }
  }

  pointerMove(sx, sy, down) {
    if (this.state !== 'aim' || this.activeTeam !== 0 || !this.activeWorm?.alive) return;
    if (!this.inField(sx, sy)) return;
    const p = this.screenToWorld(sx, sy);
    this.pointer = { x: p.x, y: p.y, active: !!down };
    if (this.mode === 'build') {
      this.updateBuildGhost(p.x, p.y);
      if (down && this.painting) this.buildAtGhost();
    } else if (this.aiming && down) {
      this.updateAim(p.x, p.y);
    }
  }

  pointerUp() {
    if (this.aiming && this.state === 'aim' && this.activeWorm?.alive) {
      this.aiming = false;
      this.fireActive();
    }
    this.painting = false;
    this.lastPaintCell = '';
  }

  pointerCancel() {
    this.aiming = false;
    this.painting = false;
  }

  updateAim(wx, wy) {
    const w = this.activeWorm;
    if (!w) return;
    const mx = w.x, my = w.y - 31;
    const dx = wx - mx, dy = wy - my;
    const dist = Math.hypot(dx, dy);
    let angle = Math.atan2(dy, dx);
    // Prevent aiming straight into your own feet.
    if (angle > -0.06 && angle < Math.PI - 0.06) {
      angle = dy > 0 ? Math.min(angle, Math.PI - 0.12) : -0.08;
    }
    w.aimAngle = angle;
    w.facing = Math.cos(angle) >= 0 ? 1 : -1;
    w.aimPower = clamp(dist / 335, 0.18, 1);
  }

  toggleMode(force) {
    if (this.state !== 'aim' || this.activeTeam !== 0) return;
    const next = force ?? (this.mode === 'blast' ? 'build' : 'blast');
    if (next === this.mode) return;
    this.mode = next;
    this.aiming = false;
    this.painting = false;
    if (this.mode === 'build') {
      const w = this.activeWorm;
      this.updateBuildGhost(w.x + w.facing * GRID * 1.4, w.y - 18);
      this.audio.play('ui');
    } else {
      this.buildGhost = null;
    }
    this.ui?.setMode(this.mode);
  }

  selectWeapon(id) {
    if (!WEAPONS[id] || this.state !== 'aim' || this.activeTeam !== 0) return;
    this.weapon = id;
    if (this.mode === 'build') { this.mode = 'blast'; this.buildGhost = null; this.ui?.setMode(this.mode); }
    this.audio.play('ui');
    this.ui?.syncWeapon();
  }

  selectBuild(type) {
    if (!BUILD_ORDER.includes(type)) return;
    this.buildType = type;
    this.audio.play('ui');
    this.ui?.syncWeapon();
    this.updateBuildGhost(this.pointer.x, this.pointer.y);
  }

  cycleMaterial() {
    const keys = Object.keys(MATERIALS);
    const i = keys.indexOf(this.material);
    this.material = keys[(i + 1) % keys.length];
    this.rampDir = this.rampDir || 1;
    this.audio.play('ui');
    this.ui?.syncWeapon();
    this.updateBuildGhost(this.pointer.x, this.pointer.y);
  }

  rotateRamp() {
    this.rampDir *= -1;
    this.audio.play('ui');
    this.updateBuildGhost(this.pointer.x, this.pointer.y);
    this.ui?.syncWeapon();
  }

  jump() {
    if (this.state !== 'aim' || this.activeTeam !== 0) return;
    const w = this.activeWorm;
    if (!w?.alive || !w.onGround || w.jumps <= 0) return;
    w.vy = -372;
    w.jumps--;
    w.onGround = false;
    this.audio.play('jump');
    this.fx.puff(w.x, w.y, '#c9b28a', 4, 26);
  }

  setKey(dir, down) {
    if (dir === 'left') this.keys.left = down;
    if (dir === 'right') this.keys.right = down;
  }

  /* --------------------------------------------------------------- building */
  buildCost(type = this.buildType, material = this.material) {
    return Math.max(3, Math.round(MATERIALS[material].cost * BUILD_COST[type]));
  }

  makePiece(type, gx, gy, team, material, dir) {
    return new Piece({ type, gx, gy, material, team, dir, t: this.time });
  }

  pieceAt(x, y) {
    for (const p of this.pieces) {
      if (!p.dead && p.contains(x, y)) return p;
    }
    return null;
  }

  pieceTopAt(x, maxY) {
    let best = null;
    for (const p of this.pieces) {
      if (p.dead) continue;
      const t = p.topAt(x, maxY);
      if (t !== null && (best === null || t > best)) best = t;
    }
    return best;
  }

  walkSurface(x, maxY) {
    let surface = this.terrain.surfaceBelow(x, maxY);
    const pt = this.pieceTopAt(x, maxY);
    if (pt !== null && (surface === null || pt > surface)) surface = pt;
    return surface;
  }

  hasSupport(piece) {
    const w = this.activeWorm;
    if (w && w.team === piece.team) {
      const c = piece.center();
      if (Math.hypot(c.x - w.x, c.y - (w.y - 20)) < 92) return true;
    }
    for (const s of piece.solids) {
      for (let x = s.x; x <= s.x + s.w; x += 6) {
        if (this.terrain.solidAt(x, s.y - 2) || this.terrain.solidAt(x, s.y + s.h + 2)) return true;
        if (this.terrain.solidAt(x - 2, s.y + s.h / 2) || this.terrain.solidAt(x + s.w + 2, s.y + s.h / 2)) return true;
      }
      for (let y = s.y; y <= s.y + s.h; y += 6) {
        if (this.terrain.solidAt(s.x - 2, y) || this.terrain.solidAt(s.x + s.w + 2, y)) return true;
      }
    }
    for (const s of piece.solids) {
      const pts = [
        [s.x + s.w / 2, s.y - 2], [s.x + s.w / 2, s.y + s.h + 2],
        [s.x - 2, s.y + s.h / 2], [s.x + s.w + 2, s.y + s.h / 2]
      ];
      for (const [x, y] of pts) {
        if (this.pieceAt(x, y)) return true;
        if (this.terrain.solidAt(x, y)) return true;
      }
    }
    return false;
  }

  validateGhost(gx, gy) {
    const w = this.activeWorm;
    if (!w) return { valid: false, reason: 'NO WORM' };
    if (gx < 0 || gy < 0 || gx >= WORLD.w / GRID || gy >= WORLD.h / GRID) return { valid: false, reason: 'OUT OF BOUNDS' };
    if (this.mode !== 'build') return { valid: false, reason: '' };
    const piece = this.makePiece(this.buildType, gx, gy, 0, this.material, this.rampDir);
    const c = piece.center();
    if (Math.hypot(c.x - w.x, c.y - (w.y - 22)) > 252) return { valid: false, reason: 'TOO FAR' };
    if (c.y > this.waterLevel + 18) return { valid: false, reason: 'UNDERWATER' };
    if (this.pieces.some(p => !p.dead && p.gx === gx && p.gy === gy && p.type === this.buildType)) {
      return { valid: false, reason: 'ALREADY BUILT' };
    }
    for (const worm of this.worms) {
      if (!worm.alive) continue;
      for (const s of piece.solids) {
        if (worm.x + 15 > s.x && worm.x - 15 < s.x + s.w && worm.y > s.y - 12 && worm.y - 50 < s.y + s.h) {
          return { valid: false, reason: 'BLOCKS A WORM' };
        }
      }
    }
    if (!this.hasSupport(piece)) return { valid: false, reason: 'NEEDS SUPPORT' };
    const cost = this.buildCost();
    if (this.mats[0] < cost) return { valid: false, reason: 'NOT ENOUGH MATS' };
    return { valid: true, reason: '', piece, cost };
  }

  updateBuildGhost(wx, wy) {
    if (this.mode !== 'build') { this.buildGhost = null; return; }
    const gx = Math.floor(clamp(wx, 0, WORLD.w - 1) / GRID);
    const gy = Math.floor(clamp(wy, 0, WORLD.h - 1) / GRID);
    const check = this.validateGhost(gx, gy);
    this.buildGhost = {
      gx, gy, type: this.buildType, material: this.material, dir: this.rampDir,
      valid: check.valid, reason: check.reason, cost: check.cost ?? this.buildCost()
    };
  }

  buildAtGhost() {
    if (!this.buildGhost || this.state !== 'aim' || this.activeTeam !== 0 || this.mode !== 'build') return false;
    const key = `${this.buildGhost.gx},${this.buildGhost.gy},${this.buildType}`;
    if (key === this.lastPaintCell) return false;
    this.lastPaintCell = key;
    return this.tryPlace(this.buildGhost.gx, this.buildGhost.gy, {
      team: 0, material: this.material, type: this.buildType, dir: this.rampDir, actor: this.activeWorm
    });
  }

  tryPlace(gx, gy, opts = {}) {
    const team = opts.team ?? 0;
    const material = opts.material ?? 'wood';
    const type = opts.type ?? 'wall';
    const dir = opts.dir ?? 1;
    if (gx < 0 || gy < 0 || gx >= WORLD.w / GRID || gy >= WORLD.h / GRID) return false;
    const piece = this.makePiece(type, gx, gy, team, material, dir);
    if (this.pieces.some(p => !p.dead && p.gx === gx && p.gy === gy && p.type === type)) return false;
    const c = piece.center();
    if (c.y > this.waterLevel + 14) return false;
    const actor = opts.actor ?? (team === this.activeTeam ? this.activeWorm : null);
    if (actor && actor.team === team) {
      if (Math.hypot(c.x - actor.x, c.y - (actor.y - 22)) > 252) return false;
    }
    for (const worm of this.worms) {
      if (!worm.alive) continue;
      for (const s of piece.solids) {
        if (worm.x + 14 > s.x && worm.x - 14 < s.x + s.w && worm.y > s.y - 12 && worm.y - 48 < s.y + s.h) return false;
      }
    }
    if (!opts.skipSupport && !this.hasSupport(piece)) return false;
    const cost = Math.max(3, Math.round(MATERIALS[material].cost * BUILD_COST[type]));
    if (this.mats[team] < cost) {
      if (!opts.silent) {
        this.showToast('NOT ENOUGH MATS', 'bad', 900);
        this.audio.play('denied');
      }
      return false;
    }
    this.mats[team] -= cost;
    this.buildCount[team] = (this.buildCount[team] || 0) + 1;
    this.pieces.push(piece);
    if (this.pieces.length > 160) {
      const idx = this.pieces.findIndex(p => p.dead);
      if (idx >= 0) this.pieces.splice(idx, 1);
    }
    this.fx.buildPop(c.x, c.y, team === 0 ? '120,215,255' : '220,150,255');
    this.fx.shake = Math.min(8, this.fx.shake + 1.4);
    this.audio.play('build');
    if (!opts.silent) {
      this.ui?.syncMats();
      this.updateBuildGhost(this.pointer.x, this.pointer.y);
    } else {
      this.ui?.syncMats();
    }
    return true;
  }

  onPieceDestroyed(piece) {
    const c = piece.center();
    const mat = MATERIALS[piece.material];
    this.fx.debris(c.x, c.y, mat.dust, 16, 300);
    this.fx.puff(c.x, c.y, '#d6c9b2', 6, 50);
    this.audio.play('buildBreak');
    this.fx.shake = Math.min(18, this.fx.shake + 3);
  }

  /* --------------------------------------------------------------- combat */
  fireActive() {
    if (this.state !== 'aim' || this.activeTeam !== 0 || this.mode !== 'blast' || !this.activeWorm?.alive) return;
    const w = this.activeWorm;
    this.fireWeapon(w, w.aimAngle, w.aimPower, this.weapon);
  }

  aiFire(plan) {
    if (this.state !== 'ai' || !this.activeWorm?.alive) return;
    this.fireWeapon(this.activeWorm, plan.angle, plan.power, plan.weapon);
  }

  fireWeapon(shooter, angle, power, weapon) {
    if (!shooter?.alive) return;
    this.aiming = false;
    this.painting = false;
    this.buildGhost = null;
    shooter.shots++;
    shooter.aimAngle = angle;
    shooter.aimPower = power;
    shooter.facing = Math.cos(angle) >= 0 ? 1 : -1;
    const muzzle = shooter.muzzle(angle);
    this.fx.muzzle(muzzle.x, muzzle.y, angle);
    this.lastHitPoint = null;

    if (weapon === 'shotgun') {
      this.fireShotgun(shooter, angle, power, muzzle);
      this.audio.play('shotgun');
      this.fx.shake = Math.min(14, this.fx.shake + 4.5);
      this.state = 'firing';
      this.firingTimer = 0.62;
      this.settleTimer = 1.25;
    } else {
      const p = new Projectile({
        type: weapon, owner: shooter, team: shooter.team,
        x: muzzle.x, y: muzzle.y, angle, power, wind: this.windAccel
      });
      this.projectiles.push(p);
      this.audio.play(weapon === 'grenade' ? 'throw' : 'shoot');
      this.fx.shake = Math.min(12, this.fx.shake + (weapon === 'grenade' ? 2 : 3.5));
      this.state = 'firing';
      this.firingTimer = 0.28;
      this.settleTimer = 1.45;
    }
    // Recoil kick
    shooter.vx -= Math.cos(angle) * 26;
    shooter.recoil = 1;
    this.ui?.hideAimHint();
    this.ui?.syncAll();
  }

  fireShotgun(shooter, angle, power, muzzle) {
    const range = 390 + power * 210;
    const pellets = 7;
    for (let i = 0; i < pellets; i++) {
      const a = angle + (i - (pellets - 1) / 2) * 0.047 + rand(0.018, -0.018);
      const dx = Math.cos(a), dy = Math.sin(a);
      let hitX = muzzle.x + dx * range, hitY = muzzle.y + dy * range;
      let hitWorm = null, hitPiece = null;
      const step = 4;
      for (let d = 10; d < range; d += step) {
        const x = muzzle.x + dx * d, y = muzzle.y + dy * d;
        if (x < 0 || x > WORLD.w || y < 0) { hitX = x; hitY = y; break; }
        if (y > this.waterLevel) { hitX = x; hitY = y; break; }
        let wormHit = null;
        for (const w of this.worms) {
          if (!w.alive) continue;
          if (dist2(x, y, w.cx, w.cy) < 17 * 17) { wormHit = w; break; }
        }
        if (wormHit) { hitWorm = wormHit; hitX = x; hitY = y; break; }
        const piece = this.pieceAt(x, y);
        if (this.terrain.solidAt(x, y) || piece) {
          hitPiece = piece;
          hitX = x; hitY = y;
          break;
        }
        let crate = null;
        for (const c of this.crates) if (c.alive && dist2(x, y, c.x, c.y - 12) < 17 * 17) { crate = c; break; }
        if (crate) { this.collectCrate(crate, shooter.team); hitX = x; hitY = y; break; }
      }
      this.fx.tracer(muzzle.x, muzzle.y, hitX, hitY, '#ffe0a3', 2);
      if (hitWorm) {
        const fall = 1 - clamp(Math.hypot(hitX - muzzle.x, hitY - muzzle.y) / range, 0, 1) * 0.35;
        hitWorm.hurt(10.5 * fall, this);
        hitWorm.vx += dx * 55;
        hitWorm.vy -= 60;
        this.fx.text(hitWorm.x, hitWorm.y - 66, '-' + Math.round(10.5 * fall), '#ffe66d', 15);
        this.fx.puff(hitX, hitY, '#7ee081', 4, 24);
        this.audio.play('hurt');
      } else if (hitPiece) {
        hitPiece.damage(26, this);
        this.fx.puff(hitX, hitY, MATERIALS[hitPiece.material].dust, 3, 26);
        this.pieces = this.pieces.filter(p => !p.dead);
      } else {
        this.terrain.carve(hitX, hitY, 9 + rand(4));
        this.fx.puff(hitX, hitY, '#9a6a3e', 3, 18);
      }
    }
  }

  simulateShot(shooter, angle, power, type = 'bazooka') {
    let x = shooter.muzzle(angle).x;
    let y = shooter.muzzle(angle).y;
    const speed = type === 'grenade' ? 300 + power * 330 : 290 + power * 410;
    let vx = Math.cos(angle) * speed, vy = Math.sin(angle) * speed;
    const dt = 0.018;
    for (let t = 0; t < 6; t += dt) {
      vx += this.windAccel * dt;
      vy += GRAVITY * dt;
      const nx = x + vx * dt, ny = y + vy * dt;
      if (nx < 0 || nx > WORLD.w || ny < -200) return { x: nx, y: ny, out: true };
      if (ny > this.waterLevel) return { x: nx, y: ny, water: true };
      for (const w of this.worms) {
        if (!w.alive || w === shooter) continue;
        if (dist2(nx, ny, w.cx, w.cy) < 17 * 17) return { x: nx, y: ny, worm: w };
      }
      if (this.terrain.solidAt(nx, ny)) return { x: nx, y: ny };
      const piece = this.pieceAt(nx, ny);
      if (piece) return { x: nx, y: ny, piece };
      x = nx; y = ny;
    }
    return { x, y, timeout: true };
  }

  lineOfSight(a, b) {
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.ceil(d / 6);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = lerp(a.x, b.x, t), y = lerp(a.y, b.y, t);
      if (this.terrain.solidAt(x, y) || this.pieceAt(x, y)) return false;
    }
    return true;
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.age += dt;
      if (p.type === 'grenade') {
        p.fuse -= dt;
        if (p.fuse <= 0) {
          this.detonate(p, p.x, p.y);
          this.projectiles.splice(i, 1);
          continue;
        }
      }
      const steps = Math.max(1, Math.ceil(dt / 0.006));
      const sdt = dt / steps;
      let dead = false;
      for (let s = 0; s < steps && !dead; s++) {
        const px = p.x, py = p.y;
        p.vx += p.wind * sdt;
        p.vy += GRAVITY * sdt;
        const nx = p.x + p.vx * sdt, ny = p.y + p.vy * sdt;

        if (nx < -20 || nx > WORLD.w + 20 || ny < -300) {
          this.projectiles.splice(i, 1);
          dead = true;
          break;
        }
        if (ny > this.waterLevel) {
          this.fx.splash(nx, this.waterLevel, 20);
          this.audio.play('splash');
          this.projectiles.splice(i, 1);
          dead = true;
          break;
        }

        let directWorm = null;
        if (p.age > 0.07) {
          for (const w of this.worms) {
            if (!w.alive) continue;
            if (dist2(nx, ny, w.cx, w.cy) < 15 * 15) { directWorm = w; break; }
          }
        }
        if (directWorm) {
          p.x = nx; p.y = ny;
          this.detonate(p, nx, ny);
          this.projectiles.splice(i, 1);
          dead = true;
          break;
        }

        const terrainHit = this.terrain.solidAt(nx, ny);
        const pieceHit = this.pieceAt(nx, ny);
        if (terrainHit || pieceHit) {
          if (p.type === 'bazooka') {
            p.x = nx; p.y = ny;
            this.detonate(p, nx, ny);
            this.projectiles.splice(i, 1);
            dead = true;
            break;
          }
          const solidX = this.terrain.solidAt(px, ny) || this.pieceAt(px, ny);
          const solidY = this.terrain.solidAt(nx, py) || this.pieceAt(nx, py);
          if (solidY) {
            p.vy = -Math.abs(p.vy) * 0.44;
            p.y = py - 1.5;
            p.vx *= 0.8;
          }
          if (solidX) {
            p.vx = -p.vx * 0.52;
            p.x = px - Math.sign(p.vx || 1) * 1.5;
          }
          if (!solidX && !solidY) {
            p.vx *= -0.42; p.vy *= -0.42;
            p.x = px; p.y = py;
          }
          p.bounces++;
          this.fx.puff(nx, ny, '#c7b292', 5, 22);
          this.audio.play('land');
          if (p.bounces >= 6) {
            this.detonate(p, nx, ny);
            this.projectiles.splice(i, 1);
            dead = true;
            break;
          }
          p.x = clamp(p.x, 3, WORLD.w - 3);
          p.y = Math.min(p.y, this.waterLevel - 3);
          continue;
        }
        p.x = nx; p.y = ny;
      }
      if (dead) continue;
      p.trailTimer -= dt;
      if (p.trailTimer <= 0) {
        p.trailTimer = p.type === 'grenade' ? 0.05 : 0.022;
        this.fx.puff(p.x, p.y, p.type === 'grenade' ? '#c9bda8' : '#ddd3c2', 1, 8);
      }
    }
  }

  detonate(p, x, y) {
    this.lastHitPoint = { x, y };
    const spec = WEAPONS[p.type === 'grenade' ? 'grenade' : 'bazooka'];
    this.explode(x, y, spec.radius, spec.damage, p.team, p.owner);
  }

  explode(x, y, radius, damage, team, owner) {
    this.lastHitPoint = { x, y };
    this.terrain.carve(x, y, radius * 1.02);
    this.fx.explode(x, y, radius, {
      fire: team === 0 ? '#ffb347' : '#c99cff',
      smoke: '#4a4440',
      dirt: '#7d532f'
    });
    this.audio.play('explode');

    const pieces = this.pieces.slice();
    for (const piece of pieces) {
      if (piece.dead) continue;
      const c = piece.center();
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < radius + 42) {
        const fall = clamp(1 - d / (radius + 42), 0, 1);
        piece.damage(damage * 1.72 * (0.4 + fall * 0.8) + 12, this);
      }
    }
    this.pieces = this.pieces.filter(p => !p.dead);

    for (const w of this.worms) {
      if (!w.alive) continue;
      const d = Math.hypot(w.cx - x, w.cy - y);
      if (d < radius + 26) {
        const fall = clamp(1 - d / (radius + 30), 0, 1);
        let dmg = damage * (0.36 + fall * 0.68);
        if (w === owner) dmg *= 0.66;
        dmg = Math.max(6, Math.round(dmg * rand(1.06, 0.94)));
        w.hurt(dmg, this);
        const nx = d > 1 ? (w.cx - x) / d : 0;
        const ny = d > 1 ? (w.cy - y) / d : -1;
        const force = 130 + damage * 3.2 * (0.5 + fall);
        w.vx += nx * force;
        w.vy += ny * force - 120;
        w.onGround = false;
        this.fx.text(w.x + rand(10, -10), w.y - 72, '-' + dmg, w.team === 0 ? '#ffe66d' : '#e6b3ff', 19);
        this.fx.puff(w.cx, w.cy, '#8b7a5c', 5, 32);
        this.audio.play('hurt');
      }
    }
    for (const crate of this.crates) {
      if (!crate.alive) continue;
      if (Math.hypot(crate.x - x, crate.y - 14 - y) < radius + 54) {
        this.collectCrate(crate, team);
      }
    }
    this.checkWaterDeaths();
  }

  collectCrate(crate, team) {
    if (!crate.alive) return;
    crate.alive = false;
    crate.takenBy = team;
    this.crateCount[team] = (this.crateCount[team] || 0) + 1;
    this.mats[team] = Math.min(150, this.mats[team] + 26);
    this.fx.text(crate.x, crate.y - 34, '+26 MATS', team === 0 ? '#ffe66d' : '#c9a8ff', 16);
    this.fx.puff(crate.x, crate.y - 12, '#ffd166', 10, 60);
    this.fx.buildPop(crate.x, crate.y - 10, '255,210,100');
    this.audio.play('pickup');
    this.showToast(team === 0 ? '+26 MATS SECURED' : 'SYNDICATE LOOTED A CRATE', team === 0 ? 'good' : 'bad', 1400);
    this.ui?.syncMats();
  }

  onWormDeath(worm) {
    if (worm.drowned) {
      this.fx.splash(worm.x, this.waterLevel, 34);
      this.audio.play('splash');
    } else {
      this.fx.explode(worm.x, worm.y - 20, 30, { fire: worm.team === 0 ? '#ffb347' : '#d1a3ff', smoke: '#5a5550', dirt: '#8a6a4a' });
      this.fx.debris(worm.x, worm.y - 25, TEAM_COLORS[worm.team], 18, 280);
      this.audio.play('hurt');
    }
    this.fx.text(worm.x, worm.y - 84, 'K.O.', '#ff4d6d', 24);
    this.fx.shake = Math.min(20, this.fx.shake + 6);
    this.showToast(`${worm.name} IS OUT`, 'bad', 1600);
    this.ui?.syncAll();
  }

  checkWaterDeaths() {
    for (const w of this.worms) {
      if (!w.alive) continue;
      if (w.y > this.waterLevel + 3) {
        w.drowned = true;
        w.hp = 0;
        w.alive = false;
        w.deathTimer = 0;
        this.onWormDeath(w);
      }
    }
  }

  /* ------------------------------------------------------------- worm sim */
  updateWorms(dt) {
    for (const w of this.worms) {
      if (!w.alive) { w.deathTimer = Math.min(3, w.deathTimer + dt); continue; }
      w.hurtFlash = Math.max(0, w.hurtFlash - dt);
      w.recoil = Math.max(0, w.recoil - dt * 4);

      const controlled = this.state === 'aim' && this.activeTeam === 0 && this.activeWorm === w;
      let moving = false;
      if (controlled) {
        const dir = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
        if (dir && w.fuel > 0) {
          w.facing = dir;
          w.walkTime += dt * 1.9;
          w.fuel = Math.max(0, w.fuel - dt);
          this.moveWormX(w, dir * 126 * dt);
          moving = true;
        }
      }
      if (!moving) {
        if (Math.abs(w.vx) > 1.2) {
          this.moveWormX(w, w.vx * dt);
        }
        w.vx *= Math.pow(0.04, dt);
      }

      // Unstick from terrain after an explosion.
      if (this.terrain.solidAt(w.x, w.y - 8)) {
        w.y -= 90 * dt;
        w.vy = Math.min(w.vy, 0);
        continue;
      }

      const prevY = w.y;
      w.vy += 1180 * dt;
      w.y += w.vy * dt;
      if (w.vy > 0) {
        const surface = this.fallSurface(w.x, prevY + 2, w.y + 2);
        if (surface !== null && w.y >= surface) {
          if (w.vy > 410) {
            this.audio.play('land');
            this.fx.puff(w.x, surface, '#c9b28a', 4, 22);
          }
          w.y = surface;
          w.vy = 0;
          w.onGround = true;
        } else {
          w.onGround = false;
        }
      } else {
        w.onGround = false;
      }
      if (w.y > this.waterLevel + 3) {
        w.drowned = true;
        w.hp = 0;
        w.alive = false;
        w.deathTimer = 0;
        this.onWormDeath(w);
      }
    }
  }

  fallSurface(x, fromY, toY) {
    if (toY <= fromY) return null;
    let best = this.terrain.surfaceBetween(x, fromY, toY);
    for (const p of this.pieces) {
      if (p.dead) continue;
      for (const s of p.solids) {
        if (x < s.x - 2 || x > s.x + s.w + 2) continue;
        if (s.y >= fromY - 2 && s.y <= toY + 2) {
          if (best === null || s.y < best) best = s.y;
        }
      }
    }
    return best;
  }

  moveWormX(w, dx) {
    if (!dx) return;
    const nx = clamp(w.x + dx, 16, WORLD.w - 16);
    const surface = this.walkSurface(nx, w.y + STEP);
    if (surface !== null && w.y - surface > STEP) {
      w.vx *= -0.15;
      return;
    }
    const feet = surface ?? w.y;
    for (const yy of [feet - 7, feet - 19, feet - 33]) {
      if (this.terrain.solidAt(nx, yy) || this.pieceAt(nx, yy)) {
        w.vx *= -0.1;
        return;
      }
    }
    w.x = nx;
    if (surface !== null && Math.abs(surface - w.y) <= STEP + 1) w.y = surface;
    if (feet < w.y) w.y = feet;
  }

  /* --------------------------------------------------------------- crates */
  updateCrates(dt) {
    for (const c of this.crates) {
      if (!c.alive) continue;
      c.bob += dt * 2.4;
      const ground = this.terrain.solidAt(c.x, c.y + 12) || this.pieceAt(c.x, c.y + 12);
      if (!ground) {
        c.vy += 900 * dt;
        const prev = c.y;
        c.y += c.vy * dt;
        const surface = this.fallSurface(c.x, prev, c.y);
        if (surface !== null && c.y >= surface) { c.y = surface; c.vy = 0; }
      } else {
        c.vy = 0;
      }
      if (c.y > this.waterLevel + 4) {
        c.alive = false;
        this.fx.splash(c.x, this.waterLevel, 12);
        this.audio.play('splash');
      }
    }
  }

  /* ------------------------------------------------------------ turn state */
  update(dt) {
    if (this.paused) return;
    dt = Math.min(dt, 0.033);
    this.time += dt;
    this.fx.update(dt);
    for (const p of this.pieces) {
      if (p.flash > 0) p.flash = Math.max(0, p.flash - dt);
      p.sinceHit += dt;
    }

    if (this.state === 'demo') {
      this.updateCamera(dt);
      this.ui?.syncTimer?.();
      return;
    }

    if (this.state === 'over') {
      this.updateWorms(dt);
      this.updateCrates(dt);
      this.updateCamera(dt);
      return;
    }

    this.matchTime += dt;
    this.updateWorms(dt);
    this.updateCrates(dt);
    if (this.state === 'firing') this.updateProjectiles(dt);

    if (this.state === 'aim') {
      this.timeLeft -= dt;
      const sec = Math.ceil(this.timeLeft);
      if (sec <= 9 && sec !== this.lastTickSecond && sec > 0) {
        this.lastTickSecond = sec;
        this.audio.play('tick');
      }
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.showToast("TIME'S UP", 'bad', 900);
        if (this.mode === 'build') this.toggleMode('blast');
        this.fireActive();
      }
      if (this.activeWorm && this.activeWorm.fuel <= 0 && (this.keys.left || this.keys.right)) {
        this.keys.left = false; this.keys.right = false;
      }
    }

    if (this.state === 'ai') {
      this.ai.update(dt);
    }

    if (this.state === 'firing') {
      this.firingTimer -= dt;
      if (this.projectiles.length === 0 && this.firingTimer <= 0) {
        this.state = 'settle';
        this.settleTimer = 1.35;
        this.checkWaterDeaths();
      }
    } else if (this.state === 'settle') {
      this.settleTimer -= dt;
      if (this.settleTimer <= 0) {
        this.checkWaterDeaths();
        if (this.checkWin()) return;
        this.advanceTurn();
      }
    }

    this.updateCamera(dt);
    this.ui?.sync();
  }

  advanceTurn() {
    if (this.state === 'over') return;
    if (this.checkWin()) return;
    this.activeTeam = 1 - this.activeTeam;
    let surge = false;
    if (this.activeTeam === 0) {
      this.round++;
      if (this.round >= 3 && this.round % 2 === 1) { this.raiseWater(); surge = true; }
      if (this.state === 'over' || this.checkWin()) return;
      this.checkWaterDeaths();
    }
    this.startTurn(this.activeTeam, false, surge);
  }

  raiseWater() {
    this.waterLevel = Math.max(762, this.waterLevel - 20);
    this.fx.flash = 0.25;
    this.fx.flashColor = '150,80,255';
    this.fx.shake = Math.min(20, this.fx.shake + 5);
    this.audio.play('storm');
    this.showToast('STORM SURGE · THE WATER IS RISING', 'bad', 2200);
    this.ui?.banner('STORM SURGE', 'THE WATER IS RISING', 'Low ground is about to disappear.', '#b06bff', 2300);
    this.checkWaterDeaths();
  }

  checkWin() {
    if (this.state === 'over') return true;
    const a0 = this.aliveCount(0), a1 = this.aliveCount(1);
    if (a0 === 0 && a1 === 0) { this.finishMatch(-1); return true; }
    if (a0 === 0) { this.finishMatch(1); return true; }
    if (a1 === 0) { this.finishMatch(0); return true; }
    return false;
  }

  finishMatch(winner) {
    if (this.state === 'over') return;
    this.winner = winner;
    this.state = 'over';
    this.effectsTimer = 0.5;
    this.ui?.showResult(winner);
    this.ui?.syncAll();
    this.audio.play(winner === 0 ? 'victory' : winner === 1 ? 'defeat' : 'hurt');
    if (winner === 0) {
      for (let i = 0; i < 5; i++) {
        const w = this.activeWorm && this.activeWorm.alive ? this.activeWorm : this.worms.find(w => w.team === 0 && w.alive);
        if (w) this.fx.text(w.x + rand(60, -60), w.y - 70 - i * 12, ['VICTORY!', 'GG!', 'ROYALE!'][i % 3], ['#ffe66d', '#ff9f1c', '#7ee081'][i % 3], 26);
      }
    }
  }

  endTurn() {
    if (this.state !== 'aim' || this.activeTeam !== 0) return;
    this.aiming = false;
    this.painting = false;
    this.state = 'between';
    this.showToast('TURN PASSED', '', 900);
    this.audio.play('ui');
    this.advanceTurn();
  }

  showToast(text, type = '', duration = 1500) {
    this.ui?.toast(text, type, duration);
  }

  /* -------------------------------------------------------- debug helpers */
  debugBuild(gx, gy, type = 'wall', material = 'wood') {
    return this.tryPlace(gx, gy, { team: 0, type, material, dir: 1, skipSupport: true });
  }

  debugHit(gx, gy) {
    this.explode(gx * GRID + 24, gy * GRID + 24, 60, 54, 1, null);
  }
}

export { WEAPONS, WEAPON_ORDER, BUILD_ORDER, MATERIALS };
