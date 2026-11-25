import * as THREE from 'three';
import { survivorClothing, survivorHead, survivorArm, survivorLeg, survivorVest } from '../render/DetailGeometry';
import { cellKey, RaftGrid } from '../raft/Grid';
import {upperFloor,architectureBlocks} from '../raft/Architecture';
import type { RaftRenderer } from '../raft/RaftRenderer';
import { getWaveHeight } from '../world/Ocean';

export interface InputSnapshot {
  forward: number; // -1..1
  strafe: number; // -1..1
  jump: boolean;
  sprint: boolean;
  yawDelta: number;
  pitchDelta: number;
}

/**
 * Controlador de 1ª/3ª pessoa com colisão local no convés da jangada, nado no oceano e retorno ao barco.
 */
export class PlayerController {
  position = new THREE.Vector3(0.4, 1.2, 0.4);
  velocity = new THREE.Vector3(0, 0, 0);
  yaw = Math.PI;
  pitch = -0.18;
  thirdPerson = false;
  grounded = false;
  private onRaft=false;
  inWater = false;
  underwater = false;

  readonly avatarGroup = new THREE.Group();
  private readonly wishVector=new THREE.Vector3();
  private readonly localA=new THREE.Vector2();private readonly localB=new THREE.Vector2();
  private readonly eyeHeight = 1.58;
  private readonly limbs: THREE.Group[] = [];
  private gait = 0;

  constructor(scene: THREE.Scene) {
    const clothing = new THREE.MeshStandardMaterial({color:0x315a71,roughness:.85});
    const trousers = new THREE.MeshStandardMaterial({color:0x293840,roughness:.88});
    const skin = new THREE.MeshStandardMaterial({color:0xd4a282,roughness:.75});
    const vest = new THREE.MeshStandardMaterial({color:0xd48236,roughness:.8});
    const add = (parent: THREE.Group, geo: THREE.BufferGeometry, mat: THREE.Material) => {
      const mesh = new THREE.Mesh(geo,mat); mesh.castShadow = true; parent.add(mesh);
    };
    add(this.avatarGroup,survivorClothing(),clothing);
    add(this.avatarGroup,survivorHead(),skin);
    add(this.avatarGroup,survivorVest(),vest);
    for(const side of [-1,1]){
      const arm = new THREE.Group(); arm.position.set(side*.28,1.32,0);
      const leg = new THREE.Group(); leg.position.set(side*.13,.67,0);
      add(arm,survivorArm(),clothing); add(leg,survivorLeg(),trousers);
      this.avatarGroup.add(arm,leg); this.limbs.push(arm,leg);
    }
    this.avatarGroup.visible = false;
    scene.add(this.avatarGroup);
  }

  toggleCameraMode(): boolean {
    this.thirdPerson = !this.thirdPerson;
    this.avatarGroup.visible = this.thirdPerson;
    return this.thirdPerson;
  }

  moveToRaftSafe(raft: RaftRenderer, grid: RaftGrid): void {
    const safe = grid.getSafeSpawnLocal();
    const wp = raft.localToWorld(safe.x, safe.y + 0.5, safe.z);
    this.position.copy(wp);
    this.velocity.set(0, 0, 0);
    this.onRaft=false;this.grounded=false;
  }

  update(
    dt: number,
    input: InputSnapshot,
    grid: RaftGrid,
    raft: RaftRenderer,
    timeSec: number,
    stormFactor: number,
    canSprint: boolean,
    raftDeltaX: number,
    raftDeltaZ: number,
    groundHeight: (x:number,z:number)=>number|null = ()=>null,
    blocksMovement:(x:number,z:number,y:number,fromX:number,fromZ:number)=>boolean=()=>false,
    raftHeadingDelta=0,
    seaFloor:(x:number,z:number)=>number=()=>-3,
    swimMultiplier=1
  ): void {
    this.yaw -= input.yawDelta;
    this.pitch = THREE.MathUtils.clamp(this.pitch - input.pitchDelta, -1.32, 1.28);

    // Se estiver em pé sobre a jangada, acompanha o deslocamento do convés
    if (this.grounded&&this.onRaft) {
      const dx=this.position.x-(raft.x-raftDeltaX),dz=this.position.z-(raft.z-raftDeltaZ);
      const c=Math.cos(raftHeadingDelta),s=Math.sin(raftHeadingDelta);
      this.position.x=raft.x+dx*c+dz*s;
      this.position.z=raft.z-dx*s+dz*c;
      this.yaw+=raftHeadingDelta;
    }

    const sy=Math.sin(this.yaw),cy=Math.cos(this.yaw);
    const wish=this.wishVector.set(-sy*input.forward+cy*input.strafe,0,-cy*input.forward-sy*input.strafe);

    if (wish.lengthSq() > 1) wish.normalize();

    const waveY = getWaveHeight(this.position.x, this.position.z, timeSec, stormFactor);
    const localCell = raft.worldToLocalGrid(this.position.x, this.position.z);
    const cellBelow = grid.foundations.get(cellKey(localCell.gx, localCell.gz));
    const deckTopY = raft.root.position.y + 0.21;

    const land=groundHeight(this.position.x,this.position.z);
    const dryLand=land!==null&&land>waveY+.03;
    this.inWater = (!cellBelow||this.position.y<deckTopY-.4) && !dryLand && this.position.y <= waveY + 0.18;
    this.underwater = this.inWater && this.position.y + this.eyeHeight < waveY + 0.05;

    const baseSpeed = this.inWater ? 3.8*swimMultiplier : input.sprint && canSprint ? 6.6 : 4.5;
    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, wish.x * baseSpeed, Math.min(1, dt * 12));
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, wish.z * baseSpeed, Math.min(1, dt * 12));

    if (this.inWater) {
      // Flutuação suave + impulso ao pular/subir para voltar à jangada
      const dive=Math.sin(this.pitch)*input.forward;
      const target=input.jump?4.6:Math.abs(dive)>.22?dive*3.4*swimMultiplier:this.position.y>waveY-.55?(waveY-.55-this.position.y)*5:0;
      this.velocity.y=THREE.MathUtils.lerp(this.velocity.y,target,Math.min(1,dt*8));
      this.grounded = false;
    } else {
      this.velocity.y -= 18.5 * dt;
      if (this.grounded && input.jump) {
        this.velocity.y = 6.8;
        this.grounded = false;
      }
    }

    const previousY=this.position.y;
    const blocked=(x:number,z:number,fx:number,fz:number)=>{const a=raft.worldToLocalXZ(x,z,this.localA),b=raft.worldToLocalXZ(fx,fz,this.localB);return architectureBlocks(grid,a.x,a.y,this.position.y-raft.root.position.y,b.x,b.y)||blocksMovement(x,z,this.position.y,fx,fz);};
    // Movimento por eixo permite deslizar ao redor de árvores e rochas.
    const nextX=this.position.x+this.velocity.x*dt;
    if(!blocked(nextX,this.position.z,this.position.x,this.position.z))this.position.x=nextX;
    else this.velocity.x=0;
    const nextZ=this.position.z+this.velocity.z*dt;
    if(!blocked(this.position.x,nextZ,this.position.x,this.position.z))this.position.z=nextZ;
    else this.velocity.z=0;
    this.position.y+=this.velocity.y*dt;

    // Colisão firme com o convés da jangada para nunca cair pelo chão
    const postCell = raft.worldToLocalGrid(this.position.x, this.position.z);
    const onFoundation = grid.foundations.has(cellKey(postCell.gx, postCell.gz));
    const landAfter=groundHeight(this.position.x,this.position.z);
    const waveAfter=getWaveHeight(this.position.x,this.position.z,timeSec,stormFactor);
    const landSurface=landAfter!==null&&landAfter>waveAfter+.03?landAfter:null;
    const canLandOnDeck=onFoundation&&this.position.y>=deckTopY-.35;
    const upper=upperFloor(grid,postCell.gx,postCell.gz);
    const upperY=upper===null?null:raft.root.position.y+upper;
    const onUpper=upperY!==null&&previousY>=upperY-.25;
    const deckSurface=onUpper?upperY!:deckTopY;
    const floor=canLandOnDeck?Math.max(deckSurface,landSurface??-Infinity):landSurface;
    if(upperY!==null&&!onUpper&&this.velocity.y>0&&previousY+this.eyeHeight<=upperY-.16&&this.position.y+this.eyeHeight>upperY-.16){this.position.y=upperY-.16-this.eyeHeight;this.velocity.y=0;}
    if (floor!==null && this.position.y <= floor + .18 && this.velocity.y <= .8) {
      this.position.y = floor;
      this.velocity.y = 0;
      this.grounded = true;
      this.onRaft=onFoundation&&deckSurface>=(landSurface??-Infinity);
      this.inWater=false;this.underwater=false;
    } else {
      this.grounded = false;this.onRaft=false;
      // Limite inferior na água para não afundar infinitamente
      const bottom=Math.max(seaFloor(this.position.x,this.position.z),landAfter??-Infinity)+.12;
      if(this.position.y<bottom){this.position.y=bottom;this.velocity.y=Math.max(0,this.velocity.y);}
      this.inWater=(!onFoundation||this.position.y<deckTopY-.35)&&landSurface===null&&this.position.y<=waveAfter+.18;
      this.underwater=this.inWater&&this.position.y+this.eyeHeight<waveAfter+.05;
    }

    // Atualizar avatar em 3ª pessoa
    this.avatarGroup.position.copy(this.position);
    this.avatarGroup.rotation.y = this.yaw;
    if (this.thirdPerson) {
      const speed = Math.hypot(this.velocity.x,this.velocity.z);
      this.gait += dt * (this.inWater ? 5 : 2.8 * speed);
      const stride = Math.sin(this.gait) * Math.min(.65,speed*.14);
      for(let i=0;i<this.limbs.length;i++){
        const target = stride * (i===0||i===3 ? 1 : -1);
        this.limbs[i].rotation.x = THREE.MathUtils.lerp(this.limbs[i].rotation.x,target,Math.min(1,dt*12));
      }
    }
  }

  applyToCamera(camera: THREE.PerspectiveCamera, bobTime: number, enableBob: boolean): void {
    const lookDir = new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    );

    const bob =
      enableBob && this.grounded && Math.hypot(this.velocity.x, this.velocity.z) > 0.6
        ? Math.sin(bobTime * 9.5) * 0.035
        : 0;

    if (this.thirdPerson) {
      const target = new THREE.Vector3(this.position.x, this.position.y + 1.45, this.position.z);
      const camPos = target.clone().addScaledVector(lookDir, -4.2);
      camPos.y = Math.max(camPos.y, target.y - 1.2);
      camera.position.copy(camPos);
      camera.lookAt(target);
    } else {
      const eye = new THREE.Vector3(this.position.x, this.position.y + this.eyeHeight + bob, this.position.z);
      camera.position.copy(eye);
      camera.lookAt(eye.clone().add(lookDir));
    }
  }
}
