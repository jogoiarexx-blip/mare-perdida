# Checkpoints — Maré Perdida: O Último Horizonte

| CP | Entrega | Status | Cenário / Evidência |
|---|---|---|---|
| CP00 | Bootstrap, arquitetura e catálogo de dados | APROVADO | `tsc --noEmit`, `vite build` (`base: './'`) e `recipes-and-data.test.ts` (validador DAG) aprovados |
| CP01 | Oceano e controlador (1ª/3ª pessoa, nado, colisão) | APROVADO | WebGL ativo (2560×947) em `vite preview`, sem erros de console, colisão local no convés e nado |
| CP02 | Coleta e inventário (gancho, stack, barra rápida) | APROVADO | `inventory.test.ts` (3/3) aprovado; gancho e barra rápida de 8 slots integrados |
| CP03 | Crafting, sobrevivência e HUD | APROVADO | `survival.test.ts` (2/2) aprovado; HUD verificada em runtime com vitais, purificador, churrasqueira e pesca |
| CP04 | Construção naval e flutuação | APROVADO | `structure-graph.test.ts` (3/3) aprovado; grade 1m, ghost verde/vermelho, massa/empuxo e âncora/vela |
| CP05 | Saves e recuperação (IndexedDB A/B, export/import) | APROVADO | `save-store.test.ts` (2/2) aprovado com fallback de slot A corrompido para B e export/import JSON |
| CP08 | Capítulo 1 (M01–M05, S001–S010, B01 Mandíbula Branca) | EM TESTE | Fluxo lógico validado em `quest-engine.test.ts` (2/2); pendente playthrough humano completo do chefe B01 em 3D |
