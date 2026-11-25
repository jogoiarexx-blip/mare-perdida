import { ITEMS } from '../data/items';
import { gameIcon } from './Icons';
import { RECIPES, type RecipeDef, type StructureKind } from '../data/recipes';
import type { Inventory } from '../player/Inventory';
import type { QuestEngine } from '../quests/QuestEngine';
import type { GameOptions } from '../save/Store';

export type PanelTab = 'mochila' | 'construcao' | 'diario' | 'opcoes';

export interface PanelContext {
  onClose: () => void;
  inventory: Inventory;
  quests: QuestEngine;
  options: GameOptions;
  hasPurifier: boolean;
  hasGrill: boolean;
  onCraft: (recipe: RecipeDef) => void;
  onSelectBuild: (kind: StructureKind, recipe: RecipeDef) => void;
  onUseInventorySlot: (index: number) => void;
  onMoveToHotbar: (index: number) => void;
  onSwapSlots: (from: number, to: number) => void;
  onSplitSlot: (index: number) => void;
  onOptionsChanged: (opts: GameOptions) => void;
  onManualSave: () => void;
  onExportSave: () => void;
  onImportSave: (text: string) => void;
}

/**
 * Painel modal em abas (Mochila/Fabricação, Construção, Diário e Opções) + Menus inicial e pausa.
 */
export class Modals {
  private readonly modalBackdrop: HTMLElement;
  private readonly menuBackdrop: HTMLElement;
  private currentTab: PanelTab | null = null;
  private lastCtx: PanelContext | null = null;

  constructor(container: HTMLElement) {
    this.modalBackdrop = document.createElement('div');
    this.modalBackdrop.className = 'modal-backdrop hidden';
    container.appendChild(this.modalBackdrop);

    this.menuBackdrop = document.createElement('div');
    this.menuBackdrop.className = 'modal-backdrop hidden';
    container.appendChild(this.menuBackdrop);
  }

  isOpen(): boolean {
    return !this.modalBackdrop.classList.contains('hidden') || !this.menuBackdrop.classList.contains('hidden');
  }

  closeAll(): void {
    this.currentTab = null;
    this.lastCtx = null;
    this.modalBackdrop.classList.add('hidden');
    this.menuBackdrop.classList.add('hidden');
  }

  showMainMenu(params: {
    hasSave: boolean;
    onContinue: () => void;
    onNewWorld: (difficulty: 'historia' | 'normal' | 'dificil') => void;
    onImportJson: (raw: string) => void;
  }): void {
    this.menuBackdrop.classList.remove('hidden');
    this.menuBackdrop.innerHTML = `
      <div class="modal-card" style="max-width:520px;text-align:center;">
        <h1 style="margin:0;color:var(--accent);">MARÉ PERDIDA</h1>
        <div style="color:var(--muted);margin-bottom:8px;">O Último Horizonte — Capítulo 1: Mar dos Destroços</div>
        <p style="font-size:0.9em;line-height:1.45;text-align:left;margin:4px 0 10px;">
          Ano 2089. Construa sua jangada, colete destroços com o gancho, purifique água,
          sintonize o sinal de Lia no rádio e enfrente Mandíbula Branca.
        </p>
        ${params.hasSave ? '<button class="btn primary" id="mm-continue">Continuar Mundo Salvo</button>' : ''}
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
          <button class="btn ${params.hasSave ? '' : 'primary'}" id="mm-new-normal">Novo Mundo (Normal)</button>
          <button class="btn" id="mm-new-story">Novo Mundo (História)</button>
          <button class="btn" id="mm-new-hard">Novo Mundo (Difícil)</button>
        </div>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:6px;">
          <label class="btn" style="cursor:pointer;">
            Importar Save (.json)
            <input type="file" id="mm-import" accept=".json,application/json" style="display:none;" />
          </label>
        </div>
        <button class="btn" id="mm-p2p">Testar conexão P2P</button>
        <div style="font-size:0.8em;color:var(--muted);margin-top:8px;">
          Controles: WASD andar · Espaço pular/nadar · Click/F usar ferramenta · E interagir · B construir · I mochila · J diário · V 1ª/3ª pessoa
        </div>
      </div>
    `;
    const p2p = this.menuBackdrop.querySelector<HTMLButtonElement>('#mm-p2p');
    p2p?.addEventListener('click', async () => {
      p2p.disabled = true;
      try {
        const { openPeerDiagnostic } = await import('./PeerDiagnostic');
        openPeerDiagnostic(() => {
          p2p.disabled = false;
          p2p.focus();
        });
      } catch {
        p2p.disabled = false;
        p2p.textContent = 'Falha ao abrir. Tentar conexão P2P novamente';
      }
    });
    this.menuBackdrop.querySelector('#mm-continue')?.addEventListener('click', () => {
      this.closeAll();
      params.onContinue();
    });
    this.menuBackdrop.querySelector('#mm-new-normal')?.addEventListener('click', () => {
      this.closeAll();
      params.onNewWorld('normal');
    });
    this.menuBackdrop.querySelector('#mm-new-story')?.addEventListener('click', () => {
      this.closeAll();
      params.onNewWorld('historia');
    });
    this.menuBackdrop.querySelector('#mm-new-hard')?.addEventListener('click', () => {
      this.closeAll();
      params.onNewWorld('dificil');
    });
    this.menuBackdrop.querySelector('#mm-import')?.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      params.onImportJson(text);
    });
  }

  showPauseMenu(params: {
    onResume: () => void;
    onSave: () => void;
    onExport: () => void;
    onOpenOptions: () => void;
  }): void {
    this.menuBackdrop.classList.remove('hidden');
    this.menuBackdrop.innerHTML = `
      <div class="modal-card" style="max-width:400px;text-align:center;">
        <h2 style="margin:0;">Jogo Pausado</h2>
        <button class="btn primary" id="pm-resume">Retomar</button>
        <button class="btn" id="pm-save">Salvar Agora (Slot A/B)</button>
        <button class="btn" id="pm-export">Exportar Save (.json)</button>
        <button class="btn" id="pm-opts">Opções e Acessibilidade</button>
      </div>
    `;
    this.menuBackdrop.querySelector('#pm-resume')?.addEventListener('click', () => {
      this.closeAll();
      params.onResume();
    });
    this.menuBackdrop.querySelector('#pm-save')?.addEventListener('click', params.onSave);
    this.menuBackdrop.querySelector('#pm-export')?.addEventListener('click', params.onExport);
    this.menuBackdrop.querySelector('#pm-opts')?.addEventListener('click', () => {
      this.menuBackdrop.classList.add('hidden');
      params.onOpenOptions();
    });
  }

  openPanel(tab: PanelTab, ctx: PanelContext): void {
    this.currentTab = tab;
    this.lastCtx = ctx;
    this.modalBackdrop.classList.remove('hidden');
    this.renderPanel();
  }

  refreshIfOpen(ctx: PanelContext): void {
    if (this.currentTab) {
      this.lastCtx = ctx;
      this.renderPanel();
    }
  }

  private renderPanel(): void {
    const ctx = this.lastCtx;
    const tab = this.currentTab;
    if (!ctx || !tab) return;

    this.modalBackdrop.innerHTML = `
      <div class="modal-card">
        <div class="modal-tabs">
          <button class="tab-btn ${tab === 'mochila' ? 'active' : ''}" data-t="mochila">${gameIcon('mochila')} Mochila & Fabricação</button>
          <button class="tab-btn ${tab === 'construcao' ? 'active' : ''}" data-t="construcao">${gameIcon('construcao')} Construção Naval</button>
          <button class="tab-btn ${tab === 'diario' ? 'active' : ''}" data-t="diario">${gameIcon('diario')} Diário</button>
          <button class="tab-btn ${tab === 'opcoes' ? 'active' : ''}" data-t="opcoes">${gameIcon('opcoes')} Opções & Saves</button>
          <button class="btn" id="panel-close" style="margin-left:auto;">${gameIcon('close')} Fechar [Esc]</button>
        </div>
        <div class="modal-body" id="panel-body"></div>
      </div>
    `;

    this.modalBackdrop.querySelectorAll('[data-t]').forEach((el) => {
      el.addEventListener('click', () => {
        this.currentTab = el.getAttribute('data-t') as PanelTab;
        this.renderPanel();
      });
    });
    this.modalBackdrop.querySelector('#panel-close')?.addEventListener('click', () => {
      this.closeAll();
      ctx.onClose();
    });

    const body = this.modalBackdrop.querySelector('#panel-body')!;
    if (tab === 'mochila') this.renderBackpackAndCraft(body, ctx);
    else if (tab === 'construcao') this.renderBuildTab(body, ctx);
    else if (tab === 'diario') this.renderJournalTab(body, ctx);
    else this.renderOptionsTab(body, ctx);
  }

  private renderBackpackAndCraft(body: Element, ctx: PanelContext): void {
    const slotsHtml = ctx.inventory.slots
      .map((s, idx) => {
        const def = s ? ITEMS[s.itemId] : null;
        return `
          <div class="slot-btn" style="width:100%;height:60px;" data-slot="${idx}" title="${def ? `${def.name}: ${def.description}` : 'Vazio'}">
            <span class="slot-key">${idx < 8 ? `Barra ${idx + 1}` : idx + 1}</span>
            <span class="slot-art">${def ? gameIcon(def.id,'item') : ''}</span>
            <span class="slot-count">${s ? (s.durability !== undefined ? `${s.durability}` : s.count) : ''}</span>
          </div>`;
      })
      .join('');

    const craftRecipes = RECIPES.filter((r) => !r.placesStructure);
    const recipesHtml = craftRecipes
      .map((r) => {
        const benchOk =
          r.bench === 'manual' ||
          (r.bench === 'purificador' && ctx.hasPurifier) ||
          (r.bench === 'churrasqueira' && ctx.hasGrill);
        const hasMat = ctx.inventory.hasItems(r.ingredients);
        const canCraft = benchOk && hasMat;
        const ingText = r.ingredients
          .map((i) => `${gameIcon(i.itemId)} ${ITEMS[i.itemId]?.name ?? i.itemId} (${ctx.inventory.getItemCount(i.itemId)}/${i.count})`)
          .join(' · ');
        const benchHint =
          r.bench === 'purificador' && !ctx.hasPurifier
            ? ' [Requer Purificador]'
            : r.bench === 'churrasqueira' && !ctx.hasGrill
              ? ' [Requer Churrasqueira]'
              : '';
        return `
          <div class="recipe-row">
            <div>
              <div><strong>${r.name}</strong>${benchHint}</div>
              <div style="font-size:0.8em;color:var(--muted);">${ingText}</div>
            </div>
            <button class="btn ${canCraft ? 'primary' : ''}" data-craft="${r.id}" ${canCraft ? '' : 'disabled'}>Fabricar</button>
          </div>`;
      })
      .join('');

    body.innerHTML = `
      <div class="grid-2">
        <div>
          <h3 style="margin-top:0;">Mochila (${ctx.inventory.capacity} slots)</h3>
          <div style="font-size:0.8em;color:var(--muted);margin-bottom:8px;">Arraste ou selecione dois espaços para organizar. Use o botão para consumir/equipar.</div>
          <div class="inv-grid">${slotsHtml}</div>
        </div>
        <div>
          <h3 style="margin-top:0;">Fabricação</h3>
          ${recipesHtml}
        </div>
      </div>
    `;


    // Seleção explícita: nenhum alimento é consumido ao apenas tocar em um slot.
    {
      const grid = body.querySelector<HTMLElement>('.inv-grid');
      if (grid) {
        const tiles = Array.from(grid.querySelectorAll<HTMLElement>('[data-slot]'));
        let selected = -1, dragged = -1;
        const tools = document.createElement('div');
        tools.className = 'mare-inventory-actions';
        tools.innerHTML = '<div class="mare-inventory-hint" aria-live="polite"></div><div class="mare-inventory-buttons"><button type="button" class="btn primary" data-inv-use>Usar / equipar</button><button type="button" class="btn" data-inv-split>Dividir pilha</button><button type="button" class="btn" data-inv-cancel>Cancelar</button></div>';
        grid.after(tools);
        const hint = tools.querySelector<HTMLElement>('.mare-inventory-hint')!;
        const use = tools.querySelector<HTMLButtonElement>('[data-inv-use]')!;
        const split = tools.querySelector<HTMLButtonElement>('[data-inv-split]')!;
        const cancel = tools.querySelector<HTMLButtonElement>('[data-inv-cancel]')!;
        const paint = () => {
          const slot = ctx.inventory.slots[selected];
          for (const tile of tiles) {
            const idx = Number(tile.dataset.slot);
            tile.classList.toggle('mare-slot-picked',idx===selected);
            tile.setAttribute('aria-pressed',String(idx===selected));
            tile.setAttribute('aria-label',(idx<8?'Barra rápida '+(idx+1):'Mochila '+(idx+1))+': '+tile.title);
          }
          hint.textContent = slot ? (ITEMS[slot.itemId]?.name ?? slot.itemId)+' selecionado. Toque no destino para trocar.' : 'Selecione um item e toque no destino, ou arraste com o mouse.';
          use.disabled = !slot; split.disabled = !slot || slot.count<2 || !ctx.inventory.slots.includes(null); cancel.disabled = selected<0;
        };
        const move = (from: number,to: number) => {
          if (from===to || !Number.isInteger(from) || !Number.isInteger(to) || from<0 || to<0 || from>=ctx.inventory.capacity || to>=ctx.inventory.capacity || !ctx.inventory.slots[from]) { selected=-1;paint();return; }
          selected=-1; dragged=-1;
          ctx.onSwapSlots(from,to);
        };
        const pick = (idx: number) => {
          if (selected===idx) {selected=-1;paint();return;}
          if (selected>=0 && ctx.inventory.slots[selected]) {move(selected,idx);return;}
          if (ctx.inventory.slots[idx]) selected=idx;
          paint();
        };
        for(const tile of tiles) {
          const idx=Number(tile.dataset.slot);
          tile.setAttribute('role','button');tile.tabIndex=0;tile.draggable=Boolean(ctx.inventory.slots[idx]);
          tile.addEventListener('click',ev=>{if(ev.shiftKey){ctx.onSplitSlot(idx);return;}pick(idx);});
          tile.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();ev.stopPropagation();pick(idx);}});
          tile.addEventListener('dragstart',ev=>{if(!ctx.inventory.slots[idx]){ev.preventDefault();return;}dragged=idx;selected=idx;paint();ev.dataTransfer?.setData('text/plain',String(idx));if(ev.dataTransfer)ev.dataTransfer.effectAllowed='move';});
          tile.addEventListener('dragover',ev=>{if(dragged<0)return;ev.preventDefault();if(ev.dataTransfer)ev.dataTransfer.dropEffect='move';tile.classList.add('mare-slot-target');});
          tile.addEventListener('dragleave',()=>tile.classList.remove('mare-slot-target'));
          tile.addEventListener('drop',ev=>{ev.preventDefault();tile.classList.remove('mare-slot-target');if(dragged>=0)move(dragged,idx);});
          tile.addEventListener('dragend',()=>{dragged=-1;for(const cell of tiles)cell.classList.remove('mare-slot-target');});
        }
        use.addEventListener('click',()=>{const idx=selected,slot=ctx.inventory.slots[idx];if(!slot)return;const def=ITEMS[slot.itemId];selected=-1;paint();if(def&&(def.hungerRestore!==undefined||def.thirstRestore!==undefined||def.healthRestore!==undefined))ctx.onUseInventorySlot(idx);else ctx.onMoveToHotbar(idx);});
        split.addEventListener('click',()=>{if(selected>=0)ctx.onSplitSlot(selected);});
        cancel.addEventListener('click',()=>{selected=-1;paint();});
        paint();
      }
    }
    body.querySelectorAll('[data-craft]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-craft');
        const recipe = RECIPES.find((r) => r.id === id);
        if (recipe) ctx.onCraft(recipe);
      });
    });
  }

  private renderBuildTab(body: Element, ctx: PanelContext): void {
    const buildRecipes = RECIPES.filter((r) => Boolean(r.placesStructure));
    body.innerHTML = `
      <p style="margin-top:0;color:var(--muted);font-size:0.88em;">
        Selecione uma estrutura para posicioná-la na grade de 1 m da jangada (verde = válido, vermelho = inválido).
      </p>
      ${buildRecipes
        .map((r) => {
          const hasMat = ctx.inventory.hasItems(r.ingredients);
          const ingText = r.ingredients
            .map((i) => `${gameIcon(i.itemId)} ${ITEMS[i.itemId]?.name ?? i.itemId} (${ctx.inventory.getItemCount(i.itemId)}/${i.count})`)
            .join(' · ');
          return `
            <div class="recipe-row">
              <div>
                <div>${gameIcon(r.placesStructure ?? "empty",'item')} <strong>${r.name}</strong> <span style="font-size:0.8em;color:var(--muted);">(+${r.structureMass ?? 20} massa)</span></div>
                <div style="font-size:0.8em;color:var(--muted);">${r.description} — ${ingText}</div>
              </div>
              <button class="btn ${hasMat ? 'primary' : ''}" data-build="${r.id}" ${hasMat ? '' : 'disabled'}>Posicionar</button>
            </div>`;
        })
        .join('')}
    `;

    body.querySelectorAll('[data-build]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-build');
        const recipe = RECIPES.find((r) => r.id === id);
        if (recipe?.placesStructure) {
          this.closeAll();
          ctx.onSelectBuild(recipe.placesStructure, recipe);
        }
      });
    });
  }

  private renderJournalTab(body: Element, ctx: PanelContext): void {
    const list = ctx.quests.getAllQuests();
    body.innerHTML = `
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;font-size:0.9em;">
        <span>${gameIcon('xp')} XP: <strong>${ctx.quests.xp}</strong></span>
        <span>${gameIcon('creditos')} Créditos: <strong>${ctx.quests.credits}</strong></span>
        <span>${gameIcon('farol')} Farol: <strong>${ctx.quests.reputation.farol}</strong></span>
        <span>${gameIcon('ancora')} Docas Livres: <strong>${ctx.quests.reputation.docas}</strong></span>
      </div>
      ${list
        .map(({ def, state }) => {
          const badge =
            state.status === 'COMPLETED'
              ? gameIcon('check') + ' Concluída'
              : state.status === 'ACTIVE'
                ? gameIcon('diario') + ' Ativa'
                : gameIcon('lock') + ' Bloqueada';
          const objs = def.objectives
            .map((o) => `${o.description} (${state.progress[o.id] ?? 0}/${o.count})`)
            .join(' · ');
          return `
            <div class="recipe-row" style="align-items:flex-start;">
              <div>
                <div><strong>${def.id} — ${def.title}</strong> <span style="font-size:0.8em;color:var(--muted);">[${def.type === 'main' ? 'Principal' : 'Secundária'}]</span></div>
                <div style="font-size:0.84em;margin:3px 0;">${def.summary}</div>
                <div style="font-size:0.8em;color:var(--muted);">${objs}</div>
              </div>
              <span style="white-space:nowrap;font-size:0.85em;">${badge}</span>
            </div>`;
        })
        .join('')}
    `;
  }

  private renderOptionsTab(body: Element, ctx: PanelContext): void {
    const o = ctx.options;
    body.innerHTML = `
      <div class="grid-2">
        <div>
          <h3 style="margin-top:0;">Acessibilidade & Vídeo</h3>
          <label style="display:block;margin-bottom:8px;">Qualidade gráfica:
            <select id="opt-quality" class="btn">
              <option value="alto" ${o.quality==='alto'?'selected':''}>Alta — resolução adaptativa</option>
              <option value="baixo" ${o.quality==='baixo'?'selected':''}>Baixa — desempenho</option>
            </select>
          </label>
          <label style="display:block;margin-bottom:8px;">Escala da HUD (${o.hudScale.toFixed(2)}x)
            <input type="range" id="opt-scale" min="0.8" max="1.35" step="0.05" value="${o.hudScale}" style="width:100%;" />
          </label>
          <label style="display:block;margin-bottom:8px;">FOV (${o.fov}°)
            <input type="range" id="opt-fov" min="60" max="95" step="1" value="${o.fov}" style="width:100%;" />
          </label>
          <label style="display:block;margin-bottom:8px;">Volume Geral (${Math.round(o.masterVolume * 100)}%)
            <input type="range" id="opt-vol" min="0" max="1" step="0.05" value="${o.masterVolume}" style="width:100%;" />
          </label>
          <label style="display:block;margin-bottom:6px;"><input type="checkbox" id="opt-contrast" ${o.highContrast ? 'checked' : ''} /> Alto contraste</label>
          <label style="display:block;margin-bottom:6px;"><input type="checkbox" id="opt-bob" ${o.cameraBob ? 'checked' : ''} /> Balanço de câmera</label>
          <label style="display:block;margin-bottom:8px;"><input type="checkbox" id="opt-autocollect" ${o.autoCollectNear ? 'checked' : ''} /> Auto-coleta próxima ao nadar</label>
          <label style="display:block;margin-bottom:8px;">Controles Touch:
            <select id="opt-touch" class="btn">
              <option value="auto" ${o.touchControls === 'auto' ? 'selected' : ''}>Automático</option>
              <option value="on" ${o.touchControls === 'on' ? 'selected' : ''}>Sempre ativo</option>
              <option value="off" ${o.touchControls === 'off' ? 'selected' : ''}>Desligado</option>
            </select>
          </label>
        </div>
        <div>
          <h3 style="margin-top:0;">Saves & Backup</h3>
          <p style="font-size:0.84em;color:var(--muted);">Autosave a cada 90s e ao concluir missões em dois slots rotativos no IndexedDB.</p>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <button class="btn primary" id="opt-save-now">Salvar Agora</button>
            <button class="btn" id="opt-export">Exportar Save (.json)</button>
            <label class="btn" style="text-align:center;">
              Importar Save (.json)
              <input type="file" id="opt-import" accept=".json,application/json" style="display:none;" />
            </label>
          </div>
        </div>
      </div>
    `;

    const commit = () => {
      ctx.onOptionsChanged({ ...o });
    };

    body.querySelector('#opt-quality')?.addEventListener('change', (e) => {
      o.quality=(e.target as HTMLSelectElement).value==='baixo'?'baixo':'alto';commit();
    });
    body.querySelector('#opt-scale')?.addEventListener('input', (e) => {
      o.hudScale = Number((e.target as HTMLInputElement).value);
      commit();
    });
    body.querySelector('#opt-fov')?.addEventListener('input', (e) => {
      o.fov = Number((e.target as HTMLInputElement).value);
      commit();
    });
    body.querySelector('#opt-vol')?.addEventListener('input', (e) => {
      o.masterVolume = Number((e.target as HTMLInputElement).value);
      commit();
    });
    body.querySelector('#opt-contrast')?.addEventListener('change', (e) => {
      o.highContrast = (e.target as HTMLInputElement).checked;
      commit();
    });
    body.querySelector('#opt-bob')?.addEventListener('change', (e) => {
      o.cameraBob = (e.target as HTMLInputElement).checked;
      commit();
    });
    body.querySelector('#opt-autocollect')?.addEventListener('change', (e) => {
      o.autoCollectNear = (e.target as HTMLInputElement).checked;
      commit();
    });
    body.querySelector('#opt-touch')?.addEventListener('change', (e) => {
      o.touchControls = (e.target as HTMLSelectElement).value as GameOptions['touchControls'];
      commit();
    });
    body.querySelector('#opt-save-now')?.addEventListener('click', ctx.onManualSave);
    body.querySelector('#opt-export')?.addEventListener('click', ctx.onExportSave);
    body.querySelector('#opt-import')?.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      ctx.onImportSave(await file.text());
    });
  }
}
