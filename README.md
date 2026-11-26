# Maré Perdida: O Último Horizonte (Vertical Slice)

Protótipo jogável 3D em navegador (Three.js + TypeScript + Vite) baseado no `GDD_Mare_Perdida_v1.0.md`, cobrindo o núcleo de sobrevivência, construção naval, saves IndexedDB e Capítulo 1 (*Mar dos Destroços*).

[Jogar Maré Perdida](https://jogoiarexx-blip.github.io/mare-perdida/)

## Publicação

O workflow executa os testes, compila o jogo e publica `dist/` a cada envio para `main`. Com **GitHub Actions** como fonte em **Settings → Pages**, há um único processo de publicação. Se o Pages publicar pela raiz de `main`, `index.html` encaminha para o build versionado em `dist/`. Nesse modo, inclua o `dist/` atualizado ao enviar alterações do jogo.

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

**Âncora:** novos mundos começam à deriva, sem âncora instalada. Colete 2 sucatas e fabrique 1 corda, abra o menu B e posicione a âncora sobre uma fundação. Use H ou o botão Âncora para lançar/recolher. Os mundos salvos mantêm as estruturas existentes.

## Sala P2P

No menu inicial, abra **Sala P2P** em dois navegadores. No primeiro, gere um convite e envie o código à outra pessoa. No segundo, cole o convite, gere uma resposta e devolva o código. No primeiro, cole e aplique a resposta. Use **Copiar código** e **Colar código** para facilitar a troca. A latência é medida automaticamente a cada 3 segundos e o chat fica disponível ao conectar. Quedas temporárias têm uma janela de recuperação de até 20 segundos. Se falhar, gere um novo convite.

A sala troca mensagens de chat e testes de latência. Após conectar, os dois jogadores clicam em **Entrar no teste 2 jogadores**. Na V4, o anfitrião controla a jangada, constrói pelo menu B usando um estoque temporário de materiais e navega com O (remo), T (vela) e H (âncora). A âncora não vem instalada: é necessário construí-la. O convidado vê o convés, equipamentos, posição e proa atualizados, pode andar, nadar, subir por escadas e solicitar a âncora com H estando no convés. O anfitrião valida esse comando pela posição remota. As estruturas são transmitidas em snapshots quando mudam e periodicamente; movimento e relógio são enviados a cada 200 ms. Limites experimentais: 64 fundações e 128 módulos. Coleta, inventário compartilhado, fabricação de itens, combate, motor e saves cooperativos continuam pendentes; a sessão temporária não sobrescreve saves solo. Esc permite encerrar o teste e voltar ao menu. TURN e salas automáticas ainda não estão implementados; redes com NAT restritivo podem exigir TURN.

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
