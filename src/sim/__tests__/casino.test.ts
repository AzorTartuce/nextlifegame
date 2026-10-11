import { describe, expect, it } from 'vitest';
import { newGame } from '../game';
import { horseField, raceHorses, settleBlackjack, spinRoulette, spinSlots } from '../systems/casino';
import type { GameState } from '../types';

function adult(seed = 71): GameState {
  const g = newGame({ firstName: 'Ana', lastName: 'T', gender: 'f', attraction: 'm', seed, country: 'br' });
  g.player.birth = g.t - 30 * 12;
  g.money = 1e12;
  return g;
}

function rtp(play: (g: GameState) => void, n: number) {
  const g = adult();
  const start = g.money;
  let staked = 0;
  for (let i = 0; i < n; i++) { play(g); staked += 100; }
  return (g.money - start + staked) / staked;
}

describe('cassino', () => {
  it('a casa sempre ganha no longo prazo, em cada jogo', () => {
    const slots = rtp((g) => { spinSlots(g, 100); }, 60000);
    expect(slots).toBeGreaterThan(0.8);
    expect(slots).toBeLessThan(0.99);
    const roulette = rtp((g) => { spinRoulette(g, 100, 'vermelho'); }, 60000);
    expect(roulette).toBeGreaterThan(0.93);
    expect(roulette).toBeLessThan(1.0);
    const numero = rtp((g) => { spinRoulette(g, 100, 17); }, 90000);
    expect(numero).toBeGreaterThan(0.85);
    expect(numero).toBeLessThan(1.1);
    const horses = rtp((g) => { const f = horseField(g); raceHorses(g, 100, 0, f); }, 40000);
    expect(horses).toBeGreaterThan(0.7);
    expect(horses).toBeLessThan(1.0);
  });

  it('aposta fecha dinheiro, estatísticas e contadores', () => {
    const g = adult();
    g.money = 10000;
    spinRoulette(g, 5000, 'preto');
    expect(g.money === 15000 || g.money === 5000).toBe(true);
    expect(JSON.parse(String(g.flags.casinoResult)).game).toBe('roleta');
    const h = adult();
    h.money = 3000;
    expect(spinSlots(h, 5000)).toMatch(/insuficiente/);
    const kid = adult();
    kid.player.birth = kid.t - 16 * 12;
    expect(spinSlots(kid, 100)).toMatch(/18/);
  });

  it('o blackjack só aceita resultados possíveis', () => {
    const g = adult();
    g.money = 10000;
    expect(settleBlackjack(g, 1000, 1500)).toMatch(/ganhou/);
    expect(g.money).toBe(11500);
    expect(settleBlackjack(g, 1000, 5000)).toMatch(/inválido/);
    expect(settleBlackjack(g, 1000, -1000)).toMatch(/perdeu/);
    expect(settleBlackjack(g, 1000, 0)).toMatch(/Empate/);
  });

  it('jogar muito pode virar vício e a derrota pesa nas fitas', () => {
    let addicted = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const g = adult(seed);
      g.money = 1_000_000;
      for (let i = 0; i < 120; i++) spinSlots(g, 20000);
      if ((g.life.health.addictions.jogo ?? 0) > 0) addicted++;
      expect(g.life.counters.gamblingLost).toBeGreaterThan(0);
    }
    expect(addicted).toBeGreaterThan(30);
  });

  it('a corrida tem cinco cavalos, cotações coerentes e um vencedor', () => {
    const g = adult();
    const f = horseField(g);
    expect(f.length).toBe(5);
    expect(f.reduce((s, h) => s + h.p, 0)).toBeCloseTo(1, 5);
    expect(Math.min(...f.map((h) => h.odds))).toBeGreaterThanOrEqual(1.2);
    raceHorses(g, 100, 2, f);
    const r = JSON.parse(String(g.flags.casinoResult));
    expect(r.detail.order[0]).toBe(r.detail.winner);
  });
});
