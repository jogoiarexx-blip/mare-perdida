export function resolutionLimits(low:boolean,mobile:boolean,deviceDpr:number) {
  const cap=low?1:mobile?1.35:1.75;
  const max=Math.min(Math.max(.5,deviceDpr||1),cap);
  return {min:Math.min(max,low?.65:.85),max};
}

/** Ajusta somente resolução interna; não altera simulação, HUD ou geometria. */
export class AdaptiveResolution {
  private elapsed=0;
  private frames=0;
  private stable=0;
  private min:number;
  private max:number;
  scale:number;
  constructor(low:boolean,mobile:boolean,dpr:number){
    const limits=resolutionLimits(low,mobile,dpr);
    this.min=limits.min;this.max=limits.max;this.scale=this.max;
  }
  sample(seconds:number):number|null{
    if(!Number.isFinite(seconds)||seconds<=0||seconds>.25){this.reset();return null;}
    this.elapsed+=seconds;this.frames++;
    if(this.elapsed<1.5)return null;
    const average=this.elapsed/this.frames;
    this.elapsed=0;this.frames=0;
    let next=this.scale;
    if(average>.025){next=Math.max(this.min,this.scale*.87);this.stable=0;}
    else if(average<.018){
      if(++this.stable>=3){next=Math.min(this.max,this.scale*1.07);this.stable=0;}
    }else this.stable=0;
    if(Math.abs(next-this.scale)<.015)return null;
    this.scale=next;return next;
  }
  reset(){this.elapsed=0;this.frames=0;this.stable=0;}
}
