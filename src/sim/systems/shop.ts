import { t } from '../../i18n';
import { ageYears, changeMoney, changeStats, clamp, currentPolicy, formatMoney, netWorth, pushFeed, worldOf } from '../core';
import { unitsPerCurrency } from '../data/market';
import {
  CATS, IMPORT_MARKUP, INTL_FEE, PERISHABLE, REGION_OF, STORES, itemById, scaleNow, storeById,
  type ItemCat, type Passive, type Region, type ShopItem, type StoreDef,
} from '../data/shop';
import { chance, pick, rint, rnd, rrange } from '../rng';
import type { Deltas, GameState, OwnedItem, ShopState, StatKey } from '../types';
import { injectEvent } from './market';
import { generateOffers } from './offers';
import { itemOf, resaleValue } from './valuation';

export const MIN_SHOP_AGE = 16;
export const MIN_ASSET_AGE = 18;
const PRICE_HISTORY = 60;

export function emptyShop(): ShopState {
  return {
    inventory: [], priceIndex: 1, priceHistory: [1], goldIdx: 1, junk: 0, monthly: {}, trends: {}, offers: [], news: [], spentTotal: 0, lastJunkWarn: -999,
  };
}

export function initShop(g: GameState) {
  g.shop = emptyShop();
  g.shop.offers = generateOffers(g, storesFor(g).local);
}

/** Saves antigos não tinham loja. */
export function ensureShop(g: GameState) {
  if (!g.shop) initShop(g);
}

// ---------- Lojas e preços ----------

export const regionOf = (g: Pick<GameState, 'country'>): Region => REGION_OF[g.country] ?? 'eua';

export function storesFor(g: GameState): { local: StoreDef[]; intl: StoreDef[] } {
  const r = regionOf(g);
  return {
    local: STORES.filter((s) => s.region === r || s.region === 'all'),
    intl: STORES.filter((s) => s.region !== 'all' && s.region !== r),
  };
}

export const isIntl = (g: GameState, store: StoreDef) => store.region !== 'all' && store.region !== regionOf(g);

/** Itens de lojas estrangeiras só chegam pelo correio: nada perecível. */
export const shippable = (cat: ItemCat) => !PERISHABLE.has(cat);

/** Preço de uma unidade, em unidades internas, para o jogador no lugar onde está. */
export function itemPrice(g: GameState, item: ShopItem, discount = 0): number {
  const store = storeById(item.store);
  if (!store) return item.price;
  const { city } = worldOf(g);
  const intl = isIntl(g, store);
  let p = item.price;
  if (item.pricing === 'global') {
    // Carros são fabricados em boa parte localmente: só sentem uma fração do imposto de importação.
    const markup = IMPORT_MARKUP[g.country] ?? 1;
    p *= unitsPerCurrency('USD', g.country) * (item.cat === 'carro' ? 1 + (markup - 1) * 0.3 : markup) * (intl ? INTL_FEE : 1);
  } else {
    p *= item.cat === 'imovel' ? city.cost : 0.6 + 0.4 * city.cost;
    if (intl) p *= INTL_FEE;
  }
  p *= g.shop.priceIndex * (g.shop.trends[store.id]?.price ?? 1);
  if (item.cat === 'ouro') p *= g.shop.goldIdx * 1.03;
  return Math.round(p * (1 - discount) * 100) / 100;
}

// ---------- Bônus passivos do inventário ----------

export interface Bonus {
  status: number;
  prod: number;
  mood: number;
  health: number;
  calm: number;
  look: number;
  learn: number;
}

const KEYS: (keyof Bonus)[] = ['status', 'prod', 'mood', 'health', 'calm', 'look', 'learn'];
const CAPS: Bonus = { status: 100, prod: 10, mood: 14, health: 8, calm: 10, look: 14, learn: 1.2 };
export const zeroBonus = (): Bonus => ({ status: 0, prod: 0, mood: 0, health: 0, calm: 0, look: 0, learn: 0 });
const soft = (x: number, cap: number) => (x <= 0 ? x : cap * (1 - Math.exp(-x / cap)));

/** Quanto do efeito resta: eletrônicos ficam obsoletos e roupas saem de moda. */
export function freshness(cat: ItemCat, years: number): number {
  const fade = CATS[cat].fade;
  if (fade === 'tech') return Math.max(0.5, 1 - 0.12 * years);
  if (fade === 'moda') return Math.max(0.4, 1 - 0.2 * years);
  return 1;
}

export function itemPassive(g: GameState, o: OwnedItem, item: ShopItem): Passive {
  const f = freshness(item.cat, Math.max(0, (g.t - o.t) / 12));
  const trend = g.shop.trends[item.store]?.status ?? 1;
  const out: Passive = {};
  for (const [k, v] of Object.entries(item.passive) as [keyof Passive, number][]) out[k] = v * f * (k === 'status' ? trend : 1);
  return out;
}

const score = (p: Passive) => (p.status ?? 0) + (p.prod ?? 0) * 2 + (p.mood ?? 0) * 2 + (p.look ?? 0) + (p.calm ?? 0) + (p.health ?? 0) * 2 + (p.learn ?? 0) * 5;

/** Em cada espaço (slot) só contam os melhores itens, até a capacidade do espaço. */
export function inUse(g: GameState, inv: OwnedItem[]): Set<number> {
  const bySlot = new Map<string, { o: OwnedItem; s: number }[]>();
  for (const o of inv) {
    const item = itemOf(o);
    const slot = item ? CATS[item.cat].slot : undefined;
    if (!item || !slot) continue;
    const list = bySlot.get(slot) ?? [];
    list.push({ o, s: score(itemPassive(g, o, item)) });
    bySlot.set(slot, list);
  }
  const used = new Set<number>();
  for (const [slot, list] of bySlot) {
    const cap = CATS[itemOf(list[0].o)!.cat].cap ?? 1;
    list.sort((a, b) => b.s - a.s);
    for (const e of list.slice(0, cap)) used.add(e.o.uid);
    void slot;
  }
  return used;
}

export function bonusesOf(g: GameState, inv: OwnedItem[]): Bonus {
  const used = inUse(g, inv);
  const raw = zeroBonus();
  for (const o of inv) {
    const item = itemOf(o);
    if (!item || !used.has(o.uid)) continue;
    const p = itemPassive(g, o, item);
    for (const k of KEYS) raw[k] += p[k] ?? 0;
  }
  const out = zeroBonus();
  for (const k of KEYS) out[k] = Math.round(soft(raw[k], CAPS[k]) * 10) / 10;
  out.status = clamp(out.status, 0, 100);
  return out;
}

export const bonuses = (g: GameState): Bonus => bonusesOf(g, g.shop.inventory);

/** Status social: bens + cargo + patrimônio. */
export function statusScore(g: GameState): number {
  const job = g.job ? Math.min(20, (g.job.level + 1) * 4) : 0;
  const wealth = Math.min(20, Math.max(0, Math.log10(Math.max(1, netWorth(g))) - 2) * 5);
  return Math.round(clamp(bonuses(g).status + job + wealth, 0, 100));
}

export const ownsHome = (g: GameState) => g.shop.inventory.some((o) => itemOf(o)?.cat === 'imovel' && !o.rented);

/** Saúde oculta: só afeta o corpo depois de um acúmulo. Negativo na meta de saúde. */
export const junkPenalty = (g: GameState) => Math.min(12, Math.max(0, g.shop.junk - 4) * 1.2);

// ---------- Carrinho ----------

export interface CartLine {
  /** Id do item do catálogo, ou `offer:<id>` para uma oferta do dia. */
  ref: string;
  qty: number;
}

export interface ResolvedLine {
  ref: string;
  item: ShopItem;
  qty: number;
  unit: number;
  total: number;
  intl: boolean;
}

export function resolveRef(g: GameState, ref: string): { item: ShopItem; discount: number } | null {
  if (ref.startsWith('offer:')) {
    const offer = g.shop.offers.find((o) => o.id === Number(ref.slice(6)));
    return offer ? { item: offer.item, discount: offer.discount } : null;
  }
  const item = itemById(ref);
  return item ? { item, discount: 0 } : null;
}

export function resolveCart(g: GameState, lines: CartLine[]): ResolvedLine[] {
  const out: ResolvedLine[] = [];
  for (const l of lines) {
    const r = resolveRef(g, l.ref);
    if (!r) continue;
    const kind = CATS[r.item.cat].kind;
    const qty = Math.max(1, Math.min(kind === 'consumivel' ? 9 : 1, Math.floor(l.qty)));
    const unit = itemPrice(g, r.item, r.discount);
    const store = storeById(r.item.store);
    out.push({ ref: l.ref, item: r.item, qty, unit, total: unit * qty, intl: !!store && isIntl(g, store) });
  }
  return out;
}

/** Carros, lanchas e aviões exigem a licença correspondente. */
const LICENSE_FOR: Partial<Record<ItemCat, string>> = { carro: 'carro', lancha: 'lancha', aviao: 'aviao' };
const LICENSE_MSG: Record<string, string> = {
  carro: 'Precisa da carteira de motorista (aba Celular > Viagens).',
  lancha: 'Precisa da licença náutica (aba Celular > Viagens).',
  aviao: 'Precisa do brevê de piloto (aba Celular > Viagens).',
};

export function validateCart(g: GameState, lines: CartLine[]): string | null {
  if (g.dead) return t('Indisponível.');
  if (g.life.crime.prison) return t('Você está preso.');
  if (ageYears(g) < MIN_SHOP_AGE) return t('As compras abrem aos 16 anos.');
  const rs = resolveCart(g, lines);
  if (!rs.length) return t('O carrinho está vazio.');
  if (rs.some((r) => CATS[r.item.cat].kind === 'ativo') && ageYears(g) < MIN_ASSET_AGE) return t('Carros, imóveis e lanchas só aos 18 anos.');
  for (const r of rs) {
    const need = LICENSE_FOR[r.item.cat];
    if (need && !g.life.licenses[need]) return t(LICENSE_MSG[need]);
  }
  const total = rs.reduce((s, r) => s + r.total, 0);
  if (total > g.money + 1e-6) return `Faltam ${formatMoney(total - g.money)}.`;
  return null;
}

const saturation = (n: number) => 1 / (1 + 0.6 * n);

export interface CartPreview {
  lines: ResolvedLine[];
  total: number;
  /** Efeitos imediatos já somados. */
  now: Partial<Record<StatKey, number>>;
  before: Bonus;
  after: Bonus;
  error: string | null;
}

export function previewCart(g: GameState, lines: CartLine[]): CartPreview {
  const rs = resolveCart(g, lines);
  const now: Partial<Record<StatKey, number>> = {};
  const monthly = { ...g.shop.monthly };
  const fake: OwnedItem[] = [];
  let total = 0;
  for (const r of rs) {
    total += r.total;
    const def = CATS[r.item.cat];
    for (let i = 0; i < r.qty; i++) {
      const sat = saturation(monthly[r.item.cat] ?? 0);
      monthly[r.item.cat] = (monthly[r.item.cat] ?? 0) + 1;
      for (const [k, v] of Object.entries(r.item.now) as [StatKey, number][]) now[k] = (now[k] ?? 0) + v * sat;
      if (def.kind !== 'consumivel') fake.push({ uid: -1 - fake.length, itemId: r.item.id, t: g.t, paid: r.unit, custom: r.item.unique ? r.item : undefined });
    }
  }
  return { lines: rs, total, now, before: bonuses(g), after: bonusesOf(g, [...g.shop.inventory, ...fake]), error: validateCart(g, lines) };
}

function rollGacha(g: GameState): { mult: number; label: string } {
  const r = rnd(g);
  if (r < 0.7) return { mult: 1, label: 'comum' };
  if (r < 0.92) return { mult: 2.2, label: 'raro' };
  if (r < 0.98) return { mult: 5, label: t('ultra raro') };
  return { mult: 12, label: 'SECRETO' };
}

export function checkout(g: GameState, lines: CartLine[]): string {
  const err = validateCart(g, lines);
  if (err) return err;
  const rs = resolveCart(g, lines);
  const acc: Deltas = {};
  const extras: string[] = [];
  let total = 0;
  let count = 0;
  for (const r of rs) {
    const def = CATS[r.item.cat];
    for (let i = 0; i < r.qty; i++) {
      const n = g.shop.monthly[r.item.cat] ?? 0;
      const sat = saturation(n);
      g.shop.monthly[r.item.cat] = n + 1;
      changeStats(g, scaleNow(r.item.now, sat), acc);
      count += 1;
      total += r.unit;
      changeMoney(g, -r.unit, acc);
      if (def.kind === 'consumivel') {
        g.shop.junk = Math.max(0, g.shop.junk + r.item.junk);
        continue;
      }
      g.nextId += 1;
      const owned: OwnedItem = { uid: g.nextId, itemId: r.item.id, t: g.t, paid: r.unit };
      if (r.item.unique) owned.custom = r.item;
      if (r.item.cat === 'ouro') owned.mult = g.shop.goldIdx;
      if (r.item.gacha) {
        const roll = rollGacha(g);
        owned.mult = roll.mult;
        if (roll.mult > 1) extras.push(t('✨ Veio uma peça {label}!', { label: t(roll.label) }));
      }
      g.shop.inventory.push(owned);
      if (r.item.cat === 'imovel') g.livesWithParents = false;
    }
    if (r.ref.startsWith('offer:')) g.shop.offers = g.shop.offers.filter((o) => `offer:${o.id}` !== r.ref);
  }
  g.shop.spentTotal += total;
  const msg = t('Compra no GlobalMart: {count} {v} por {v2}.{v3}', { count, v: count === 1 ? t('item') : t('itens'), v2: formatMoney(total), v3: extras.length ? ' ' + extras.join(' ') : '' });
  pushFeed(g, '🛍️', msg, 'info', acc);
  return msg;
}

/** Aluga (ou para de alugar) um imóvel que não seja a sua moradia. */
export function toggleRent(g: GameState, uid: number): string {
  const o = g.shop.inventory.find((x) => x.uid === uid);
  if (!o || itemOf(o)?.cat !== 'imovel') return '';
  o.rented = !o.rented;
  const msg = o.rented ? t('Imóvel colocado para alugar. O aluguel entra todo mês.') : t('Você voltou a usar o imóvel como moradia.');
  pushFeed(g, '🔑', msg, 'info');
  return msg;
}

export function sellItem(g: GameState, uid: number): string {
  const o = g.shop.inventory.find((x) => x.uid === uid);
  const item = o && itemOf(o);
  if (!o || !item) return t('Item não encontrado.');
  const value = resaleValue(g, o);
  g.shop.inventory = g.shop.inventory.filter((x) => x.uid !== uid);
  changeMoney(g, value);
  const diff = value - o.paid;
  const msg = t('Você vendeu {name} por {v} ({v2} de {v3}).', { name: t(item.name), v: formatMoney(value), v2: diff >= 0 ? t('lucro') : t('perda'), v3: formatMoney(Math.abs(diff)) });
  pushFeed(g, '🏷️', msg, diff >= 0 ? 'good' : 'info');
  return msg;
}

/** Imóveis ficam na cidade: ao se mudar eles são vendidos. */
export function sellHomes(g: GameState): number {
  let total = 0;
  for (const o of [...g.shop.inventory]) {
    if (itemOf(o)?.cat !== 'imovel' && itemOf(o)?.cat !== 'fazenda') continue;
    const v = resaleValue(g, o);
    total += v;
    g.shop.inventory = g.shop.inventory.filter((x) => x.uid !== o.uid);
    changeMoney(g, v);
  }
  if (total > 0) pushFeed(g, '🏷️', t('Seus imóveis foram vendidos por {v} antes da mudança.', { v: formatMoney(total) }), 'info');
  return total;
}

// ---------- Mês a mês ----------

const NEG = [
  '{loja} é cancelada nas redes após campanha publicitária polêmica',
  '{loja} vira piada na internet depois de post infeliz do perfil oficial',
  'Consumidores abandonam a {loja} após promoção que deu errado',
  '{loja} enfrenta onda de boicote: "ninguém mais quer usar essa marca"',
];
const POS = [
  '{loja} viraliza: fila de horas na porta e produtos esgotados',
  'Coleção da {loja} vira febre entre celebridades e influenciadores',
  '{loja} é a queridinha do momento e vê a procura disparar',
  'Hype total: todo mundo quer algo da {loja} neste mês',
];

function spawnTrend(g: GameState) {
  const s = g.shop;
  const stores = STORES.filter((x) => x.region !== 'all' && !s.trends[x.id]);
  if (!stores.length) return;
  const store = pick(g, stores);
  const tone: 'pos' | 'neg' = chance(g, 0.5) ? 'pos' : 'neg';
  s.trends[store.id] = tone === 'neg'
    ? { status: rrange(g, 0.35, 0.7), price: rrange(g, 0.88, 0.96), left: rint(g, 6, 18) }
    : { status: rrange(g, 1.3, 1.6), price: rrange(g, 1.05, 1.15), left: rint(g, 6, 18) };
  const headline = t(pick(g, tone === 'neg' ? NEG : POS)).replace('{loja}', t(store.name));
  g.nextId += 1;
  s.news.unshift({ id: g.nextId, t: g.t, storeId: store.id, tone, headline });
  if (s.news.length > 40) s.news.length = 40;
  if (store.ticker) injectEvent(g, store.ticker, (tone === 'pos' ? 1 : -1) * rrange(g, 0.03, 0.1), headline, tone);
  if (s.inventory.some((o) => itemOf(o)?.store === store.id)) {
    pushFeed(g, tone === 'pos' ? '🔥' : '🧊', `${headline}. ${tone === 'pos' ? t('Seus itens da marca valorizam: bom momento para vender?') : t('Seus itens da marca perdem status e valor: vender ou segurar?')}`, tone === 'pos' ? 'good' : 'bad');
  }
}

export function shopTick(g: GameState, acc: Deltas) {
  const s = g.shop;
  s.monthly = {};
  s.junk = Math.max(0, s.junk - 0.4);

  // O preço real dos bens acompanha o clima da economia (ligado ao mercado de ações).
  const regime = g.market.regime.effect;
  s.priceIndex = clamp(s.priceIndex * (1 + 0.0008 + currentPolicy().price + regime * 0.12 + (rnd(g) - 0.5) * 0.004), 0.8, 2.2);
  s.priceHistory.push(s.priceIndex);
  if (s.priceHistory.length > PRICE_HISTORY) s.priceHistory.shift();
  // O ouro é refúgio: sobe quando o mercado cai.
  s.goldIdx = clamp(s.goldIdx * (1 + 0.003 - regime * 0.5 + (rnd(g) - 0.5) * 0.03), 0.4, 4);

  if (g.t % 12 === 0 && s.priceHistory.length > 12) {
    const change = s.priceIndex / s.priceHistory[s.priceHistory.length - 13] - 1;
    if (Math.abs(change) >= 0.03) pushFeed(g, change > 0 ? '🏷️' : '📉', t('Os preços das lojas {v} {v2}% no último ano.', { v: change > 0 ? t('subiram') : t('caíram'), v2: Math.abs(Math.round(change * 100)) }), change > 0 ? 'bad' : 'good');
  }

  for (const k of Object.keys(s.trends)) {
    s.trends[k].left -= 1;
    if (s.trends[k].left <= 0) delete s.trends[k];
  }
  if (chance(g, 0.04)) spawnTrend(g);

  if (ageYears(g) >= MIN_SHOP_AGE) s.offers = generateOffers(g, storesFor(g).local);

  // Manutenção anual dos bens de alto custo, cobrada em parcelas mensais.
  let upkeep = 0;
  for (const o of s.inventory) {
    const item = itemOf(o);
    const rate = item ? CATS[item.cat].upkeep : undefined;
    if (rate) upkeep += (o.paid * rate) / 12;
  }
  if (upkeep > 0) changeMoney(g, -upkeep, acc);

  // Renda dos imóveis: aluguel a terceiros (com chance de vacância) e produção das fazendas.
  let income = 0;
  for (const o of s.inventory) {
    const cat = itemOf(o)?.cat;
    if (cat === 'imovel' && o.rented && !chance(g, 0.04)) income += resaleValue(g, o) * 0.0055;
    else if (cat === 'fazenda') income += o.paid * 0.004 * (0.7 + rnd(g) * 0.6);
  }
  if (income > 0) changeMoney(g, income, acc);

  if (s.junk > 8 && g.t - s.lastJunkWarn > 12) {
    s.lastJunkWarn = g.t;
    pushFeed(g, '🩺', t('O médico avisou: colesterol nas alturas. Comer melhor ajuda a recuperar a saúde.'), 'bad');
  }
}

// ---------- Herança ----------

/** Ao morrer, o herdeiro fica com imóveis, ouro e colecionáveis; o resto vira dinheiro do espólio. */
export function inheritShop(old: GameState): { shop: ShopState; cash: number } {
  const keep: OwnedItem[] = [];
  let cash = 0;
  for (const o of old.shop.inventory) {
    const cat = itemOf(o)?.cat;
    if (cat === 'imovel' || cat === 'ouro' || cat === 'colecao') keep.push(o);
    else cash += resaleValue(old, o);
  }
  return { shop: { ...old.shop, inventory: keep, monthly: {}, spentTotal: 0 }, cash };
}

/** Textos-base do varejo (usados pelo teste de cobertura do inglês). */
export const SHOP_PHRASES: string[] = [...NEG, ...POS, ...Object.values(LICENSE_MSG)];
