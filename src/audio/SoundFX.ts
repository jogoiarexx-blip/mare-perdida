/**
 * Síntese WebAudio procedural leve (zero assets externos) com controle de volume mestre.
 */
export class SoundFX {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  volume = 0.55;
  private ambience:AudioBufferSourceNode|null=null;
  private ambienceGain:GainNode|null=null;
  private ambienceFilter:BiquadFilterNode|null=null;
  private ambienceState='';

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined' || this.volume <= 0.01) return null;
    if (!this.ctx) {
      const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return null;
      this.ctx = new AudioCtor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(()=>{});
    }
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
    return this.ctx;
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) this.masterGain.gain.value = this.volume;
  }

  /** Uma fonte de ruído filtrado em loop, sem downloads e sem fontes por quadro. */
  startAmbience():void {
    if(this.ambience)return;
    try {
      const ctx=this.ensureContext();if(!ctx||!this.masterGain)return;
      const buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
      const samples=buffer.getChannelData(0);let prev=0,state=2089;
      for(let i=0;i<samples.length;i++){
        state=(Math.imul(state,1664525)+1013904223)>>>0;
        prev=prev*.88+(state/4294967296*2-1)*.12;
        samples[i]=prev*.7;
      }
      const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;
      const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=700;
      const gain=ctx.createGain();gain.gain.value=0;
      source.connect(filter);filter.connect(gain);gain.connect(this.masterGain);
      source.start();this.ambience=source;this.ambienceGain=gain;this.ambienceFilter=filter;
    } catch { /* áudio indisponível não impede a partida */ }
  }
  updateAmbience(storm:number,underwater:boolean,idle:boolean):void{
    if(!this.ctx||!this.ambienceGain||!this.ambienceFilter)return;
    const state=idle?'idle':underwater?'dive':storm>.16?'rain':'sea';
    if(state===this.ambienceState)return;
    this.ambienceState=state;const now=this.ctx.currentTime;
    this.ambienceGain.gain.setTargetAtTime(state==='idle'?0:state==='rain'?.19:state==='dive'?.09:.13,now,.25);
    this.ambienceFilter.frequency.setTargetAtTime(state==='dive'?150:state==='rain'?1500:650,now,.3);
  }

  playTone(freq: number, duration = 0.12, type: OscillatorType = 'sine', gainLevel = 0.16): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(gainLevel, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  playPickup(): void {
    this.playTone(540, 0.09, 'triangle', 0.14);
    setTimeout(() => this.playTone(760, 0.11, 'triangle', 0.12), 45);
  }

  playBuild(): void {
    this.playTone(170, 0.14, 'square', 0.12);
    setTimeout(() => this.playTone(260, 0.1, 'triangle', 0.1), 50);
  }

  playSplash(): void {
    this.playTone(210, 0.18, 'sine', 0.13);
  }

  playSharkAlert(): void {
    this.playTone(110, 0.35, 'sawtooth', 0.18);
  }

  playRadio(): void {
    this.playTone(880, 0.12, 'sine', 0.14);
    setTimeout(() => this.playTone(1040, 0.2, 'sine', 0.14), 130);
  }
}
