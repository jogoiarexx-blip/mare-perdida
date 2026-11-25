import * as THREE from 'three';
import { chunkAt,chunkKey,chunkRadius,desiredChunks,islandForChunk,islandHeight,type IslandSpec } from './ChunkLayout';
import { islandTerrain,palmCrown } from './IslandGeometry';
import {resourcesForIsland,validResourceId,blocksResourceMovement,type IslandResource,type ResourceKind} from './IslandResources';

interface LoadedChunk {cx:number;cz:number;island: IslandView|null;}
interface IslandView {spec:IslandSpec;root:THREE.Group;terrain:THREE.Mesh;near:THREE.BufferGeometry;far:THREE.BufferGeometry;decor:THREE.Group;detailed:boolean;resources:IslandResource[];batches:Map<ResourceKind,THREE.InstancedMesh[]>;}
/** Streaming incremental; ilhas vazias não criam objetos de renderização. */
export class ChunkManager {
  readonly group=new THREE.Group();
  private readonly chunks=new Map<string,LoadedChunk>();
  private seed:number;
  private readonly depleted=new Set<string>();
  private readonly bushGeo=new THREE.IcosahedronGeometry(.68,0);
  private readonly bushMat=new THREE.MeshStandardMaterial({color:0x629944,roughness:1});
  private readonly chestGeo=new THREE.BoxGeometry(.95,.63,.66);
  private readonly chestMat=new THREE.MeshStandardMaterial({color:0xb27a45,roughness:.85});
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
  reset(seed:number,low=this.low,depleted:readonly string[]=[]){for(const c of this.chunks.values())this.unload(c);this.chunks.clear();this.seed=seed;this.low=low;this.depleted.clear();for(const id of depleted)if(validResourceId(id))this.depleted.add(id);}
  serializeResources():string[]{return [...this.depleted].sort();}
  setQuality(low:boolean){if(this.low!==low)this.reset(this.seed,low,this.serializeResources());}
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
  nearestResource(x:number,z:number,y:number,reach=2.2):IslandResource|null{
    const {cx,cz}=chunkAt(x,z);const v=this.chunks.get(chunkKey(cx,cz))?.island;
    if(!v)return null;
    let best:IslandResource|null=null,dist=reach*reach;
    for(const n of v.resources){
      if(this.depleted.has(n.id)||Math.abs(n.y-y)>1.9)continue;
      const d=(n.x-x)**2+(n.z-z)**2;if(d<dist){best=n;dist=d;}
    }
    return best;
  }
  harvest(id:string):boolean{
    if(this.depleted.has(id))return false;
    for(const c of this.chunks.values()){
      const v=c.island;if(v?.resources.some(n=>n.id===id)){
        this.depleted.add(id);this.refreshResources(v);return true;
      }
    }
    return false;
  }
  blocksMovement(x:number,z:number,y:number,fromX:number,fromZ:number):boolean{
    const {cx,cz}=chunkAt(x,z);const v=this.chunks.get(chunkKey(cx,cz))?.island;
    return v?blocksResourceMovement(v.resources,this.depleted,x,z,y,fromX,fromZ):false;
  }
  private refreshResources(v:IslandView):void{
    for(const [kind,batches] of v.batches){
      let i=0;
      for(const p of v.resources){
        if(p.kind!==kind||this.depleted.has(p.id))continue;
        const x=p.x-v.spec.x,z=p.z-v.spec.z;
        this.dummy.rotation.set(0,p.angle,0);this.dummy.scale.setScalar(p.scale);
        if(kind==='palm'){
          this.dummy.position.set(x,p.y+1.32*p.scale,z);this.dummy.updateMatrix();batches[0].setMatrixAt(i,this.dummy.matrix);
          this.dummy.position.y=p.y+2.7*p.scale;this.dummy.updateMatrix();batches[1].setMatrixAt(i,this.dummy.matrix);
        }else{
          this.dummy.position.set(x,p.y+(kind==='chest'?.315:.2)*p.scale,z);
          if(kind==='rock')this.dummy.scale.set(p.scale,p.scale*.65,p.scale);
          if(kind==='bush')this.dummy.scale.set(p.scale,p.scale*.7,p.scale);
          this.dummy.updateMatrix();batches[0].setMatrixAt(i,this.dummy.matrix);
        }
        i++;
      }
      for(const mesh of batches){mesh.count=i;mesh.visible=i>0;mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}
    }
  }
  private createIsland(spec:IslandSpec):IslandView{
    const root=new THREE.Group();root.position.set(spec.x,0,spec.z);
    const near=islandTerrain(spec,this.low?24:40),far=islandTerrain(spec,12);
    const terrain=new THREE.Mesh(far,this.terrainMat);root.add(terrain);
    const decor=new THREE.Group();decor.visible=false;root.add(decor);
    const resources=resourcesForIsland(spec);
    const batches=new Map<ResourceKind,THREE.InstancedMesh[]>();
    const add=(kind:ResourceKind,geometry:THREE.BufferGeometry,material:THREE.Material)=>{
      const mesh=new THREE.InstancedMesh(geometry,material,resources.filter(r=>r.kind===kind).length);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const list=batches.get(kind)??[];list.push(mesh);batches.set(kind,list);decor.add(mesh);
    };
    add('palm',this.trunkGeo,this.trunkMat);add('palm',this.crownGeo,this.crownMat);
    add('rock',this.rockGeo,this.rockMat);add('bush',this.bushGeo,this.bushMat);add('chest',this.chestGeo,this.chestMat);
    this.group.add(root);
    const view:IslandView={spec,root,terrain,near,far,decor,detailed:false,resources,batches};
    this.refreshResources(view);return view;
  }
  private unload(c:LoadedChunk){
    const v=c.island;if(!v)return;
    this.group.remove(v.root);v.near.dispose();v.far.dispose();
    for(const obj of v.decor.children)if(obj instanceof THREE.InstancedMesh)obj.dispose();
    v.root.clear();
  }
  dispose(){this.reset(this.seed);this.terrainMat.dispose();this.trunkGeo.dispose();this.crownGeo.dispose();this.rockGeo.dispose();this.trunkMat.dispose();this.crownMat.dispose();this.rockMat.dispose();this.bushGeo.dispose();this.bushMat.dispose();this.chestGeo.dispose();this.chestMat.dispose();}
}
