import { describe, expect, it } from 'vitest';
import { hasEn } from '../../i18n';
import '../../i18n/en';
import '../storylets/content';
import { allStorylets } from '../storylets/engine';

describe('inglês', () => {
  it('todos os textos de eventos têm tradução', () => {
    const out: string[] = [];
    const add = (pt?: string, en?: string) => { if (pt && en === undefined && !hasEn(pt) && !out.includes(pt)) out.push(pt); };
    for (const s of allStorylets()) {
      add(s.title, s.en?.title);
      add(s.text, s.en?.text);
      s.choices?.forEach((c, i) => {
        const e = s.en?.choices?.[i];
        add(c.label, e?.label); add(c.hint, e?.hint); add(c.text, e?.text);
        c.outcomes?.forEach((o, j) => add(o.text, e?.outcomes?.[j]));
      });
      if (s.instant) {
        add(s.instant.text, s.en?.instant?.text);
        s.instant.outcomes?.forEach((o, j) => add(o.text, s.en?.instant?.outcomes?.[j]));
      }
    }
    expect(out, `faltam ${out.length} traduções:\n${out.join('\n')}`).toEqual([]);
  });
});
