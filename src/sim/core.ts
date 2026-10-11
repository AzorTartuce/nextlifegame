import { MONTH_NAMES, dec, fmtNum, monthName } from '../i18n';
import { cityOf, countryById, type CityDef, type CountryDef } from './data/world';
import { NEUTRAL, policyOf, type Policy } from './data/politics';
import { TRAITS } from './data/traits';
import { assetsValue, portfolioValue } from './systems/valuation';
import { chance, gauss, pick, rint, shuffle } from './rng';
import type {
  Deltas, FeedKind, Gender, GameState, Look, NPC, Person, Role, StatKey, Stats,
} from './types';

// ---------- Mundo ----------

let WORLD: { country: CountryDef; city: CityDef; policy: Policy; posgrad: number } = { country: countryById('br'), city: countryById('br').cities[0], policy: NEUTRAL, posgrad: 0 };

/** Define o lugar usado para formatar dinheiro e sortear nomes. Chamado a cada mudança de estado. */
export function setWorld(g: Pick<GameState, 'country' | 'city'> & Partial<Pick<GameState, 'life' | 'flags'>>) {
  const country = countryById(g.country);
  WORLD = { country, city: cityOf(country, g.city), policy: g.life ? policyOf(g as Pick<GameState, 'life'>) : NEUTRAL, posgrad: Number(g.flags?.posgrad ?? 0) };
}

/** Leis em vigor no país onde o jogador vive. */
export const currentPolicy = () => WORLD.policy;

export const worldOf = (g: Pick<GameState, 'country' | 'city'>) => {
  const country = countryById(g.country);
  return { country, city: cityOf(country, g.city) };
};
export const currentWorld = () => WORLD;

export const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

export const ageMonths = (g: GameState, p: Person = g.player) => (p.deathT ?? g.t) - p.birth;
export const ageYears = (g: GameState, p: Person = g.player) => Math.floor(ageMonths(g, p) / 12);

export const hasTrait = (p: Person, id: string) => p.traits.includes(id);

/** Escolhe a forma masculina/feminina de uma palavra. */
export const gx = (p: Person, m: string, f: string) => (p.gender === 'f' ? f : m);

/** "Supervisor(a)" → forma correta para o gênero. */
export function genderTitle(title: string, gender: Gender): string {
  return title
    .replace(/(\w+)o\(a\)/g, (_, base) => (gender === 'f' ? `${base}a` : `${base}o`))
    .replace(/(\w+)\(a\)/g, (_, base) => (gender === 'f' ? `${base}a` : base));
}

export function newId(g: GameState, prefix = 'n'): string {
  g.nextId += 1;
  return `${prefix}${g.nextId}`;
}

export function randomLook(g: GameState): Look {
  return { skin: rint(g, 0, 5), hair: rint(g, 0, 6), hairStyle: rint(g, 0, 4), eyes: rint(g, 0, 3), shirt: rint(g, 0, 7) };
}

export function randomStats(g: GameState, base = 50, spread = 30): Stats {
  return {
    saude: clamp(Math.round(gauss(g, base + 20, spread))),
    felicidade: clamp(Math.round(gauss(g, base + 10, spread))),
    inteligencia: clamp(Math.round(gauss(g, base, spread))),
    aparencia: clamp(Math.round(gauss(g, base, spread))),
    carisma: clamp(Math.round(gauss(g, base, spread))),
    estresse: clamp(Math.round(gauss(g, 20, 15))),
  };
}

export function randomTraits(g: GameState, n: number): string[] {
  const ids = shuffle(g, TRAITS.map((t) => t.id));
  const out: string[] = [];
  for (const id of ids) {
    if (out.length >= n) break;
    if (id === 'ambicioso' && out.includes('preguicoso')) continue;
    if (id === 'preguicoso' && out.includes('ambicioso')) continue;
    out.push(id);
  }
  return out;
}

export function randomFirstName(g: GameState, gender: Gender) {
  const { names } = countryById(g.country);
  return pick(g, gender === 'm' ? names.m : names.f);
}

export const randomLastName = (g: GameState) => pick(g, countryById(g.country).names.last);

export function createPerson(
  g: GameState,
  opts: { gender?: Gender; firstName?: string; lastName?: string; birth: number; prefix?: string },
): Person {
  const gender = opts.gender ?? (chance(g, 0.5) ? 'm' : 'f');
  return {
    id: newId(g, opts.prefix ?? 'n'),
    firstName: opts.firstName ?? randomFirstName(g, gender),
    lastName: opts.lastName ?? randomLastName(g),
    gender,
    birth: opts.birth,
    stats: randomStats(g),
    traits: randomTraits(g, 2),
    look: randomLook(g),
    alive: true,
  };
}

export interface NpcSpec {
  role: Role;
  /** Idade em anos (intervalo). */
  age: [number, number];
  gender?: Gender;
  lastName?: string;
  relation?: number;
}

export function createNpc(g: GameState, spec: NpcSpec): NPC {
  const years = rint(g, spec.age[0], spec.age[1]);
  const p = createPerson(g, {
    gender: spec.gender,
    lastName: spec.lastName,
    birth: g.t - years * 12 - rint(g, 0, 11),
  });
  const npc: NPC = { ...p, role: spec.role, relation: spec.relation ?? 40, memories: [], since: g.t };
  g.npcs[npc.id] = npc;
  return npc;
}

export const livingNpcs = (g: GameState) => Object.values(g.npcs).filter((n) => n.alive);
export const npcsByRole = (g: GameState, ...roles: Role[]) => livingNpcs(g).filter((n) => roles.includes(n.role));
export const partnerOf = (g: GameState) => npcsByRole(g, 'conjuge', 'parceiro')[0] ?? null;

/** Gênero de um novo par romântico respeitando a atração do jogador. */
export function romanceGender(g: GameState): Gender {
  if (g.attraction === 'ambos') return chance(g, 0.5) ? 'm' : 'f';
  return g.attraction;
}

export function pushFeed(g: GameState, icon: string, text: string, kind: FeedKind = 'info', deltas?: Deltas) {
  g.nextId += 1;
  g.feed.unshift({ id: g.nextId, t: g.t, icon, text, kind, deltas: deltas && Object.keys(deltas).length ? deltas : undefined });
  if (g.feed.length > 150) g.feed.length = 150;
}

export function addMemory(npc: NPC, t: number, tag: string, text: string, weight = 1) {
  npc.memories.unshift({ t, tag, text, weight });
  if (npc.memories.length > 10) {
    npc.memories.sort((a, b) => b.weight - a.weight || b.t - a.t);
    npc.memories.length = 10;
  }
}

/** Aplica deltas de atributos ao jogador e acumula em `acc`. */
export function changeStats(g: GameState, delta: Partial<Stats>, acc?: Deltas) {
  const s = g.player.stats;
  for (const [k, v] of Object.entries(delta) as [StatKey, number][]) {
    if (!v) continue;
    let d = v;
    if (k === 'estresse' && d > 0 && hasTrait(g.player, 'ansioso')) d *= 1.3;
    if (d > 0 && (k === 'inteligencia' || k === 'carisma' || k === 'aparencia')) d *= Math.min(1, Math.max(0.1, (105 - s[k]) / 40));
    const before = s[k];
    s[k] = clamp(before + d);
    if (acc) acc[k] = (acc[k] ?? 0) + (s[k] - before);
  }
}

export function changeMoney(g: GameState, amount: number, acc?: Deltas) {
  g.money += amount;
  if (acc) acc.dinheiro = (acc.dinheiro ?? 0) + amount;
}

export function changeRelation(g: GameState, npc: NPC, delta: number) {
  const d = delta > 0 && hasTrait(g.player, 'generoso') ? delta * 1.25 : delta;
  npc.relation = clamp(npc.relation + d);
}

export function fullName(p: Person) {
  return `${p.firstName} ${p.lastName}`;
}

export const MONTHS = MONTH_NAMES.pt;
export const formatDate = (t: number) => `${monthName(t)} ${Math.floor(t / 12)}`;

/** Converte unidades internas para a moeda do lugar onde o jogador vive. */
export const toLocal = (v: number) => v * WORLD.country.k;

export function formatMoney(v: number, compact = false): string {
  const sign = v < 0 ? '−' : '';
  const a = Math.abs(toLocal(v));
  const s = WORLD.country.currency.symbol;
  if (compact && a >= 1e9) return `${sign}${s}${dec(a / 1e9, a >= 1e10 ? 0 : 1)}B`;
  if (compact && a >= 1e6) return `${sign}${s}${dec(a / 1e6, a >= 1e7 ? 0 : 1)}M`;
  if (compact && a >= 1e4) return `${sign}${s}${Math.round(a / 1000)}k`;
  return `${sign}${s}${fmtNum(Math.round(a))}`;
}

/** Converte valores literais escritos como `$1.500` (unidades internas) para a moeda local. */
export const localizeMoney = (text: string) =>
  text.replace(/\$(\d{1,3}(?:[.,]\d{3})+|\d+)/g, (_, n: string) => formatMoney(Number(n.replace(/[.,]/g, ''))));

export const placeLabel = (g: Pick<GameState, 'country' | 'city'>) => {
  const w = worldOf(g);
  return `${w.country.flag} ${w.city.name}`;
};

export function netWorth(g: GameState): number {
  return g.money + (g.company ? companyValuation(g) : 0) + portfolioValue(g) + assetsValue(g);
}

export function companyValuation(g: GameState): number {
  const c = g.company;
  if (!c) return 0;
  const recent = c.history.slice(-6);
  const avgProfit = recent.length ? recent.reduce((s, m) => s + m.profit, 0) / recent.length : 0;
  return Math.max(0, Math.round(c.cash + Math.max(0, avgProfit) * 12 * 3 + c.branches * 5000 * (c.reputation / 50)));
}
