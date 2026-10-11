/**
 * Idiomas. O texto-fonte do jogo é o português; o inglês é um dicionário (pt → en) preenchido
 * pelos arquivos em `./en/`. Texto sem tradução cai para o português, e os testes cobrem o conteúdo de dados.
 */
export type Lang = 'pt' | 'en';

let LANG: Lang = 'pt';
export const getLang = (): Lang => LANG;
export const isEn = () => LANG === 'en';
export function setLang(l: Lang) {
  LANG = l;
}

const EN = new Map<string, string>();

export function addEn(pairs: Record<string, string>) {
  for (const [k, v] of Object.entries(pairs)) EN.set(k, v);
}
export const hasEn = (pt: string) => EN.has(pt);

interface Pattern {
  re: RegExp;
  params: string[];
  out: string;
}
let REV: Map<string, string> | null = null;
let PT_PATTERNS: Pattern[] | null = null;
let EN_PATTERNS: Pattern[] | null = null;
let BUILT_SIZE = -1;

const compile = (src: string, out: string): Pattern | null => {
  const params: string[] = [];
  const esc = src.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{(\w+)\}/g, (_, k: string) => {
    params.push(k);
    return '(.+?)';
  });
  return params.length ? { re: new RegExp(`^${esc}$`), params, out } : null;
};

function buildReverse() {
  if (BUILT_SIZE === EN.size && REV) return;
  REV = new Map();
  PT_PATTERNS = [];
  EN_PATTERNS = [];
  for (const [pt, en] of EN) {
    REV.set(en, pt);
    const a = compile(pt, en);
    if (a) PT_PATTERNS.push(a);
    const b = compile(en, pt);
    if (b) EN_PATTERNS.push(b);
  }
  BUILT_SIZE = EN.size;
}

const fill = (p: Pattern, m: RegExpMatchArray) => p.out.replace(/\{(\w+)\}/g, (_, k: string) => m[p.params.indexOf(k) + 1] ?? `{${k}}`);

/**
 * Texto guardado no histórico em outro idioma: traduz de novo o que for mensagem fixa ou com parâmetros
 * (eventos sorteados, com variações aleatórias, ficam como foram escritos).
 */
export function retranslate(text: string): string {
  if (!text) return text;
  buildReverse();
  if (LANG === 'en') {
    const direct = EN.get(text);
    if (direct) return direct;
    for (const p of PT_PATTERNS!) {
      const m = text.match(p.re);
      if (m) return fill(p, m);
    }
    return text;
  }
  const direct = REV!.get(text);
  if (direct) return direct;
  for (const p of EN_PATTERNS!) {
    const m = text.match(p.re);
    if (m) return fill(p, m);
  }
  return text;
}

/** Traduz um texto-fonte, com `{param}` opcional. */
export function t(pt: string, params?: Record<string, string | number>): string {
  let s = LANG === 'en' ? (EN.get(pt) ?? pt) : pt;
  if (params) s = s.replace(/\{(\w+)\}/g, (_, k: string) => (k in params ? String(params[k]) : `{${k}}`));
  return s;
}

/** Plural: `tp(3, '{n} ano', '{n} anos')`. */
export const tp = (n: number, one: string, many: string) => t(n === 1 ? one : many, { n });

/** Escolhe o texto do idioma atual quando há um par escrito à mão. */
export const pickLang = (pt: string, en?: string) => (LANG === 'en' ? (en ?? EN.get(pt) ?? pt) : pt);

export const numberLocale = () => (LANG === 'en' ? 'en-US' : 'pt-BR');
export const fmtNum = (n: number, opts?: Intl.NumberFormatOptions) => n.toLocaleString(numberLocale(), opts);
/** Decimal com vírgula (pt) ou ponto (en). */
export const dec = (n: number, digits = 1) => (LANG === 'en' ? n.toFixed(digits) : n.toFixed(digits).replace('.', ','));

export const MONTH_NAMES: Record<Lang, string[]> = {
  pt: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};
export const monthName = (i: number) => MONTH_NAMES[LANG][((i % 12) + 12) % 12];

const KEY = 'nextlife.lang';
export function loadLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'pt' || saved === 'en') return saved;
  } catch {
    /* sem armazenamento */
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'pt';
}
export function hasSavedLang(): boolean {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === 'pt' || saved === 'en';
  } catch {
    return true;
  }
}
export function saveLang(l: Lang) {
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* sem armazenamento */
  }
}
