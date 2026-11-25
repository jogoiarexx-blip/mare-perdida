import * as THREE from 'three';
import {SeededRng} from '../core/SeededRng';
import {islandHeight,type IslandSpec} from '../world/ChunkLayout';
import {combine} from '../render/DetailGeometry';

export type AnimalKind='caranguejo'|'javali';
export type AnimalState='patrulha'|'persegue'|'prepara'|'recupera'|'retorna'|'morto';
export interface AnimalDef {id:string;kind:AnimalKind;x:number;y:number;z:number;}
export interface AnimalDelta {id:string;x:number;z:number;claimed:boolean;}
export const ANIMALS={
  caranguejo:{name:'Caranguejo',hp:35,damage:7,speed:1.35,alert:5,reach:1.25,meat:1},
  javali:{name:'Javali',hp:80,damage:16,speed:3.2,alert:10,reach:1.65,meat:3}
} as const;
export function islandAnimals(spec:IslandSpec):AnimalDef[]{
  const rng=new SeededRng(spec.seed+':fauna:v1');
  return Array.from({length:3},(_,i)=>{
    const kind:AnimalKind=i===2?'javali':'caranguejo';
    const angle=rng.range(0,Math.PI*2),r=spec.radius*rng.range(kind==='javali'?.22:.55,kind==='javali'?.47:.72);
    const x=spec.x+Math.cos(angle)*r,z=spec.z+Math.sin(angle)*r;
    return {id:spec.id+':animal:'+i,kind,x,z,y:islandHeight(spec,x,z)!};
  });
}
export function validAnimalDelta(v:unknown):v is AnimalDelta{
  if(!v||typeof v!=='object')return false;
  const a=v as Partial<AnimalDelta>;
  return typeof a.id==='string'&&/^island:-?\d{1,9}:-?\d{1,9}:animal:[0-2]$/.test(a.id)&&typeof a.x==='number'&&Number.isFinite(a.x)&&typeof a.z==='number'&&Number.isFinite(a.z)&&typeof a.claimed==='boolean';
}
export function animalGeometry(kind:AnimalKind):THREE.BufferGeometry{
  const parts:THREE.BufferGeometry[]=[];
  const oval=(x:number,y:number,z:number,sx:number,sy:number,sz:number)=>new THREE.SphereGeometry(1,8,5).scale(sx,sy,sz).translate(x,y,z);
  if(kind==='caranguejo'){
    parts.push(oval(0,.19,0,.34,.19,.29));
    for(const side of [-1,1]){
      for(let i=0;i<3;i++)parts.push(new THREE.BoxGeometry(.32,.06,.075).rotateY(side*(i-1)*.28).translate(side*.38,.10,(i-1)*.16));
      parts.push(oval(side*.35,.19,.3,.17,.12,.19),oval(side*.13,.37,.14,.05,.065,.05));
    }
  }else{
    parts.push(oval(0,.55,0,.34,.39,.65),oval(0,.51,.59,.27,.26,.30),oval(0,.41,.84,.19,.14,.14));
    for(const x of [-.23,.23])for(const z of [-.37,.35])parts.push(new THREE.BoxGeometry(.13,.42,.15).translate(x,.21,z));
    for(const x of [-.18,.18])parts.push(new THREE.ConeGeometry(.09,.24,4).translate(x,.8,.52));
  }
  return combine(parts);
}
interface Actor {def:AnimalDef;mesh:THREE.Mesh;hp:number;state:AnimalState;timer:number;angle:number;bag:THREE.Mesh;}
/** Só uma ilha ativa; a simulação distante é suspensa. Mortes e loot são deltas persistentes. */
export class IslandFauna {
  readonly group=new THREE.Group();
  private readonly dead=new Map<string,AnimalDelta>();
  private readonly actors:Actor[]=[];
  private island:IslandSpec|null=null;
  private readonly crabGeo=animalGeometry('caranguejo');
  private readonly boarGeo=animalGeometry('javali');
  private readonly bagGeo=new THREE.BoxGeometry(.35,.24,.35);
  private readonly bagMat=new THREE.MeshStandardMaterial({color:0xd7b06f,roughness:1});
  private readonly normal={caranguejo:new THREE.MeshStandardMaterial({color:0xbb513b,roughness:.84}),javali:new THREE.MeshStandardMaterial({color:0x73503a,roughness:1})};
  private readonly alertMat=new THREE.MeshStandardMaterial({color:0xe5a03c,emissive:0x6b2905,roughness:.8});
  private attackCooldown=0;
  get activeCount(){return this.actors.filter(a=>a.state!=='morto').length;}
  reset(deltas:readonly AnimalDelta[]=[]){this.clear();this.dead.clear();for(const d of deltas)if(validAnimalDelta(d))this.dead.set(d.id,{...d});this.attackCooldown=0;}
  serialize():AnimalDelta[]{return [...this.dead.values()].map(d=>({...d}));}
  private clear(){this.group.clear();this.actors.length=0;this.island=null;}
  private activate(spec:IslandSpec){
    this.clear();this.island=spec;
    for(const def of islandAnimals(spec)){
      const d=this.dead.get(def.id);
      if(d?.claimed)continue;
      const mesh=new THREE.Mesh(def.kind==='caranguejo'?this.crabGeo:this.boarGeo,this.normal[def.kind]);
      const bag=new THREE.Mesh(this.bagGeo,this.bagMat);bag.visible=Boolean(d);
      mesh.position.set(def.x,def.y,def.z);mesh.visible=!d;
      if(d){const height=islandHeight(spec,d.x,d.z);bag.position.set(height===null?def.x:d.x,(height??def.y)+.12,height===null?def.z:d.z);}
      this.group.add(mesh,bag);
      this.actors.push({def,mesh,bag,hp:d?0:ANIMALS[def.kind].hp,state:d?'morto':'patrulha',timer:0,angle:0});
    }
  }
  update(dt:number,spec:IslandSpec|null,player:THREE.Vector3,playerOnLand:boolean,damage:(amount:number,name:string)=>void,blocked:(x:number,z:number,y:number,fromX:number,fromZ:number)=>boolean=()=>false){
    this.attackCooldown=Math.max(0,this.attackCooldown-dt);
    if(!spec||Math.hypot(player.x-spec.x,player.z-spec.z)>spec.radius+24){if(this.island)this.clear();return;}
    if(this.island?.id!==spec.id)this.activate(spec);
    for(const a of this.actors){
      if(a.state==='morto'){
        if(a.timer>0){a.timer=Math.max(0,a.timer-dt);if(a.timer===0){a.mesh.visible=false;a.bag.visible=!this.dead.get(a.def.id)?.claimed;}}
        continue;
      }
      const p=a.mesh.position,d=ANIMALS[a.def.kind],dist=Math.hypot(player.x-p.x,player.z-p.z);
      const homeDist=Math.hypot(p.x-a.def.x,p.z-a.def.z);
      if(a.state==='prepara'){
        a.timer-=dt;
        if(a.timer<=0){
          if(playerOnLand&&dist<=d.reach+.2&&Math.abs(player.y-p.y)<1.5)damage(d.damage,d.name);
          a.state='recupera';a.timer=1.4;a.mesh.material=this.normal[a.def.kind];
        }
        continue;
      }
      if(a.state==='recupera'){a.timer-=dt;if(a.timer<=0)a.state='patrulha';continue;}
      if(dist>24&&homeDist<1)continue;
      const chase=playerOnLand&&dist<d.alert&&homeDist<12&&Math.abs(player.y-p.y)<3;
      if(chase&&dist<d.reach){a.state='prepara';a.timer=.75;a.mesh.material=this.alertMat;continue;}
      let tx:number,tz:number,speed:number;
      if(chase){a.state='persegue';tx=player.x;tz=player.z;speed=d.speed;}
      else if(homeDist>5){a.state='retorna';tx=a.def.x;tz=a.def.z;speed=d.speed*.7;}
      else{a.state='patrulha';a.angle+=dt*.45;tx=a.def.x+Math.cos(a.angle)*2;tz=a.def.z+Math.sin(a.angle)*2;speed=d.speed*.42;}
      const dx=tx-p.x,dz=tz-p.z,mag=Math.hypot(dx,dz);
      if(mag<.04)continue;
      const step=Math.min(mag,speed*dt),nx=p.x+dx/mag*step,nz=p.z+dz/mag*step;
      const y=islandHeight(spec,nx,nz);
      if(y!==null&&y>.45&&!blocked(nx,nz,y,p.x,p.z)){p.set(nx,y,nz);a.mesh.rotation.y=Math.atan2(dx,dz);}
      else {a.angle+=.4;a.state='retorna';}
    }
  }
  nearestThreat(p:THREE.Vector3,range=3):Actor|null{
    let best:Actor|null=null,dist=range*range;
    for(const a of this.actors){if(a.state==='morto'||Math.abs(a.mesh.position.y-p.y)>2)continue;
      const d=(a.mesh.position.x-p.x)**2+(a.mesh.position.z-p.z)**2;if(d<dist){dist=d;best=a;}}
    return best;
  }
  warning(p:THREE.Vector3):string|null{
    const a=this.nearestThreat(p,5);
    if(!a)return null;
    return ANIMALS[a.def.kind].name+' · '+a.hp+' HP'+(a.state==='prepara'?' — ataque iminente!':'');
  }
  strike(p:THREE.Vector3):{name:string;hp:number;killed:boolean;hit:boolean}|null{
    const a=this.nearestThreat(p,3.2);if(!a)return null;
    const name=ANIMALS[a.def.kind].name;
    if(this.attackCooldown>0)return {name,hp:a.hp,killed:false,hit:false};
    this.attackCooldown=.55;a.hp=Math.max(0,a.hp-25);
    if(a.hp===0){
      const pos=a.mesh.position;a.state='morto';a.timer=5;a.mesh.material=this.normal[a.def.kind];a.mesh.rotation.z=Math.PI/2;
      this.dead.set(a.def.id,{id:a.def.id,x:pos.x,z:pos.z,claimed:false});
      a.bag.position.set(pos.x,pos.y+.12,pos.z);
    }else{a.state='recupera';a.timer=.45;a.mesh.material=this.normal[a.def.kind];}
    return {name,hp:a.hp,killed:a.hp===0,hit:true};
  }
  nearestLoot(p:THREE.Vector3):{id:string;count:number}|null{
    for(const a of this.actors)if(a.bag.visible&&a.bag.position.distanceToSquared(p)<2.5**2)return {id:a.def.id,count:ANIMALS[a.def.kind].meat};
    return null;
  }
  claim(id:string):boolean{
    const d=this.dead.get(id),a=this.actors.find(v=>v.def.id===id);
    if(!d||d.claimed||!a?.bag.visible)return false;
    d.claimed=true;a.bag.visible=false;return true;
  }
  dispose(){this.clear();this.crabGeo.dispose();this.boarGeo.dispose();this.bagGeo.dispose();this.bagMat.dispose();this.normal.caranguejo.dispose();this.normal.javali.dispose();this.alertMat.dispose();}
}
