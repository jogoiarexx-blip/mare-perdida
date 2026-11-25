import * as THREE from 'three';
import type { EventBus } from '../core/EventBus';
import type { RaftGrid } from '../raft/Grid';
import type { RaftRenderer } from '../raft/RaftRenderer';
import { getWaveHeight } from '../world/Ocean';

export type SharkState = 'PATROL' | 'TELEGRAPH' | 'BITING' | 'DISTRACTED' | 'REPELLED';

/**
 * Chefe B01: Mandíbula Branca.
 * Patrulha a jangada, telegrafa mordida com círculo vermelho e entra em fase 2 abaixo de 50% de HP.
 */
export class SharkBoss {
  readonly mesh = new THREE.Group();
  readonly warningRing: THREE.Mesh;

  state: SharkState = 'PATROL';
  hp = 100;
  maxHp = 100;
  resolved = false;

  private orbitAngle = 0;
  private attackCooldown = 28;
  private stateTimer = 0;
  private targetKey: string | null = null;
  private position = new THREE.Vector3(14, 0, 14);
  private baitPos: THREE.Vector3 | null = null;

  constructor(scene: THREE.Scene, private readonly bus: EventBus) {
    // Corpo estilizado + barbatana dorsal visível acima da água
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b4d5e, roughness: 0.55 });
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0xd9e4ec, roughness: 0.65 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.65, 2.9), bodyMat);
    body.position.y = -0.15;
    const belly = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.25, 2.6), bellyMat);
    belly.position.y = -0.45;
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.95, 4), bodyMat);
    fin.position.set(0, 0.55, 0.1);
    fin.rotation.x = -0.22;
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.9, 4), bodyMat);
    tail.position.set(0, 0.15, 1.7);
    tail.rotation.x = Math.PI / 2;

    this.mesh.add(body, belly, fin, tail);
    scene.add(this.mesh);

    this.warningRing = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.85, 24),
      new THREE.MeshBasicMaterial({
        color: 0xff3b30,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      })
    );
    this.warningRing.rotation.x = -Math.PI / 2;
    this.warningRing.visible = false;
    scene.add(this.warningRing);
  }

  getPosition(): THREE.Vector3 {
    return this.position;
  }

  isPhase2(): boolean {
    return this.hp <= this.maxHp * 0.5;
  }

  throwBait(worldPos: THREE.Vector3): void {
    this.baitPos = worldPos.clone();
    this.state = 'DISTRACTED';
    this.stateTimer = 12;
    this.warningRing.visible = false;
    this.targetKey = null;
    this.bus.emit('notification', { text: 'Isca lançada! Mandíbula Branca foi distraído.', kind: 'info' });
  }

  takeDamage(amount: number): boolean {
    if (this.state === 'REPELLED') return false;
    this.hp = Math.max(0, this.hp - amount);

    if (this.state === 'TELEGRAPH' || this.state === 'BITING') {
      // Interrompe ataque ao receber golpe de lança
      this.state = 'PATROL';
      this.attackCooldown = this.isPhase2() ? 14 : 22;
      this.warningRing.visible = false;
      this.targetKey = null;
    }

    if (this.hp <= 0) {
      this.state = 'REPELLED';
      this.stateTimer = 75;
      this.warningRing.visible = false;
      this.targetKey = null;
      if (!this.resolved) {
        this.resolved = true;
        this.bus.emit('bossResolved', { bossId: 'B01', outcome: 'repelled' });
      } else {
        this.bus.emit('notification', { text: 'Mandíbula Branca recuou para as profundezas!', kind: 'success' });
      }
      return true;
    }
    return false;
  }

  update(
    dt: number,
    grid: RaftGrid,
    raft: RaftRenderer,
    playerPos: THREE.Vector3,
    playerInWater: boolean,
    timeSec: number,
    stormFactor: number,
    onPlayerHit: (dmg: number) => void,
    onWarningSignal: () => void
  ): void {
    const waveY = getWaveHeight(this.position.x, this.position.z, timeSec, stormFactor);

    if (this.state === 'REPELLED') {
      this.stateTimer -= dt;
      const awayX = raft.x + Math.cos(this.orbitAngle) * 42;
      const awayZ = raft.z + Math.sin(this.orbitAngle) * 42;
      this.position.lerp(new THREE.Vector3(awayX, waveY - 1.2, awayZ), Math.min(1, dt * 1.5));
      this.mesh.position.copy(this.position);
      if (this.stateTimer <= 0) {
        this.hp = this.maxHp;
        this.state = 'PATROL';
        this.attackCooldown = 25;
      }
      return;
    }

    if (this.state === 'DISTRACTED' && this.baitPos) {
      this.stateTimer -= dt;
      this.steerTowards(this.baitPos.x, this.baitPos.z, 5.2, dt, waveY);
      if (this.stateTimer <= 0) {
        this.baitPos = null;
        this.state = 'PATROL';
        this.attackCooldown = 16;
      }
      return;
    }

    // Se jogador estiver nadando longe da jangada, o tubarão pressiona o jogador
    if (playerInWater && this.state === 'PATROL' && this.position.distanceTo(playerPos) < 16) {
      this.steerTowards(playerPos.x, playerPos.z, 4.9, dt, waveY);
      if (this.position.distanceTo(playerPos) < 1.65) {
        onPlayerHit(18);
        this.orbitAngle += Math.PI * 0.6;
        this.position.x += Math.cos(this.orbitAngle) * 5;
        this.position.z += Math.sin(this.orbitAngle) * 5;
      }
      return;
    }

    if (this.state === 'PATROL') {
      this.orbitAngle += (this.isPhase2() ? 0.55 : 0.36) * dt;
      const radius = 12 + Math.sin(timeSec * 0.5) * 2.5;
      const tx = raft.x + Math.cos(this.orbitAngle) * radius;
      const tz = raft.z + Math.sin(this.orbitAngle) * radius;
      this.steerTowards(tx, tz, 4.4, dt, waveY);

      this.attackCooldown -= dt;
      if (this.attackCooldown <= 0) {
        const outers = grid.getOuterFoundations();
        if (outers.length > 0) {
          const picked = outers[Math.floor(Math.random() * outers.length)];
          this.targetKey = `${picked.gx},${picked.gz}`;
          this.state = 'TELEGRAPH';
          this.stateTimer = this.isPhase2() ? 2.8 : 3.8;
          onWarningSignal();
          this.bus.emit('notification', {
            text: 'Alerta: Mandíbula Branca circulando uma borda! Use a lança para afastar.',
            kind: 'warn',
          });
        } else {
          this.attackCooldown = 15;
        }
      }
      return;
    }

    if (this.state === 'TELEGRAPH' && this.targetKey) {
      const [gxStr, gzStr] = this.targetKey.split(',');
      const cell = grid.getFoundation(Number(gxStr), Number(gzStr));
      if (!cell) {
        this.state = 'PATROL';
        this.warningRing.visible = false;
        this.attackCooldown = 12;
        return;
      }
      const targetWorld = raft.getCellWorldPosition(cell.gx, cell.gz);
      this.warningRing.visible = true;
      this.warningRing.position.set(targetWorld.x, targetWorld.y + 0.14, targetWorld.z);
      const pulse = 1 + Math.sin(timeSec * 12) * 0.14;
      this.warningRing.scale.setScalar(pulse);

      this.steerTowards(targetWorld.x, targetWorld.z, 6.2, dt, waveY);
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.state = 'BITING';
        this.stateTimer = 0.8;
        const dmg = this.isPhase2() ? 55 : 40;
        cell.hp = Math.max(0, cell.hp - dmg);
        this.bus.emit('structureDamaged', { gx: cell.gx, gz: cell.gz, amount: dmg, source: 'B01' });
        if (cell.hp === 0 && !cell.isCore) {
          grid.foundations.delete(this.targetKey);
          grid.modules.delete(this.targetKey);
          this.bus.emit('notification', {
            text: 'Mandíbula Branca destruiu uma fundação externa!',
            kind: 'danger',
          });
        } else {
          this.bus.emit('notification', {
            text: 'Mandíbula Branca mordeu a borda! Repare com o martelo.',
            kind: 'warn',
          });
        }
      }
      return;
    }

    if (this.state === 'BITING') {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.warningRing.visible = false;
        this.targetKey = null;
        this.state = 'PATROL';
        this.attackCooldown = this.isPhase2() ? 15 : 26;
      }
    }
  }

  private steerTowards(tx: number, tz: number, speed: number, dt: number, waveY: number): void {
    const dx = tx - this.position.x;
    const dz = tz - this.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.05) {
      const step = Math.min(dist, speed * dt);
      this.position.x += (dx / dist) * step;
      this.position.z += (dz / dist) * step;
      this.mesh.rotation.y = Math.atan2(-dx, -dz);
    }
    this.position.y = waveY;
    this.mesh.position.copy(this.position);
  }
}
