import * as THREE from 'three';
import { PlayerController } from '../player/Controller';
import { POSE_INTERVAL,POSE_TIMEOUT_MS,shortestAngle,type PlayerPose } from './PresenceProtocol';
import type { PeerLink } from './PeerLink';

/** Presença visual apenas. Os dados de rede nunca entram na física nem no save. */
export class PresenceSession {
  private readonly remote:PlayerController;
  private target:PlayerPose|null=null;
  private receivedAt=-Infinity;
  private seq=0;
  private elapsed=POSE_INTERVAL;
  private readonly marker:THREE.Mesh;
  constructor(readonly link:PeerLink,scene:THREE.Scene){
    this.remote=new PlayerController(scene);
    this.remote.avatarGroup.visible=false;
    this.marker=new THREE.Mesh(new THREE.OctahedronGeometry(.11),new THREE.MeshBasicMaterial({color:0x61e8ff}));
    this.marker.position.y=1.96;this.remote.avatarGroup.add(this.marker);
    link.onPose(p=>{
      this.target=p;this.receivedAt=performance.now();
    });
  }
  get online(){return this.link.presenceReady&&this.target!==null&&performance.now()-this.receivedAt<POSE_TIMEOUT_MS;}
  get status(){
    if(!this.link.presenceReady)return 'P2P · conexão interrompida';
    return this.online?'P2P · 2/2 · '+(this.link.latency??'—')+' ms':'P2P · aguardando parceiro entrar';
  }
  update(dt:number,local:PlayerController,paused:boolean){
    this.elapsed+=Math.min(.1,Math.max(0,dt));
    if(this.elapsed>=POSE_INTERVAL){
      this.elapsed=0;
      const round=(n:number)=>Math.round(n*100)/100;
      this.link.sendPose({v:1,seq:++this.seq,x:round(local.position.x),y:round(local.position.y),z:round(local.position.z),yaw:Math.atan2(Math.sin(local.yaw),Math.cos(local.yaw)),speed:paused?0:round(Math.hypot(local.velocity.x,local.velocity.z)),wet:local.inWater,grounded:local.grounded});
    }
    const p=this.target,root=this.remote.avatarGroup;
    if(!p||!this.online){root.visible=false;return;}
    const distanceSq=(root.position.x-p.x)**2+(root.position.y-p.y)**2+(root.position.z-p.z)**2;
    const blend=!root.visible||distanceSq>25?1:1-Math.exp(-Math.min(.1,dt)*14);
    root.position.x+=(p.x-root.position.x)*blend;
    root.position.y+=(p.y-root.position.y)*blend;
    root.position.z+=(p.z-root.position.z)*blend;
    root.rotation.y+=shortestAngle(root.rotation.y,p.yaw)*blend;
    root.visible=true;
    this.remote.animateAvatar(Math.min(.1,dt),p.speed,p.wet,p.grounded);
  }
  close(){
    this.link.close();this.remote.avatarGroup.removeFromParent();
    const materials=new Set<THREE.Material>(),geometries=new Set<THREE.BufferGeometry>();
    this.remote.avatarGroup.traverse(obj=>{if(obj instanceof THREE.Mesh){geometries.add(obj.geometry);if(Array.isArray(obj.material))obj.material.forEach(m=>materials.add(m));else materials.add(obj.material);}});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  }
}
