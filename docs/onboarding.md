# Onboarding: tutorial e modo casual

## O que foi feito
- **Tutorial** (`src/ui/tutorial/`): 8 coach-marks (`steps.ts`, `Tutorial.tsx`) que apontam para elementos reais (botão avançar, atributos, linha da vida, abas Rotina/Carreira/Celular, dinheiro). Spotlight com motion/react, cartão posicionado conforme retrato/paisagem, reposicionado a cada 300 ms e em resize. O overlay não captura cliques; some enquanto houver evento pendente, resultado, minigame ou morte. "Pular" e "Concluir" gravam `nextlife.tutorial.seen`. Abre ao iniciar a primeira vida; reabrir em Ajustes > Tutorial.
- **Modo casual** (`store.casual`, `store.autopilot`, localStorage `nextlife.casual` / `nextlife.autopilot`): chave na criação da vida e em Ajustes (`Casual.tsx`). Esconde a aba Empresa até existir uma empresa, esconde apps avançados do celular atrás de "Mais", oculta os números das barras de atributos (CSS `.app.casual .stat-label b`) e troca a aba Rotina por um resumo com recomendação; "Ajustar manualmente" abre a agenda completa.
- **Piloto automático**: `autoAgenda(g)` / `casualAdvice(g)` em `src/sim/systems/casual.ts` (pura). O store aplica a agenda sugerida antes de cada `advance` só se casual+piloto estiverem ligados; no modo normal nada muda.
- Estado do tutorial fica fora da simulação (store). EN em `src/i18n/en/tutorial.ts`.
- Testes: `casual.test.ts`, `tutorial-i18n.test.ts`.

## Para verificar no navegador
- Primeira vida: o guia abre sozinho; cada passo destaca o elemento certo em retrato (mobile) e em paisagem/tela larga (>=1000px, abas ficam no painel central).
- Passos de abas: o realce encontra o botão pelo texto (PT e EN); conferir que "Rotina" aparece como "Routine" em EN.
- Avançar com o guia aberto: um evento deve esconder o guia e ele volta depois da escolha.
- Rotacionar o aparelho com o guia aberto: cartão não sai da tela.
- Casual: criar vida com Casual, ver 4 abas (sem Empresa), Celular com 5 apps + Mais, barras sem números, Rotina com resumo; alternar para Normal em Ajustes e conferir que tudo volta.
- Piloto: a agenda muda sozinha a cada avanço; desligar permite editar horas.
- Rever guia em Ajustes reinicia no passo 1.
