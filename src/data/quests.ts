export type QuestStatus = 'LOCKED' | 'AVAILABLE' | 'ACTIVE' | 'COMPLETED' | 'FAILED_RETRY';

export type ObjectiveKind =
  | 'collect'
  | 'craft'
  | 'place'
  | 'foundationCount'
  | 'purifyWater'
  | 'catchFish'
  | 'harvestCrop'
  | 'radioTune'
  | 'bossResolve'
  | 'rest'
  | 'inspectBuoy';

export interface QuestObjectiveDef {
  id: string;
  description: string;
  kind: ObjectiveKind;
  target: string;
  count: number;
  scope: 'world' | 'personal';
}

export interface QuestRewardDef {
  credits?: number;
  xp?: number;
  items?: Array<{ itemId: string; count: number }>;
  reputation?: { faction: 'docas' | 'farol' | 'frota'; delta: number };
  unlocks?: string[];
}

export interface QuestDef {
  id: string;
  chapter: number;
  type: 'main' | 'side';
  title: string;
  summary: string;
  requires: string[];
  objectives: QuestObjectiveDef[];
  rewards: QuestRewardDef;
  checkpoint?: boolean;
  failPolicy: string;
  dialogueOnStart?: {
    speaker: string;
    lines: string[];
  };
  dialogueOnComplete?: {
    speaker: string;
    lines: string[];
  };
}

export const CHAPTER_1_QUESTS: QuestDef[] = [
  {
    id: 'M01',
    chapter: 1,
    type: 'main',
    title: 'Sobreviver ao despertar',
    summary: 'Recolha madeira e plástico à deriva e fabrique um gancho de coleta.',
    requires: [],
    objectives: [
      { id: 'm01_wood', description: 'Recolher madeira à deriva', kind: 'collect', target: 'madeira', count: 8, scope: 'world' },
      { id: 'm01_plastic', description: 'Recolher plástico reciclável', kind: 'collect', target: 'plastico', count: 4, scope: 'world' },
      { id: 'm01_hook', description: 'Fabricar gancho de coleta', kind: 'craft', target: 'rec_gancho', count: 1, scope: 'personal' },
    ],
    rewards: { xp: 40, items: [{ itemId: 'folha', count: 3 }] },
    checkpoint: true,
    failPolicy: 'Detritos continuam derivando continuamente perto da jangada.',
    dialogueOnStart: {
      speaker: 'Diário de Bordo',
      lines: [
        'Ano 2089. As águas engoliram as costas após o colapso do Projeto Atlas.',
        'Você desperta numa pequena jangada. Use o gancho ou nade até os destroços para garantir o básico.',
      ],
    },
  },
  {
    id: 'M02',
    chapter: 1,
    type: 'main',
    title: 'Água é vida',
    summary: 'Construa um purificador solar na jangada e produza 3 porções de água pura.',
    requires: ['M01'],
    objectives: [
      { id: 'm02_purifier', description: 'Construir purificador solar', kind: 'place', target: 'purificador', count: 1, scope: 'world' },
      { id: 'm02_water', description: 'Purificar 3 porções de água', kind: 'purifyWater', target: 'agua_pura', count: 3, scope: 'world' },
    ],
    rewards: { xp: 50, items: [{ itemId: 'corda', count: 2 }] },
    checkpoint: true,
    failPolicy: 'Água salgada pode ser coletada livremente no mar a qualquer momento.',
  },
  {
    id: 'M03',
    chapter: 1,
    type: 'main',
    title: 'O primeiro abrigo',
    summary: 'Amplie a jangada para pelo menos 9 fundações e construa uma cama.',
    requires: ['M02'],
    objectives: [
      { id: 'm03_foundations', description: 'Alcançar 9 fundações na jangada', kind: 'foundationCount', target: 'fundacao', count: 9, scope: 'world' },
      { id: 'm03_bed', description: 'Construir uma cama simples', kind: 'place', target: 'cama', count: 1, scope: 'world' },
    ],
    rewards: { xp: 60, unlocks: ['vela', 'ancora'] },
    checkpoint: true,
    failPolicy: 'Se fundações forem destruídas, podem ser reconstruídas com madeira e plástico.',
  },
  {
    id: 'M04',
    chapter: 1,
    type: 'main',
    title: 'Voz no rádio',
    summary: 'Recupere uma bateria e antena no destroço próximo, monte o rádio e sintonize Lia.',
    requires: ['M03'],
    objectives: [
      { id: 'm04_bat', description: 'Recuperar bateria nos destroços', kind: 'collect', target: 'bateria', count: 1, scope: 'world' },
      { id: 'm04_ant', description: 'Recuperar antena nos destroços', kind: 'collect', target: 'antena', count: 1, scope: 'world' },
      { id: 'm04_radio', description: 'Montar rádio básico na jangada', kind: 'place', target: 'radio', count: 1, scope: 'world' },
      { id: 'm04_tune', description: 'Sintonizar o sinal de Lia [E no rádio]', kind: 'radioTune', target: 'lia_ch1', count: 1, scope: 'world' },
    ],
    rewards: { xp: 80, reputation: { faction: 'farol', delta: 10 }, items: [{ itemId: 'sucata', count: 4 }] },
    checkpoint: true,
    failPolicy: 'Destroço com peças de rádio reaparece próximo caso o jogador se afaste.',
    dialogueOnComplete: {
      speaker: 'Lia (Rádio)',
      lines: [
        'Alô? Alguém na escuta?! Aqui é Lia, engenheira do setor de comunicações!',
        'Se você ainda flutua no Mar dos Destroços, cuidado com o predador territorial. Afaste-o e siga para o Arquipélago Verde!',
      ],
    },
  },
  {
    id: 'M05',
    chapter: 1,
    type: 'main',
    title: 'O predador',
    summary: 'Defenda a jangada contra o tubarão Mandíbula Branca usando a lança ou isca e obtenha a Carta Verde.',
    requires: ['M04'],
    objectives: [
      { id: 'm05_spear', description: 'Fabricar lança de defesa', kind: 'craft', target: 'rec_lanca', count: 1, scope: 'personal' },
      { id: 'm05_boss', description: 'Repelir Mandíbula Branca (B01)', kind: 'bossResolve', target: 'B01', count: 1, scope: 'world' },
    ],
    rewards: {
      xp: 150,
      credits: 40,
      items: [{ itemId: 'carta_verde', count: 1 }],
      unlocks: ['borda_reforcada', 'arquipelago_verde'],
    },
    checkpoint: true,
    failPolicy: 'Checkpoint antes do encontro; carta verde e núcleo da jangada nunca afundam.',
    dialogueOnComplete: {
      speaker: 'Lia (Rádio)',
      lines: [
        'Incrível! Você afastou Mandíbula Branca e garantiu a Carta do Arquipélago Verde.',
        'Capítulo 1 concluído! Continue expandindo a jangada ou explore as missões secundárias.',
      ],
    },
  },
  // Missões secundárias S001–S010 do Capítulo 1
  {
    id: 'S001',
    chapter: 1,
    type: 'side',
    title: 'Pescado do dia',
    summary: 'Fabrique uma vara de pesca e pesque 3 peixes.',
    requires: [],
    objectives: [
      { id: 's001_fish', description: 'Pescar 3 peixes', kind: 'catchFish', target: 'peixe_cru', count: 3, scope: 'personal' },
    ],
    rewards: { xp: 35, credits: 15, items: [{ itemId: 'isca', count: 2 }] },
    failPolicy: 'Pode pescar novamente a qualquer momento.',
  },
  {
    id: 'S002',
    chapter: 1,
    type: 'side',
    title: 'Rede inicial',
    summary: 'Construa uma rede coletora na borda da jangada.',
    requires: ['M01'],
    objectives: [
      { id: 's002_net', description: 'Instalar rede coletora', kind: 'place', target: 'rede_coleta', count: 1, scope: 'world' },
    ],
    rewards: { xp: 30, items: [{ itemId: 'madeira', count: 4 }] },
    failPolicy: 'Recuperável reconstruindo a rede.',
  },
  {
    id: 'S003',
    chapter: 1,
    type: 'side',
    title: 'Mesa seca',
    summary: 'Construa uma cobertura seca para proteger o convés.',
    requires: ['M01'],
    objectives: [
      { id: 's003_roof', description: 'Construir cobertura seca', kind: 'place', target: 'cobertura', count: 1, scope: 'world' },
    ],
    rewards: { xp: 30, credits: 15 },
    failPolicy: 'Reconstruível com madeira e folhas.',
  },
  {
    id: 'S004',
    chapter: 1,
    type: 'side',
    title: 'Diário perdido',
    summary: 'Recupere uma página do diário de 2089 nos caixotes flutuantes.',
    requires: [],
    objectives: [
      { id: 's004_page', description: 'Recuperar página do diário', kind: 'collect', target: 'pagina_diario', count: 1, scope: 'world' },
    ],
    rewards: { xp: 40, reputation: { faction: 'farol', delta: 5 } },
    failPolicy: 'Páginas reaparecem em caixotes à deriva se perdidas.',
  },
  {
    id: 'S005',
    chapter: 1,
    type: 'side',
    title: 'Sinal vermelho',
    summary: 'Nade até uma boia de emergência e inspecione sua caixa.',
    requires: [],
    objectives: [
      { id: 's005_buoy', description: 'Inspecionar boia de emergência', kind: 'inspectBuoy', target: 'boia_vermelha', count: 1, scope: 'world' },
    ],
    rewards: { xp: 40, items: [{ itemId: 'sucata', count: 3 }, { itemId: 'pedra', count: 3 }] },
    failPolicy: 'Boia permanece marcada na bússola até ser inspecionada.',
  },
  {
    id: 'S006',
    chapter: 1,
    type: 'side',
    title: 'Primeira horta',
    summary: 'Monte um canteiro de cultivo e colha um fruto salino.',
    requires: ['M02'],
    objectives: [
      { id: 's006_planter', description: 'Construir canteiro de cultivo', kind: 'place', target: 'horta', count: 1, scope: 'world' },
      { id: 's006_harvest', description: 'Colher fruto salino', kind: 'harvestCrop', target: 'fruta_colhida', count: 1, scope: 'world' },
    ],
    rewards: { xp: 45, items: [{ itemId: 'semente_salina', count: 3 }] },
    failPolicy: 'Sementes surgem em caixotes e frutos colhidos.',
  },
  {
    id: 'S007',
    chapter: 1,
    type: 'side',
    title: 'Nó resistente',
    summary: 'Produza 5 cordas resistentes.',
    requires: [],
    objectives: [
      { id: 's007_rope', description: 'Fabricar 5 cordas', kind: 'craft', target: 'rec_corda', count: 5, scope: 'personal' },
    ],
    rewards: { xp: 25, credits: 10 },
    failPolicy: 'Fibras derivam constantemente.',
  },
  {
    id: 'S008',
    chapter: 1,
    type: 'side',
    title: 'Baú à deriva',
    summary: 'Construa um baú de convés para organizar seus suprimentos.',
    requires: ['M01'],
    objectives: [
      { id: 's008_chest', description: 'Construir baú de convés', kind: 'place', target: 'bau', count: 1, scope: 'world' },
    ],
    rewards: { xp: 30, items: [{ itemId: 'tecido', count: 2 }] },
    failPolicy: 'Reconstruível a qualquer hora.',
  },
  {
    id: 'S009',
    chapter: 1,
    type: 'side',
    title: 'Água para Lia',
    summary: 'Prepare reservas extras de água purificada após falar com Lia.',
    requires: ['M04'],
    objectives: [
      { id: 's009_water', description: 'Purificar 3 porções adicionais', kind: 'purifyWater', target: 'agua_pura', count: 3, scope: 'world' },
    ],
    rewards: { xp: 45, reputation: { faction: 'docas', delta: 10 }, credits: 25 },
    failPolicy: 'Sem limite de tempo.',
  },
  {
    id: 'S010',
    chapter: 1,
    type: 'side',
    title: 'Noite tranquila',
    summary: 'Descanse em sua cama após construir um abrigo.',
    requires: ['M03'],
    objectives: [
      { id: 's010_rest', description: 'Descansar na cama [E]', kind: 'rest', target: 'cama', count: 1, scope: 'personal' },
    ],
    rewards: { xp: 30, items: [{ itemId: 'peixe_assado', count: 2 }] },
    failPolicy: 'Pode descansar sempre que houver uma cama no convés.',
  },
];

/** Contratos paralelos, sem ocupar IDs reservados da campanha no GDD. */
export const DIVE_QUESTS:QuestDef[]=[
 {id:'DIVE01',chapter:3,type:'side',title:'Primeira descida',summary:'Recupere algas e minério do fundo do mar.',requires:[],objectives:[{id:'d1a',description:'Coletar 2 algas',kind:'collect',target:'alga_marinha',count:2,scope:'world'},{id:'d1b',description:'Coletar 2 minérios',kind:'collect',target:'minerio_marinho',count:2,scope:'world'}],rewards:{xp:55,credits:20},failPolicy:'Recursos disponíveis em novos setores.'},
 {id:'DIVE02',chapter:3,type:'side',title:'Equipamento de mergulho',summary:'Fabrique tanque, lanterna e nadadeiras.',requires:[],objectives:[{id:'d2a',description:'Fabricar tanque',kind:'craft',target:'rec_tanque_mergulho',count:1,scope:'personal'},{id:'d2b',description:'Fabricar lanterna',kind:'craft',target:'rec_lanterna_mergulho',count:1,scope:'personal'},{id:'d2c',description:'Fabricar nadadeiras',kind:'craft',target:'rec_nadadeiras',count:1,scope:'personal'}],rewards:{xp:80,credits:30},failPolicy:'Receitas sempre disponíveis.'},
 {id:'DIVE03',chapter:3,type:'side',title:'Segredos do naufrágio',summary:'Explore um casco e recupere uma relíquia Atlas.',requires:[],objectives:[{id:'d3a',description:'Recuperar relíquia Atlas',kind:'collect',target:'reliquia_atlas',count:1,scope:'world'}],rewards:{xp:100,credits:50},failPolicy:'Procure outro naufrágio em novos setores.'}
];
