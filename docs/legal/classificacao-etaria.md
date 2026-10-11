# Classificação etária: respostas prováveis aos questionários

> RASCUNHO para revisão jurídica e do dono. Respostas baseadas na leitura do código (data/crime.ts, data/health.ts, systems/casino.ts, storylets/content/*). Confira cada pergunta no formulário vigente da loja, que muda com frequência. Sempre responda de forma conservadora: declarar a menos pode levar à remoção do app.

## 1. Conteúdo presente no jogo (verificado no código)

| Tipo | Presente? | Como aparece |
|---|---|---|
| Violência fantasiosa/realista | Sim | Ação "Matar alguém" (crime.ts), brigas, assaltos a banco e carro-forte, risco de morrer. Somente texto e emojis, sem sangue gráfico. |
| Crimes e atividades criminosas | Sim | Furto, roubo, golpe, vandalismo, tráfico, máfia, prisão e fuga. O jogador é o autor. |
| Drogas (uso e venda) | Sim | Drogas pesadas, vício, overdose, reabilitação, venda de drogas como crime. Sem instruções reais. |
| Álcool e tabaco | Sim | Bebida, cigarro, tabagismo e alcoolismo como atividades e eventos. |
| Jogos de azar simulados | Sim | Cassino com slots, roleta, cavalos e 21, só com dinheiro fictício, a partir de 18 anos no jogo. Sem compra de fichas com dinheiro real e sem prêmio real. |
| Bolsa de valores (simulada) | Sim | Empresas e cripto reais por nome/ticker, preços e notícias fictícios. Não é negociação real. |
| Temas sexuais | Leve | Namoro, casamento, traição, referências a sexo. Sem nudez nem cenas explícitas. |
| Nudez | Não | |
| Linguagem imprópria | Leve | Humor ácido; sem palavrões fortes encontrados nos textos (confirmar com busca antes do envio). |
| Morte, doença, luto | Sim | Mortes, acidentes, doenças graves, overdose. |
| Suicídio/automutilação | Não encontrado | Nenhuma ocorrência de "suicídio" no código. Manter assim ou acrescentar tratamento responsável. |
| Discriminação/ódio | Evitar | Há bullying e preconceito como eventos; revisar tom. |
| Terror/medo | Mínimo | |
| Compras dentro do jogo | Não (hoje) | "Modo Destino" é grátis na versão de teste. Se vender, declarar compras. |
| Anúncios | Não (hoje) | Se houver, declarar e restringir a conteúdo adequado. |
| Dinheiro real em jogo de azar | Não | |
| Interação/chat entre usuários, localização, compartilhamento de dados | Não | Tudo local. |
| Coleta de dados pessoais | Não | Só localStorage (ver política de privacidade). |

## 2. Faixa recomendada

**18+ / Mature 17+ (conservador: declarar como 18+ em todas as lojas).** Motivos principais: cometer assassinato e crimes como mecânica, drogas com overdose, apostas simuladas.

## 3. Respostas prováveis por sistema

### Google Play (IARC)
- Violência: "Violência realista contra personagens humanos" provavelmente SIM (assassinato como ação do jogador, sem imagens gráficas). Resultado esperado: ESRB Mature 17+, PEGI 16/18, USK 16/18, ClassInd 18, IARC Generic 18+.
- Substâncias controladas: SIM (uso e venda de drogas, álcool, tabaco).
- Jogos de azar: marcar "simulated gambling" (jogos de azar simulados) como SIM. Isso costuma elevar a classificação (PEGI 18 em alguns casos, ESRB Mature 17+).
- Sexualidade: referências leves; marcar "insinuação sexual/referências", sem nudez.
- Linguagem: leve/nenhuma.
- Usuários podem interagir / compartilhar localização / compras digitais: NÃO (hoje).
- Público-alvo: somente 18+; NÃO marcar crianças (evita Families Policy).
- Categoria "Simulação"; confirmar que não é classificado como cassino real ("Real-money gambling" = NÃO).

### Apple App Store (novo questionário de idade, 4+/9+/13+/16+/18+)
- Respostas a marcar com frequência "Frequente/Intenso": violência realista (assassinato), uso de drogas/álcool/tabaco, jogos de azar simulados, temas maduros/sugestivos.
- Resultado esperado: **18+**.
- "Gambling" (real) = não; "Simulated gambling" = sim, frequente.
- Preencher também a Declaração de Privacidade (App Privacy): "Data Not Collected" na versão atual.
- Guideline 5.3 (jogo): como não é dinheiro real, não exige licença, mas o texto deve deixar claro que é simulado.
- Guideline 1.2/5.1.1(v): não há conteúdo de usuário nem contas.

### ESRB
- Conteúdo: Violence, Blood (não), Use of Drugs and Alcohol, Simulated Gambling, Crude Humor/Mild Language (se aplicável), Sexual Themes (leve). Resultado esperado: **M (Mature 17+)**; "Simulated Gambling" e "Drug Reference" como descritores.
- Em apps mobile a ESRB aplica via IARC, sem custo.

### PEGI
- Violência, drogas, apostas e crime. Esperado: **PEGI 18** (jogos que simulam apostas e que incentivam/ensinam jogo recebem PEGI 18; violência contra humanos sem gráficos pode ser 16). Considerar PEGI 18 como piso provável.

### ClassInd (Brasil, via IARC)
- Descritores prováveis: Violência, Drogas lícitas e ilícitas (consumo e tráfico), Atos criminosos, Sexo (insinuação). Esperado: **18 anos** (conteúdo de tráfico e consumo de drogas ilícitas, atos criminosos graves; jogos de azar simulados).
- Lei 15.211/2025 (ECA Digital): revisar obrigações de verificação etária, supervisão parental e vedação de práticas como caixas de recompensa (loot boxes) para menores. O jogo não tem loot box hoje. [REVISAR com advogado]

## 4. Riscos de loja e como mitigar

1. **Assassinato como mecânica**: aceito em jogos 17+/18+ (precedentes), mas evitar imagens gráficas. Manter somente texto.
2. **Drogas e overdose**: lojas aceitam em 17+/18+, mas exigem que não haja instruções reais nem promoção. Manter o tom de consequência (vício, reabilitação).
3. **Cassino simulado**: Google Play exige declarar "simulated gambling" e restringe anúncios de apostas reais nesse app. Apple pode exigir 18+ e geobloqueio onde jogos de azar simulados são restritos. Não oferecer compra de fichas nem premiar com valor real (isso viraria "real-money gaming").
4. **Marcas e empresas reais**: usar nomes reais pode gerar notificação de marca/difamação. Ver `auditoria-pi.md`. Manter aviso "fictício/ilustrativo, não é recomendação de investimento".
5. **Cripto e bolsa**: Apple 3.1.5 e Google têm regras para apps financeiros/cripto. Por ser simulação, informar claramente que não há negociação real; evitar rótulos como "corretora" ou "investimento real".
6. **Conteúdo adulto sem porta de idade**: a tela de confirmação de idade é recomendada pelas lojas, mas não substitui a classificação correta.
7. **Metadados**: capturas de tela e descrição não podem dar a entender jogo de azar com dinheiro real nem usar marcas de terceiros.
8. **Políticas obrigatórias**: URL pública da Política de Privacidade (publicar os textos de `docs/legal` em página web) e e-mail de contato.
9. **Imitação do BitLife**: lojas removem apps que copiam marca, nome, ícone ou capturas de outro app. Ver `auditoria-pi.md`.
