type SoundName = 'click' | 'correct' | 'wrong' | 'coin' | 'success' | 'levelup' | 'build' | 'hint' | 'star' | 'beat' | 'phone'

class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private musicGain: GainNode | null = null
  private musicTimer: number | null = null
  private step = 0
  private started = false
  private soundEnabled = true
  private musicEnabled = true

  private ensure() {
    if (this.ctx) return this.ctx
    const Context = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Context) return null
    this.ctx = new Context()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.42
    this.master.connect(this.ctx.destination)
    this.musicGain = this.ctx.createGain()
    this.musicGain.gain.value = 0.18
    this.musicGain.connect(this.master)
    return this.ctx
  }

  configure(sound: boolean, music: boolean) {
    this.soundEnabled = sound
    this.musicEnabled = music
    if (!sound || !music) this.stopMusic()
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume()
    if (this.started && sound && music) this.startMusic()
  }

  unlock() {
    const ctx = this.ensure()
    if (!ctx) return
    if (ctx.state === 'suspended') void ctx.resume()
    this.started = true
    if (this.musicEnabled) this.startMusic()
  }

  private tone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.12,
    delay = 0,
    endFrequency?: number,
  ) {
    const ctx = this.ensure()
    if (!ctx || !this.master || !this.soundEnabled) return
    const now = ctx.currentTime + delay
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, now)
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    oscillator.connect(gain)
    gain.connect(this.master)
    oscillator.start(now)
    oscillator.stop(now + duration + 0.02)
  }

  play(name: SoundName) {
    if (!this.soundEnabled) return
    switch (name) {
      case 'click':
        this.tone(540, 0.06, 'triangle', 0.08, 0, 420)
        break
      case 'correct':
        this.tone(523.25, 0.14, 'triangle', 0.13)
        this.tone(659.25, 0.14, 'triangle', 0.12, 0.1)
        this.tone(783.99, 0.24, 'triangle', 0.12, 0.2)
        break
      case 'wrong':
        this.tone(220, 0.18, 'sine', 0.13, 0, 170)
        this.tone(174, 0.25, 'sine', 0.1, 0.12, 130)
        break
      case 'coin':
        this.tone(987.77, 0.08, 'square', 0.07)
        this.tone(1318.5, 0.18, 'square', 0.06, 0.07)
        break
      case 'success':
        ;[523.25, 659.25, 783.99, 1046.5].forEach((note, index) => {
          this.tone(note, 0.3, 'triangle', 0.11, index * 0.12)
        })
        break
      case 'levelup':
        ;[392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((note, index) => {
          this.tone(note, 0.32, 'triangle', 0.1, index * 0.09)
        })
        break
      case 'build':
        this.tone(120, 0.14, 'square', 0.08)
        this.tone(160, 0.12, 'square', 0.07, 0.1)
        this.tone(523.25, 0.24, 'triangle', 0.12, 0.24)
        this.tone(783.99, 0.32, 'triangle', 0.12, 0.34)
        break
      case 'hint':
        this.tone(880, 0.08, 'sine', 0.08)
        this.tone(1174.66, 0.11, 'sine', 0.07, 0.08)
        break
      case 'star':
        this.tone(1046.5, 0.09, 'triangle', 0.08)
        this.tone(1318.5, 0.13, 'triangle', 0.08, 0.08)
        break
      case 'beat':
        this.tone(230, 0.035, 'sine', 0.035)
        break
      case 'phone':
        this.tone(850, 0.18, 'sine', 0.09)
        this.tone(620, 0.18, 'sine', 0.09, 0.22)
        this.tone(850, 0.18, 'sine', 0.09, 0.46)
        break
    }
  }

  startMusic() {
    if (!this.musicEnabled || this.musicTimer !== null) return
    const ctx = this.ensure()
    if (!ctx) return
    if (ctx.state === 'suspended') void ctx.resume()
    const pattern = [
      [261.63, 329.63, 392],
      [293.66, 349.23, 440],
      [246.94, 293.66, 392],
      [220, 261.63, 329.63],
      [261.63, 329.63, 392],
      [349.23, 440, 523.25],
      [329.63, 392, 493.88],
      [293.66, 349.23, 440],
    ]
    const playBar = () => {
      if (!this.musicEnabled || !this.musicGain) return
      const chord = pattern[this.step % pattern.length]
      chord.forEach((note, index) => {
        this.tone(note, 1.5, 'sine', 0.022, index * 0.04)
      })
      const high = chord[2] * 2
      this.tone(high, 0.7, 'triangle', 0.012, 0.42)
      this.step += 1
    }
    playBar()
    this.musicTimer = window.setInterval(playBar, 1950)
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer)
      this.musicTimer = null
    }
  }
}

export const audio = new AudioEngine()

if (typeof document !== 'undefined') {
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (!audio['started']) audio.unlock()
      const target = event.target as HTMLElement | null
      if (target?.closest('button, [role="button"]')) audio.play('click')
    },
    { capture: true },
  )
  document.addEventListener('keydown', (event) => {
    if (!audio['started']) audio.unlock()
    if ((event.key === 'Enter' || event.key === ' ') && (event.target as HTMLElement)?.closest('button, [role="button"]')) {
      audio.play('click')
    }
  })
}

export function sfx(name: SoundName) {
  audio.play(name)
}
