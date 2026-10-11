# NextLife — Game Design Document (vivo)

> Documento iterativo. Cada seção marca o status: ✅ decidido · 🟡 rascunho · ❓ em aberto.

---

## 0. Decisões registradas

| # | Tema | Decisão | Status |
|---|------|---------|--------|
| D1 | Stack | TypeScript + React (UI) + PixiJS (mundo) + Rive (animações de UI/personagem). Simulação em TS puro num Web Worker. Capacitor (mobile) + Tauri (desktop). | ✅ |
| D2 | Estilo visual | "Diorama vivo": mundo abstrato (cartões, mapa estilizado) com cenas animadas pontuais. | ✅ |
| D3 | Modelo de negócio | Free-to-play, lançamento comercial futuro. | ✅ |
| D4 | Narrativa / IA | Motor de *storylets* + gramática procedural no MVP; LLM como camada opcional na fase 2, só para texto de sabor. | ✅ |
| D5 | Tempo | 0–11 anos: turno de 1 ano · 12–17: 3 meses · 18+: 1 mês. Tempo automático pausável (3 velocidades), que pausa sozinho nos eventos. | ✅ |
| D6 | Recurso central | Tempo + Energia (não dinheiro). | ✅ |
| D7 | Ambientação | **Mundo real**: 19 países e ~120 cidades. Nome, moeda, salários, custo de vida, imposto e expectativa de vida locais. O jogador escolhe onde nasce e pode se mudar. (Substitui a ideia inicial de país fictício.) | ✅ |
| D8 | Tom | Mistura de humor e drama, que muda conforme as escolhas. | ✅ (provisório) |
| D9 | 1º sistema profundo | Empresa (4 setores). | ✅ |
| D10 | Modelo de atributos | Saúde/Felicidade/Estresse convergem a um **alvo** definido pela rotina; Inteligência/Carisma/Aparência acumulam com retornos decrescentes. | ✅ |
| D11 | Stack real do protótipo | React + Motion + Zustand + Vite, sem PixiJS nem Rive (avatar e cenas em SVG/CSS). Simulação em TS puro, ainda na thread principal. Mapa-diorama, Web Worker, Capacitor e Tauri seguem adiados. | ✅ (substitui parte de D1 e D2 no protótipo) |
| D12 | Ações pelo mesmo motor | Atividades do jogador (crime, viagem, cassino, política, saúde...) são *storylets* "manuais" registradas em `sim/systems/actions.ts`: mesmas condições, escolhas, chances e efeitos dos eventos sorteados. Dados em `sim/data/`, regras em `sim/systems/`, ações em `sim/actions/`. | ✅ |
| D13 | Rejogo | Toda vida termina com pontuação (0 a ~1000), faixa de vida e fitas (ribbons) com nomes originais. | ✅ |
| D14 | Idiomas | Português é o texto-fonte; inglês é um dicionário pt→en (`src/i18n`). Troca em Ajustes, salva no navegador. | ✅ |
| D15 | Modo Deus / talento | Recurso **premium**, hoje liberado de graça na versão de teste (`life.premium`). | 🟡 |
| D16 | Karma e sorte | Karma oculto (−100 a 100) pesa nos sorteios (`luck`) e em fitas; ações boas/más o movem. | ✅ |

---

## 1. Visão

Simulador de vida que junta The Sims (indivíduo), SimCity (impacto macro) e estratégia, com acessibilidade de jogo casual. Profundidade opcional: toda camada avançada tem uma versão automática/delegável.

### Desafios mapeados
1. **UI adaptativa retrato ↔ paisagem** → sistema de "cartões vivos" que expandem em painéis.
2. **Simulação em dois níveis (indivíduo ↔ mundo)** → NPCs-chave detalhados + população estatística; LOD de simulação.
3. **Liberdade sem paralisia** → ambições emergentes sugeridas pelo estado da vida.

---

## 2. Core loop 🟡

```
PLANEJAR (agenda de Tempo/Energia) → SIMULAR (tempo corre, animado)
→ REAGIR (cenas/eventos) → GERIR (camadas profundas, opcional)
→ PROGREDIR (ambições, marcos) → repete
```

**Meta-loop:** morte → herdeiro/descendente → dinastia molda a cidade ao longo de gerações.

---

## 3. Direção de arte — "Diorama vivo" ✅

O jogador vê o mundo, mas de forma estilizada e econômica. Três camadas visuais:

| Camada | O que é | Tecnologia | Onde aparece |
|---|---|---|---|
| **Cartões vivos** | Interface principal: cartões com micro-animações (números que rolam, barras que pulsam, ícones que reagem) | React + Motion | Sempre |
| **Avatar modular** | Personagem 2D em camadas (rosto, cabelo, roupa, expressão) que envelhece e reage ao humor | Rive (state machine) | Topo da tela / cenas |
| **Mapa-diorama** | Cidade isométrica minimalista (blocos, sem detalhe fino) que cresce com o jogador: casa, empresa, filiais, prédios públicos | PixiJS | Aba "Mundo", paisagem, gestão |
| **Cenas** | Vinhetas animadas curtas (3–6 s) em momentos marcantes: nascimento, formatura, casamento, falência, eleição | Rive + texto | Eventos críticos |

**Princípio:** nenhuma ação sem feedback visual. Ganhar dinheiro faz moedas voarem para o saldo; uma relação piorando racha o retrato do NPC; a empresa crescendo faz um prédio subir no mapa.

**Paleta / tom:** flat, cores saturadas mas suaves, formas arredondadas (referências: Mini Metro, Alto's Odyssey, Reigns, Two Point Hospital em 2D).

---

## 4. Sistema narrativo e IA ✅

### Decisão: híbrido em três camadas

```
┌────────────────────────────────────────────────────────────┐
│ Camada 3 (fase 2, opcional): LLM                           │
│ Reescreve/enfeita texto, chat com NPCs, manchetes          │
│ Nunca decide mecânica. Sempre com fallback para a camada 2 │
├────────────────────────────────────────────────────────────┤
│ Camada 2: gramática procedural (estilo Tracery)            │
│ Variações de frases, nomes, detalhes usando o estado       │
│ "#npc.nome# #reação.raiva# quando soube de #segredo#"      │
├────────────────────────────────────────────────────────────┤
│ Camada 1: motor de storylets (base de tudo)                │
│ Eventos escritos à mão com condições e efeitos sistêmicos  │
│ Cada evento: requisitos → texto → escolhas → efeitos       │
└────────────────────────────────────────────────────────────┘
```

### Por que não depender de LLM no MVP
- **Custo F2P:** milhões de jogadores × chamadas de API = custo que escala com o sucesso, sem receita garantida.
- **Offline e mobile:** modelos locais (WebLLM) exigem download de ~1 GB e GPU; inviável em celular médio.
- **Free tiers** (Gemini, Groq) têm limite de requisições e exigem backend proxy para esconder a chave.
- **Determinismo:** a mecânica precisa ser testável e balanceável; texto livre de IA não é.
- **Moderação:** conteúdo gerado precisa de filtro (classificação etária nas lojas).

### O que dá a imersão sem IA
- **Storylets reativos:** eventos que lembram o passado ("Seu ex, que você traiu em 2031, agora é seu chefe").
- **Memória de NPC:** cada NPC relevante guarda 5–10 "memórias" marcantes com o jogador, que alimentam diálogos e eventos.
- **Gramática procedural:** a mesma situação nunca soa igual duas vezes.
- **Jornal/feed da cidade:** manchetes geradas a partir do estado do mundo (inclusive ações do jogador).

### Arquitetura preparada para IA
Interface `TextProvider` com implementações `TemplateProvider` (MVP) e `LLMProvider` (futuro). O LLM recebe o texto-base da storylet + contexto e devolve só a versão enfeitada. Se falhar ou demorar mais de X ms, usa o texto-base.

### Formato de storylet (rascunho)
```ts
{
  id: "work.boss_credit_stealing",
  weight: 1.0,
  requires: { job: { employed: true }, age: { min: 18 }, trait: { not: ["submisso"] } },
  text: "#chefe.nome# apresentou seu projeto à diretoria como se fosse dele.",
  scene: "office_tension",          // animação Rive opcional
  choices: [
    { label: "Confrontar em público", effects: { rel.chefe: -30, reputacao: +5, stress: +10 }, risk: { demissao: 0.2 } },
    { label: "Falar em particular",   effects: { rel.chefe: -10, stress: +5 } },
    { label: "Engolir e anotar",      effects: { stress: +15 }, memory: "chefe_roubou_credito" }
  ]
}
```

---

## 5. Free-to-play: implicações de design ✅

**Regra de ouro:** monetizar conveniência, estética e variedade, nunca o recurso central (Tempo/Energia) nem a progressão justa.

| Fonte | Exemplo | Risco |
|---|---|---|
| Anúncio recompensado (opt-in) | "Segunda chance" ao morrer, reviver empresa falida, +1 evento raro | Baixo |
| Cosméticos | Roupas/estilos do avatar, temas do mapa-diorama, skins de cidade | Baixo |
| Pacotes de vida (DLC) | Cenários: "Vida na Era de Ouro de Hollywood", "Startup no Vale" | Médio |
| Premium (sem anúncios + extras) | Remove anúncios, slots extras de dinastia, estatísticas avançadas | Baixo |
| Passe de temporada | Desafios de vida ("Viva até 100 sem nunca trabalhar") | Médio |

**Requisitos técnicos desde o dia 1:** telemetria/analytics de eventos, save versionado (migração), estrutura para cloud save futuro.

---

## 6. Status do MVP (v0.1): implementado (números atualizados em 2026-10-09)

- **Vida:** nascimento em família (humilde/média/rica), escola, ensino médio, faculdade (16 cursos, vestibular, bolsa, pós-graduação), envelhecimento, morte (curva de Gompertz + saúde).
- **Rotina:** agenda semanal em horas (112h acordado) com compromissos fixos; previsão "para onde sua rotina te leva"; estilo de vida (Simples/Confortável/Luxuoso); moradia.
- **Carreira:** 38 carreiras (135 cargos) com níveis, requisitos, vagas a cada 3 meses, desempenho, promoções, demissão, aumento, imposto progressivo, aposentadoria.
- **Empresa:** cafeteria, loja de roupas, startup, academia. Preço (elasticidade), marketing → alcance, equipe → capacidade, qualidade, reputação, filiais, gerente automático, pró-labore, aporte/retirada, venda, falência. Consultor em linguagem humana + diorama animado.
- **Relações:** família, amigos, romance (por atração escolhida), casamento, filhos, divórcio; NPCs com **memória** (até 10 lembranças marcantes); 3–4 interações por turno.
- **Narrativa:** cerca de 180 eventos sorteados (storylets com condições, escolhas, chances e efeitos sistêmicos) e cerca de 108 ações manuais pelo mesmo motor; gramática procedural.
- **Metas:** 23 ambições emergentes com progresso.
- **Meta-loop:** dinastia; continuar como filho(a), herdando dinheiro e empresa.
- **UI:** retrato (abas inferiores) e paisagem ≥1000px (perfil | gestão | linha da vida); avatar SVG que envelhece e reage a humor, estresse e saúde; cenas animadas; números que rolam; chips flutuantes; céu que muda com as estações e o humor.

## 7. Mundo real (v0.2)

- **Países (19):** Brasil, Portugal, EUA, Canadá, México, Argentina, Reino Unido, França, Alemanha, Espanha, Itália, Japão, Coreia do Sul, China, Índia, Nigéria, África do Sul, Austrália, Emirados Árabes.
- **Cidades:** de 4 a 10 por país, cada uma com custo de vida, nível salarial e tamanho de mercado próprios (empresa em Tóquio ≠ empresa em Aracaju).
- **Economia:** a simulação roda em "unidades internas", com o mesmo balanceamento em qualquer lugar. Cada país converte para a moeda local (fator `k`, calibrado para o primeiro emprego pagar um valor realista) e tem alíquotas de imposto próprias (Emirados: 0%).
- **Poder de compra (PPP):** ao mudar de país o patrimônio mantém o valor real. O que é muito dinheiro no Brasil pode ser pouco na Alemanha, e vice-versa (arbitragem geográfica).
- **Mudança de cidade ou país:** custa dinheiro, perde o emprego e os vínculos locais (colegas, rivais, conhecidos), família e amigos sentem a distância; eventos de expatriado (saudade, burocracia de visto).
- **Cultura:** nomes e sobrenomes locais, comidas e lugares nos textos dos eventos.
- **Limitações conhecidas:** visto não é simulado; o idioma do jogo é escolhido à parte do país (ver seção 22); alguns termos ainda são brasileiros ("vestibular"); hemisfério sul não inverte as estações.

## 8. Bolsa de valores (v0.3)

Especificação original em [`sistemastock.md`](sistemastock.md); empresas em [`empresas.md`](empresas.md).

- **Empresas:** 100 empresas reais do seu documento (20 por bolsa: EUA, Brasil, Europa, Ásia, Emirados), em 12 setores, mais criptomoedas (seção 18). Para adicionar ou alterar, edite `docs/empresas.md` e rode `npm run gen:stocks`.
- **Preço mensal:** `novo preço = preço × (1 + tendência + flutuação aleatória + clima do mercado + impacto de evento)`, como no documento. Acrescentei uma reversão suave ao valor fundamental e uma "vantagem oculta" por empresa (algumas empresas simplesmente vão mal por décadas).
- **Clima do mercado:** estados de alta, baixa e lateral que duram de 5 a 30 meses, mais humor por setor e por bolsa. O jogador só vê o efeito pelo índice geral ("🐂 Mercado em alta").
- **Notícias (D4):** geradas por modelos de frase, sem IA. Tipos: *fato*, *boato* (erra com frequência) e *mercado*. O mercado absorve 40% do impacto no dia da notícia e 60% no mês seguinte; o jogador vê a manchete, não o impacto, e tenta prever. Quando o evento termina aparece o efeito real.
- **IA depois:** `news.ts` já tem a interface `NewsProvider`, o `buildLLMPrompt` (mesmo prompt do documento) e o `parseLLMResponse` com validação. Falta só ligar a um modelo, com `TemplateNews` como fallback.
- **Operações:** comprar e vender (cotas fracionadas) e **short** com margem de 50%, aluguel de 0,3% ao mês, dividendos devidos e **chamada de margem** (encerra à força quando a margem cai abaixo de 25%, ou seja, +20% de alta).
- **Corretagem:** 0,25% no mercado doméstico e 0,6% em ações estrangeiras (mínimo fixo por operação).
- **Imposto:** cobrado em janeiro sobre o lucro do ano anterior (ganhos, dividendos e coberturas), com compensação de prejuízos; a alíquota deriva do imposto de renda do país (Emirados: 0%).
- **Dividendos:** pagos trimestralmente pelo yield de cada empresa.
- **Moedas:** cada ação tem preço na própria moeda; o câmbio de mercado é fixo e converte para a moeda do jogador. Mudar de país reconverte as posições sem criar lucro ou prejuízo falso.
- **Patrimônio e herança:** a carteira entra no patrimônio líquido. Posições vendidas são liquidadas ao morrer e o herdeiro recebe uma fatia das ações.
- **Ambições:** primeira ação, receber dividendos, ter 20 mil investidos.
- **Interface:** aba **Bolsa** (carteira, mercado com busca e filtros, notícias) e folha de negociação com gráfico, risco, posição e prévia de custos.
- **Aviso:** notícias e eventos são fictícios e não acusam empresas de crimes.
- **Limitações:** o câmbio não varia; não há IPO, falência de empresa, ordens limitadas nem opções.

## 9. Lojas e consumo, o GlobalMart (v0.4)

Especificação original em [`sistemamercado.md`](sistemamercado.md).

- **App:** a aba **Celular** virou uma tela de apps (Bolsa e GlobalMart). A interface do documento ("Tela principal, Ofertas do dia, Carrinho") está implementada.
- **Lojas:** as 50 lojas do documento, por região (EUA, Brasil, Europa, Ásia, Emirados), mais 3 revendedoras de bens de alto custo em todas as regiões (Concessionária, Imobiliária, Marina). Cada país usa as lojas da sua região (mapa em `REGION_OF`); as outras ficam em **Internacional**, com +25% de frete e imposto e sem itens perecíveis.
- **Preços realistas:** produtos globais (eletrônicos, luxo, carros) seguem o preço em dólar convertido pelo câmbio de mercado, com imposto de importação por país; alimentos e itens do dia a dia acompanham a renda local. Resultado: um iPhone custa cerca de 5 salários de um primeiro emprego no Brasil e menos de 1 nos EUA.
- **Três classes de itens:**
  - **Consumíveis:** efeito imediato. Cada repetição na mesma categoria no mesmo mês rende menos. Fast food e doces acumulam **saúde oculta**: só depois de um acúmulo a meta de saúde cai (e o médico avisa); remédio desfaz.
  - **Duráveis:** bônus passivo mensal. Cada **espaço** (celular, notebook, relógio…) conta só o melhor item. Eletrônicos ficam obsoletos (até −50%) e roupas saem de moda (até −60%).
  - **Bens de alto custo** (carro, imóvel, lancha): muito status e **manutenção anual** cobrada em parcelas mensais. Carros e lanchas perdem valor; imóveis valorizam. **Casa própria substitui o aluguel**, e o imóvel é vendido ao mudar de cidade.
- **Efeitos sobre a vida:** além dos atributos que já existem, dois valores derivados do inventário: **Status** (ajuda em entrevistas e no romance, e conta na ambição "chegar a 40 de status") e **Produtividade** (acelera o desempenho no emprego e a qualidade da empresa). Há também Humor, Calma, Saúde, Presença e Aprendizado como bônus passivos.
- **Carrinho:** mostra setas verdes e vermelhas com o impacto de cada compra antes de pagar.
- **Revenda:** mercado de usados (itens perdem valor, ouro segue o preço do dia, colecionáveis seguem a raridade). Ouro funciona como refúgio: sobe quando a bolsa cai. Blind boxes sorteiam raridades (comum, raro, ultra raro, secreto).
- **Inflação (conexão com a bolsa):** o preço real dos bens acompanha o clima do mercado de ações: com a bolsa em alta, tudo encarece; em crise, as lojas fazem liquidação.
- **Fator tendência:** marcas ficam "em alta" (mais status, preços maiores) ou "canceladas" (menos status e menos valor de revenda, preços menores) por 6 a 18 meses. Marcas ligadas a uma ação (Apple, Walmart, Costco, Home Depot, Droga Raia, Sephora/LVMH, Dubai Mall/Emaar) movem o preço dessa ação.
- **Ofertas do dia (IA depois):** 4 por mês, com desconto bizarro ou itens únicos engraçados, gerados por modelos de frase. `offers.ts` já tem `OfferProvider`, `buildOfferPrompt` e `parseOfferResponse` (com limites) para plugar uma IA, com fallback procedural.
- **Herança:** o herdeiro fica com imóveis, ouro e colecionáveis; o resto vira dinheiro do espólio.
- **Patrimônio:** imóveis, carros, lanchas, ouro e colecionáveis entram no patrimônio líquido; eletrônicos e roupas, não.
- **Limitações:** não há financiamento imobiliário nem de carro, a viagem (seção 13) não conecta com as lojas internacionais, e as ofertas ainda não são geradas por IA. Habilitações (seção 13) liberam carro, lancha e avião.

## 10. Pontuação e fitas (v0.5)

Resolve o "só mais uma vida": toda vida termina com nota e conquistas. Código em `sim/systems/ribbons.ts`, UI em `ui/components/Ribbons.tsx` (tela de morte).

- **Pontuação (0 a cerca de 1000):** longevidade (3 pontos por ano, até 100), riqueza (escala logarítmica do patrimônio), felicidade média desde os 12 anos, conquistas (12 por ambição), família (filhos, casamento, adoções), caráter (metade do karma) e uma coluna negativa de crimes e meses de prisão. A tela mostra cada parcela.
- **Faixas de vida:** Vida Apagada, Comum (200), Boa (350), Notável (500), Extraordinária (650) e de Lenda (800).
- **Fitas (52):** títulos com nome e ícone originais, testados contra o estado final (fortuna, cargo político, carreira artística, ficha criminal, vícios, viagens, família, bichos, karma, longevidade...). Em ordem de prestígio, a primeira que o jogador merece vira a **fita principal** da vida; as demais aparecem em lista. Há fitas de bom e de mau caminho (Alma Limpa × Alma Pesada, Recomeço × Escravo do Vício) e uma de consolo ("Vida Discreta").
- **Regra:** mecânicas de fim de jogo se parecem com as do gênero, mas nomes, textos e arte são próprios.
- **Limitações:** não há placar online nem histórico de vidas entre sessões; as fitas ainda não desbloqueiam nada.

## 11. Saúde, doenças, vícios e médico (v0.5)

Dá peso à saúde oculta da alimentação (seção 9). Dados em `sim/data/health.ts`, regras em `sim/systems/health.ts`, ações em `sim/actions/saude.ts`, UI em `HealthPanel`.

- **Doenças (14):** de gripe e fratura a diabetes, hipertensão, depressão, câncer, infarto, AVC e Alzheimer. Algumas são agudas, outras crônicas, e a chance cresce com idade, estilo de vida e vícios. Sintomas levam ao diagnóstico; sem dinheiro para o tratamento a doença avança; há remissão e complicações que podem matar.
- **Médico:** três tipos com custo e eficácia diferentes (ocidental: caro e eficaz; alternativo: barato e quase só acalma; curandeiro: baratíssimo e arriscado, com chance de milagre ou de piorar). **Check-up** descobre doenças ainda sem sintomas. **Terapia** reduz estresse e ajuda na depressão e na ansiedade.
- **Vícios:** álcool, cigarro, jogo e drogas pesadas, cada um com nível de dependência que cresce com o uso, cobra dinheiro e saúde, e pode levar a overdose. Dá para tentar parar sozinho ou ir à **reabilitação** (três meses internado). Sair limpo rende uma fita.
- **Corpo:** academia (mensalidade, exercício rende mais), dojô com **faixas** de artes marciais (branca à preta), salão e spa (aparência e calma) e **cirurgia plástica** (8 procedimentos com ganho de aparência, chance de falhar e recuperação).
- **Integração:** doenças e vícios deslocam as metas de saúde, felicidade e estresse (`systems/modifiers.ts`), e a agenda só conhece esse módulo.

## 12. Animais de estimação (v0.5)

`sim/systems/pets.ts`, `sim/actions/pets.ts`, `PetsPanel`.

- **9 espécies:** cachorro, gato, coelho, hamster, passarinho, peixe e três exóticos perigosos (cobra, macaco, tigre), cada um com vida média, custo mensal e veterinário.
- **Como adquirir:** abrigo (grátis, rende karma), criador (preço), pet pequeno e animal exótico (karma negativo).
- **Vida do bicho:** vínculo e saúde variam com o tempo; brincar, passear e levar ao veterinário. Doenças, velhice e morte afetam a felicidade do dono; pets dão bônus mensal de felicidade e menos estresse. Exóticos têm chance de acidente grave.
- O antigo marcador `pet` de saves antigos vira um pet real (migração em `ensureLife`).

## 13. Viagem, licenças e minigames (v0.5)

- **Viagem** (`data/travel.ts`, `systems/travel.ts`, `TravelPanel`): 43 destinos reais em 5 faixas de preço e "climas" (praia, cultura, natureza, festa, luxo, aventura, gastronomia), a partir dos 16 anos. Três classes de voo (econômica, executiva, primeira) que mudam custo, humor e calma. O preço usa dólar convertido pelo câmbio e o índice de preços; viagem dentro do próprio país sai bem mais barata. Cada viagem sorteia um desfecho (tudo bem, mala extraviada, intoxicação, golpe de turista, encontro com alguém, conversa que muda a visão de mundo, doença de viagem) e registra lugares visitados (fita "Cidadão do Mundo").
- **Licenças** (`actions/licencas.ts`): carteira de motorista (minigame de sinais), licença náutica, brevê de piloto e porte de arma (exige ficha limpa). Carro, lancha e avião da loja passam a exigir a licença correspondente; o porte muda opções de eventos.
- **Minigames** (`ui/minigames/`): **Livro** (virar páginas rápido, em "Ler um livro"), **Sinais** (teste de trânsito: 7 de 10) e **Grid** (usado no assalto e na fuga da prisão). O resultado volta à simulação por `finishMinigame` e o nível da pessoa altera a dificuldade. Novos minigames se registram com `registerMinigame`.
- **Imóveis:** além de morar, é possível colocar um imóvel para alugar (renda mensal).
- **Limitações:** não há visto; viagem ainda não alimenta o catálogo "Internacional" das lojas.

## 14. Crime, prisão e máfia (v0.5)

`data/crime.ts`, `systems/crime.ts`, `actions/crime.ts`, `RuaPanel`.

- **Crimes (10):** de furtar numa loja e bater carteira a roubar casa/carro, golpe, tráfico, assalto a banco e a carro-forte, e assassinato. Cada um tem risco, ganho e pena. Assalto de casa e fuga usam o minigame Grid.
- **Polícia e atenção:** cada crime aumenta o "calor"; comprar o silêncio de testemunhas e armas ilegais mexem nele. A prisão pode ser em flagrante ou por mandado depois.
- **Justiça:** julgamento com chance de absolvição; pena escalada pelo **rigor do país** (`JUSTICE`) e reduzida para menores de 18. Antecedentes bloqueiam carreiras com `cleanRecord` (direito, finanças, educação) e a política.
- **Prisão:** o tempo corre na cadeia (só eventos de prisão disparam). Ações: estudar, trabalhar, entrar num grupo, pedir condicional, subornar guarda, **fuga** (minigame, vira fugitivo), entregar-se. Metas de saúde, felicidade e estresse pioram.
- **Máfia:** entrar numa das 7 organizações, missões (proteção, contrabando, guerra), patentes com lealdade, promoção, tentar sair (nem sempre deixam) e virar **informante**. Topo da hierarquia vale uma fita.
- Morte em tiroteio é possível. O karma cai com crimes.

## 15. Política (v0.5)

`data/politics.ts`, `systems/politics.ts`, `actions/politica.ts`, aba de Carreira.

- **Carreira política:** filiar-se a um partido (esquerda, centro, direita), disputar **5 cargos** (vereador, prefeito, deputado, governador e chefe de governo; o nome do cargo máximo muda por país), cada um com idade mínima, custo de campanha, mandato de 48 meses, salário e força do adversário. Só se disputa o cargo seguinte ou a reeleição, e é exigida ficha limpa.
- **Campanha:** seis meses até a eleição, com discurso, comício, propaganda de TV, debate e ataque ao adversário (cada ação pode sair bem ou virar escândalo). Resultado com percentual de votos.
- **Mandato:** aprovação oscila; baixa demais leva a **impeachment**; dá para renunciar. Suborno de lobistas rende dinheiro e pode virar escândalo e prisão.
- **Leis (8):** cortar ou aumentar impostos, saúde pública, educação, segurança, infraestrutura, assistência social e corte de gastos. Valem enquanto o jogador governa e movem o mundo (`Policy`: imposto, mortalidade, prisões, aprendizado, preços e mercado), ou seja, tocam a economia que já existe.
- Há eventos de política (`content/politica.ts`) e fitas (Chefe de Estado, Excelência, Político Enrolado).
- **Limitações:** eleições são simuladas só para o jogador; os outros cargos e o mundo não têm vida própria.

## 16. Carreiras especiais (v0.5)

`systems/special.ts`, `actions/carreiras.ts`, `SpecialPanel`. São carreiras fora do trabalho tradicional, com habilidade própria, que ocupam horas na agenda.

- **Música:** 5 instrumentos, ensaio, shows, banda, álbuns, turnê, fãs e contrato com gravadora (20 mil fãs). Fita "Lenda do Palco".
- **Atuação:** testes de elenco, agente, papéis, fama e prêmios (Estatueta Dourada).
- **Esporte:** 5 modalidades, treino, peneira, 4 níveis de clube (regional à estrela internacional) com salário crescente, transferências, partidas, títulos e lesões. Fita "Campeão".
- **Espaço:** candidatura, 24 meses de treinamento extremo e missões (fita "Fora do Planeta"); risco real de morte.

## 17. Cassino (v0.5)

`systems/casino.ts`, `CasinoPanel`, a partir dos 18 anos, apostas de 50 a 20.000.

- **Jogos:** caça-níqueis (símbolos ponderados e jackpot), roleta (cores e números), corrida de cavalos e blackjack. Prêmio e perda voltam ao dinheiro na hora; empate devolve a aposta.
- O jogo alimenta o vício em jogo (seção 11), o karma e as fitas (Sortudo, Jogador Compulsivo).

## 18. Criptomoedas (v0.5)

Entram na Bolsa como um **grupo à parte** ("Mercado cripto") em `data/market.ts`.

- **8 ativos:** Bitcoin, Ethereum, Solana, Dogecoin, uma stablecoin (USDT) e outros, em dólar, com volatilidade, tendência e beta próprios, muito maiores que as ações.
- Ficam **fora do índice geral** da bolsa (vida própria) e valem como patrimônio. Compra e venda usam a mesma folha de negociação; há notícias específicas e um contador de operações para a fita "Hodl até a Morte".

## 19. Família: adoção, barriga de aluguel e fertilidade (v0.5)

`actions/familia.ts`, `systems/lifestate.ts`.

- **Fertilidade oculta** (0 a 100, sorteada ao nascer, com gaussiana: a maioria é fértil) multiplicada por um fator de idade (cai forte depois dos 30). Substitui a antiga "chance fixa" de ter filho.
- **Tratamento de fertilidade** aumenta as chances. **Barriga de aluguel** (caro) e **adoção** de um bebê, criança de 5 anos ou adolescente de 13 (fita "Lar Aberto").
- Filhos adotados e biológicos entram na dinastia e na pontuação de família.

## 20. Escola, mais carreiras e cursos (v0.5)

- **Escola:** clubes (xadrez, teatro, time de esporte), pedir ajuda ao professor (melhora notas) e matar aula (risco), todos limitados à fase escolar. **Pós-graduação** (mestrado ou doutorado) a partir dos 22 anos aumenta inteligência e salário nas carreiras com diploma.
- **Cursos:** 16 no total, incluindo engenharia, arquitetura, psicologia, odontologia, veterinária, farmácia, jornalismo, ciências, contabilidade e gastronomia, cada um com duração e inteligência mínima.
- **Carreiras:** 38 com 135 cargos (restaurantes, gastronomia e outras além das 12 do MVP), com requisitos de curso, aparência, carisma, idade ou licença e `cleanRecord` para as sensíveis.

## 21. Modo Deus, talento, karma e sorte (v0.5)

- **Modo Deus** (`systems/god.ts`, `GodPanel`, `SettingsPanel`): **premium** em Ajustes (nesta versão de teste, desbloqueio gratuito). Edita atributos de qualquer pessoa (família, amigos, rivais) e escolhe um **talento especial** ao nascer (música, esporte, crime, negócios, artes cênicas, ciência) que dá um empurrão: traço, atributo e, quando cabe, já inicia a carreira especial.
- **Karma** (`life.karma`, −100 a 100): ações boas (adotar no abrigo, doar, ajudar) o elevam; crimes, exóticos e suborno o reduzem. Pesa na pontuação e nas fitas (Alma Limpa/Pesada).
- **Sorte** (`luck`): multiplicador de azar derivado do karma (1 − karma/330: de 0,7 com karma alto a 1,3 com karma baixo) que pesa em jackpots, tratamentos, eleições e golpes.

## 22. Idioma inglês: arquitetura i18n (v0.5)

`src/i18n/index.ts`, `src/i18n/en/{dados,eventos,ui}.ts`.

- **Texto-fonte em português.** `t('texto', {param})` busca o par em um dicionário pt→en preenchido por `addEn(...)`; sem tradução, cai para o português (nada quebra). Também há `tp` (plural), `pickLang` (par escrito à mão), `fmtNum`, `dec`, `monthName` e `numberLocale`.
- **Onde traduzir:** dados e ações trazem o inglês junto (`en: {...}`); eventos usam `en` no storylet; a UI usa `t(...)`.
- **Idioma:** detecção pelo navegador, troca em Ajustes e persistência em `localStorage` (`nextlife.lang`). Independente do país escolhido.
- **Teste:** `i18n.test.ts` varre todos os storylets e falha se faltar tradução de título, texto, escolha ou desfecho.
- **Limitações:** moeda e formatos seguem o país, não o idioma; novos textos exigem par em inglês.

## 23. Decisões e escopo atual

- **Dentro (v0.5):** tudo das seções 6 a 22. Hoje são cerca de 180 eventos sorteados, 108 ações, 38 carreiras, 16 cursos, 52 fitas, 43 destinos, 19 países e 125 cidades.
- **Mudou em relação ao plano original:** o protótipo roda sem PixiJS e Rive (D11); política, crime e carreiras especiais entraram antes do mapa-diorama; cripto entrou na Bolsa em vez de sistema à parte.
- **Fora do escopo por ora:** mapa-diorama, IPO e fábricas, telemetria, nuvem, áudio, monetização real (o Modo Deus é só uma amostra do premium), PWA, tutorial, financiamento, visto.
- **Pendente de validação:** a interface não foi verificada em navegador real e o balanceamento só foi medido por simulação, sem jogadores.

## 24. Próximas seções ❓
- 24.1 Mapa-diorama da cidade real onde o jogador mora (PixiJS) + impacto macro (bairros reagindo às empresas do jogador)
- 24.2 Empresa: IPO, fábricas e produtos
- 24.3 Mais storylets (meta: 300+) e eventos encadeados (arcos narrativos)
- 24.4 Tutorial, modo casual (piloto automático) e animações Rive
- 24.5 Simulação em Web Worker, cloud save, telemetria
- 24.6 Monetização real (anúncio opcional, cosméticos, premium de verdade) e empacotamento: PWA, Capacitor (mobile) e Tauri (desktop)
