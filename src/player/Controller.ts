import * as THREE from 'three';
import { survivorClothing, survivorHead, survivorArm, survivorLeg, survivorVest } from '../render/DetailGeometry';
import { cellKey, RaftGrid } from '../raft/Grid';
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
  inWater = false;
  underwater = false;

  readonly avatarGroup = new THREE.Group();
  private readonly wishVector=new THREE.Vector3();
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
    raftDeltaZ: number
  ): void {
    this.yaw -= input.yawDelta;
    this.pitch = THREE.MathUtils.clamp(this.pitch - input.pitchDelta, -1.32, 1.28);

    // Se estiver em pé sobre a jangada, acompanha o deslocamento do convés
    if (this.grounded) {
      this.position.x += raftDeltaX;
      this.position.z += raftDeltaZ;
    }

    const sy=Math.sin(this.yaw),cy=Math.cos(this.yaw);
    const wish=this.wishVector.set(-sy*input.forward+cy*input.strafe,0,-cy*input.forward-sy*input.strafe);

    if (wish.lengthSq() > 1) wish.normalize();

    const waveY = getWaveHeight(this.position.x, this.position.z, timeSec, stormFactor);
    const localCell = raft.worldToLocalGrid(this.position.x, this.position.z);
    const cellBelow = grid.foundations.get(cellKey(localCell.gx, localCell.gz));
    const deckTopY = raft.root.position.y + 0.21;

    this.inWater = !cellBelow && this.position.y <= waveY + 0.18;
    this.underwater = this.inWater && this.position.y + this.eyeHeight < waveY + 0.05;

    const baseSpeed = this.inWater ? 3.8 : input.sprint && canSprint ? 6.6 : 4.5;
    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, wish.x * baseSpeed, Math.min(1, dt * 12));
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, wish.z * baseSpeed, Math.min(1, dt * 12));

    if (this.inWater) {
      // Flutuação suave + impulso ao pular/subir para voltar à jangada
      const targetWaterY = waveY - 0.55;
      const buoyancy = (targetWaterY - this.position.y) * 9.5;
      this.velocity.y = THREE.MathUtils.lerp(this.velocity.y, buoyancy, Math.min(1, dt * 6));
      if (input.jump) {
        this.velocity.y = 4.6;
      }
      this.grounded = false;
    } else {
      this.velocity.y -= 18.5 * dt;
      if (this.grounded && input.jump) {
        this.velocity.y = 6.8;
        this.grounded = false;
      }
    }

    this.position.addScaledVector(this.velocity, dt);

    // Colisão firme com o convés da jangada para nunca cair pelo chão
    const postCell = raft.worldToLocalGrid(this.position.x, this.position.z);
    const onFoundation = grid.foundations.has(cellKey(postCell.gx, postCell.gz));
    if (onFoundation && this.position.y <= deckTopY + 0.14 && this.velocity.y <= 0.8) {
      this.position.y = deckTopY;
      this.velocity.y = 0;
      this.grounded = true;
    } else if (!onFoundation) {
      this.grounded = false;
      // Limite inferior na água para não afundar infinitamente
      if (this.position.y < waveY - 3.0) {
        this.position.y = waveY - 3.0;
        this.velocity.y = Math.max(0, this.velocity.y);
      }
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
