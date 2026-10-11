SISTEMA DE MERCADO DE AÇÕES (STOCK MARKET)

1. Visão Geral

O sistema de ações permitirá que o jogador invista seu dinheiro acumulado para gerar riqueza passiva. Para manter o conceito de "nova geração", os preços das ações não serão apenas aleatórios (RNG puro), mas responderão a ciclos econômicos e a notícias geradas dinamicamente pela IA.

2. Estrutura de uma Ação (Objeto de Dados)

Cada empresa de capital aberto no jogo terá propriedades fixas e variáveis.

Estrutura Básica (JSON):

{
  "ticker": "NXTK",
  "nome": "NextTech",
  "setor": "Tecnologia",
  "precoAtual": 145.50,
  "volatilidade": 0.08, 
  "tendencia": 0.02,
  "dividend Yield": 0.015 
}


Volatilidade: O quanto o preço pode variar normalmente a cada turno (ex: 8%). Ações de tecnologia têm alta volatilidade; ações de saneamento (utilities) têm baixa.

Tendência (Drift): Um viés de crescimento natural ou declínio a longo prazo.

Dividend Yield: Porcentagem paga ao jogador anualmente (se a empresa pagar dividendos).

3. A Matemática da Flutuação de Preço (O Algoritmo)

A cada "turno" (seja um mês ou um ano no jogo), o novo preço da ação será calculado usando a seguinte fórmula simplificada:

Novo Preço = Preço Atual × (1 + Flutuação Aleatória + Clima do Mercado + Impacto de Evento)

Detalhando as Variáveis:

Flutuação Aleatória (Random Walk): Um valor sorteado entre -volatilidade e +volatilidade.

Ex: Se a volatilidade é 5%, sorteia-se um valor entre -0.05 e +0.05.

Clima do Mercado (Market Sentiment): Afeta todas as ações ou um setor inteiro. Pode ser Bull Market (Mercado em alta, adiciona +0.02 a +0.05) ou Bear Market (Mercado em queda, adiciona -0.02 a -0.05).

Impacto de Evento (A Magia da IA): Modificador aplicado caso aconteça uma notícia específica com a empresa. Pode variar de -0.50 (falência iminente, queda de 50%) a +0.50 (descoberta revolucionária, alta de 50%).

4. O Diferencial Inovador: Eventos Gerados por IA

Em jogos antigos, as notícias são estáticas ("A empresa lançou um produto ruim. Ações caem 10%"). No nosso jogo, usaremos a IA (como Gemini ou Llama 3) para gerar o ecossistema financeiro.

Fluxo da IA no Mercado:

O sistema sorteia que a empresa "NextTech" terá um evento.

O jogo envia um prompt oculto para a IA: "Gere uma manchete de jornal curta sobre a empresa de tecnologia NextTech envolvendo um vazamento de dados, e defina o impacto nas ações (de -0.10 a -0.30)."

A IA retorna um JSON estruturado:

{
  "manchete": "Hackers expõem dados de 50 milhões de usuários da NextTech em ataque sem precedentes.",
  "impacto": -0.22
}


O jogo mostra a manchete na tela do celular/PC do jogador em um feed de "Notícias Financeiras" e aplica a queda de 22% no preço da ação.

5. Interface e Ações do Jogador (UI/UX)

Para manter a imersão (tela vertical/horizontal), o jogador terá um aplicativo de "Home Broker" no celular do jogo (estilo Robinhood ou Nubank).

Portfólio: Gráfico mostrando o patrimônio total, lucro/prejuízo histórico e rendimento de dividendos.

Ações (Botões):

Comprar: Insere a quantidade de cotas.

Vender: Vende as cotas a preço de mercado.

Operar Vendido (Short): Para jogadores mais avançados, apostar na queda de uma empresa.

Aba de Notícias: Um feed estilo Twitter/X contendo as notícias geradas pela IA para que o jogador tente "prever" se a ação vai subir ou cair no próximo turno baseado nos acontecimentos.

6. Prevenção de Abusos (Game Balance)

Taxa de Corretagem: Toda compra/venda custa uma pequena taxa ou porcentagem, impedindo que o jogador fique comprando e vendendo infinitamente por lucros de 0.01%.

Imposto de Renda: O jogo pode cobrar um imposto automático sobre o lucro das vendas no final do ano fiscal do jogo, adicionando uma camada extra de realismo e estratégia.