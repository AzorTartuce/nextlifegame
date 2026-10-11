import { describe, expect, it } from 'vitest';
import { setWorld } from '../core';
import { ALL_STOCKS, CURRENCY_SYMBOL, FX_PER_USD, SECTOR_META, stockByTicker } from '../data/market';
import { newGame } from '../game';
import { buy, cover, marketTick, openShort, sell } from '../systems/market';
import { buildLLMPrompt, parseLLMResponse } from '../systems/news';
import { portfolioValue, longInfo } from '../systems/valuation';
import { relocate } from '../systems/world';
import type { GameState } from '../types';

function adult(country = 'br', city = 'São Paulo', seed = 11): GameState {
  const g = newGame({ firstName: 'Ana', lastName: 'T', gender: 'f', attraction: 'm', seed, country, city });
  g.player.birth = g.t - 30 * 12;
  g.money = 200000;
  return g;
}

describe('mercado de ações', () => {
  it('carrega as 100 empresas do documento e as criptomoedas, com dados válidos', () => {
    expect(ALL_STOCKS.length).toBe(108);
    for (const s of ALL_STOCKS) {
      expect(s.price).toBeGreaterThan(0);
      expect(SECTOR_META[s.sector]).toBeDefined();
      expect(FX_PER_USD[s.currency]).toBeGreaterThan(0);
      expect(CURRENCY_SYMBOL[s.currency]).toBeDefined();
      expect(s.vol).toBeGreaterThan(0);
    }
    expect(stockByTicker('PETR4')?.currency).toBe('BRL');
    expect(stockByTicker('AAPL')?.price).toBe(230);
  });

  it('preços ficam finitos e positivos por 60 anos e o índice tem retorno razoável', () => {
    let total = 0;
    const seeds = [1, 2, 3, 4, 5, 6];
    for (const seed of seeds) {
      const g = adult('br', 'São Paulo', seed);
      const start = g.market.index[g.market.index.length - 1];
      for (let i = 0; i < 720; i++) {
        g.t += 1;
        marketTick(g, {});
      }
      for (const s of ALL_STOCKS) {
        const p = g.market.prices[s.ticker];
        expect(Number.isFinite(p) && p > 0).toBe(true);
        expect(g.market.history[s.ticker].length).toBeLessThanOrEqual(60);
      }
      const idx = g.market.index[g.market.index.length - 1];
      expect(Number.isFinite(idx) && idx > 0).toBe(true);
      total += Math.pow(idx / start, 1 / 60) - 1;
    }
    const avg = total / seeds.length;
    expect(avg).toBeGreaterThan(-0.02);
    expect(avg).toBeLessThan(0.14);
  });

  it('a mesma semente gera o mesmo mercado', () => {
    const a = adult('us', 'Nova York', 5);
    const b = adult('us', 'Nova York', 5);
    for (let i = 0; i < 60; i++) {
      a.t += 1; b.t += 1;
      marketTick(a, {}); marketTick(b, {});
    }
    expect(a.market.prices).toEqual(b.market.prices);
    expect(a.market.news.map((n) => n.headline)).toEqual(b.market.news.map((n) => n.headline));
  });

  it('as notícias não deixam marcadores sem resolver', () => {
    const g = adult();
    for (let i = 0; i < 240; i++) { g.t += 1; marketTick(g, {}); }
    expect(g.market.news.length).toBeGreaterThan(10);
    for (const n of g.market.news) {
      expect(n.headline).not.toMatch(/[{}#\[\]]|undefined|NaN/);
      expect(n.headline.length).toBeGreaterThan(15);
    }
  });

  it('comprar e vender custa só as taxas, e menores no mercado doméstico', () => {
    const g = adult();
    const before = g.money;
    expect(buy(g, 'PETR4', 10000)).toContain('comprou');
    expect(g.money).toBeCloseTo(before - 10000, 6);
    const info = longInfo(g, 'PETR4')!;
    expect(info.value).toBeCloseTo(10000 - Math.max(0.5, 10000 * 0.0025), 4);
    sell(g, 'PETR4', 1);
    expect(g.portfolio.long.PETR4).toBeUndefined();
    const loss = before - g.money;
    expect(loss).toBeGreaterThan(40);
    expect(loss).toBeLessThan(60);
    // Ação estrangeira: taxa maior.
    const g2 = adult();
    buy(g2, 'AAPL', 10000);
    sell(g2, 'AAPL', 1);
    expect(200000 - g2.money).toBeGreaterThan(loss);
  });

  it('só permite operar a partir dos 18 anos e sem dinheiro negativo', () => {
    const g = adult();
    g.player.birth = g.t - 12 * 12;
    expect(buy(g, 'PETR4', 1000)).toMatch(/18 anos/);
    const h = adult();
    h.money = 100;
    expect(buy(h, 'PETR4', 1000)).toMatch(/insuficiente/);
  });

  it('short: deposita margem, lucra com a queda e é encerrado à força se subir demais', () => {
    const g = adult();
    const before = g.money;
    expect(openShort(g, 'VALE3', 20000)).toContain('descoberto');
    expect(g.money).toBeLessThan(before - 10000);
    const pos = g.portfolio.short.VALE3;
    expect(pos.margin).toBe(10000);
    // Queda de 40%: dá para encerrar com lucro.
    g.market.prices.VALE3 *= 0.6;
    const msg = cover(g, 'VALE3', 1);
    expect(msg).toContain('lucro');
    expect(g.money).toBeGreaterThan(before);

    const h = adult();
    openShort(h, 'VALE3', 20000);
    h.market.prices.VALE3 *= 2.2;
    h.t += 1;
    marketTick(h, {});
    expect(h.portfolio.short.VALE3).toBeUndefined();
    expect(h.feed.some((f) => f.text.includes('Chamada de margem'))).toBe(true);
    expect(h.portfolio.trades[0].side).toBe('margem');
  });

  it('cobra imposto sobre o lucro realizado em janeiro, com a alíquota do país', () => {
    const g = adult('br');
    g.t = 2031 * 12;
    g.portfolio.realizedYear = 10000;
    const before = g.money;
    marketTick(g, {});
    expect(before - g.money).toBeGreaterThan(1500);
    expect(g.portfolio.taxPaid).toBeGreaterThan(1500);
    expect(g.portfolio.realizedYear).toBe(0);

    const e = adult('ae', 'Dubai');
    e.t = 2031 * 12;
    e.portfolio.realizedYear = 10000;
    const eb = e.money;
    marketTick(e, {});
    expect(e.money).toBeGreaterThanOrEqual(eb - 1); // Emirados: sem imposto

    const loss = adult('br');
    loss.t = 2031 * 12;
    loss.portfolio.realizedYear = -5000;
    marketTick(loss, {});
    expect(loss.portfolio.lossCarry).toBe(-5000);
  });

  it('paga dividendos trimestrais das ações em carteira', () => {
    const g = adult();
    buy(g, 'ITUB4', 50000);
    g.t = 2030 * 12 + 2;
    const before = g.money;
    marketTick(g, {});
    expect(g.money).toBeGreaterThan(before);
    expect(g.portfolio.dividendsTotal).toBeGreaterThan(0);
  });

  it('mudar de país preserva o lucro percentual das posições', () => {
    const g = adult('br');
    buy(g, 'AAPL', 30000);
    g.market.prices.AAPL *= 1.2;
    const pct = longInfo(g, 'AAPL')!.pnlPct;
    g.flags.mudou = undefined as never;
    delete g.flags.mudou;
    relocate(g, 'de', 'Berlim');
    expect(g.country).toBe('de');
    expect(longInfo(g, 'AAPL')!.pnlPct).toBeCloseTo(pct, 6);
    expect(portfolioValue(g)).toBeGreaterThan(0);
  });

  it('patrimônio líquido inclui a carteira', () => {
    const g = adult();
    setWorld(g);
    const v0 = portfolioValue(g);
    buy(g, 'PETR4', 40000);
    expect(portfolioValue(g)).toBeGreaterThan(v0 + 39000);
  });

  it('interface de IA: prompt e validação da resposta', () => {
    const s = stockByTicker('NVDA')!;
    const prompt = buildLLMPrompt({ scope: 'empresa', tone: 'neg', strength: 3, kind: 'fato', stock: s });
    expect(prompt).toContain('NVIDIA');
    expect(prompt).toContain('JSON');
    expect(parseLLMResponse('{"manchete":"Hackers expõem dados da empresa","impacto":-0.22}')).toEqual({ headline: 'Hackers expõem dados da empresa', impact: -0.22 });
    expect(parseLLMResponse('{"manchete":"x","impacto":-3}')?.impact).toBe(-0.5);
    expect(parseLLMResponse('não é json')).toBeNull();
    expect(parseLLMResponse('{"manchete":"","impacto":0.1}')).toBeNull();
  });
});
