# Maré Perdida: O Último Horizonte (Vertical Slice)

Protótipo jogável 3D em navegador (Three.js + TypeScript + Vite) baseado no `GDD_Mare_Perdida_v1.0.md`, cobrindo o núcleo de sobrevivência, construção naval, saves IndexedDB e Capítulo 1 (*Mar dos Destroços*).

[Jogar Maré Perdida](https://jogoiarexx-blip.github.io/mare-perdida/)

## Publicação

Em **Settings → Pages**, selecione **GitHub Actions** como fonte. O workflow executa os testes, compila o jogo e publica `dist/` a cada envio para `main`. Também é possível executá-lo manualmente na aba **Actions**.

## Como executar
```bash
npm ci
npm run dev      # inicia servidor local Vite
npm run test     # executa testes unitários (Vitest)
npm run build    # verifica tipos (tsc) e gera dist/ com base relativa './'
```

## Controles (PC e Mobile)
- **WASD / Setas:** mover na jangada e nadar no oceano
- **Espaço:** pular / subir na água · **Shift:** correr
- **Mouse / Arrastar:** olhar · **V:** alternar 1ª / 3ª pessoa
- **Click / F:** usar item selecionado (lançar gancho, atacar com lança, pescar, reparar, comer/beber)
- **E:** interagir (coletar detritos próximos, usar purificador/churrasqueira/cama/horta/rádio/vela/âncora, vasculhar destroços e boia)
- **1–8:** selecionar slot da barra rápida
- **I:** mochila e fabricação · **B:** construção naval (`R` gira peça, `X` desmonta) · **J:** diário de missões · **Esc:** pausar / fechar

No mobile ou quando ativado em *Opções*, o joystick virtual e os botões de ação aparecem automaticamente.

## Estrutura
- `src/core/`: `Clock`, `EventBus`, `GameLoop`, `SeededRng`
- `src/data/`: catálogo de itens, receitas, missões do Cap. 1 (`M01–M05`, `S001–S010`) e validador DAG
- `src/world/`: oceano analítico 3D, clima/ciclo dia-noite e gerenciador de detritos/POIs
- `src/raft/`: grade de 1 m, grafo de conectividade/empuxo e renderizador com ghost verde/vermelho
- `src/player/`: controlador 1ª/3ª pessoa, inventário transacional, gancho e sobrevivência
- `src/ai/`: chefe `B01 Mandíbula Branca`
- `src/quests/`: motor idempotente de missões
- `src/save/`: persistência IndexedDB com slots rotativos A/B e export/import JSON
- `docs/`: `ADR-001-arquitetura-inicial.md` e `CHECKPOINTS.md`
