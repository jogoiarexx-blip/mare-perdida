import * as THREE from 'three';
import { chunkAt,chunkKey,chunkRadius,desiredChunks,islandForChunk,islandHeight,type IslandSpec } from './ChunkLayout';
import { islandTerrain,islandDecor,palmCrown } from './IslandGeometry';

interface LoadedChunk {cx:number;cz:number;island: IslandView|null;}
interface IslandView {spec:IslandSpec;root:THREE.Group;terrain:THREE.Mesh;near:THREE.BufferGeometry;far:THREE.BufferGeometry;decor:THREE.Group;detailed:boolean;}
/** Streaming incremental; ilhas vazias não criam objetos de renderização. */
export class ChunkManager {
  readonly group=new THREE.Group();
  private readonly chunks=new Map<string,LoadedChunk>();
  private seed:number;
  private low:boolean;
  private readonly terrainMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});
  private readonly trunkGeo=new THREE.CylinderGeometry(.085,.18,2.8,6);
  private readonly crownGeo=palmCrown();
  private readonly rockGeo=new THREE.DodecahedronGeometry(.7,0);
  private readonly trunkMat=new THREE.MeshStandardMaterial({color:0x8d6744,roughness:.95});
  private readonly crownMat=new THREE.MeshStandardMaterial({color:0x46844b,roughness:.9,side:THREE.DoubleSide});
  private readonly rockMat=new THREE.MeshStandardMaterial({color:0x827b6d,roughness:1});
  private readonly dummy=new THREE.Object3D();
  constructor(seed:number,low:boolean){this.seed=seed;this.low=low;}
  get loadedCount(){return this.chunks.size;}
  get islandCount(){let n=0;for(const c of this.chunks.values())if(c.island)n++;return n;}
  reset(seed:number,low=this.low){for(const c of this.chunks.values())this.unload(c);this.chunks.clear();this.seed=seed;this.low=low;}
  setQuality(low:boolean){if(this.low!==low)this.reset(this.seed,low);}
  update(x:number,z:number,budget=1){
    const center=chunkAt(x,z),radius=chunkRadius(this.low);
    for(const [key,c] of this.chunks){
      if(Math.max(Math.abs(c.cx-center.cx),Math.abs(c.cz-center.cz))>radius+1){this.unload(c);this.chunks.delete(key);}
    }
    for(const target of desiredChunks(x,z,radius)){
      if(budget<=0)break;
      const key=chunkKey(target.cx,target.cz);
      if(this.chunks.has(key))continue;
      const spec=islandForChunk(this.seed,target.cx,target.cz);
      this.chunks.set(key,{...target,island:spec?this.createIsland(spec):null});budget--;
    }
    for(const c of this.chunks.values()){
      const v=c.island;if(!v)continue;
      const dist=Math.hypot(v.spec.x-x,v.spec.z-z)-v.spec.radius;
      v.root.visible=dist<105;
      const detailed=dist<(v.detailed?58:48);
      if(detailed!==v.detailed){
        v.detailed=detailed;v.terrain.geometry=detailed?v.near:v.far;v.decor.visible=detailed;
      }
      // Solo distante não participa da passagem de sombras.
      v.terrain.receiveShadow=detailed;
    }
  }
  /** Colisão usa layout determinístico, não depende da fila gráfica. */
  groundHeight(x:number,z:number):number|null{
    const {cx,cz}=chunkAt(x,z);
    const key=chunkKey(cx,cz);
    const loaded=this.chunks.get(key);
    const spec=loaded?loaded.island?.spec??null:islandForChunk(this.seed,cx,cz);
    return spec?islandHeight(spec,x,z):null;
  }
  /** Bloqueio inicial do centro da jangada em terra; casco completo será etapa posterior. */
  blocksRaft(x:number,z:number):boolean{
    const h=this.groundHeight(x,z);return h!==null&&h>.35;
  }
  nearestIsland(x:number,z:number):IslandSpec|null{
    let best:IslandSpec|null=null,dist=Infinity;
    for(const c of this.chunks.values())if(c.island){
      const v=c.island.spec,d=(v.x-x)**2+(v.z-z)**2;
      if(d<dist){dist=d;best=v;}
    }
    return best;
  }
  private createIsland(spec:IslandSpec):IslandView{
    const root=new THREE.Group();root.position.set(spec.x,0,spec.z);
    const near=islandTerrain(spec,this.low?24:40),far=islandTerrain(spec,12);
    const terrain=new THREE.Mesh(far,this.terrainMat);root.add(terrain);
    const decor=new THREE.Group();decor.visible=false;root.add(decor);
    const palms=islandDecor(spec,this.low?7:13,'palm');
    const trunks=new THREE.InstancedMesh(this.trunkGeo,this.trunkMat,palms.length);
    const crowns=new THREE.InstancedMesh(this.crownGeo,this.crownMat,palms.length);
    for(let i=0;i<palms.length;i++){
      const p=palms[i];this.dummy.rotation.set(0,p.angle,0);this.dummy.scale.setScalar(p.scale);
      this.dummy.position.set(p.x,p.y+1.32*p.scale,p.z);this.dummy.updateMatrix();trunks.setMatrixAt(i,this.dummy.matrix);
      this.dummy.position.y=p.y+2.7*p.scale;this.dummy.updateMatrix();crowns.setMatrixAt(i,this.dummy.matrix);
    }
    trunks.instanceMatrix.needsUpdate=true;crowns.instanceMatrix.needsUpdate=true;
    trunks.computeBoundingSphere();crowns.computeBoundingSphere();
    const rocks=islandDecor(spec,this.low?5:10,'rock');
    const stones=new THREE.InstancedMesh(this.rockGeo,this.rockMat,rocks.length);
    for(let i=0;i<rocks.length;i++){
      const p=rocks[i];this.dummy.position.set(p.x,p.y+.2*p.scale,p.z);
      this.dummy.rotation.set(.18,p.angle,.12);this.dummy.scale.set(p.scale,p.scale*.65,p.scale);this.dummy.updateMatrix();stones.setMatrixAt(i,this.dummy.matrix);
    }
    stones.instanceMatrix.needsUpdate=true;stones.computeBoundingSphere();
    decor.add(trunks,crowns,stones);this.group.add(root);
    return {spec,root,terrain,near,far,decor,detailed:false};
  }
  private unload(c:LoadedChunk){
    const v=c.island;if(!v)return;
    this.group.remove(v.root);v.near.dispose();v.far.dispose();
    for(const obj of v.decor.children)if(obj instanceof THREE.InstancedMesh)obj.dispose();
    v.root.clear();
  }
  dispose(){this.reset(this.seed);this.terrainMat.dispose();this.trunkGeo.dispose();this.crownGeo.dispose();this.rockGeo.dispose();this.trunkMat.dispose();this.crownMat.dispose();this.rockMat.dispose();}
}
