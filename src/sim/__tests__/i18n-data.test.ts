import { describe, expect, it } from 'vitest';
import { hasEn } from '../../i18n';
import '../../i18n/en';
import '../actions';
import * as shop from '../data/shop';
import * as traits from '../data/traits';
import * as careers from '../data/careers';
import * as activities from '../data/activities';
import * as crime from '../data/crime';
import * as health from '../data/health';
import * as market from '../data/market';
import * as sectors from '../data/sectors';
import * as politics from '../data/politics';
import * as travel from '../data/travel';
import * as world from '../data/world';
import * as amb from '../systems/ambitions';
import * as rib from '../systems/ribbons';
import * as god from '../systems/god';
import * as special from '../systems/special';
import * as pets from '../systems/pets';
import * as lifestate from '../systems/lifestate';
import * as hsys from '../systems/health';
import * as casino from '../systems/casino';
import * as life from '../systems/life';
import { NEWS_PHRASES } from '../systems/news';
import { OFFER_PHRASES } from '../systems/offers';
import { SHOP_PHRASES } from '../systems/shop';
import { RULES } from '../grammar';
import { allActions } from '../systems/actions';

/** Campos de dados que aparecem na tela e precisam de tradução. */
const TEXT_KEYS = new Set(['name', 'label', 'desc', 'title', 'hint', 'pitch', 'short', 'note', 'text', 'country']);
/** Nomes de pessoas não são traduzidos. */
const PEOPLE_KEYS = new Set(['names']);

function collect(v: unknown, out: Set<string>, key = '', allowMF = false) {
  if (typeof v === 'string') {
    const ok = TEXT_KEYS.has(key) || (allowMF && (key === 'm' || key === 'f'));
    if (ok && /[A-Za-zÀ-ÿ]{2,}/.test(v)) out.add(v);
    return;
  }
  if (Array.isArray(v)) { v.forEach((x) => collect(x, out, key, allowMF)); return; }
  if (v && typeof v === 'object' && !(v instanceof Set) && !(v instanceof Map)) {
    for (const [k, x] of Object.entries(v)) {
      if (k === 'en' || PEOPLE_KEYS.has(k)) continue;
      collect(x, out, /^\d+$/.test(k) ? key : k, allowMF);
    }
  }
}

const dataSets: Record<string, unknown> = {
  CATS: shop.CATS, TIER_LABEL: shop.TIER_LABEL, STORES: shop.STORES, REGION_LABEL: shop.REGION_LABEL,
  COURSES: careers.COURSES, CAREERS: careers.CAREERS, ACTIVITIES: activities.ACTIVITIES,
  CRIMES: crime.CRIMES, GANG_RANKS: crime.GANG_RANKS,
  CONDITIONS: health.CONDITIONS, SUBSTANCES: health.SUBSTANCES, ARTS: health.ARTS,
  SECTOR_META: market.SECTOR_META, GROUP_META: market.GROUP_META, STOCKS: market.ALL_STOCKS,
  SECTORS: sectors.SECTORS, OFFICES: politics.OFFICES, PARTIES: politics.PARTIES, LAWS: politics.LAWS,
  CLASSES: travel.CLASSES, VIBE_LABEL: travel.VIBE_LABEL,
  AMBITIONS: amb.AMBITIONS, RIBBONS: rib.RIBBONS, TIERS: rib.TIERS, TALENTS: god.TALENTS,
  INSTRUMENTS: special.INSTRUMENTS, SPORTS: special.SPORTS, PET_KINDS: pets.PET_KINDS, DOCTORS: hsys.DOCTORS,
  LIFESTYLES: life.LIFESTYLES,
};

describe('inglês: dados do jogo', () => {
  it('nomes e descrições dos dados têm tradução', () => {
    const missing: string[] = [];
    for (const [label, data] of Object.entries(dataSets)) {
      const s = new Set<string>();
      collect(data, s);
      for (const v of s) if (!hasEn(v)) missing.push(`${label}: ${v}`);
    }
    expect(missing).toEqual([]);
  });

  it('traços, cidades, países, rótulos de cargos políticos e listas soltas', () => {
    const missing: string[] = [];
    const need = (label: string, v: string) => { if (!hasEn(v)) missing.push(`${label}: ${v}`); };
    const tr = new Set<string>(); collect(traits.TRAITS, tr, '', true); tr.forEach((v) => need('TRAITS', v));
    for (const c of world.COUNTRIES) { need('country', c.name); c.cities.forEach((x) => need('city', x.name)); c.foods.forEach((f) => need('foods', f)); c.places.forEach((f) => need('places', f)); }
    for (const [pt] of Object.values(politics.HEAD_TITLE)) need('HEAD_TITLE', pt);
    crime.GANG_NAMES.forEach((v) => need('GANG_NAMES', v));
    health.BELTS.forEach((v) => need('BELTS', v));
    special.TEAMS.forEach((v) => need('TEAMS', v));
    special.TIER_NAMES.forEach((v) => need('TIER_NAMES', v));
    casino.HORSE_NAMES.forEach((v) => need('HORSE_NAMES', v));
    Object.values(lifestate.DEATH_CAUSES).forEach((v) => need('DEATH_CAUSES', v));
    NEWS_PHRASES.forEach((v) => need('NEWS', v));
    OFFER_PHRASES.forEach((v) => need('OFFERS', v));
    SHOP_PHRASES.forEach((v) => need('SHOP', v));
    Object.values(RULES).flat().forEach((v) => need('RULES', v));
    ['humilde', 'classe média', 'rica'].forEach((v) => need('família', v));
    expect(missing).toEqual([]);
  });

  it('todas as ações têm nome e descrição em inglês', () => {
    const missing: string[] = [];
    for (const a of allActions()) { if (!hasEn(a.name)) missing.push(a.name); if (!hasEn(a.desc)) missing.push(a.desc); }
    expect(missing).toEqual([]);
  });
});

/** Literais t('...') / tp(n, '...', '...') espalhados pelo código. */
const files = import.meta.glob('/src/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const unescape = (s: string) => s.replace(/\\(.)/g, (_, c: string) => (c === 'n' ? '\n' : c));
const T_RE = /(?<![\w.])t\(\s*(['"])((?:\\.|(?!\1)[^\\\n])*)\1/g;
const TP_RE = /(?<![\w.])tp\(\s*[^,()]+(?:\([^()]*\))?[^,()]*,\s*(['"])((?:\\.|(?!\1)[^\\\n])*)\1\s*,\s*(['"])((?:\\.|(?!\3)[^\\\n])*)\3/g;

/** Textos que ficam de fora (nenhum por enquanto): justificar cada um. */
const ALLOW = new Set<string>([]);

describe('inglês: literais t() do código', () => {
  it('todo t()/tp() literal tem tradução', () => {
    const missing = new Set<string>();
    for (const [path, src] of Object.entries(files)) {
      if (/__tests__|\/i18n\//.test(path)) continue;
      for (const m of src.matchAll(T_RE)) { const k = unescape(m[2]); if (!hasEn(k) && !ALLOW.has(k)) missing.add(`${path}: ${k}`); }
      for (const m of src.matchAll(TP_RE)) {
        for (const k of [unescape(m[2]), unescape(m[4])]) if (!hasEn(k) && !ALLOW.has(k)) missing.add(`${path}: ${k}`);
      }
    }
    expect([...missing]).toEqual([]);
  });
});
