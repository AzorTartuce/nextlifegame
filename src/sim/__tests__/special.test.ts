import { describe, expect, it } from 'vitest';
import { currentPolicy, setWorld } from '../core';
import { OFFICES } from '../data/politics';
import { choose, newGame } from '../game';
import { runAction } from '../systems/actions';
import { incomeTax } from '../systems/career';
import { takeQueuedDeath } from '../systems/lifestate';
import { acceptBribe, baseSupport, enactLaw, politicsOf, politicsTick, startCampaign } from '../systems/politics';
import { earnedRibbons } from '../systems/ribbons';
import { specialHours, specialTick } from '../systems/special';
import type { GameState } from '../types';

function adult(seed = 61, age = 40): GameState {
  const g = newGame({ firstName: 'Ana', lastName: 'T', gender: 'f', attraction: 'm', seed, country: 'br' });
  g.player.birth = g.t - age * 12;
  g.money = 3_000_000;
  g.livesWithParents = false;
  g.player.stats.carisma = 80;
  g.player.stats.inteligencia = 85;
  g.player.stats.saude = 90;
  setWorld(g);
  return g;
}

function join(g: GameState, partyIndex = 1): GameState {
  expect(runAction(g, 'act_pol_filiar')).toBe('');
  return choose(g, partyIndex);
}

describe('política', () => {
  it('filiar-se abre a carreira; a candidatura segue a escada de cargos', () => {
    let g = adult();
    expect(runAction(g, 'act_pol_cand_0')).toMatch(/partido/);
    g = join(g);
    expect(politicsOf(g)?.party).toBe('centro');
    expect(runAction(g, 'act_pol_cand_2')).toMatch(/seguinte/);
    expect(runAction(g, 'act_pol_cand_0')).toBe('');
    expect(politicsOf(g)!.campaign?.office).toBe(0);
    expect(g.money).toBe(3_000_000 - OFFICES[0].cost);
    expect(runAction(g, 'act_pol_cand_0')).toMatch(/campanha/);
  });

  it('ficha suja e pouca idade fecham a política', () => {
    const g = adult();
    g.life.crime.record = 1;
    expect(runAction(g, 'act_pol_filiar')).toMatch(/Ficha/);
    const kid = adult(61, 19);
    kid.life.special.politics = { party: 'centro', office: -1, monthsLeft: 0, approval: 50, terms: 0, scandals: 0, laws: [], campaign: null };
    expect(runAction(kid, 'act_pol_cand_0')).toMatch(/21/);
  });

  it('a eleição depende do apoio: carisma e campanha ganham votos', () => {
    let wins = 0, strongWins = 0;
    for (let seed = 1; seed <= 80; seed++) {
      const g = adult(seed);
      g.life.special.politics = { party: 'centro', office: -1, monthsLeft: 0, approval: 50, terms: 0, scandals: 0, laws: [], campaign: null };
      startCampaign(g, 0);
      for (let i = 0; i < 6; i++) { g.t += 1; politicsTick(g, {}); }
      if (politicsOf(g)!.office === 0) wins++;
      const h = adult(seed);
      h.life.special.politics = { party: 'centro', office: -1, monthsLeft: 0, approval: 50, terms: 0, scandals: 0, laws: [], campaign: null };
      startCampaign(h, 0);
      h.life.special.politics.campaign!.support = 95;
      for (let i = 0; i < 6; i++) { h.t += 1; politicsTick(h, {}); }
      if (politicsOf(h)!.office === 0) strongWins++;
    }
    expect(strongWins).toBeGreaterThan(wins);
    expect(strongWins).toBeGreaterThan(55);
    expect(wins).toBeLessThan(55);
  });

  it('ao governar: salário mensal, aprovação, leis com efeito real e fim de mandato', () => {
    const g = adult();
    g.life.special.politics = { party: 'centro', office: 1, monthsLeft: 3, approval: 60, terms: 1, scandals: 0, laws: [], campaign: null };
    const before = g.money;
    g.t += 1; politicsTick(g, {});
    expect(g.money - before).toBe(OFFICES[1].pay);
    expect(specialHours(g)).toBeGreaterThanOrEqual(25);

    const tax0 = incomeTax(10000);
    enactLaw(g, 'cortar_impostos');
    setWorld(g);
    expect(currentPolicy().tax).toBeCloseTo(-0.03);
    expect(incomeTax(10000)).toBeLessThan(tax0);
    enactLaw(g, 'aumentar_impostos');
    setWorld(g);
    expect(politicsOf(g)!.laws).not.toContain('cortar_impostos');
    expect(incomeTax(10000)).toBeGreaterThan(tax0);

    enactLaw(g, 'saude_publica');
    setWorld(g);
    expect(currentPolicy().mortality).toBeLessThan(1);

    for (let i = 0; i < 3; i++) { g.t += 1; politicsTick(g, {}); }
    expect(politicsOf(g)!.office).toBe(-1);
    setWorld(g);
    expect(currentPolicy().tax).toBe(0);
  });

  it('aprovação muito baixa gera impeachment', () => {
    const g = adult();
    g.life.special.politics = { party: 'centro', office: 2, monthsLeft: 30, approval: 12, terms: 1, scandals: 0, laws: ['aumentar_impostos', 'cortar_gastos'], campaign: null };
    g.t += 1; politicsTick(g, {});
    expect(politicsOf(g)!.office).toBe(-1);
    expect(politicsOf(g)!.scandals).toBe(1);
  });

  it('suborno rende dinheiro, mas escândalos acumulados terminam em investigação', () => {
    const g = adult();
    g.life.special.politics = { party: 'centro', office: 2, monthsLeft: 40, approval: 70, terms: 1, scandals: 2, laws: [], campaign: null };
    let hadScandal = false;
    for (let i = 0; i < 60 && politicsOf(g)!.office >= 0; i++) {
      const m = g.money;
      acceptBribe(g);
      expect(g.money).toBeGreaterThan(m);
      hadScandal = hadScandal || politicsOf(g)!.scandals >= 3;
    }
    expect(hadScandal).toBe(true);
    expect(politicsOf(g)!.office).toBe(-1);
    expect(g.life.crime.trial).not.toBeNull();
  });

  it('chegar ao topo conta para a fita de chefe de estado', () => {
    const g = adult();
    g.life.special.politics = { party: 'centro', office: 3, monthsLeft: 2, approval: 70, terms: 3, scandals: 0, laws: [], campaign: { office: 4, months: 1, support: 99, opp: 40 } };
    g.t += 1; politicsTick(g, {});
    expect(politicsOf(g)!.office).toBe(4);
    expect(earnedRibbons(g).map((r) => r.id)).toContain('presidente');
  });

  it('o clima eleitoral e o partido mexem no apoio inicial', () => {
    const g = adult();
    g.life.special.politics = { party: 'prog', office: -1, monthsLeft: 0, approval: 50, terms: 0, scandals: 0, laws: [], campaign: null };
    g.flags.polMood = -1;
    const aligned = baseSupport(g, politicsOf(g)!, 0);
    g.flags.polMood = 1;
    expect(baseSupport(g, politicsOf(g)!, 0)).toBeLessThan(aligned);
  });
});

describe('música, atuação, esporte e espaço', () => {
  it('música: do primeiro acorde ao álbum, turnê e royalties', () => {
    let g = adult();
    expect(runAction(g, 'act_mus_praticar')).toMatch(/começou/);
    runAction(g, 'act_mus_comecar');
    g = choose(g, 0);
    expect(g.life.special.music?.instrument).toBe('violao');
    g.life.special.music!.skill = 70;
    g.life.special.music!.fans = 30000;
    g.money = 3_000_000;
    runAction(g, 'act_mus_banda');
    expect(g.life.special.music!.band).toBeTruthy();
    g.lastResult = null;
    runAction(g, 'act_mus_gravadora');
    expect(g.life.special.music!.label).toBe(true);
    let albums = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const h = adult(seed);
      h.life.special.music = { instrument: 'voz', skill: 70, band: 'X', albums: 0, fans: 5000, label: false, lastAlbum: -99 };
      runAction(h, 'act_mus_album');
      albums += h.life.special.music.albums;
    }
    expect(albums).toBeGreaterThan(15);
    const m = g.money;
    specialTick(g, {});
    expect(g.money).toBeGreaterThan(m);
    g.life.special.music!.albums = 1;
    g.life.special.music!.fans = 300000;
    g.cooldowns = {};
    const before = g.money;
    runAction(g, 'act_mus_turne');
    expect(g.money).toBeGreaterThan(before);
    expect(specialHours(g)).toBeGreaterThanOrEqual(10);
  });

  it('atuação: testes, agente, papéis, fama que esmaece', () => {
    const g = adult();
    runAction(g, 'act_atu_aulas');
    expect(g.life.special.acting).not.toBeNull();
    g.life.special.acting!.skill = 80;
    runAction(g, 'act_atu_agente');
    expect(g.life.special.acting!.agent).toBe(true);
    let roles = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const h = adult(seed);
      h.life.special.acting = { skill: 80, agent: true, roles: 0, awards: 0, fame: 30, lastRole: -99 };
      runAction(h, 'act_atu_teste');
      roles += h.life.special.acting.roles;
    }
    expect(roles).toBeGreaterThan(25);
    const a = adult();
    a.life.special.acting = { skill: 50, agent: false, roles: 3, awards: 0, fame: 50, lastRole: -99 };
    for (let i = 0; i < 12; i++) specialTick(a, {});
    expect(a.life.special.acting.fame).toBeLessThan(45);
  });

  it('esporte: peneira, salário, transferência e aposentadoria', () => {
    let g = adult(62, 26);
    runAction(g, 'act_esp_comecar');
    g = choose(g, 0);
    expect(g.life.special.sport?.sport).toBe('futebol');
    g.life.special.sport!.skill = 80;
    for (let i = 0; i < 20 && !g.life.special.sport!.team; i++) { g.cooldowns = {}; runAction(g, 'act_esp_peneira'); }
    expect(g.life.special.sport!.team).toBeTruthy();
    const m = g.money;
    specialTick(g, {});
    expect(g.money - m).toBeGreaterThanOrEqual(4000 - 1);
    g.cooldowns = {};
    runAction(g, 'act_esp_transferencia');
    expect(g.life.special.sport!.tier).toBe(1);
    g.life.special.sport!.titles = 3;
    expect(earnedRibbons(g).map((r) => r.id)).toContain('campeao');
    const before = g.money;
    runAction(g, 'act_esp_aposentar');
    expect(g.life.special.sport).toBeNull();
    expect(g.money).toBeGreaterThan(before);
  });

  it('espaço: exige requisitos, treina por 24 meses e a missão tem risco de morte', () => {
    const weak = adult();
    weak.player.stats.inteligencia = 50;
    expect(runAction(weak, 'act_espaco_candidatar')).toMatch(/Requisitos/);
    let accepted = 0;
    for (let seed = 1; seed <= 80; seed++) {
      const g = adult(seed, 35);
      g.education.degrees = ['tecnologia'];
      g.player.stats.inteligencia = 95;
      runAction(g, 'act_espaco_candidatar');
      if (g.life.special.space) accepted++;
    }
    expect(accepted).toBeGreaterThan(8);
    expect(accepted).toBeLessThan(40);

    const g = adult();
    g.life.special.space = { stage: 1, trainingLeft: 2, missions: 0 };
    for (let i = 0; i < 2; i++) { g.t += 1; specialTick(g, {}); }
    expect(g.life.special.space!.stage).toBe(2);
    let deaths = 0, ok = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const h = adult(seed);
      h.life.special.space = { stage: 2, trainingLeft: 0, missions: 0 };
      runAction(h, 'act_espaco_missao');
      if (takeQueuedDeath(h)) deaths++; else if (h.life.special.space.missions === 1) ok++;
    }
    expect(deaths).toBeGreaterThan(1);
    expect(ok).toBeGreaterThan(250);
    const s = adult();
    s.life.special.space = { stage: 2, trainingLeft: 0, missions: 1 };
    expect(earnedRibbons(s).map((r) => r.id)).toContain('astronauta');
  });
});
