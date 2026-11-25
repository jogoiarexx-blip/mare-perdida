# ADR-001: Arquitetura Inicial (Vertical Slice)

- **Data:** 24/11/2026
- **Status:** Aceita
- **Contexto:** O GDD de *Maré Perdida: O Último Horizonte* define um jogo survival 3D em navegador com Three.js, Vite, TypeScript, separação entre simulação/renderização e persistência em IndexedDB. O repositório GameForge mencionado no GDD não estava presente no workspace, então o projeto foi iniciado de forma independente e modular.

## Decisões
1. **Stack:** TypeScript estrito + Vite (`base: './'`) + Three.js + Vitest.
2. **Separação Simulação / Render:**
   - Simulação lógica (`Clock`, `Inventory`, `Survival`, `StructureGraph`, `QuestEngine`, `Store`) não depende de DOM ou WebGL para permitir execução em testes unitários headless.
   - Loop fixo de 20 Hz para simulação, renderização desacoplada via `requestAnimationFrame`.
3. **Altura Analítica do Oceano:**
   - Função determinística `getWaveHeight(x, z, time)` compartilhada entre malha visual do oceano, flutuação da jangada e detritos para evitar física pesada por bloco.
4. **Persistência Resiliente:**
   - IndexedDB com dois slots rotativos (`slot_a`, `slot_b`) e verificação de integridade por hash, além de exportação/importação JSON com validação de schema.
