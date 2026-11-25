export type ItemCategory =
  | 'recurso'
  | 'consumivel'
  | 'ferramenta'
  | 'estrutura'
  | 'missao';

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  stackMax: number;
  icon: string;
  maxDurability?: number;
  hungerRestore?: number;
  thirstRestore?: number;
  healthRestore?: number;
  protectedOnDeath?: boolean;
}

export const ITEMS: Record<string, ItemDef> = {
  alga_marinha:{id:'alga_marinha',name:'Alga marinha',description:'Recurso submerso para fibras.',category:'recurso',stackMax:20,icon:'🌿'},
  minerio_marinho:{id:'minerio_marinho',name:'Minério marinho',description:'Metal encontrado no fundo do mar.',category:'recurso',stackMax:20,icon:'🪨'},
  tanque_mergulho:{id:'tanque_mergulho',name:'Tanque de mergulho',description:'Enquanto estiver na mochila, aumenta o oxigênio de 45 para 90 segundos. Recarrega na superfície.',category:'ferramenta',stackMax:1,icon:'🤿',protectedOnDeath:true},
  remo:{id:'remo',name:'Remo de madeira',description:'Use O ou o botão Remar no convés. W/S avança e recua, A/D vira. Não precisa de leme.',category:'ferramenta',stackMax:1,icon:'🛶',protectedOnDeath:true},
  lanterna_mergulho:{id:'lanterna_mergulho',name:'Lanterna de mergulho',description:'Ilumina automaticamente sob a água; selecione e use para ligar/desligar.',category:'ferramenta',stackMax:1,icon:'🔦',protectedOnDeath:true},
  nadadeiras:{id:'nadadeiras',name:'Nadadeiras',description:'Na mochila, aumentam a velocidade de nado em 35%.',category:'ferramenta',stackMax:1,icon:'🤿',protectedOnDeath:true},
  reliquia_atlas:{id:'reliquia_atlas',name:'Relíquia Atlas',description:'Artefato raro recuperado de um baú submerso.',category:'missao',stackMax:10,icon:'💎',protectedOnDeath:true},
  madeira: {
    id: 'madeira',
    name: 'Madeira à deriva',
    description: 'Tábuas e galhos recuperados do mar. Base de quase toda construção.',
    category: 'recurso',
    stackMax: 20,
    icon: '🪵',
  },
  plastico: {
    id: 'plastico',
    name: 'Plástico reciclável',
    description: 'Fragmentos poliméricos flutuantes usados em amarrações e flutuadores.',
    category: 'recurso',
    stackMax: 20,
    icon: '🧴',
  },
  folha: {
    id: 'folha',
    name: 'Folhas de palmeira',
    description: 'Folhagem resistente usada em filtros, telhados e fibras.',
    category: 'recurso',
    stackMax: 20,
    icon: '🌿',
  },
  fibra: {
    id: 'fibra',
    name: 'Fibra vegetal',
    description: 'Fibras trançáveis para fazer cordas e tecidos.',
    category: 'recurso',
    stackMax: 20,
    icon: '🌾',
  },
  corda: {
    id: 'corda',
    name: 'Corda resistente',
    description: 'Essencial para ferramentas, velas, âncoras e redes.',
    category: 'recurso',
    stackMax: 20,
    icon: '🪢',
  },
  sucata: {
    id: 'sucata',
    name: 'Sucata metálica',
    description: 'Placas e parafusos de antigos destroços.',
    category: 'recurso',
    stackMax: 20,
    icon: '⚙️',
  },
  pedra: {
    id: 'pedra',
    name: 'Pedra marinha',
    description: 'Bloco denso útil para lastro e âncoras.',
    category: 'recurso',
    stackMax: 20,
    icon: '🪨',
  },
  tecido: {
    id: 'tecido',
    name: 'Tecido trançado',
    description: 'Pano firme para velas, camas e curativos.',
    category: 'recurso',
    stackMax: 20,
    icon: '🧵',
  },
  carne_crua:{id:'carne_crua',name:'Carne crua',description:'Carne obtida por caça; asse na churrasqueira.',category:'consumivel',stackMax:20,icon:'🥩',hungerRestore:10,thirstRestore:-4},
  carne_assada:{id:'carne_assada',name:'Carne assada',description:'Refeição preparada na churrasqueira.',category:'consumivel',stackMax:20,icon:'🍖',hungerRestore:42,healthRestore:8},
  peixe_cru: {
    id: 'peixe_cru',
    name: 'Peixe cru',
    description: 'Pescado fresco. Melhor assar na churrasqueira antes de comer.',
    category: 'consumivel',
    stackMax: 20,
    icon: '🐟',
    hungerRestore: 12,
    thirstRestore: -4,
  },
  peixe_assado: {
    id: 'peixe_assado',
    name: 'Peixe assado',
    description: 'Refeição nutritiva preparada na churrasqueira.',
    category: 'consumivel',
    stackMax: 20,
    icon: '🍤',
    hungerRestore: 38,
    healthRestore: 6,
  },
  fruta_colhida: {
    id: 'fruta_colhida',
    name: 'Fruto salino',
    description: 'Cultivado na horta da jangada; hidrata e alimenta.',
    category: 'consumivel',
    stackMax: 20,
    icon: '🍈',
    hungerRestore: 22,
    thirstRestore: 14,
  },
  agua_salgada: {
    id: 'agua_salgada',
    name: 'Água salgada',
    description: 'Imprópria para consumo direto. Leve ao purificador.',
    category: 'consumivel',
    stackMax: 20,
    icon: '🌊',
    thirstRestore: -10,
  },
  agua_pura: {
    id: 'agua_pura',
    name: 'Água purificada',
    description: 'Água doce segura para beber ou regar a horta.',
    category: 'consumivel',
    stackMax: 20,
    icon: '💧',
    thirstRestore: 42,
  },
  isca: {
    id: 'isca',
    name: 'Isca de peixe',
    description: 'Distrai predadores marinhos por alguns segundos.',
    category: 'consumivel',
    stackMax: 20,
    icon: '🥩',
  },
  semente_salina: {
    id: 'semente_salina',
    name: 'Semente salina',
    description: 'Pode ser plantada na horta da jangada.',
    category: 'recurso',
    stackMax: 20,
    icon: '🌱',
  },
  machado: {
    id:'machado',name:'Machado de pedra',description:'Corta coqueiros nas ilhas. Selecione na barra rápida e pressione E.',category:'ferramenta',
    stackMax:1,maxDurability:60,icon:'🪓',protectedOnDeath:true,
  },
  gancho: {
    id: 'gancho',
    name: 'Gancho de coleta',
    description: 'Arremesse para puxar detritos flutuantes à distância.',
    category: 'ferramenta',
    stackMax: 1,
    maxDurability: 80,
    icon: '🪝',
    protectedOnDeath: true,
  },
  lanca: {
    id: 'lanca',
    name: 'Lança de madeira',
    description: 'Defesa contra tubarões e coleta em mergulho.',
    category: 'ferramenta',
    stackMax: 1,
    maxDurability: 60,
    icon: '🔱',
    protectedOnDeath: true,
  },
  martelo_reparo: {
    id: 'martelo_reparo',
    name: 'Martelo de reparo',
    description: 'Repara fundações danificadas da jangada.',
    category: 'ferramenta',
    stackMax: 1,
    maxDurability: 100,
    icon: '🔨',
    protectedOnDeath: true,
  },
  vara_pesca: {
    id: 'vara_pesca',
    name: 'Vara de pesca',
    description: 'Permite pescar peixes no oceano ao redor da jangada.',
    category: 'ferramenta',
    stackMax: 1,
    maxDurability: 60,
    icon: '🎣',
    protectedOnDeath: true,
  },
  bateria: {
    id: 'bateria',
    name: 'Bateria recuperada',
    description: 'Célula de energia antiga encontrada nos destroços.',
    category: 'missao',
    stackMax: 5,
    icon: '🔋',
    protectedOnDeath: true,
  },
  antena: {
    id: 'antena',
    name: 'Antena de rádio',
    description: 'Componente de recepção para sintonizar o sinal de Lia.',
    category: 'missao',
    stackMax: 5,
    icon: '📡',
    protectedOnDeath: true,
  },
  pagina_diario: {
    id: 'pagina_diario',
    name: 'Página do diário',
    description: 'Registro perdido sobre o colapso climático Atlas (2089).',
    category: 'missao',
    stackMax: 5,
    icon: '📜',
    protectedOnDeath: true,
  },
  carta_verde: {
    id: 'carta_verde',
    name: 'Carta do Arquipélago Verde',
    description: 'Coordenadas seguras rumo à próxima região da campanha.',
    category: 'missao',
    stackMax: 1,
    icon: '🗺️',
    protectedOnDeath: true,
  },
};

export const ITEM_LIST = Object.values(ITEMS);
