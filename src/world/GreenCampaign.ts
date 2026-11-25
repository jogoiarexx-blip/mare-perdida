import * as THREE from 'three';
import {islandForChunk,islandHeight,type IslandSpec} from './ChunkLayout';
import {resourcesForIsland} from './IslandResources';
import {combine} from '../render/DetailGeometry';
export type GreenPointId='green_spring'|'green_bento'|'green_stock';
export interface GreenPoint{id:GreenPointId;x:number;y:number;z:number;label:string;}
export function greenPoints(seed:number):GreenPoint[]{
 const spec=islandForChunk(seed,0,-1)!,resources=resourcesForIsland(spec),points:GreenPoint[]=[];
 const defs:[GreenPointId,string,number][]=[['green_spring','Investigar nascente',0],['green_bento','Conversar com Bento',2.1],['green_stock','Recuperar estoque agrícola',4.2]];
 for(const [id,label,phase] of defs){
  for(let i=0;i<24;i++){
   const a=phase+i*.45,r=5+Math.floor(i/8)*2,x=spec.x+Math.cos(a)*r,z=spec.z+Math.sin(a)*r;
   if(resources.some(n=>Math.hypot(x-n.x,z-n.z)<n.radius+1.8)||points.some(n=>Math.hypot(x-n.x,z-n.z)<3))continue;
   points.push({id,label,x,z,y:islandHeight(spec,x,z)!});break;
  }
  if(!points.some(p=>p.id===id)){const x=spec.x+Math.cos(phase)*3,z=spec.z+Math.sin(phase)*3;points.push({id,label,x,z,y:islandHeight(spec,x,z)!});}
 }
 return points;
}
export function anchoredNearGreenIsland(seed:number,x:number,z:number,anchored:boolean):boolean{
 const i=islandForChunk(seed,0,-1)!;return anchored&&Math.hypot(x-i.x,z-i.z)<=i.radius+22;
}
export class GreenCampaign {
 readonly group=new THREE.Group();
 private points:GreenPoint[]=[];
 private seed=-1;
 private readonly meshes=new Map<GreenPointId,THREE.Group>();
 constructor(){
  const spring=new THREE.Group();
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.85,.16,5,12).rotateX(Math.PI/2),new THREE.MeshStandardMaterial({color:0x838b78}));rim.position.y=.2;
  const water=new THREE.Mesh(new THREE.CircleGeometry(.82,16).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:0x49bfd3,roughness:.3}));water.position.y=.19;spring.add(rim,water);
  const bento=new THREE.Group(),body=new THREE.Mesh(combine([new THREE.BoxGeometry(.48,.65,.28).translate(0,1.0,0),new THREE.BoxGeometry(.18,.60,.22).translate(-.14,.35,0),new THREE.BoxGeometry(.18,.60,.22).translate(.14,.35,0),new THREE.BoxGeometry(.13,.55,.16).translate(-.33,.98,0),new THREE.BoxGeometry(.13,.55,.16).translate(.33,.98,0)]),new THREE.MeshStandardMaterial({color:0x526e4a}));
  const head=new THREE.Mesh(new THREE.SphereGeometry(.21,8,5),new THREE.MeshStandardMaterial({color:0xc59570}));head.position.y=1.55;
  const hat=new THREE.Mesh(new THREE.CylinderGeometry(.25,.30,.10,8),new THREE.MeshStandardMaterial({color:0x987342}));hat.position.y=1.75;bento.add(body,head,hat);
  const stock=new THREE.Group();const box=new THREE.Mesh(combine([new THREE.BoxGeometry(.9,.58,.65).translate(0,.29,0),new THREE.BoxGeometry(.96,.10,.7).translate(0,.6,0)]),new THREE.MeshStandardMaterial({color:0xa87942}));stock.add(box);
  this.meshes.set('green_spring',spring);this.meshes.set('green_bento',bento);this.meshes.set('green_stock',stock);this.group.add(spring,bento,stock);this.group.visible=false;
 }
 reset(seed:number){this.seed=seed;this.points=greenPoints(seed);for(const p of this.points)this.meshes.get(p.id)!.position.set(p.x,p.y,p.z);}
 target(id:GreenPointId|null):GreenPoint|null{return this.points.find(p=>p.id===id)??null;}
 update(seed:number,x:number,z:number,target:GreenPointId|null){
  if(this.seed!==seed)this.reset(seed);
  const spec=islandForChunk(seed,0,-1)!;
  this.group.visible=target!==null&&Math.hypot(x-spec.x,z-spec.z)<spec.radius+55;
  for(const [id,m] of this.meshes)m.visible=id===target;
 }
 nearby(id:GreenPointId|null,p:THREE.Vector3):GreenPoint|null{
  const n=this.target(id);return n&&Math.hypot(n.x-p.x,n.z-p.z)<2.4&&Math.abs(n.y-p.y)<1.8?n:null;
 }
}
