import { TAU, clamp } from './core.js';

export class Worm {
  constructor({ team, slot, name, x, y }) {
    this.team = team;
    this.slot = slot;
    this.name = name;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.hp = 100;
    this.maxHp = 100;
    this.alive = true;
    this.onGround = true;
    this.facing = team === 0 ? 1 : -1;
    this.fuel = 7.5;
    this.maxFuel = 7.5;
    this.jumps = 4;
    this.aimAngle = team === 0 ? -0.7 : -Math.PI + 0.7;
    this.aimPower = 0.75;
    this.hurtFlash = 0;
    this.recoil = 0;
    this.walkTime = 0;
    this.idleOffset = Math.random() * TAU;
    this.deathTimer = 0;
    this.damageTaken = 0;
    this.shots = 0;
    this.kills = 0;
    this.drowned = false;
  }

  get cx() { return this.x; }
  get cy() { return this.y - 30; }
  get top() { return this.y - 58; }

  center() { return { x: this.x, y: this.y - 30 }; }

  head() {
    return { x: this.x + this.facing * 2, y: this.y - 46 };
  }

  muzzle(angle = this.aimAngle) {
    return {
      x: this.x + Math.cos(angle) * 26 + this.facing * 4,
      y: this.y - 31 + Math.sin(angle) * 26
    };
  }

  resetTurn() {
    this.fuel = this.maxFuel;
    this.jumps = 4;
    this.vx = 0;
    this.vy = 0;
  }

  hurt(amount, game) {
    if (!this.alive) return;
    amount = Math.round(amount);
    this.hp = clamp(this.hp - amount, 0, this.maxHp);
    this.damageTaken += amount;
    this.hurtFlash = 0.45;
    if (this.hp <= 0) {
      this.alive = false;
      this.deathTimer = 0;
      game.onWormDeath(this);
    }
  }

  heal(amount) {
    this.hp = clamp(this.hp + amount, 0, this.maxHp);
  }
}
