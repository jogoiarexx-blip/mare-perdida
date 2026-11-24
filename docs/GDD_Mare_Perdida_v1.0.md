# MARÉ PERDIDA: O ÚLTIMO HORIZONTE
## Game Design Document (GDD) — v1.0
**Status:** projeto de design, não implementado | **Idioma:** PT-BR | **Plataforma-alvo:** navegador PC e mobile | **Data:** 24/11/2026

## 1. Visão e escopo
Survival 3D cooperativo inspirado no ciclo de coleta, construção e exploração de Raft, com propriedade intelectual, história, ambientes e identidade originais. A jangada é o lar móvel do jogador. A campanha é o motivo para viajar, e as crises marítimas obrigam a transformar esse lar em uma embarcação resiliente. Uma campanha completa precisa ser terminável em solo e em cooperação. Não haverá tarefas que exijam dois humanos.

**Metas da versão 1.0:** 12 capítulos, 60 missões principais, 120 secundárias autorais, 40 modelos de contratos repetíveis, 12 chefes/encontros de clímax, 12 regiões, 3 finais, modo infinito, 35–50 horas de campanha como meta a validar. 1–4 jogadores no primeiro lançamento cooperativo; até 8 somente após teste de carga. Primeira e terceira pessoa; Three.js, JavaScript/TypeScript modular, WebRTC e IndexedDB; integração GameForge condicionada à inspeção real do repositório. Frontend estático no GitHub Pages, sinalização e TURN externos opcionais/conforme rede. Todos os números são metas propostas e ajustáveis por playtest.

**Pilares:** sobreviver sem transformar a fome em trabalho repetitivo; construir com consequências de peso e energia; explorar lugares únicos; cooperar sem dependência de outro humano; decidir o destino das comunidades. Sem PvP obrigatório, monetização pay-to-win ou dependência online para solo.

## 2. Narrativa e personagens
Em 2089 o projeto climático Atlas entra em colapso, inundando continentes. O protagonista acorda numa jangada, recebe um sinal de rádio e procura a estação Horizonte, que pode reativar sistemas de drenagem e restaurar áreas habitáveis. A verdade: Atlas foi ampliado apesar de alertas; o sistema ainda opera automaticamente e coloca assentamentos em perigo.

- Lia, engenheira: restaura o rádio, ensina eletrônica e questiona o uso de Atlas.
- Caio, médico: abre enfermaria e missões sanitárias; pode ser recrutado.
- Nara, navegadora: ensina correntes, cartas e tempestades.
- Bento, agricultor: introduz sementes resistentes à salinidade.
- Ivo, líder das Docas Livres: negocia recursos e exige autonomia.
- Suri, pesquisadora da Ordem do Farol: quer abrir o arquivo Atlas.
- Varga, comandante da Frota de Ferro: busca monopolizar a energia; antagonista humano, pode negociar mediante provas.
- ÍRIS, sistema de controle: antagonismo sistêmico; não é intrinsecamente maligno, segue ordens incompatíveis.

Facções: Docas Livres (comércio e autonomia), Farol (ciência e transparência), Frota de Ferro (segurança pelo controle). Reputação por facção -100 a +100, limites -50 hostil, -20 desconfiado, +25 aliado, +60 benefícios; decisões alteram preços, diálogos e rotas, nunca tornam a campanha impossível. Existe rota alternativa se NPC morrer ou não for recrutado (registro, substituto ou terminal).

Finais: **Terra de Todos** — rede distribuída, provas reveladas e comunidade livre; **Ordem das Marés** — centralizar o controle para estabilizar mais rapidamente, com custo político; **Oceano Livre** — desligar Atlas, salvar comunidades sem apostar na recuperação continental. Escolha final explícita; condições modificam epílogos e variantes, não bloqueiam o acesso ao final. Depois dos créditos, escolher continuar mundo com consequências ou iniciar nova campanha. Cenas curtas in-engine: despertar, sinal, chegada a Porto, revelação Atlas, ruptura da frota, decisão e epílogo. Diálogos legendados e puláveis; replay em diário.

## 3. Loop e controles
A cada sessão: avaliar água/comida/danos → recolher resíduos, pescar e fabricar → consultar rádio/carta → escolher missão e rota → explorar, lutar, negociar ou resgatar → retornar, descarregar e pesquisar → melhorar barco → salvar. Ciclo de curto prazo 30–90 s, expedição 10–25 min, capítulo 2–4 h como alvo; atividades podem se sobrepor. Primeiros 10 min: coletar, fabricar gancho, purificar água, reparar, expandir e captar SOS. Tutorial contextual e repetível.

PC: WASD, mouse, espaço, Shift, Ctrl, E interagir, F usar ferramenta contextual, R recarregar/rotacionar, B construir, I inventário, M mapa, J diário, V câmera, Esc menu; controles remapeáveis. Controle: sticks, gatilhos, botões contextuais, menu radial. Mobile: joystick esquerdo, área de olhar à direita, ação contextual, salto/mergulho, atacar, barra rápida, botões maiores e ajuste de sensibilidade. Assistência de mira opcional e coleta por toque. Sem inclinação obrigatória. Em coop Esc não pausa mundo; solo pausa se seguro e configurações permitem.

## 4. Mundo e navegação
Mundo em setores de 128 m, seed por campanha. Biomas e marés controlam spawn e loot. Pontos narrativos são fixados no mapa lógico; ilhas genéricas são procedurais, e estados persistentes são deltas por setor. Não regenerar baús únicos, NPCs resgatados ou portões abertos. Oceano sem borda abrupta; correntes levam de volta à faixa útil, sem bloquear o jogador. Origem flutuante para evitar precisão ruim; coordenadas globais lógicas inteiras por setor, posição local para render. Bússola, mapa com neblina, radar, sonar e GPS progressivos. Marcadores customizados e rota automática só com piloto automático desbloqueado. Sinais de história não dependem de sorte; ilha perdida pode ser reencontrada.

Biomas na ordem da história: Mar dos Destroços, Arquipélago Verde, Recifes de Vidro, Porto da Esperança, Cemitério Naval, Selva Salgada, Cinturão de Tempestades, Cidade Afogada, Mar de Cinzas, Fronteira de Gelo, Abismo Atlas, Horizonte. Cada região tem rota direta e 1–2 alternativas por clima/reputação, refúgio e recursos exclusivos. Jangada ancorada permite explorar; bote auxiliar e sinal de retorno evitam ficar preso. Separação máxima cooperativa inicial 250 m do centro da embarcação; aumentar apenas após medir streaming; missão pode deslocar o centro para zona instanciada compartilhada após consentimento. Não teleportar sem aviso e opção de retorno.

## 5. Campanha, missões e chefes
IDs estáveis `M01–M60` e `S001–S120`. Missões abaixo são a lista autoral completa em nível de design. Cada missão deve receber dados de gatilho, condições, recompensa, diálogo, waypoints, falha recuperável e flags antes de implementação. Principais obrigatórias em ordem dentro de cada capítulo, secundárias destravadas ao descobrir NPC/local; falha de escolta, perda de item ou derrota reabre tentativa, sem softlock. Recompensas principais: recursos, blueprint indicado, XP e reputação. Secundárias: créditos, receita, cosmético ou reputação de acordo com o tipo. Objetivos principais se completam uma vez por mundo; recompensas pessoais uma vez por participante/ID. Recompensas narrativas de mundo não duplicam.

### Capítulo 1 — À deriva | Mar dos Destroços
**Objetivo:** aprender a sobreviver. Desbloqueia vela, cama, rádio básico e âncora.
- M01 Sobreviver ao despertar — recolher 8 madeiras e 4 plásticos, fabricar gancho.
- M02 Água é vida — fabricar purificador e produzir 3 porções.
- M03 O primeiro abrigo — ampliar para 9 fundações, reparar e colocar cama.
- M04 Voz no rádio — recuperar bateria e antena de um destroço; sintonizar Lia.
- M05 O predador — defender a jangada de Mandíbula Branca, reparar danos e obter carta verde.
**Secundárias:** S001 pescado do dia (pescar 3 peixes); S002 rede inicial (capturar 10 detritos); S003 mesa seca (construir cobertura); S004 diário perdido (recuperar página); S005 sinal vermelho (investigar boia); S006 primeira horta (plantar e colher); S007 nó resistente (fabricar 5 cordas); S008 baú à deriva (resgatar caixa); S009 água para Lia (entregar 3 porções); S010 noite tranquila (iluminar e descansar).
**Chefe B01 Mandíbula Branca:** tubarão gigante, círculos sinalizam mordida, segunda fase ataca fundações externas; distração por isca e defesa com lança. Vitória por afastamento ou dano; recompensa: reforço de borda. Checkpoint antes da defesa; carta não pode afundar.

### Capítulo 2 — Terra entre as ondas | Arquipélago Verde
**Objetivo:** exploração terrestre e agricultura. Desbloqueia machado, bancada, coleta de chuva.
- M06 Primeira terra — ancorar e encontrar nascente.
- M07 Sementes do futuro — localizar Bento e recuperar estoque agrícola.
- M08 Caminho de pedra — abrir trilha e recuperar três amostras minerais.
- M09 Farol mudo — reparar gerador e apontar lente para o mar.
- M10 Guardião da mata — superar o javali Colosso, recuperar carta dos recifes.
**Secundárias:** S011 frutas raras (3 tipos); S012 abrigo de Bento (reparar telhado); S013 trilha antiga (mapear 3 marcos); S014 ninho de aves (observar sem destruir); S015 fonte contaminada (filtrar água); S016 kit de lenhador (entregar machado); S017 caverna verde (achar saída alternativa); S018 resgate na encosta (guiar náufrago); S019 chuva armazenada (encher coletor); S020 flor da ilha (entregar amostra).
**B02 Colosso Verde:** investidas previsíveis, segunda fase rompe obstáculos, usar rochas para esquiva; alternativa acalmar com rota de fuga e alimento. Recompensa: ferramentas resistentes.

### Capítulo 3 — O fundo chama | Recifes de Vidro
**Objetivo:** mergulho, metal e rotas de corrente. Desbloqueia nadadeiras, tanque básico, sonar.
- M11 Sob a superfície — fabricar equipamento de mergulho e coletar minério raso.
- M12 Sinal submerso — localizar transmissor por sonar.
- M13 O navio das caixas — abrir compartimentos e recuperar fusíveis.
- M14 O túnel coral — restaurar estação de ar e alcançar saída.
- M15 Guardiã das fendas — enfrentar ou distrair a Moreia Rubra e recuperar transponder do Porto.
**Secundárias:** S021 catálogo coral (fotografar 5 espécies); S022 pérolas (coletar 3); S023 rede fantasma (remover rede); S024 diário do capitão (recuperar registro); S025 cilindro perdido (recuperar peça); S026 cardume raro (catalogar); S027 metal profundo (entregar 6 minérios); S028 mergulho seguro (marcar ponto de ar); S029 baú de vidro (abrir enigma); S030 rota de boias (instalar 3 marcas).
**B03 Moreia Rubra:** alterna fendas, onda elétrica ficcional telegrafada; usar zonas isoladas e oxigênio de emergência. Recompensa: compressor e traje reforçado.

### Capítulo 4 — Porto da Esperança | Cidade flutuante
**Objetivo:** comunidade, comércio e reputação. Desbloqueia doca, enfermaria, motor I.
- M16 Chegada ao Porto — registrar embarcação e conhecer Ivo.
- M17 Fome coletiva — abastecer cozinha comunitária.
- M18 A enfermaria — resgatar Caio e entregar medicamento.
- M19 Acordo das águas — investigar sumiço de carga, escolher acordo comercial.
- M20 Cerco às Docas — repelir capitânia Ferrugem e proteger três plataformas.
**Secundárias:** S031 comerciantes (entregar carga); S032 pescadores perdidos (guiar bote); S033 iluminação pública (reparar 3 luminárias); S034 cozinha do Porto (servir 5 refeições); S035 criança perdida (seguir pistas); S036 oficina solidária (repor ferramentas); S037 mapa comunitário (marcar docas); S038 mediação (resolver disputa); S039 contrabando (devolver ou denunciar carga); S040 festival das luzes (decorar cais).
**B04 Capitânia Ferrugem:** barco hostil com pontos fracos, ondas de abordagens; proteger docas, negociar retirada com reputação ou vencer. Recompensa: motor e contrato de escolta.

### Capítulo 5 — Fantasmas de aço | Cemitério Naval
**Objetivo:** sucata avançada e eletricidade. Desbloqueia painéis solares, baterias, casco metálico.
- M21 Mar de aço — navegar corredor de cascos e localizar guindaste.
- M22 Energia antiga — recuperar inversor e esquema elétrico.
- M23 Caixa-preta — restaurar terminal e ler registros Atlas.
- M24 O caminho do óleo — recuperar componentes para refino ficcional e fechar vazamentos.
- M25 Titã de Sucata — desativar máquina de salvamento e retirar núcleo.
**Secundárias:** S041 aço reciclado (10 unidades); S042 cabos cortados (reconectar); S043 cápsula de emergência (abrir e resgatar); S044 mini-guindaste (reparar); S045 armário do mecânico (recuperar kit); S046 rádio da frota (ouvir arquivos); S047 luzes de convés (instalar); S048 corredor seguro (marcar passagem); S049 vazamento (coletar resíduos); S050 sinos do navio (resolver sinais).
**B05 Titã de Sucata:** máquina magnética ficcional, evita feixes e interrompe três relés expostos, fase final de emergência. Recompensa: automação de coleta.

### Capítulo 6 — A selva que bebe o mar | Selva Salgada
**Objetivo:** ecologia, remédios, agricultura avançada. Desbloqueia estufa, dessalinizador elétrico, compostagem.
- M26 Raízes vivas — localizar mangue e amostrar solo.
- M27 Febre salina — preparar antídoto ficcional com Caio.
- M28 Água para todos — restaurar estação de filtragem.
- M29 O arquivo das sementes — recuperar três bancos de sementes e escolher distribuição.
- M30 A Mãe do Mangue — resolver invasão de habitat, recuperar mapa das tempestades.
**Secundárias:** S051 fungo luminoso (amostrar); S052 terreno fértil (recuperar canteiro); S053 larvas no filtro (limpar equipamento); S054 pássaro ferido (resgatar); S055 viveiro (cultivar mudas); S056 observatório (ligar sensor); S057 trilha inundada (construir passagem temporária); S058 poções (testar receita ficcional); S059 grãos resistentes (colher); S060 bióloga isolada (escoltar).
**B06 Mãe do Mangue:** criatura territorial, ataques em áreas marcadas, fase de filhotes; rota pacífica por retirada de dispositivos invasores. Recompensa: estufa avançada.

### Capítulo 7 — A grande tempestade | Cinturão de Tempestades
**Objetivo:** clima extremo e navegação avançada. Desbloqueia radar meteorológico, motor II, casco reforçado.
- M31 Previsão impossível — recrutar Nara, instalar estação meteorológica.
- M32 Rota do trovão — ativar 3 boias de previsão.
- M33 O barco desaparecido — localizar e rebocar embarcação aliada.
- M34 O olho da tormenta — atravessar corredor climático, equilibrar sistemas e vedar casco.
- M35 Leviatã da Tormenta — sobreviver ao encontro, obter rota à cidade afogada.
**Secundárias:** S061 para-raios (instalar); S062 rede de socorro (reparar antena); S063 carga pesada (redistribuir peso); S064 ondas de teste (validar reforço); S065 bandeira de resgate (encontrar bote); S066 óleo de reserva (abastecer); S067 vigia (registrar nuvens); S068 faroleiro (reparar luz); S069 gerador reserva (fabricar); S070 flutuadores perdidos (recuperar 4).
**B07 Leviatã da Tormenta:** perseguição, ondas telegrafadas, janelas de reparo; vitória por chegar ao olho seguro, sem matar. Recompensa: radar de longo alcance.

### Capítulo 8 — A cidade que dorme | Cidade Afogada
**Objetivo:** investigação e mergulho profundo. Desbloqueia traje profundo, drone de exploração e scanner.
- M36 Ruas submarinas — mapear acesso à estação urbana.
- M37 Elevador sem céu — religar elevador e criar bolsão de ar.
- M38 Memórias de Atlas — recuperar três registros sobre a catástrofe.
- M39 O último apartamento — localizar Suri e evacuar sobreviventes.
- M40 Sentinela de Vidro — interromper defesa automatizada e obter chave Atlas A.
**Secundárias:** S071 estação de metrô (mapear); S072 biblioteca seca (recuperar livros); S073 fotos de família (devolver); S074 elevador travado (reparar); S075 placa histórica (registrar); S076 hospital submerso (recuperar kit); S077 museu perdido (catalogar); S078 praça silenciosa (sondar); S079 correio antigo (entregar mensagem); S080 gerador do abrigo (religar).
**B08 Sentinela de Vidro:** drone gigante alterna zonas inundadas e escudos; desativar três fontes por puzzle, finalizar pelo painel. Recompensa: chave A e drone leve.

### Capítulo 9 — O preço da liberdade | Mar de Cinzas
**Objetivo:** conflito de facções, navegação entre instalações industriais. Desbloqueia comércio remoto, blindagem avançada e ferramentas de defesa.
- M41 Frota em alerta — encontrar emissário de Varga.
- M42 Verdades roubadas — reunir evidências em dois postos.
- M43 A escolha do comboio — escoltar civis por rota discreta ou negociar passagem.
- M44 A assembleia — escolher aliança provisória ou neutralidade com alternativa de suprimentos.
- M45 O Almirante de Ferro — enfrentar, convencer ou contornar a capitânia e obter chave B.
**Secundárias:** S081 civis encurralados (evacuar); S082 rádio livre (difundir registro); S083 depósito saqueado (recuperar caixa); S084 comida na fronteira (entregar); S085 reféns (negociar passagem); S086 trégua (mediar); S087 mecânicos desertores (recrutar); S088 boia de paz (ativar); S089 mapa de rotas (reconhecer); S090 carta de Varga (entregar).
**B09 Almirante de Ferro:** perseguição e defesa de comboio, pontos de reparo, opção de trégua por evidências. Recompensa: chave B e blindagem.

### Capítulo 10 — Onde o mar congela | Fronteira de Gelo
**Objetivo:** frio, sobrevivência e energia térmica. Desbloqueia isolamento, aquecedor e motor III.
- M46 Além da linha branca — instalar aquecimento e atingir abrigo.
- M47 Ecos no gelo — localizar estação polar.
- M48 Gerador congelado — religar três circuitos com energia reserva.
- M49 O último cientista — resgatar especialista e obter instruções da chave C.
- M50 O Gigante Glacial — atravessar área do animal colossal ou atraí-lo para longe, obter chave C.
**Secundárias:** S091 cobertores (entregar); S092 combustível térmico (repor); S093 medição de gelo (mapear); S094 caixa no iceberg (recuperar); S095 pinguins (catalogar); S096 laboratório frio (restaurar); S097 cesta polar (cozinhar); S098 abrigo secundário (reparar); S099 rota de degelo (marcar); S100 registros meteorológicos (recuperar).
**B10 Gigante Glacial:** investidas, gelo quebradiço e refúgios, clímax de fuga ou distração; recompensa: chave C e isolamento máximo.

### Capítulo 11 — O coração de Atlas | Abismo Atlas
**Objetivo:** revelar a origem do desastre. Desbloqueia energia Atlas limitada e scanner profundo.
- M51 Três chaves — abrir estação com A/B/C e acessar navegação profunda.
- M52 Pressão máxima — chegar à plataforma abissal com traje e rota de emergência.
- M53 A verdade — acessar arquivo, decidir compartilhar imediatamente ou esperar evacuação.
- M54 A evacuação — religar comportas e retirar equipe antes da falha.
- M55 Kraken Mecânico — interromper braços de manutenção, desativar núcleo hostil e obter protocolo Horizonte.
**Secundárias:** S101 sonda perdida (resgatar); S102 sinais abissais (catalogar); S103 cápsula científica (recuperar); S104 cabos antigos (religar); S105 estação de ar (reparar); S106 espécime luminoso (observar); S107 arquivo secreto (ler); S108 dados duplicados (entregar cópia); S109 resgate remoto (guiar drone); S110 válvula de segurança (testar).
**B11 Kraken Mecânico:** 3 fases, braços com avisos, relés acessíveis e fuga de pressão; recompensa: protocolo Horizonte. Sem quebra de equipamento essencial permanente.

### Capítulo 12 — O último horizonte | Horizonte
**Objetivo:** conclusão, escolha e futuro do mundo.
- M56 O sinal verdadeiro — localizar estação Horizonte e preparar travessia.
- M57 A última frota — convocar aliados disponíveis ou contratar ajuda neutra.
- M58 Salvar antes de escolher — evacuar comunidades em três setores.
- M59 ÍRIS — superar defesa final, resolver contradição de ordens e abrir controle.
- M60 O mundo depois — decidir Terra de Todos, Ordem das Marés ou Oceano Livre; epílogo e mundo pós-campanha.
**Secundárias:** S111 cartas para o futuro (entregar); S112 memorial (construir); S113 banco de sementes final (reunir); S114 abrigo provisório (montar); S115 travessia civil (escoltar); S116 transmissão mundial (religar); S117 reencontro (localizar NPC); S118 mapa do amanhã (cartografar); S119 provisões finais (abastecer); S120 última promessa (concluir arco de aliado).
**B12 ÍRIS/Horizonte:** defesa em três estágios: salvar setores, desligar relés, estabilizar painel; opção de solução por diálogo após provas. Derrota retoma checkpoint seguro antes do estágio inicial do encontro. Recompensa: escolha final, cosmético e contratos de fim de jogo.

## 6. Contratos dinâmicos (40 modelos)
Disponíveis no rádio/porto, 1–3 ativos simultâneos, seed e cooldown de 1–3 dias de jogo, escalados por bioma e reputação. Nunca substituem missão narrativa. Recompensa por tempo/risco, sem permitir farm infinito por cancelamento. Objetivos têm validação do host, local alcançável e falha recuperável.
- Coleta: C01 madeira; C02 plástico; C03 sucata; C04 minério; C05 fibra; C06 coral solto; C07 algas; C08 sementes.
- Produção: C09 água; C10 refeições; C11 cordas; C12 reparos; C13 baterias; C14 tecidos; C15 filtros; C16 medicamentos ficcionais.
- Exploração: C17 mapear ilha; C18 sondar destroço; C19 localizar boia; C20 registrar espécie; C21 fotografar ruína; C22 rastrear sinal; C23 mapear corrente; C24 recuperar diário.
- Resgate/comércio: C25 náufrago; C26 bote; C27 escolta; C28 reboque; C29 entrega urgente; C30 suprir enfermaria; C31 evacuar posto; C32 achar carga extraviada.
- Crises/defesa: C33 reparar doca; C34 expulsar predador; C35 defender comboio; C36 desativar drone; C37 limpar vazamento; C38 resistir tempestade; C39 restaurar farol; C40 investigar sinal fantasma.

## 7. Sobrevivência, combate e economia
Vida, fome, sede, energia, oxigênio e temperatura, escalas 0–100. Normal: fome -0,045/s e sede -0,065/s em tempo ativo (ajuste por esforço/clima); a zero, dano gradual com aviso. Energia recuperada por repouso; no solo não acelerar tempo durante risco. Oxigênio inicial 45 s; tanque 120 s, profundo 240 s, com pontos de ar. Temperatura varia por bioma, vestimenta, abrigo. Estados: frio, calor, intoxicação ficcional e sangramento estilizado; todos com cura acessível. Água salina não hidrata; purificação em lotes. Dificuldades história, normal, difícil e permadeath opcional solo. Sem perda total por padrão.

Combate: lança, arco, arpão, ferramentas de defesa e escudo; recarga, alcance, stamina, telegraph de ataques e janelas de esquiva. Inimigos terrestres (javalis, caranguejos, serpentes ficcionais), marinhos (tubarões, moreias, polvos), humanos hostis e drones. IA por estados patrulha/investiga/persegue/ataca/foge/retorna. Host determina dano e drops, limite por zona; corpos comuns removidos após 5 s ou quando loot transferido para bolsa persistente. Chefes por fase, ajustes de vida/ataques por jogadores ativos; alvo inicial HP multiplicador 1+0,55*(n-1), limitar efeitos simultâneos; sem alterar vida retroativamente na desconexão. Loot e objetivo compartilhados conforme regras. Companheiros dão suporte, não completam toda missão sozinhos.

Economia: recursos físicos e créditos comerciais; contratos comuns 10–40 créditos, perigosos 50–150, custos progressivos, venda abaixo da compra. Nenhum recurso essencial só por compra. Preços por reputação (limitar desconto a 20%) e estoque com reposição; economia host-authoritative. 5 especializações sem classes obrigatórias: construtor (reparos), navegador (consumo/rota), mergulhador (oxigênio), biólogo (plantio/medicina), mecânico (energia/automação). XP por objetivos distintos, não por spam; talentos até nível 20, respec no porto. Equipamentos: ferramentas madeira → metal → liga → Atlas; armadura leve, mergulho, térmica; mochila 20 slots, upgrades 28/36/44. Itens comuns stack 20, ferramentas 1, durabilidade reparável. Sistema de inventário com barra de 8 slots, dividir stack, mover tudo, busca, filtros; slots cheios produzem aviso e bolsa, nunca deletam item.

## 8. Construção naval e crafting
Grade de 1 m; snapping, rotação 90°, ghost verde/vermelho, custo e massa visíveis, undo de peça recém-colocada se intacta e sem conteúdo. Fundações, pisos, paredes, tetos, janelas, rampas, escadas, portas, grades, flutuadores, redes coletoras, velas, leme, âncora, motores, cabos, baterias, estufas, camas, enfermaria, cozinha, oficina, baús, placas e móveis. Suporte estrutural por grafo ligado à fundação; não usar rigidbody para cada bloco. Destruição de suporte invalida subgrafo, aviso e queda simplificada. Reembolso ao desmontar 50–75% conforme estado; itens em contêiner exigem esvaziar. Permissões por membro e baú, trava contra griefing.

Evolução: jangada 3×3 → plataforma 7×7 → barco com motor → navio multideck → fortaleza flutuante. Capacidade inicial recomendada 64 fundações mobile / 256 PC, expansão condicionada a benchmark; limites por mundo anunciados na criação e iguais para todos os peers. Máximo provisório 512 fundações no perfil alto. Massa, empuxo e centro de massa aproximados: capacidade por fundação 100 unidades, peças carregam massa; margem <15% alerta; sobrepeso afeta velocidade e inclinação; flutuadores adicionais resolvem. Não fazer simulação naval completa por bloco. A água sobe localmente em compartimentos com danos, bombas removem água, vedação restaura. Incêndios propagam por adjacência com limite de atualização; chuva reduz propagação; extintor e água são ações de jogo. Perda total dá balsa de emergência ou restauração de porto, preservando missões e itens críticos.

Receitas iniciais (unidades, tuning): gancho 3 madeira+2 plástico; corda 2 fibra; fundação 2 madeira+2 plástico; purificador 4 madeira+3 plástico+2 folhas; churrasqueira 4 madeira+2 sucata; lança 5 madeira+2 corda; cama 5 madeira+3 tecido; rede 4 madeira+4 corda+2 sucata; vela 8 tecido+6 madeira+3 corda; âncora 6 pedra+3 corda; bancada 6 madeira+4 sucata; tanque 4 metal+2 borracha+1 válvula; motor I 10 metal+4 sucata+2 engrenagem+1 circuito; painel 6 metal+4 vidro+2 circuito; bateria 4 metal+2 eletrólito ficcional+1 circuito; estufa 8 vidro+6 metal+4 madeira; bomba 6 metal+2 circuito+2 borracha; traje profundo 8 tecido técnico+6 liga+2 válvula; radar 6 metal+4 circuito+1 antena. Receitas orientadas a dados, dependências em DAG e validador de ciclos. Pesquisa por descoberta e missão, não consumir exemplar único narrativo. Bancadas: manual, fundição, eletrônica, cozinha, laboratório, estaleiro.

Energia: rede lógica por componentes conectados; produtores (solar, vento, gerador), baterias, consumidores, prioridade (vida, navegação, conforto). Atualização a 2 Hz, sem física individual de fios. Energia insuficiente desliga baixa prioridade com alerta. Agricultura: água doce, luz, estágios de crescimento; ciclo por timestamp de jogo, não atualizar cada planta a cada frame. NPCs recrutáveis (até 6 inicialmente) podem pescar, cultivar, reparar, cozinhar e vigiar usando fila de tarefas e recursos reais. Sem necessidade de micromanagement permanente; nenhum NPC produz infinitamente sem insumo. Animais de estimação cosméticos e alarmes, sem vantagens obrigatórias.

## 9. Eventos e desastres
Relógio 24 min reais por dia virtual (16 min claro, 8 noite), ajustável. Climas: céu limpo, neblina, chuva, tempestade, frio, calor. Eventos: ataque de tubarão, tempestade elétrica, ondas gigantes, pane de motor, incêndio, vazamento, invasão pirata, epidemia ficcional leve, redemoinho, carga à deriva, resgate SOS e navio mercante. Diretor de eventos com orçamento de ameaça, cooldown, sinais de 20–60 s quando cabível e proteção de tutorial. Não combinar tempestade extrema e chefe fora de encontro planejado. Ondas modificam pose do barco por função analítica e volume de inundação, não simulação de fluido pesada. Dano por estresse, colisões e estado de peça. Recuperação sempre possível por kit de emergência, porto ou checkpoint. Modo história reduz frequência.

## 10. Multiplayer P2P
**Topologia:** estrela, um jogador é host autoritativo, cada convidado tem RTCPeerConnection com o host. Solo utiliza a mesma interface de comandos localmente. WebRTC DataChannel transporta dados; ICE/STUN tentam conexão direta, TURN retransmite quando necessário. GitHub Pages serve cliente estático HTTPS; não é servidor de sinalização, armazenamento remoto ou TURN. Sinalização por pequeno serviço externo WSS com salas efêmeras, código aleatório e expiração, tokens de convite; alternativa manual oferta/resposta para diagnóstico, não experiência padrão. TURN tem custo/banda e deve ser configurado com credenciais temporárias; nunca embutir segredo de longo prazo no JS. Sem contas obrigatórias inicialmente. Não prometer conexão universal sem infraestrutura.

**Fluxo:** Criar mundo → host escolhe seed/dificuldade/permissões → código/link de convite → amigo entra → autenticação de sala/versão → negociação SDP/ICE → snapshot inicial → ACK → spawn na cama/convés seguro → sincronização contínua. Lobby mostra jogadores, ping, estado direto/relay, pronto, expulsar, modo amigos/convidados. Join-in-progress recebe manifest e chunks de snapshot; não liberar comandos antes do ACK. Reentrada por token local revogável; sala expira ao fechar host. Sem servidor permanente, mundo offline quando host sai.

**Simulação:** host tick fixo 20 Hz, snapshots 10–15 Hz, cliente render 30/60 fps, interpolação remota 100–150 ms, previsão local e reconciliação para movimento; posição local ao barco para evitar deslizamento visual. Comandos contêm sessão, versão, playerId autorizado, seq, tick, actionId, payload limitado. Eventos confiáveis ordenados (inventário, crafting, bloco, missão, dano, save, chat); canal de movimento não ordenado e sem retransmissão (maxRetransmits=0), descartar snapshots antigos. Enviar apenas deltas/entidades próximas, heartbeat 2 s e detectar ausência ~10 s ajustável. Chunk confiável de até 16 KiB, limites de mensagem, backpressure via bufferedAmount, reenvio e hash do snapshot. Alvos de banda por cliente 20–60 KB/s, medir no perfil de 4 jogadores e conexão relay.

**Consistência:** host verifica propriedade, distância, cooldown, receita, custo, linha de visão quando relevante, saldo e permissão. ActionId idempotente, transação atômica de consumo+produção, revision de inventário e entidade; se dois pegam a mesma caixa, só a primeira ação válida recebe. Sem confiar em posição, dano, dinheiro ou conclusão enviados pelo cliente. Rate limit, tamanho/schema de mensagens, IDs autorizados, sanitização do chat, sem HTML arbitrário. Host pode modificar mundo por ser dono: não é anticheat competitivo. DTLS protege transporte, mas convidados podem ver endereços de conexão direta; opção relay-only para privacidade com custo de banda. Chat textual e pings na v1; voz opcional posterior com consentimento e mute.

**Desconexão:** convidado sai → host salva inventário/posição, avatar removido após timeout, reconecta por token e recebe snapshot/deltas; se KO, reentra em local seguro com estado de morte preservado. Host planeja saída → checkpoint confirmado e transferência voluntária para peer eleito com snapshot, epoch incrementado, novo convite e confirmação; mundo só retoma após concordância. Queda abrupta: peers mantêm último snapshot replicado verificado (meta a cada 60–120 s); usuário pode promover cópia explicitamente, criar nova sala, aceitar possível perda desde último snapshot. Sem eleição silenciosa que crie mundos divergentes; epoch/worldId e dono confirmam autoridade. Migração automática é fase experimental, não requisito para MVP. Export/import de mundo para troca manual garantida primeiro. Nenhuma promessa de persistência sem host ou armazenamento externo.

**Missões em grupo:** progresso compartilhado por mundo, voto de história com maioria dos presentes e desempate explícito do host, registro de decisão. Participante que chega depois recebe diário e pode repetir diálogo; não duplica recompensa global. Objetivos de coleta distinguem total compartilhado e pessoal. Modo solo permite NPC/controle alternativo. Friendly fire desativado, coop revive por 15 s após queda (janela de 60 s); sem respawn instantâneo em boss. Limite inicial de 4 testado em redes diferentes; 8 só depois de CPU/banda e usabilidade aprovados.

## 11. Saves, checkpoints e recuperação
IndexedDB como armazenamento primário, localStorage apenas preferências. Save versionado: worldId, seed, schemaVersion, buildVersion, epoch, tick, relógio, RNG de eventos, coordenadas, barco/peças/HP/energia, diffs regionais, inventários com IDs, personagens, NPCs/reputação, missão/objetivos/flags, recompensas reclamadas, eventos, configurações e journal. Não salvar mesh/textura; recriar por catálogo. Migrações testadas N-1 → N, falha preserva backup e oferece export. Salvar em transação; hash detecta corrupção acidental, não comprova autenticidade. Dois slots rotativos A/B, 3 snapshots de checkpoint, backup manual separado, export/import JSON ou binário compactado com limite e validação; importar com confirmação sem sobrescrever mundo por padrão.

Autosave a cada 90 s quando seguro, em missão concluída, entrada/saída de região, ancoragem em porto, fabricação de marco e saída voluntária. Se em combate ou durante transação, guardar snapshot consistente e adiar checkpoint de respawn até zona segura. Save de encerramento não pode depender de evento de fechamento do navegador. Checkpoint antes de cada chefe e ao finalizar; no capítulo 12 antes da escolha final. Camas ativam respawn se estrutura válida; porto/boia é fallback; se jangada destruída gerar balsa mínima de recuperação em local alcançável. Morte solo normal: perder 20% de itens comuns carregados em bolsa recuperável (expira 20 min de jogo ativo), ferramentas equipadas e chaves protegidas, HP 50/fome+sede 35 ao renascer. História sem perda; difícil aumenta penalidade. Coop: revive ou respawn individual, nunca reverter o progresso do grupo automaticamente. Wipe em boss reinicia encontro sem duplicar loot ou desfazer missões já concluídas; restaurar consumíveis de tentativa conforme snapshot de combate isolado, não inventário global. Rollback completo somente decisão explícita do host e aviso a todos.

## 12. Interface, arte, áudio e acessibilidade
Menu: continuar, novo mundo, criar sala, entrar por código, saves/exportar, opções, créditos. HUD: vida/fome/sede/energia, oxigênio contextual, temperatura contextual, bússola, objetivos fixáveis, barra rápida, ícones de dano/energia, estado P2P, indicador de save. Inventário/estaleiro/mapa/diário/tecnologia/reputação em abas. Diário lista capítulos, objetivos, recompensas e pistas; minimapa opcional; radar de baixo consumo. Modo construção com custo, apoio e peso; tutorial reabrível; confirmação destrutiva. Acessibilidade: escala de HUD, remapeamento, legendas, contraste, ícones além de cor, redução de flashes e balanço de câmera, FOV, hold/toggle, auto-coleta opcional. PT-BR inicial, strings externalizadas para EN/ES.

Arte: formas estilizadas, oceano turquesa/azul, madeira envelhecida, coral, ruínas industriais; silhuetas distintas de regiões. GLB/GLTF para personagens e objetos; animações idle/andar/correr/nadar/mergulhar/ataque/dano/KO/revive/reparo, skeleton consistente, LOD. Texturas WEBP e KTX2 quando pipeline suportar; atlas para peças, sombras baked/projetadas leves; shader de água com normal map, Fresnel, espuma por distância, reflexão aproximada e opção sem reflexo. Céu procedural simples ou cubemap leve. Sons de onda, vento, chuva, rangido, pássaros, motor, impacto, rádio, oxigênio; mixer master/música/SFX/voz, loops por bioma, música dinâmica por ameaça. Sem assets ou músicas copiados de Raft.

## 13. Arquitetura técnica e desempenho
Frontend Three.js ESM, Vite build, TypeScript recomendado (ou JS modular com JSDoc). WebGL2, fallback claro para GPU sem suporte, sem exigir WebGPU. GameForge: importar somente módulos confirmados (entrada, câmera, estados, pool, GLB, save, HUD, missões), adaptar via interfaces; não assumir que possui esses sistemas. Separar simulação/render/transporte; host headless lógico possível para testes sem DOM.

Estrutura proposta:
```
src/core/{GameLoop,Clock,EventBus,Registry,SeededRng}
src/world/{SectorManager,Ocean,Weather,Navigation,OriginShift}
src/raft/{Grid,StructureGraph,Buoyancy,Damage,Power,Construction}
src/player/{Controller,Swim,Inventory,Combat,Survival,Skills}
src/ai/{Director,Creature,Npc,BossController,TaskQueue}
src/quests/{QuestEngine,Conditions,Rewards,Dialogue,Reputation}
src/net/{Transport,LocalTransport,WebRTCTransport,HostAuthority,Protocol,Snapshot,Reconnect}
src/save/{Store,Migrations,Checkpoints,Export}
src/ui/{Menu,Lobby,HUD,Build,Journal,Map,Options}
src/data/{items,recipes,regions,quests,bosses,contracts,dialogues}
public/assets/{models,textures,audio}
services/signaling/   # implantação separada do site
tests/{unit,integration,network,e2e,perf}
docs/{GDD,CHECKPOINTS,ADR,CHANGELOG}
```
Modelo missão: `{id,chapter,requires,trigger,objectives:[{kind,target,count,scope}],onComplete,rewards,checkpoint,failPolicy}`; estados LOCKED, AVAILABLE, ACTIVE, COMPLETED, FAILED_RETRY. Eventos `itemCollected`, `crafted`, `regionEntered`, `npcRescued`, `bossResolved`, `dialogueChoice`, `structurePlaced`; engine idempotente. Validador de dados: IDs únicos, referências existentes, DAG de dependências, toda missão tem condição de conclusão e rota de recuperação. Bosses declarativos: fases, triggers, ataques, sinais, cooldown, rewardId. Mundo: chunk estático seed + delta; persistir só alterações relevantes. Physics: cápsula jogador e colisão AABB/OBB de barco e cenário; broadphase grade; colisão em espaço local do barco; água altura analítica. Navegação NPC em grafo de convés e pontos de interesse, não navmesh gigante. Worker opcional para geração/compactação, sem mover render sem necessidade.

Orçamentos iniciais a medir: mobile 30 fps p95 frame ≤33,3 ms, PC 60 fps p95 ≤16,7 ms em hardware de referência documentado; modo baixo 720p/dynamic resolution, limitar DPR 1–1,5 mobile; PC ajustável. 100–180 draw calls mobile/300 PC como alvo, ~150k/500k triângulos visíveis, 40/100 entidades dinâmicas ativas por zona, 1 luz direcional, sombras 512–1024 mobile, 2048 PC opcional. InstancedMesh para módulos, árvores e detritos; geometria merge por chunk; LOD; frustum/distance culling; pool de partículas e loot; atualizar IA distante a 1–2 Hz, física ativa 20–30 Hz, render independente. Água usa malha em anéis centrada na câmera e simulação comum no host. Ilhas carregadas por raio de 2–3 setores; unload após histerese; cancelar downloads obsoletos e dispose com contagem de referências. Assets iniciais meta ≤15 MB transferidos, modelos individuais preferencialmente 0,2–5 MB, maiores só após profiling; demais por região e cache versionado. Não carregar todas as 12 regiões ao iniciar. Perfil baixo sem reflexos dinâmicos, água simplificada, densidade reduzida, sombras projetadas. Perf: coletar p50/p95 fps/frame, memória JS quando disponível, draw calls, ping, RTT, jitter e banda; testes de 30 min e memória após 10 transições. Não declarar metas atingidas sem medição.

## 14. Roadmap de implementação e gates de checkpoints
Cada CP entrega build testável e commit isolado, docs/CHECKPOINTS.md atualizados com status PENDENTE/EM TESTE/APROVADO, commit hash, cenário de teste, métricas e pendências. Só aprovar após critérios. Branch de trabalho, PR, CI, merge main e Pages após smoke test; nunca afirmar publicado sem verificar. Dependências em ordem, regressão do CP anterior. Planejamento sem prazos fixos até conhecer recursos.

| CP | Entrega | Critério de aceitação |
|---|---|---|
| CP00 | Bootstrap e auditoria GameForge | Build limpo, catálogo de módulos reais, ADR, página inicial abre por subpath |
| CP01 | Oceano e controlador | Andar, nadar, saltar, câmera, colisão e retorno ao barco; sem cair pelo chão |
| CP02 | Coleta e inventário | Gancho, loot, stack, barra rápida e transação sem duplicação |
| CP03 | Crafting e sobrevivência | Purificar, comer, pescar, fome/sede e HUD; 15 min jogáveis |
| CP04 | Construção e flutuação | Expandir 3×3→7×7, demolir, validar apoio, âncora e massa |
| CP05 | Saves e respawn | Recarregar, corromper slot A e recuperar B, morte e balsa fallback |
| CP06 | Transporte P2P base | Dois navegadores/redes, convite, direto/relay quando configurado, desconectar e voltar |
| CP07 | Autoridade e coop | 4 jogadores, inventário simultâneo, construção e combate sem dupe; solo continua funcional |
| CP08 | Missões, rádio e tutorial | M01–M05 e S001–S010 completáveis solo/coop, B01 e checkpoints |
| CP09 | Streaming e biomas | 3 setores ativos por raio conforme perfil, 10 transições sem crescimento contínuo de memória |
| CP10 | Capítulos 2–3 | M06–15/S011–030, ilha, mergulho, B02–03, oxigênio e retorno |
| CP11 | Capítulo 4, NPCs e comércio | M16–20/S031–040, B04, porto, reputação e recrutamento |
| CP12 | Capítulos 5–6 | M21–30/S041–060, B05–06, energia, agricultura, automação |
| CP13 | Clima, danos e capítulo 7 | M31–35/S061–070, B07, tempestade, reparo, incêndio, naufrágio recuperável |
| CP14 | Capítulo 8 | M36–40/S071–080, B08, exploração profunda e arquivos |
| CP15 | Capítulo 9 | M41–45/S081–090, B09, facções, escolta, rotas alternativas |
| CP16 | Capítulo 10 | M46–50/S091–100, B10, frio e energia térmica |
| CP17 | Capítulos 11–12 | M51–60/S101–120, B11–12, 3 finais e epílogo |
| CP18 | Contratos e endgame | C01–C40, cooldown, pós-campanha, mundo persistente |
| CP19 | P2P avançado | Export/import entre hosts, join-in-progress, rejoin, transferência voluntária; protótipo de crash recovery |
| CP20 | Polimento e mobile | UI touch, gamepad, áudio, acessibilidade, profiling e orçamento de assets |
| CP21 | QA e release | 60/120/40 IDs validados, 12 bosses, 3 finais, campanha solo e coop 4, save/migração, Pages e serviços externos documentados |
| CP22 | Expansão opcional 8 peers | Teste 60 min com 8, banda/CPU dentro da meta documentada; se falhar mantém limite 4 |

**Checkpoint de retomada inicial:** CP00 PENDENTE. Próxima ação concreta: inspecionar GameForge e criar scaffold de build, core loop, catálogo de dados, testes e README. Nenhum CP marcado aprovado neste GDD.

## 15. QA, release e riscos
Testes unitários: inventário atômico, receita, grafo de suporte, seed, missão idempotente, economia, estado de boss, serialização, migração e import malformado. Integração: join/rejoin, perda de pacotes, RTT 50/150/300 ms, jitter 30 ms, perda 1/5%, host/cliente saindo, ação duplicada/reordenada, versão incompatível, snapshot grande, troca de aba, duas pessoas pegando o mesmo item, construção e remoção simultânea, morte de host durante boss. E2E: campanha completa solo e 4 peers, 3 finais, 120 secundárias e 40 modelos de contratos ao menos uma vez (automatizar condições e smoke humano), nenhum bloqueio por NPC perdido, missões em progresso após reload. Mobile real Android/iOS e PC Chrome/Edge/Firefox, Safari quando suportado; rede doméstica, móvel, NAT restritiva com TURN. Testar navegação por gamepad, touch e teclado. CI lint, typecheck, unit, build, smoke em servidor com base path Pages. Relatório de testes com resultados reais, não simular aprovação.

Critérios de release: não perder save confirmado; nenhum crash crítico conhecido, nenhuma duplicação de recompensa ou item em cenários testados; reconexão documentada, mensagens úteis se TURN/sinalização indisponíveis; história terminável em solo e coop; performance medida em hardware de referência e perfil baixo com 30 fps alvo. Riscos: escopo de 180 missões (conteúdo data-driven, vertical slice antes de ampliar), P2P NAT (TURN e testes), host desconfiável (coop privado), física naval pesada (aproximações), mobile memória (streaming/LOD), drift de saves (versionamento/backup), morte/softlock (fallback), hospedagem estática (sinalização externa), direitos autorais (assets próprios/licenciados). Telemetria somente opt-in, sem enviar saves/dados pessoais por padrão. Repositório e licenças de assets registrados; sem chaves no GitHub.

## 16. Fontes técnicas e referência
- Raft, página oficial Steam: https://store.steampowered.com/app/648800/RAFT/ — referência de gênero, não copiar conteúdo.
- WebRTC peer connections: https://webrtc.org/getting-started/peer-connections — sinalização e ICE/STUN/TURN.
- MDN Data channels: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels — transporte de dados e criptografia DTLS.
- MDN WebRTC protocols: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Protocols — negociação e conectividade.

**Nota de escopo:** o documento define o jogo completo como projeto de design. Missões, valores, arquitetura e checkpoints são especificações propostas; não foram construídos, testados ou publicados nesta etapa. O nome é provisório e não foi verificado para registro de marca. GameForge não foi auditado nesta tarefa. As estimativas devem ser validadas com protótipos.