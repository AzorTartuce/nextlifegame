import { describe, expect, it } from 'vitest';
import { CRIMES, JUSTICE, crimeById } from '../data/crime';
import { careerById } from '../data/careers';
import { advance, choose, newGame } from '../game';
import { finishMinigame, runAction } from '../systems/actions';
import { applyForJob, requirementGaps } from '../systems/career';
import { arrest, attemptCrime, crimeTick, sentenceMonths, serveSentence } from '../systems/crime';
import { validateCart } from '../systems/shop';
import { takeTrip } from '../systems/travel';
import { getStorylet, triggerEvent } from '../storylets/engine';
import { takeQueuedDeath } from '../systems/lifestate';
import { earnedRibbons } from '../systems/ribbons';
import type { GameState } from '../types';

function adult(seed = 51, country = 'br'): GameState {
  const g = newGame({ firstName: 'Ana', lastName: 'T', gender: 'f', attraction: 'm', seed, country });
  g.player.birth = g.t - 30 * 12;
  g.money = 200_000;
  g.livesWithParents = false;
  return g;
}

describe('crimes', () => {
  it('há crimes de vários níveis, do furto ao assassinato', () => {
    expect(CRIMES.length).toBeGreaterThanOrEqual(10);
    expect(crimeById('assassinato').years[0]).toBeGreaterThanOrEqual(20);
    expect(crimeById('furto_loja').years[1]).toBeLessThan(1);
  });

  it('crime bem-sucedido rende dinheiro, atrai a polícia e custa karma', () => {
    let wins = 0, fails = 0;
    for (let seed = 1; seed <= 120; seed++) {
      const g = adult(seed);
      const before = g.money;
      attemptCrime(g, 'golpe');
      if (g.pending?.storyletId === 'julgamento') { fails++; expect(g.life.crime.trial).not.toBeNull(); continue; }
      wins++;
      expect(g.money).toBeGreaterThan(before);
      expect(g.life.crime.heat).toBeGreaterThanOrEqual(10);
      expect(g.life.karma).toBeLessThan(0);
      expect(g.life.counters.crimes).toBe(1);
    }
    expect(wins).toBeGreaterThan(20);
    expect(fails).toBeGreaterThan(20);
  });

  it('o julgamento tem quatro caminhos e a condenação manda o jogador para a prisão', () => {
    const g = adult();
    arrest(g, 'roubo_casa');
    expect(g.pending?.storyletId).toBe('julgamento');
    expect(g.pending!.choices.length).toBe(4);
    expect(g.pending!.text).toMatch(/roubo|Roubar|house|Burgle/i);
    g.job = { careerId: 'atendente', level: 0, performance: 50, monthsInRole: 0, salaryBonus: 0 };
    const next = choose(g, 2); // confessar: condenação garantida
    expect(next.life.crime.prison).not.toBeNull();
    expect(next.life.crime.record).toBe(1);
    expect(next.job).toBeNull();
    expect(next.life.crime.trial).toBeNull();
    expect(next.lastResult?.text).toBeTruthy();
  });

  it('um bom advogado absolve mais vezes que o defensor público', () => {
    let pub = 0, priv = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const a = adult(seed);
      arrest(a, 'roubo_carro');
      if (!choose(a, 0).life.crime.prison) pub++;
      const b = adult(seed + 500);
      arrest(b, 'roubo_carro');
      if (!choose(b, 1).life.crime.prison) priv++;
    }
    expect(priv).toBeGreaterThan(pub * 2);
  });

  it('menores de idade e países mais brandos recebem penas menores', () => {
    const adultBR = adult(1, 'br');
    const kid = adult(1, 'br');
    kid.player.birth = kid.t - 15 * 12;
    const def = crimeById('roubo_casa');
    expect(sentenceMonths(kid, def)).toBeLessThan(sentenceMonths(adultBR, def) * 0.6);
    const ae = adult(2, 'ae');
    const de = adult(2, 'de');
    expect(JUSTICE.ae).toBeGreaterThan(JUSTICE.de);
    expect(sentenceMonths(ae, def)).toBeGreaterThan(sentenceMonths(de, def));
  });
});

describe('prisão', () => {
  it('a pena é cumprida mês a mês e termina em liberdade, com a ficha', () => {
    const g = adult();
    serveSentence(g, 4, 'furto_loja');
    expect(g.life.crime.prison?.monthsLeft).toBe(4);
    for (let i = 0; i < 4; i++) { g.t += 1; crimeTick(g, {}); }
    expect(g.life.crime.prison).toBeNull();
    expect(g.life.crime.record).toBe(1);
    expect(g.life.counters.jailMonths).toBe(4);
  });

  it('na prisão: sem compras, sem viagens e só acontecem eventos de prisão', () => {
    const g = adult();
    serveSentence(g, 24, 'roubo_carro');
    expect(validateCart(g, [{ ref: 'americanas:chocolates-e-doces', qty: 1 }])).toMatch(/preso/);
    expect(takeTrip(g, 'rio', 'economica')).toMatch(/preso/);
    expect(runAction(g, 'act_cinema')).toMatch(/preso/);
    for (let i = 0; i < 80; i++) {
      g.pending = null;
      g.cooldowns = {};
      const fired = triggerEvent(g, 1);
      const pend = (g as GameState).pending;
      if (fired && pend) expect(getStorylet(pend.storyletId)?.prison).toBe(true);
    }
  });

  it('boa conduta e estudo ajudam; a vida segue sem rotina nem aluguel', () => {
    const g = adult();
    serveSentence(g, 36, 'roubo_carro');
    const c0 = g.life.crime.prison!.conduct;
    expect(runAction(g, 'act_prisao_estudar')).toBe('');
    expect(g.life.crime.prison!.conduct).toBeGreaterThan(c0);
    const b = advance(g);
    expect(b.life.crime.prison!.monthsLeft).toBeLessThan(36);
  });

  it('fuga: vencer o minigame faz do jogador um fugitivo; perder aumenta a pena', () => {
    const g = adult();
    serveSentence(g, 60, 'assalto_banco');
    expect(runAction(g, 'act_fuga')).toBe('');
    expect(g.minigame?.id).toBe('fuga');
    finishMinigame(g, { score: 0, max: 1, win: true });
    expect(g.life.crime.prison).toBeNull();
    expect(g.life.crime.fugitive).toBe(true);
    expect(g.life.counters.escapes).toBe(1);
    expect(earnedRibbons(g).map((r) => r.id)).toContain('fuga');

    const h = adult(52);
    serveSentence(h, 60, 'assalto_banco');
    runAction(h, 'act_fuga');
    finishMinigame(h, { score: 0, max: 1, win: false });
    expect(h.life.crime.prison!.monthsLeft).toBe(72);
  });

  it('fugitivos podem ser recapturados ou se entregar', () => {
    let recaptured = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const g = adult(seed);
      g.life.crime.fugitive = true;
      g.life.crime.last = 'roubo_carro';
      g.life.crime.heat = 80;
      for (let i = 0; i < 24 && g.life.crime.fugitive; i++) { g.t += 1; crimeTick(g, {}); }
      if (!g.life.crime.fugitive) recaptured++;
    }
    expect(recaptured).toBeGreaterThan(20);
    const h = adult();
    h.life.crime.fugitive = true;
    h.life.crime.last = 'roubo_carro';
    expect(runAction(h, 'act_entregar')).toBe('');
    expect(h.life.crime.prison).not.toBeNull();
  });

  it('a polícia investiga quem acumula atenção', () => {
    let arrests = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const g = adult(seed);
      g.life.crime.heat = 90;
      g.life.crime.last = 'golpe';
      for (let i = 0; i < 18 && !g.life.crime.trial; i++) { g.t += 1; crimeTick(g, {}); }
      if (g.life.crime.trial) arrests++;
    }
    expect(arrests).toBeGreaterThan(25);
    const calm = adult();
    calm.life.crime.heat = 5;
    for (let i = 0; i < 60; i++) { calm.t += 1; crimeTick(calm, {}); }
    expect(calm.life.crime.trial).toBeNull();
  });
});

describe('ficha criminal e carreiras', () => {
  it('condenações fecham portas', () => {
    const g = adult();
    g.education.level = 'superior';
    g.education.degrees = ['saude'];
    g.player.stats.inteligencia = 90;
    expect(requirementGaps(g, careerById('medicina')).join()).not.toMatch(/Ficha/);
    g.life.crime.record = 1;
    expect(requirementGaps(g, careerById('medicina')).join()).toMatch(/Ficha/);
    // e atrapalha as candidaturas em geral
    g.jobOffers = [{ careerId: 'atendente', level: 0 }];
    let hired = 0;
    for (let i = 0; i < 100; i++) {
      const c = adult(i + 1);
      c.life.crime.record = 3;
      c.jobOffers = [{ careerId: 'atendente', level: 0 }];
      applyForJob(c, 0);
      if (c.job) hired++;
    }
    expect(hired).toBeLessThan(60);
  });
});

describe('máfia', () => {
  it('só recruta quem já tem passagem pelo crime; paga todo mês; permite subir', () => {
    const g = adult();
    expect(runAction(g, 'act_mafia_entrar')).toMatch(/recruta/);
    expect(g.life.crime.gang).toBeNull();
    g.life.counters.crimes = 3;
    expect(runAction(g, 'act_mafia_entrar')).toBe('');
    expect(g.life.crime.gang).not.toBeNull();
    const m = g.money;
    g.t += 1; crimeTick(g, {});
    expect(g.money).toBeGreaterThan(m);
    // não sobe sem missões
    runAction(g, 'act_mafia_subir');
    expect(g.life.crime.gang!.rank).toBe(0);
    g.life.crime.mafiaMissions = 2;
    g.life.crime.gang!.loyalty = 80;
    g.cooldowns = {};
    runAction(g, 'act_mafia_subir');
    expect(g.life.crime.gang!.rank).toBe(1);
  });

  it('missões dão dinheiro ou prisão, e o topo rende a fita', () => {
    let money = 0, jail = 0;
    for (let seed = 1; seed <= 80; seed++) {
      const g = adult(seed);
      g.life.counters.crimes = 3;
      runAction(g, 'act_mafia_entrar');
      const before = g.money;
      runAction(g, 'act_mafia_extorsao');
      if (g.pending) jail++; else if (g.money > before) money++;
    }
    expect(money).toBeGreaterThan(30);
    expect(jail).toBeGreaterThan(5);
    const h = adult();
    h.life.counters.topMafia = 1;
    expect(earnedRibbons(h).map((r) => r.id)).toContain('poderoso');
  });

  it('informante é protegido pela polícia, mas pode ser executado', () => {
    const g = adult();
    g.life.counters.crimes = 2;
    runAction(g, 'act_informante');
    expect(g.life.crime.informant).toBe(true);
    let dead = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const h = adult(seed);
      h.life.crime.informant = true;
      for (let i = 0; i < 48 && !h.flags.pendingDeath; i++) { h.t += 1; crimeTick(h, {}); }
      if (takeQueuedDeath(h)?.key === 'execucao') dead++;
    }
    expect(dead).toBeGreaterThan(30);
  });

  it('assassinato marca a vida inteira', () => {
    let killers = 0;
    for (let seed = 1; seed <= 200 && killers === 0; seed++) {
      const g = adult(seed);
      g.player.stats.saude = 95;
      attemptCrime(g, 'assassinato');
      if ((g.life.counters.kills ?? 0) > 0) {
        killers++;
        expect(g.life.karma).toBeLessThanOrEqual(-30);
        expect(earnedRibbons(g).map((r) => r.id)).toContain('assassino');
      }
    }
    expect(killers).toBe(1);
  });
});
