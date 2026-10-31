import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';
import { AudioEngine } from './audio.js';
import { DEFAULT_SEED } from './core.js';

const canvas = document.getElementById('game');
const audio = new AudioEngine();
const game = new Game(canvas, audio);
const renderer = new Renderer(game);
const ui = new UI(game, audio);

let pointerId = null;

function resize() {
  game.resize(window.innerWidth, window.innerHeight);
  ui.measure();
}

window.addEventListener('resize', () => {
  resize();
});
window.addEventListener('orientationchange', () => setTimeout(resize, 120));
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resize);
}
if ('ResizeObserver' in window) {
  const ro = new ResizeObserver(() => ui.measure());
  ro.observe(document.getElementById('controls'));
}
document.fonts?.ready.then(() => ui.measure());

canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (pointerId !== null) return;
  e.preventDefault();
  pointerId = e.pointerId;
  try { canvas.setPointerCapture(e.pointerId); } catch {}
  audio.unlock();
  game.pointerDown(e.clientX, e.clientY);
});
canvas.addEventListener('pointermove', e => {
  if (pointerId !== null && e.pointerId !== pointerId) return;
  game.pointerMove(e.clientX, e.clientY, pointerId !== null);
});
const release = e => {
  if (pointerId !== e.pointerId) return;
  pointerId = null;
  game.pointerUp();
};
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', e => {
  if (pointerId !== e.pointerId) return;
  pointerId = null;
  game.pointerCancel();
});
canvas.addEventListener('pointerleave', e => {
  if (pointerId === null) game.pointerMove(-9999, -9999, false);
});

window.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  if (key === 'escape') {
    if (ui.isHelpOpen()) { ui.closeHelp(); e.preventDefault(); return; }
  }
  if (ui.isHelpOpen() || !document.getElementById('app').classList.contains('playing')) return;

  if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(key)) e.preventDefault();

  if (key === 'a' || key === 'arrowleft') { game.setKey('left', true); }
  else if (key === 'd' || key === 'arrowright') { game.setKey('right', true); }
  else if (key === 'w' || key === ' ' || key === 'arrowup') {
    if (!e.repeat) game.jump();
  } else if (!e.repeat) {
    if (key === 'b') game.toggleMode();
    else if (key === '1' || key === '2' || key === '3') {
      const i = Number(key) - 1;
      if (game.mode === 'build') game.selectBuild(['wall', 'floor', 'ramp'][i]);
      else game.selectWeapon(['bazooka', 'grenade', 'shotgun'][i]);
    } else if (key === '4') game.cycleMaterial();
    else if (key === 'r') game.rotateRamp();
    else if (key === 'enter') game.endTurn();
    else if (key === 'h' || key === '?') ui.openHelp();
  }
});

window.addEventListener('keyup', e => {
  const key = e.key.toLowerCase();
  if (key === 'a' || key === 'arrowleft') game.setKey('left', false);
  if (key === 'd' || key === 'arrowright') game.setKey('right', false);
});

window.addEventListener('blur', () => {
  game.setKey('left', false);
  game.setKey('right', false);
  pointerId = null;
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game.setKey('left', false);
    game.setKey('right', false);
  }
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  game.update(dt);
  renderer.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Small, explicit debug surface used by automated smoke tests and curious tinkerers.
window.__buildBlast = {
  game,
  renderer,
  ui,
  audio,
  start: () => ui.startMatch(),
  place: (gx, gy, type = 'wall', material = 'wood') => game.debugBuild(gx, gy, type, material),
  hit: (gx, gy) => game.debugHit(gx, gy),
  fire: () => game.fireActive(),
  endTurn: () => game.endTurn(),
  defaultSeed: DEFAULT_SEED,
  get state() {
    return {
      state: game.state,
      round: game.round,
      activeTeam: game.activeTeam,
      active: game.activeWorm ? { name: game.activeWorm.name, x: game.activeWorm.x, y: game.activeWorm.y, hp: game.activeWorm.hp } : null,
      mats: [...game.mats],
      pieces: game.pieces.length,
      projectiles: game.projectiles.length,
      water: game.waterLevel
    };
  }
};

resize();
