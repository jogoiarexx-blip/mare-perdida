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
| CP09 | Streaming e biomas | EM TESTE — etapa 6 | Setores de 128 m, ilhas determinísticas, LOD, descarregamento e solo navegável. Pendentes deltas persistentes, biomas, origem flutuante, perfil real e coop. |
| CP10 | Capítulos 2–3 | EM TESTE — etapa 1 | Fauna terrestre, combate, caça e loot persistente; missões M06–15, exploração submarina e chefes B02–03 ainda pendentes. |

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


### Melhoria de interface — ícones marítimos
- Catálogo SVG original e local para 23 itens, 12 construções, vitais, navegação, controles e diário; sem dependência de emoji para essas áreas.
- Barra rápida só reconstrói os oito botões quando inventário, durabilidade ou seleção mudam; ícones com cache, rótulos acessíveis e estilos responsivos. Testes de catálogo adicionados; inspeção visual no navegador pendente.


### Correção — retorno de fabricação/construção e sombras
- Substituído PCFSoftShadowMap removido por PCFShadowMap suportado. O aviso não era uma exceção fatal.
- Fechar painel por botão ou Esc retoma o loop e limpa entradas acumuladas; seleção de construção fecha antes de retomar, Esc prioriza painel aberto, controles touch não disparam ações através dos menus e falha de pointer lock não interrompe jogo. Reprodução manual em navegador ainda pendente.


### Correção visual — borda reforçada
- Moldura de aço aparente acima das tábuas, rebites e madeira escurecida, com geometria compartilhada e uma malha por reforço; preview de moldura no modo construção. Mantém a regra original de 100→220 HP ao reforçar uma fundação comum. Núcleo inicial preservado. Testes de geometria, visibilidade e resistência adicionados; validação visual no navegador pendente.


### Melhoria de construção — mira e feedback
- Interseção analítica com plano local do convés, respeitando inclinação, rotação e alcance de 5,5 m; preview atualizado após a câmera, revalidação no clique e mensagens específicas de bloqueio. Corrigida conversão horizontal da grade com rotação. Testes de seleção, materiais, limite e ocupação adicionados; teste manual PC/mobile pendente.


### Desempenho — lote de fundações, HUD e resolução
- Fundações e aros metálicos instanciados em dois lotes, cores por instância; matrizes só reenviadas quando muda estado visual. Prévia, módulos, saves e física preservados. HUD 10 Hz (12,5 Hz na construção), sem reescrever se conteúdo igual; menus pausados até 15 FPS; sombras 8/20 Hz; resolução adaptativa e opção baixa/alta em tempo real. Blur removido em tela touch. Testes unitários adicionados; FPS comparativo e testes reais de GPU/mobile pendentes.


### Desempenho 2 — CPU, consultas e detritos
- Sincronização estrutural completa deixa de ocorrer 20 vezes/s: construção, reparo, restauração e mordida atualizam a malha quando necessário; hortas atualizam apenas seu módulo. Busca de equipamentos e fundações próximas usa grade em bases grandes; redes numerosas consultam buckets de detritos, mantendo raio e ordem de coleta. Pool de meshes por tipo de detrito e mapa por ID evitam alocações e coleta duplicada; vetores temporários reutilizados e distâncias quadráticas. Testes de regressão adicionados. Medição real de FPS/GC e teste visual ainda pendentes.


### CP09.1 — primeira infraestrutura de mundo
- Chunks lógicos de 128 m, raios 1/2 e retenção por histerese, criação incremental e descarte de geometrias por ilha. Primeira ilha próxima (40,-67), demais por seed, margem entre setores, praia e terreno radial, coqueiros e pedras instanciados. LOD por distância, oceano acompanha jogador, colisão de altura no solo e bloqueio simples do centro da jangada em terra. Layout independente do carregamento e reconstruído com seed do save. Sem coleta terrestre, colisão de árvores/pedras, direção de navegação adicional, deltas ou origem flutuante nesta etapa. Testes de layout, 12 transições, triângulos e solo adicionados; teste manual e medição de memória/FPS pendentes.


### CP09.2 — recursos de ilhas
- 29 recursos por ilha (13 coqueiros, 10 rochas, 5 arbustos, 1 caixote), IDs determinísticos independentes da qualidade. Machado fabricável com 60 de durabilidade; coleta por E/Ação, inventário simulado antes da coleta para não perder recursos. Deltas de recursos esgotados no save, compatíveis com saves anteriores; remoção de instâncias e colisões após coleta, persistência entre streaming e troca de qualidade. Colisão horizontal por eixo com troncos, rochas e caixotes. Testes adicionados; inspeção visual, gameplay e FPS reais pendentes. Direção da jangada, formatos variados e ruínas completas ficam para a etapa seguinte.


### CP09.3 — navegação e descoberta
- Leme construível, controle direcional W/S/A/D e joystick touch, marcha à ré, âncora respeitada e rotação transportando o jogador sobre o convés. Colisão costeira testa centros das fundações, permitindo recuar de encalhes anteriores. Bússola com rumo cardinal e minimapa opcional M, 3×3 setores com neblina de descoberta e posição da jangada. Descobertas persistem em saves antigos/novos. Testes de navegação e mapa adicionados. Variedade de ilhas, ruínas, LOD de vegetação avançado e origem flutuante pendentes; validação manual e FPS pendentes.


### CP09.4 — biomas visuais e LOD de vegetação
- Quatro variantes determinísticas (tropical, rochosa, verde e arenosa), contorno irregular limitado ao raio original, perfis de relevo e paletas diferenciados. Primeira ilha mantém forma e altura originais; centros e IDs dos recursos preservados, com ajuste de altura conforme terreno. Mini mapa representa contornos e biomas. Ruínas baixas decorativas junto aos caixotes, sem interiores nem colisão própria. Vegetação tem três níveis com histerese: detalhada, geometria simplificada, oculta; materiais/geometrias compartilhados e descarte mantido. Testes de orçamento, limites e estabilidade adicionados; medição real e verificação visual pendentes. Origem flutuante e biomas com gameplay exclusivo serão etapas separadas.


### CP09.5 — geração em worker e observabilidade
- Worker opcional prepara arrays de terreno/normais/índices e dados determinísticos de recursos, transfere buffers, com até dois pedidos rastreados, descarte de respostas antigas e fallback local em erro/timeout. Setor do jogador prioritário e síncrono, fila reordenada somente ao mudar setor ou deslocar 16 m; inicialização reduzida a dois setores. Monitor opcional F3/FPS: FPS médio, p95, quadros lentos, draw calls, triângulos, contagem de geometrias/texturas, chunks, fila, ilhas, DPR e heap JS se suportado. Intervalo de quadro real para métricas e resolução, física continua com dt limitado. Testes de payload e métricas. Origem flutuante adiada; falta validar worker em browser real, memória GPU em bytes não disponível e não medida, profiling de transições e FPS em hardware real.


### CP09.6 — origem flutuante de renderização
- Origem gráfica próxima à câmera, ajustada em múltiplos de 128 m ao ultrapassar 512 m em X/Z. Simulação, saves, chunks, minimapa e recursos continuam em coordenadas globais double; transformação temporária da cena/câmera com restauração e atualização de sombras ao trocar origem. Fases das ondas e ripples reduzidas antes da GPU, partículas/cardumes/corda em buffers locais. Broadphase costeira conservadora evita testes de altura por fundação em mar aberto; perfis de altura sem alocação por consulta. F3 exibe origem e ajustes. Testes de invariância, exceção, onda e broadphase adicionados. Não é migração completa da simulação para coordenadas inteiras por setor; navegação extensa, shader e sombras em WebGL real, memória/FPS e P2P ainda precisam de validação.


### CP10.1 — fauna terrestre
- Dois caranguejos e um javali determinísticos por ilha; somente uma ilha ativa, patrulha/perseguição/preparação/recuperação/retorno, ataque com aviso e alcance, colisão básica com recursos. Lança com intervalo de 0,55 s contra fauna, corpo ocultado após 5 s e bolsa de carne persistente; mochila cheia mantém loot, save antigo compatível. Carne crua e assada, receita e interação na churrasqueira. Monitor F3 mostra fauna ativa. Testes de IA, orçamento, persistência e receita; verificação visual, FPS e campanha subsequente pendentes.


### CP10.2 — exploração submarina inicial
- Mergulho pela direção da câmera, subida por pulo, fundo procedural (~5–9 m), neblina subaquática, corais instanciados, algas/minério/destroços abertos coletáveis. Streaming de tiles de 64 m (até 9), geração incremental e descarte por distância. Tanque fabricável aumenta capacidade 45→90 s, recarga na superfície; coleta atômica e IDs persistentes nos saves. Testes adicionados. Predadores adicionais, interiores de destroços e missões pendentes; validação manual mobile e shader ainda necessária.
