SISTEMA DE LOJAS E CONSUMO (SHOPPING)

1. Visão Geral

O sistema de compras permite ao jogador adquirir bens de consumo e duráveis nas lojas mais famosas de cada região. O principal diferencial aqui é que todo item afeta os atributos do personagem. O dinheiro gasto se converte em status, saúde, felicidade ou utilidade.

2. Estrutura de Dados (JSON)

Precisamos dividir a lógica em duas partes: o objeto da Loja e o objeto do Item.

A. Objeto da Loja

{
  "id": "loja_apple",
  "nome": "Apple Store",
  "regiao": "EUA",
  "tipo": "Eletrônicos",
  "catalogo_base": ["item_iphone15", "item_macbook", "item_applewatch"]
}



B. Objeto do Item

{
  "id": "item_iphone15",
  "nome": "iPhone de Última Geração",
  "preco": 1200.00,
  "categoria": "Eletrônico",
  "tipo_uso": "permanente",
  "manutencao_anual": 0,
  "efeitos": {
    "felicidade": +5,
    "status_social": +10,
    "produtividade": +5
  }
}



3. Classificação dos Itens (Como eles afetam o jogo)

Para tornar o jogo estratégico, os itens serão divididos em três grandes categorias:

Consumíveis (Uso Imediato):

Exemplos: Comida do Carrefour, Remédios da CVS, Perfume da Sephora.

Mecânica: O jogador compra e o efeito é aplicado na hora no turno atual. (Ex: Comer fast food aumenta a felicidade no curto prazo, mas reduz a saúde oculta).

Bens Duráveis (Passivos/Permanentes):

Exemplos: Roupas da Zara, Eletrônicos da Best Buy, Relógios Rolex.

Mecânica: Vão para o "Inventário" do jogador. Enquanto o jogador possuir o item, ele ganha um bônus passivo a cada turno (Ex: Ter um terno caro aumenta as chances de passar em uma entrevista de emprego).

Bens de Alto Custo (Ativos com Manutenção):

Exemplos: Carros, Imóveis, Lanchas (que podem ter lojas próprias).

Mecânica: Dão muito status, mas cobram uma taxa de "manutenção anual" deduzida automaticamente do saldo do jogador.

4. UI/UX: Como o jogador acessa as lojas?

Para manter a imersão de "controlar tudo pelo celular", o jogador não verá um menu de texto chato. Ele abrirá um aplicativo dentro do jogo chamado "GlobalMart" ou "SimZon" (uma sátira da Amazon).

Tela Principal: Mostra as lojas disponíveis na região atual do jogador. (Se ele mora no Brasil, vê Lojas Renner e Magalu. Se viajar para o Japão, vê Don Quijote e Uniqlo).

Ofertas do Dia (Geradas por IA): Uma seção onde a IA cria itens únicos, raros ou com descontos bizarros com descrições engraçadas.

Carrinho de Compras: O jogador seleciona os itens, vê o impacto que eles terão na vida dele (mostrado através de setas verdes para cima em "Saúde" ou "Status") e finaliza a compra.

5. Integração Dinâmica (O toque "Nova Geração")

Para não ser apenas uma vitrine estática:

Inflação: Os preços das lojas podem subir anualmente baseados na economia do jogo (conectando com o sistema de Stocks).

Fator "Tendência": Se a IA gerar uma notícia de que "A marca X foi cancelada na internet", os itens daquela loja perdem o bônus de "Status Social" temporariamente, e o jogador pode querer vender suas roupas daquela marca.



Estados Unidos (EUA)
Walmart: Alimentos em geral, eletrônicos básicos, roupas populares, utilidades domésticas, brinquedos e cosméticos.
Target: Artigos de decoração, roupas casuais de moda, eletrônicos, produtos de beleza e mantimentos.
Best Buy: Computadores, notebooks, consoles de videogame, smart TVs, smartphones e fones de ouvido.
Apple Store: iPhones, MacBooks, iPads, Apple Watch, AirPods e acessórios oficiais da marca.
The Home Depot: Ferramentas, materiais de construção, tintas, móveis para jardim e equipamentos de reforma.
Costco: Compras em atacado (alimentos, bebidas, eletrônicos, pneus e eletrodomésticos em grandes embalagens).
CVS / Walgreens: Medicamentos, suplementos, cosméticos, snacks, bebidas e itens de higiene pessoal.
Trader Joe's: Alimentos orgânicos, pratos congelados gourmet, vinhos, queijos artesanais e snacks exclusivos.
Saks Fifth Avenue / Macy's: Roupas de grife, perfumes importados, maquiagens de alto padrão, sapatos e bolsas de luxo.
Barnes & Noble: Livros, mangás, jogos de tabuleiro, artigos de papelaria e colecionáveis da cultura pop.
Brasil
Casas Bahia / Magalu: Eletrodomésticos, celulares, móveis, smart TVs, notebooks e utilidades para o lar.
Carrefour / Pão de Açúcar: Alimentos, bebidas, produtos de limpeza, carnes nobres, hortifrúti e itens de padaria.
Lojas Americanas: Chocolates, doces, brinquedos, utilidades domésticas de pequeno porte, papelaria e jogos.
Fast Shop: Eletrônicos premium, smart TVs de última geração, notebooks de alta performance e eletrodomésticos modernos.
Lojas Renner / C&A: Roupas masculinas e femininas, calçados, acessórios de moda, lingerie e perfumes.
Droga Raia / Drogasil: Medicamentos, dermocosméticos, produtos para cuidados com bebês e suplementos alimentares.
Leroy Merlin: Materiais de reforma, iluminação, ferramentas manuais e elétricas, pisos e artigos de decoração.
Vivara: Joias em ouro e prata, relógios de luxo, alianças e acessórios refinados.
Centauro: Tênis esportivos, camisas oficiais de futebol, roupas de academia, suplementos e equipamentos de treino.
Havan: Artigos para cama, mesa e banho, brinquedos, utilidades do lar e eletrodomésticos variados.
Europa
IKEA (Suécia): Móveis modulares, decoração minimalista, iluminação inteligente, utensílios de cozinha e artigos de cama.
Carrefour Express / Tesco (França / Reino Unido): Compras rápidas do dia a dia, pães frescos, queijos europeus, vinhos e refeições prontas.
MediaMarkt / Curry's (Alemanha / Reino Unido): Hardware para computadores, videogames, câmeras fotográficas e eletrodomésticos.
Zara / H&M (Espanha / Suécia): Roupas no estilo fast fashion, casacos de inverno, calçados e acessórios urbanos.
Sephora (França): Maquiagens importadas, perfumes de alta perfumaria, tratamentos para pele e produtos capilares.
Harrods / Galeries Lafayette (Reino Unido / França): Artigos de luxo extremo, alta costura, relógios suíços, champagne e perfumes exclusivos.
Decathlon (França): Equipamentos de camping, bicicletas, roupas térmicas, artigos de mergulho e acessórios fitness.
Fnac (França): Livros, quadrinhos, discos de vinil, notebooks, consoles de videogame e instrumentos musicais.
Boots (Reino Unido): Skincare, cosméticos, medicamentos isentos de prescrição, vitaminas e cuidados pessoais.
Lidl / Aldi (Alemanha): Supermercados de desconto com alimentos básicos, itens sazonais importados e utensílios promocionais.
Ásia
Don Quijote - Donki (Japão): Snacks exóticos, cosméticos japoneses, eletrônicos curiosos, fantasias, lembrancinhas e bebidas.
7-Eleven / FamilyMart (Japão / Coreia do Sul): Marmitas japonesas (bento), doces locais, bebidas quentes e geladas, guarda-chuvas e itens de conveniência 24h.
Bic Camera / Yodobashi Camera (Japão): Câmeras profissionais, componentes de PC, gadgets tecnológicos, relógios e figures colecionáveis.
Olive Young (Coreia do Sul): Produtos de K-Beauty, máscaras faciais, cosméticos, dermocosméticos e tratamentos para a pele.
Uniqlo (Japão): Roupas básicas de alta tecnologia (como tecidos térmicos Heattech), casacos leves e moda casual minimalista.
Pop Mart (China): Brinquedos colecionáveis em caixas surpresa (blind boxes), figures de designers renomados e arte urbana.
LOTTE Department Store (Coreia do Sul): Marcas de moda de luxo, cosméticos coreanos premium, praça de alimentação gourmet e eletrônicos.
Muji (Japão): Papelaria minimalista, organizadores domésticos, roupas de algodão orgânico, óleos essenciais e móveis simples.
Suning (China): Eletrodomésticos inteligentes, smartphones, computadores e tecnologia para automação residencial.
Miniso (China): Acessórios para celular, bichos de pelúcia, artigos de papelaria, fones de ouvido e utilidades baratas.
Emirados Árabes Unidos (Dubai & Abu Dhabi)
Dubai Mall Luxury Avenue: Relógios cravados de diamantes, bolsas de grife de tiragem limitada, alta joalheria e perfumes de Oud.
LuLu Hypermarket: Alimentos internacionais, especiarias orientais, produtos importados da Ásia e Índia, eletrônicos e vestuário.
Carrefour UAE: Tâmaras premium, alimentos frescos, eletrodomésticos e utilidades domésticas gerais.
Sharaf DG: Notebooks gamer, smartphones dobráveis, drones, smart TVs e sistemas de som automotivo e residencial.
Paris Gallery: Perfumes de nicho do Oriente Médio, óleos essenciais concentrados, maquiagens exclusivas e relógios de luxo.
Ace Hardware UAE: Ferramentas profissionais, churrasqueiras de alto padrão, equipamentos para acampamento no deserto e jardinagem.
Gold Souk (Lojas do Mercado do Ouro): Barras de ouro puro, correntes e pulseiras em ouro 24k e joias com pedras preciosas.
Spice Souk (Lojas de Especiarias): Açafrão puro, chás medicinais, incensos árabes (Bakhoor), temperos raros e frutos secos.
Virgin Megastore UAE: Consoles de videogame, itens de cultura pop, fones de ouvido audiófilos e gadgets tecnológicos.
Day to Day: Lembrancinhas turísticas de Dubai, utilidades domésticas a preços muito populares e presentes acessíveis.