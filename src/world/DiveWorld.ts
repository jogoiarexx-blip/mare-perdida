import * as THREE from 'three';
import {combine} from '../render/DetailGeometry';
import {diveNodes,seabedHeight,validDiveId,hasWreckRoom,wreckWall,type DiveNode} from './DiveLayout';
interface Tile{root:THREE.Group;floor:THREE.Mesh;nodes:DiveNode[];meshes:Map<string,THREE.Mesh>;}
export function seabedGeometry(seed:number,tx:number,tz:number,segments:number){
 const g=new THREE.PlaneGeometry(64,64,segments,segments).rotateX(-Math.PI/2).translate(32,0,32),p=g.getAttribute('position');
 for(let i=0;i<p.count;i++)p.setY(i,seabedHeight(tx*64+p.getX(i),tz*64+p.getZ(i),seed));
 p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();return g;
}
export class DiveWorld{
 readonly group=new THREE.Group();
 private tiles=new Map<string,Tile>();private used=new Set<string>();
 private readonly floorMat=new THREE.MeshStandardMaterial({color:0x897f66,roughness:1});
 private readonly algae=combine(Array.from({length:5},(_,i)=>new THREE.BoxGeometry(.085,.65+i*.11,.045).rotateZ((i-2)*.17).rotateY(i*1.9).translate((i-2)*.11,.34+i*.04,0)));
 private readonly rock=new THREE.DodecahedronGeometry(.32,0);
 private readonly wreck=combine([new THREE.BoxGeometry(1.8,.16,1.2).translate(0,.08,0),...[-.8,.8].map(x=>new THREE.BoxGeometry(.13,.8,1.2).translate(x,.4,0)),...[-.51,.51].map(z=>new THREE.BoxGeometry(1.6,.6,.13).translate(0,.3,z))]);
 private readonly coral=combine([new THREE.CylinderGeometry(.07,.13,.65,5).translate(0,.32,0),...Array.from({length:4},(_,i)=>new THREE.CylinderGeometry(.04,.07,.43,5).rotateZ(.7).rotateY(i*Math.PI/2).translate(Math.cos(i*Math.PI/2)*.15,.42,Math.sin(i*Math.PI/2)*.15))]);
 private readonly mats={alga:new THREE.MeshStandardMaterial({color:0x397f65}),minerio:new THREE.MeshStandardMaterial({color:0x8ea6b3,metalness:.3}),destroco:new THREE.MeshStandardMaterial({color:0x695340})};
 private readonly hull=combine([new THREE.BoxGeometry(4.8,.18,8).translate(0,.18,0),...[-2.3,2.3].map(x=>new THREE.BoxGeometry(.22,2.5,7.6).translate(x,1.3,0)),new THREE.BoxGeometry(4.8,.18,7.6).translate(0,2.6,0),...[-2,0,2].map(z=>new THREE.BoxGeometry(4.9,.16,.24).translate(0,2.75,z))]);
 private readonly rareChest=combine([new THREE.BoxGeometry(.85,.45,.62).translate(0,.23,0),new THREE.BoxGeometry(.9,.12,.67).translate(0,.48,0),new THREE.BoxGeometry(.16,.2,.08).translate(0,.32,.35)]);
 private readonly rareMat=new THREE.MeshStandardMaterial({color:0xc2a45c,metalness:.35,roughness:.6});
 private readonly coralMat=new THREE.MeshStandardMaterial({color:0xcd846e});private readonly dummy=new THREE.Object3D();
 constructor(private seed:number,private low:boolean){this.group.visible=false;}
 get loadedCount(){return this.tiles.size;}
 reset(seed:number,low:boolean,ids:readonly string[]=[]){this.clear();this.seed=seed;this.low=low;this.used.clear();for(const id of ids)if(validDiveId(id))this.used.add(id);}
 serialize(){return [...this.used].sort();}
 setQuality(low:boolean){if(low!==this.low)this.reset(this.seed,low,this.serialize());}
 private remove(t:Tile){this.group.remove(t.root);t.floor.geometry.dispose();for(const o of t.root.children)if(o instanceof THREE.InstancedMesh)o.dispose();t.root.clear();}
 private clear(){for(const t of this.tiles.values())this.remove(t);this.tiles.clear();}
 update(x:number,z:number,wet:boolean,budget=1){
  this.group.visible=wet;const cx=Math.floor(x/64),cz=Math.floor(z/64);
  for(const [key,t] of this.tiles){const [tx,tz]=key.split(':').map(Number);if(Math.abs(tx-cx)>1||Math.abs(tz-cz)>1){this.remove(t);this.tiles.delete(key);}}
  if(!wet)return;
  for(const [dx,dz] of [[0,0],[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]]){
   if(budget<=0)break;const tx=cx+dx,tz=cz+dz,key=tx+':'+tz;if(this.tiles.has(key))continue;
   this.tiles.set(key,this.create(tx,tz));budget--;
  }
 }
 private create(tx:number,tz:number):Tile{
  const root=new THREE.Group();root.position.set(tx*64,0,tz*64);
  const floor=new THREE.Mesh(seabedGeometry(this.seed,tx,tz,this.low?12:20),this.floorMat);root.add(floor);
  const nodes=diveNodes(this.seed,tx,tz),meshes=new Map<string,THREE.Mesh>();
  for(const n of nodes){
   if(n.kind==='destroco'&&hasWreckRoom(this.seed,n)){const hull=new THREE.Mesh(this.hull,this.mats.destroco);hull.position.set(n.x-root.position.x,n.y,n.z-root.position.z);root.add(hull);}
   if(this.used.has(n.id))continue;
   const m=new THREE.Mesh(n.kind==='alga'?this.algae:n.kind==='minerio'?this.rock:n.kind==='bau_raro'?this.rareChest:this.wreck,n.kind==='bau_raro'?this.rareMat:this.mats[n.kind]);m.position.set(n.x-root.position.x,n.y+(n.kind==='minerio'?.24:0),n.z-root.position.z);root.add(m);meshes.set(n.id,m);}
  const count=this.low?8:18,corals=new THREE.InstancedMesh(this.coral,this.coralMat,count);
  for(let i=0;i<count;i++){const x=4+(i*17.73)%56,z=4+(i*23.27)%56;this.dummy.position.set(x,seabedHeight(root.position.x+x,root.position.z+z,this.seed),z);this.dummy.rotation.set(0,i*2.1,0);this.dummy.scale.setScalar(.6+i%4*.15);this.dummy.updateMatrix();corals.setMatrixAt(i,this.dummy.matrix);}
  corals.instanceMatrix.needsUpdate=true;corals.computeBoundingSphere();root.add(corals);this.group.add(root);return {root,floor,nodes,meshes};
 }
 blocksMovement(x:number,z:number,y:number,fromX:number,fromZ:number):boolean{
  for(const t of this.tiles.values())for(const n of t.nodes)if(n.kind==='destroco'&&hasWreckRoom(this.seed,n)&&wreckWall(x,z,y,n)&&!wreckWall(fromX,fromZ,y,n))return true;
  return false;
 }
 nearest(x:number,y:number,z:number):DiveNode|null{let best:DiveNode|null=null,dist=9;for(const t of this.tiles.values())for(const n of t.nodes){if(this.used.has(n.id))continue;const d=(x-n.x)**2+(y-n.y-.4)**2+(z-n.z)**2;if(d<dist){dist=d;best=n;}}return best;}
 collect(id:string):boolean{if(this.used.has(id))return false;for(const t of this.tiles.values())if(t.nodes.some(n=>n.id===id)){this.used.add(id);const m=t.meshes.get(id);if(m)t.root.remove(m);t.meshes.delete(id);return true;}return false;}
 dispose(){this.clear();this.floorMat.dispose();this.algae.dispose();this.rock.dispose();this.wreck.dispose();this.coral.dispose();this.coralMat.dispose();this.hull.dispose();this.rareChest.dispose();this.rareMat.dispose();for(const m of Object.values(this.mats))m.dispose();}
}
