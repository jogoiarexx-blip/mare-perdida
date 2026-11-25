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


### Melhoria visual — geometria procedural
- Personagem com colete, cabeça, braços e pernas animados; tubarão com silhueta curva, olhos, barbatanas e cauda animada.
- Convés com tábuas e travessas em uma malha compartilhada; vela curvada; barris, caixotes e garrafas com detalhes geométricos agrupados.
- Sem downloads novos de modelos ou texturas. Física, save, inventário e missões preservados. Testes de orçamento de triângulos adicionados; desempenho real e avaliação visual ainda pendentes de medição.


### Melhoria visual 2 — oceano e cenário marítimo
- Ondas e normais analíticas na GPU, cores e espuma procedural; atualização da CPU apenas por uniforms, sem alterar altura de onda da física. Perfis de 8.192 e 25.088 triângulos para a superfície.
- Casco com proa curva, cabine, corrimãos e boia com faixa e proteção da luz. LOD com histerese para detritos e detalhes do destroço; sombras de detritos somente até 28 m. Sem novos assets externos.
- Testes de orçamento e histerese adicionados. Compilação do shader no navegador, comparação de FPS e avaliação visual em dispositivos reais ainda pendentes.


### Melhoria visual 3 — equipamentos e ambiente
- Gancho curvo, rede com trama, purificador com tubulação, grelha, rádio com painel, cobertura com ripas e plantas com folhas. Templates de módulos compartilhados por tipo, inclusive após remoção/reconstrução; atualização de rotação e troca de tipo.
- Cardumes decorativos instanciados (12/30) visíveis abaixo da superfície e chuva em uma malha de segmentos (72/180). Sem entidades de gameplay ou novos assets. Testes de orçamento adicionados; validação visual e FPS reais pendentes.
