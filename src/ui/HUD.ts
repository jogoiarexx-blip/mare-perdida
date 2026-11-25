import { ITEMS } from '../data/items';
import { gameIcon } from './Icons';
import type { Inventory } from '../player/Inventory';
import type { SurvivalSystem } from '../player/Survival';
import type { QuestEngine } from '../quests/QuestEngine';
import type { BuoyancyMetrics } from '../raft/StructureGraph';

export interface HudSnapshot {
  survival: SurvivalSystem;
  inventory: Inventory;
  quests: QuestEngine;
  buoyancy: BuoyancyMetrics;
  clockText: string;
  dayCount: number;
  weather: string;
  compassText: string;
  minimap?:string;
  promptText: string;
  buildModeLabel: string | null;
  saveStatus: string;
  sharkWarning: string | null;
}

/**
 * Interface de voo (HUD): vitais, barra rápida 8 slots, bússola, missões, diálogos e controles touch.
 */
export class HUD {
  private readonly root: HTMLElement;
  private vitalsEl: HTMLElement;
  private compassEl: HTMLElement;
  private minimapEl:HTMLElement;
  private mapVisible=false;
  isMinimapVisible(){return this.mapVisible;}
  toggleMinimap(){this.mapVisible=!this.mapVisible;this.minimapEl.classList.toggle('hidden',!this.mapVisible);}
  private questEl: HTMLElement;
  private promptEl: HTMLElement;
  private hotbarEl: HTMLElement;
  private toastsEl: HTMLElement;
  private dialogueEl: HTMLElement;
  private touchEl: HTMLElement;

  private dialogueQueue: Array<{ speaker: string; lines: string[] }> = [];
  private currentLineIdx = 0;
  private hotbarSignature = '';
  private readonly rendered = new Map<HTMLElement,string>();
  private updateMarkup(el:HTMLElement,html:string):void {
    if(this.rendered.get(el)===html)return;
    this.rendered.set(el,html);el.innerHTML=html;
  }

  onSelectHotbar?: (idx: number) => void;
  onOpenPanel?: (tab: 'mochila' | 'construcao' | 'diario' | 'opcoes') => void;
  onOpenMenu?: () => void;
  onTouchAction?: (action: 'use' | 'interact' | 'jump' | 'build') => void;
  onTouchMove?: (x: number, y: number) => void;

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.innerHTML = `
      <div class="hud-top-left">
        <div class="glass-card" id="hud-vitals"></div>
        <div class="glass-card hud-interactive" id="hud-quick-btns" style="display:flex;gap:6px;flex-wrap:wrap;padding:6px 8px;">
          <button class="btn" data-tab="mochila" title="Inventário e Fabricação (I)">${gameIcon('mochila')} [I]</button>
          <button class="btn" data-tab="construcao" title="Construir na jangada (B)">${gameIcon('construcao')} [B]</button>
          <button class="btn" data-tab="diario" title="Diário de Missões (J)">${gameIcon('diario')} [J]</button>
          <button class="btn" data-map="1" title="Minimapa (M)">${gameIcon('carta_verde')} [M]</button>
          <button class="btn" data-menu="1" title="Menu e Saves (Esc)">${gameIcon('opcoes')} [Esc]</button>
        </div>
      </div>

      <div class="hud-top-center">
        <div class="glass-card compass-bar" id="hud-compass"></div>
        <div class="glass-card minimap hidden" id="hud-minimap"></div>
      </div>

      <div class="hud-top-right">
        <div class="glass-card" id="hud-quest"></div>
      </div>

      <div class="crosshair" aria-hidden="true"></div>
      <div class="prompt-pill hidden" id="hud-prompt"></div>

      <div class="toast-stack" id="hud-toasts"></div>

      <div class="dialogue-box hud-interactive hidden" id="hud-dialogue"></div>

      <div class="hotbar-wrap">
        <div class="glass-card hotbar hud-interactive" id="hud-hotbar"></div>
      </div>

      <div class="touch-controls hidden" id="hud-touch">
        <div class="touch-pad" id="touch-pad"><div class="touch-knob" id="touch-knob"></div></div>
        <div class="touch-actions">
          <button class="touch-btn" data-touch="use">${gameIcon('use','action')}<span>Usar</span></button>
          <button class="touch-btn" data-touch="interact">${gameIcon('acao','action')}<span>Ação</span></button>
          <button class="touch-btn" data-touch="jump">${gameIcon('pular','action')}<span>Pular</span></button>
          <button class="touch-btn" data-touch="build">${gameIcon('construcao','action')}<span>Obra</span></button>
        </div>
      </div>
    `;
    container.appendChild(this.root);

    this.vitalsEl = this.root.querySelector('#hud-vitals')!;
    this.compassEl = this.root.querySelector('#hud-compass')!;
    this.minimapEl=this.root.querySelector('#hud-minimap')!;
    this.questEl = this.root.querySelector('#hud-quest')!;
    this.promptEl = this.root.querySelector('#hud-prompt')!;
    this.hotbarEl = this.root.querySelector('#hud-hotbar')!;
    this.toastsEl = this.root.querySelector('#hud-toasts')!;
    this.dialogueEl = this.root.querySelector('#hud-dialogue')!;
    this.touchEl = this.root.querySelector('#hud-touch')!;

    this.root.querySelector('#hud-quick-btns')?.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('button');
      if (!btn) return;
      const tab = btn.getAttribute('data-tab') as 'mochila' | 'construcao' | 'diario' | 'opcoes' | null;
      if (tab) this.onOpenPanel?.(tab);
      if(btn.getAttribute('data-map'))this.toggleMinimap();
      if (btn.getAttribute('data-menu')) this.onOpenMenu?.();
    });

    this.setupTouchControls();
  }

  private setupTouchControls(): void {
    this.touchEl.querySelectorAll('[data-touch]').forEach((el) => {
      el.addEventListener('click', () => {
        const action = el.getAttribute('data-touch') as 'use' | 'interact' | 'jump' | 'build';
        this.onTouchAction?.(action);
      });
    });

    const pad = this.root.querySelector('#touch-pad') as HTMLElement;
    const knob = this.root.querySelector('#touch-knob') as HTMLElement;
    let tracking = false;

    const handleMove = (clientX: number, clientY: number) => {
      const rect = pad.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const maxR = rect.width * 0.4;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const len = Math.hypot(dx, dy);
      if (len > maxR) {
        dx = (dx / len) * maxR;
        dy = (dy / len) * maxR;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.onTouchMove?.(dx / maxR, -dy / maxR);
    };

    pad.addEventListener('pointerdown', (e) => {
      tracking = true;
      pad.setPointerCapture(e.pointerId);
      handleMove(e.clientX, e.clientY);
    });
    pad.addEventListener('pointermove', (e) => {
      if (tracking) handleMove(e.clientX, e.clientY);
    });
    const reset = () => {
      tracking = false;
      knob.style.transform = 'translate(0px, 0px)';
      this.onTouchMove?.(0, 0);
    };
    pad.addEventListener('pointerup', reset);
    pad.addEventListener('pointercancel', reset);
  }

  setTouchVisible(show: boolean): void {
    this.touchEl.classList.toggle('hidden', !show);
  }

  pushToast(text: string, kind: 'info' | 'warn' | 'success' | 'danger' = 'info'): void {
    const div = document.createElement('div');
    div.className = `toast ${kind}`;
    div.textContent = text;
    this.toastsEl.appendChild(div);
    while (this.toastsEl.children.length > 4) {
      this.toastsEl.firstElementChild?.remove();
    }
    setTimeout(() => div.remove(), 4500);
  }

  enqueueDialogue(speaker: string, lines: string[]): void {
    this.dialogueQueue.push({ speaker, lines });
    if (this.dialogueQueue.length === 1) {
      this.currentLineIdx = 0;
      this.renderDialogue();
    }
  }

  advanceDialogue(): boolean {
    if (this.dialogueQueue.length === 0) return false;
    const current = this.dialogueQueue[0];
    this.currentLineIdx += 1;
    if (this.currentLineIdx >= current.lines.length) {
      this.dialogueQueue.shift();
      this.currentLineIdx = 0;
    }
    this.renderDialogue();
    return true;
  }

  private renderDialogue(): void {
    if (this.dialogueQueue.length === 0) {
      this.dialogueEl.classList.add('hidden');
      return;
    }
    const cur = this.dialogueQueue[0];
    this.dialogueEl.classList.remove('hidden');
    this.dialogueEl.innerHTML = `
      <div class="dialogue-speaker">${cur.speaker}</div>
      <div style="margin-bottom:8px;line-height:1.4;">${cur.lines[this.currentLineIdx]}</div>
      <div style="display:flex;justify-content:flex-end;gap:8px;">
        <button class="btn primary" id="dlg-next">${this.currentLineIdx + 1 < cur.lines.length ? 'Próximo' : 'Fechar'}</button>
      </div>
    `;
    this.dialogueEl.querySelector('#dlg-next')?.addEventListener('click', () => this.advanceDialogue());
  }

  update(snap: HudSnapshot): void {
    if(this.mapVisible&&snap.minimap)this.updateMarkup(this.minimapEl,snap.minimap);
    const s = snap.survival;
    const rows = [
      { label: 'Saúde', icon: 'saude', val: s.health, max: 100, color: '#ef4444' },
      { label: 'Fome', icon: 'fome', val: s.hunger, max: 100, color: '#f59e0b' },
      { label: 'Sede', icon: 'agua_pura', val: s.thirst, max: 100, color: '#38bdf8' },
      { label: 'Energia', icon: 'energia', val: s.stamina, max: 100, color: '#34d399' },
    ];
    if (s.oxygen < s.maxOxygen - 0.5) {
      rows.push({ label: 'Oxigênio', icon: 'oxigenio', val: s.oxygen, max: s.maxOxygen, color: '#a78bfa' });
    }

    this.updateMarkup(this.vitalsEl, rows
      .map(
        (r) => `
      <div class="vital-row">
        <span class="vital-label">${gameIcon(r.icon)}<span>${r.label}</span></span>
        <div class="vital-bar"><div class="vital-fill" style="width:${Math.round((r.val / r.max) * 100)}%;background:${r.color};"></div></div>
        <span class="vital-val">${Math.ceil(r.val)}</span>
      </div>`
      )
      .join(''));

    const b = snap.buoyancy;
    const massWarn = b.overweight ? 'SOBREPESO' : b.lowMarginWarning ? 'Margem <15%' : 'Estável';
    this.updateMarkup(this.compassEl, `
      <span>Dia ${snap.dayCount} · ${snap.clockText} (${snap.weather})</span>
      <span>${gameIcon('bussola')} ${snap.compassText}</span>
      <span>${gameIcon('peso')} ${b.totalMass}/${b.capacity} (${massWarn})</span>
      <span style="color:var(--muted);">${snap.saveStatus}</span>
    `);

    const active = snap.quests.getActiveMainQuest();
    let questHtml = '';
    if (active) {
      questHtml += `<div class="quest-title">${active.def.id}: ${active.def.title}</div>`;
      questHtml += active.def.objectives
        .map((obj) => {
          const cur = active.state.progress[obj.id] ?? 0;
          const done = cur >= obj.count;
          return `<div class="quest-obj ${done ? 'done' : ''}">• ${obj.description} (${cur}/${obj.count})</div>`;
        })
        .join('');
    } else {
      questHtml = `<div class="quest-title">Capítulo 1 concluído!</div>
        <div class="quest-obj">Explore o Mar dos Destroços ou complete secundárias no Diário [J].</div>`;
    }
    if (snap.sharkWarning) {
      questHtml += `<div style="margin-top:6px;color:#f87171;font-weight:700;">${gameIcon('tubarao')} ${snap.sharkWarning}</div>`;
    }
    if (snap.buildModeLabel) {
      questHtml += `<div style="margin-top:6px;color:#34d399;font-weight:600;">${gameIcon('construcao')} Construindo: ${snap.buildModeLabel} ([R] Girar · [Click] Colocar · [B/Esc] Sair)</div>`;
    }
    this.updateMarkup(this.questEl,questHtml);

    if (snap.promptText) {
      if(this.promptEl.textContent!==snap.promptText)this.promptEl.textContent = snap.promptText;
      this.promptEl.classList.remove('hidden');
    } else {
      this.promptEl.classList.add('hidden');
    }

    // Hotbar 8 slots
    const signature = JSON.stringify([snap.inventory.selectedHotbar, ...snap.inventory.slots.slice(0,8).map(slot => slot ? [slot.itemId,slot.count,slot.durability] : null)]);
    if (signature === this.hotbarSignature) return;
    this.hotbarSignature = signature;
    this.hotbarEl.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      const slot = snap.inventory.slots[i];
      const def = slot ? ITEMS[slot.itemId] : null;
      const btn = document.createElement('button');
      btn.className = `slot-btn ${snap.inventory.selectedHotbar === i ? 'selected' : ''}`;
      btn.setAttribute('aria-label', def ? `Slot ${i+1}: ${def.name}` : `Slot ${i+1}: vazio`);
      btn.title = def ? `${def.name}: ${def.description}` : `Slot ${i + 1}`;
      btn.innerHTML = `
        <span class="slot-key">${i + 1}</span>
        <span class="slot-art">${def ? gameIcon(def.id,'item') : ''}</span>
        <span class="slot-count">${slot ? (slot.durability !== undefined ? `${slot.durability}` : slot.count) : ''}</span>
      `;
      btn.addEventListener('click', () => this.onSelectHotbar?.(i));
      this.hotbarEl.appendChild(btn);
    }
  }
}
