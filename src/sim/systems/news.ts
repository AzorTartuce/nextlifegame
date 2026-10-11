import { render } from '../grammar';

import { pick } from '../rng';
import { GROUP_META, SECTOR_META, type StockDef, type StockGroup, type StockSector } from '../data/market';
import type { GameState } from '../types';
import { t } from '../../i18n';

export interface NewsRequest {
  scope: 'empresa' | 'setor' | 'bolsa' | 'mundo';
  tone: 'pos' | 'neg';
  strength: 1 | 2 | 3 | 4;
  kind: 'fato' | 'boato' | 'macro';
  stock?: StockDef;
  sector?: StockSector;
  group?: StockGroup;
}

/**
 * Camada de texto das notícias. A implementação padrão é procedural (modelos de frase com variação).
 * Para plugar uma IA depois, implemente `NewsProvider` com `buildLLMPrompt` + `parseLLMResponse`
 * e use `TemplateNews` como fallback quando a chamada falhar ou demorar.
 */
export interface NewsProvider {
  headline(g: GameState, req: NewsRequest): string;
}

const CAUSES: Record<StockSector, { pos: string[]; neg: string[] }> = {
  tecnologia: {
    pos: ['lança um produto que supera as expectativas', 'fecha contrato bilionário de computação em nuvem', 'apresenta avanço em inteligência artificial', 'amplia margens com serviços por assinatura'],
    neg: ['adia o lançamento de um produto-chave', 'enfrenta investigação regulatória na Europa', 'sofre falha de segurança em serviço crítico', 'perde cliente estratégico para a concorrência'],
  },
  financeiro: {
    pos: ['reporta lucro recorde e eleva dividendos', 'vê a inadimplência cair', 'fecha aquisição que amplia a base de clientes'],
    neg: ['provisiona perdas maiores com calotes', 'é multado pelo regulador', 'reporta lucro abaixo do esperado'],
  },
  energia: {
    pos: ['descobre um novo campo de produção', 'vê o preço do petróleo favorecer as margens', 'anuncia programa de recompra de ações'],
    neg: ['interrompe a produção após vazamento em plataforma', 'corta a projeção de produção', 'enfrenta imposto extraordinário sobre lucros'],
  },
  saude: {
    pos: ['tem remédio aprovado na fase final de testes', 'anuncia resultado positivo em estudo clínico', 'amplia as vendas do tratamento líder'],
    neg: ['vê estudo clínico fracassar', 'faz recall de lote de medicamentos', 'perde a patente do produto principal'],
  },
  consumo: {
    pos: ['reajusta preços sem perder volume', 'lança linha de produtos de sucesso', 'reporta vendas acima do previsto'],
    neg: ['perde participação de mercado para marcas rivais', 'enfrenta alta nos custos de matéria-prima', 'faz recall de um produto popular'],
  },
  varejo: {
    pos: ['bate recorde de vendas em semana de promoções', 'expande lojas com retorno rápido', 'reporta fluxo recorde de clientes'],
    neg: ['reporta queda nas vendas das mesmas lojas', 'enfrenta greve em centros de distribuição', 'fecha lojas após prejuízo'],
  },
  industria: {
    pos: ['fecha pedido bilionário de equipamentos', 'anuncia uma nova fábrica', 'eleva as projeções para o ano'],
    neg: ['para uma linha de produção por falta de componentes', 'revisa entregas para baixo', 'enfrenta greve na fábrica principal'],
  },
  utilidades: {
    pos: ['recebe reajuste de tarifa favorável', 'tem investimento aprovado pelo regulador', 'reduz perdas operacionais'],
    neg: ['sofre com a seca que reduz a geração', 'tem reajuste de tarifa negado', 'é multada por falhas no fornecimento'],
  },
  telecom: {
    pos: ['soma milhões de clientes com pacote de fibra', 'vê a receita por usuário crescer'],
    neg: ['perde clientes para a operadora rival', 'enfrenta falha de rede em larga escala', 'paga mais caro que o previsto em leilão de espectro'],
  },
  imobiliario: {
    pos: ['vende um lançamento inteiro em poucas horas', 'reporta recorde de reservas', 'vê demanda forte por novos bairros'],
    neg: ['adia a entrega de empreendimentos', 'vê os distratos de vendas subirem', 'sofre com juros altos que travam compradores'],
  },
  materiais: {
    pos: ['se beneficia da alta no preço da commodity', 'reporta produção recorde', 'fecha contrato de longo prazo com compradores asiáticos'],
    neg: ['vê a demanda da China enfraquecer', 'paralisa uma operação após acidente', 'reporta queda no preço de venda'],
  },
  cripto: {
    pos: ['recebe adoção anunciada por um grande banco', 'ganha aprovação de um fundo regulado', 'bate recorde de transações na rede'],
    neg: ['sofre ataque hacker a uma grande corretora', 'é alvo de proibição em um grande mercado', 'perde a confiança após uma falha na rede'],
  },
  luxo: {
    pos: ['vê a demanda aumentar na Ásia', 'lança uma coleção que esgota em dias', 'reporta vendas recordes'],
    neg: ['sofre com a desaceleração do consumo de luxo', 'vê as vendas caírem na China', 'emite alerta de lucro'],
  },
};

const MOVE: Record<'pos' | 'neg', Record<1 | 2 | 3 | 4, string>> = {
  pos: { 1: '[sobem levemente|ensaiam alta|avançam]', 2: '[sobem forte|ganham tração|saltam]', 3: '[disparam|vivem dia de euforia]', 4: '[explodem|têm a maior alta em anos]' },
  neg: { 1: '[recuam|cedem|perdem força]', 2: '[caem forte|sofrem pressão vendedora]', 3: '[despencam|afundam]', 4: '[derretem|têm a maior queda em anos]' },
};

const REACTION = { pos: '[comemoram|ficam otimistas|aumentam as posições]', neg: '[correm para vender|ficam apreensivos|reavaliam a posição]' } as const;

const MACRO_REASON = {
  pos: ['dados de emprego fortes', 'expectativa de corte de juros', 'balanços acima do esperado', 'otimismo com estímulos econômicos'],
  neg: ['temor de alta de juros', 'inflação mais forte que o previsto', 'tensão geopolítica', 'aversão global a risco'],
};

export const TemplateNews: NewsProvider = {
  headline(g, req) {
    const { tone, strength } = req;
    const move = t(MOVE[tone][strength]);
    if (req.scope === 'empresa' && req.stock) {
      const causes = CAUSES[req.stock.sector][tone];
      const cause = t(pick(g, causes));
      const frames =
        req.kind === 'boato'
          ? [t('Rumores: {emp} {causa}, segundo fontes.'), t('Fontes dizem que {emp} {causa}; a empresa não comenta.'), t('Boato no mercado: {emp} {causa}. Analistas pedem cautela.')]
          : [t('{emp} {causa}; ações {mov} no pré-mercado.'), t('Mercado reage: {emp} {causa} e papéis {mov}.'), t('{emp} {causa}. Investidores {reacao}.')];
      return render(g, pick(g, frames).replace('{causa}', cause).replace('{mov}', move).replace('{reacao}', t(REACTION[tone])), { emp: req.stock.name });
    }
    if (req.scope === 'setor' && req.sector) {
      const reason = t(pick(g, MACRO_REASON[tone]));
      return render(g, t('Setor de {v}: ações {move} com {reason}.', { v: t(SECTOR_META[req.sector].name).toLowerCase(), move, reason }));
    }
    if (req.scope === 'bolsa' && req.group) {
      const reason = t(pick(g, MACRO_REASON[tone]));
      return render(g, t('{group} {move} com {reason}.', { group: t(GROUP_META[req.group].name), move: tone === 'pos' ? t('[sobem|fecham em alta|avançam]') : t('[recuam|fecham em queda|caem]'), reason }));
    }
    return tone === 'pos'
      ? render(g, pick(g, [t('Euforia nos mercados: bolsas globais renovam máximas.'), t('Onda de otimismo: investidores voltam a comprar risco no mundo todo.')]))
      : render(g, pick(g, [t('Pânico global: bolsas despencam em dia de vendas generalizadas.'), t('Crise de confiança sacode os mercados: investidores fogem das ações.')]));
  },
};

/** Prompt para uma IA gerar a manchete (mesmo formato descrito em docs/sistemastock.md). */
export function buildLLMPrompt(req: NewsRequest): string {
  const range = { 1: [0.03, 0.08], 2: [0.08, 0.18], 3: [0.18, 0.35], 4: [0.35, 0.5] }[req.strength];
  const sign = req.tone === 'pos' ? 1 : -1;
  const [a, b] = range.map((v) => (v * sign).toFixed(2)).sort((x, y) => Number(x) - Number(y));
  const subject = req.stock ? `a empresa ${req.stock.name} (${req.stock.ticker}, setor ${SECTOR_META[req.stock.sector].name})` : req.sector ? `o setor de ${SECTOR_META[req.sector].name}` : req.group ? GROUP_META[req.group].name : 'o mercado global';
  return `Gere uma manchete de jornal curta, em português, sobre ${subject}, com tom ${req.tone === 'pos' ? 'positivo' : 'negativo'}. ` +
    `Não acuse ninguém de crime. Defina o impacto nas ações (de ${a} a ${b}). ` +
    'Responda apenas com JSON: {"manchete": string, "impacto": number}.';
}

/** Valida a resposta da IA; devolve null se vier malformada (o chamador usa TemplateNews). */
export function parseLLMResponse(raw: string, maxAbs = 0.5): { headline: string; impact: number } | null {
  try {
    const data = JSON.parse(raw.trim().replace(/^```(?:json)?|```$/g, ''));
    const headline = typeof data.manchete === 'string' ? data.manchete.trim() : '';
    const impact = Number(data.impacto);
    if (!headline || headline.length > 220 || !Number.isFinite(impact)) return null;
    return { headline, impact: Math.max(-maxAbs, Math.min(maxAbs, impact)) };
  } catch {
    return null;
  }
}

export const strengthLabel = (s: 1 | 2 | 3 | 4) => ['', 'leve', 'moderado', 'forte', 'extremo'][s];

/** Frases-base das notícias (usadas pelo teste de cobertura do inglês). */
export const NEWS_PHRASES: string[] = [
  ...Object.values(CAUSES).flatMap((c) => [...c.pos, ...c.neg]),
  ...Object.values(MOVE).flatMap((m) => Object.values(m)),
  ...Object.values(REACTION),
  ...MACRO_REASON.pos,
  ...MACRO_REASON.neg,
];
