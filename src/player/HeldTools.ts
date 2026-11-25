import * as THREE from 'three';
import { combine } from '../render/DetailGeometry';
import { hookGeometry } from '../render/EquipmentGeometry';

const box=(w:number,h:number,d:number,x=0,y=0,z=0)=>new THREE.BoxGeometry(w,h,d).translate(x,y,z);
const rod=(r:number,l:number,y=0)=>new THREE.CylinderGeometry(r,r,l,6).translate(0,y,0);
export const heldToolIds=['gancho','lanca','machado','martelo_reparo','vara_pesca','lanterna_mergulho','binoculo'] as const;
type ToolId=typeof heldToolIds[number];
export function heldToolGeometry(id:ToolId):THREE.BufferGeometry {
  switch(id){
    case 'gancho':return combine([hookGeometry(),rod(.045,.28,-.11)]);
    case 'lanca':return combine([rod(.028,1.12,.36),new THREE.ConeGeometry(.071,.25,5).translate(0,1.04,0)]);
    case 'machado':return combine([rod(.039,.57,.20),box(.26,.17,.075,.095,.46,0),new THREE.CylinderGeometry(.065,.065,.14,6).translate(0,.44,0)]);
    case 'martelo_reparo':return combine([rod(.042,.48,.14),box(.29,.13,.13,0,.38,0)]);
    case 'vara_pesca':return combine([new THREE.CylinderGeometry(.014,.035,1.12,6).translate(0,.45,0),new THREE.CylinderGeometry(.075,.075,.065,8).rotateX(Math.PI/2).translate(.06,.12,0)]);
    case 'lanterna_mergulho':return combine([rod(.069,.26,.1),new THREE.CylinderGeometry(.096,.072,.09,8).translate(0,.27,0)]);
    case 'binoculo':return combine([rod(.075,.23,.09).translate(-.09,0,0),rod(.075,.23,.09).translate(.09,0,0),box(.15,.06,.08,0,.07,0)]);
  }
}
/** Um único modelo visível por vez; segue a câmera ou a mão sem alterar alcance/colisões. */
export class HeldTools {
  readonly root=new THREE.Group();
  private readonly models=new Map<string,THREE.Mesh>();
  private readonly material=new THREE.MeshStandardMaterial({color:0x8c9da2,roughness:.68,metalness:.20});
  private active:string|null=null;
  private swing=0;
  private actionId:string|null=null;
  private readonly offset=new THREE.Vector3();
  constructor(private readonly scene:THREE.Scene){
    this.root.visible=false;scene.add(this.root);
  }
  trigger(id:string|undefined){
    if(id&&heldToolIds.includes(id as ToolId)){this.actionId=id;this.swing=.28;}
  }
  update(id:string|undefined,thirdPerson:boolean,hand:THREE.Group,camera:THREE.PerspectiveCamera,dt:number,time:number,moving:boolean,hide:boolean){
    const key=id&&heldToolIds.includes(id as ToolId)?id:null;
    if(key!==this.active){
      if(this.active)this.models.get(this.active)!.visible=false;
      this.active=key;
      if(key){
        let mesh=this.models.get(key);
        if(!mesh){mesh=new THREE.Mesh(heldToolGeometry(key as ToolId),this.material);this.models.set(key,mesh);this.root.add(mesh);}
        mesh.visible=true;
      }
      if(key!==this.actionId)this.swing=0;
    }
    this.swing=Math.max(0,this.swing-dt);
    this.root.visible=Boolean(key)&&!hide;
    if(!this.root.visible)return;
    const hit=Math.sin(Math.PI*this.swing/.28);
    const sway=moving?Math.sin(time*8)*.025:0;
    if(thirdPerson){
      if(this.root.parent!==hand)hand.add(this.root);
      this.root.position.set(0,-.54,-.035);
      this.root.rotation.set(-1.12-hit*.95,0,.10);
      this.root.scale.setScalar(.82);
    }else{
      if(this.root.parent!==this.scene)this.scene.add(this.root);
      // A câmera não é filha da cena: compatível com RenderOrigin.
      this.offset.set(.31+sway,-.29+Math.abs(sway)*.4,-.64-hit*.11).applyQuaternion(camera.quaternion);
      this.root.position.copy(camera.position).add(this.offset);
      this.root.quaternion.copy(camera.quaternion);
      this.root.rotateX(-.84-hit*.85);
      this.root.rotateZ(-.24);
      this.root.scale.setScalar(.53);
    }
  }
  dispose(){this.root.removeFromParent();for(const mesh of this.models.values())mesh.geometry.dispose();this.models.clear();this.material.dispose();}
}
