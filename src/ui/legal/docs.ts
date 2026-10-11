import type { Lang } from '../../i18n';
import privacyPt from '../../../docs/legal/politica-de-privacidade.md?raw';
import privacyEn from '../../../docs/legal/privacy-policy.en.md?raw';
import termsPt from '../../../docs/legal/termos-de-uso.md?raw';
import termsEn from '../../../docs/legal/terms-of-use.en.md?raw';
import noticePt from '../../../docs/legal/aviso-de-conteudo.md?raw';
import noticeEn from '../../../docs/legal/content-notice.en.md?raw';

/** Textos legais (RASCUNHOS para revisão jurídica): a fonte única são os .md em docs/legal. */
export type LegalDoc = 'privacy' | 'terms' | 'notice';

export const LEGAL_TEXTS: Record<LegalDoc, Record<Lang, string>> = {
  privacy: { pt: privacyPt, en: privacyEn },
  terms: { pt: termsPt, en: termsEn },
  notice: { pt: noticePt, en: noticeEn },
};

const KEY = 'nextlife.age18.v1';

export function hasConfirmedAge(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function confirmAge() {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    /* sem armazenamento: vale só nesta sessão */
  }
}
