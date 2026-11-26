import type {EconomyAction,EconomyRequest,EconomyState,FloatView} from './EconomyProtocol';
import type {Inventory} from '../player/Inventory';
import * as THREE from 'three';
import { PlayerController } from '../player/Controller';
import { POSE_INTERVAL,POSE_TIMEOUT_MS,shortestAngle,type PlayerPose } from './PresenceProtocol';
import type { PeerLink } from './PeerLink';
import type {RaftMotion,RaftSnapshot} from './RaftProtocol';
import type {RaftGrid} from '../raft/Grid';
import type {RaftRenderer} from '../raft/RaftRenderer';
import type {WorldClock} from '../core/Clock';

/** Presença visual apenas. Os dados de rede nunca entram na física nem no save. */
export class PresenceSession {
  private readonly remote:PlayerController;
  private target:PlayerPose|null=null;
  private receivedAt=-Infinity;
  private seq=0;
  private worldSeq=0;
  private economyRequests:EconomyRequest[]=[];
  private pendingEconomy:EconomyState|null=null;
  private pendingCommand=-1;
  private economyAck=-1;
  private economyOk=false;
  private economyTimer=1;
  get economyBusy(){return this.pendingCommand>=0;}
  requestEconomy(command:EconomyAction,revision:number){
    if(this.host||this.economyBusy||!this.link.presenceReady)return false;
    const seq=++this.worldSeq;
    if(!this.link.sendWorld({v:1,type:'economyRequest',seq,revision,command}))return false;
    this.pendingCommand=seq;return true;
  }
  takeEconomy(){const p=this.pendingEconomy;this.pendingEconomy=null;if(p&&p.ack>=this.pendingCommand)this.pendingCommand=-1;return p;}
  takeRequests(){return this.economyRequests.splice(0,4);}
  acknowledge(seq:number,ok:boolean){this.economyAck=seq;this.economyOk=ok;this.economyTimer=1;}
  broadcastEconomy(dt:number,inventory:Inventory,floats:FloatView[]){
    if(!this.host)return;this.economyTimer+=dt;if(this.economyTimer<.3)return;
    if(this.link.sendWorld({v:1,type:'economyState',seq:++this.worldSeq,inventory:inventory.serialize(),floats,ack:this.economyAck,ok:this.economyOk}))this.economyTimer=0;
  }
  private worldTimer=1;
  private fullTimer=4;
  private sentGrid='';
  private pendingGrid:RaftSnapshot|null=null;
  private pendingMotion:RaftMotion|null=null;
  private anchorPending=false;
  private anchorAt=-Infinity;
  get host(){return this.link.role==='host';}
  get remotePose(){return this.online?this.target:null;}
  requestAnchor(){return !this.host&&this.link.sendWorld({v:1,type:'anchor',seq:++this.worldSeq});}
  consumeAnchor(){const result=this.anchorPending;this.anchorPending=false;return result;}
  takeGrid(){const p=this.pendingGrid;this.pendingGrid=null;return p;}
  takeMotion(){const p=this.pendingMotion;this.pendingMotion=null;return p;}
  broadcast(dt:number,grid:RaftGrid,raft:RaftRenderer,clock:WorldClock){
    if(!this.host||!this.link.presenceReady)return;
    this.worldTimer+=dt;this.fullTimer+=dt;
    if(this.worldTimer<.2)return;this.worldTimer=0;
    const serialized=grid.serialize();const signature=JSON.stringify(serialized);
    if(signature!==this.sentGrid||this.fullTimer>=3){
      if(this.link.sendWorld({v:1,type:'raft',seq:++this.worldSeq,grid:serialized})){this.sentGrid=signature;this.fullTimer=0;}
    }
    this.link.sendWorld({v:1,type:'motion',seq:++this.worldSeq,x:raft.x,z:raft.z,heading:Math.atan2(Math.sin(raft.heading),Math.cos(raft.heading)),elapsed:clock.elapsedSeconds,day:clock.dayCount,time:clock.timeOfDay,tick:clock.tick});
  }
  private elapsed=POSE_INTERVAL;
  private readonly marker:THREE.Mesh;
  constructor(readonly link:PeerLink,scene:THREE.Scene){
    this.remote=new PlayerController(scene);
    this.remote.avatarGroup.visible=false;
    this.marker=new THREE.Mesh(new THREE.OctahedronGeometry(.11),new THREE.MeshBasicMaterial({color:0x61e8ff}));
    this.marker.position.y=1.96;this.remote.avatarGroup.add(this.marker);
    link.onWorld(p=>{
      if(p.type==='economyRequest'&&this.host&&this.economyRequests.length<16)this.economyRequests.push(p);
      if(p.type==='economyState'&&!this.host)this.pendingEconomy=p;
      if(p.type==='raft'&&!this.host)this.pendingGrid=p;
      if(p.type==='motion'&&!this.host)this.pendingMotion=p;
      if(p.type==='anchor'&&this.host&&performance.now()-this.anchorAt>750){this.anchorAt=performance.now();this.anchorPending=true;}
    });
    link.onPose(p=>{
      this.target=p;this.receivedAt=performance.now();
    });
  }
  get online(){return this.link.presenceReady&&this.target!==null&&performance.now()-this.receivedAt<POSE_TIMEOUT_MS;}
  get status(){
    if(!this.link.presenceReady)return 'P2P · conexão interrompida';
    return this.online?'P2P · '+(this.host?'Anfitrião':'Convidado')+' · 2/2 · '+(this.link.latency??'—')+' ms':'P2P · aguardando parceiro entrar';
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
