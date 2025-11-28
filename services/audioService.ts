
export class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  constructor() {
    try {
      // @ts-ignore
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      // Increased master volume from 0.4 to 0.6 for better audibility
      this.masterGain.gain.value = 0.6; 
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.error("Web Audio API not supported", e);
    }
  }

  async init() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  // Whoosh sound for swinging the monster hand
  playSwing() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle'; 
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  // Crunchy impact sound
  playSmash(intensity: number = 1) {
    if (!this.ctx || !this.masterGain) return;
    
    // 1. Noise Burst (The Crunch)
    const bufferSize = this.ctx.sampleRate * 0.15; // Slightly longer
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1); // Full range noise
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    // High-pass filter to make it "crisp"
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 500;

    const noiseGain = this.ctx.createGain();
    
    // 2. Low Thud (The Weight)
    const osc = this.ctx.createOscillator();
    osc.type = 'square'; // Square wave for more impact
    osc.frequency.setValueAtTime(60, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.1);
    const oscGain = this.ctx.createGain();

    // Envelope
    const now = this.ctx.currentTime;
    noiseGain.gain.setValueAtTime(0.8 * intensity, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    oscGain.gain.setValueAtTime(0.5 * intensity, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    noise.start();
    osc.start();
    osc.stop(now + 0.2);
  }

  playExplosion() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Sawtooth for gritty explosion
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 1.0);

    gain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.0);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.2);
  }

  playWin() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    
    [0, 0.15, 0.3].forEach((delay, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25 + (i * 130), now + delay); 
        gain.gain.setValueAtTime(0.4, now + delay);
        gain.gain.linearRampToValueAtTime(0, now + delay + 0.4);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now + delay);
        osc.stop(now + delay + 0.4);
    });
  }
}

export const audioManager = new AudioService();
