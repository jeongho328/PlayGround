import { TEAM_COLORS, clamp } from './core.js';
import { WEAPONS, WEAPON_ORDER, BUILD_ORDER, MATERIALS as MATS } from './game.js';

const ICONS = {
  bazooka: `<svg viewBox="0 0 44 30"><path d="M4 12h27v7H4z" fill="#6f8a61"/><path d="M7 13h20v2H7z" fill="#a4bd90"/><path d="M31 10h6v11h-6z" fill="#38452f"/><path d="M37 12h5v7h-5z" fill="#ff9f1c"/><path d="M9 19h9v4H9z" fill="#4b5b40"/><circle cx="10" cy="15" r="2" fill="#dce8d1"/></svg>`,
  grenade: `<svg viewBox="0 0 44 30"><circle cx="20" cy="18" r="9" fill="#4d6b3e"/><path d="M12 18h16M20 9v18M15 12l10 12M25 12 15 24" stroke="#2d4227" stroke-width="1.3"/><rect x="17" y="5" width="6" height="4" rx="1" fill="#a9b891"/><path d="M23 6c4-4 8-2 8 2" fill="none" stroke="#c9d1d8" stroke-width="1.7"/><path d="M17 4h5v2h-5z" fill="#ffd166"/></svg>`,
  shotgun: `<svg viewBox="0 0 44 30"><path d="M2 15h14v7H2z" fill="#7a4c24"/><path d="M6 16h9v3H6z" fill="#a96c35"/><path d="M15 13h24v6H15z" fill="#5c6670"/><path d="M17 14h20v2H17z" fill="#9aa7b3"/><path d="M38 11h4v10h-4z" fill="#37424c"/><path d="M15 19h11v3H15z" fill="#7a4c24"/></svg>`,
  wall: `<svg viewBox="0 0 44 32"><path d="M9 3h26v26H9z" fill="#8a5428"/><path d="M12 6h20v20H12z" fill="#bd7c3d"/><path d="M12 6l20 20M32 6 12 26" stroke="#6b3c1a" stroke-width="1.6" opacity=".65"/><path d="M12 6h20v3H12z" fill="#e0a05e"/></svg>`,
  floor: `<svg viewBox="0 0 44 32"><path d="M4 8h36v5H4z" fill="#bd7c3d"/><path d="M4 8h36v2H4z" fill="#e0a05e"/><path d="M7 13v3l7 6v-4l7-5v3l8-6v4l8-7" fill="none" stroke="#6b3c1a" stroke-width="2.4"/></svg>`,
  ramp: `<svg viewBox="0 0 44 32"><path d="M4 30V17L40 5v25z" fill="#8a5428"/><path d="M7 28V19L36 9v19z" fill="#bd7c3d"/><path d="M8 27 36 10M8 22l28-9M8 17l28-7" stroke="#6b3c1a" stroke-width="1.4" opacity=".6"/><path d="M4 17 40 5v3L4 20z" fill="#e0a05e"/></svg>`,
  rocket: `<svg viewBox="0 0 24 24"><path d="M3 12 14 5v14L3 12Z" fill="currentColor"/><path d="M15 8h4v8h-4z" fill="currentColor" opacity=".55"/><path d="M19 10h3v4h-3z" fill="currentColor"/></svg>`,
  build: `<svg viewBox="0 0 24 24"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4z" fill="currentColor"/><path d="M13 13h7v7h-7z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2 2"/></svg>`,
  worm: `<svg viewBox="0 0 44 44"><path d="M22 4c8 0 12 5 10 10l-3 8c-2 6-6 11-7 16h-7c1-7-1-12-4-17C8 15 8 8 14 5c2-1 5-1 8-1Z" fill="currentColor"/><circle cx="17" cy="13" r="3.2" fill="#10162b"/><circle cx="26" cy="13" r="3.2" fill="#10162b"/><circle cx="18" cy="12.2" r="1" fill="#fff"/><circle cx="27" cy="12.2" r="1" fill="#fff"/><path d="M14 5h17l-2-3H16l-2 3Z" fill="#ffe66d"/></svg>`
};

export class UI {
  constructor(game, audio) {
    this.game = game;
    this.audio = audio;
    this.el = {};
    this.cache = {};
    this.bannerTimer = null;
    this.toastTimer = null;
    this.resultTimer = null;
    this.bindEls();
    this.buildBars();
    this.buildResult();
    this.bindEvents();
    this.syncAll();
    this.game.setUI(this);
    this.measure();
  }

  bindEls() {
    const ids = [
      'app', 'game', 'teamACard', 'teamBCard', 'teamAHP', 'teamBHP', 'teamAWorms', 'teamBWorms',
      'roundLabel', 'timerRing', 'timerArc', 'timerText', 'windPill', 'windArrow', 'windText',
      'banner', 'bannerKicker', 'bannerTitle', 'bannerSub', 'toast', 'aimHint', 'soundBtn', 'helpBtn',
      'controls', 'profilePortrait', 'activeName', 'activeHP', 'activeHPBar', 'activeFuelBar',
      'matCount', 'weaponBar', 'buildBar', 'hotbarTip', 'modeBtn', 'modeIcon', 'modeLabel',
      'endBtn', 'btnLeft', 'btnRight', 'btnJump', 'startScreen', 'startBtn', 'howBtn',
      'helpScreen', 'helpClose', 'resultScreen', 'touchMove'
    ];
    for (const id of ids) this.el[id] = document.getElementById(id);
    this.el.app = document.getElementById('app');
    this.el.weaponCards = [];
    this.el.buildCards = [];
    this.el.chips = [];
  }

  buildBars() {
    this.el.weaponBar.innerHTML = WEAPON_ORDER.map((id, i) => `
      <button class="weapon-card" data-weapon="${id}" aria-label="Select ${WEAPONS[id].name}">
        <span class="wc-key">${i + 1}</span>
        <span class="wc-icon">${ICONS[id]}</span>
        <span class="wc-name">${WEAPONS[id].name}</span>
        <span class="wc-ammo">∞</span>
      </button>`).join('');

    this.el.buildBar.innerHTML = BUILD_ORDER.map((type, i) => `
      <button class="weapon-card building" data-build="${type}" aria-label="Build ${type}">
        <span class="wc-key">${i + 1}</span>
        <span class="wc-icon">${ICONS[type]}</span>
        <span class="wc-name">${type.toUpperCase()}</span>
        <span class="cost" data-cost="${type}">8</span>
      </button>`).join('') + `
      <button class="mat-chip mat-cycle" id="matCycle" aria-label="Cycle material"><i></i><span>WOOD</span></button>
      <button class="mat-chip" id="rotateBtn" aria-label="Rotate ramp"><span>R</span><span>ROTATE</span></button>`;

    this.el.weaponCards = [...this.el.weaponBar.querySelectorAll('[data-weapon]')];
    this.el.buildCards = [...this.el.buildBar.querySelectorAll('[data-build]')];
    this.el.chips = [...this.el.buildBar.querySelectorAll('[data-mat]')];
  }

  buildResult() {
    const div = document.createElement('div');
    div.id = 'resultScreen';
    div.className = 'overlay result-screen hidden';
    div.innerHTML = `
      <div class="result-card">
        <div class="result-kicker" id="resultKicker">MATCH COMPLETE</div>
        <h2 class="result-title" id="resultTitle">VICTORY</h2>
        <p class="result-sub" id="resultSub">The Syndicate has been swept away.</p>
        <div class="result-stats" id="resultStats"></div>
        <div class="result-actions">
          <button class="start-btn result-btn" id="rematchBtn"><span>PLAY AGAIN</span><i>▶</i></button>
          <button class="how-btn" id="resultHelp">HOW TO PLAY</button>
        </div>
        <div class="result-foot">BUILD &amp; BLAST · TURN-BASED ARTILLERY ROYALE</div>
      </div>`;
    this.el.app.appendChild(div);
    this.el.resultScreen = div;
    this.el.resultTitle = div.querySelector('#resultTitle');
    this.el.resultKicker = div.querySelector('#resultKicker');
    this.el.resultSub = div.querySelector('#resultSub');
    this.el.resultStats = div.querySelector('#resultStats');
    this.el.rematchBtn = div.querySelector('#rematchBtn');
    this.el.resultHelp = div.querySelector('#resultHelp');
  }

  bindEvents() {
    const g = this.game;
    this.el.startBtn.addEventListener('click', () => {
      this.audio.unlock();
      this.audio.play('click');
      this.startMatch();
    });
    this.el.howBtn.addEventListener('click', () => this.openHelp());
    this.el.helpClose.addEventListener('click', () => this.closeHelp());
    this.el.resultHelp.addEventListener('click', () => this.openHelp());
    this.el.rematchBtn.addEventListener('click', () => {
      this.audio.unlock();
      this.audio.play('click');
      this.el.resultScreen.classList.add('hidden');
      g.startMatch(Math.floor(Math.random() * 1e9) + 1);
      this.showAimHint();
      this.syncAll();
    });
    this.el.soundBtn.addEventListener('click', () => {
      this.audio.unlock();
      this.audio.setMuted(!this.audio.muted);
      this.el.soundBtn.classList.toggle('muted', this.audio.muted);
      this.audio.play('ui');
    });
    this.el.helpBtn.addEventListener('click', () => this.openHelp());

    this.el.modeBtn.addEventListener('click', () => {
      this.audio.unlock();
      this.audio.play('click');
      g.toggleMode();
    });
    this.el.endBtn.addEventListener('click', () => {
      this.audio.play('click');
      g.endTurn();
    });
    for (const card of this.el.weaponCards) {
      card.addEventListener('click', () => {
        this.audio.unlock();
        g.selectWeapon(card.dataset.weapon);
      });
    }
    for (const card of this.el.buildCards) {
      card.addEventListener('click', () => g.selectBuild(card.dataset.build));
    }
    this.el.buildBar.querySelector('#matCycle').addEventListener('click', () => g.cycleMaterial());
    this.el.buildBar.querySelector('#rotateBtn').addEventListener('click', () => g.rotateRamp());
    for (const chip of this.el.chips) {
      chip.addEventListener('click', () => {
        g.material = chip.dataset.mat;
        g.audio.play('ui');
        this.syncWeapon();
        g.updateBuildGhost(g.pointer.x, g.pointer.y);
      });
    }

    const hold = (el, dir) => {
      const on = e => { e.preventDefault(); g.setKey(dir, true); el.classList.add('held'); };
      const off = e => { e.preventDefault(); g.setKey(dir, false); el.classList.remove('held'); };
      el.addEventListener('pointerdown', on);
      el.addEventListener('pointerup', off);
      el.addEventListener('pointerleave', off);
      el.addEventListener('pointercancel', off);
    };
    hold(this.el.btnLeft, 'left');
    hold(this.el.btnRight, 'right');
    this.el.btnJump.addEventListener('pointerdown', e => { e.preventDefault(); g.jump(); this.el.btnJump.classList.add('held'); });
    const jumpOff = () => this.el.btnJump.classList.remove('held');
    this.el.btnJump.addEventListener('pointerup', jumpOff);
    this.el.btnJump.addEventListener('pointerleave', jumpOff);
  }

  startMatch() {
    this.el.startScreen.classList.add('hidden');
    this.el.app.classList.add('playing');
    this.showAimHint();
    this.game.startMatch(20261031);
    this.syncAll();
    this.measure();
  }

  setPlaying() {
    this.el.app.classList.add('playing');
  }

  hideStart() {
    this.el.startScreen.classList.add('hidden');
  }

  showAimHint() {
    this.el.aimHint.classList.remove('hide');
    clearTimeout(this._hintTimer);
    this._hintTimer = setTimeout(() => this.el.aimHint.classList.add('hide'), 9000);
  }

  hideAimHint() {
    this.el.aimHint.classList.add('hide');
  }

  openHelp() {
    this.el.helpScreen.classList.remove('hidden');
    this.game.paused = true;
  }

  closeHelp() {
    this.el.helpScreen.classList.add('hidden');
    this.game.paused = false;
  }

  banner(kicker, title, sub, color = '#ff9f1c', duration = 2200) {
    this.el.bannerKicker.textContent = kicker;
    this.el.bannerTitle.textContent = title;
    this.el.bannerSub.textContent = sub;
    this.el.banner.style.setProperty('--banner-color', color);
    this.el.banner.classList.add('show');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => this.el.banner.classList.remove('show'), duration);
  }

  toast(text, type = '', duration = 1500) {
    this.el.toast.textContent = text;
    this.el.toast.className = 'toast show ' + (type || '');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.el.toast.classList.remove('show'), duration);
  }

  setMode(mode) {
    const build = mode === 'build';
    this.el.weaponBar.hidden = build;
    this.el.buildBar.hidden = !build;
    this.el.modeBtn.classList.toggle('build-active', build);
    this.el.modeLabel.textContent = build ? 'BLAST' : 'BUILD';
    this.el.modeIcon.innerHTML = build ? ICONS.rocket : ICONS.build;
    this.el.hotbarTip.textContent = build
      ? 'TAP GRID TO BUILD · 1–3 PIECE · 4 MATERIAL · R ROTATE'
      : '1–3 SELECT · DRAG TO AIM · RELEASE TO FIRE';
    this.syncWeapon();
  }

  syncWeapon() {
    const g = this.game;
    for (const card of this.el.weaponCards) card.classList.toggle('active', card.dataset.weapon === g.weapon);
    for (const card of this.el.buildCards) card.classList.toggle('active', card.dataset.build === g.buildType);
    for (const chip of this.el.chips) chip.classList.toggle('active', chip.dataset.mat === g.material);
    const mat = MATS[g.material];
    const cycle = this.el.buildBar.querySelector('#matCycle');
    if (cycle) {
      cycle.querySelector('i').style.setProperty('--mat-color', mat.base);
      cycle.querySelector('span').textContent = mat.label;
    }
    for (const card of this.el.buildCards) {
      const cost = g.buildCost(card.dataset.build, g.material);
      const c = card.querySelector('.cost');
      if (c) c.textContent = cost;
    }
    this.el.matCount.textContent = Math.floor(g.mats[0]);
  }

  syncMats() {
    this.el.matCount.textContent = Math.floor(this.game.mats[0]);
    this.syncWeapon();
  }

  syncAll() {
    this.cache = {};
    this.buildTeamChips();
    this.syncWeapon();
    this.sync();
  }

  buildTeamChips() {
    const g = this.game;
    for (const team of [0, 1]) {
      const container = team === 0 ? this.el.teamAWorms : this.el.teamBWorms;
      const worms = g.worms.filter(w => w.team === team).sort((a, b) => a.slot - b.slot);
      if (container.dataset.built !== String(g.seed)) {
        container.innerHTML = worms.map(w => `
          <div class="worm-chip" data-worm="${w.team}-${w.slot}">
            <div class="chip-name"><span>${w.name}</span><span data-chip-hp="${w.team}-${w.slot}">100</span></div>
            <div class="bar"><i data-chip-bar="${w.team}-${w.slot}"></i></div>
          </div>`).join('');
        container.dataset.built = String(g.seed);
      }
      for (const w of worms) {
        const chip = container.querySelector(`[data-worm="${w.team}-${w.slot}"]`);
        if (!chip) continue;
        chip.classList.toggle('dead', !w.alive);
        const hp = chip.querySelector(`[data-chip-hp="${w.team}-${w.slot}"]`);
        const bar = chip.querySelector(`[data-chip-bar="${w.team}-${w.slot}"]`);
        if (hp) hp.textContent = w.alive ? Math.ceil(w.hp) : 'KO';
        if (bar) bar.style.width = Math.max(0, w.hp) + '%';
      }
    }
  }

  sync() {
    const g = this.game;
    const c = this.cache;
    const active = g.activeWorm;

    const a0 = g.worms.filter(w => w.team === 0).reduce((s, w) => s + Math.max(0, w.hp), 0);
    const a1 = g.worms.filter(w => w.team === 1).reduce((s, w) => s + Math.max(0, w.hp), 0);
    if (c.a0 !== a0) { this.el.teamAHP.textContent = Math.ceil(a0); c.a0 = a0; }
    if (c.a1 !== a1) { this.el.teamBHP.textContent = Math.ceil(a1); c.a1 = a1; }

    const time = Math.max(0, Math.ceil(g.timeLeft));
    if (c.time !== time) {
      this.el.timerText.textContent = time;
      this.el.timerRing.classList.toggle('warn', time <= 10 && g.state === 'aim' && g.activeTeam === 0);
      c.time = time;
    }
    const frac = clamp(g.timeLeft / 60, 0, 1);
    const off = (144.51 * (1 - frac)).toFixed(1);
    if (c.arc !== off) { this.el.timerArc.style.strokeDashoffset = off; c.arc = off; }

    const wind = Math.round(g.windDisplay);
    if (c.wind !== wind) {
      this.el.windText.textContent = Math.abs(wind);
      this.el.windArrow.textContent = wind < 0 ? '←' : wind > 0 ? '→' : '·';
      this.el.windArrow.style.color = Math.abs(wind) > 16 ? '#ff9f1c' : '#38bdf8';
      c.wind = wind;
    }
    if (c.round !== g.round) { this.el.roundLabel.textContent = 'ROUND ' + g.round; c.round = g.round; }

    this.el.teamACard.classList.toggle('active', g.activeTeam === 0);
    this.el.teamBCard.classList.toggle('active', g.activeTeam === 1);

    if (active) {
      if (c.name !== active.name) {
        this.el.activeName.textContent = active.name;
        this.el.profilePortrait.style.color = TEAM_COLORS[active.team];
        this.el.profilePortrait.innerHTML = ICONS.worm;
        c.name = active.name;
      }
      const hp = Math.ceil(active.hp);
      if (c.hp !== hp) { this.el.activeHP.textContent = hp; c.hp = hp; }
      const hw = clamp(active.hp / active.maxHp, 0, 1) * 100;
      if (c.hw !== hw) { this.el.activeHPBar.style.width = hw + '%'; c.hw = hw; }
      const fw = clamp(active.fuel / active.maxFuel, 0, 1) * 100;
      if (c.fw !== fw) { this.el.activeFuelBar.style.width = fw + '%'; c.fw = fw; }
    }
    const mats = Math.floor(g.mats[0]);
    if (c.mats !== mats) { this.el.matCount.textContent = mats; c.mats = mats; }

    const canAct = g.state === 'aim' && g.activeTeam === 0;
    if (c.canAct !== canAct) {
      this.el.endBtn.disabled = !canAct;
      this.el.modeBtn.disabled = !canAct;
      c.canAct = canAct;
    }
    this.buildTeamChips();
    this.syncWeapon();
  }

  showResult(winner) {
    const g = this.game;
    clearTimeout(this.resultTimer);
    const title = winner === 0 ? 'VICTORY ROYALE' : winner === 1 ? 'DEFEATED' : 'DRAW';
    const sub = winner === 0
      ? 'The Syndicate has been swept away. The fort holds.'
      : winner === 1
        ? 'Your squad got out-built and out-gunned.'
        : 'Two squads. One crater. Nobody wins.';
    const kicker = `MATCH COMPLETE · ROUND ${g.round}`;
    this.el.resultTitle.textContent = title;
    this.el.resultSub.textContent = sub;
    this.el.resultKicker.textContent = kicker;
    this.el.resultScreen.classList.toggle('victory', winner === 0);
    this.el.resultScreen.classList.toggle('defeat', winner === 1);

    const pWorms = g.worms.filter(w => w.team === 0);
    const shots = g.worms.reduce((s, w) => s + w.shots, 0);
    const enemyDamage = g.worms.filter(w => w.team === 1).reduce((s, w) => s + w.damageTaken, 0);
    const builds = g.buildCount ? g.buildCount[0] : g.pieces.filter(p => p.team === 0).length;
    const crates = g.crateCount ? g.crateCount[0] : 0;
    this.el.resultStats.innerHTML = `
      <div><b>${pWorms.filter(w => w.alive).length}/2</b><span>WORMS LEFT</span></div>
      <div><b>${shots}</b><span>SHOTS FIRED</span></div>
      <div><b>${Math.round(enemyDamage)}</b><span>DAMAGE DEALT</span></div>
      <div><b>${builds}</b><span>STRUCTURES</span></div>
      <div><b>${crates}</b><span>CRATES LOOTED</span></div>`;
    this.resultTimer = setTimeout(() => {
      this.el.resultScreen.classList.remove('hidden');
    }, 1000);
  }

  measure() {
    const h = this.el.controls?.getBoundingClientRect().height || 148;
    document.documentElement.style.setProperty('--controls-h', Math.round(h) + 'px');
    const header = document.querySelector('.hud');
    if (header) document.documentElement.style.setProperty('--header-h', Math.round(header.getBoundingClientRect().height) + 'px');
  }

  isHelpOpen() {
    return !this.el.helpScreen.classList.contains('hidden');
  }

  closeResult() {
    this.el.resultScreen.classList.add('hidden');
  }
}
