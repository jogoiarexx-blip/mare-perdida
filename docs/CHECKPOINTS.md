# Checkpoints — Maré Perdida: O Último Horizonte

| CP | Entrega | Status | Cenário / Evidência |
|---|---|---|---|
| CP00 | Bootstrap, arquitetura e catálogo de dados | APROVADO | `tsc --noEmit`, `vite build` (`base: './'`) e `recipes-and-data.test.ts` (validador DAG) aprovados |
| CP01 | Oceano e controlador (1ª/3ª pessoa, nado, colisão) | APROVADO | WebGL ativo (2560×947) em `vite preview`, sem erros de console, colisão local no convés e nado |
| CP02 | Coleta e inventário (gancho, stack, barra rápida) | APROVADO | `inventory.test.ts` (3/3) aprovado; gancho e barra rápida de 8 slots integrados |
| CP03 | Crafting, sobrevivência e HUD | APROVADO | `survival.test.ts` (2/2) aprovado; HUD verificada em runtime com vitais, purificador, churrasqueira e pesca |
| CP04 | Construção naval e flutuação | APROVADO | `structure-graph.test.ts` (3/3) aprovado; grade 1m, ghost verde/vermelho, massa/empuxo e âncora/vela |
| CP05 | Saves e recuperação (IndexedDB A/B, export/import) | APROVADO | `save-store.test.ts` (2/2) aprovado com fallback de slot A corrompido para B e export/import JSON |
| CP06 | Transporte P2P base | EM TESTE | Diagnóstico WebRTC no menu com convite/resposta manual, canal de dados e ping bidirecional. Ainda faltam sinalização por sala, reentrada por token e validação em redes distintas e com TURN. |
| CP07 | Autoridade e coop | PENDENTE | Depende do transporte e da sincronização autoritativa. |
| CP08 | Capítulo 1 (M01–M05, S001–S010, B01 Mandíbula Branca) | EM TESTE | Fluxo lógico validado em `quest-engine.test.ts` (2/2); pendente playthrough humano completo do chefe B01 em 3D |

## Evidências do CP06

- A base `3f9ef76` já servia o jogo pelo Pages e incluía os sistemas solo acima. A árvore desse commit ainda não tinha transporte WebRTC.
- Em Edge headless, dois contextos locais independentes (desktop e toque emulado, 390 × 844) rejeitaram um convite malformado, negociaram duas conexões reais, trocaram ping nos dois sentidos e detectaram o encerramento remoto. A segunda conexão usou um novo convite. Não houve teste entre redes, em celular físico ou via TURN.
- No mesmo teste, os dois contextos voltaram ao menu e abriram um novo mundo solo. No desktop, o diário abriu pelo teclado, o save manual foi concluído e o mundo pôde ser retomado após recarregar. Não houve playthrough de coleta, construção, colisões ou combate.
- `npm test` passou com 15 testes em 6 arquivos. `npm run build` passou com o aviso de tamanho do bundle inicial (168,08 kB gzip contra 167,17 kB na base). O código do diagnóstico carrega sob demanda (2,28 kB gzip). Esses tamanhos são do build local e não medem FPS.
