import type { StructureKind } from '../data/recipes';

export interface FoundationCell {
  gx: number;
  gz: number;
  hp: number;
  maxHp: number;
  reinforced: boolean;
  material?:'wood'|'metal';
  finish?:'natural'|'light'|'dark';
  isCore?: boolean;
}

export interface PlacedModule {
  id: string;
  kind: Exclude<StructureKind, 'fundacao' | 'borda_reforcada'|'fundacao_metal'|'piso_claro'|'piso_escuro'>;
  gx: number;
  gz: number;
  rotation: number; // 0, 1, 2, 3 -> 0°, 90°, 180°, 270°
  hp: number;
  maxHp: number;
  mass: number;
  progress: number; // usado por purificador, churrasqueira, horta
  readyCount: number;
  active: boolean; // vela aberta, âncora baixada, rádio sintonizado
  planted?: boolean;
  watered?: boolean;
  storedItems?: Record<string, number>;
  fuel?:number;
}

export interface SerializedRaftGrid {
  foundations: FoundationCell[];
  modules: PlacedModule[];
  maxFoundations: number;
}

export function cellKey(gx: number, gz: number): string {
  return `${gx},${gz}`;
}

export function moduleKey(kind:PlacedModule['kind'],gx:number,gz:number,rotation=0):string{
 const key=cellKey(gx,gz);
 if(['parede','porta','janela','corrimao'].includes(kind))return key+':wall:'+((rotation%4+4)%4);
 if(kind==='piso_superior'||kind==='telhado')return key+':roof';
 return key;
}
export function moduleKeysAt(gx:number,gz:number):string[]{
 const k=cellKey(gx,gz);return [k,k+':roof',k+':wall:0',k+':wall:1',k+':wall:2',k+':wall:3'];
}
/**
 * Grade naval de 1m da jangada. Mantém fundações e módulos colocados sobre elas.
 */
export class RaftGrid {
  static readonly CELL_SIZE = 1.0;

  foundations = new Map<string, FoundationCell>();
  modules = new Map<string, PlacedModule>();
  maxFoundations: number;
  private moduleSeq = 1;

  constructor(maxFoundations = 256) {
    this.maxFoundations = maxFoundations;
    this.createStarterRaft();
  }

  /** Jangada inicial 2x2 com uma célula-núcleo protegida (0,0). */
  createStarterRaft(): void {
    this.foundations.clear();
    this.modules.clear();
    const coords: Array<[number, number, boolean]> = [
      [0, 0, true],
      [1, 0, false],
      [0, 1, false],
      [1, 1, false],
    ];
    for (const [gx, gz, isCore] of coords) {
      this.foundations.set(cellKey(gx, gz), {
        gx,
        gz,
        hp: 100,
        maxHp: 100,
        reinforced: isCore,
        isCore,
      });
    }
  }

  getFoundation(gx: number, gz: number): FoundationCell | undefined {
    return this.foundations.get(cellKey(gx, gz));
  }

  getModuleAt(gx: number, gz: number): PlacedModule | undefined {
    return this.modulesAt(gx,gz)[0];
  }

  modulesAt(gx:number,gz:number):PlacedModule[]{
    const out:PlacedModule[]=[];for(const k of moduleKeysAt(gx,gz)){const m=this.modules.get(k);if(m)out.push(m);}return out;
  }
  removeModulesAt(gx:number,gz:number):void{for(const k of moduleKeysAt(gx,gz))this.modules.delete(k);}
  upgradeMetal(gx:number,gz:number):{ok:boolean;reason?:string}{
    const f=this.getFoundation(gx,gz);if(!f||f.material==='metal')return {ok:false,reason:'Requer fundação de madeira.'};
    f.material='metal';f.reinforced=true;f.maxHp=360;f.hp=360;return {ok:true};
  }
  setFinish(gx:number,gz:number,finish:'light'|'dark'):{ok:boolean}{
    const f=this.getFoundation(gx,gz);if(!f||f.material==='metal'||f.finish===finish)return {ok:false};
    f.finish=finish;return {ok:true};
  }
  hasAdjacentFoundation(gx: number, gz: number): boolean {
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    return dirs.some(([dx, dz]) => this.foundations.has(cellKey(gx + dx, gz + dz)));
  }

  getOuterFoundations(): FoundationCell[] {
    const out: FoundationCell[] = [];
    for (const f of this.foundations.values()) {
      if (f.isCore) continue;
      const neighbors = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      const exposed = neighbors.some(([dx, dz]) => !this.foundations.has(cellKey(f.gx + dx, f.gz + dz)));
      if (exposed) out.push(f);
    }
    return out;
  }

  addFoundation(gx: number, gz: number): { ok: boolean; reason?: string } {
    const key = cellKey(gx, gz);
    if (this.foundations.has(key)) {
      return { ok: false, reason: 'Já existe uma fundação aqui.' };
    }
    if (this.foundations.size >= this.maxFoundations) {
      return { ok: false, reason: `Limite de ${this.maxFoundations} fundações atingido.` };
    }
    if (this.foundations.size > 0 && !this.hasAdjacentFoundation(gx, gz)) {
      return { ok: false, reason: 'Conecte a fundação a uma peça existente.' };
    }
    this.foundations.set(key, {
      gx,
      gz,
      hp: 100,
      maxHp: 100,
      reinforced: false,
    });
    return { ok: true };
  }

  reinforceFoundation(gx: number, gz: number): { ok: boolean; reason?: string } {
    const f = this.getFoundation(gx, gz);
    if (!f) return { ok: false, reason: 'Requer uma fundação nessa posição.' };
    if (f.reinforced) return { ok: false, reason: 'Fundação já está reforçada.' };
    f.reinforced = true;
    f.maxHp = 220;
    f.hp = 220;
    return { ok: true };
  }

  placeModule(
    kind: PlacedModule['kind'],
    gx: number,
    gz: number,
    rotation: number,
    mass = 20
  ): { ok: boolean; module?: PlacedModule; reason?: string } {
    const key = moduleKey(kind,gx,gz,rotation);
    if (!this.foundations.has(cellKey(gx,gz))) {
      return { ok: false, reason: 'Módulos exigem uma fundação abaixo.' };
    }
    if (this.modules.has(key)) {
      return { ok: false, reason: 'Já existe um módulo neste espaço.' };
    }
    const mod: PlacedModule = {
      id: `mod_${this.moduleSeq++}`,
      kind,
      gx,
      gz,
      rotation: ((rotation % 4) + 4) % 4,
      hp: 100,
      maxHp: 100,
      mass,
      progress: 0,
      readyCount: 0,
      active: kind === 'vela',
      planted: false,
      watered: false,
      storedItems: kind === 'bau' ? {} : undefined,
      fuel:kind==='motor'?0:undefined,
    };
    this.modules.set(key, mod);
    return { ok: true, module: mod };
  }

  /** Retorna a posição de spawn segura (cama válida ou núcleo 0,0). */
  getSafeSpawnLocal(): { x: number; y: number; z: number } {
    for (const m of this.modules.values()) {
      if (m.kind === 'cama') {
        return { x: m.gx, y: 0.4, z: m.gz };
      }
    }
    const core = this.foundations.get('0,0') ?? this.foundations.values().next().value;
    if (core) {
      return { x: core.gx, y: 0.35, z: core.gz };
    }
    return { x: 0, y: 0.5, z: 0 };
  }

  isAnchorDropped(): boolean {
    for (const m of this.modules.values()) {
      if (m.kind === 'ancora' && m.active) return true;
    }
    return false;
  }

  hasActiveSail(): boolean {
    for (const m of this.modules.values()) {
      if (m.kind === 'vela' && m.active) return true;
    }
    return false;
  }

  hasModuleKind(kind: PlacedModule['kind']): boolean {
    for (const m of this.modules.values()) {
      if (m.kind === kind) return true;
    }
    return false;
  }

  serialize(): SerializedRaftGrid {
    return {
      foundations: Array.from(this.foundations.values()),
      modules: Array.from(this.modules.values()),
      maxFoundations: this.maxFoundations,
    };
  }

  restore(data: SerializedRaftGrid): void {
    this.foundations.clear();
    this.modules.clear();
    this.maxFoundations = data.maxFoundations || 256;
    for (const f of data.foundations) {
      this.foundations.set(cellKey(f.gx, f.gz), { ...f });
    }
    let maxSeq = 1;
    for (const m of data.modules) {
      if(this.getFoundation(m.gx,m.gz))this.modules.set(moduleKey(m.kind,m.gx,m.gz,m.rotation), { ...m });
      const parsed = Number(m.id.replace('mod_', ''));
      if (!Number.isNaN(parsed)) maxSeq = Math.max(maxSeq, parsed + 1);
    }
    this.moduleSeq = maxSeq;
  }
}
