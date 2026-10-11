import { ageYears, changeMoney, clamp, currentPolicy, formatMoney, pushFeed } from '../core';
import {
  ALL_STOCKS, GROUP_META, SECTOR_META, capGainsRate, stockByTicker, unitsPerCurrency, type StockDef, type StockGroup, type StockSector,
} from '../data/market';
import { chance, gauss, pick, rint, rnd, rrange } from '../rng';
import type { Deltas, GameState, MarketState, NewsItem, Portfolio, Trade } from '../types';
import { TemplateNews, type NewsRequest } from './news';
import { bump } from './lifestate';
import { priceU, shortInfo } from './valuation';
import { dec, fmtNum, t } from '../../i18n';

export const MIN_AGE = 18;
const FEE_HOME = 0.0025;
const FEE_FOREIGN = 0.006;
const FEE_FLAT = 0.5;
const SHORT_MARGIN = 0.5;
const SHORT_MAINTENANCE = 0.25;
const SHORT_BORROW_MONTHLY = 0.003;
const EVENT_CHANCE = 0.018;
const HISTORY_LEN = 60;
/** Fatia do impacto de um evento que o mercado absorve no dia da notícia; o resto vem no mês seguinte. */
const IMMEDIATE_SHARE = 0.4;
/** Desconto aplicado à tendência de todas as ações (os dividendos compensam parte). */
const DRIFT_HAIRCUT = 0.0034;
/** Dispersão da vantagem oculta por empresa (por mês). */
const EDGE_SPREAD = 0.0105;

/** O índice geral só mede ações; cripto tem vida própria. */
const INDEX_STOCKS = ALL_STOCKS.filter((s) => s.group !== 'cripto');

const q = (p: number) => (p >= 100 ? Math.round(p * 100) / 100 : Math.round(p * 10000) / 10000);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export const emptyPortfolio = (): Portfolio => ({
  long: {}, short: {}, realizedYear: 0, lossCarry: 0, realizedTotal: 0, dividendsTotal: 0, feesTotal: 0, taxPaid: 0, trades: [],
});

export function blankMarket(t0: number): MarketState {
  return { t0, prices: {}, edge: {}, history: {}, lastChange: {}, index: [], regime: { kind: 'neutral', effect: 0, left: 10 }, sectorMood: {}, groupMood: {}, pending: [], news: [] };
}

/** Cria o mercado com 3 anos de histórico (passeio aleatório que termina nos preços-base). */
export function initMarket(g: GameState) {
  const months = 36;
  const m = blankMarket(g.t);
  const common: number[] = [];
  let c = 0;
  for (let i = 0; i < months; i++) {
    c = 0.6 * c + (rnd(g) - 0.5) * 0.05;
    common.push(c);
  }
  for (const s of ALL_STOCKS) {
    let p = s.price;
    const series = [q(p)];
    for (let i = months - 1; i >= 0; i--) {
      const r = clamp(s.drift - DRIFT_HAIRCUT + (rnd(g) * 2 - 1) * s.vol + s.beta * common[i], -0.5, 0.8);
      p = p / (1 + r);
      series.unshift(q(p));
    }
    m.prices[s.ticker] = s.price;
    m.edge[s.ticker] = gauss(g, 0, EDGE_SPREAD);
    m.history[s.ticker] = series;
    m.lastChange[s.ticker] = series[series.length - 1] / series[series.length - 2] - 1;
  }
  for (let i = 0; i <= months; i++) {
    m.index.push(1000 * (sum(INDEX_STOCKS.map((s) => m.history[s.ticker][i] / s.price)) / INDEX_STOCKS.length));
  }
  m.regime.left = rint(g, 6, 16);
  g.market = m;
}

/** Saves antigos não tinham mercado, ou não tinham os ativos adicionados depois (ex.: cripto). */
export function ensureMarket(g: GameState) {
  if (!g.market) {
    g.portfolio = emptyPortfolio();
    initMarket(g);
    return;
  }
  const m = g.market;
  for (const s of ALL_STOCKS) {
    if (m.prices[s.ticker] !== undefined) continue;
    const series = [q(s.price)];
    let p = s.price;
    for (let i = 0; i < 36; i++) {
      p = p / (1 + clamp(s.drift + (rnd(g) * 2 - 1) * s.vol, -0.5, 0.8));
      series.unshift(q(p));
    }
    m.prices[s.ticker] = s.price;
    m.history[s.ticker] = series;
    m.edge[s.ticker] = gauss(g, 0, EDGE_SPREAD);
    m.lastChange[s.ticker] = series[series.length - 1] / series[series.length - 2] - 1;
  }
}

// ---------- Simulação mensal ----------

function newRegime(g: GameState) {
  const r = g.market.regime;
  const roll = rnd(g);
  if (r.kind === 'neutral') {
    if (roll < 0.4) Object.assign(r, { kind: 'bull', effect: rrange(g, 0.008, 0.022), left: rint(g, 8, 30) });
    else if (roll < 0.65) Object.assign(r, { kind: 'bear', effect: -rrange(g, 0.01, 0.03), left: rint(g, 5, 16) });
    else Object.assign(r, { kind: 'neutral', effect: 0, left: rint(g, 6, 24) });
  } else if (roll < 0.7) {
    Object.assign(r, { kind: 'neutral', effect: 0, left: rint(g, 6, 24) });
  } else if (r.kind === 'bull') {
    Object.assign(r, { kind: 'bear', effect: -rrange(g, 0.01, 0.03), left: rint(g, 5, 16) });
  } else {
    Object.assign(r, { kind: 'bull', effect: rrange(g, 0.008, 0.022), left: rint(g, 8, 30) });
  }
}

function pushNews(g: GameState, item: Omit<NewsItem, 'id'>): NewsItem {
  g.nextId += 1;
  const n: NewsItem = { id: g.nextId, ...item };
  g.market.news.unshift(n);
  if (g.market.news.length > 80) g.market.news.length = 80;
  return n;
}

function rollStrength(g: GameState): { strength: 1 | 2 | 3 | 4; magnitude: number } {
  const r = rnd(g);
  const [strength, lo, hi] = r < 0.45 ? [1, 0.03, 0.08] : r < 0.8 ? [2, 0.08, 0.18] : r < 0.97 ? [3, 0.18, 0.35] : [4, 0.35, 0.5];
  return { strength: strength as 1 | 2 | 3 | 4, magnitude: rrange(g, lo as number, hi as number) };
}

function tilt(g: GameState) {
  const k = g.market.regime.kind;
  return k === 'bull' ? 0.56 : k === 'bear' ? 0.44 : 0.5;
}

function spawnCompanyEvent(g: GameState, s: StockDef, add: (t: string, v: number) => void) {
  const m = g.market;
  const tone: 'pos' | 'neg' = chance(g, tilt(g)) ? 'pos' : 'neg';
  const kind: 'fato' | 'boato' = chance(g, 0.35) ? 'boato' : 'fato';
  const { strength, magnitude } = rollStrength(g);
  let impact = magnitude * (tone === 'pos' ? 1 : -1) * (kind === 'boato' ? 0.7 : 1);
  // A manchete nem sempre diz a verdade: boatos erram com frequência e fatos às vezes são "precificados ao contrário".
  if (chance(g, kind === 'boato' ? 0.4 : 0.15)) impact = -impact * 0.6;
  impact = clamp(impact, -0.5, 0.5);
  const req: NewsRequest = { scope: 'empresa', tone, strength, kind, stock: s };
  const news = pushNews(g, { t: g.t, scope: 'empresa', ticker: s.ticker, sector: s.sector, group: s.group, kind, tone, strength, headline: TemplateNews.headline(g, req), done: false, realized: impact * IMMEDIATE_SHARE });
  add(s.ticker, impact * IMMEDIATE_SHARE);
  m.pending.push({ ticker: s.ticker, impact: impact * (1 - IMMEDIATE_SHARE), t: g.t + 1, newsId: news.id });
}

function macroEvents(g: GameState, add: (t: string, v: number) => void) {
  const m = g.market;
  const sectors = Object.keys(SECTOR_META) as StockSector[];
  const groups = Object.keys(GROUP_META) as StockGroup[];

  if (chance(g, 0.004)) {
    const shock = rrange(g, 0.08, 0.22);
    for (const s of ALL_STOCKS) add(s.ticker, -shock * s.beta);
    Object.assign(m.regime, { kind: 'bear', effect: -rrange(g, 0.02, 0.035), left: rint(g, 8, 20) });
    pushNews(g, { t: g.t, scope: 'mundo', kind: 'macro', tone: 'neg', strength: 4, headline: TemplateNews.headline(g, { scope: 'mundo', tone: 'neg', strength: 4, kind: 'macro' }), done: true, realized: -shock });
  } else if (chance(g, 0.006)) {
    const shock = rrange(g, 0.04, 0.1);
    for (const s of ALL_STOCKS) add(s.ticker, shock * s.beta);
    Object.assign(m.regime, { kind: 'bull', effect: rrange(g, 0.012, 0.025), left: rint(g, 8, 18) });
    pushNews(g, { t: g.t, scope: 'mundo', kind: 'macro', tone: 'pos', strength: 3, headline: TemplateNews.headline(g, { scope: 'mundo', tone: 'pos', strength: 3, kind: 'macro' }), done: true, realized: shock });
  }
  if (chance(g, 0.03)) {
    const sector = pick(g, sectors);
    const tone: 'pos' | 'neg' = chance(g, tilt(g)) ? 'pos' : 'neg';
    const v = rrange(g, 0.008, 0.025);
    m.sectorMood[sector] = { v: tone === 'pos' ? v : -v, left: rint(g, 3, 8) };
    const strength = v < 0.013 ? 1 : v < 0.019 ? 2 : 3;
    pushNews(g, { t: g.t, scope: 'setor', sector, kind: 'macro', tone, strength, headline: TemplateNews.headline(g, { scope: 'setor', tone, strength, kind: 'macro', sector }), done: true });
  }
  if (chance(g, 0.02)) {
    const group = pick(g, groups);
    const tone: 'pos' | 'neg' = chance(g, tilt(g)) ? 'pos' : 'neg';
    const v = rrange(g, 0.008, 0.022);
    m.groupMood[group] = { v: tone === 'pos' ? v : -v, left: rint(g, 2, 6) };
    const strength = v < 0.013 ? 1 : v < 0.018 ? 2 : 3;
    pushNews(g, { t: g.t, scope: 'bolsa', group, kind: 'macro', tone, strength, headline: TemplateNews.headline(g, { scope: 'bolsa', tone, strength, kind: 'macro', group }), done: true });
  }
}

export function marketTick(g: GameState, acc: Deltas) {
  const m = g.market;
  if (g.t % 12 === 0) settleTaxes(g, acc);

  m.regime.left -= 1;
  if (m.regime.left <= 0) newRegime(g);
  for (const moods of [m.sectorMood, m.groupMood]) {
    for (const k of Object.keys(moods)) {
      moods[k].left -= 1;
      if (moods[k].left <= 0) delete moods[k];
    }
  }

  const ev: Record<string, number> = {};
  const add = (t: string, v: number) => {
    ev[t] = (ev[t] ?? 0) + v;
  };

  macroEvents(g, add);

  for (const p of m.pending) {
    if (p.t > g.t) continue;
    add(p.ticker, p.impact);
    const news = m.news.find((n) => n.id === p.newsId);
    if (news) {
      news.realized = (news.realized ?? 0) + p.impact;
      news.done = true;
    }
  }
  m.pending = m.pending.filter((p) => p.t > g.t);

  for (const s of ALL_STOCKS) if (chance(g, EVENT_CHANCE)) spawnCompanyEvent(g, s, add);

  let sumR = 0;
  for (const s of ALL_STOCKS) {
    const p = m.prices[s.ticker];
    const trend = s.drift - DRIFT_HAIRCUT + (m.edge[s.ticker] ?? 0);
    const fundamental = s.price * Math.pow(1 + trend, g.t - m.t0);
    const reversion = clamp(-0.012 * Math.log(p / fundamental), -0.03, 0.03);
    const climate = (m.regime.effect + currentPolicy().market) * s.beta + (m.sectorMood[s.sector]?.v ?? 0) + (m.groupMood[s.group]?.v ?? 0);
    const r = clamp(trend + (rnd(g) * 2 - 1) * s.vol + climate + (ev[s.ticker] ?? 0) + reversion, -0.7, 1);
    m.prices[s.ticker] = q(Math.max(s.price * 0.02, p * (1 + r)));
    m.lastChange[s.ticker] = m.prices[s.ticker] / p - 1;
    const h = m.history[s.ticker];
    h.push(m.prices[s.ticker]);
    if (h.length > HISTORY_LEN) h.shift();
    if (s.group !== 'cripto') sumR += m.lastChange[s.ticker];
  }
  m.index.push(m.index[m.index.length - 1] * (1 + sumR / INDEX_STOCKS.length));
  if (m.index.length > HISTORY_LEN) m.index.shift();

  carryCosts(g, acc);
  highlightMoves(g);
}

function highlightMoves(g: GameState) {
  const held = [...new Set([...Object.keys(g.portfolio.long), ...Object.keys(g.portfolio.short)])];
  const moves = held
    .map((tk) => ({ tk, r: g.market.lastChange[tk] ?? 0 }))
    .filter((x) => Math.abs(x.r) >= 0.1)
    .sort((a, b) => Math.abs(b.r) - Math.abs(a.r))
    .slice(0, 3);
  for (const { tk, r } of moves) {
    const s = stockByTicker(tk);
    if (!s) continue;
    const isShort = !!g.portfolio.short[tk] && !g.portfolio.long[tk];
    const good = isShort ? r < 0 : r > 0;
    pushFeed(g, r > 0 ? '📈' : '📉', (isShort
      ? (r > 0 ? t('{name} ({tk}) subiu {pct}% no mês — sua posição vendida {res}.', { name: t(s.name), tk, pct: Math.abs(Math.round(r * 100)), res: good ? t('lucrou') : t('sofreu') }) : t('{name} ({tk}) caiu {pct}% no mês — sua posição vendida {res}.', { name: t(s.name), tk, pct: Math.abs(Math.round(r * 100)), res: good ? t('lucrou') : t('sofreu') }))
      : (r > 0 ? t('{name} ({tk}) subiu {pct}% no mês.', { name: t(s.name), tk, pct: Math.abs(Math.round(r * 100)) }) : t('{name} ({tk}) caiu {pct}% no mês.', { name: t(s.name), tk, pct: Math.abs(Math.round(r * 100)) }))), good ? 'good' : 'bad');
  }
}

/** Dividendos (trimestrais), aluguel das ações vendidas a descoberto e chamadas de margem. */
function carryCosts(g: GameState, acc: Deltas) {
  const p = g.portfolio;
  const payMonth = (g.t % 12) % 3 === 2;
  let received = 0;
  let owed = 0;

  for (const [ticker, pos] of Object.entries(p.long)) {
    const s = stockByTicker(ticker);
    if (!s || !payMonth || s.yield <= 0) continue;
    received += (pos.shares * priceU(g, s) * s.yield) / 4;
  }
  for (const [ticker, pos] of Object.entries(p.short)) {
    const s = stockByTicker(ticker);
    if (!s) continue;
    const value = pos.shares * priceU(g, s);
    if (payMonth && s.yield > 0) owed += (value * s.yield) / 4;
    const borrow = value * SHORT_BORROW_MONTHLY;
    changeMoney(g, -borrow, acc);
    p.feesTotal += borrow;
    p.realizedYear -= borrow;
  }
  if (received > 0) {
    changeMoney(g, received, acc);
    p.dividendsTotal += received;
    p.realizedYear += received;
    pushFeed(g, '💰', t('Dividendos recebidos: {v}.', { v: formatMoney(received) }), 'good');
  }
  if (owed > 0) {
    changeMoney(g, -owed, acc);
    p.realizedYear -= owed;
    pushFeed(g, '💸', t('Você repôs {v} em dividendos das ações que vendeu a descoberto.', { v: formatMoney(owed) }), 'bad');
  }

  for (const ticker of Object.keys(p.short)) {
    const info = shortInfo(g, ticker);
    if (info && (info.equity ?? 0) < SHORT_MAINTENANCE * info.value) forceCover(g, ticker, acc);
  }
}

function settleTaxes(g: GameState, acc: Deltas) {
  const p = g.portfolio;
  const base = p.realizedYear + p.lossCarry;
  p.realizedYear = 0;
  if (base <= 0) {
    p.lossCarry = base;
    return;
  }
  p.lossCarry = 0;
  const rate = capGainsRate(g.country);
  const tax = Math.round(base * rate);
  if (tax <= 0) return;
  changeMoney(g, -tax, acc);
  p.taxPaid += tax;
  pushFeed(g, '🧾', t('Imposto sobre ganhos na bolsa em {v}: {v2} ({v3}% sobre {v4} de lucro).', { v: Math.floor(g.t / 12) - 1, v2: formatMoney(tax), v3: Math.round(rate * 100), v4: formatMoney(base) }), 'bad');
}

/** Evento vindo de fora do mercado (ex.: a tendência de uma marca). O impacto é absorvido no mês seguinte. */
export function injectEvent(g: GameState, ticker: string, impact: number, headline: string, tone: 'pos' | 'neg') {
  const s = stockByTicker(ticker);
  if (!s || g.market.prices[ticker] === undefined) return;
  const a = Math.abs(impact);
  const news = pushNews(g, { t: g.t, scope: 'empresa', ticker, sector: s.sector, group: s.group, kind: 'fato', tone, strength: a < 0.08 ? 1 : a < 0.18 ? 2 : 3, headline, done: false, realized: 0 });
  g.market.pending.push({ ticker, impact, t: g.t + 1, newsId: news.id });
}

// ---------- Operações do jogador ----------

export const feeRate = (g: GameState, s: StockDef) => (s.home === g.country ? FEE_HOME : FEE_FOREIGN);
export const tradeFee = (g: GameState, s: StockDef, notional: number) => Math.max(FEE_FLAT, notional * feeRate(g, s));
export const SHORT_MARGIN_RATIO = SHORT_MARGIN;
export const SHORT_MAINTENANCE_RATIO = SHORT_MAINTENANCE;

const fmtShares = (n: number) => (n >= 100 ? fmtNum(Math.round(n)) : n >= 1 ? dec(n, 2) : dec(n, 4));
export { fmtShares };

function guard(g: GameState, ticker: string): { s: StockDef } | string {
  if (g.dead) return '';
  if (ageYears(g) < MIN_AGE) return t('A bolsa abre aos 18 anos.');
  const s = stockByTicker(ticker);
  return s ? { s } : t('Ação desconhecida.');
}

function logTrade(g: GameState, t: Omit<Trade, 't'>) {
  g.portfolio.trades.unshift({ t: g.t, ...t });
  if (g.portfolio.trades.length > 40) g.portfolio.trades.length = 40;
}

export function buy(g: GameState, ticker: string, spend: number): string {
  const r = guard(g, ticker);
  if (typeof r === 'string') return r;
  const { s } = r;
  const fee = tradeFee(g, s, spend);
  if (spend <= fee * 1.5) return t('Valor muito baixo: a taxa mínima é {v}.', { v: formatMoney(fee) });
  if (spend > g.money + 1e-6) return t('Dinheiro insuficiente.');
  const price = priceU(g, s);
  const shares = (spend - fee) / price;
  const pos = (g.portfolio.long[ticker] ??= { shares: 0, cost: 0 });
  pos.shares += shares;
  pos.cost += spend;
  g.money -= spend;
  g.portfolio.feesTotal += fee;
  if (s.group === 'cripto') bump(g, 'cryptoTrades');
  logTrade(g, { ticker, side: 'compra', shares, price: g.market.prices[ticker], value: spend - fee, fee });
  return t('Você comprou {v} de {ticker} por {v2} (taxa {v3}).', { v: fmtShares(shares), ticker, v2: formatMoney(spend), v3: formatMoney(fee) });
}

export function sell(g: GameState, ticker: string, fraction: number): string {
  const r = guard(g, ticker);
  if (typeof r === 'string') return r;
  const { s } = r;
  const pos = g.portfolio.long[ticker];
  if (!pos) return t('Você não tem essa ação.');
  const all = fraction >= 0.9999;
  const shares = all ? pos.shares : pos.shares * fraction;
  const gross = shares * priceU(g, s);
  const fee = tradeFee(g, s, gross);
  const proceeds = gross - fee;
  const basis = pos.cost * (shares / pos.shares);
  const gain = proceeds - basis;
  g.money += proceeds;
  g.portfolio.realizedYear += gain;
  g.portfolio.realizedTotal += gain;
  g.portfolio.feesTotal += fee;
  if (all) delete g.portfolio.long[ticker];
  else {
    pos.shares -= shares;
    pos.cost -= basis;
  }
  if (s.group === 'cripto') bump(g, 'cryptoTrades');
  logTrade(g, { ticker, side: 'venda', shares, price: g.market.prices[ticker], value: gross, fee, gain });
  return t('Você vendeu {v} de {ticker} e recebeu {v2} ({v3} de {v4}).', { v: fmtShares(shares), ticker, v2: formatMoney(proceeds), v3: gain >= 0 ? t('lucro') : t('prejuízo'), v4: formatMoney(Math.abs(gain)) });
}

export function openShort(g: GameState, ticker: string, notional: number): string {
  const r = guard(g, ticker);
  if (typeof r === 'string') return r;
  const { s } = r;
  const fee = tradeFee(g, s, notional);
  const margin = notional * SHORT_MARGIN;
  if (notional <= fee * 1.5) return t('Valor muito baixo: a taxa mínima é {v}.', { v: formatMoney(fee) });
  if (g.money < margin + fee - 1e-6) return t('Margem insuficiente: precisa de {v} em caixa.', { v: formatMoney(margin + fee) });
  const shares = notional / priceU(g, s);
  const pos = (g.portfolio.short[ticker] ??= { shares: 0, proceeds: 0, margin: 0, since: g.t });
  pos.shares += shares;
  pos.proceeds += notional;
  pos.margin += margin;
  g.money -= margin + fee;
  g.portfolio.feesTotal += fee;
  g.portfolio.realizedYear -= fee;
  g.portfolio.realizedTotal -= fee;
  logTrade(g, { ticker, side: 'short', shares, price: g.market.prices[ticker], value: notional, fee });
  return t('Você vendeu {v} de {ticker} a descoberto ({v2}). Margem depositada: {v3}.', { v: fmtShares(shares), ticker, v2: formatMoney(notional), v3: formatMoney(margin) });
}

function closeShort(g: GameState, ticker: string, fraction: number, side: 'cobertura' | 'margem'): { gain: number; cash: number; shares: number } {
  const s = stockByTicker(ticker)!;
  const pos = g.portfolio.short[ticker];
  const all = fraction >= 0.9999;
  const f = all ? 1 : fraction;
  const shares = pos.shares * f;
  const proceeds = pos.proceeds * f;
  const margin = pos.margin * f;
  const cost = shares * priceU(g, s);
  const fee = tradeFee(g, s, cost);
  const cash = margin + proceeds - cost - fee;
  const gain = proceeds - cost - fee;
  g.money += cash;
  g.portfolio.realizedYear += gain;
  g.portfolio.realizedTotal += gain;
  g.portfolio.feesTotal += fee;
  if (all) delete g.portfolio.short[ticker];
  else {
    pos.shares -= shares;
    pos.proceeds -= proceeds;
    pos.margin -= margin;
  }
  logTrade(g, { ticker, side, shares, price: g.market.prices[ticker], value: cost, fee, gain });
  return { gain, cash, shares };
}

export function cover(g: GameState, ticker: string, fraction: number): string {
  const r = guard(g, ticker);
  if (typeof r === 'string') return r;
  if (!g.portfolio.short[ticker]) return t('Você não tem posição vendida nessa ação.');
  const { gain, shares } = closeShort(g, ticker, fraction, 'cobertura');
  return t('Você recomprou {v} de {ticker} e encerrou a posição vendida: {v2} de {v3}.', { v: fmtShares(shares), ticker, v2: gain >= 0 ? t('lucro') : t('prejuízo'), v3: formatMoney(Math.abs(gain)) });
}

function forceCover(g: GameState, ticker: string, acc: Deltas) {
  const before = g.money;
  const { gain } = closeShort(g, ticker, 1, 'margem');
  if (acc) acc.dinheiro = (acc.dinheiro ?? 0) + (g.money - before);
  const s = stockByTicker(ticker);
  pushFeed(g, '🚨', t('Chamada de margem: sua posição vendida em {v} foi encerrada à força com {v2} de {v3}.', { v: s?.name ?? ticker, v2: gain >= 0 ? t('lucro') : t('prejuízo'), v3: formatMoney(Math.abs(gain)) }), 'bad');
}

// ---------- Conversões de lugar e herança ----------

/** Ao mudar de país, os valores em unidades internas são reconvertidos pelo câmbio de mercado. */
export function rescalePortfolio(g: GameState, fromCountry: string, toCountry: string) {
  const k = unitsPerCurrency('USD', toCountry) / unitsPerCurrency('USD', fromCountry);
  const p = g.portfolio;
  for (const pos of Object.values(p.long)) pos.cost *= k;
  for (const pos of Object.values(p.short)) {
    pos.proceeds *= k;
    pos.margin *= k;
  }
  p.realizedYear *= k;
  p.lossCarry *= k;
  p.realizedTotal *= k;
  p.dividendsTotal *= k;
  p.feesTotal *= k;
  p.taxPaid *= k;
  for (const t of p.trades) {
    t.value *= k;
    t.fee *= k;
    if (t.gain !== undefined) t.gain *= k;
  }
}

/** No fim da vida as posições vendidas são liquidadas e viram dinheiro do espólio. */
export function settleEstate(g: GameState) {
  for (const ticker of Object.keys(g.portfolio.short)) closeShort(g, ticker, 1, 'cobertura');
}

/** O herdeiro recebe uma fatia das ações, com custo igual ao valor de mercado na data da herança. */
export function inheritLongs(g: GameState, from: Portfolio, share: number): Portfolio {
  const out = emptyPortfolio();
  for (const [ticker, pos] of Object.entries(from.long)) {
    const s = stockByTicker(ticker);
    if (!s) continue;
    const shares = pos.shares * share;
    out.long[ticker] = { shares, cost: shares * priceU(g, s) };
  }
  return out;
}

/** Rótulo do clima do mercado, deduzido da tendência recente do índice (sem revelar o estado interno). */
export function marketMood(g: GameState): { icon: string; label: string; trend: number } {
  const idx = g.market.index;
  const back = idx[Math.max(0, idx.length - 7)];
  const trend = idx[idx.length - 1] / back - 1;
  if (trend > 0.06) return { icon: '🐂', label: t('Mercado em alta'), trend };
  if (trend < -0.06) return { icon: '🐻', label: t('Mercado em queda'), trend };
  return { icon: '😐', label: t('Mercado lateral'), trend };
}
