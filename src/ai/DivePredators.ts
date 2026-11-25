import * as THREE from 'three';
import {combine} from '../render/DetailGeometry';
import {seabedHeight} from '../world/DiveLayout';
export type PredatorKind='tubarao'|'moreia'|'agua_viva';
export const PREDATORS={
 tubarao:{name:'Tubarão de recife',hp:60,damage:12,speed:3.2,reach:1.5,color:0x748f9c},
 moreia:{name:'Moreia',hp:45,damage:9,speed:2.1,reach:1.3,color:0x7c9b49},
 agua_viva:{name:'Água-viva',hp:25,damage:6,speed:.8,reach:1.15,color:0xab91ca}
} as const;
export function predatorGeometry(kind:PredatorKind,low=false){
 const seg=low?5:9,parts:THREE.BufferGeometry[]=[];
 const oval=(sx:number,sy:number,sz:number,x=0,y=0,z=0)=>new THREE.SphereGeometry(1,seg,low?3:5).scale(sx,sy,sz).translate(x,y,z);
 if(kind==='tubarao'){
  parts.push(oval(.30,.27,.85),new THREE.ConeGeometry(.24,.6,4).rotateX(-Math.PI/2).translate(0,0,-.85),new THREE.ConeGeometry(.15,.42,3).translate(0,.32,-.1));
  for(const s of [-1,1])parts.push(new THREE.ConeGeometry(.12,.52,3).rotateZ(s*Math.PI/2).translate(s*.35,-.08,.05));
 }else if(kind==='moreia'){
  for(let i=0;i<6;i++)parts.push(oval(.17-i*.014,.18-i*.015,.28,Math.sin(i*.7)*.12,0,.4-i*.24));
 }else{
  parts.push(oval(.38,.23,.38,0,.15,0));for(let i=0;i<(low?4:8);i++){const a=i*Math.PI/4;parts.push(new THREE.CylinderGeometry(.025,.012,.65,3).translate(Math.cos(a)*.23,-.27,Math.sin(a)*.23));}
 }
 return combine(parts);
}
interface Actor{kind:PredatorKind;mesh:THREE.Mesh;hp:number;home:THREE.Vector3;phase:number;timer:number;state:'patrol'|'chase'|'warn'|'recover'|'dead';}
export class DivePredators{
 readonly group=new THREE.Group();private actors:Actor[]=[];private zone='';private cooldown=0;private elapsed=0;
 private readonly geo=new Map<PredatorKind,THREE.BufferGeometry[]>();private readonly mats=new Map<PredatorKind,THREE.MeshStandardMaterial>();
 private readonly alert=new THREE.MeshStandardMaterial({color:0xffa74c,emissive:0x762900});
 constructor(){for(const k of Object.keys(PREDATORS) as PredatorKind[]){this.geo.set(k,[predatorGeometry(k),predatorGeometry(k,true)]);this.mats.set(k,new THREE.MeshStandardMaterial({color:PREDATORS[k].color,roughness:.8}));}}
 reset(){this.group.clear();this.actors=[];this.zone='';this.cooldown=0;this.elapsed=0;}
 get activeCount(){return this.actors.filter(a=>a.mesh.visible).length;}
 update(dt:number,p:THREE.Vector3,wet:boolean,seed:number,low:boolean,onDamage:(n:number,name:string)=>void,ground:(x:number,z:number)=>number|null=()=>null){
  this.cooldown=Math.max(0,this.cooldown-dt);
  if(!wet){this.reset();return;}
  const zone=Math.floor(p.x/64)+':'+Math.floor(p.z/64);
  if(zone!==this.zone){this.reset();this.zone=zone;
   for(const [i,k] of (['tubarao','moreia','agua_viva'] as const).entries()){
    const a=(seed%360)*Math.PI/180+i*2.1,r=7+i*2,x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;
    if((ground(x,z)??-20)>-1.5)continue;
    const y=Math.min(-1.5,Math.max(seabedHeight(x,z,seed)+1,p.y)),home=new THREE.Vector3(x,y,z),mesh=new THREE.Mesh(this.geo.get(k)![0],this.mats.get(k)!);mesh.position.copy(home);this.group.add(mesh);
    this.actors.push({kind:k,mesh,hp:PREDATORS[k].hp,home,phase:i,timer:0,state:'patrol'});
   }
  }
  this.elapsed+=dt;
  for(const a of this.actors){
   const m=a.mesh,d=PREDATORS[a.kind],dist=m.position.distanceTo(p);
   if(a.state==='dead'){a.timer-=dt;if(a.timer<=0)m.visible=false;continue;}
   m.visible=dist<34;if(!m.visible)continue;
   m.geometry=this.geo.get(a.kind)![low||dist>13?1:0];
   if(a.state==='warn'){a.timer-=dt;if(a.timer<=0){if(dist<d.reach+.4)onDamage(d.damage,d.name);a.state='recover';a.timer=1.8;m.material=this.mats.get(a.kind)!;}continue;}
   if(a.state==='recover'){a.timer-=dt;if(a.timer<=0)a.state='patrol';continue;}
   if(dist<d.reach){a.state='warn';a.timer=.85;m.material=this.alert;continue;}
   const chase=dist<11&&m.position.distanceTo(a.home)<17&&a.kind!=='agua_viva';
   a.state=chase?'chase':'patrol';
   const angle=this.elapsed*.35+a.phase,tx=chase?p.x:a.home.x+Math.cos(angle)*2,tz=chase?p.z:a.home.z+Math.sin(angle)*2,ty=chase?p.y:a.home.y+Math.sin(angle)*.4;
   const dx=tx-m.position.x,dy=ty-m.position.y,dz=tz-m.position.z,mag=Math.hypot(dx,dy,dz);
   if(mag<.05)continue;
   const step=Math.min(mag,d.speed*dt*(chase?1:.35)),x=m.position.x+dx/mag*step,z=m.position.z+dz/mag*step,bed=Math.max(seabedHeight(x,z,seed),ground(x,z)??-20)+.4;
   if(bed<-1){m.position.set(x,Math.max(bed,Math.min(-.9,m.position.y+dy/mag*step)),z);m.rotation.y=Math.atan2(dx,dz);}
  }
 }
 private nearest(p:THREE.Vector3,r:number){let best:Actor|undefined,d=r*r;for(const a of this.actors){const dist=a.mesh.position.distanceToSquared(p);if(a.state!=='dead'&&dist<d){d=dist;best=a;}}return best;}
 warning(p:THREE.Vector3){const a=this.nearest(p,5);return a?PREDATORS[a.kind].name+' · '+a.hp+' HP'+(a.state==='warn'?' — ataque iminente!':''):null;}
 strike(p:THREE.Vector3){const a=this.nearest(p,3.2);if(!a)return null;const name=PREDATORS[a.kind].name;if(this.cooldown>0)return {name,hp:a.hp,hit:false};this.cooldown=.55;a.hp=Math.max(0,a.hp-25);a.mesh.material=this.mats.get(a.kind)!;a.state=a.hp?'recover':'dead';a.timer=a.hp?.5:5;if(!a.hp)a.mesh.rotation.z=Math.PI/2;return {name,hp:a.hp,hit:true};}
 dispose(){this.reset();for(const gs of this.geo.values())for(const g of gs)g.dispose();for(const m of this.mats.values())m.dispose();this.alert.dispose();}
}
