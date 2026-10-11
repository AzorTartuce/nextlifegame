import { describe, expect, it } from 'vitest';
import { ageYears } from '../core';
import { formatMoney, setWorld } from '../core';
import { COUNTRIES, countryById } from '../data/world';
import { advance, choose, continueAsHeir, heirs, newGame } from '../game';
import { canMove, relocate } from '../systems/world';
import { foundCompany } from '../systems/company';
import { applyForJob } from '../systems/career';
import type { GameState } from '../types';

function playLife(seed: number, maxTurns = 3000, country = 'br') {
  let g = newGame({ firstName: 'Ana', lastName: 'Teste', gender: 'f', attraction: 'm', seed, country });
  g.agenda = { estudo: 8, exercicio: 6, social: 8, lazer: 6, bico: 0, carreira: 4, empresa: 10 };
  for (let i = 0; i < maxTurns && !g.dead; i++) {
    if (g.pending) {
      g = choose(g, g.pending.choices[i % g.pending.choices.length].index);
      continue;
    }
    if (ageYears(g) >= 18 && !g.job && g.jobOffers.length) applyForJob(g, 0);
    if (ageYears(g) >= 25 && !g.company && g.money > 25000) foundCompany(g, 'cafe', 'Teste Café');
    g = advance(g);
  }
  return g;
}

describe('simulação', () => {
  it('é determinística com a mesma seed', () => {
    const a = playLife(42, 400);
    const b = playLife(42, 400);
    expect(a.t).toBe(b.t);
    expect(a.money).toBe(b.money);
    expect(a.feed.map((f) => f.text)).toEqual(b.feed.map((f) => f.text));
  });

  it('joga vidas inteiras sem quebrar', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const g = playLife(seed);
      expect(g.dead).not.toBeNull();
      expect(Number.isFinite(g.money)).toBe(true);
      for (const k of Object.values(g.player.stats)) expect(k).toBeGreaterThanOrEqual(0);
      expect(g.feed.some((f) => f.text.includes('???') || /\{\w/.test(f.text))).toBe(false);
    }
  });

  it('continua a dinastia com um herdeiro', () => {
    let found: GameState | null = null;
    for (let seed = 10; seed < 60 && !found; seed++) {
      const g = playLife(seed);
      if (heirs(g).length) found = g;
    }
    expect(found).not.toBeNull();
    const next = continueAsHeir(found!, heirs(found!)[0].id);
    expect(next.generation).toBe(2);
    expect(next.dead).toBeNull();
    const after = advance(next);
    expect(after.turn).toBe(1);
  });

  it('funciona em todos os países do mundo, com moeda e nomes locais', () => {
    for (const c of COUNTRIES) {
      const g = playLife(7, 1500, c.id);
      expect(g.country).toBe(c.id);
      expect(g.feed.some((f) => f.text.includes('???') || /\{\w/.test(f.text) || f.text.includes('undefined') || f.text.includes('NaN'))).toBe(false);
      expect(c.cities.some((x) => x.name === g.city)).toBe(true);
      const pool = [...c.names.m, ...c.names.f];
      const mae = Object.values(g.npcs).find((n) => n.role === 'mae');
      expect(mae && pool.includes(mae.firstName)).toBe(true);
    }
  });

  it('converte dinheiro para a moeda local', () => {
    setWorld({ country: 'jp', city: 'Tóquio' });
    expect(formatMoney(1000)).toContain('¥');
    expect(formatMoney(1000)).toBe(`¥${Math.round(1000 * countryById('jp').k).toLocaleString('pt-BR')}`);
    setWorld({ country: 'us', city: 'Nova York' });
    expect(formatMoney(1000)).toBe(`US$${Math.round(1000 * countryById('us').k).toLocaleString('pt-BR')}`);
  });

  it('mudar de país troca o lugar, preserva o poder de compra e remove vínculos locais', () => {
    let g = newGame({ firstName: 'Ana', lastName: 'T', gender: 'f', attraction: 'm', seed: 3, country: 'br', city: 'São Paulo' });
    while (ageYears(g) < 24) { if (g.pending) g = choose(g, g.pending.choices[0].index); g = { ...advance(g), lastResult: null }; }
    g.money = 50000;
    g.flags.mudou = undefined as never;
    delete g.flags.mudou;
    expect(canMove(g, 'de', 'Berlim')).toBeNull();
    const before = g.money * countryById('br').k / countryById('br').ppp;
    relocate(g, 'de', 'Berlim');
    expect(g.country).toBe('de');
    expect(g.city).toBe('Berlim');
    expect(g.job).toBeNull();
    const after = g.money * countryById('de').k / countryById('de').ppp;
    expect(Math.abs(after - before) / before).toBeLessThan(0.1);
    expect(canMove(g, 'fr', 'Paris')).toMatch(/há pouco/);
    expect(Object.values(g.npcs).some((n) => ['colega', 'rival', 'conhecido'].includes(n.role))).toBe(false);
  });
});
