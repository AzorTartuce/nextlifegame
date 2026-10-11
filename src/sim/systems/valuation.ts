import { stockByTicker, unitsPerCurrency, type StockDef } from '../data/market';
import { CATS, itemById, type ShopItem } from '../data/shop';
import type { GameState, OwnedItem } from '../types';

/** Preço de uma ação em unidades internas, para o país onde o jogador vive agora. */
export function priceU(g: GameState, s: StockDef): number {
  return (g.market.prices[s.ticker] ?? s.price) * unitsPerCurrency(s.currency, g.country);
}

export interface PositionInfo {
  ticker: string;
  side: 'long' | 'short';
  shares: number;
  /** Valor de mercado da posição, em unidades internas. */
  value: number;
  /** Custo (long) ou valor recebido na venda (short). */
  basis: number;
  /** Lucro/prejuízo não realizado. */
  pnl: number;
  pnlPct: number;
  /** Só para short: patrimônio da posição e razão em relação ao valor atual (colapsa abaixo de 25%). */
  equity?: number;
  marginRatio?: number;
}

export function longInfo(g: GameState, ticker: string): PositionInfo | null {
  const pos = g.portfolio.long[ticker];
  const s = stockByTicker(ticker);
  if (!pos || !s) return null;
  const value = pos.shares * priceU(g, s);
  return { ticker, side: 'long', shares: pos.shares, value, basis: pos.cost, pnl: value - pos.cost, pnlPct: pos.cost > 0 ? (value - pos.cost) / pos.cost : 0 };
}

export function shortInfo(g: GameState, ticker: string): PositionInfo | null {
  const pos = g.portfolio.short[ticker];
  const s = stockByTicker(ticker);
  if (!pos || !s) return null;
  const value = pos.shares * priceU(g, s);
  const equity = pos.margin + pos.proceeds - value;
  return {
    ticker, side: 'short', shares: pos.shares, value, basis: pos.proceeds,
    pnl: pos.proceeds - value, pnlPct: pos.proceeds > 0 ? (pos.proceeds - value) / pos.proceeds : 0,
    equity, marginRatio: value > 0 ? equity / value : 1,
  };
}

export function positions(g: GameState): PositionInfo[] {
  const out: PositionInfo[] = [];
  for (const t of Object.keys(g.portfolio.long)) {
    const p = longInfo(g, t);
    if (p) out.push(p);
  }
  for (const t of Object.keys(g.portfolio.short)) {
    const p = shortInfo(g, t);
    if (p) out.push(p);
  }
  return out;
}

/** Patrimônio na bolsa: ações compradas + patrimônio líquido das posições vendidas (inclui a margem depositada). */
export function portfolioValue(g: GameState): number {
  let v = 0;
  for (const p of positions(g)) v += p.side === 'long' ? p.value : (p.equity ?? 0);
  return v;
}

export const unrealizedPnl = (g: GameState) => positions(g).reduce((s, p) => s + p.pnl, 0);

// ---------- Bens comprados ----------

export const itemOf = (o: OwnedItem): ShopItem | undefined => o.custom ?? itemById(o.itemId);

const ownedYears = (g: GameState, o: OwnedItem) => Math.max(0, (g.t - o.t) / 12);

/** Quanto o bem vale hoje se for vendido (mercado de usados, ouro ao preço do dia, imóvel valorizando). */
export function resaleValue(g: GameState, o: OwnedItem): number {
  const item = itemOf(o);
  if (!item) return 0;
  const def = CATS[item.cat];
  const years = ownedYears(g, o);
  let v: number;
  if (item.cat === 'ouro') v = o.paid * (g.shop.goldIdx / (o.mult ?? 1)) * 0.97;
  else if (item.cat === 'colecao') v = o.paid * (o.mult ?? 1) * 0.9;
  else if (def.dep < 0) v = o.paid * Math.pow(1 - def.dep, years) * 0.94;
  else v = o.paid * Math.max(def.floor, Math.pow(1 - def.dep, years)) * (def.kind === 'ativo' ? 0.92 : 0.7);
  // Marcas em alta valorizam a revenda; marcas canceladas, derrubam.
  const trend = g.shop.trends[item.store]?.status ?? 1;
  v *= trend < 1 ? 0.6 + 0.4 * trend : Math.min(1.15, 0.9 + 0.1 * trend);
  return Math.max(0, v);
}

/** Patrimônio em bens que guardam valor: imóveis, carros, lanchas, ouro e colecionáveis. */
export function assetsValue(g: GameState): number {
  let v = 0;
  for (const o of g.shop.inventory) {
    const item = itemOf(o);
    if (!item) continue;
    const def = CATS[item.cat];
    if (def.kind === 'ativo' || item.cat === 'ouro' || item.cat === 'colecao') v += resaleValue(g, o);
  }
  return v;
}
