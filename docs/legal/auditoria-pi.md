# Auditoria de propriedade intelectual e difamação

> RASCUNHO para revisão jurídica. Não é aconselhamento legal. Data: 2026-10-10.

## 1. Escopo verificado

`src/sim/systems/news.ts`, `src/sim/systems/offers.ts`, `src/sim/data/stocks.generated.ts` (e `docs/empresas.md`), `src/sim/data/shop.ts`, `src/sim/storylets/content/**`, `src/sim/data/*.ts`, `src/sim/systems/ribbons.ts`, `docs/comparativo-bitlife.md`.

## 2. O que foi alterado

### 2.1 Notícias sobre empresas reais (news.ts + inglês em `src/i18n/en/ui.ts`)
As notícias negativas atribuíam a empresas reais (qualquer ação da bolsa) fatos graves ou acusações. Foram trocadas por eventos genéricos de mercado, sem imputar infração, acidente, crime ou defeito:

| Antes | Depois |
|---|---|
| enfrenta investigação regulatória na Europa | enfrenta novas regras de conformidade na Europa |
| sofre falha de segurança em serviço crítico | adia uma atualização de segurança em um serviço |
| é multado pelo regulador | paga mais que o previsto em taxas regulatórias |
| interrompe a produção após vazamento em plataforma | pausa a produção de uma plataforma para manutenção |
| faz recall de lote de medicamentos | revisa o estoque de um lote de medicamentos |
| faz recall de um produto popular | descontinua um produto popular |
| sofre ataque hacker a uma grande corretora | vê instabilidade em uma grande corretora |
| é alvo de proibição em um grande mercado | enfrenta restrições em um grande mercado |
| paralisa uma operação após acidente | paralisa uma operação para manutenção |
| enfrenta falha de rede em larga escala | enfrenta lentidão de rede em horário de pico |
| perde a confiança após uma falha na rede | perde fôlego após congestionamento na rede |
| é multada por falhas no fornecimento | paga mais com ajustes exigidos pelo regulador |
| vê estudo clínico fracassar | vê estudo clínico com resultado abaixo do esperado |

Mantidos (genéricos e plausíveis): resultados, lançamentos, contratos, greves, alta de custos, rumores com "fontes dizem" e "analistas pedem cautela", movimentos de preço e notícias macro. O prompt de IA (`buildLLMPrompt`) já proíbe acusar crime. Os rumores (kind `boato`) usam as mesmas causas suavizadas.

### 2.2 Avisos
Aviso fixo de "notícias e empresas fictícias/ilustrativas, sem recomendação de investimento" na bolsa (todas as abas) e "jogos de azar simulados, sem dinheiro real" no cassino. O texto já existente no fim da aba de notícias foi mantido.

### 2.3 Nome parecido com o BitLife
"Modo Deus" / "God Mode" é o nome do recurso premium do BitLife. Renomeado para **"Modo Destino" / "Destiny Mode"** (PT, EN, comentários e teste). "Talento especial ao nascer" também existe no BitLife ("Special Talents"), mas o termo é descritivo; mantido (decisão do dono, seção 3).

## 3. O que exige decisão do dono

1. **Marcas e empresas reais na bolsa** (100 ações e 8 cripto com nome e ticker reais; `desc` cita marcas como Facebook, Instagram, WhatsApp, Louis Vuitton, Dior, Porsche, Audi, Skoda, iPhone, Windows). Uso identificativo e descritivo é geralmente defensável, mas há risco de notificação de marca em lojas e, em alguns países, de uso de nome sem autorização. Opções: (a) manter com avisos (já feito) e remover logotipos; (b) trocar por empresas fictícias com nomes inspirados (mais seguro). Recomendação: (b) antes de monetizar.
2. **Pessoa real em descrição**: `stocks.generated.ts` cita "o lendário megainvestidor Warren Buffett" (Berkshire Hathaway). Recomendado remover o nome da pessoa (edição deve ser feita em `docs/empresas.md` e regenerar com `scripts/generate-stocks.py`; não editei o arquivo gerado).
3. **Lojas reais em `shop.ts`** (Walmart, Target, Apple Store, Best Buy, IKEA, Zara/H&M, Sephora, Uniqlo, Carrefour, Havan, Lojas Americanas, Magalu etc.) com itens e preços fictícios. Mesmo risco do item 1; considerar nomes genéricos ou fictícios. Também `world.ts` cita "fila do Starbucks" como lugar de cena. Preços de produtos de marca (iPhone, AirPods) são ilustrativos.
4. **Termos "Ribbons/fitas", "Dinastia", "Karma", pontuação por faixas**: conceitos de mecânica não protegíveis por si; nomes das 52 fitas são originais (não copiam as fitas do BitLife). Sem ação, mas revisar se quiser distância extra do BitLife.
5. **"Talento especial"**: ver 2.3; renomear (por exemplo "Dom de nascença") se quiser distância extra.
6. **docs/comparativo-bitlife.md e docs/analise.md** citam BitLife por nome. Se esses arquivos forem publicados, remover; não devem aparecer em metadados de loja (nunca usar "BitLife" em descrição, palavras-chave ou nome do app).
7. **Personagens e eventos**: não foram encontrados nomes de políticos, celebridades, partidos ou personagens protegidos (busca por nomes comuns nos storylets e dados). Política usa partidos e leis genéricos. Nomes de pessoas vêm de listas de nomes comuns.
8. **Arte e ícones**: o jogo usa emojis do sistema. Emojis de sistema têm licença da plataforma; ao empacotar para lojas, conferir licença (Noto Emoji é livre; Apple Color Emoji não pode ser distribuído).
9. **Tela do jogo e ícone do app** não devem imitar o estilo visual exato do BitLife (cores e layout de cartões). Revisar antes de enviar às lojas.
10. **Fontes de dados reais**: preços e descrições de empresas são aproximados e fictícios; manter o aviso "não são fatos".

## 4. Verificações feitas
- Busca por palavras como fraude, escândalo, investigação, acusação, morte e falência nas causas de notícia: nada restante que impute crime ou fato grave a empresa real identificável (restam "greve", "queda de vendas", "perde patente", "perde cliente", "fecha lojas após prejuízo", que são eventos comuns de mercado; revisar "fecha lojas após prejuízo" caso queira ser ainda mais conservador).
- Conteúdo sobre pessoas reais em eventos: nenhum.
