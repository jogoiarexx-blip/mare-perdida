import * as THREE from 'three';
import { plankDeck, reinforcedDeckFrame, combine } from '../render/DetailGeometry';
import { collectionNet, plantGeometry, grillGeometry, radioFace, roofGeometry } from '../render/EquipmentGeometry';
import { cellKey, RaftGrid, type PlacedModule } from './Grid';
import { getWaveHeight, getWaveNormal } from '../world/Ocean';
import type { StructureKind } from '../data/recipes';

/**
 * Renderização 3D da jangada, módulos instalados e ghost verde/vermelho de construção.
 */
export class RaftRenderer {
  readonly root = new THREE.Group();
  x = 0;
  z = 0;
  heading = 0;

  private deckBatch!: THREE.InstancedMesh;
  private trimBatch!: THREE.InstancedMesh;
  private batchCapacity = 0;
  private foundationSignature = '';
  private readonly instanceMatrix = new THREE.Matrix4();
  private readonly instanceColor = new THREE.Color();
  private moduleMeshes = new Map<string, THREE.Group>();
  private readonly moduleTemplates = new Map<PlacedModule['kind'], THREE.Group>();
  private ghostMesh: THREE.Mesh;

  private readonly deckGeo = plankDeck();
  private readonly trimGeo = reinforcedDeckFrame();
  private readonly ghostBoxGeo = new THREE.BoxGeometry(0.94, 0.36, 0.94);
  private readonly plankMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.83 });
  private readonly reinforcedMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, metalness: 0.35, roughness: 0.48 });

  private readonly ghostValidMat = new THREE.MeshBasicMaterial({
    color: 0x35e085,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  });
  private readonly ghostInvalidMat = new THREE.MeshBasicMaterial({
    color: 0xe84848,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  });

  constructor() {
    this.ghostMesh = new THREE.Mesh(this.ghostBoxGeo, this.ghostValidMat);
    this.ghostMesh.visible = false;
    this.root.add(this.ghostMesh);
  }

  /** Uma chamada de desenho para a madeira e outra para todas as bordas metálicas. */
  private ensureFoundationBatches(required: number): void {
    if (this.batchCapacity >= required && this.batchCapacity > 0) return;
    if (this.batchCapacity) {
      this.root.remove(this.deckBatch,this.trimBatch);
      this.deckBatch.dispose(); this.trimBatch.dispose();
    }
    this.batchCapacity=Math.max(16,Math.ceil(required/16)*16);
    this.deckBatch=new THREE.InstancedMesh(this.deckGeo,this.plankMat,this.batchCapacity);
    this.deckBatch.name='foundation-decks';
    this.deckBatch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.deckBatch.castShadow=true; this.deckBatch.receiveShadow=true;
    this.deckBatch.count=0;
    this.trimBatch=new THREE.InstancedMesh(this.trimGeo,this.reinforcedMat,this.batchCapacity);
    this.trimBatch.name='foundation-reinforcements';
    this.trimBatch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.trimBatch.receiveShadow=true; this.trimBatch.castShadow=false;
    this.trimBatch.count=0;
    this.root.add(this.deckBatch,this.trimBatch);
    this.foundationSignature='';
  }

  private syncFoundations(grid: RaftGrid): void {
    this.ensureFoundationBatches(grid.foundations.size);
    let signature='';
    for(const [key,cell] of grid.foundations) {
      signature+=key+':'+Number(Boolean(cell.isCore))+Number(cell.reinforced)+Number(cell.hp<cell.maxHp*.55)+';';
    }
    if(signature===this.foundationSignature) return;
    this.foundationSignature=signature;
    let deck=0,trim=0;
    for(const cell of grid.foundations.values()) {
      const x=cell.gx*RaftGrid.CELL_SIZE,z=cell.gz*RaftGrid.CELL_SIZE;
      this.instanceMatrix.makeTranslation(x,.08,z);
      this.deckBatch.setMatrixAt(deck,this.instanceMatrix);
      const color=cell.hp<cell.maxHp*.55?0x6e3b2e:cell.isCore?0xb68249:cell.reinforced?0x725039:0x9c6b3b;
      this.deckBatch.setColorAt(deck++,this.instanceColor.setHex(color));
      if(cell.reinforced){
        this.instanceMatrix.makeTranslation(x,0,z);
        this.trimBatch.setMatrixAt(trim++,this.instanceMatrix);
      }
    }
    this.deckBatch.count=deck; this.trimBatch.count=trim;
    this.deckBatch.visible=deck>0; this.trimBatch.visible=trim>0;
    this.deckBatch.instanceMatrix.needsUpdate=true;
    if(this.deckBatch.instanceColor) this.deckBatch.instanceColor.needsUpdate=true;
    this.trimBatch.instanceMatrix.needsUpdate=true;
    this.deckBatch.computeBoundingSphere();
    this.trimBatch.computeBoundingSphere();
  }

  syncWithGrid(grid: RaftGrid): void {
    this.syncFoundations(grid);

    // Remover módulos antigos
    for (const [key, grp] of this.moduleMeshes.entries()) {
      if (!grid.modules.has(key) || grid.modules.get(key)?.kind !== grp.userData.kind) {
        this.root.remove(grp);
        this.moduleMeshes.delete(key);
      }
    }

    // Criar/atualizar módulos
    for (const [key, mod] of grid.modules.entries()) {
      let grp = this.moduleMeshes.get(key);
      if (!grp) {
        let template = this.moduleTemplates.get(mod.kind);
        if (!template) { template = this.buildModuleMesh(mod); this.moduleTemplates.set(mod.kind,template); }
        grp = template.clone(true);
        grp.userData.kind = mod.kind;
        grp.position.set(mod.gx * RaftGrid.CELL_SIZE, 0.2, mod.gz * RaftGrid.CELL_SIZE);
        grp.rotation.y = (mod.rotation * Math.PI) / 2;
        this.root.add(grp);
        this.moduleMeshes.set(key, grp);
      }
      grp.rotation.y = mod.rotation * Math.PI / 2;
      this.updateModuleVisual(grp, mod);
    }
  }

  private buildModuleMesh(mod: PlacedModule): THREE.Group {
    const g = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x8a9aa8, metalness: 0.45, roughness: 0.45 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x7b4f2b, roughness: 0.85 });
    const clothMat = new THREE.MeshStandardMaterial({ color: 0xf0ead6, roughness: 0.9, side: THREE.DoubleSide });

    switch (mod.kind) {
      case 'purificador': {
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.35, 0.75), woodMat);
        base.position.y = 0.17;
        const tank = new THREE.Mesh(
          new THREE.CylinderGeometry(0.24, 0.28, 0.55, 14),
          new THREE.MeshStandardMaterial({ color: 0x52c7e8, transparent: true, opacity: 0.78 })
        );
        tank.position.y = 0.56;
        const dome = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.25, 8), metalMat);
        dome.position.y = 0.95;
        const pipe = new THREE.Mesh(new THREE.TorusGeometry(.15,.035,6,10,Math.PI),metalMat);
        pipe.position.set(.28,.65,0); pipe.rotation.z = -Math.PI/2;
        const tap = new THREE.Mesh(new THREE.CylinderGeometry(.033,.033,.13,8),metalMat);
        tap.position.set(.4,.5,0);
        g.add(base, tank, dome, pipe,tap);
        break;
      }
      case 'churrasqueira': {
        const stand = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.48, 0.7), metalMat);
        stand.position.y = 0.24;
        const ember = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.25, 0.08, 10),
          new THREE.MeshStandardMaterial({ color: 0xff6224, emissive: 0xff3b00, emissiveIntensity: 0.8 })
        );
        ember.position.y = 0.51;
        const grill = new THREE.Mesh(grillGeometry(),metalMat); grill.position.y = .58;
        g.add(stand, ember,grill);
        break;
      }
      case 'cama': {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.24, 0.92), woodMat);
        frame.position.y = 0.12;
        const mattress = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.14, 0.82), clothMat);
        mattress.position.y = 0.29;
        const pillow = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 0.12, 0.22),
          new THREE.MeshStandardMaterial({ color: 0x3f84a8, roughness: 0.8 })
        );
        pillow.position.set(0, 0.38, -0.25);
        g.add(frame, mattress, pillow);
        break;
      }
      case 'rede_coleta': {
        const net = new THREE.Mesh(
          collectionNet(),
          new THREE.MeshStandardMaterial({ color: 0xc2a878, roughness: .9 })
        );
        net.position.y = 0.05;
        g.add(net);
        break;
      }
      case 'vela': {
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.3, 8), woodMat);
        mast.position.y = 1.15;
        const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.45, 8, 6), clothMat);
        const points = sail.geometry.getAttribute('position');
        for(let i=0;i<points.count;i++) points.setZ(i, .14 * Math.cos(points.getX(i)*Math.PI/1.15) * Math.cos(points.getY(i)*Math.PI/1.45));
        points.needsUpdate = true;
        sail.geometry.computeVertexNormals();
        sail.position.set(0, 1.35, 0.12);
        g.add(mast, sail);
        break;
      }
      case 'leme': {
        const base=new THREE.Mesh(combine([new THREE.BoxGeometry(.52,.12,.52),new THREE.BoxGeometry(.16,.92,.18).translate(0,.46,0)]),woodMat);
        const parts:THREE.BufferGeometry[]=[new THREE.TorusGeometry(.31,.035,6,16)];
        for(let i=0;i<6;i++)parts.push(new THREE.BoxGeometry(.045,.68,.045).rotateZ(i*Math.PI/3));
        const wheel=new THREE.Mesh(combine(parts),metalMat);wheel.position.set(0,.94,.11);
        g.add(base,wheel);break;
      }
      case 'motor': {
        const base=new THREE.Mesh(combine([new THREE.BoxGeometry(.7,.16,.75),new THREE.BoxGeometry(.54,.5,.48).translate(0,.28,0),new THREE.CylinderGeometry(.13,.13,.4,8).rotateZ(Math.PI/2).translate(.28,.29,0)]),metalMat);
        const prop=new THREE.Mesh(combine([new THREE.BoxGeometry(.45,.08,.12),new THREE.BoxGeometry(.08,.45,.12)]),metalMat);prop.position.set(0,-.22,.42);g.add(base,prop);break;
      }
      case 'escada':{
        const pieces:THREE.BufferGeometry[]=[];for(const x of [-.23,.23])pieces.push(new THREE.BoxGeometry(.08,1.4,.08).translate(x,-.45,.49));
        for(let i=0;i<5;i++)pieces.push(new THREE.BoxGeometry(.46,.075,.10).translate(0,-1+i*.28,.49));
        g.add(new THREE.Mesh(combine(pieces),woodMat));break;
      }
      case 'bandeira':{
        const pole=new THREE.Mesh(new THREE.CylinderGeometry(.04,.06,3.2,6),woodMat);pole.position.y=1.6;
        const flag=new THREE.Mesh(new THREE.PlaneGeometry(.9,.52),new THREE.MeshStandardMaterial({color:0xe76b42,side:THREE.DoubleSide,roughness:1}));flag.position.set(.45,2.85,0);g.add(pole,flag);break;
      }
      case 'farol_nav':{
        const base=new THREE.Mesh(combine([new THREE.BoxGeometry(.45,.1,.45),new THREE.CylinderGeometry(.055,.07,1.1,6).translate(0,.55,0),new THREE.CylinderGeometry(.22,.18,.3,10).rotateX(Math.PI/2).translate(0,1.1,0)]),metalMat);
        const lens=new THREE.Mesh(new THREE.CircleGeometry(.18,10),new THREE.MeshStandardMaterial({color:0xffe6a2,emissive:0xe7b653,side:THREE.DoubleSide}));lens.position.set(0,1.1,-.16);g.add(base,lens);break;
      }
      case 'radar':{
        const base=new THREE.Mesh(combine([new THREE.BoxGeometry(.5,.15,.5),new THREE.CylinderGeometry(.055,.07,1.65,6).translate(0,.83,0),new THREE.BoxGeometry(.95,.12,.18).translate(0,1.67,0)]),metalMat);g.add(base);break;
      }
      case 'ancora': {
        const winch = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.65), woodMat);
        winch.position.y = 0.22;
        const stone = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.28),
          new THREE.MeshStandardMaterial({ color: 0x676b70, roughness: 0.95 })
        );
        stone.position.set(0, 0.56, 0.18);
        g.add(winch, stone);
        break;
      }
      case 'radio': {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.68, 0.42, 0.46),
          new THREE.MeshStandardMaterial({ color: 0x2f4352, roughness: 0.5 })
        );
        box.position.y = 0.32;
        const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.85, 6), metalMat);
        ant.position.set(0.22, 0.82, 0);
        const led = new THREE.Mesh(
          new THREE.SphereGeometry(0.06, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0x22ff88, emissive: 0x11cc66, emissiveIntensity: 1.0 })
        );
        led.position.set(-0.18, 0.36, 0.24);
        const front = new THREE.Mesh(radioFace(),new THREE.MeshStandardMaterial({color:0x17282f,roughness:.65}));
        front.position.y=.32; g.add(box, ant, led,front);
        break;
      }
      case 'cobertura': {
        const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.9, 6), woodMat);
        p1.position.set(-0.4, 0.95, -0.4);
        const p2 = p1.clone();
        p2.position.set(0.4, 0.95, -0.4);
        const p3 = p1.clone();
        p3.position.set(-0.4, 0.95, 0.4);
        const p4 = p1.clone();
        p4.position.set(0.4, 0.95, 0.4);
        const roof = new THREE.Mesh(
          roofGeometry(),
          new THREE.MeshStandardMaterial({ color: 0x709946, roughness: 0.9 })
        );
        roof.position.y = 1.92;
        g.add(p1, p2, p3, p4, roof);
        break;
      }
      case 'horta': {
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.26, 0.84), woodMat);
        box.position.y = 0.13;
        const soil = new THREE.Mesh(
          new THREE.BoxGeometry(0.74, 0.06, 0.74),
          new THREE.MeshStandardMaterial({ color: 0x4b3621, roughness: 0.95 })
        );
        soil.position.y = 0.27;
        const sprout = new THREE.Mesh(
          plantGeometry(),
          new THREE.MeshStandardMaterial({ color: 0x4cd964, roughness: 0.7 })
        );
        sprout.position.y = 0.5;
        sprout.visible = false;
        g.add(box, soil, sprout);
        break;
      }
      case 'bau': {
        const chest = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.48, 0.56), woodMat);
        chest.position.y = 0.24;
        const band = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.58), metalMat);
        band.position.y = 0.36;
        g.add(chest, band);
        break;
      }
    }
    return g;
  }

  syncDynamicModule(mod: PlacedModule): void {
    const grp=this.moduleMeshes.get(cellKey(mod.gx,mod.gz));
    if(grp)this.updateModuleVisual(grp,mod);
  }

  private updateModuleVisual(grp: THREE.Group, mod: PlacedModule): void {
    if(mod.kind==='farol_nav'&&grp.children[1])grp.children[1].visible=mod.active;
    if(mod.kind==='ancora'&&grp.children[1])grp.children[1].position.y=mod.active?-.38:.56;
    if (mod.kind === 'vela' && grp.children[1]) {
      grp.children[1].scale.y = mod.active ? 1.0 : 0.25;
    }
    if (mod.kind === 'horta' && grp.children[2]) {
      grp.children[2].visible = Boolean(mod.planted);
      const scale = mod.readyCount > 0 ? 1.3 : 0.5 + mod.progress * 0.6;
      grp.children[2].scale.setScalar(scale);
    }
  }

  showGhost(gx: number, gz: number, kind: StructureKind, valid: boolean, rotation: number): void {
    this.ghostMesh.visible = true;
    this.ghostMesh.material = valid ? this.ghostValidMat : this.ghostInvalidMat;
    const isFoundation = kind === 'fundacao' || kind === 'borda_reforcada';
    this.ghostMesh.geometry = kind === 'borda_reforcada' ? this.trimGeo : this.ghostBoxGeo;
    this.ghostMesh.position.set(gx * RaftGrid.CELL_SIZE, kind === 'borda_reforcada' ? 0.025 : isFoundation ? 0.1 : 0.42, gz * RaftGrid.CELL_SIZE);
    this.ghostMesh.rotation.y = (rotation * Math.PI) / 2;
  }

  hideGhost(): void {
    this.ghostMesh.visible = false;
  }

  updateTransform(timeSec: number, stormFactor: number): void {
    const waveY = getWaveHeight(this.x, this.z, timeSec, stormFactor);
    const n = getWaveNormal(this.x, this.z, timeSec, stormFactor);
    this.root.position.set(this.x, waveY, this.z);
    this.root.rotation.set(n.z * 0.28, this.heading, -n.x * 0.28);
  }

  worldToLocalGrid(worldX: number, worldZ: number): { gx: number; gz: number } {
    const dx = worldX - this.x;
    const dz = worldZ - this.z;
    const cos = Math.cos(this.heading);
    const sin = Math.sin(this.heading);
    const lx = dx * cos - dz * sin;
    const lz = dx * sin + dz * cos;
    return {
      gx: Math.round(lx / RaftGrid.CELL_SIZE),
      gz: Math.round(lz / RaftGrid.CELL_SIZE),
    };
  }

  worldToLocalXZ(wx:number,wz:number,out=new THREE.Vector2()):THREE.Vector2 {
    const dx=wx-this.x,dz=wz-this.z;
    const c=Math.cos(this.heading),s=Math.sin(this.heading);
    return out.set(dx*c-dz*s,dx*s+dz*c);
  }

  localToWorld(lx: number, ly: number, lz: number, out=new THREE.Vector3()): THREE.Vector3 {
    const c=Math.cos(this.heading),s=Math.sin(this.heading);
    return out.set(this.x+lx*c+lz*s,this.root.position.y+ly,this.z-lx*s+lz*c);
  }

  getCellWorldPosition(gx: number, gz: number, out=new THREE.Vector3()): THREE.Vector3 {
    return this.localToWorld(gx * RaftGrid.CELL_SIZE, 0.25, gz * RaftGrid.CELL_SIZE,out);
  }

  dispose(): void {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    for (const template of this.moduleTemplates.values()) template.traverse(obj => {
      if (obj instanceof THREE.Mesh) { geometries.add(obj.geometry); if(Array.isArray(obj.material)) obj.material.forEach(m=>materials.add(m)); else materials.add(obj.material); }
    });
    geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose()); this.moduleTemplates.clear();
    this.ghostBoxGeo.dispose();
    this.deckGeo.dispose();
    this.trimGeo.dispose();
    this.plankMat.dispose();
    if(this.batchCapacity){ this.deckBatch.dispose(); this.trimBatch.dispose(); }
    this.reinforcedMat.dispose();
    this.ghostValidMat.dispose();
    this.ghostInvalidMat.dispose();
  }
}

export { cellKey };
