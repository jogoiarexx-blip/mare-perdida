/** Protocolo leve e limitado para presença visual, sem estado de inventário ou autoridade de mundo. */
export interface PlayerPose {
  v:1;seq:number;x:number;y:number;z:number;yaw:number;speed:number;wet:boolean;grounded:boolean;
}
export const POSE_INTERVAL=.1;
export const POSE_TIMEOUT_MS=2200;
export function sessionSeed(sdp:string):number {
  let hash=2166136261;
  for(let i=0;i<sdp.length;i++)hash=Math.imul(hash^sdp.charCodeAt(i),16777619);
  return 100000+(hash>>>0)%900000;
}
export function readPose(raw:unknown):PlayerPose|null {
  if(typeof raw!=='string'||raw.length>256)return null;
  try{
    const p=JSON.parse(raw) as Partial<PlayerPose>;
    if(p.v!==1||typeof p.seq!=='number'||!Number.isSafeInteger(p.seq)||p.seq<0)return null;
    if(typeof p.x!=='number'||typeof p.y!=='number'||typeof p.z!=='number'||typeof p.yaw!=='number'||typeof p.speed!=='number')return null;
    if(![p.x,p.y,p.z,p.yaw,p.speed].every(Number.isFinite))return null;
    if(Math.abs(p.x)>1000000||Math.abs(p.z)>1000000||Math.abs(p.y)>500||Math.abs(p.yaw)>Math.PI*2||p.speed<0||p.speed>15)return null;
    if(typeof p.wet!=='boolean'||typeof p.grounded!=='boolean')return null;
    return {v:1,seq:p.seq,x:p.x,y:p.y,z:p.z,yaw:p.yaw,speed:p.speed,wet:p.wet,grounded:p.grounded};
  }catch{return null;}
}
export function shortestAngle(from:number,to:number):number{
  return Math.atan2(Math.sin(to-from),Math.cos(to-from));
}
