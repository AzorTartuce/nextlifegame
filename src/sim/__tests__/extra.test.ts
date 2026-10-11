import { describe, expect, it } from 'vitest';
import { setWorld } from '../core';
import { CAREERS, COURSES } from '../data/careers';
import { choose, newGame } from '../game';
import { runAction } from '../systems/actions';
import { jobSalary, requirementGaps } from '../systems/career';
import { godEdit } from '../systems/god';
import { fertilityFactor } from '../systems/lifestate';
import { interact } from '../systems/life';
import { earnedRibbons } from '../systems/ribbons';
import type { GameState } from '../types';

function adult(seed = 81, age = 30, opts: { premium?: boolean; talent?: string } = {}): GameState {
  const g = newGame({ firstName: 'Ana', lastName: 'T', gender: 'f', attraction: 'm', seed, country: 'br', ...opts });
  g.player.birth = g.t - age * 12;
  g.money = 500_000;
  g.livesWithParents = false;
  setWorld(g);
  return g;
}

describe('família', () => {
  it('adoção cria um filho de verdade e rende a fita', () => {
    let g = adult();
    expect(runAction(g, 'act_adotar')).toBe('');
    g = choose(g, 1);
    const kid = Object.values(g.npcs).find((n) => n.role === 'filho');
    expect(kid).toBeTruthy();
    expect(Math.floor((g.t - kid!.birth) / 12)).toBe(5);
    expect(g.life.counters.adopted).toBe(1);
    expect(g.life.counters.kids).toBe(1);
    expect(g.life.karma).toBeGreaterThan(0);
    expect(earnedRibbons(g).map((r) => r.id)).toContain('lar');
  });

  it('barriga de aluguel custa caro e entrega um bebê', () => {
    const g = adult();
    const before = g.money;
    runAction(g, 'act_barriga');
    expect(before - g.money).toBe(40000);
    expect(Object.values(g.npcs).filter((n) => n.role === 'filho').length).toBe(1);
  });

  it('a fertilidade oculta e a idade pesam na chance de ter filhos', () => {
    const young = adult(1, 28);
    const old = adult(1, 42);
    old.life.fertility = young.life.fertility = 70;
    expect(fertilityFactor(old)).toBeLessThan(fertilityFactor(young) * 0.6);
    let low = 0, high = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const a = adult(seed, 30);
      a.life.fertility = 15;
      const spouse = Object.values(a.npcs)[0];
      spouse.role = 'conjuge';
      spouse.relation = 90;
      a.interactionsLeft = 5;
      interact(a, spouse.id, 'ter_filho');
      if (Object.values(a.npcs).some((n) => n.role === 'filho')) low++;
      const b = adult(seed, 30);
      b.life.fertility = 100;
      const sp = Object.values(b.npcs)[0];
      sp.role = 'conjuge';
      sp.relation = 90;
      b.interactionsLeft = 5;
      interact(b, sp.id, 'ter_filho');
      if (Object.values(b.npcs).some((n) => n.role === 'filho')) high++;
    }
    expect(high).toBeGreaterThan(low * 2);
  });
});

describe('escola e estudos', () => {
  it('clubes só na escola; professor melhora as notas; pós exige diploma e aumenta salários', () => {
    const adultG = adult();
    expect(runAction(adultG, 'act_clube_xadrez')).toMatch(/18 anos/);
    const kid = adult(1, 12);
    kid.education.inSchool = true;
    kid.education.schoolPerf = 50;
    expect(runAction(kid, 'act_professor')).toBe('');
    expect(kid.education.schoolPerf).toBeGreaterThan(50);

    const g = adult();
    expect(runAction(g, 'act_pos')).toMatch(/diploma/);
    g.education.degrees = ['engenharia'];
    g.job = { careerId: 'engenharia', level: 1, performance: 50, monthsInRole: 0, salaryBonus: 0 };
    const before = jobSalary(g.job);
    expect(runAction(g, 'act_pos')).toBe('');
    const after = choose(g, 0);
    setWorld(after);
    expect(jobSalary(after.job!)).toBeGreaterThan(before);
  });
});

describe('mais carreiras e cursos', () => {
  it('há mais de 35 carreiras e 16 cursos, todos coerentes', () => {
    expect(CAREERS.length).toBeGreaterThanOrEqual(35);
    expect(Object.keys(COURSES).length).toBe(16);
    expect(new Set(CAREERS.map((c) => c.id)).size).toBe(CAREERS.length);
    for (const c of CAREERS) {
      expect(c.levels.length).toBeGreaterThanOrEqual(3);
      for (let i = 1; i < c.levels.length; i++) expect(c.levels[i].salary).toBeGreaterThan(c.levels[i - 1].salary);
      if (c.req.degree) expect(COURSES[c.req.degree]).toBeDefined();
    }
  });

  it('piloto e motorista de app exigem licença; policial exige ficha limpa', () => {
    const g = adult();
    g.education.level = 'superior';
    expect(requirementGaps(g, CAREERS.find((c) => c.id === 'piloto')!).join()).toMatch(/Licença/);
    g.life.licenses.aviao = true;
    expect(requirementGaps(g, CAREERS.find((c) => c.id === 'piloto')!).join()).not.toMatch(/Licença/);
    expect(requirementGaps(g, CAREERS.find((c) => c.id === 'motorista')!).join()).toMatch(/Licença/);
    g.education.level = 'medio';
    g.life.crime.record = 1;
    expect(requirementGaps(g, CAREERS.find((c) => c.id === 'policia')!).join()).toMatch(/Ficha/);
  });
});

describe('Modo Deus', () => {
  it('só funciona no premium e edita qualquer pessoa', () => {
    const g = adult();
    expect(godEdit(g, g.player.id, { stats: { carisma: 99 } })).toMatch(/premium/);
    g.life.premium = true;
    const mae = Object.values(g.npcs).find((n) => n.role === 'mae')!;
    godEdit(g, mae.id, { stats: { saude: 5, felicidade: 150 }, traits: ['genio', 'ansioso', 'criativo', 'atletico'], relation: 12 });
    expect(mae.stats.saude).toBe(5);
    expect(mae.stats.felicidade).toBe(100);
    expect(mae.traits.length).toBe(3);
    expect(mae.relation).toBe(12);
    const m = g.money;
    godEdit(g, g.player.id, { money: 1000, stats: { inteligencia: 100 } });
    expect(g.money).toBe(m + 1000);
    expect(g.player.stats.inteligencia).toBe(100);
    expect(godEdit(g, 'x', {})).toMatch(/encontrada/);
  });

  it('o talento ao nascer só vale no premium e empurra uma área da vida', () => {
    const plain = adult(1, 30, { talent: 'ciencia' });
    expect(plain.life.talent).toBeNull();
    const sci = adult(1, 30, { premium: true, talent: 'ciencia' });
    expect(sci.life.talent).toBe('ciencia');
    expect(sci.player.traits).toContain('genio');
    const mus = adult(2, 30, { premium: true, talent: 'musica' });
    expect(mus.life.special.music?.skill).toBe(22);
    const spo = adult(3, 30, { premium: true, talent: 'esporte' });
    expect(spo.life.special.sport?.skill).toBe(25);
  });
});
