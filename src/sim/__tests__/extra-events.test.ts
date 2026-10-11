import { describe, expect, it } from 'vitest';
import { ageYears } from '../core';
import { advance, choose, newGame } from '../game';
import '../storylets/content';
import { allStorylets } from '../storylets/engine';
import type { Storylet } from '../storylets/engine';

const extra = () => allStorylets().filter((s) => s.id.startsWith('x_'));
const ph = (s?: string) => (s?.match(/\{\$?\w+(?:\.\w+)?\}/g) ?? []).filter((p) => !/\.(o|um|dele|ele|Ele)\}$/.test(p)).sort();
const alts = (s?: string) => (s?.match(/\[[^\]]+\]/g) ?? []).map((a) => a.split('|').length);
const money = (s?: string) => (s?.match(/\$[\d.]+/g) ?? []).sort();

describe('eventos extras', () => {
  it('tem volume e ids únicos', () => {
    const ids = extra().map((s) => s.id);
    expect(ids.length).toBeGreaterThanOrEqual(95);
    expect(new Set(allStorylets().map((s) => s.id)).size).toBe(allStorylets().length);
  });

  it('todo evento tem en coerente', () => {
    for (const s of extra() as Storylet[]) {
      const en = s.en!;
      expect(en, s.id).toBeTruthy();
      expect(en.title, s.id).toBeTruthy();
      expect(en.text, s.id).toBeTruthy();
      const pairs: [string | undefined, string | undefined][] = [[s.text, en.text]];
      expect(en.choices?.length ?? 0, s.id).toBe(s.choices?.length ?? 0);
      s.choices?.forEach((c, i) => {
        const e = en.choices![i];
        expect(e.label, `${s.id}#${i}`).toBeTruthy();
        pairs.push([c.label, e.label], [c.hint, e.hint]);
        expect(!!c.hint, `${s.id}#${i} hint`).toBe(!!e.hint);
        expect(!!c.text, `${s.id}#${i} text`).toBe(!!e.text);
        pairs.push([c.text, e.text]);
        expect(c.outcomes?.length ?? 0, `${s.id}#${i} outcomes`).toBe(e.outcomes?.length ?? 0);
        c.outcomes?.forEach((o, j) => pairs.push([o.text, e.outcomes![j]]));
      });
      for (const [pt, e] of pairs) {
        if (pt === undefined) continue;
        expect(e, `${s.id}: ${pt}`).toBeTruthy();
        expect(ph(e), `${s.id}: ${pt}`).toEqual(ph(pt));
        expect(alts(e), `${s.id}: ${pt}`).toEqual(alts(pt));
        expect(money(e), `${s.id}: ${pt}`).toEqual(money(pt));
        expect(e!.includes('.o}'), `${s.id} en .o`).toBe(false);
      }
    }
  });

  it('simula várias vidas sem exceções e dispara boa parte dos eventos', () => {
    const seen = new Set<string>();
    const lifespans: number[] = [];
    const countries = ['br', 'pt', 'us', 'jp'];
    for (let seed = 1; seed <= 10; seed++) {
      let g = newGame({ firstName: 'Ana', lastName: 'T', gender: seed % 2 ? 'f' : 'm', attraction: 'ambos', seed, country: countries[seed % 4] });
      let guard = 0;
      while (!g.dead && guard++ < 1400) {
        if (g.pending) {
          if (g.pending.storyletId.startsWith('x_')) seen.add(g.pending.storyletId);
          g = choose(g, (seed + guard) % g.pending.choices.length);
        } else if (g.minigame) {
          break;
        } else {
          const before = g.feed.length;
          g = advance(g);
          for (const f of g.feed.slice(0, Math.max(0, g.feed.length - before))) void f;
        }
      }
      lifespans.push(ageYears(g));
      // eventos sem escolha vão direto ao feed: contabiliza pelos cooldowns
      for (const id of Object.keys(g.cooldowns)) if (id.startsWith('x_')) seen.add(id);
    }
    console.log("seen", seen.size, "of", extra().length, "avg", lifespans.reduce((a, b) => a + b, 0) / lifespans.length);
    expect(seen.size).toBeGreaterThanOrEqual(extra().length * 0.45);
    const avg = lifespans.reduce((a, b) => a + b, 0) / lifespans.length;
    expect(avg).toBeGreaterThan(55);
  }, 240_000);
});
