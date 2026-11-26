import { ITEMS } from '../data/items';
import type { RecipeDef } from '../data/recipes';

export interface InventorySlot {
  itemId: string;
  count: number;
  durability?: number;
}

export interface SerializedInventory {
  slots: Array<InventorySlot | null>;
  capacity: number;
  selectedHotbar: number;
  revision: number;
}

export interface AddItemResult {
  added: number;
  overflow: number;
}

/**
 * Inventário em grade (20 slots padrão, expansível até 44) com barra rápida nos primeiros 8 slots.
 * Operações transacionais garantem que nenhum item seja perdido ou duplicado.
 */
export class Inventory {
  static readonly HOTBAR_SIZE = 8;
  slots: Array<InventorySlot | null>;
  capacity: number;
  selectedHotbar = 0;
  revision = 1;

  constructor(capacity = 20) {
    this.capacity = capacity;
    this.slots = new Array<InventorySlot | null>(capacity).fill(null);
  }

  getItemCount(itemId: string): number {
    let total = 0;
    for (const slot of this.slots) {
      if (slot && slot.itemId === itemId) total += slot.count;
    }
    return total;
  }

  getSelectedSlot(): InventorySlot | null {
    return this.slots[this.selectedHotbar] ?? null;
  }

  selectHotbar(index: number): void {
    if (index >= 0 && index < Inventory.HOTBAR_SIZE && index < this.capacity) {
      this.selectedHotbar = index;
    }
  }

  /**
   * Adiciona quantidade de um item empilhando primeiro em slots existentes e depois em vazios.
   * Nunca descarta excedente silenciosamente: retorna `overflow`.
   */
  addItem(itemId: string, count: number, durability?: number): AddItemResult {
    const def = ITEMS[itemId];
    if (!def || count <= 0) return { added: 0, overflow: Math.max(0, count) };

    let remaining = count;
    const stackMax = def.stackMax;

    if (stackMax > 1) {
      for (let i = 0; i < this.capacity && remaining > 0; i++) {
        const s = this.slots[i];
        if (s && s.itemId === itemId && s.count < stackMax) {
          const take = Math.min(remaining, stackMax - s.count);
          s.count += take;
          remaining -= take;
        }
      }
    }

    for (let i = 0; i < this.capacity && remaining > 0; i++) {
      if (this.slots[i] === null) {
        const take = Math.min(remaining, stackMax);
        const slot: InventorySlot = { itemId, count: take };
        if (def.maxDurability !== undefined) {
          slot.durability = durability ?? def.maxDurability;
        }
        this.slots[i] = slot;
        remaining -= take;
      }
    }

    const added = count - remaining;
    if (added > 0) this.revision += 1;
    return { added, overflow: remaining };
  }

  hasItems(requirements: ReadonlyArray<{ itemId: string; count: number }>): boolean {
    for (const req of requirements) {
      if (this.getItemCount(req.itemId) < req.count) return false;
    }
    return true;
  }

  /**
   * Remove itens atomicamente: se faltar qualquer ingrediente, nada é removido.
   */
  consumeItems(requirements: ReadonlyArray<{ itemId: string; count: number }>): boolean {
    if (!this.hasItems(requirements)) return false;

    for (const req of requirements) {
      let left = req.count;
      for (let i = this.capacity - 1; i >= 0 && left > 0; i--) {
        const s = this.slots[i];
        if (s && s.itemId === req.itemId) {
          const take = Math.min(left, s.count);
          s.count -= take;
          left -= take;
          if (s.count <= 0) {
            this.slots[i] = null;
          }
        }
      }
    }
    this.revision += 1;
    return true;
  }

  /**
   * Executa fabricação atômica de receita: verifica espaço de saída antes de consumir insumos.
   */
  craft(recipe: RecipeDef): { ok: boolean; reason?: string } {
    if (!this.hasItems(recipe.ingredients)) {
      return { ok: false, reason: 'Recursos insuficientes.' };
    }
    if (recipe.outputItemId && recipe.outputCount) {
      if (!this.canFitAfterConsume(recipe.ingredients, recipe.outputItemId, recipe.outputCount)) {
        return { ok: false, reason: 'Mochila cheia para o item produzido.' };
      }
    }

    const consumed = this.consumeItems(recipe.ingredients);
    if (!consumed) return { ok: false, reason: 'Falha ao consumir recursos.' };

    if (recipe.outputItemId && recipe.outputCount) {
      this.addItem(recipe.outputItemId, recipe.outputCount);
    }
    return { ok: true };
  }

  private canFitAfterConsume(
    ingredients: ReadonlyArray<{ itemId: string; count: number }>,
    outItemId: string,
    outCount: number
  ): boolean {
    const clone = this.clone();
    clone.consumeItems(ingredients);
    const res = clone.addItem(outItemId, outCount);
    return res.overflow === 0;
  }

  swapSlots(a: number, b: number): void {
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a >= this.capacity || b >= this.capacity || a === b) return;
    const tmp = this.slots[a];
    this.slots[a] = this.slots[b];
    this.slots[b] = tmp;
    this.revision += 1;
  }

  /** Move, empilha até o limite ou troca. Nunca mistura ferramentas com durabilidade. */
  moveSlot(from:number,to:number):boolean {
    if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=this.capacity||to>=this.capacity||from===to)return false;
    const src=this.slots[from],dst=this.slots[to];
    if(!src)return false;
    const max=ITEMS[src.itemId]?.stackMax??1;
    if(dst&&src.itemId===dst.itemId&&src.durability===undefined&&dst.durability===undefined&&max>1){
      const count=Math.min(src.count,Math.max(0,max-dst.count));
      if(!count)return false;
      dst.count+=count;src.count-=count;
      if(src.count===0)this.slots[from]=null;
      this.revision++;return true;
    }
    this.swapSlots(from,to);return true;
  }

  /** Consolida e ordena apenas a mochila, sem tocar nos oito atalhos. */
  organizeBackpack():void {
    const start=Math.min(Inventory.HOTBAR_SIZE,this.capacity);
    const result:InventorySlot[]=[];
    for(const slot of this.slots.slice(start)){
      if(!slot)continue;
      let left=slot.count;
      const max=ITEMS[slot.itemId]?.stackMax??1;
      if(slot.durability===undefined&&max>1){
        for(const dst of result){
          if(dst.itemId!==slot.itemId||dst.durability!==undefined)continue;
          const take=Math.min(left,Math.max(0,max-dst.count));dst.count+=take;left-=take;
          if(!left)break;
        }
      }
      if(left>0)result.push({...slot,count:left});
    }
    const rank:Record<string,number>={ferramenta:0,consumivel:1,recurso:2,estrutura:3,missao:4};
    result.sort((a,b)=>(rank[ITEMS[a.itemId]?.category]??5)-(rank[ITEMS[b.itemId]?.category]??5)||(ITEMS[a.itemId]?.name??a.itemId).localeCompare(ITEMS[b.itemId]?.name??b.itemId,'pt-BR'));
    for(let i=start;i<this.capacity;i++)this.slots[i]=result[i-start]??null;
    this.revision++;
  }

  consumeSlot(index:number):boolean {
    if(!Number.isInteger(index)||index<0||index>=this.capacity)return false;
    const slot=this.slots[index];if(!slot||slot.count<1)return false;
    if(--slot.count===0)this.slots[index]=null;
    this.revision++;return true;
  }

  splitSlot(index: number): boolean {
    const slot = this.slots[index];
    if (!slot || slot.count < 2) return false;
    if(slot.durability!==undefined)return false;
    const backpackEmpty=this.slots.findIndex((s,i)=>i>=Inventory.HOTBAR_SIZE&&s===null);
    const emptyIdx=backpackEmpty>=0?backpackEmpty:this.slots.findIndex(s=>s===null);
    if (emptyIdx === -1) return false;
    const half = Math.floor(slot.count / 2);
    slot.count -= half;
    this.slots[emptyIdx] = { itemId: slot.itemId, count: half };
    this.revision += 1;
    return true;
  }

  damageSlot(index: number, amount = 1): boolean {
    const slot = this.slots[index];
    if (!slot || slot.durability === undefined) return false;
    slot.durability = Math.max(0, slot.durability - amount);
    if (slot.durability === 0) {
      this.slots[index] = null;
    }
    this.revision += 1;
    return true;
  }

  /**
   * Penalidade de morte solo normal: perde ~20% dos itens comuns não protegidos e retorna bolsa perdida.
   */
  applyNormalDeathPenalty(): Array<{ itemId: string; count: number }> {
    const dropped: Array<{ itemId: string; count: number }> = [];
    for (let i = 0; i < this.capacity; i++) {
      const s = this.slots[i];
      if (!s) continue;
      const def = ITEMS[s.itemId];
      if (def?.protectedOnDeath || def?.category === 'ferramenta' || def?.category === 'missao') {
        continue;
      }
      const lose = Math.max(0, Math.floor(s.count * 0.2));
      if (lose > 0) {
        s.count -= lose;
        dropped.push({ itemId: s.itemId, count: lose });
        if (s.count <= 0) this.slots[i] = null;
      }
    }
    if (dropped.length > 0) this.revision += 1;
    return dropped;
  }

  clone(): Inventory {
    const copy = new Inventory(this.capacity);
    copy.selectedHotbar = this.selectedHotbar;
    copy.revision = this.revision;
    copy.slots = this.slots.map((s) => (s ? { ...s } : null));
    return copy;
  }

  serialize(): SerializedInventory {
    return {
      capacity: this.capacity,
      selectedHotbar: this.selectedHotbar,
      revision: this.revision,
      slots: this.slots.map((s) => (s ? { ...s } : null)),
    };
  }

  static deserialize(data: SerializedInventory): Inventory {
    const inv = new Inventory(data.capacity || 20);
    inv.selectedHotbar = data.selectedHotbar ?? 0;
    inv.revision = data.revision ?? 1;
    for (let i = 0; i < inv.capacity && i < data.slots.length; i++) {
      const s = data.slots[i];
      inv.slots[i] = s && ITEMS[s.itemId] ? { ...s } : null;
    }
    return inv;
  }
}
