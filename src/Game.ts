import * as THREE from 'three';
import { EventBus } from './core/EventBus';
import { WorldClock } from './core/Clock';
import { GameLoop } from './core/GameLoop';
import { AdaptiveResolution } from './core/RenderBudget';
import { ITEMS } from './data/items';
import type { RecipeDef, StructureKind } from './data/recipes';
import { Inventory } from './player/Inventory';
import { SurvivalSystem, type Difficulty } from './player/Survival';
import { PlayerController } from './player/Controller';
import { HookController } from './player/HookAndTools';
import { cellKey, RaftGrid } from './raft/Grid';
import { StructureGraph } from './raft/StructureGraph';
import { RaftRenderer } from './raft/RaftRenderer';
import { BuildTargetPicker, evaluateBuild, type BuildTarget } from './raft/BuildTarget';
import { nearestGridEntry, FlotsamBuckets } from './raft/GridQueries';
import { OceanRenderer } from './world/Ocean';
import { ChunkManager } from './world/ChunkManager';
import { Discovery,helmStep,bearing,cardinal,headingDegrees,minimapSvg } from './world/Navigation';
import { WeatherSystem } from './world/Weather';
import { SectorManager, type FlotsamEntity } from './world/SectorManager';
import { SharkBoss } from './ai/SharkBoss';
import { MarineAmbient } from './world/MarineAmbient';
import { QuestEngine } from './quests/QuestEngine';
import { SaveStore, SAVE_SCHEMA_VERSION, type GameOptions, type WorldSaveData } from './save/Store';
import { SoundFX } from './audio/SoundFX';
import { HUD } from './ui/HUD';
import { Modals, type PanelContext, type PanelTab } from './ui/Modals';

/**
 * Orquestrador do Vertical Slice de Maré Perdida: O Último Horizonte.
 */
export class Game {
  private readonly bus = new EventBus();
  private readonly clock = new WorldClock();
  private readonly store = new SaveStore();
  private readonly sfx = new SoundFX();

  private renderer!: THREE.WebGLRenderer;
  private resolution!: AdaptiveResolution;
  private activeQuality: GameOptions['quality'] | null = null;
  private hudElapsed=1;
  private shadowElapsed=1;
  private idleElapsed=1;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private ocean!: OceanRenderer;
  private ambient!: MarineAmbient;
  private weather!: WeatherSystem;
  private sector!: SectorManager;
  private chunks!: ChunkManager;
  private readonly discovery=new Discovery();
  private helmKey:string|null=null;
  private raftGrid = new RaftGrid(256);
  private raftRenderer = new RaftRenderer();
  private player!: PlayerController;
  private hook!: HookController;
  private shark!: SharkBoss;
  private inventory = new Inventory(20);
  private survival = new SurvivalSystem();
  private quests!: QuestEngine;
  private hud!: HUD;
  private modals!: Modals;
  private loop!: GameLoop;

  private options: GameOptions;
  private worldId = `world_${Date.now()}`;
  private seed = 2089;
  private epoch = 1;
  private autosaveTimer = 0;
  private saveStatus = 'Salvo';
  private started = false;

  // Flags persistentes de mundo
  private wreckLooted = false;
  private buoyInspected = false;
  private sharkRepelledCount = 0;

  // Estado de construção
  private buildRecipe: RecipeDef | null = null;
  private buildRotation = 0;
  private ghostTarget: BuildTarget | null = null;
  private readonly buildPicker = new BuildTargetPicker();
  private readonly flotsamBuckets=new FlotsamBuckets<FlotsamEntity>();
  private readonly netPosition=new THREE.Vector3();
  private readonly handPosition=new THREE.Vector3();
  private readonly localQuery=new THREE.Vector2();

  // Controles de entrada
  private keys = new Set<string>();
  private yawDeltaAccum = 0;
  private pitchDeltaAccum = 0;
  private touchMoveX = 0;
  private touchMoveY = 0;
  private touchJumpQueued = false;
  private lastDragLook: { x: number; y: number } | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly uiRoot: HTMLElement
  ) {
    this.options = this.store.loadOptions();
    this.initRenderer();
    this.initScene();
    this.initUI();
    this.applyOptions(this.options);
  }

  private initRenderer(): void {
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: this.options.quality === 'alto' });
    } catch {
      this.uiRoot.innerHTML = `<div style="padding:24px;color:#fff;font-family:sans-serif;">
        <h2>WebGL indisponível</h2>
        <p>Este navegador ou dispositivo não suporta WebGL/WebGL2 necessário para renderizar o oceano 3D.</p>
      </div>`;
      throw new Error('WebGL indisponível');
    }
    this.resolution = new AdaptiveResolution(this.options.quality==='baixo',this.isMobileDevice(),window.devicePixelRatio||1);
    this.renderer.setPixelRatio(this.resolution.scale);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
  }

  private initScene(): void {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(this.options.fov, window.innerWidth / window.innerHeight, 0.1, 240);

    const low = this.options.quality === 'baixo';
    this.activeQuality=this.options.quality;
    this.ocean = new OceanRenderer(low);
    this.scene.add(this.ocean.mesh);
    this.ambient = new MarineAmbient(this.scene, false);

    this.weather = new WeatherSystem(this.scene, !low);
    this.chunks=new ChunkManager(this.seed,low);
    this.scene.add(this.chunks.group);
    this.chunks.update(0,0,9);
    this.sector = new SectorManager(this.seed);
    this.scene.add(this.sector.group);
    this.sector.seedInitialFlotsam(0, 0);

    this.scene.add(this.raftRenderer.root);
    this.raftRenderer.syncWithGrid(this.raftGrid);

    this.player = new PlayerController(this.scene);
    this.player.moveToRaftSafe(this.raftRenderer, this.raftGrid);

    this.hook = new HookController(this.scene);
    this.shark = new SharkBoss(this.scene, this.bus);

    this.quests = new QuestEngine(this.bus);
    this.bindGameEvents();
  }

  private bindGameEvents(): void {
    this.bus.on('notification', ({ text, kind }) => this.hud.pushToast(text, kind));
    this.bus.on('bossResolved', ({ bossId }) => {
      if (bossId === 'B01') {
        this.sharkRepelledCount += 1;
        this.sfx.playRadio();
        void this.saveWorld('checkpoint');
      }
    });

    this.quests.onReward((q) => {
      for (const item of q.rewards.items ?? []) {
        const res = this.inventory.addItem(item.itemId, item.count);
        if (res.overflow > 0) {
          this.hud.pushToast(`Mochila cheia: ${res.overflow}x ${ITEMS[item.itemId]?.name} aguardando espaço.`, 'warn');
        }
      }
      if (q.checkpoint) {
        void this.saveWorld('rotating');
      }
    });

    this.quests.onDialogue((speaker, lines) => {
      this.sfx.playRadio();
      this.hud.enqueueDialogue(speaker, lines);
    });

    this.quests.setStateSnapshotProvider(() => {
      const inventoryCounts: Record<string, number> = {};
      for (const s of this.inventory.slots) {
        if (s) inventoryCounts[s.itemId] = (inventoryCounts[s.itemId] ?? 0) + s.count;
      }
      const placedModuleKinds = new Set<string>();
      for (const m of this.raftGrid.modules.values()) {
        placedModuleKinds.add(m.kind);
      }
      return {
        inventoryCounts,
        foundationCount: this.raftGrid.foundations.size,
        placedModuleKinds,
      };
    });
  }

  private initUI(): void {
    this.hud = new HUD(this.uiRoot);
    this.modals = new Modals(this.uiRoot);

    this.hud.onSelectHotbar = (i) => {
      this.inventory.selectHotbar(i);
    };
    this.hud.onOpenPanel = (tab) => this.openPanel(tab);
    this.hud.onOpenMenu = () => this.openPauseMenu();
    this.hud.onTouchMove = (x, y) => {
      this.touchMoveX = x;
      this.touchMoveY = y;
    };
    this.hud.onTouchAction = (action) => {
      if (!this.started || this.modals.isOpen()) return;
      if (action === 'jump') this.touchJumpQueued = true;
      else if (action === 'interact') this.handleInteract();
      else if (action === 'use') this.handlePrimaryUse();
      else if (action === 'build') this.openPanel('construcao');
    };

    this.bindInputListeners();
  }

  private bindInputListeners(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('keydown', (e) => {
      if (!this.started) return;
      if (e.code === 'Escape') {
        if (e.repeat) return;
        if (this.modals.isOpen()) {
          this.modals.closeAll();
          this.resumeAfterMenu();
        } else if(this.helmKey){
          this.helmKey=null;this.resetMenuInput();
        } else if (this.buildRecipe) {
          this.exitBuildMode();
        } else {
          this.openPauseMenu();
        }
        return;
      }

      if (this.modals.isOpen()) return;
      this.keys.add(e.code);

      if (e.code === 'KeyM'&&!e.repeat) {this.hud.toggleMinimap();}
      else if (e.code === 'KeyE'&&!e.repeat) {
        if (!this.hud.advanceDialogue()) this.handleInteract();
      } else if (e.code === 'KeyF') {
        this.handlePrimaryUse();
      } else if (e.code === 'KeyR' && this.buildRecipe) {
        this.buildRotation = (this.buildRotation + 1) % 4;
      } else if (e.code === 'KeyX' && this.buildRecipe) {
        this.handleDemolishAtGhost();
      } else if (e.code === 'KeyV') {
        const third = this.player.toggleCameraMode();
        this.hud.pushToast(third ? 'Câmera: 3ª pessoa' : 'Câmera: 1ª pessoa', 'info');
      } else if (e.code === 'KeyI') {
        this.openPanel('mochila');
      } else if (e.code === 'KeyB') {
        if (this.buildRecipe) this.exitBuildMode();
        else this.openPanel('construcao');
      } else if (e.code === 'KeyJ') {
        this.openPanel('diario');
      } else if (e.code.startsWith('Digit')) {
        const num = Number(e.code.replace('Digit', ''));
        if (num >= 1 && num <= 8) this.inventory.selectHotbar(num - 1);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
      this.lastDragLook = null;
      this.touchMoveX = 0;
      this.touchMoveY = 0;
      this.touchJumpQueued = false;
    });

    this.canvas.addEventListener('click', (event) => {
      if (!this.started || this.modals.isOpen()) return;
      if (event instanceof PointerEvent && event.pointerType === 'touch') return;
      if (document.pointerLockElement !== this.canvas && !this.isMobileDevice()) {
        // A captura pode ser rejeitada após Esc ou quando o navegador não a permite.
        try { void Promise.resolve(this.canvas.requestPointerLock?.()).catch(() => {}); } catch { /* arrastar continua disponível */ }
      }
      this.handlePrimaryUse();
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.started || this.modals.isOpen()) return;
      const sens = 0.0022 * this.options.mouseSensitivity;
      if (document.pointerLockElement === this.canvas) {
        this.yawDeltaAccum += e.movementX * sens;
        this.pitchDeltaAccum += e.movementY * sens;
      }
    });

    // Arrastar toque/mouse para olhar quando PointerLock não está ativo (mobile / fallback)
    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' || document.pointerLockElement !== this.canvas) {
        this.lastDragLook = { x: e.clientX, y: e.clientY };
      }
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.lastDragLook || document.pointerLockElement === this.canvas || this.modals.isOpen()) return;
      const sens = 0.003 * this.options.mouseSensitivity;
      this.yawDeltaAccum += (e.clientX - this.lastDragLook.x) * sens;
      this.pitchDeltaAccum += (e.clientY - this.lastDragLook.y) * sens;
      this.lastDragLook = { x: e.clientX, y: e.clientY };
    });
    this.canvas.addEventListener('pointerup', () => {
      this.lastDragLook = null;
    });
    this.canvas.addEventListener('pointercancel', () => {
      this.lastDragLook = null;
    });
  }

  async boot(): Promise<void> {
    this.loop = new GameLoop({
      onFixedUpdate: (dt) => this.fixedUpdate(dt),
      onRender: (_alpha, frameDt) => this.render(frameDt),
    });
    this.loop.paused = true;
    this.loop.start();

    const saved = await this.store.loadLatestValid();
    this.modals.showMainMenu({
      hasSave: Boolean(saved),
      onContinue: () => {
        if (saved) {
          this.restoreFromSave(saved.data);
          if (saved.recoveredFromCorruption) {
            this.hud.pushToast('Slot principal corrompido: recuperado pelo backup secundário!', 'warn');
          }
          this.startPlay();
        }
      },
      onNewWorld: (diff) => {
        this.startNewWorld(diff);
        this.startPlay();
      },
      onImportJson: (raw) => {
        const res = this.store.parseImportJson(raw);
        if (!res.ok) {
          this.hud.pushToast(res.error, 'danger');
          return;
        }
        this.restoreFromSave(res.data);
        void this.saveWorld('rotating');
        this.startPlay();
        this.hud.pushToast('Save importado com sucesso!', 'success');
      },
    });
  }

  private startNewWorld(difficulty: Difficulty): void {
    this.worldId = `world_${Date.now()}`;
    this.seed = Math.floor(Math.random() * 900000) + 100000;
    this.chunks.reset(this.seed);
    this.discovery.reset();this.discovery.visit(0,0);this.helmKey=null;
    this.chunks.update(0,0,9);
    this.epoch = 1;
    this.clock.restore({ tick: 0, elapsedSeconds: 0, timeOfDay: 0.35, dayCount: 1 });
    this.raftGrid = new RaftGrid(this.options.quality === 'baixo' ? 64 : 256);
    this.raftRenderer.x = 0;
    this.raftRenderer.z = 0;
    this.raftRenderer.heading = 0;
    this.raftRenderer.syncWithGrid(this.raftGrid);

    this.inventory = new Inventory(20);
    // Suprimento inicial leve para garantir primeiros passos sem travar
    this.inventory.addItem('agua_pura', 1);
    this.inventory.addItem('peixe_assado', 1);

    this.survival = new SurvivalSystem();
    this.survival.difficulty = difficulty;
    this.wreckLooted = false;
    this.buoyInspected = false;
    this.sharkRepelledCount = 0;

    this.quests.dispose();
    this.quests = new QuestEngine(this.bus);
    this.bindGameEvents();
    this.quests.syncFoundationCount(this.raftGrid.foundations.size);

    this.player.moveToRaftSafe(this.raftRenderer, this.raftGrid);
    this.quests.triggerInitialDialogues();
  }

  private restoreFromSave(data: WorldSaveData): void {
    this.worldId = data.worldId;
    this.seed = data.seed;
    this.epoch = data.epoch;
    this.clock.restore(data.clock);
    this.raftRenderer.x = data.raftTransform.x;
    this.raftRenderer.z = data.raftTransform.z;
    this.raftRenderer.heading = data.raftTransform.heading;
    this.raftGrid.restore(data.raft);
    this.raftRenderer.syncWithGrid(this.raftGrid);
    this.inventory = Inventory.deserialize(data.inventory);
    this.survival.restore(data.survival);
    this.quests.restore(data.quests);
    this.wreckLooted = data.worldFlags.wreckLooted;
    this.buoyInspected = data.worldFlags.buoyInspected;
    this.sharkRepelledCount = data.worldFlags.sharkRepelledCount;
    this.player.position.set(data.playerPosition.x, data.playerPosition.y, data.playerPosition.z);
    this.chunks.reset(this.seed,this.options.quality==='baixo',data.depletedIslandResources??[]);
    this.discovery.reset(data.discoveredChunks??[]);this.discovery.visit(this.player.position.x,this.player.position.z);this.helmKey=null;
    this.chunks.update(this.player.position.x,this.player.position.z,9);

    for (const poi of this.sector.pois) {
      if (poi.id === 'destrocos_radio') poi.looted = this.wreckLooted;
      if (poi.id === 'boia_vermelha') poi.looted = this.buoyInspected;
    }
  }

  private startPlay(): void {
    this.started = true;
    this.loop.paused = false;
    this.modals.closeAll();
  }

  private fixedUpdate(dt: number): void {
    if (!this.started) return;

    this.chunks.update(this.player.position.x,this.player.position.z);
    this.discovery.visit(this.player.position.x,this.player.position.z);
    this.clock.advance(dt);
    this.weather.update(this.clock.timeOfDay, this.raftRenderer.x, this.raftRenderer.z, dt);

    // Movimento da jangada por correnteza, vela e âncora + penalidade por sobrepeso
    const prevRaftX = this.raftRenderer.x;
    const prevRaftZ = this.raftRenderer.z;
    const prevHeading=this.raftRenderer.heading;
    if(this.helmKey&&this.raftGrid.modules.get(this.helmKey)?.kind!=='leme')this.helmKey=null;
    const steering=Boolean(this.helmKey);
    const steerX=(this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('KeyA')||this.keys.has('ArrowLeft')?1:0)+this.touchMoveX;
    const steerY=(this.keys.has('KeyW')||this.keys.has('ArrowUp')?1:0)-(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)+this.touchMoveY;
    const buoyancy = StructureGraph.computeBuoyancy(this.raftGrid);
    if(steering){
      const nav=helmStep(prevHeading,steerX,steerY,this.raftGrid.hasActiveSail(),this.raftGrid.isAnchorDropped(),dt,buoyancy.speedMultiplier);
      if(this.raftCanMove(prevRaftX+nav.dx,prevRaftZ+nav.dz,nav.heading,prevRaftX,prevRaftZ,prevHeading)){
        this.raftRenderer.heading=nav.heading;this.raftRenderer.x+=nav.dx;this.raftRenderer.z+=nav.dz;
      }
    } else if (!this.raftGrid.isAnchorDropped()) {
      const sailBoost = this.raftGrid.hasActiveSail() ? 1.55 : 0.32;
      const dirX = -Math.sin(this.raftRenderer.heading);
      const dirZ = -Math.cos(this.raftRenderer.heading);
      const nextX=this.raftRenderer.x+dirX*sailBoost*buoyancy.speedMultiplier*dt;
      const nextZ=this.raftRenderer.z+dirZ*sailBoost*buoyancy.speedMultiplier*dt;
      if(this.raftCanMove(nextX,nextZ,prevHeading,prevRaftX,prevRaftZ,prevHeading)){this.raftRenderer.x=nextX;this.raftRenderer.z=nextZ;}
    }
    this.raftRenderer.updateTransform(this.clock.elapsedSeconds, this.weather.stormFactor);
    const raftDeltaX = this.raftRenderer.x - prevRaftX;
    const raftDeltaZ = this.raftRenderer.z - prevRaftZ;

    // Input do jogador
    const forward =
      (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) -
      (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0) +
      this.touchMoveY;
    const strafe =
      (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) -
      (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0) +
      this.touchMoveX;
    const jump = this.keys.has('Space') || this.touchJumpQueued;
    this.touchJumpQueued = false;
    const sprint = (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) && this.survival.stamina > 8;

    this.player.update(
      dt,
      {
        forward: steering?0:THREE.MathUtils.clamp(forward, -1, 1),
        strafe: steering?0:THREE.MathUtils.clamp(strafe, -1, 1),
        jump:steering?false:jump,
        sprint:steering?false:sprint,
        yawDelta: this.yawDeltaAccum,
        pitchDelta: this.pitchDeltaAccum,
      },
      this.raftGrid,
      this.raftRenderer,
      this.clock.elapsedSeconds,
      this.weather.stormFactor,
      this.survival.stamina > 8,
      raftDeltaX,
      raftDeltaZ,
      (x,z)=>this.chunks.groundHeight(x,z),
      (x,z,y,fromX,fromZ)=>this.chunks.blocksMovement(x,z,y,fromX,fromZ),
      this.raftRenderer.heading-prevHeading
    );
    this.yawDeltaAccum = 0;
    this.pitchDeltaAccum = 0;

    // Sobrevivência
    const sheltered = this.raftGrid.hasModuleKind('cobertura');
    this.survival.update(dt, {
      sprinting: !steering && sprint && (Math.abs(forward) > 0.1 || Math.abs(strafe) > 0.1),
      underwater: this.player.underwater,
      sheltered,
    });
    if (this.survival.dead) {
      this.handlePlayerDeath();
    }

    // Atualizar setor e redes coletoras
    this.sector.update(dt, this.raftRenderer.x, this.raftRenderer.z, this.clock.elapsedSeconds, this.weather.stormFactor, this.player.position.x, this.player.position.z);
    this.updateCollectorNets();
    this.updateModulesTick(dt);

    // Auto-coleta ao nadar próximo (acessibilidade)
    if (this.options.autoCollectNear && this.player.inWater) {
      this.tryPickupNearbyFlotsam(2.4);
    }

    // Gancho
    const handPos = this.handPosition.copy(this.player.position);
    handPos.y+=1.25;
    this.hook.update(dt, handPos, this.sector, this.clock.elapsedSeconds, this.weather.stormFactor, (loot) => {
      this.collectLoot(loot, 'hook');
    });

    // Chefe B01 Mandíbula Branca
    const previousSharkState=this.shark.state;
    this.shark.update(
      dt,
      this.raftGrid,
      this.raftRenderer,
      this.player.position,
      this.player.inWater,
      this.clock.elapsedSeconds,
      this.weather.stormFactor,
      (dmg) => {
        this.survival.applyDamage(dmg);
        this.sfx.playSharkAlert();
        this.hud.pushToast('Mordida do tubarão! Suba na jangada!', 'danger');
      },
      () => this.sfx.playSharkAlert()
    );
    // O dano estrutural só é aplicado na entrada em BITING; demais alterações
    // já sincronizam nas ações de construção, reparo, restauração e colheita.
    if(previousSharkState!=='BITING'&&this.shark.state==='BITING'){
      this.raftRenderer.syncWithGrid(this.raftGrid);
      this.quests.syncFoundationCount(this.raftGrid.foundations.size);
    }

    // Autosave a cada 90s quando seguro
    this.autosaveTimer += dt;
    if (this.autosaveTimer >= 90 && !this.survival.dead && this.shark.state === 'PATROL') {
      this.autosaveTimer = 0;
      void this.saveWorld('rotating');
    }
  }

  private render(frameDt: number): void {
    const idle=!this.started||this.loop.paused;
    this.hudElapsed+=frameDt;
    this.shadowElapsed+=frameDt;
    if(idle){
      this.resolution.reset();
      this.idleElapsed+=frameDt;
      if(this.idleElapsed<1/15)return;
      this.idleElapsed=0;
    }else{
      this.idleElapsed=1;
      const ratio=this.resolution.sample(frameDt);
      if(ratio!==null)this.renderer.setPixelRatio(ratio);
    }
    const low=this.options.quality==='baixo';
    if(!idle&&this.shadowElapsed>=(low?.125:.05)){
      this.renderer.shadowMap.needsUpdate=true;this.shadowElapsed=0;
    }
    this.ocean.update(this.player.position.x, this.player.position.z, this.clock.elapsedSeconds, this.weather.stormFactor);
    this.player.applyToCamera(this.camera, this.clock.elapsedSeconds, this.options.cameraBob);
    if (this.started && !this.modals.isOpen()) this.updateBuildGhost();
    else this.raftRenderer.hideGhost();
    this.ambient.update(this.camera.position.x,this.camera.position.z,this.camera.position.y,this.clock.elapsedSeconds,this.weather.stormFactor,this.options.quality==='baixo');
    this.renderer.render(this.scene, this.camera);

    if (this.started && this.hudElapsed >= (this.buildRecipe ? .08 : .10)) {
      this.hudElapsed=0;
      this.updateHud();
    }
  }

  /** Testa os centros das fundações, permitindo sair de uma posição antiga encalhada. */
  private raftCanMove(x:number,z:number,heading:number,oldX:number,oldZ:number,oldHeading:number):boolean{
    if(x===oldX&&z===oldZ&&heading===oldHeading)return true;
    const c=Math.cos(heading),s=Math.sin(heading),oc=Math.cos(oldHeading),os=Math.sin(oldHeading);
    for(const f of this.raftGrid.foundations.values()){
      const wx=x+f.gx*c+f.gz*s,wz=z-f.gx*s+f.gz*c;
      const height=this.chunks.groundHeight(wx,wz);
      if(height!==null&&height>.35){
        const previous=this.chunks.groundHeight(oldX+f.gx*oc+f.gz*os,oldZ-f.gx*os+f.gz*oc);
        if(previous===null||previous<=.35||height>previous+.00001)return false;
      }
    }
    return true;
  }

  private updateCollectorNets(): void {
    // Bases pequenas mantêm o caminho direto; bases grandes usam grade espacial.
    const nets=[];
    for(const mod of this.raftGrid.modules.values())if(mod.kind==='rede_coleta')nets.push(mod);
    if(nets.length===0||this.sector.flotsam.length===0)return;
    const useBuckets=nets.length>=6&&this.sector.flotsam.length>=12;
    if(useBuckets)this.flotsamBuckets.rebuild(this.sector.flotsam);
    for(const mod of nets){
      const wp=this.raftRenderer.getCellWorldPosition(mod.gx,mod.gz,this.netPosition);
      if(useBuckets){
        for(const f of this.flotsamBuckets.query(wp.x,wp.z,1.35)){
          const removed=this.sector.removeFlotsam(f.id);
          if(removed)this.collectLoot(removed.loot,'net');
        }
      }else{
        for(let i=this.sector.flotsam.length-1;i>=0;i--){
          const f=this.sector.flotsam[i],dx=f.x-wp.x,dz=f.z-wp.z;
          if(dx*dx+dz*dz<1.35*1.35){
            const removed=this.sector.removeFlotsam(f.id);
            if(removed)this.collectLoot(removed.loot,'net');
          }
        }
      }
    }
  }

  private updateModulesTick(dt: number): void {
    for (const mod of this.raftGrid.modules.values()) {
      if (mod.kind === 'horta' && mod.planted && mod.watered && mod.readyCount === 0) {
        mod.progress += dt / 35; // 35s para crescer após regar
        if (mod.progress >= 1) {
          mod.progress = 1;
          mod.readyCount = 2;
          this.hud.pushToast('Fruto salino cresceu na horta! Pressione [E] para colher.', 'success');
        }
        this.raftRenderer.syncDynamicModule(mod);
      }
    }
  }

  private updateBuildGhost(): void {
    const recipe=this.buildRecipe;
    if (!recipe?.placesStructure) {
      this.raftRenderer.hideGhost();
      this.ghostTarget = null;
      return;
    }
    const cell = this.buildPicker.pick(this.camera,this.raftRenderer.root,this.player.position);
    if(!cell) {
      this.ghostTarget=null;
      this.raftRenderer.hideGhost();
      return;
    }
    const target=evaluateBuild(this.raftGrid,recipe.placesStructure,cell.gx,cell.gz,this.inventory.hasItems(recipe.ingredients));
    this.ghostTarget=target;
    this.raftRenderer.showGhost(target.gx,target.gz,recipe.placesStructure,target.valid,this.buildRotation);
  }

  private handlePrimaryUse(): void {
    if(this.helmKey)return;
    if (this.buildRecipe) {
      this.updateBuildGhost();
      if (this.ghostTarget) this.placeBuildAtGhost();
      else this.hud.pushToast('Aponte para o convés ou para uma borda próxima.', 'warn');
      return;
    }

    const slot = this.inventory.getSelectedSlot();
    const itemId = slot?.itemId;

    // Consumíveis na barra rápida
    if (itemId && (ITEMS[itemId]?.hungerRestore !== undefined || ITEMS[itemId]?.thirstRestore !== undefined)) {
      if (this.survival.consumeItem(itemId)) {
        this.inventory.consumeItems([{ itemId, count: 1 }]);
        this.sfx.playPickup();
        return;
      }
    }

    // Isca contra tubarão
    if (itemId === 'isca') {
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      const dropPos = this.player.position.clone().addScaledVector(dir, 6);
      this.inventory.consumeItems([{ itemId: 'isca', count: 1 }]);
      this.shark.throwBait(dropPos);
      this.sfx.playSplash();
      return;
    }

    // Lança contra Mandíbula Branca
    if (itemId === 'lanca') {
      const dist = this.player.position.distanceTo(this.shark.getPosition());
      if (dist <= 5.5) {
        this.shark.takeDamage(25);
        this.inventory.damageSlot(this.inventory.selectedHotbar, 2);
        this.sfx.playBuild();
        this.hud.pushToast(`Acertou Mandíbula Branca! HP: ${this.shark.hp}/${this.shark.maxHp}`, 'info');
      } else {
        this.hud.pushToast('Aproxime-se da borda onde o tubarão ataca para usar a lança.', 'info');
      }
      return;
    }

    // Martelo de reparo
    if (itemId === 'martelo_reparo') {
      const cell = this.findNearestDamagedFoundation(3.2);
      if (cell) {
        cell.hp = cell.maxHp;
        this.inventory.damageSlot(this.inventory.selectedHotbar, 2);
        this.raftRenderer.syncWithGrid(this.raftGrid);
        this.sfx.playBuild();
        this.bus.emit('structureRepaired', { gx: cell.gx, gz: cell.gz });
        this.hud.pushToast('Fundação reparada!', 'success');
      } else {
        this.hud.pushToast('Nenhuma fundação danificada ao alcance.', 'info');
      }
      return;
    }

    // Vara de pesca
    if (itemId === 'vara_pesca') {
      this.inventory.damageSlot(this.inventory.selectedHotbar, 1);
      this.collectLoot([{ itemId: 'peixe_cru', count: 1 }], 'fishing');
      this.bus.emit('fishCaught', { count: 1 });
      this.sfx.playSplash();
      return;
    }

    // Gancho de coleta (ou coleta manual próxima se ainda não tiver gancho)
    if (itemId === 'gancho') {
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      const origin = this.camera.position.clone();
      if (this.hook.throwHook(origin, dir)) {
        this.inventory.damageSlot(this.inventory.selectedHotbar, 1);
        this.sfx.playSplash();
      }
      return;
    }

    // Fallback sem gancho: pega detrito bem próximo ao alcance das mãos
    if (!this.tryPickupNearbyFlotsam(3.4)) {
      this.hud.pushToast('Aproxime-se de detritos [E] ou fabrique o Gancho em [I].', 'info');
    }
  }

  private handleInteract(): void {
    if(this.helmKey){this.helmKey=null;this.resetMenuInput();this.hud.pushToast('Leme liberado.','info');return;}
    // 1. Verificar POIs próximos (destroço do rádio / boia vermelha)
    for (const poi of this.sector.pois) {
      const d = Math.hypot(poi.x - this.player.position.x, poi.z - this.player.position.z);
      if (d <= 5.2) {
        if (poi.id === 'destrocos_radio' && !poi.looted) {
          poi.looted = true;
          this.wreckLooted = true;
          this.collectLoot(
            [
              { itemId: 'bateria', count: 1 },
              { itemId: 'antena', count: 1 },
              { itemId: 'sucata', count: 3 },
            ],
            'wreck'
          );
          this.hud.pushToast('Peças do rádio recuperadas: Bateria e Antena!', 'success');
          return;
        }
        if (poi.id === 'boia_vermelha' && !poi.looted) {
          poi.looted = true;
          this.buoyInspected = true;
          this.bus.emit('wreckLooted', { wreckId: 'boia_vermelha', itemId: 'sucata' });
          this.collectLoot(
            [
              { itemId: 'sucata', count: 2 },
              { itemId: 'pedra', count: 2 },
            ],
            'buoy'
          );
          this.hud.pushToast('Boia de emergência inspecionada!', 'success');
          return;
        }
      }
    }

    if(this.harvestIslandResource())return;

    // 2. Verificar módulos da jangada ao alcance
    const nearestMod = this.findNearestModule(2.6);
    if (nearestMod) {
      switch (nearestMod.kind) {
        case 'purificador': {
          if (this.inventory.getItemCount('agua_salgada') >= 1) {
            this.inventory.consumeItems([{ itemId: 'agua_salgada', count: 1 }]);
            this.inventory.addItem('agua_pura', 1);
            this.bus.emit('waterPurified', { count: 1 });
            this.sfx.playPickup();
            this.hud.pushToast('Água purificada (+1 Água pura)!', 'success');
          } else {
            // Coleta água salgada e já purifica se estiver na borda
            this.inventory.addItem('agua_pura', 1);
            this.bus.emit('waterPurified', { count: 1 });
            this.sfx.playPickup();
            this.hud.pushToast('Água do mar destilada no purificador (+1 Água pura)!', 'success');
          }
          return;
        }
        case 'churrasqueira': {
          if (this.inventory.getItemCount('peixe_cru') >= 1) {
            this.inventory.consumeItems([{ itemId: 'peixe_cru', count: 1 }]);
            this.inventory.addItem('peixe_assado', 1);
            this.sfx.playPickup();
            this.hud.pushToast('Peixe assado pronto!', 'success');
          } else {
            this.hud.pushToast('Precisa de Peixe cru para assar.', 'info');
          }
          return;
        }
        case 'cama': {
          this.survival.rest();
          this.bus.emit('playerRested', { source: 'cama' });
          this.sfx.playPickup();
          this.hud.pushToast('Você descansou na cama. Energia restaurada!', 'success');
          return;
        }
        case 'radio': {
          nearestMod.active = true;
          this.bus.emit('radioTuned', { frequency: 'lia_ch1' });
          this.sfx.playRadio();
          return;
        }
        case 'leme': {
          if(!this.player.grounded||this.player.inWater){this.hud.pushToast('Suba na jangada para assumir o leme.','warn');return;}
          this.exitBuildMode();this.resetMenuInput();this.helmKey=cellKey(nearestMod.gx,nearestMod.gz);
          this.hud.pushToast('Leme: W/S avançar e recuar, A/D virar. E para sair. No celular use o direcional.','info');return;
        }
        case 'vela': {
          nearestMod.active = !nearestMod.active;
          this.raftRenderer.syncWithGrid(this.raftGrid);
          this.hud.pushToast(nearestMod.active ? 'Vela aberta: navegando com o vento.' : 'Vela recolhida.', 'info');
          return;
        }
        case 'ancora': {
          nearestMod.active = !nearestMod.active;
          this.hud.pushToast(nearestMod.active ? 'Âncora lançada: jangada parada.' : 'Âncora recolhida.', 'info');
          return;
        }
        case 'horta': {
          if (nearestMod.readyCount > 0) {
            const count = nearestMod.readyCount;
            nearestMod.readyCount = 0;
            nearestMod.planted = false;
            nearestMod.watered = false;
            nearestMod.progress = 0;
            this.collectLoot(
              [
                { itemId: 'fruta_colhida', count },
                { itemId: 'semente_salina', count: 1 },
              ],
              'crop'
            );
            this.bus.emit('cropHarvested', { cropId: 'fruta_colhida', count });
            this.raftRenderer.syncWithGrid(this.raftGrid);
          } else if (!nearestMod.planted) {
            if (this.inventory.consumeItems([{ itemId: 'semente_salina', count: 1 }])) {
              nearestMod.planted = true;
              nearestMod.watered = true;
              nearestMod.progress = 0.05;
              this.raftRenderer.syncWithGrid(this.raftGrid);
              this.hud.pushToast('Semente plantada e regada!', 'success');
            } else {
              this.hud.pushToast('Precisa de 1 Semente salina (ache em caixotes).', 'info');
            }
          } else {
            this.hud.pushToast(`Cultivo crescendo (${Math.round(nearestMod.progress * 100)}%).`, 'info');
          }
          return;
        }
      }
    }

    // 3. Coletar detrito ao alcance ou água salgada se estiver na água/borda
    if (this.tryPickupNearbyFlotsam(3.4)) return;

    if (this.player.inWater) {
      this.inventory.addItem('agua_salgada', 1);
      this.sfx.playSplash();
      this.hud.pushToast('Coletou Água salgada (use no Purificador).', 'info');
    }
  }

  private tryPickupNearbyFlotsam(radius: number): boolean {
    let bestId: string | null = null;
    let bestDist = radius*radius;
    for (const f of this.sector.flotsam) {
      const dx=f.x-this.player.position.x,dz=f.z-this.player.position.z;
      const d=dx*dx+dz*dz;
      if (d < bestDist) {
        bestDist = d;
        bestId = f.id;
      }
    }
    if (!bestId) return false;
    const removed = this.sector.removeFlotsam(bestId);
    if (!removed) return false;
    this.collectLoot(removed.loot, 'hand');
    return true;
  }

  private harvestIslandResource():boolean{
    const p=this.player.position;
    const node=this.chunks.nearestResource(p.x,p.z,p.y);
    if(!node)return false;
    if(node.kind==='palm'&&this.inventory.getSelectedSlot()?.itemId!=='machado'){
      this.hud.pushToast('Fabrique e selecione um machado para cortar o coqueiro.','warn');return true;
    }
    // Simular toda a coleta primeiro; mochila cheia não remove o recurso.
    const trial=this.inventory.clone();
    for(const item of node.loot)if(trial.addItem(item.itemId,item.count).overflow){
      this.hud.pushToast('Mochila sem espaço. O recurso permanece na ilha.','warn');return true;
    }
    if(!this.chunks.harvest(node.id))return true;
    if(node.kind==='palm')this.inventory.damageSlot(this.inventory.selectedHotbar,1);
    this.collectLoot(node.loot,'island');
    return true;
  }

  private collectLoot(loot: Array<{ itemId: string; count: number }>, source: string): void {
    for (const entry of loot) {
      if (entry.count <= 0) continue;
      const res = this.inventory.addItem(entry.itemId, entry.count);
      if (res.added > 0) {
        this.bus.emit('itemCollected', { itemId: entry.itemId, count: res.added, source });
        const def = ITEMS[entry.itemId];
        this.hud.pushToast(`+${res.added} ${def?.name ?? entry.itemId}`, 'info');
      }
      if (res.overflow > 0) {
        this.hud.pushToast('Mochila cheia! Esvazie ou construa um Baú.', 'warn');
      }
    }
    this.sfx.playPickup();
  }

  private placeBuildAtGhost(): void {
    const recipe = this.buildRecipe;
    const target = this.ghostTarget;
    if (!recipe || !target || !recipe.placesStructure) return;
    const checked = evaluateBuild(this.raftGrid,recipe.placesStructure,target.gx,target.gz,this.inventory.hasItems(recipe.ingredients));
    if (!checked.valid) {
      this.hud.pushToast(checked.reason, 'warn');
      return;
    }

    const kind = recipe.placesStructure;
    let placedOk = false;

    if (kind === 'fundacao') {
      const res = this.raftGrid.addFoundation(target.gx, target.gz);
      placedOk = res.ok;
    } else if (kind === 'borda_reforcada') {
      const res = this.raftGrid.reinforceFoundation(target.gx, target.gz);
      placedOk = res.ok;
    } else {
      const res = this.raftGrid.placeModule(kind, target.gx, target.gz, this.buildRotation, recipe.structureMass ?? 20);
      placedOk = res.ok;
    }

    if (placedOk) {
      this.inventory.consumeItems(recipe.ingredients);
      this.raftRenderer.syncWithGrid(this.raftGrid);
      this.quests.syncFoundationCount(this.raftGrid.foundations.size);
      this.bus.emit('structurePlaced', { kind, gx: target.gx, gz: target.gz });
      this.sfx.playBuild();
      if (kind === 'borda_reforcada') this.hud.pushToast('Borda reforçada instalada: 220/220 HP.', 'success');
      else this.hud.pushToast(recipe.name + ' instalada.', 'success');
      this.updateBuildGhost();
      if (kind !== 'fundacao' && kind !== 'borda_reforcada') {
        this.exitBuildMode();
      }
    }
  }

  private handleDemolishAtGhost(): void {
    this.updateBuildGhost();
    if (!this.ghostTarget) return;
    const { gx, gz } = this.ghostTarget;
    const res = StructureGraph.removeFoundation(this.raftGrid, gx, gz, false);
    if (!res.ok) {
      this.hud.pushToast(res.reason ?? 'Não foi possível desmontar.', 'warn');
      return;
    }
    // Reembolso de 50% (1 madeira + 1 plástico)
    this.inventory.addItem('madeira', 1);
    this.inventory.addItem('plastico', 1);
    this.raftRenderer.syncWithGrid(this.raftGrid);
    this.quests.syncFoundationCount(this.raftGrid.foundations.size);
    this.updateBuildGhost();
    this.hud.pushToast('Fundação desmontada (50% de reembolso).', 'info');
  }

  private exitBuildMode(): void {
    this.buildRecipe = null;
    this.ghostTarget = null;
    this.raftRenderer.hideGhost();
  }

  private handlePlayerDeath(): void {
    this.helmKey=null;
    const lost = this.survival.difficulty === 'historia' ? [] : this.inventory.applyNormalDeathPenalty();
    this.survival.respawn();
    if (this.raftGrid.foundations.size === 0) {
      this.raftGrid.createStarterRaft();
      this.raftRenderer.syncWithGrid(this.raftGrid);
    }
    this.player.moveToRaftSafe(this.raftRenderer, this.raftGrid);
    const msg =
      lost.length > 0
        ? 'Você desmaiou no mar e renasceu na jangada (20% dos materiais comuns perdidos).'
        : 'Você renasceu na jangada com segurança!';
    this.hud.pushToast(msg, 'warn');
  }

  private findNearestModule(maxDist: number) {
    const p=this.raftRenderer.worldToLocalXZ(this.player.position.x,this.player.position.z,this.localQuery);
    return nearestGridEntry(this.raftGrid.modules,p.x,p.y,maxDist);
  }

  private findNearestDamagedFoundation(maxDist: number) {
    const p=this.raftRenderer.worldToLocalXZ(this.player.position.x,this.player.position.z,this.localQuery);
    return nearestGridEntry(this.raftGrid.foundations,p.x,p.y,maxDist,f=>f.hp<f.maxHp);
  }

  private buildPanelContext(): PanelContext {
    return {
      onClose: () => this.resumeAfterMenu(),
      inventory: this.inventory,
      quests: this.quests,
      options: this.options,
      hasPurifier: this.raftGrid.hasModuleKind('purificador'),
      hasGrill: this.raftGrid.hasModuleKind('churrasqueira'),
      onCraft: (recipe) => {
        const res = this.inventory.craft(recipe);
        if (!res.ok) {
          this.hud.pushToast(res.reason ?? 'Não foi possível fabricar.', 'warn');
          return;
        }
        this.bus.emit('crafted', {
          recipeId: recipe.id,
          itemId: recipe.outputItemId ?? '',
          count: recipe.outputCount ?? 1,
        });
        this.sfx.playBuild();
        this.hud.pushToast(`Fabricado: ${recipe.name}`, 'success');
        this.modals.refreshIfOpen(this.buildPanelContext());
      },
      onSelectBuild: (kind: StructureKind, recipe: RecipeDef) => {
        this.buildRecipe = recipe;
        this.buildRotation = 0;
        this.resumeAfterMenu();
        this.hud.pushToast(`Modo construção: ${kind}. Aponte para a jangada e clique para montar.`, 'info');
      },
      onUseInventorySlot: (idx) => {
        const slot = this.inventory.slots[idx];
        if (!slot) return;
        if (this.survival.consumeItem(slot.itemId)) {
          this.inventory.consumeItems([{ itemId: slot.itemId, count: 1 }]);
          this.sfx.playPickup();
          this.modals.refreshIfOpen(this.buildPanelContext());
        }
      },
      onMoveToHotbar: (idx) => {
        if (idx >= 8) {
          this.inventory.swapSlots(idx, this.inventory.selectedHotbar);
          this.modals.refreshIfOpen(this.buildPanelContext());
        } else {
          this.inventory.selectHotbar(idx);
        }
      },
      onSplitSlot: (idx) => {
        if (this.inventory.splitSlot(idx)) {
          this.modals.refreshIfOpen(this.buildPanelContext());
        }
      },
      onOptionsChanged: (opts) => {
        this.applyOptions(opts);
      },
      onManualSave: () => {
        void this.saveWorld('rotating');
      },
      onExportSave: () => this.exportSaveFile(),
      onImportSave: (raw) => {
        const res = this.store.parseImportJson(raw);
        if (!res.ok) {
          this.hud.pushToast(res.error, 'danger');
          return;
        }
        this.restoreFromSave(res.data);
        this.modals.closeAll();
        this.resumeAfterMenu();
        this.hud.pushToast('Mundo importado!', 'success');
      },
    };
  }

  private resetMenuInput(): void {
    this.keys.clear();
    this.touchMoveX = 0;
    this.touchMoveY = 0;
    this.touchJumpQueued = false;
    this.yawDeltaAccum = 0;
    this.pitchDeltaAccum = 0;
    this.lastDragLook = null;
  }

  private resumeAfterMenu(): void {
    this.resetMenuInput();
    if (this.started) this.loop.paused = false;
  }

  private openPanel(tab: PanelTab): void {
    this.helmKey=null;
    if (!this.started) return;
    this.resetMenuInput();
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock?.();
    }
    this.loop.paused = this.survival.difficulty === 'historia' || this.shark.state === 'PATROL';
    this.modals.openPanel(tab, this.buildPanelContext());
  }

  private openPauseMenu(): void {
    if (!this.started) return;
    this.resetMenuInput();
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock?.();
    }
    this.loop.paused = true;
    this.modals.showPauseMenu({
      onResume: () => this.resumeAfterMenu(),
      onSave: () => {
        void this.saveWorld('rotating');
      },
      onExport: () => this.exportSaveFile(),
      onOpenOptions: () => this.openPanel('opcoes'),
    });
  }

  private applyOptions(opts: GameOptions): void {
    this.options = opts;
    this.store.saveOptions(opts);
    if(this.activeQuality!==opts.quality){
      const low=opts.quality==='baixo';
      this.chunks.setQuality(low);
      this.chunks.update(this.player.position.x,this.player.position.z,9);
      this.scene.remove(this.ocean.mesh);this.ocean.dispose();
      this.ocean=new OceanRenderer(low);this.scene.add(this.ocean.mesh);
      this.resolution=new AdaptiveResolution(low,this.isMobileDevice(),window.devicePixelRatio||1);
      this.renderer.setPixelRatio(this.resolution.scale);
      this.weather.sunLight.shadow.map?.dispose();this.weather.sunLight.shadow.map=null;
      this.weather.sunLight.shadow.mapSize.set(low?512:1024,low?512:1024);
      this.renderer.shadowMap.needsUpdate=true;
      this.activeQuality=opts.quality;
    }
    document.documentElement.style.setProperty('--hud-scale', String(opts.hudScale));
    document.body.classList.toggle('high-contrast', opts.highContrast);
    this.camera.fov = opts.fov;
    this.camera.updateProjectionMatrix();
    this.sfx.setVolume(opts.masterVolume);

    const showTouch =
      opts.touchControls === 'on' || (opts.touchControls === 'auto' && this.isMobileDevice());
    this.hud.setTouchVisible(showTouch);
  }

  private isMobileDevice(): boolean {
    return typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }

  private buildSaveData(): WorldSaveData {
    return {
      schemaVersion: SAVE_SCHEMA_VERSION,
      worldId: this.worldId,
      seed: this.seed,
      epoch: this.epoch,
      savedAtIso: new Date().toISOString(),
      clock: this.clock.serialize(),
      raftTransform: {
        x: this.raftRenderer.x,
        z: this.raftRenderer.z,
        heading: this.raftRenderer.heading,
      },
      playerPosition: {
        x: this.player.position.x,
        y: this.player.position.y,
        z: this.player.position.z,
      },
      inventory: this.inventory.serialize(),
      survival: this.survival.serialize(),
      raft: this.raftGrid.serialize(),
      quests: this.quests.serialize(),
      depletedIslandResources:this.chunks.serializeResources(),
      discoveredChunks:this.discovery.serialize(),
      worldFlags: {
        wreckLooted: this.wreckLooted,
        buoyInspected: this.buoyInspected,
        sharkRepelledCount: this.sharkRepelledCount,
      },
    };
  }

  private async saveWorld(mode: 'rotating' | 'checkpoint'): Promise<void> {
    try {
      this.saveStatus = 'Salvando...';
      const data = this.buildSaveData();
      if (mode === 'checkpoint') {
        await this.store.writeSlot('checkpoint', data);
      } else {
        await this.store.saveRotating(data);
      }
      this.saveStatus = `Salvo ${this.clock.getFormattedTime()}`;
    } catch {
      this.saveStatus = 'Erro ao salvar';
    }
  }

  private exportSaveFile(): void {
    const json = this.store.exportJson(this.buildSaveData());
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mare-perdida-${this.worldId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private updateHud(): void {
    const buoyancy = StructureGraph.computeBuoyancy(this.raftGrid);
    const prompt = this.computePromptText();
    const sharkWarning =
      this.shark.state === 'TELEGRAPH'
        ? `Mordida iminente! Use Lança (${this.shark.hp}/${this.shark.maxHp} HP)`
        : this.shark.state === 'BITING'
          ? 'Tubarão atacando a jangada!'
          : null;

    // Bússola simples apontando para Destroços / Boia mais próxima
    let compassText = 'Mar dos Destroços';
    const nextPoi = this.sector.pois.find((p) => !p.looted);
    if (nextPoi) {
      const dist = Math.round(Math.hypot(nextPoi.x - this.player.position.x, nextPoi.z - this.player.position.z));
      compassText = `${nextPoi.id === 'destrocos_radio' ? 'Destroços Rádio' : 'Boia Vermelha'} (${dist} m)`;
    }

    const island=this.chunks.nearestIsland(this.player.position.x,this.player.position.z);
    if(island){
      const distance=Math.max(0,Math.round(Math.hypot(island.x-this.player.position.x,island.z-this.player.position.z)-island.radius));
      if(distance<100)compassText+=' · Ilha '+distance+' m';
    }
    const hd=headingDegrees(this.raftRenderer.heading);
    compassText+=' · Proa '+cardinal(hd)+' '+Math.round(hd)+'°';
    if(island){const b=bearing(island.x-this.player.position.x,island.z-this.player.position.z);compassText+=' · Ilha a '+cardinal(b);}
    this.hud.update({
      survival: this.survival,
      inventory: this.inventory,
      quests: this.quests,
      buoyancy,
      clockText: this.clock.getFormattedTime(),
      dayCount: this.clock.dayCount,
      weather: this.weather.weather,
      compassText,
      minimap:this.hud.isMinimapVisible()?minimapSvg(this.seed,this.discovery,this.player.position.x,this.player.position.z,this.raftRenderer.x,this.raftRenderer.z,this.player.yaw):'',
      promptText: prompt,
      buildModeLabel: this.buildRecipe ? this.buildRecipe.name : null,
      saveStatus: this.saveStatus,
      sharkWarning,
    });
  }

  private computePromptText(): string {
    if(this.helmKey)return this.raftGrid.isAnchorDropped()?'Âncora baixada — [E/Ação] sair do leme':'Leme · W/S avançar/recuar · A/D virar · [E/Ação] sair';
    if (this.buildRecipe && !this.ghostTarget) return 'Aponte para o convés ou uma borda próxima (até 5,5 m).';
    if (this.buildRecipe && this.ghostTarget && !this.ghostTarget.valid) return this.ghostTarget.reason;
    if (this.buildRecipe?.placesStructure === 'borda_reforcada') {
      const t = this.ghostTarget;
      const f = t ? this.raftGrid.getFoundation(t.gx,t.gz) : undefined;
      if (!f) return 'Aponte para uma fundação de madeira existente.';
      if (f.reinforced) return 'Borda já reforçada — ' + Math.ceil(f.hp) + '/' + f.maxHp + ' HP';
      return '[Click / F] Reforçar madeira: ' + Math.ceil(f.hp) + '/' + f.maxHp + ' → 220 HP';
    }
    if (this.buildRecipe) return '[Click] Colocar peça · [R] Girar · [X] Desmontar';

    for (const poi of this.sector.pois) {
      if (!poi.looted && Math.hypot(poi.x - this.player.position.x, poi.z - this.player.position.z) <= 5.2) {
        return `[E] Vasculhar ${poi.label}`;
      }
    }

    const resource=this.chunks.nearestResource(this.player.position.x,this.player.position.z,this.player.position.y);
    if(resource)return '[E] '+resource.label;
    const mod = this.findNearestModule(2.6);
    if (mod) {
      const labels: Record<string, string> = {
        purificador: '[E] Purificar água',
        churrasqueira: '[E] Assar peixe',
        cama: '[E] Descansar',
        radio: '[E] Sintonizar Rádio (Lia)',
        leme:'[E] Assumir leme',
        vela: mod.active ? '[E] Recolher vela' : '[E] Abrir vela',
        ancora: mod.active ? '[E] Subir âncora' : '[E] Lançar âncora',
        horta: mod.readyCount > 0 ? '[E] Colher fruto salino' : '[E] Plantar semente',
      };
      if (labels[mod.kind]) return labels[mod.kind];
    }

    for (const f of this.sector.flotsam) {
      if (Math.hypot(f.x - this.player.position.x, f.z - this.player.position.z) < 3.4) {
        return '[E] Recolher detrito';
      }
    }

    const sel = this.inventory.getSelectedSlot();
    if (sel?.itemId === 'gancho') return '[Click / F] Lançar gancho';
    if (sel?.itemId === 'lanca') return '[Click / F] Atacar com lança';
    if (sel?.itemId === 'vara_pesca') return '[Click / F] Pescar';
    if (sel?.itemId === 'martelo_reparo') return '[Click / F] Reparar fundação';
    return '';
  }
}

export { cellKey };
