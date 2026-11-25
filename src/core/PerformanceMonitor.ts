export interface FrameStats {fps:number;p95ms:number;worstMs:number;longFrames:number;}
/** Janela fixa e pequena; percentis calculados somente ao exibir o painel. */
export class PerformanceMonitor{
  private readonly frames=new Float32Array(180);
  private cursor=0;private size=0;
  add(seconds:number){
    if(!Number.isFinite(seconds)||seconds<=0||seconds>2)return;
    this.frames[this.cursor]=seconds*1000;this.cursor=(this.cursor+1)%this.frames.length;this.size=Math.min(this.size+1,this.frames.length);
  }
  reset(){this.cursor=0;this.size=0;}
  snapshot():FrameStats{
    if(!this.size)return {fps:0,p95ms:0,worstMs:0,longFrames:0};
    const values=Array.from(this.frames.subarray(0,this.size)).sort((a,b)=>a-b);
    let sum=0,longFrames=0;for(const v of values){sum+=v;if(v>33.4)longFrames++;}
    return {fps:Math.round(1000*this.size/sum),p95ms:values[Math.ceil(this.size*.95)-1],worstMs:values[values.length-1],longFrames};
  }
}
