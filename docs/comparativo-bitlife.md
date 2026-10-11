# NextLife × BitLife: o que tem, o que falta e onde ganhamos

Base de comparação: [`analise.md`](analise.md), que lista o que existe no BitLife (os 7 blocos abaixo seguem a mesma ordem).
Números do projeto medidos no código em 09/10/2026: cerca de 180 eventos sorteados (cerca de 420 escolhas) e 108 ações manuais, 38 carreiras (135 cargos), 16 cursos, 19 países (125 cidades), 108 ativos na bolsa (100 ações + 8 criptomoedas), 54 lojas (260 itens), 23 ambições, 52 fitas, 43 destinos de viagem, 14 doenças, 10 crimes, 5 cargos políticos e 8 leis, 3 minigames, 2 idiomas, cerca de 17.000 linhas de código e 119 testes automáticos (`npx vitest run`).

Legenda: ✅ tem · 🟡 tem parcialmente · ❌ não tem

---

## 1. Ciclo principal

| BitLife | NextLife | Situação |
|---|---|---|
| 1 clique = 1 ano | Turno adaptativo: 1 ano (0–11), 3 meses (12–17), 1 mês (adulto), com tempo automático em 3 velocidades que pausa nos eventos | ✅ superior |
| Eventos aleatórios estáticos | cerca de 180 *storylets* com condições de estado, escolhas com chance, memória de NPC e gramática procedural, mais as ações manuais pelo mesmo motor | 🟡 melhor em qualidade, **ainda menor em volume** |
| Morte, pontuação e Ribbon | Pontuação da vida (0 a ~1000), 6 faixas e 52 fitas com fita principal, na tela de morte | ✅ |
| Jogar como filho(a), herdando dinheiro, casas e dívidas | Dinastia herda dinheiro, empresa, ações, imóveis, ouro e colecionáveis; **dívidas não passam** | ✅ (exceto dívidas) |

## 2. Atributos

| BitLife | NextLife | Situação |
|---|---|---|
| Felicidade, Saúde, Inteligência, Aparência | Os quatro, mais Carisma e Estresse, com Energia derivada | ✅ superior |
| Karma (oculto) | Karma de −100 a 100 que pesa em sorteios (`luck`), pontuação e fitas | ✅ |
| Fertilidade (oculta) | Fertilidade oculta sorteada ao nascer, ajustada pela idade, com tratamento | ✅ |
| (não tem) | Saúde oculta da alimentação, Status e Produtividade derivados do inventário, 8 traços de personalidade | ✅ extra |

## 3. Educação

| BitLife | NextLife | Situação |
|---|---|---|
| Ensino fundamental e médio, "estudar mais" | Escola automática, boletim, horas de estudo na rotina | ✅ |
| Clubes, esportes, bullying, professores | Clubes (xadrez, teatro, time), ajuda do professor, matar aula, bullying, peneira, feira de ciências | ✅ |
| Universidade com dezenas de cursos, medicina, direito etc. | 16 cursos com vestibular e bolsa, e pós-graduação (mestrado e doutorado). Sem residência nem especializações por área | 🟡 |

## 4. Carreiras

| BitLife | NextLife | Situação |
|---|---|---|
| Centenas de empregos em escada | 38 carreiras, 135 cargos, com requisitos, promoção, aumento, demissão, imposto e aposentadoria | 🟡 |
| Político (prefeito a presidente) | Partido, 5 cargos, campanha, eleição, mandato, impeachment, suborno e 8 leis que mexem no mundo | ✅ |
| Músico / banda | Instrumentos, banda, shows, álbuns, turnê, fãs e gravadora | ✅ |
| Ator / estrela de cinema | Testes de elenco, agente, papéis, fama e prêmios | ✅ |
| Atleta profissional | 5 modalidades, clubes em 4 níveis, transferências, títulos e lesões | ✅ |
| Máfia / crime organizado | 7 organizações, missões, patentes, sair, informante | ✅ |
| Astronauta | Candidatura, 24 meses de treinamento e missões | 🟡 (um só caminho, sem outras carreiras de elite) |
| Empreendedor (fábricas, folha, produtos, IPO) | 4 setores, preço com elasticidade, marketing, equipe e capacidade, qualidade, reputação, filiais, gerente automático, venda e falência. **Sem IPO, fábrica ou produtos** | 🟡 mais profundo que o BitLife na gestão |

## 5. Atividades e estilo de vida

| BitLife | NextLife | Situação |
|---|---|---|
| Médico, academia, artes marciais | Médico (3 tipos), check-up, terapia, academia com mensalidade, dojô com faixas | ✅ |
| Cirurgia plástica, salão, spa, reabilitação | 8 cirurgias com risco, salão, spa e reabilitação | ✅ |
| Cinema e livros (minigame) | Cinema, restaurante, show, museu, parque e minigame de leitura | ✅ |
| Viagem de férias (destino e classe do voo) | 43 destinos reais, 3 classes, desfechos sorteados e fita de viajante | ✅ |
| Imóveis (casa, fazenda, mansão) | Kitnet, apartamento, casa, cobertura e mansão, valorização, manutenção, casa própria no lugar do aluguel e **imóvel para alugar**. Sem fazenda | ✅ |
| Veículos (carro, barco, avião) | Carros, lanchas e aviões com depreciação, manutenção e licenças (carteira com minigame, náutica, brevê) | ✅ |
| Mercado de ações | 100 empresas reais, short, margem, dividendos, imposto, notícias com impacto e herança da carteira | ✅ superior |
| Criptomoedas | 8 criptomoedas no mesmo app, fora do índice, com volatilidade própria | ✅ |
| Imóvel para alugar | Colocar o imóvel para alugar, com renda mensal | ✅ |
| Cassino e apostas | Caça-níqueis, roleta, cavalos e blackjack, com vício em jogo | ✅ |
| Crime (carteira, assalto, assassinato, fuga) | 10 crimes, polícia, julgamento por país, prisão com ações, fuga (minigame) e antecedentes | ✅ |
| Namoro por app, casar, divórcio | Evento "match", pedido de casamento, divórcio com partilha, término, traição | ✅ |
| Filhos: naturais, adoção, barriga de aluguel | Naturais (com fertilidade), adoção em 3 idades, barriga de aluguel e tratamento | ✅ |
| Interação com a família | 8 interações, relações que esfriam, memórias de cada pessoa | ✅ |
| Animais de estimação (cães, gatos, exóticos) | 9 espécies (3 exóticas), abrigo ou criador, vínculo, veterinário e morte | ✅ |

## 6. Personalização ("God Mode")

| BitLife | NextLife | Situação |
|---|---|---|
| Editar atributos de qualquer NPC | Modo Deus (premium, liberado na versão de teste) edita atributos de qualquer pessoa | ✅ |
| Talento especial ao nascer | 6 talentos no Modo Deus, mais país, cidade, nome, sexo e atração escolhidos | ✅ |
| Ditar sexualidade e comportamento | Escolha da atração na criação; sem controle de comportamento | 🟡 |

## 7. Fitas de fim de jogo

| BitLife | NextLife | Situação |
|---|---|---|
| 40+ Ribbons para rejogar | 52 fitas originais e pontuação final; as fitas ainda não desbloqueiam nada entre vidas | ✅ |

### Placar

Dos 38 itens listados acima: **32 ✅ (84%), 6 🟡 (16%), 0 ❌ (0%)**, contra 8 ✅, 14 🟡 e 15 ❌ na medição de 08/10/2026. As 🟡 restantes são: volume de eventos, cursos/universidade, carreiras em escada, astronauta, empresa (sem IPO/fábrica) e controle de comportamento no Modo Deus.

Resumo: o que faltava em **conteúdo de vida** e **fim de jogo** foi fechado em quantidade de recursos. O que sobrou é **volume e polimento**, não sistemas.

---

## Onde o NextLife já ganha do BitLife

1. **Mundo real jogável.** 19 países e 125 cidades com moeda, imposto, custo de vida, salário, nomes e comidas locais. Dá para emigrar, e o patrimônio mantém o poder de compra. Isso muda a vida de verdade (um iPhone custa 5 salários de um primeiro emprego no Brasil e menos de 1 nos EUA).
2. **Tempo e energia em vez de só cliques.** A rotina semanal em horas, com previsão de para onde ela leva a saúde, a felicidade e o estresse, dá decisões que se acumulam.
3. **Profundidade opcional de verdade.** Empresa, bolsa e loja têm camadas, mas o jogador casual pode ignorá-las ou delegar (gerente automático).
4. **Sistemas que conversam entre si.** Clima da bolsa muda o preço das lojas e o ouro; leis aprovadas pelo jogador político mexem em imposto, mortalidade, prisões e mercado; vícios e doenças deslocam a rotina; status e produtividade pesam na entrevista, no romance e no trabalho; carteira e imóveis passam para o herdeiro.
5. **Memória e reação.** Pessoas lembram o que você fez e os eventos reagem a isso ("seu ex agora é seu chefe").
6. **Interface viva.** Retrato e paisagem com layouts diferentes, avatar que envelhece e reage ao humor, números que rolam, setas de impacto no carrinho, consultor que explica o negócio em frases.
7. **Arquitetura pronta para crescer.** Simulação pura e determinística (mesma semente, mesma vida), testada, separada da interface. Ações novas se registram com uma chamada. Notícias e ofertas já têm a porta pronta para IA, com fallback procedural.
8. **Economia calibrada por simulação.** Retorno da bolsa, preços relativos e balanço da empresa foram medidos em milhares de meses simulados.
9. **Dois idiomas desde a base** (português e inglês), com teste que impede evento sem tradução.

## Onde o BitLife ainda ganha, e o risco de cada lacuna

| Lacuna | Risco para o jogo | Esforço |
|---|---|---|
| **Volume de conteúdo** (cerca de 180 eventos; a meta do GDD é 300+) | **Alto.** Ainda sobra repetição em muitas vidas. É o ponto que mais derruba retenção neste gênero | Grande e contínuo |
| **Tutorial e modo casual** | Alto para quem chega sem guia: 6 abas, 3 apps e muitos números quebram o pilar "simples de entender" | Médio |
| **Áudio e vibração** | Médio: o jogo é mudo | Pequeno a médio |
| **PWA, ícones e instalação** | Médio para o lançamento mobile | Pequeno |
| **Salvamento na nuvem e telemetria** | Alto para F2P (sem dados não se ajusta nada); nulo para o protótipo | Médio |
| **Monetização real** (anúncio opcional, cosméticos, premium de verdade) | Alto para o modelo F2P; hoje o Modo Deus "premium" é grátis | Médio |
| **Mapa visual da cidade** (diorama) | Médio: é a promessa visual do GDD e ainda não existe | Grande |
| **IPO, fábricas e produtos** na empresa | Baixo-médio: a gestão já é mais profunda que a do BitLife, faltam essas camadas | Grande |
| **Teste com jogadores** | Médio: o balanceamento é só por simulação, falta saber o que é divertido, não só o que é consistente | Contínuo |
| **Verificação visual em navegador real** | Médio: telas e minigames novos foram cobertos por testes de lógica e compilação, mas não revisados em aparelhos e navegadores | Pequeno |
| Dívidas passam ao herdeiro, financiamentos, visto, fazenda, residência médica | Baixo | Pequeno cada |

## Ordem sugerida

**Agora: jogabilidade e retenção**
1. Mais eventos e arcos de vários capítulos, rumo a 300 eventos.
2. Tutorial curto e modo casual (piloto automático) para reduzir a complexidade de interface.
3. Teste com jogadores reais (10 a 20 pessoas) para calibrar ritmo e dificuldade.

**Produto F2P**
4. Áudio e vibração, PWA com ícones, salvamento na nuvem e telemetria.
5. Monetização conforme o GDD: anúncio opcional (segunda chance ao morrer), cosméticos, pacotes de cenário e premium de verdade.

**Diferenciais que o BitLife não tem**
6. Mapa visual da cidade, em que suas empresas e imóveis mudam o bairro.
7. IPO e fábricas na empresa.
8. IA opcional nas notícias, ofertas e conversas, com chave do jogador ou servidor, sempre com fallback procedural.

## Observações

- Esta comparação usa o `analise.md` como descrição do BitLife; não verifiquei o jogo em si.
- Contar itens favorece quem tem mais conteúdo. Por isso o placar mostra paridade de **recursos**, não qualidade de jogo. A vantagem do NextLife está na profundidade e na ligação entre sistemas, mas só se prova quando houver jogadores de verdade.
- "Tem" quer dizer que existe no código e é coberto por testes de simulação. A interface não foi vista em navegador real nesta rodada.
