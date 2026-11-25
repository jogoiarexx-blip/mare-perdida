import * as THREE from 'three';
import { hookGeometry } from '../render/EquipmentGeometry';
import type { SectorManager } from '../world/SectorManager';
import { getWaveHeight } from '../world/Ocean';

export interface HookThrowState {
  active: boolean;
  reeling: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  caughtIds: string[];
}

/**
 * Gerencia o arremesso e recolhimento do gancho de coleta com linha visual em 3D.
 */
export class HookController {
  state: HookThrowState = {
    active: false,
    reeling: false,
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    caughtIds: [],
  };

  private readonly hookMesh: THREE.Mesh;
  private readonly ropeLine: THREE.Line;
  private readonly ropePositions = new Float32Array(6);
  private readonly toPlayer=new THREE.Vector3();

  constructor(scene: THREE.Scene) {
    this.hookMesh = new THREE.Mesh(
      hookGeometry(),
      new THREE.MeshStandardMaterial({ color: 0xd0d7de, metalness: 0.65, roughness: 0.35 })
    );
    this.hookMesh.visible = false;
    scene.add(this.hookMesh);

    const ropeGeo = new THREE.BufferGeometry();
    ropeGeo.setAttribute('position', new THREE.BufferAttribute(this.ropePositions, 3));
    this.ropeLine = new THREE.Line(
      ropeGeo,
      new THREE.LineBasicMaterial({ color: 0xdec29b })
    );
    this.ropeLine.visible = false;
    this.ropeLine.frustumCulled = false;
    scene.add(this.ropeLine);
  }

  throwHook(origin: THREE.Vector3, dir: THREE.Vector3): boolean {
    if (this.state.active) {
      // Se já está na água, começa a recolher imediatamente
      this.state.reeling = true;
      return false;
    }
    this.state.active = true;
    this.state.reeling = false;
    this.state.caughtIds = [];
    this.state.position.copy(origin).addScaledVector(dir, 0.8);
    this.state.velocity.copy(dir).multiplyScalar(17.5);
    this.state.velocity.y += 4.2;

    this.hookMesh.visible = true;
    this.ropeLine.visible = true;
    return true;
  }

  update(
    dt: number,
    playerHandPos: THREE.Vector3,
    sector: SectorManager,
    timeSec: number,
    stormFactor: number,
    onCollectFlotsam: (loot: Array<{ itemId: string; count: number }>) => void
  ): void {
    if (!this.state.active) return;

    const waveY = getWaveHeight(this.state.position.x, this.state.position.z, timeSec, stormFactor);

    if (!this.state.reeling) {
      this.state.velocity.y -= 13.5 * dt;
      this.state.position.addScaledVector(this.state.velocity, dt);
      if (this.state.position.y <= waveY) {
        this.state.position.y = waveY;
        this.state.reeling = true;
      }
      if (this.state.position.distanceTo(playerHandPos) > 26) {
        this.state.reeling = true;
      }
    } else {
      const toPlayer = this.toPlayer.copy(playerHandPos).sub(this.state.position);
      const dist = toPlayer.length();
      if (dist < 1.15) {
        for (const id of this.state.caughtIds) {
          const flt = sector.removeFlotsam(id);
          if (flt) onCollectFlotsam(flt.loot);
        }
        this.state.active = false;
        this.state.caughtIds = [];
        this.hookMesh.visible = false;
        this.ropeLine.visible = false;
        return;
      }
      toPlayer.normalize();
      this.state.position.addScaledVector(toPlayer, 13.5 * dt);
      this.state.position.y = Math.max(waveY - 0.05, this.state.position.y);

      // Puxa detritos próximos durante o recolhimento
      for (const flt of sector.flotsam) {
        const dx=flt.x-this.state.position.x,dz=flt.z-this.state.position.z;
        const d=dx*dx+dz*dz;
        if (d < 1.9*1.9 && !this.state.caughtIds.includes(flt.id)) {
          this.state.caughtIds.push(flt.id);
        }
        if (this.state.caughtIds.includes(flt.id)) {
          flt.x = this.state.position.x;
          flt.z = this.state.position.z;
        }
      }
    }

    this.hookMesh.position.copy(this.state.position);
    this.ropePositions[0] = playerHandPos.x;
    this.ropePositions[1] = playerHandPos.y;
    this.ropePositions[2] = playerHandPos.z;
    this.ropePositions[3] = this.state.position.x;
    this.ropePositions[4] = this.state.position.y;
    this.ropePositions[5] = this.state.position.z;
    (this.ropeLine.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  dispose(): void {
    this.hookMesh.geometry.dispose();
    (this.hookMesh.material as THREE.Material).dispose();
    this.ropeLine.geometry.dispose();
    (this.ropeLine.material as THREE.Material).dispose();
  }
}
