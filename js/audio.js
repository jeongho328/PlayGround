export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.noise = null;
    this.ambient = null;
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      const len = Math.floor(this.ctx.sampleRate * 1.5);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.03);
  }

  tone(freq, dur, opts = {}) {
    if (!this.ctx || this.muted) return;
    const { type = 'sine', gain = 0.14, slide = 0, delay = 0, attack = 0.005 } = opts;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  burst(dur, opts = {}) {
    if (!this.ctx || this.muted || !this.noise) return;
    const { gain = 0.2, freq = 900, q = 0.8, type = 'lowpass', slide = 0, delay = 0 } = opts;
    const t = this.ctx.currentTime + delay;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise;
    s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = this.ctx.createBiquadFilter();
    f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (slide) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t); s.stop(t + dur + 0.03);
  }

  play(name, opts = {}) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'click':
        this.tone(660, 0.06, { type: 'square', gain: 0.05, slide: 220 });
        break;
      case 'tick':
        this.tone(980, 0.03, { type: 'triangle', gain: 0.03 });
        break;
      case 'build':
        this.burst(0.12, { gain: 0.16, freq: 500, type: 'bandpass', q: 1.4, slide: 0.5 });
        this.tone(150 + Math.random() * 60, 0.1, { type: 'triangle', gain: 0.09, slide: -40 });
        break;
      case 'buildBreak':
        this.burst(0.28, { gain: 0.22, freq: 1400, type: 'bandpass', q: 0.7, slide: 0.2 });
        this.tone(90, 0.2, { type: 'square', gain: 0.06, slide: -35 });
        break;
      case 'shoot':
        this.burst(0.22, { gain: 0.18, freq: 1800, type: 'bandpass', q: 0.8, slide: 0.15 });
        this.tone(140, 0.18, { type: 'sawtooth', gain: 0.1, slide: -90 });
        break;
      case 'shotgun':
        this.burst(0.3, { gain: 0.28, freq: 2200, type: 'lowpass', slide: 0.12 });
        this.tone(75, 0.24, { type: 'square', gain: 0.14, slide: -35 });
        break;
      case 'throw':
        this.burst(0.2, { gain: 0.08, freq: 900, type: 'bandpass', q: 1.2, slide: 1.8 });
        break;
      case 'explode':
        this.burst(0.9, { gain: 0.42, freq: 900, type: 'lowpass', slide: 0.08 });
        this.tone(64, 0.7, { type: 'sine', gain: 0.34, slide: -36 });
        this.tone(110, 0.3, { type: 'triangle', gain: 0.14, slide: -60 });
        break;
      case 'hurt':
        this.tone(190, 0.22, { type: 'sawtooth', gain: 0.12, slide: -90 });
        this.burst(0.12, { gain: 0.1, freq: 700, type: 'bandpass' });
        break;
      case 'jump':
        this.tone(280, 0.13, { type: 'sine', gain: 0.07, slide: 260 });
        break;
      case 'land':
        this.burst(0.08, { gain: 0.07, freq: 300, type: 'lowpass' });
        break;
      case 'splash':
        this.burst(0.5, { gain: 0.22, freq: 1200, type: 'lowpass', slide: 0.25 });
        this.tone(180, 0.3, { type: 'sine', gain: 0.08, slide: -110 });
        break;
      case 'pickup':
        this.tone(660, 0.1, { type: 'triangle', gain: 0.09 });
        this.tone(880, 0.1, { type: 'triangle', gain: 0.08, delay: 0.07 });
        this.tone(1320, 0.16, { type: 'triangle', gain: 0.07, delay: 0.14 });
        break;
      case 'denied':
        this.tone(170, 0.08, { type: 'square', gain: 0.05 });
        this.tone(130, 0.1, { type: 'square', gain: 0.04, delay: 0.08 });
        break;
      case 'turn':
        this.tone(392, 0.12, { type: 'triangle', gain: 0.06 });
        this.tone(523, 0.16, { type: 'triangle', gain: 0.05, delay: 0.1 });
        break;
      case 'victory':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.5, { type: 'triangle', gain: 0.09, delay: i * 0.13 }));
        break;
      case 'defeat':
        [330, 294, 247, 196].forEach((f, i) => this.tone(f, 0.55, { type: 'sawtooth', gain: 0.05, delay: i * 0.16 }));
        break;
      case 'storm':
        this.tone(110, 1.2, { type: 'sawtooth', gain: 0.04, slide: 40 });
        this.burst(1.2, { gain: 0.08, freq: 400, type: 'lowpass', slide: 1.6 });
        break;
      case 'ui':
        this.tone(440 + Math.random() * 80, 0.045, { type: 'square', gain: 0.03 });
        break;
      default:
        break;
    }
  }
}
