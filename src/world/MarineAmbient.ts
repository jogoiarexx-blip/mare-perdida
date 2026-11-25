import * as THREE from 'three';
import { combine } from '../render/DetailGeometry';
import { getWaveHeight } from './Ocean';

export function ambientBudget(low: boolean) {
  return {fish:low?12:30,rain:low?72:180};
}
export function fishGeometry() {
  const tail = new THREE.ConeGeometry(.095,.19,3).rotateZ(Math.PI/2).translate(-.27,0,0);
  return combine([new THREE.SphereGeometry(1,8,5).scale(.23,.095,.065),tail]);
}
/** Decoração exclusivamente visual; sem IA, colisões, loot ou alterações no save. */
export class MarineAmbient {
  private readonly fish: THREE.InstancedMesh;
  private readonly rain: THREE.LineSegments;
  private readonly rainPositions: Float32Array;
  private readonly dummy = new THREE.Object3D();
  private readonly maxRain: number;
  private readonly maxFish: number;
  private readonly rainSeed: Float32Array;
  constructor(private readonly scene: THREE.Scene, low:boolean) {
    const budget = ambientBudget(low);
    this.maxFish=budget.fish; this.maxRain=budget.rain;
    this.fish=new THREE.InstancedMesh(fishGeometry(),new THREE.MeshStandardMaterial({color:0x8ec7b9,roughness:.55}),this.maxFish);
    this.fish.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.fish.frustumCulled=false; this.fish.visible=false;
    scene.add(this.fish);
    this.rainPositions=new Float32Array(this.maxRain*6);
    this.rainSeed=new Float32Array(this.maxRain*3);
    for(let i=0;i<this.rainSeed.length;i++) this.rainSeed[i]=(Math.sin(i*127.1+311.7)*43758.5453)%1+1;
    const rainGeo=new THREE.BufferGeometry();
    rainGeo.setAttribute('position',new THREE.BufferAttribute(this.rainPositions,3).setUsage(THREE.DynamicDrawUsage));
    this.rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0xa9d0e3,transparent:true,opacity:.32,depthWrite:false}));
    this.rain.frustumCulled=false; this.rain.visible=false; scene.add(this.rain);
  }
  update(x:number,z:number,y:number,t:number,storm:number,low:boolean) {
    const budget=ambientBudget(low);
    // A água é opaca: cardumes são úteis durante o mergulho, sem desenhar peixes ocultos acima dela.
    this.fish.position.set(x,0,z);
    this.rain.position.set(x,y,z);
    this.fish.visible=y < getWaveHeight(x,z,t,storm)+.08;
    if(this.fish.visible){
      this.fish.count=Math.min(budget.fish,this.maxFish);
      for(let i=0;i<this.fish.count;i++){
        const school=Math.floor(i/6), a=t*.36+school*2.1+i*.32;
        const r=3.5+school*2+i%3*.38;
        const fx=x+Math.cos(a)*r, fz=z+Math.sin(a)*r;
        this.dummy.position.set(fx-x,getWaveHeight(fx,fz,t,storm)-.65-school*.25-Math.sin(i)*.16,fz-z);
        this.dummy.rotation.set(0,-a-Math.PI/2,0);
        this.dummy.scale.setScalar(.8+(i%4)*.12);
        this.dummy.updateMatrix(); this.fish.setMatrixAt(i,this.dummy.matrix);
      }
      this.fish.instanceMatrix.needsUpdate=true;
    }
    this.rain.visible=storm>.04&&!this.fish.visible;
    if(this.rain.visible){
      const count=Math.min(budget.rain,this.maxRain,Math.ceil(this.maxRain*Math.min(1,storm/.45)));
      this.rain.geometry.setDrawRange(0,count*2);
      for(let i=0;i<count;i++){
        const s=i*3,p=i*6;
        const px=(this.rainSeed[s]-.95)*22;
        const pz=(this.rainSeed[s+1]-.95)*22;
        const height=((this.rainSeed[s+2]*11-t*13)%11+11)%11;
        const py=-2+height;
        this.rainPositions[p]=px; this.rainPositions[p+1]=py; this.rainPositions[p+2]=pz;
        this.rainPositions[p+3]=px+.13; this.rainPositions[p+4]=py+.68; this.rainPositions[p+5]=pz+.05;
      }
      this.rain.geometry.getAttribute('position').needsUpdate=true;
    }
  }
  dispose(){
    this.scene.remove(this.fish,this.rain);
    this.fish.geometry.dispose(); (this.fish.material as THREE.Material).dispose();
    this.fish.dispose();
    this.rain.geometry.dispose(); (this.rain.material as THREE.Material).dispose();
  }
}
