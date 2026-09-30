/**
 * Cyberpunk Audio Synthesizer (Web Audio API)
 * Zero external audio assets required. Pure algorithmic sound synthesis.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmPlaying = false;
    this.chronoOsc = null;
    this.chronoGain = null;
    this.masterGain = null;
    this.bgmTimer = null;
    this.bgmStep = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx?.currentTime || 0);
    }
    return this.isMuted;
  }

  // Jump sound: punchy synth kick-up
  playJump(isSuper = false) {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isSuper ? 'sawtooth' : 'triangle';
    const startFreq = isSuper ? 280 : 160;
    const endFreq = isSuper ? 780 : 380;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.12);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isSuper ? 0.22 : 0.15));

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + (isSuper ? 0.22 : 0.15));
  }

  // Color Shift Chime: Sci-Fi Harmonic Ping
  playColorShift(colorType) {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = colorType === 0 ? [523.25, 659.25, 783.99] // C Major (Cyan)
                : colorType === 1 ? [440.00, 554.37, 659.25] // A Major (Magenta)
                : [392.00, 493.88, 587.33]; // G Major (Lime)

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.18, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.42);
    });
  }

  // Warning tick when color shift is in 1 second
  playWarningTick() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Chrono Time Dilation start (Low-end sub sweep)
  startChronoDilation() {
    if (this.isMuted || !this.ctx || this.chronoOsc) return;
    const now = this.ctx.currentTime;
    this.chronoOsc = this.ctx.createOscillator();
    this.chronoGain = this.ctx.createGain();

    this.chronoOsc.type = 'sawtooth';
    this.chronoOsc.frequency.setValueAtTime(140, now);
    this.chronoOsc.frequency.exponentialRampToValueAtTime(55, now + 0.3);

    // Low pass filter for muffled time-slow effect
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.3);

    this.chronoGain.gain.setValueAtTime(0.01, now);
    this.chronoGain.gain.linearRampToValueAtTime(0.2, now + 0.15);

    this.chronoOsc.connect(filter);
    filter.connect(this.chronoGain);
    this.chronoGain.connect(this.masterGain);

    this.chronoOsc.start(now);
  }

  // Chrono Time Dilation stop
  stopChronoDilation() {
    if (!this.chronoOsc || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.chronoGain) {
      this.chronoGain.gain.linearRampToValueAtTime(0.001, now + 0.1);
    }
    if (this.chronoOsc) {
      this.chronoOsc.stop(now + 0.12);
      this.chronoOsc = null;
    }
  }

  // Combo Streak Chime
  playCombo(streak) {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const scale = [440, 493.88, 554.37, 659.25, 739.99, 880, 987.77, 1108.73];
    const freq = scale[Math.min(streak - 1, scale.length - 1)];

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Game Over (Shatter / Glitch / Sub-drop)
  playGameOver() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub drop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.55);

    // Glitch noise buffer
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(600, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(now);
  }

  // Background Synth Pulse Arpeggiator
  toggleBGM() {
    if (this.bgmPlaying) {
      this.stopBGM();
      return false;
    } else {
      this.startBGM();
      return true;
    }
  }

  startBGM() {
    if (!this.ctx) this.init();
    this.bgmPlaying = true;
    const notes = [130.81, 146.83, 164.81, 196.00, 164.81, 146.83, 220.00, 196.00]; // Cyber Arp

    const playStep = () => {
      if (!this.bgmPlaying || this.isMuted) {
        this.bgmTimer = setTimeout(playStep, 180);
        return;
      }
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, now);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(notes[this.bgmStep % notes.length], now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.17);

      this.bgmStep++;
      this.bgmTimer = setTimeout(playStep, 160);
    };

    playStep();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

window.soundEngine = new SoundEngine();
