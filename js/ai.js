import { GRID, WORLD, clamp, rand, dist2 } from './core.js';

export class AI {
  constructor(game) {
    this.game = game;
    this.phase = 'idle';
    this.timer = 0;
    this.plan = null;
    this.shotFired = false;
    this.builtThisTurn = 0;
  }

  begin() {
    this.phase = 'think';
    this.timer = 0.9 + rand(0.5);
    this.plan = null;
    this.shotFired = false;
    this.builtThisTurn = 0;
  }

  update(dt) {
    const g = this.game;
    if (g.state !== 'ai' || !g.activeWorm?.alive) return;
    this.timer -= dt;

    if (this.phase === 'think') {
      if (this.timer > 0) return;
      const me = g.activeWorm;
      const target = g.nearestEnemy(me);
      if (!target) return;
      this.doBuild(me, target);
      this.plan = this.findPlan(me, target);
      this.phase = 'aim';
      this.timer = 0.65;
      if (this.plan) {
        g.aimAngle = this.plan.angle;
        g.aimPower = this.plan.power;
        g.weapon = this.plan.weapon;
        g.ui?.syncWeapon();
      }
      return;
    }

    if (this.phase === 'aim') {
      if (this.timer > 0) return;
      if (!this.plan) this.plan = this.findPlan(g.activeWorm, g.nearestEnemy(g.activeWorm));
      if (!this.plan) {
        g.state = 'between';
        g.advanceTurn();
        return;
      }
      g.aiFire(this.plan);
      this.phase = 'done';
    }
  }

  doBuild(me, target) {
    const g = this.game;
    if (g.mats[1] < 14) return;
    const dist = Math.abs(target.x - me.x);
    const dangerous = me.hp < 62 || dist < 520;
    if (Math.random() > (dangerous ? 0.72 : 0.34)) return;

    const facing = target.x >= me.x ? 1 : -1;
    const x = me.x + facing * (GRID * 1.45);
    const gx = Math.floor(x / GRID);
    const gy = Math.floor((me.y - 6) / GRID);
    const material = g.mats[1] > 52 && Math.random() < 0.3 ? 'brick' : 'wood';

    let placed = 0;
    if (g.tryPlace(gx, gy, { team: 1, material, type: 'wall', dir: facing, silent: true })) placed++;
    if (placed && g.mats[1] > 24 && Math.random() < 0.46) {
      if (g.tryPlace(gx, gy - 1, { team: 1, material, type: 'wall', dir: facing, silent: true })) placed++;
    }
    if (!placed) {
      // Try a floor under the worm to escape rising water.
      const fy = Math.floor(me.y / GRID) - 1;
      g.tryPlace(Math.floor(me.x / GRID), fy, { team: 1, material: 'wood', type: 'floor', silent: true });
    }
    this.builtThisTurn = placed;
    if (placed) g.showToast(material === 'brick' ? 'SYNDICATE THREW UP BRICK' : 'SYNDICATE THREW UP WOOD', '', 900);
  }

  findPlan(me, target) {
    if (!target) return null;
    const g = this.game;
    const tx = target.x, ty = target.y - 30;
    const dist = Math.abs(target.x - me.x);
    const clear = g.lineOfSight(me.muzzle(), target.center());

    // Pump shotgun for close, unobstructed targets.
    if (dist < 470 && clear && Math.random() < 0.32) {
      const head = target.center();
      const muzzle = me.muzzle();
      const angle = Math.atan2(head.y - muzzle.y, head.x - muzzle.x);
      return {
        weapon: 'shotgun',
        angle: angle + rand(0.035, -0.035),
        power: 1,
        expected: 18
      };
    }

    let best = null;
    const targetPos = { x: tx, y: ty };
    for (let deg = -176; deg <= -4; deg += 2.4) {
      const angle = deg * Math.PI / 180;
      for (let power = 0.28; power <= 1.001; power += 0.045) {
        const hit = g.simulateShot(me, angle, power, 'bazooka');
        if (!hit) continue;
        const d = Math.sqrt(dist2(hit.x, hit.y, tx, ty));
        let score = d;
        if (hit.water) score += 55;
        const selfD = Math.sqrt(dist2(hit.x, hit.y, me.x, me.y - 30));
        if (selfD < 110) score += (110 - selfD) * 7;
        // Prefer shots that land on the enemy's side and in front of their cover.
        if (Math.abs(hit.x - tx) > 160) score += 24;
        if (!best || score < best.score) best = { angle, power, score, hit };
      }
    }
    if (!best) return null;

    // Difficulty-flavoured aim error.
    const errA = rand(0.035, -0.035) * (0.6 + Math.random());
    const errP = rand(0.028, -0.028);
    return {
      weapon: 'bazooka',
      angle: clamp(best.angle + errA, -Math.PI + 0.06, -0.04),
      power: clamp(best.power + errP, 0.25, 1),
      expected: Math.sqrt(dist2(best.hit.x, best.hit.y, tx, ty)),
      score: best.score
    };
  }
}
