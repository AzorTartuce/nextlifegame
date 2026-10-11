import { afterEach, describe, expect, it } from 'vitest';
import '../../i18n/en';
import { retranslate, setLang, t } from '../../i18n';

afterEach(() => setLang('pt'));

describe('idioma', () => {
  it('texto fixo e com parâmetros do histórico muda de idioma nos dois sentidos', () => {
    setLang('pt');
    const pt = t('Nove meses depois, nasceu {n}. {e}', { n: 'Luna', e: '👧' });
    setLang('en');
    expect(retranslate(pt)).toBe('Nine months later, Luna was born. 👧');
    const en = t('Nove meses depois, nasceu {n}. {e}', { n: 'Luna', e: '👧' });
    setLang('pt');
    expect(retranslate(en)).toBe('Nove meses depois, nasceu Luna. 👧');
    expect(retranslate('texto qualquer')).toBe('texto qualquer');
  });
});
