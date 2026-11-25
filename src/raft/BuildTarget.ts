import * as THREE from 'three';
import type { StructureKind } from '../data/recipes';
import { RaftGrid } from './Grid';

export interface BuildTarget { gx:number; gz:number; valid:boolean; reason:string; }
export const BUILD_REACH=5.5;

/** Intersecta o raio da câmera com o plano local do convés, inclusive quando a jangada inclina. */
export class BuildTargetPicker {
  private readonly origin=new THREE.Vector3();
  private readonly direction=new THREE.Vector3();
  private readonly point=new THREE.Vector3();
  private readonly inverse=new THREE.Matrix4();
  private readonly playerLocal=new THREE.Vector3();

  pick(camera: THREE.Camera, root: THREE.Object3D, player: THREE.Vector3): {gx:number;gz:number}|null {
    root.updateWorldMatrix(true,false);
    camera.updateWorldMatrix(true,false);
    this.inverse.copy(root.matrixWorld).invert();
    camera.getWorldPosition(this.origin).applyMatrix4(this.inverse);
    camera.getWorldDirection(this.direction).transformDirection(this.inverse);
    if(Math.abs(this.direction.y)<.0001) return null;
    const t=(.19-this.origin.y)/this.direction.y;
    if(t<0 || t>18) return null;
    this.point.copy(this.origin).addScaledVector(this.direction,t);
    this.playerLocal.copy(player).applyMatrix4(this.inverse);
    const gx=Math.round(this.point.x/RaftGrid.CELL_SIZE), gz=Math.round(this.point.z/RaftGrid.CELL_SIZE);
    if(Math.hypot(gx*RaftGrid.CELL_SIZE-this.playerLocal.x,gz*RaftGrid.CELL_SIZE-this.playerLocal.z)>BUILD_REACH) return null;
    return {gx,gz};
  }
}

export function evaluateBuild(grid:RaftGrid,kind:StructureKind,gx:number,gz:number,hasMaterials:boolean):BuildTarget {
  const cell=grid.getFoundation(gx,gz);
  let reason='';
  if(kind==='fundacao'){
    if(cell) reason='Já existe madeira nesta posição.';
    else if(grid.foundations.size>=grid.maxFoundations) reason='Limite de fundações atingido.';
    else if(grid.foundations.size>0&&!grid.hasAdjacentFoundation(gx,gz)) reason='Conecte a peça à jangada.';
  } else if(!cell) reason='Precisa de uma fundação de madeira.';
  else if(kind==='borda_reforcada'&&cell.reinforced) reason='Esta fundação já está reforçada.';
  else if(kind!=='borda_reforcada'&&grid.getModuleAt(gx,gz)) reason='Já existe um equipamento neste espaço.';
  if(!reason&&!hasMaterials) reason='Materiais insuficientes.';
  return {gx,gz,valid:!reason,reason};
}
