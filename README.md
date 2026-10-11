# NextLife

Simulador de vida de nova geração, ambientado no mundo real (19 países, 125 cidades): indivíduo (The Sims) + impacto macro (SimCity) + estratégia, com acessibilidade de jogo casual.
Design vivo em [`docs/gdd.md`](docs/gdd.md); comparação com o gênero em [`docs/comparativo-bitlife.md`](docs/comparativo-bitlife.md).

## Estado atual (09/10/2026)

Protótipo jogável em português e inglês. Da infância à morte: escola, faculdade, 38 carreiras, empresa própria, bolsa (ações e criptomoedas), lojas, relações e dinastia, mais saúde e vícios, pets, viagens e licenças, crime/prisão/máfia, política, carreiras de música, atuação, esporte e espaço, cassino, adoção e fertilidade, Modo Deus (premium de teste), pontuação e 52 fitas no fim da vida.
Cerca de 180 eventos sorteados e 108 ações, 3 minigames e 119 testes automáticos.

**Ainda não existe:** tutorial, áudio, PWA, salvamento na nuvem, telemetria, monetização real, mapa visual da cidade, IPO/fábricas. **Pendente:** teste com jogadores e verificação visual em navegador real (a lógica é testada; a interface não foi revisada em aparelhos).

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173 (também acessível pelo celular na mesma rede)
npm test           # vitest: determinismo, vidas completas, dinastia, crime, viagem, cassino, mercado, loja, inglês
npm run typecheck  # tsc -b
npm run build      # typecheck + build de produção em dist/
npm run preview    # serve o build
npm run gen:stocks # regenera os dados da bolsa a partir de docs/empresas.md (precisa de python3)
```

Atalhos: **Espaço** avança o tempo / fecha resultado · **P** liga/desliga tempo automático.
Depuração (modo dev): `__nl.getState()` no console do navegador.
Idioma: Ajustes (troca pt/en, salvo no navegador; começa pelo idioma do navegador). O Modo Deus também fica em Ajustes.

## Estrutura

```
src/
  sim/                 Núcleo da simulação: TypeScript puro, sem React, determinístico (RNG no estado)
    types.ts           GameState serializável (é o save)
    game.ts            newGame / advance / choose / act / continueAsHeir
    core.ts            helpers de pessoas, feed, dinheiro, atributos
    grammar.ts         gramática procedural ({npc.nome}, [a|b], #regra#)
    storylets/         motor de eventos + conteúdo (engine.ts, content/*.ts: infância, adulto, trabalho, saúde, crime, política...)
    actions/           ações do jogador registradas no mesmo motor (carreiras, crime, escola, família, lazer, licenças, pets, política, saúde)
    systems/           mercado e cripto, notícias, lojas e ofertas, agenda, carreira+educação, empresa, relações,
                       ambições, saúde, crime, política, viagem, pets, cassino, carreiras especiais, Modo Deus, pontuação e fitas
    data/              carreiras, setores, atividades, traços, nomes, mundo, saúde, crime, política, viagem, lojas, ações
    __tests__/         testes da simulação
  i18n/                t(), addEn() e os dicionários em inglês (en/dados, en/eventos, en/ui)
  store.ts             zustand: ponte UI ↔ simulação, autosave em localStorage
  ui/                  React + Motion: App, HUD, avatar SVG, cenas de evento, painéis (components/, panels/), minigames/ (Livro, Sinais, Grid)
docs/                  GDD, comparativo, análise do gênero e especificações de empresas, bolsa e mercado
scripts/               gerador de dados da bolsa
```

A UI nunca muta o estado: toda ação passa por funções puras de `sim/`, que devolvem um novo `GameState`.
Isso deixa o núcleo pronto para rodar num Web Worker, num servidor ou em testes de balanceamento automáticos.

## Idiomas

O texto-fonte é o português. O inglês é um dicionário pt→en (`addEn`), e dados e ações trazem o inglês ao lado do texto. Sem tradução o jogo mostra o português. O teste `src/sim/__tests__/i18n.test.ts` falha se algum evento ficar sem tradução. Detalhes na seção 22 do GDD.

## Testes

`npm test` roda a suíte da simulação (119 testes): mesma semente dá a mesma vida, vidas completas sem erro, dinastia, mercado, loja, crime, viagem, cassino, carreiras especiais, vida/saúde e cobertura de tradução. Não há testes de interface.
