import { describe, expect, it } from 'vitest';
import { hasEn } from '../../i18n';
import { ageYears } from '../core';
import { CONDITIONS } from '../data/health';
import { advance, choose, newGame } from '../game';
import { actionStatus, getAction, runAction } from '../systems/actions';
import { addAddiction, addCondition, healthDeath, healthPenalty, healthTick, knownConditions, treatCondition } from '../systems/health';
import { bump, takeQueuedDeath } from '../systems/lifestate';
import { RIBBONS, earnedRibbons, lifeScore, tierOf } from '../systems/ribbons';
import type { GameState } from '../types';

function adult(seed = 31, country = 'br'): GameState {
  const g = newGame({ firstName: 'Ana', lastName: 'T', gender: 'f', attraction: 'm', seed, country });
  g.player.birth = g.t - 40 * 12;
  g.money = 1_000_000;
  g.livesWithParents = false;
  return g;
}

describe('saúde: doenças', () => {
  it('doenças crônicas começam sem diagnóstico e pioram sem tratamento', () => {
    const g = adult();
    const c = addCondition(g, 'diabetes', 29)!;
    expect(c.known).toBe(false);
    expect(knownConditions(g).length).toBe(0);
    for (let i = 0; i < 6; i++) { g.t += 1; healthTick(g, {}); }
    const cur = g.life.health.conditions.find((x) => x.id === 'diabetes');
    expect(cur!.severity).toBeGreaterThan(29);
    expect(cur!.known).toBe(true); // sintomas aparecem quando fica mais grave
  });

  it('tratamento de médico estabiliza a doença e cobra os remédios', () => {
    const g = adult();
    addCondition(g, 'hipertensao', 50)!.known = true;
    const before = g.money;
    expect(treatCondition(g, 'hipertensao', 'ocidental')).toBeTruthy();
    // pode falhar (10%): repete até iniciar
    for (let i = 0; i < 8 && !g.life.health.conditions[0].treated; i++) treatCondition(g, 'hipertensao', 'ocidental');
    const c = g.life.health.conditions[0];
    expect(c.treated).toBe(true);
    expect(g.money).toBeLessThan(before);
    const sev = c.severity;
    const money = g.money;
    for (let i = 0; i < 12; i++) { g.t += 1; healthTick(g, {}); }
    expect(g.life.health.conditions[0].severity).toBeLessThan(sev);
    expect(g.money).toBeLessThan(money);
  });

  it('doença aguda some sozinha; tratamento acelera', () => {
    const g = adult();
    addCondition(g, 'gripe', 30);
    for (let i = 0; i < 6; i++) { g.t += 1; healthTick(g, {}); }
    expect(g.life.health.conditions.some((c) => c.id === 'gripe')).toBe(false);
  });

  it('doenças pesam na meta de saúde e podem matar', () => {
    const g = adult();
    const p0 = healthPenalty(g).saude;
    addCondition(g, 'cancer', 90)!.known = true;
    expect(healthPenalty(g).saude).toBeGreaterThan(p0 + 25);
    let died = 0;
    for (let i = 0; i < 400; i++) if (healthDeath(g)) died++;
    expect(died).toBeGreaterThan(5);
  });

  it('curandeiro e médico alternativo são mais baratos e menos eficazes', () => {
    let doc = 0, healer = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const g = adult(seed);
      addCondition(g, 'asma', 30)!.known = true;
      treatCondition(g, 'asma', 'ocidental');
      if (g.life.health.conditions[0]?.treated) doc++;
      const h = adult(seed + 1000);
      addCondition(h, 'asma', 30)!.known = true;
      treatCondition(h, 'asma', 'curandeiro');
      if (h.life.health.conditions[0]?.treated) healer++;
    }
    expect(doc).toBeGreaterThan(healer * 3);
  });
});

describe('saúde: vícios', () => {
  it('vício cresce enquanto a pessoa usa, custa dinheiro e pesa na saúde', () => {
    const g = adult();
    addAddiction(g, 'cigarro', 40);
    const money = g.money;
    const pen = healthPenalty(g).saude;
    for (let i = 0; i < 6; i++) { g.t += 1; healthTick(g, {}); }
    expect(g.life.health.addictions.cigarro).toBeGreaterThan(40);
    expect(g.money).toBeLessThan(money);
    expect(healthPenalty(g).saude).toBeGreaterThan(pen);
  });

  it('reabilitação zera os vícios em três meses', () => {
    const g = adult();
    addAddiction(g, 'alcool', 70);
    expect(runAction(g, 'act_reabilitacao')).toBe('');
    expect(g.life.health.rehabLeft).toBe(3);
    for (let i = 0; i < 3; i++) { g.t += 1; healthTick(g, {}); }
    expect(g.life.health.rehabLeft).toBe(0);
    expect(Object.keys(g.life.health.addictions).length).toBe(0);
    expect(g.life.counters.rehabs).toBe(1);
  });

  it('overdose pode matar (morte enfileirada)', () => {
    let deaths = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const g = adult(seed);
      addAddiction(g, 'drogas', 95);
      for (let i = 0; i < 24 && !g.flags.pendingDeath; i++) { g.t += 1; healthTick(g, {}); }
      if (takeQueuedDeath(g)?.key === 'overdose') deaths++;
    }
    expect(deaths).toBeGreaterThan(20);
  });
});

describe('ações', () => {
  it('cobram o custo, respeitam espera e mostram a cena de resultado', () => {
    const g = adult();
    const before = g.money;
    expect(runAction(g, 'act_spa')).toBe('');
    expect(g.money).toBe(before - 300);
    expect(g.lastResult?.title).toBeTruthy();
    expect(g.feed[0].kind).toBe('event');
    g.lastResult = null;
    const st = actionStatus(g, getAction('act_spa')!);
    expect(st.ok).toBe(false);
    expect(st.reason).toMatch(/meses/);
  });

  it('bloqueiam por idade, dinheiro e estado', () => {
    const g = adult();
    g.player.birth = g.t - 10 * 12;
    expect(runAction(g, 'act_cir_rino')).toMatch(/18/);
    const h = adult();
    h.money = 5;
    expect(runAction(h, 'act_checkup')).toBeTruthy();
    expect(h.life.counters.surgeries).toBeUndefined();
    expect(actionStatus(adult(), getAction('act_reabilitacao')!).ok).toBe(false);
  });

  it('cirurgia plástica sorteia sucesso ou fracasso e conta nas fitas', () => {
    let up = 0, down = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const g = adult(seed);
      g.player.stats.aparencia = 50;
      runAction(g, 'act_cir_rino');
      if (g.player.stats.aparencia > 50) up++; else down++;
      expect(g.life.counters.surgeries).toBe(1);
    }
    expect(up).toBeGreaterThan(down * 4);
    expect(down).toBeGreaterThan(3);
  });

  it('academia melhora a meta de saúde e cobra mensalidade', () => {
    const g = adult();
    runAction(g, 'act_academia_entrar');
    expect(g.life.health.gym).toBe(true);
    const m = g.money;
    g.t += 1; healthTick(g, {});
    expect(g.money).toBe(m - 70);
  });
});

describe('fitas e pontuação', () => {
  it('toda fita tem tradução e a lista termina na fita padrão', () => {
    for (const r of RIBBONS) {
      expect(hasEn(r.name)).toBe(true);
      expect(hasEn(r.desc)).toBe(true);
    }
    expect(RIBBONS[RIBBONS.length - 1].id).toBe('discreta');
  });

  it('pontuação premia vida longa, rica e boa; crimes descontam', () => {
    const g = adult();
    g.player.birth = g.t - 90 * 12;
    g.money = 1000;
    const base = lifeScore(g).total;
    g.money = 5_000_000;
    expect(lifeScore(g).total).toBeGreaterThan(base + 50);
    const rich = lifeScore(g).total;
    bump(g, 'crimes', 10);
    bump(g, 'jailMonths', 60);
    expect(lifeScore(g).total).toBeLessThan(rich - 60);
    expect(tierOf(900).name).toBe('Vida de Lenda');
    expect(tierOf(10).name).toBe('Vida Apagada');
  });

  it('fitas conferem conquistas reais', () => {
    const g = adult();
    g.dead = { cause: 'x', causeKey: 'heroi', t: g.t };
    expect(earnedRibbons(g)[0].id).toBe('heroi');
    g.dead = null;
    g.money = 60_000_000;
    expect(earnedRibbons(g).map((r) => r.id)).toContain('bilionario');
    bump(g, 'kills', 6);
    expect(earnedRibbons(g).map((r) => r.id)).toContain('serial');
  });

  it('uma vida inteira termina com pontuação e ao menos uma fita', () => {
    let g = newGame({ firstName: 'A', lastName: 'B', gender: 'f', attraction: 'm', seed: 9, country: 'br' });
    for (let i = 0; i < 3000 && !g.dead; i++) {
      if (g.pending) { g = choose(g, g.pending.choices[0].index); continue; }
      g = { ...advance(g), lastResult: null };
    }
    expect(g.dead).not.toBeNull();
    expect(g.dead!.score).toBeGreaterThan(0);
    expect(g.dead!.ribbons!.length).toBeGreaterThan(0);
  });
});

describe('equilíbrio da saúde', () => {
  it('a vida média continua longa, com doenças aparecendo ao longo dela', () => {
    const ages: number[] = [];
    let withChronic = 0;
    for (let seed = 1; seed <= 20; seed++) {
      let g = newGame({ firstName: 'A', lastName: 'B', gender: seed % 2 ? 'f' : 'm', attraction: 'm', seed, country: 'br' });
      let sawChronic = false;
      for (let i = 0; i < 3000 && !g.dead; i++) {
        if (g.pending) { g = choose(g, g.pending.choices[0].index); continue; }
        g = { ...advance(g), lastResult: null };
        if (g.life.health.conditions.some((c) => CONDITIONS.find((d) => d.id === c.id)!.chronic)) sawChronic = true;
      }
      ages.push(ageYears(g));
      if (sawChronic) withChronic++;
    }
    const avg = ages.reduce((a, b) => a + b, 0) / ages.length;
    console.log('Idade média de morte:', avg.toFixed(1), 'mín', Math.min(...ages), 'máx', Math.max(...ages), 'com doença crônica:', withChronic, '/ 20');
    expect(avg).toBeGreaterThan(58);
    expect(avg).toBeLessThan(96);
    expect(withChronic).toBeGreaterThan(6);
  });
});
