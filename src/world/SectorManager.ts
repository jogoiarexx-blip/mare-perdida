import * as THREE from 'three';
import { combine } from '../render/DetailGeometry';
import { detailedAtDistance, wreckHull, wreckCabin, wreckRails } from './MaritimeModels';
import { SeededRng } from '../core/SeededRng';
import { getWaveHeight } from './Ocean';

export type FlotsamKind = 'madeira' | 'plastico' | 'folha' | 'caixote' | 'barril';

export interface FlotsamEntity {
  id: string;
  kind: FlotsamKind;
  x: number;
  z: number;
  rotY: number;
  mesh: THREE.Object3D;
  loot: Array<{ itemId: string; count: number }>;
}

export interface WorldPoi {
  id: 'destrocos_radio' | 'boia_vermelha';
  label: string;
  x: number;
  z: number;
  mesh: THREE.Group;
  looted: boolean;
}

/**
 * Gerencia detritos flutuantes e pontos narrativos do Capítulo 1 (destroço do rádio e boia S005).
 */
export class SectorManager {
  readonly group = new THREE.Group();
  flotsam: FlotsamEntity[] = [];
  pois: WorldPoi[] = [];

  private rng: SeededRng;
  private spawnSeq = 1;
  private spawnTimer = 0;
  private wreckDetails: THREE.Group | null = null;
  private readonly distantPlastic = new THREE.CylinderGeometry(.18,.22,.50,6);
  private readonly distantCrate = new THREE.BoxGeometry(.85,.72,.85);
  private readonly distantBarrel = new THREE.CylinderGeometry(.36,.36,.92,8);

  // Materiais e geometrias compartilhados para reduzir draw calls (orçamento GDD §13)
  private readonly woodGeo = new THREE.BoxGeometry(0.95, 0.14, 0.32);
  private readonly plasticGeo = combine([new THREE.CylinderGeometry(.18,.22,.42,10),new THREE.CylinderGeometry(.09,.15,.12,10).translate(0,.26,0),new THREE.CylinderGeometry(.10,.10,.06,10).translate(0,.34,0)]);
  private readonly leafGeo = new THREE.ConeGeometry(0.45, 0.14, 5);
  private readonly crateGeo = combine([
    new THREE.BoxGeometry(.79,.68,.79),
    ...[-.29,.29].map(x=>new THREE.BoxGeometry(.09,.75,.86).translate(x,0,0)),
    ...[-.27,.27].map(y=>new THREE.BoxGeometry(.86,.07,.86).translate(0,y,0))
  ]);
  private readonly barrelGeo = combine([
    new THREE.CylinderGeometry(.34,.34,.92,14),
    new THREE.CylinderGeometry(.38,.38,.09,14).translate(0,.30,0),
    new THREE.CylinderGeometry(.38,.38,.09,14).translate(0,-.30,0)
  ]);

  private readonly woodMat = new THREE.MeshStandardMaterial({ color: 0x9b6b3e, roughness: 0.85 });
  private readonly plasticMat = new THREE.MeshStandardMaterial({ color: 0x3ec6e0, roughness: 0.4 });
  private readonly leafMat = new THREE.MeshStandardMaterial({ color: 0x3e9e4c, roughness: 0.75 });
  private readonly crateMat = new THREE.MeshStandardMaterial({ color: 0xc28a4b, roughness: 0.8 });
  private readonly barrelMat = new THREE.MeshStandardMaterial({ color: 0xc94a38, roughness: 0.55 });

  constructor(seed: number) {
    this.rng = new SeededRng(seed);
    this.spawnPoiWreck(24, -18);
    this.spawnPoiBuoy(-22, -26);
  }

  seedInitialFlotsam(raftX: number, raftZ: number): void {
    for (let i = 0; i < 22; i++) {
      const z = raftZ - 42 + this.rng.range(0, 72);
      const x = raftX + this.rng.range(-26, 26);
      this.spawnSingleFlotsam(x, z);
    }
  }

  private spawnPoiWreck(x: number, z: number): void {
    const grp = new THREE.Group();
    const hull = new THREE.Mesh(
      wreckHull(),
      new THREE.MeshStandardMaterial({ color: 0x5c4b43, roughness: 0.85 })
    );
    hull.position.y = 0.2;
    grp.rotation.z = 0.10;
    hull.castShadow = true;
    grp.add(hull);

    const details = new THREE.Group();
    const cabin = new THREE.Mesh(wreckCabin(), new THREE.MeshStandardMaterial({color:0x9c9b86,roughness:.83}));
    const rails = new THREE.Mesh(wreckRails(), new THREE.MeshStandardMaterial({color:0x394950,roughness:.67,metalness:.35}));
    cabin.castShadow = true;
    details.add(cabin,rails);
    grp.add(details);
    this.wreckDetails = details;

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.16, 4.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x7b7f85, metalness: 0.4, roughness: 0.6 })
    );
    mast.position.set(1.2, 2.0, 0);
    mast.rotation.z = -0.2;
    grp.add(mast);

    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xffc83b, emissive: 0xff9a1a, emissiveIntensity: 0.9 })
    );
    beacon.position.set(1.6, 3.9, 0);
    grp.add(beacon);

    grp.position.set(x, 0, z);
    this.group.add(grp);
    this.pois.push({
      id: 'destrocos_radio',
      label: 'Destroços do Navio (Peças de Rádio)',
      x,
      z,
      mesh: grp,
      looted: false,
    });
  }

  private spawnPoiBuoy(x: number, z: number): void {
    const grp = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 1.0, 0.7, 10),
      new THREE.MeshStandardMaterial({ color: 0xd93b30, roughness: 0.5 })
    );
    base.position.y = 0.2;
    grp.add(base);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(.91,.96,.11,12), new THREE.MeshStandardMaterial({color:0xf2e5ce,roughness:.7}));
    band.position.y = .23;
    grp.add(band);

    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.42, 2.1, 8),
      new THREE.MeshStandardMaterial({ color: 0xe6e8eb, roughness: 0.4 })
    );
    tower.position.y = 1.4;
    grp.add(tower);
    const cage = new THREE.Mesh(combine([0,1,2,3].map(i=>new THREE.CylinderGeometry(.035,.035,.43,6).translate(Math.cos(i*Math.PI/2)*.27,2.52,Math.sin(i*Math.PI/2)*.27))),new THREE.MeshStandardMaterial({color:0x49565c,roughness:.65}));
    grp.add(cage);

    const light = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xff4040, emissive: 0xff2222, emissiveIntensity: 1.1 })
    );
    light.position.y = 2.55;
    grp.add(light);

    grp.position.set(x, 0, z);
    this.group.add(grp);
    this.pois.push({
      id: 'boia_vermelha',
      label: 'Boia de Emergência (Sinal Vermelho)',
      x,
      z,
      mesh: grp,
      looted: false,
    });
  }

  private spawnSingleFlotsam(x: number, z: number): void {
    const roll = this.rng.next();
    let kind: FlotsamKind = 'madeira';
    let mesh: THREE.Mesh;
    let loot: Array<{ itemId: string; count: number }>;

    if (roll < 0.36) {
      kind = 'madeira';
      mesh = new THREE.Mesh(this.woodGeo, this.woodMat);
      loot = [{ itemId: 'madeira', count: this.rng.int(1, 2) }];
    } else if (roll < 0.66) {
      kind = 'plastico';
      mesh = new THREE.Mesh(this.plasticGeo, this.plasticMat);
      mesh.rotation.z = Math.PI / 2;
      loot = [{ itemId: 'plastico', count: this.rng.int(1, 2) }];
    } else if (roll < 0.84) {
      kind = 'folha';
      mesh = new THREE.Mesh(this.leafGeo, this.leafMat);
      loot = [
        { itemId: 'folha', count: 1 },
        { itemId: 'fibra', count: this.rng.int(1, 2) },
      ];
    } else if (roll < 0.94) {
      kind = 'caixote';
      mesh = new THREE.Mesh(this.crateGeo, this.crateMat);
      loot = [
        { itemId: 'madeira', count: 2 },
        { itemId: 'sucata', count: 1 },
        { itemId: 'semente_salina', count: this.rng.next() < 0.45 ? 1 : 0 },
        { itemId: 'pagina_diario', count: this.rng.next() < 0.25 ? 1 : 0 },
      ].filter((l) => l.count > 0);
    } else {
      kind = 'barril';
      mesh = new THREE.Mesh(this.barrelGeo, this.barrelMat);
      loot = [
        { itemId: 'sucata', count: 2 },
        { itemId: 'pedra', count: 2 },
        { itemId: 'plastico', count: 2 },
      ];
    }

    mesh.castShadow = true;
    mesh.position.set(x, 0, z);
    this.group.add(mesh);
    this.flotsam.push({
      id: `flt_${this.spawnSeq++}`,
      kind,
      x,
      z,
      rotY: this.rng.range(0, Math.PI * 2),
      mesh,
      loot,
    });
  }

  update(dt: number, raftX: number, raftZ: number, timeSec: number, stormFactor: number, viewerX = raftX, viewerZ = raftZ): void {
    // Correnteza suave traz detritos do norte (-Z) para sul (+Z)
    const currentSpeedZ = 1.25 + stormFactor * 0.6;

    this.spawnTimer += dt;
    if (this.spawnTimer >= 1.6 && this.flotsam.length < 34) {
      this.spawnTimer = 0;
      const sx = raftX + this.rng.range(-24, 24);
      const sz = raftZ - 42;
      this.spawnSingleFlotsam(sx, sz);
    }

    for (let i = this.flotsam.length - 1; i >= 0; i--) {
      const f = this.flotsam[i];
      f.z += currentSpeedZ * dt;
      f.rotY += 0.25 * dt;

      const waveY = getWaveHeight(f.x, f.z, timeSec, stormFactor);
      f.mesh.position.set(f.x, waveY - 0.03, f.z);
      f.mesh.rotation.y = f.rotY;
      if (f.mesh instanceof THREE.Mesh) {
        const distanceSq = (f.x-viewerX)**2 + (f.z-viewerZ)**2;
        const pair = f.kind === 'plastico' ? [this.plasticGeo,this.distantPlastic] : f.kind === 'caixote' ? [this.crateGeo,this.distantCrate] : f.kind === 'barril' ? [this.barrelGeo,this.distantBarrel] : null;
        if(pair) f.mesh.geometry = detailedAtDistance(distanceSq,f.mesh.geometry === pair[0]) ? pair[0] : pair[1];
        f.mesh.castShadow = distanceSq < 28*28;
      }

      if (Math.hypot(f.x - raftX, f.z - raftZ) > 65) {
        this.group.remove(f.mesh);
        this.flotsam.splice(i, 1);
      }
    }

    for (const poi of this.pois) {
      const waveY = getWaveHeight(poi.x, poi.z, timeSec, stormFactor);
      poi.mesh.position.y = waveY;
      if (poi.id === 'destrocos_radio' && this.wreckDetails) {
        this.wreckDetails.visible = detailedAtDistance((poi.x-viewerX)**2+(poi.z-viewerZ)**2,this.wreckDetails.visible);
      }
      // Se o jogador navegou muito longe sem lootear, traz POI novamente para faixa alcançável (GDD §4)
      if (!poi.looted && Math.hypot(poi.x - raftX, poi.z - raftZ) > 130) {
        poi.x = raftX + (poi.id === 'destrocos_radio' ? 24 : -22);
        poi.z = raftZ - 26;
        poi.mesh.position.set(poi.x, waveY, poi.z);
      }
    }
  }

  removeFlotsam(id: string): FlotsamEntity | null {
    const idx = this.flotsam.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    const [removed] = this.flotsam.splice(idx, 1);
    this.group.remove(removed.mesh);
    return removed;
  }

  dispose(): void {
    this.distantPlastic.dispose();
    this.distantCrate.dispose();
    this.distantBarrel.dispose();
    for (const poi of this.pois) poi.mesh.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) object.material.forEach(m => m.dispose());
        else object.material.dispose();
      }
    });
    this.woodGeo.dispose();
    this.plasticGeo.dispose();
    this.leafGeo.dispose();
    this.crateGeo.dispose();
    this.barrelGeo.dispose();
    this.woodMat.dispose();
    this.plasticMat.dispose();
    this.leafMat.dispose();
    this.crateMat.dispose();
    this.barrelMat.dispose();
  }
}
