import { describe, expect, it } from 'vitest';
import { newGame } from '../game';
import { autoAgenda, casualAdvice, casualFocus, AUTO_REST } from '../systems/casual';
import { effectiveAgenda, energy, freeHours, restHours } from '../systems/agenda';
import { ACTIVITIES } from '../data/activities';

const adult = () => {
  const g = newGame({ firstName: 'A', lastName: 'B', gender: 'f', attraction: 'm', seed: 7 });
  g.t = g.player.birth + 12 * 25;
  g.education.inSchool = false;
  return g;
};

describe('modo casual', () => {
  it('bebê não tem agenda', () => {
    const g = newGame({ firstName: 'A', lastName: 'B', gender: 'f', attraction: 'm', seed: 1 });
    expect(Object.values(autoAgenda(g)).every((v) => v === 0)).toBe(true);
  });
  it('mantém descanso e respeita disponibilidade', () => {
    const g = adult();
    const a = autoAgenda(g);
    const sum = Object.values(a).reduce((s, v) => s + v, 0);
    expect(sum).toBeLessThanOrEqual(freeHours(g) - AUTO_REST + 1);
    expect(a.carreira).toBe(0);
    expect(a.empresa).toBe(0);
    for (const act of ACTIVITIES) expect(a[act.id] % 2).toBe(0);
    g.agenda = a;
    expect(restHours(g)).toBeGreaterThanOrEqual(30);
    expect(energy(g)).toBeGreaterThan(40);
    expect(effectiveAgenda(g).lazer).toBe(a.lazer);
  });
  it('saúde baixa prioriza exercício', () => {
    const g = adult();
    const base = autoAgenda(g).exercicio;
    g.player.stats.saude = 30;
    expect(casualFocus(g)).toBe('saude');
    expect(autoAgenda(g).exercicio).toBeGreaterThanOrEqual(base);
    expect(casualAdvice(g)).toContain('saúde');
  });
  it('não muda o estado recebido', () => {
    const g = adult();
    const before = JSON.stringify(g);
    autoAgenda(g);
    expect(JSON.stringify(g)).toBe(before);
  });
});
