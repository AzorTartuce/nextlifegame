import type { StatKey } from '../types';

export type Region = 'eua' | 'brasil' | 'europa' | 'asia' | 'emirados';

export type ItemCat =
  // consumíveis
  | 'mercado' | 'fastfood' | 'doces' | 'bebida' | 'remedio' | 'suplemento' | 'beleza' | 'presente' | 'refeicao'
  // duráveis
  | 'celular' | 'notebook' | 'console' | 'tv' | 'audio' | 'camera' | 'gadget' | 'eletro' | 'movel' | 'decor'
  | 'roupa' | 'social' | 'calcado' | 'bolsa' | 'relogio' | 'joia' | 'ouro' | 'esporte' | 'instrumento'
  | 'livro' | 'colecao' | 'ferramenta' | 'outdoor' | 'reforma'
  // bens de alto custo
  | 'carro' | 'imovel' | 'lancha' | 'aviao' | 'fazenda';

/** Bônus passivos de um bem. Todos positivos = bom (calma reduz o estresse). */
export interface Passive {
  status?: number;
  prod?: number;
  mood?: number;
  health?: number;
  calm?: number;
  look?: number;
  learn?: number;
}

export type ImmediateEffects = Partial<Record<StatKey, number>>;

export interface CatDef {
  label: string;
  icon: string;
  kind: 'consumivel' | 'duravel' | 'ativo';
  /** local: o preço é em unidades internas (acompanha a renda); global: em dólares (acompanha o câmbio). */
  pricing: 'local' | 'global';
  /** Preço de referência (na unidade do `pricing`) que gera efeito 1,0x. */
  ref: number;
  /** Efeito imediato (consumíveis) ou "alegria da compra" (duráveis). */
  now?: ImmediateEffects;
  /** Quanto a compra pesa na saúde oculta (negativo = melhora). */
  junk?: number;
  slot?: string;
  cap?: number;
  passive?: Passive;
  /** Perda de valor/efeito com o tempo. */
  fade?: 'tech' | 'moda';
  /** Depreciação anual do valor (negativo = valoriza). */
  dep: number;
  floor: number;
  /** Custo anual de manutenção, em fração do preço pago. */
  upkeep?: number;
}

export const CATS: Record<ItemCat, CatDef> = {
  mercado: { label: 'Mercado', icon: '🛒', kind: 'consumivel', pricing: 'local', ref: 90, now: { felicidade: 1.5, saude: 1.5, estresse: -1 }, dep: 1, floor: 0 },
  fastfood: { label: 'Fast food', icon: '🍔', kind: 'consumivel', pricing: 'local', ref: 18, now: { felicidade: 3 }, junk: 1.2, dep: 1, floor: 0 },
  doces: { label: 'Doces e snacks', icon: '🍫', kind: 'consumivel', pricing: 'local', ref: 14, now: { felicidade: 2.2, estresse: -0.5 }, junk: 0.5, dep: 1, floor: 0 },
  bebida: { label: 'Bebidas', icon: '🍷', kind: 'consumivel', pricing: 'local', ref: 45, now: { felicidade: 2.5, estresse: -2.5, saude: -0.5 }, junk: 0.3, dep: 1, floor: 0 },
  remedio: { label: 'Farmácia', icon: '💊', kind: 'consumivel', pricing: 'local', ref: 35, now: { saude: 3 }, junk: -1.5, dep: 1, floor: 0 },
  suplemento: { label: 'Suplementos', icon: '🏋️', kind: 'consumivel', pricing: 'local', ref: 50, now: { saude: 2 }, junk: -0.5, dep: 1, floor: 0 },
  beleza: { label: 'Beleza e perfumaria', icon: '🧴', kind: 'consumivel', pricing: 'local', ref: 60, now: { aparencia: 1.2, carisma: 0.8, felicidade: 1 }, dep: 1, floor: 0 },
  presente: { label: 'Presentes e lembranças', icon: '🎁', kind: 'consumivel', pricing: 'local', ref: 30, now: { felicidade: 2 }, dep: 1, floor: 0 },
  refeicao: { label: 'Refeições prontas', icon: '🍱', kind: 'consumivel', pricing: 'local', ref: 25, now: { felicidade: 2.2, estresse: -1.2 }, junk: 0.4, dep: 1, floor: 0 },

  celular: { label: 'Celular', icon: '📱', kind: 'duravel', pricing: 'global', ref: 500, slot: 'celular', cap: 1, passive: { status: 5, prod: 2.5, mood: 1 }, fade: 'tech', dep: 0.28, floor: 0.06 },
  notebook: { label: 'Computador', icon: '💻', kind: 'duravel', pricing: 'global', ref: 900, slot: 'notebook', cap: 1, passive: { prod: 5, status: 2, mood: 0.5, learn: 0.2 }, fade: 'tech', dep: 0.28, floor: 0.06 },
  console: { label: 'Videogame', icon: '🎮', kind: 'duravel', pricing: 'global', ref: 450, slot: 'console', cap: 1, passive: { mood: 3, calm: 1.5, status: 1 }, fade: 'tech', dep: 0.25, floor: 0.08 },
  tv: { label: 'TV', icon: '📺', kind: 'duravel', pricing: 'global', ref: 600, slot: 'tv', cap: 1, passive: { mood: 2, calm: 1, status: 1 }, fade: 'tech', dep: 0.22, floor: 0.08 },
  audio: { label: 'Áudio', icon: '🎧', kind: 'duravel', pricing: 'global', ref: 250, slot: 'audio', cap: 1, passive: { mood: 1.5, prod: 1, calm: 1, status: 2 }, fade: 'tech', dep: 0.22, floor: 0.08 },
  camera: { label: 'Câmera', icon: '📷', kind: 'duravel', pricing: 'global', ref: 800, slot: 'camera', cap: 1, passive: { mood: 1, status: 3, prod: 1 }, fade: 'tech', dep: 0.2, floor: 0.1 },
  gadget: { label: 'Gadgets', icon: '🔌', kind: 'duravel', pricing: 'global', ref: 150, slot: 'gadget', cap: 3, passive: { mood: 1, status: 1.2, prod: 0.5 }, fade: 'tech', dep: 0.28, floor: 0.05 },
  eletro: { label: 'Eletrodomésticos', icon: '🧺', kind: 'duravel', pricing: 'local', ref: 350, slot: 'eletro', cap: 3, passive: { calm: 1.2, mood: 0.4, prod: 0.4 }, dep: 0.12, floor: 0.1 },
  movel: { label: 'Móveis', icon: '🛋️', kind: 'duravel', pricing: 'local', ref: 300, slot: 'decor', cap: 4, passive: { mood: 1.2, calm: 1.2, status: 1 }, dep: 0.12, floor: 0.12 },
  decor: { label: 'Decoração', icon: '🪴', kind: 'duravel', pricing: 'local', ref: 80, slot: 'decor', cap: 4, passive: { mood: 0.8, calm: 0.8 }, dep: 0.15, floor: 0.1 },
  roupa: { label: 'Roupas', icon: '👕', kind: 'duravel', pricing: 'local', ref: 70, slot: 'roupa', cap: 1, passive: { look: 2.5, status: 2.5, mood: 0.4 }, fade: 'moda', dep: 0.4, floor: 0.05 },
  social: { label: 'Traje social', icon: '👔', kind: 'duravel', pricing: 'local', ref: 220, slot: 'social', cap: 1, passive: { look: 4, status: 3.5, prod: 0.5 }, fade: 'moda', dep: 0.25, floor: 0.08 },
  calcado: { label: 'Calçados', icon: '👟', kind: 'duravel', pricing: 'local', ref: 110, slot: 'calcado', cap: 1, passive: { look: 1.2, status: 1.5, health: 0.3 }, fade: 'moda', dep: 0.35, floor: 0.05 },
  bolsa: { label: 'Bolsas', icon: '👜', kind: 'duravel', pricing: 'global', ref: 600, slot: 'bolsa', cap: 1, passive: { status: 5, look: 1.5 }, fade: 'moda', dep: 0.08, floor: 0.3 },
  relogio: { label: 'Relógios', icon: '⌚', kind: 'duravel', pricing: 'global', ref: 900, slot: 'relogio', cap: 1, passive: { status: 6, look: 0.8 }, dep: 0.03, floor: 0.5 },
  joia: { label: 'Joias', icon: '💍', kind: 'duravel', pricing: 'global', ref: 800, slot: 'joia', cap: 2, passive: { status: 5, look: 2, mood: 0.4 }, dep: 0.02, floor: 0.6 },
  ouro: { label: 'Ouro', icon: '🪙', kind: 'duravel', pricing: 'global', ref: 1500, slot: 'ouro', cap: 5, passive: { status: 1.5 }, dep: 0, floor: 1 },
  esporte: { label: 'Esporte', icon: '🚴', kind: 'duravel', pricing: 'local', ref: 140, slot: 'esporte', cap: 2, passive: { health: 1.5, mood: 0.6 }, dep: 0.18, floor: 0.1 },
  instrumento: { label: 'Instrumentos', icon: '🎸', kind: 'duravel', pricing: 'global', ref: 400, slot: 'instrumento', cap: 1, passive: { mood: 2, calm: 1.5, status: 1, learn: 0.3 }, dep: 0.08, floor: 0.3 },
  livro: { label: 'Livros', icon: '📚', kind: 'duravel', pricing: 'local', ref: 25, slot: 'livro', cap: 10, passive: { learn: 0.25, mood: 0.15 }, dep: 0.2, floor: 0.1 },
  colecao: { label: 'Colecionáveis', icon: '🧸', kind: 'duravel', pricing: 'global', ref: 40, slot: 'colecao', cap: 10, passive: { mood: 0.5, status: 0.4 }, dep: 0, floor: 1 },
  ferramenta: { label: 'Ferramentas', icon: '🧰', kind: 'duravel', pricing: 'local', ref: 120, slot: 'ferramenta', cap: 2, passive: { prod: 1.2, mood: 0.2 }, dep: 0.1, floor: 0.2 },
  outdoor: { label: 'Lazer ao ar livre', icon: '🏕️', kind: 'duravel', pricing: 'local', ref: 200, slot: 'outdoor', cap: 2, passive: { mood: 1.2, health: 0.8, calm: 1 }, dep: 0.12, floor: 0.15 },
  reforma: { label: 'Reforma da casa', icon: '🪟', kind: 'duravel', pricing: 'local', ref: 300, slot: 'reforma', cap: 3, passive: { mood: 1.2, status: 1.2, calm: 0.8 }, dep: 0.05, floor: 0.4 },

  carro: { label: 'Carros', icon: '🚗', kind: 'ativo', pricing: 'global', ref: 25000, slot: 'carro', cap: 1, passive: { status: 12, prod: 2.5, mood: 1.5, calm: 0.5 }, dep: 0.12, floor: 0.15, upkeep: 0.06 },
  imovel: { label: 'Imóveis', icon: '🏠', kind: 'ativo', pricing: 'local', ref: 250000, slot: 'imovel', cap: 1, passive: { status: 12, mood: 4, calm: 3 }, dep: -0.03, floor: 1, upkeep: 0.015 },
  aviao: { label: 'Aviões', icon: '🛩️', kind: 'ativo', pricing: 'global', ref: 1000000, slot: 'aviao', cap: 1, passive: { status: 16, mood: 3, calm: 2 }, dep: 0.05, floor: 0.3, upkeep: 0.08 },
  fazenda: { label: 'Fazendas', icon: '🌾', kind: 'ativo', pricing: 'local', ref: 600000, slot: 'fazenda', cap: 2, passive: { status: 11, mood: 3, calm: 3 }, dep: -0.02, floor: 1, upkeep: 0.02 },
  lancha: { label: 'Lanchas', icon: '🛥️', kind: 'ativo', pricing: 'global', ref: 120000, slot: 'lancha', cap: 1, passive: { status: 14, mood: 3.5, calm: 2 }, dep: 0.08, floor: 0.2, upkeep: 0.1 },
};

export const CAT_IDS = Object.keys(CATS) as ItemCat[];

export interface ShopItem {
  id: string;
  store: string;
  name: string;
  desc?: string;
  cat: ItemCat;
  /** Preço de tabela, na unidade definida por `pricing` (já com o fator da loja). */
  price: number;
  pricing: 'local' | 'global';
  now: ImmediateEffects;
  passive: Passive;
  junk: number;
  gacha?: boolean;
  /** Ofertas únicas geradas pelo jogo (não existem no catálogo fixo). */
  unique?: boolean;
}

export type Tier = 'budget' | 'mid' | 'premium' | 'luxury';
export const TIER_MULT: Record<Tier, number> = { budget: 0.85, mid: 1, premium: 1.3, luxury: 1.8 };
export const TIER_LABEL: Record<Tier, string> = { budget: 'Econômica', mid: 'Padrão', premium: 'Premium', luxury: 'Luxo' };

export interface StoreDef {
  id: string;
  name: string;
  region: Region | 'all';
  tier: Tier;
  icon: string;
  desc: string;
  /** Ação listada na bolsa ligada à marca. */
  ticker?: string;
  /** Força preço global (em dólares) para todos os itens, ex.: moda de marca internacional. */
  global?: boolean;
  items: ShopItem[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Escala os efeitos pelo preço do item em relação ao preço de referência da categoria. */
export function qualityFactor(price: number, ref: number): number {
  return Math.min(3, Math.max(0.6, Math.pow(price / ref, 0.45)));
}

export function scalePassive(p: Passive, q: number): Passive {
  const out: Passive = {};
  for (const [k, v] of Object.entries(p) as [keyof Passive, number][]) out[k] = round1(v * q);
  return out;
}

export function scaleNow(e: ImmediateEffects, q: number): ImmediateEffects {
  const out: ImmediateEffects = {};
  for (const [k, v] of Object.entries(e) as [StatKey, number][]) out[k] = round1(v * q);
  return out;
}

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

type ItemRow = [name: string, cat: ItemCat, price: number, opts?: { gacha?: boolean; global?: boolean; local?: boolean; desc?: string }];

function makeItem(store: string, tier: Tier, storeGlobal: boolean | undefined, row: ItemRow): ShopItem {
  const [name, cat, price, opts] = row;
  const def = CATS[cat];
  const pricing = opts?.global ? 'global' : opts?.local ? 'local' : storeGlobal ? 'global' : def.pricing;
  const mult = TIER_MULT[tier];
  const q = qualityFactor(price, def.ref);
  const now = def.kind === 'consumivel' ? scaleNow(def.now ?? {}, q) : { felicidade: round1((def.kind === 'ativo' ? 3 : 1.2) * Math.min(q, 2)) };
  return {
    id: `${store}:${slug(name)}`,
    store,
    name,
    desc: opts?.desc,
    cat,
    price: Math.round(price * mult * 100) / 100,
    pricing,
    now,
    passive: def.kind === 'consumivel' ? {} : scalePassive(def.passive ?? {}, q),
    junk: def.junk ?? 0,
    gacha: opts?.gacha,
  };
}

function store(id: string, name: string, region: Region | 'all', tier: Tier, icon: string, desc: string, rows: ItemRow[], extra: { ticker?: string; global?: boolean } = {}): StoreDef {
  return { id, name, region, tier, icon, desc, ticker: extra.ticker, global: extra.global, items: rows.map((r) => makeItem(id, tier, extra.global, r)) };
}

export const STORES: StoreDef[] = [
  // ---------- Estados Unidos ----------
  store('walmart', 'Walmart', 'eua', 'budget', '🛒', 'Alimentos em geral, eletrônicos básicos, roupas populares, utilidades domésticas, brinquedos e cosméticos.', [
    ['Compras da semana', 'mercado', 85], ['TV 43" básica', 'tv', 250], ['Kit de roupas populares', 'roupa', 45],
    ['Utilidades domésticas', 'eletro', 90], ['Brinquedos para presente', 'presente', 35], ['Cosméticos básicos', 'beleza', 30],
  ], { ticker: 'WMT' }),
  store('target', 'Target', 'eua', 'mid', '🎯', 'Artigos de decoração, roupas casuais de moda, eletrônicos, produtos de beleza e mantimentos.', [
    ['Mantimentos', 'mercado', 100], ['Decoração para a sala', 'decor', 90], ['Roupa casual de moda', 'roupa', 70],
    ['Smart speaker', 'gadget', 60], ['Kit de beleza', 'beleza', 50],
  ]),
  store('bestbuy', 'Best Buy', 'eua', 'mid', '🔌', 'Computadores, notebooks, consoles de videogame, smart TVs, smartphones e fones de ouvido.', [
    ['Notebook ultrafino', 'notebook', 1100], ['Notebook básico', 'notebook', 550], ['Console de última geração', 'console', 500],
    ['Smart TV 65" 4K', 'tv', 900], ['Smartphone intermediário', 'celular', 450], ['Fones sem fio', 'audio', 200],
  ]),
  store('apple', 'Apple Store', 'eua', 'mid', '🍎', 'iPhones, MacBooks, iPads, Apple Watch, AirPods e acessórios oficiais da marca.', [
    ['iPhone de última geração', 'celular', 999], ['MacBook Pro', 'notebook', 1999], ['iPad', 'gadget', 599],
    ['Apple Watch', 'gadget', 399], ['AirPods', 'audio', 249],
  ], { ticker: 'AAPL' }),
  store('homedepot', 'The Home Depot', 'eua', 'mid', '🔨', 'Ferramentas, materiais de construção, tintas, móveis para jardim e equipamentos de reforma.', [
    ['Kit de ferramentas', 'ferramenta', 140], ['Furadeira profissional', 'ferramenta', 220], ['Tinta e rolos (reforma da sala)', 'reforma', 160],
    ['Móveis de jardim', 'outdoor', 320], ['Reforma completa do banheiro', 'reforma', 900],
  ], { ticker: 'HD' }),
  store('costco', 'Costco', 'eua', 'budget', '📦', 'Compras em atacado: alimentos, bebidas, eletrônicos, pneus e eletrodomésticos em grandes embalagens.', [
    ['Compras em atacado', 'mercado', 180], ['Geladeira french-door', 'eletro', 1400], ['TV 55"', 'tv', 550],
    ['Pizza gigante e rosquinhas', 'fastfood', 24], ['Suplementos em pote gigante', 'suplemento', 45],
  ], { ticker: 'COST' }),
  store('cvs', 'CVS / Walgreens', 'eua', 'mid', '💊', 'Medicamentos, suplementos, cosméticos, snacks, bebidas e itens de higiene pessoal.', [
    ['Remédios e vitaminas', 'remedio', 40], ['Suplemento de proteína', 'suplemento', 55], ['Perfume de farmácia', 'beleza', 35],
    ['Snacks e refrigerante', 'doces', 14], ['Kit de higiene', 'beleza', 25],
  ]),
  store('traderjoes', "Trader Joe's", 'eua', 'mid', '🥑', 'Alimentos orgânicos, pratos congelados gourmet, vinhos, queijos artesanais e snacks exclusivos.', [
    ['Cesta orgânica', 'mercado', 110], ['Prato congelado gourmet', 'refeicao', 20], ['Vinho da casa', 'bebida', 25],
    ['Queijos artesanais', 'mercado', 55], ['Snacks exclusivos', 'doces', 10],
  ]),
  store('saks', "Saks Fifth Avenue / Macy's", 'eua', 'luxury', '🛍️', 'Roupas de grife, perfumes importados, maquiagens de alto padrão, sapatos e bolsas de luxo.', [
    ['Casaco de grife', 'social', 1800], ['Terno sob medida', 'social', 2400], ['Perfume importado', 'beleza', 180],
    ['Sapatos de couro', 'calcado', 650], ['Bolsa de luxo', 'bolsa', 2800], ['Maquiagem de alto padrão', 'beleza', 120],
  ], { global: true }),
  store('barnes', 'Barnes & Noble', 'eua', 'mid', '📖', 'Livros, mangás, jogos de tabuleiro, artigos de papelaria e colecionáveis da cultura pop.', [
    ['Romance best-seller', 'livro', 20], ['Coleção de mangás', 'livro', 60], ['Jogo de tabuleiro', 'colecao', 55],
    ['Papelaria premium', 'presente', 25], ['Colecionável de cultura pop', 'colecao', 90],
  ]),

  // ---------- Brasil ----------
  store('magalu', 'Casas Bahia / Magalu', 'brasil', 'budget', '🛋️', 'Eletrodomésticos, celulares, móveis, smart TVs, notebooks e utilidades para o lar.', [
    ['Geladeira frost-free', 'eletro', 600], ['Smartphone popular', 'celular', 250], ['Sofá retrátil', 'movel', 350],
    ['Smart TV 50"', 'tv', 400], ['Notebook de entrada', 'notebook', 500],
  ]),
  store('carrefour', 'Carrefour / Pão de Açúcar', 'brasil', 'mid', '🥖', 'Alimentos, bebidas, produtos de limpeza, carnes nobres, hortifrúti e itens de padaria.', [
    ['Compras do mês', 'mercado', 130], ['Carnes nobres para o churrasco', 'mercado', 90], ['Padaria: pão e café', 'refeicao', 12],
    ['Hortifrúti', 'mercado', 45], ['Vinho nacional', 'bebida', 22],
  ]),
  store('americanas', 'Lojas Americanas', 'brasil', 'budget', '🍫', 'Chocolates, doces, brinquedos, utilidades domésticas de pequeno porte, papelaria e jogos.', [
    ['Chocolates e doces', 'doces', 15], ['Brinquedos', 'presente', 30], ['Utilidades domésticas', 'decor', 35],
    ['Caderno e papelaria', 'livro', 15], ['Jogo de tabuleiro', 'colecao', 30],
  ]),
  store('fastshop', 'Fast Shop', 'brasil', 'premium', '📺', 'Eletrônicos premium, smart TVs de última geração, notebooks de alta performance e eletrodomésticos modernos.', [
    ['Smart TV 8K', 'tv', 2200], ['Notebook de alta performance', 'notebook', 2200], ['Eletrodoméstico inteligente', 'eletro', 1200],
    ['Soundbar premium', 'audio', 600], ['Cafeteira de barista', 'eletro', 700],
  ]),
  store('renner', 'Lojas Renner / C&A', 'brasil', 'mid', '👗', 'Roupas masculinas e femininas, calçados, acessórios de moda, lingerie e perfumes.', [
    ['Look completo casual', 'roupa', 110], ['Tênis casual', 'calcado', 90], ['Vestido de festa', 'social', 160],
    ['Terno slim', 'social', 230], ['Perfume nacional', 'beleza', 45], ['Bolsa de couro', 'bolsa', 180, { local: true }],
  ]),
  store('raia', 'Droga Raia / Drogasil', 'brasil', 'mid', '💊', 'Medicamentos, dermocosméticos, produtos para cuidados com bebês e suplementos alimentares.', [
    ['Remédios', 'remedio', 45], ['Dermocosméticos', 'beleza', 70], ['Suplementos alimentares', 'suplemento', 60], ['Vitaminas', 'remedio', 30],
  ], { ticker: 'RADL3' }),
  store('leroy', 'Leroy Merlin', 'brasil', 'mid', '🪛', 'Materiais de reforma, iluminação, ferramentas manuais e elétricas, pisos e artigos de decoração.', [
    ['Kit de pisos', 'reforma', 700], ['Iluminação LED', 'reforma', 180], ['Ferramentas elétricas', 'ferramenta', 260],
    ['Artigos de decoração', 'decor', 90], ['Jardim e churrasqueira', 'outdoor', 450],
  ]),
  store('vivara', 'Vivara', 'brasil', 'premium', '💎', 'Joias em ouro e prata, relógios de luxo, alianças e acessórios refinados.', [
    ['Aliança de ouro', 'joia', 600], ['Colar de prata', 'joia', 220], ['Brincos de ouro', 'joia', 380], ['Relógio de luxo', 'relogio', 1400],
  ]),
  store('centauro', 'Centauro', 'brasil', 'mid', '⚽', 'Tênis esportivos, camisas oficiais de futebol, roupas de academia, suplementos e equipamentos de treino.', [
    ['Tênis esportivo', 'calcado', 130], ['Camisa oficial de time', 'roupa', 75], ['Roupas de academia', 'roupa', 60],
    ['Suplementos', 'suplemento', 50], ['Kit de halteres', 'esporte', 180], ['Bicicleta ergométrica', 'esporte', 420],
  ]),
  store('havan', 'Havan', 'brasil', 'budget', '🏬', 'Artigos para cama, mesa e banho, brinquedos, utilidades do lar e eletrodomésticos variados.', [
    ['Jogo de cama e banho', 'decor', 70], ['Brinquedos', 'presente', 40], ['Liquidificador', 'eletro', 60],
    ['Air fryer', 'eletro', 110], ['Utilidades do lar', 'decor', 45],
  ]),

  // ---------- Europa ----------
  store('ikea', 'IKEA', 'europa', 'budget', '🪑', 'Móveis modulares, decoração minimalista, iluminação inteligente, utensílios de cozinha e artigos de cama.', [
    ['Sofá modular', 'movel', 450], ['Estante minimalista', 'movel', 150], ['Iluminação inteligente', 'gadget', 80],
    ['Utensílios de cozinha', 'decor', 50], ['Kit de cama', 'decor', 90], ['Almôndegas suecas', 'refeicao', 10],
  ]),
  store('tesco', 'Carrefour Express / Tesco', 'europa', 'mid', '🧀', 'Compras rápidas do dia a dia, pães frescos, queijos europeus, vinhos e refeições prontas.', [
    ['Compras rápidas', 'mercado', 70], ['Pão fresco e queijos', 'mercado', 45], ['Vinho', 'bebida', 30],
    ['Refeição pronta', 'refeicao', 14], ['Sanduíche de supermercado', 'fastfood', 8],
  ]),
  store('mediamarkt', "MediaMarkt / Curry's", 'europa', 'mid', '🖥️', 'Hardware para computadores, videogames, câmeras fotográficas e eletrodomésticos.', [
    ['PC montado com placa de vídeo', 'notebook', 1800], ['Console + jogo', 'console', 520], ['Câmera mirrorless', 'camera', 900],
    ['Máquina de lavar', 'eletro', 500], ['Smartphone', 'celular', 600],
  ]),
  store('zara', 'Zara / H&M', 'europa', 'mid', '🧥', 'Roupas no estilo fast fashion, casacos de inverno, calçados e acessórios urbanos.', [
    ['Casaco de inverno', 'roupa', 120], ['Jaqueta urbana', 'roupa', 90], ['Blazer de trabalho', 'social', 180],
    ['Tênis urbano', 'calcado', 80], ['Peças básicas (kit)', 'roupa', 50],
  ], { global: true }),
  store('sephora', 'Sephora', 'europa', 'premium', '💄', 'Maquiagens importadas, perfumes de alta perfumaria, tratamentos para pele e produtos capilares.', [
    ['Perfume de alta perfumaria', 'beleza', 150], ['Kit de maquiagem importada', 'beleza', 110], ['Tratamento de pele', 'beleza', 90], ['Produtos capilares', 'beleza', 45],
  ], { ticker: 'MC' }),
  store('harrods', 'Harrods / Galeries Lafayette', 'europa', 'luxury', '👑', 'Artigos de luxo extremo, alta costura, relógios suíços, champagne e perfumes exclusivos.', [
    ['Bolsa de alta costura', 'bolsa', 4500], ['Relógio suíço', 'relogio', 7500], ['Champagne vintage', 'bebida', 280],
    ['Perfume exclusivo', 'beleza', 420], ['Smoking sob medida', 'social', 3800],
  ], { global: true }),
  store('decathlon', 'Decathlon', 'europa', 'budget', '🚵', 'Equipamentos de camping, bicicletas, roupas térmicas, artigos de mergulho e acessórios fitness.', [
    ['Bicicleta urbana', 'esporte', 350], ['Barraca de camping', 'outdoor', 180], ['Roupas térmicas', 'roupa', 70],
    ['Equipamento de mergulho', 'outdoor', 420], ['Acessórios fitness', 'esporte', 60],
  ]),
  store('fnac', 'Fnac', 'europa', 'mid', '🎵', 'Livros, quadrinhos, discos de vinil, notebooks, consoles de videogame e instrumentos musicais.', [
    ['Livros e quadrinhos', 'livro', 22], ['Toca-discos e vinis', 'audio', 350], ['Violão', 'instrumento', 280],
    ['Teclado musical', 'instrumento', 420], ['Console + jogo', 'console', 500],
  ]),
  store('boots', 'Boots', 'europa', 'mid', '🧼', 'Skincare, cosméticos, medicamentos isentos de prescrição, vitaminas e cuidados pessoais.', [
    ['Skincare', 'beleza', 40], ['Vitaminas', 'remedio', 25], ['Remédios sem receita', 'remedio', 20], ['Cuidados pessoais', 'beleza', 22],
  ]),
  store('lidl', 'Lidl / Aldi', 'europa', 'budget', '🛒', 'Supermercados de desconto com alimentos básicos, itens sazonais importados e utensílios promocionais.', [
    ['Compras de desconto', 'mercado', 55], ['Itens sazonais importados', 'presente', 20], ['Utensílios promocionais', 'decor', 25],
    ['Pizza congelada', 'fastfood', 6], ['Cerveja e snacks', 'bebida', 15],
  ]),

  // ---------- Ásia ----------
  store('donki', 'Don Quijote (Donki)', 'asia', 'budget', '🦉', 'Snacks exóticos, cosméticos japoneses, eletrônicos curiosos, fantasias, lembrancinhas e bebidas.', [
    ['Snacks exóticos', 'doces', 16], ['Cosméticos japoneses', 'beleza', 40], ['Gadget curioso', 'gadget', 60],
    ['Fantasia', 'presente', 45], ['Lembrancinhas', 'presente', 20], ['Bebidas japonesas', 'bebida', 18],
  ]),
  store('konbini', '7-Eleven / FamilyMart', 'asia', 'budget', '🏪', 'Marmitas japonesas (bento), doces locais, bebidas quentes e geladas, guarda-chuvas e itens de conveniência 24h.', [
    ['Bento japonês', 'refeicao', 7], ['Onigiri e chá gelado', 'refeicao', 5], ['Doces locais', 'doces', 5],
    ['Lanche 24h', 'fastfood', 6], ['Guarda-chuva', 'presente', 10],
  ]),
  store('biccamera', 'Bic Camera / Yodobashi', 'asia', 'premium', '📷', 'Câmeras profissionais, componentes de PC, gadgets tecnológicos, relógios e figures colecionáveis.', [
    ['Câmera profissional', 'camera', 2600], ['Kit de componentes de PC', 'notebook', 1400], ['Gadget tecnológico', 'gadget', 250],
    ['Relógio inteligente', 'gadget', 330], ['Figure colecionável', 'colecao', 150],
  ]),
  store('oliveyoung', 'Olive Young', 'asia', 'mid', '🌿', 'Produtos de K-Beauty, máscaras faciais, cosméticos, dermocosméticos e tratamentos para a pele.', [
    ['Sérum e máscaras K-beauty', 'beleza', 55], ['Dermocosméticos', 'beleza', 65], ['Cosméticos coreanos', 'beleza', 40], ['Tratamento de pele completo', 'beleza', 130],
  ]),
  store('uniqlo', 'Uniqlo', 'asia', 'mid', '🧣', 'Roupas básicas de alta tecnologia (como tecidos térmicos Heattech), casacos leves e moda casual minimalista.', [
    ['Heattech: camada térmica', 'roupa', 40], ['Casaco leve', 'roupa', 70], ['Moda casual minimalista', 'roupa', 55], ['Calça versátil', 'roupa', 45],
  ], { global: true }),
  store('popmart', 'Pop Mart', 'asia', 'mid', '🎁', 'Brinquedos colecionáveis em caixas surpresa (blind boxes), figures de designers renomados e arte urbana.', [
    ['Blind box (figure surpresa)', 'colecao', 14, { gacha: true }], ['Figure de designer', 'colecao', 60],
    ['Arte urbana colecionável', 'colecao', 110], ['Blind box edição especial', 'colecao', 35, { gacha: true }],
  ]),
  store('lotte', 'LOTTE Department Store', 'asia', 'premium', '🏬', 'Marcas de moda de luxo, cosméticos coreanos premium, praça de alimentação gourmet e eletrônicos.', [
    ['Moda de luxo coreana', 'roupa', 400], ['Cosméticos coreanos premium', 'beleza', 120], ['Jantar na praça gourmet', 'refeicao', 45],
    ['Fones premium', 'audio', 350], ['Casaco de grife', 'social', 900],
  ]),
  store('muji', 'Muji', 'asia', 'mid', '🧺', 'Papelaria minimalista, organizadores domésticos, roupas de algodão orgânico, óleos essenciais e móveis simples.', [
    ['Papelaria minimalista', 'presente', 22], ['Organizadores domésticos', 'decor', 55], ['Roupa de algodão orgânico', 'roupa', 50],
    ['Óleos essenciais', 'beleza', 30], ['Móvel simples', 'movel', 200],
  ]),
  store('suning', 'Suning', 'asia', 'mid', '🤖', 'Eletrodomésticos inteligentes, smartphones, computadores e tecnologia para automação residencial.', [
    ['Eletrodoméstico inteligente', 'eletro', 700], ['Smartphone', 'celular', 500], ['Computador', 'notebook', 900], ['Kit de automação residencial', 'gadget', 300],
  ]),
  store('miniso', 'Miniso', 'asia', 'budget', '🧸', 'Acessórios para celular, bichos de pelúcia, artigos de papelaria, fones de ouvido e utilidades baratas.', [
    ['Acessórios para celular', 'gadget', 12], ['Pelúcia', 'presente', 15], ['Caderno e papelaria', 'livro', 8],
    ['Fones de ouvido', 'audio', 25], ['Utilidades baratas', 'decor', 12],
  ]),

  // ---------- Emirados ----------
  store('dubaimall', 'Dubai Mall Luxury Avenue', 'emirados', 'luxury', '💎', 'Relógios cravados de diamantes, bolsas de grife de tiragem limitada, alta joalheria e perfumes de Oud.', [
    ['Relógio cravado de diamantes', 'relogio', 28000], ['Bolsa de tiragem limitada', 'bolsa', 9500], ['Alta joalheria', 'joia', 15000], ['Perfume de Oud', 'beleza', 380],
  ], { ticker: 'EMAAR', global: true }),
  store('lulu', 'LuLu Hypermarket', 'emirados', 'budget', '🛒', 'Alimentos internacionais, especiarias orientais, produtos importados da Ásia e Índia, eletrônicos e vestuário.', [
    ['Compras internacionais', 'mercado', 75], ['Especiarias orientais', 'mercado', 35], ['TV de bom custo-benefício', 'tv', 350],
    ['Roupas básicas', 'roupa', 40], ['Produtos da Índia e da Ásia', 'presente', 25],
  ]),
  store('carrefouruae', 'Carrefour UAE', 'emirados', 'mid', '🌴', 'Tâmaras premium, alimentos frescos, eletrodomésticos e utilidades domésticas gerais.', [
    ['Tâmaras premium', 'doces', 22], ['Alimentos frescos', 'mercado', 85], ['Eletrodomésticos', 'eletro', 450], ['Utilidades domésticas', 'decor', 55],
  ]),
  store('sharaf', 'Sharaf DG', 'emirados', 'premium', '🛰️', 'Notebooks gamer, smartphones dobráveis, drones, smart TVs e sistemas de som automotivo e residencial.', [
    ['Notebook gamer', 'notebook', 1800], ['Smartphone dobrável', 'celular', 1700], ['Drone', 'gadget', 700],
    ['Smart TV 75"', 'tv', 1500], ['Sistema de som', 'audio', 900],
  ]),
  store('parisgallery', 'Paris Gallery', 'emirados', 'premium', '🧪', 'Perfumes de nicho do Oriente Médio, óleos essenciais concentrados, maquiagens exclusivas e relógios de luxo.', [
    ['Perfume de nicho', 'beleza', 260], ['Óleo essencial concentrado', 'beleza', 90], ['Maquiagem exclusiva', 'beleza', 130], ['Relógio de luxo', 'relogio', 4200],
  ]),
  store('ace', 'Ace Hardware UAE', 'emirados', 'mid', '⛺', 'Ferramentas profissionais, churrasqueiras de alto padrão, equipamentos para acampamento no deserto e jardinagem.', [
    ['Ferramentas profissionais', 'ferramenta', 380], ['Churrasqueira de alto padrão', 'outdoor', 900],
    ['Equipamento de acampamento no deserto', 'outdoor', 420], ['Jardinagem', 'outdoor', 160],
  ]),
  store('goldsouk', 'Gold Souk', 'emirados', 'mid', '🪙', 'Barras de ouro puro, correntes e pulseiras em ouro 24k e joias com pedras preciosas.', [
    ['Barra de ouro (10 g)', 'ouro', 700], ['Barra de ouro (100 g)', 'ouro', 6600], ['Corrente de ouro 24k', 'joia', 2300], ['Pulseira com pedras preciosas', 'joia', 5400],
  ]),
  store('spicesouk', 'Spice Souk', 'emirados', 'budget', '🌶️', 'Açafrão puro, chás medicinais, incensos árabes (Bakhoor), temperos raros e frutos secos.', [
    ['Açafrão puro', 'mercado', 45], ['Chás medicinais', 'remedio', 22], ['Incenso Bakhoor', 'decor', 25], ['Temperos raros', 'mercado', 30], ['Frutos secos', 'doces', 18],
  ]),
  store('virgin', 'Virgin Megastore UAE', 'emirados', 'mid', '🎧', 'Consoles de videogame, itens de cultura pop, fones de ouvido audiófilos e gadgets tecnológicos.', [
    ['Console de videogame', 'console', 520], ['Item de cultura pop', 'colecao', 80], ['Fones audiófilos', 'audio', 450], ['Gadget tecnológico', 'gadget', 180],
  ]),
  store('daytoday', 'Day to Day', 'emirados', 'budget', '🕌', 'Lembrancinhas turísticas de Dubai, utilidades domésticas a preços muito populares e presentes acessíveis.', [
    ['Lembrancinhas de Dubai', 'presente', 12], ['Utilidades populares', 'decor', 15], ['Presente acessível', 'presente', 10],
  ]),

  // ---------- Bens de alto custo (todas as regiões) ----------
  store('dealer_carros', 'Concessionária', 'all', 'mid', '🚗', 'Carros novos, de popular a esportivo de luxo. Seguro, revisões e impostos custam cerca de 6% do valor por ano.', [
    ['Compacto popular', 'carro', 16000], ['Sedã médio', 'carro', 32000], ['SUV familiar', 'carro', 48000],
    ['Elétrico premium', 'carro', 72000], ['Esportivo de luxo', 'carro', 190000],
  ]),
  store('dealer_imoveis', 'Imobiliária', 'all', 'mid', '🏠', 'Imóveis na sua cidade. Casa própria substitui o aluguel; condomínio, IPTU e reparos custam cerca de 1,5% do valor por ano.', [
    ['Kitnet', 'imovel', 90000], ['Apartamento de 2 quartos', 'imovel', 210000], ['Casa com quintal', 'imovel', 340000],
    ['Cobertura', 'imovel', 900000], ['Mansão', 'imovel', 3000000],
    ['Sítio de fim de semana', 'fazenda', 280000], ['Fazenda produtiva', 'fazenda', 1500000], ['Fazenda gigante', 'fazenda', 8000000],
  ]),
  store('dealer_avioes', 'Hangar', 'all', 'mid', '🛩️', 'Aeronaves particulares. Exigem brevê de piloto; hangar, seguro e revisões custam cerca de 8% do valor por ano.', [
    ['Monomotor de treinamento', 'aviao', 180000], ['Turboélice executivo', 'aviao', 1800000], ['Jato executivo', 'aviao', 9000000],
  ]),
  store('dealer_lanchas', 'Marina', 'all', 'mid', '🛥️', 'Embarcações de lazer. Vaga, combustível e manutenção custam cerca de 10% do valor por ano.', [
    ['Bote inflável', 'lancha', 6000], ['Lancha de 30 pés', 'lancha', 140000], ['Iate de luxo', 'lancha', 900000],
  ]),
];

export const STORE_BY_ID = new Map(STORES.map((s) => [s.id, s]));
export const ITEM_BY_ID = new Map(STORES.flatMap((s) => s.items).map((i) => [i.id, i]));
export const storeById = (id: string) => STORE_BY_ID.get(id);
export const itemById = (id: string) => ITEM_BY_ID.get(id);

/** Região de lojas usada por cada país do jogo. */
export const REGION_OF: Record<string, Region> = {
  us: 'eua', ca: 'eua', au: 'eua', mx: 'eua',
  br: 'brasil', ar: 'brasil',
  pt: 'europa', fr: 'europa', de: 'europa', es: 'europa', it: 'europa', uk: 'europa', za: 'europa', ng: 'europa',
  jp: 'asia', kr: 'asia', cn: 'asia', in: 'asia',
  ae: 'emirados',
};

export const REGION_LABEL: Record<Region, { name: string; flag: string }> = {
  eua: { name: 'Estados Unidos', flag: '🇺🇸' },
  brasil: { name: 'Brasil', flag: '🇧🇷' },
  europa: { name: 'Europa', flag: '🇪🇺' },
  asia: { name: 'Ásia', flag: '🌏' },
  emirados: { name: 'Emirados Árabes', flag: '🇦🇪' },
};

/** Impostos de importação e margens locais sobre produtos globais (eletrônicos, luxo). */
export const IMPORT_MARKUP: Record<string, number> = {
  us: 1, ca: 1.05, au: 1.1, mx: 1.2, br: 1.4, ar: 1.6, pt: 1.1, fr: 1.05, de: 1, es: 1.1, it: 1.1, uk: 1.1,
  za: 1.25, ng: 1.5, jp: 1, kr: 1, cn: 0.95, in: 1.3, ae: 1,
};

/** Categorias que não podem ser enviadas do exterior. */
export const PERISHABLE: ReadonlySet<ItemCat> = new Set<ItemCat>(['mercado', 'fastfood', 'refeicao', 'remedio', 'bebida']);
export const INTL_FEE = 1.25;
