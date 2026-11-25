import * as THREE from 'three';
import {CHUNK_SIZE} from './ChunkLayout';

export const ORIGIN_THRESHOLD=512;
/** A simulação e o save continuam em coordenadas globais (Number/Float64).
 * Apenas a passagem de render usa uma origem próxima ao jogador.
 * A mudança ocorre em múltiplos do tamanho de chunk, sem mover entidades lógicas.
 */
export class RenderOrigin {
  x=0;z=0;shifts=0;
  private readonly savedScene=new THREE.Vector3();
  private readonly savedCamera=new THREE.Vector3();
  reset(){this.x=0;this.z=0;this.shifts=0;}
  update(x:number,z:number):boolean{
    if(Math.abs(x-this.x)<=ORIGIN_THRESHOLD&&Math.abs(z-this.z)<=ORIGIN_THRESHOLD)return false;
    this.x=Math.round(x/CHUNK_SIZE)*CHUNK_SIZE;
    this.z=Math.round(z/CHUNK_SIZE)*CHUNK_SIZE;
    this.shifts++;return true;
  }
  /** Cena e câmera voltam ao espaço lógico mesmo se o renderer lançar erro.
   * Câmera não deve ser filha da cena: o Game usa câmera independente.
   */
  render(scene:THREE.Scene,camera:THREE.Camera,draw:()=>void):void{
    if(this.x===0&&this.z===0){draw();return;}
    this.savedScene.copy(scene.position);this.savedCamera.copy(camera.position);
    scene.position.x-=this.x;scene.position.z-=this.z;
    camera.position.x-=this.x;camera.position.z-=this.z;
    try{draw();}
    finally{
      scene.position.copy(this.savedScene);camera.position.copy(this.savedCamera);
      scene.updateWorldMatrix(false,false);
      camera.updateMatrixWorld(true);
      // Os descendentes são atualizados na próxima passagem ou consulta explícita.
    }
  }
}
