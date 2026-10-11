import { describe, expect, it } from 'vitest';
import { hasEn } from '../../i18n';
import '../../i18n/en';
import { casualAdvice } from '../systems/casual';
import { newGame } from '../game';

describe('tutorial i18n', () => {
  it('textos do tutorial e das dicas casuais têm inglês', async () => {
    const { STEPS } = await import('../../ui/tutorial/steps');
    for (const s of STEPS) {
      expect(hasEn(s.title), s.title).toBe(true);
      expect(hasEn(s.body), s.body).toBe(true);
      if (s.tab) expect(hasEn(s.tab), s.tab).toBe(true);
    }
    const g = newGame({ firstName: 'A', lastName: 'B', gender: 'f', attraction: 'm', seed: 3 });
    g.t = g.player.birth + 12 * 25;
    for (const stat of [{ saude: 30 }, { estresse: 80 }, { felicidade: 50 }, {}]) {
      Object.assign(g.player.stats, { saude: 80, estresse: 20, felicidade: 80 }, stat);
      expect(hasEn(casualAdvice(g)), casualAdvice(g)).toBe(true);
    }
    expect(hasEn('Tutorial')).toBe(true);
  });
});
