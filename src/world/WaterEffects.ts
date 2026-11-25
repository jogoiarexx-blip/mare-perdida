import * as THREE from 'three';
import {getWaveHeight} from './Ocean';

export const waterFxBudget=(low:boolean)=>({foam:low?12:32,bubbles:low?12:28,splash:low?16:40});
type Particle={x:number;y:number;z:number;vx:number;vy:number;vz:number;age:number;life:number};
const pool=(count:number)=>Array.from({length:count},():Particle=>({x:0,y:0,z:0,vx:0,vy:0,vz:0,age:0,life:0}));
const seed=(i:number)=>((Math.sin(i*127.1+311.7)*43758.5453)%1+1)%1;
/** Efeitos exclusivamente visuais: memória fixa, sem física ou objetos descartáveis por frame. */
export class WaterEffects {
  private readonly root=new THREE.Group();
  private readonly foam=new THREE.InstancedMesh(new THREE.RingGeometry(.72,1,10),new THREE.MeshBasicMaterial({color:0xbde2de,transparent:true,opacity:.36,depthWrite:false,side:THREE.DoubleSide}),32);
  private readonly foamPool=pool(32);
  private readonly splashPool=pool(40);
  private readonly bubblePool=pool(28);
  private readonly dummy=new THREE.Object3D();
  private readonly splashData=new Float32Array(40*3);
  private readonly bubbleData=new Float32Array(28*3);
  private readonly splash=this.points(this.splashData,0xccecf5,.075);
  private readonly bubbles=this.points(this.bubbleData,0xa4e1ee,.065);
  private foamTimer=0;private bubbleTimer=0;private swimTimer=0;private serial=0;
  private wasWet=false;private initialized=false;
  constructor(scene:THREE.Scene){
    this.foam.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.foam.frustumCulled=false;this.foam.count=0;
    this.root.add(this.foam,this.splash,this.bubbles);scene.add(this.root);
  }
  private points(data:Float32Array,color:number,size:number){
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(data,3).setUsage(THREE.DynamicDrawUsage));
    g.setDrawRange(0,0);
    const p=new THREE.Points(g,new THREE.PointsMaterial({color,size,transparent:true,opacity:.62,depthWrite:false}));
    p.frustumCulled=false;return p;
  }
  reset(){
    for(const list of [this.foamPool,this.splashPool,this.bubblePool])for(const p of list)p.life=0;
    this.foamTimer=this.bubbleTimer=this.swimTimer=0;this.initialized=false;this.serial=0;
    this.foam.count=0;this.splash.geometry.setDrawRange(0,0);this.bubbles.geometry.setDrawRange(0,0);
  }
  private spawn(list:Particle[],cap:number,x:number,y:number,z:number,vx:number,vy:number,vz:number,life:number){
    for(let i=0;i<cap;i++){const p=list[i];if(p.life>0)continue;
      p.x=x;p.y=y;p.z=z;p.vx=vx;p.vy=vy;p.vz=vz;p.age=0;p.life=life;return;}
  }
  burst(x:number,z:number,time:number,storm:number,low:boolean){
    const cap=waterFxBudget(low).splash,y=getWaveHeight(x,z,time,storm);
    for(let i=0;i<(low?7:13);i++){const a=seed(++this.serial)*Math.PI*2,v=.5+seed(++this.serial)*1.3;
      this.spawn(this.splashPool,cap,x,y+.06,z,Math.cos(a)*v,1+v,Math.sin(a)*v,.45+seed(++this.serial)*.28);}
  }
  tick(dt:number,time:number,storm:number,low:boolean,px:number,py:number,pz:number,wet:boolean,underwater:boolean,swimSpeed:number,rx:number,rz:number,vx:number,vz:number,raftRadius=1){
    const cap=waterFxBudget(low);
    if(this.initialized&&wet&&!this.wasWet)this.burst(px,pz,time,storm,low);
    this.wasWet=wet;this.initialized=true;
    const speed=Math.hypot(vx,vz);
    this.foamTimer+=dt;
    if(this.foamTimer>=(low?.24:.13)){
      this.foamTimer=0;
      const a=seed(++this.serial)*Math.PI*2,side=seed(++this.serial)<.5?-1:1;
      const r=Math.max(.75,raftRadius);
      // Rastro oposto à velocidade real; espuma lateral quando ancorada.
      const dx=speed>.12?-vx/speed:Math.cos(a),dz=speed>.12?-vz/speed:Math.sin(a);
      const x=rx+dx*r-dz*side*r*.4,z=rz+dz*r+dx*side*r*.4;
      this.spawn(this.foamPool,cap.foam,x,0,z,dx*.15,0,dz*.15,speed>.12?2.1:1.0);
    }
    this.swimTimer+=dt;
    if(wet&&!underwater&&swimSpeed>.8&&this.swimTimer>.45){this.swimTimer=0;this.burst(px,pz,time,storm,low);}
    this.bubbleTimer+=dt;
    if(underwater&&this.bubbleTimer>(low?.28:.14)){this.bubbleTimer=0;
      const a=seed(++this.serial)*Math.PI*2;
      this.spawn(this.bubblePool,cap.bubbles,px+Math.cos(a)*.23,py+1.1,pz+Math.sin(a)*.23,Math.cos(a)*.08,.48+seed(++this.serial)*.35,Math.sin(a)*.08,2.2);}
    let n=0;
    for(let i=0;i<this.foamPool.length;i++){const p=this.foamPool[i];if(i>=cap.foam){p.life=0;continue;}if(p.life<=0)continue;
      p.age+=dt;if(p.age>=p.life){p.life=0;continue;}
      p.x+=p.vx*dt;p.z+=p.vz*dt;
      this.dummy.position.set(p.x,getWaveHeight(p.x,p.z,time,storm)+.035,p.z);
      this.dummy.rotation.set(-Math.PI/2,0,0);
      const s=(.15+p.age*.45)*Math.min(1,(p.life-p.age)*3);
      this.dummy.scale.set(s,s*.65,1);this.dummy.updateMatrix();this.foam.setMatrixAt(n++,this.dummy.matrix);
    }
    this.foam.count=n;this.foam.instanceMatrix.needsUpdate=true;
    this.updatePoints(this.splashPool,cap.splash,this.splash,this.splashData,dt,time,storm,false);
    this.updatePoints(this.bubblePool,cap.bubbles,this.bubbles,this.bubbleData,dt,time,storm,true);
  }
  private updatePoints(list:Particle[],cap:number,mesh:THREE.Points,data:Float32Array,dt:number,time:number,storm:number,bubble:boolean){
    let n=0;
    for(let i=0;i<list.length;i++){const p=list[i];if(i>=cap){p.life=0;continue;}if(p.life<=0)continue;
      p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(!bubble)p.vy-=7*dt;
      const surface=getWaveHeight(p.x,p.z,time,storm);
      if(p.age>=p.life||(bubble?p.y>=surface:p.y<surface-.08)){p.life=0;continue;}
      data[n++]=p.x;data[n++]=p.y;data[n++]=p.z;
    }
    mesh.geometry.setDrawRange(0,n/3);mesh.geometry.getAttribute('position').needsUpdate=true;
  }
  dispose(){this.root.removeFromParent();this.foam.geometry.dispose();this.foam.material.dispose();this.foam.dispose();
    for(const mesh of [this.splash,this.bubbles]){mesh.geometry.dispose();(mesh.material as THREE.Material).dispose();}}
}
