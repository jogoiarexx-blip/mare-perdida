export interface Ingredient {
  itemId: string;
  count: number;
}

export type BenchType = 'manual' | 'purificador' | 'churrasqueira' | 'construcao';

export type StructureKind =
  | 'fundacao'
  | 'borda_reforcada'
  | 'purificador'
  | 'churrasqueira'
  | 'cama'
  | 'rede_coleta'
  | 'vela'
  | 'ancora'
  | 'leme'
  | 'radio'
  | 'cobertura'
  | 'horta'
  | 'bau';

export interface RecipeDef {
  id: string;
  name: string;
  description: string;
  bench: BenchType;
  ingredients: Ingredient[];
  outputItemId?: string;
  outputCount?: number;
  placesStructure?: StructureKind;
  structureMass?: number;
  requiresUnlock?: string;
}

export const RECIPES: RecipeDef[] = [
  {
    id: 'rec_corda',
    name: 'Corda resistente',
    description: 'Trança fibras vegetais em corda firme.',
    bench: 'manual',
    ingredients: [{ itemId: 'fibra', count: 2 }],
    outputItemId: 'corda',
    outputCount: 1,
  },
  {
    id: 'rec_fibra_folha',
    name: 'Fibras de palmeira',
    description: 'Desfia folhas para obter fibras vegetais.',
    bench: 'manual',
    ingredients: [{ itemId: 'folha', count: 2 }],
    outputItemId: 'fibra',
    outputCount: 2,
  },
  {
    id: 'rec_tecido',
    name: 'Tecido trançado',
    description: 'Tecer fibras e plástico para velas e abrigo.',
    bench: 'manual',
    ingredients: [
      { itemId: 'fibra', count: 3 },
      { itemId: 'plastico', count: 1 },
    ],
    outputItemId: 'tecido',
    outputCount: 1,
  },
  {
    id: 'rec_gancho',
    name: 'Gancho de coleta',
    description: 'Ferramenta essencial para puxar recursos à deriva.',
    bench: 'manual',
    ingredients: [
      { itemId: 'madeira', count: 3 },
      { itemId: 'plastico', count: 2 },
    ],
    outputItemId: 'gancho',
    outputCount: 1,
  },
  {
    id:'rec_machado',name:'Machado de pedra',description:'Ferramenta para cortar coqueiros nas ilhas.',bench:'manual',
    ingredients:[{itemId:'madeira',count:3},{itemId:'pedra',count:2},{itemId:'corda',count:1}],
    outputItemId:'machado',outputCount:1,
  },
  {
    id: 'rec_lanca',
    name: 'Lança de madeira',
    description: 'Permite defender a jangada contra Mandíbula Branca.',
    bench: 'manual',
    ingredients: [
      { itemId: 'madeira', count: 5 },
      { itemId: 'corda', count: 2 },
    ],
    outputItemId: 'lanca',
    outputCount: 1,
  },
  {
    id: 'rec_martelo_reparo',
    name: 'Martelo de reparo',
    description: 'Conserta fundações e módulos danificados.',
    bench: 'manual',
    ingredients: [
      { itemId: 'madeira', count: 3 },
      { itemId: 'sucata', count: 1 },
      { itemId: 'corda', count: 1 },
    ],
    outputItemId: 'martelo_reparo',
    outputCount: 1,
  },
  {
    id: 'rec_vara_pesca',
    name: 'Vara de pesca',
    description: 'Pesque peixes frescos diretamente do convés.',
    bench: 'manual',
    ingredients: [
      { itemId: 'madeira', count: 3 },
      { itemId: 'corda', count: 2 },
    ],
    outputItemId: 'vara_pesca',
    outputCount: 1,
  },
  {
    id: 'rec_isca',
    name: 'Isca de peixe',
    description: 'Arremesse no mar para distrair o tubarão.',
    bench: 'manual',
    ingredients: [
      { itemId: 'peixe_cru', count: 1 },
      { itemId: 'corda', count: 1 },
    ],
    outputItemId: 'isca',
    outputCount: 1,
  },
  {
    id: 'rec_agua_pura',
    name: 'Purificar água (lote)',
    description: 'Destila água salgada em água doce potável.',
    bench: 'purificador',
    ingredients: [{ itemId: 'agua_salgada', count: 1 }],
    outputItemId: 'agua_pura',
    outputCount: 1,
  },
  {
    id: 'rec_peixe_assado',
    name: 'Assar peixe',
    description: 'Prepara peixe cru na churrasqueira.',
    bench: 'churrasqueira',
    ingredients: [{ itemId: 'peixe_cru', count: 1 }],
    outputItemId: 'peixe_assado',
    outputCount: 1,
  },
  {id:'rec_carne_assada',name:'Assar carne',description:'Prepare a carne da caça na churrasqueira.',bench:'churrasqueira',ingredients:[{itemId:'carne_crua',count:1}],outputItemId:'carne_assada',outputCount:1},
  // Construção naval na grade de 1m
  {
    id: 'build_fundacao',
    name: 'Fundação de madeira',
    description: 'Expande o convés da jangada (+100 de capacidade).',
    bench: 'construcao',
    ingredients: [
      { itemId: 'madeira', count: 2 },
      { itemId: 'plastico', count: 2 },
    ],
    placesStructure: 'fundacao',
    structureMass: 20,
  },
  {
    id: 'build_borda_reforcada',
    name: 'Reforço de borda',
    description: 'Adiciona uma moldura de aço à fundação existente: resistência de 100 para 220 HP. Não cria uma nova fundação.',
    bench: 'construcao',
    ingredients: [
      { itemId: 'madeira', count: 3 },
      { itemId: 'sucata', count: 2 },
    ],
    placesStructure: 'borda_reforcada',
    structureMass: 18,
  },
  {
    id: 'build_purificador',
    name: 'Purificador solar',
    description: 'Transforma água salgada em porções potáveis.',
    bench: 'construcao',
    ingredients: [
      { itemId: 'madeira', count: 4 },
      { itemId: 'plastico', count: 3 },
      { itemId: 'folha', count: 2 },
    ],
    placesStructure: 'purificador',
    structureMass: 25,
  },
  {
    id: 'build_churrasqueira',
    name: 'Churrasqueira',
    description: 'Assa peixes para recuperar mais fome e saúde.',
    bench: 'construcao',
    ingredients: [
      { itemId: 'madeira', count: 4 },
      { itemId: 'sucata', count: 2 },
    ],
    placesStructure: 'churrasqueira',
    structureMass: 22,
  },
  {
    id: 'build_cama',
    name: 'Cama simples',
    description: 'Permite descansar e define ponto de renascimento.',
    bench: 'construcao',
    ingredients: [
      { itemId: 'madeira', count: 5 },
      { itemId: 'tecido', count: 3 },
    ],
    placesStructure: 'cama',
    structureMass: 24,
  },
  {
    id: 'build_rede_coleta',
    name: 'Rede coletora',
    description: 'Captura automaticamente detritos que passam pela borda.',
    bench: 'construcao',
    ingredients: [
      { itemId: 'madeira', count: 4 },
      { itemId: 'corda', count: 4 },
      { itemId: 'sucata', count: 2 },
    ],
    placesStructure: 'rede_coleta',
    structureMass: 16,
  },
  {
    id: 'build_vela',
    name: 'Vela de navegação',
    description: 'Impulsiona a jangada conforme a direção do leme.',
    bench: 'construcao',
    ingredients: [
      { itemId: 'tecido', count: 8 },
      { itemId: 'madeira', count: 6 },
      { itemId: 'corda', count: 3 },
    ],
    placesStructure: 'vela',
    structureMass: 30,
  },
  {
    id: 'build_ancora',
    name: 'Âncora de pedra',
    description: 'Freia e mantém a jangada parada perto de destroços.',
    bench: 'construcao',
    ingredients: [
      { itemId: 'pedra', count: 6 },
      { itemId: 'corda', count: 3 },
    ],
    placesStructure: 'ancora',
    structureMass: 35,
  },
  {
    id:'build_leme',name:'Leme de navegação',description:'Assuma o leme com E/Ação. Direcional ou W/S e A/D para navegar, inclusive em marcha à ré.',bench:'construcao',
    ingredients:[{itemId:'madeira',count:5},{itemId:'sucata',count:2},{itemId:'corda',count:2}],placesStructure:'leme',structureMass:22,
  },
  {
    id: 'build_radio',
    name: 'Rádio básico',
    description: 'Sintoniza frequências de emergência e a engenheira Lia.',
    bench: 'construcao',
    ingredients: [
      { itemId: 'madeira', count: 4 },
      { itemId: 'sucata', count: 2 },
      { itemId: 'bateria', count: 1 },
      { itemId: 'antena', count: 1 },
    ],
    placesStructure: 'radio',
    structureMass: 18,
  },
  {
    id: 'build_cobertura',
    name: 'Cobertura seca',
    description: 'Abrigo de palha contra chuva e calor.',
    bench: 'construcao',
    ingredients: [
      { itemId: 'madeira', count: 4 },
      { itemId: 'folha', count: 4 },
    ],
    placesStructure: 'cobertura',
    structureMass: 14,
  },
  {
    id: 'build_horta',
    name: 'Canteiro de cultivo',
    description: 'Cultive sementes salinas com água doce.',
    bench: 'construcao',
    ingredients: [
      { itemId: 'madeira', count: 4 },
      { itemId: 'plastico', count: 2 },
      { itemId: 'corda', count: 2 },
    ],
    placesStructure: 'horta',
    structureMass: 20,
  },
  {
    id: 'build_bau',
    name: 'Baú de convés',
    description: 'Armazena recursos extras da tripulação.',
    bench: 'construcao',
    ingredients: [
      { itemId: 'madeira', count: 6 },
      { itemId: 'sucata', count: 2 },
    ],
    placesStructure: 'bau',
    structureMass: 22,
  },
];
