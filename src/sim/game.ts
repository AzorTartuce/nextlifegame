import { ageYears, createPerson, formatMoney, fullName, netWorth, npcsByRole, placeLabel, pushFeed, setWorld, worldOf } from './core';
import { COUNTRIES, countryById } from './data/world';
import { rnd } from './rng';
import './actions';
import { triggerEvent, resolvePending } from './storylets/engine';
import './storylets/content';
import { emptyAgenda, agendaTick } from './systems/agenda';
import { checkAmbitions } from './systems/ambitions';
import { careerTick, educationTick, refreshOffers } from './systems/career';
import { companyTick } from './systems/company';
import { checkDeath, createFamily, lifeTick } from './systems/life';
import { blankMarket, emptyPortfolio, inheritLongs, initMarket, marketTick, settleEstate } from './systems/market';
import { healthTick } from './systems/health';
import { petsTick } from './systems/pets';
import { crimeTick } from './systems/crime';
import { specialTick } from './systems/special';
import { emptyShop, inheritShop, initShop, shopTick } from './systems/shop';
import { applyTalent } from './systems/god';
import { defaultLife, rollFertility } from './systems/lifestate';
import { earnedRibbons, lifeScore } from './systems/ribbons';
import type { Attraction, Deltas, GameState, Gender, NPC } from './types';
import { t } from '../i18n';

export const START_YEAR = 2026;

export interface NewGameOptions {
  firstName: string;
  lastName: string;
  gender: Gender;
  attraction: Attraction;
  /** Modo Destino: talento especial ao nascer (só vale se `premium`). */
  talent?: string;
  premium?: boolean;
  /** País e cidade de nascimento. Se omitidos, são sorteados. */
  country?: string;
  city?: string;
  seed?: number;
}

function blankState(seed: number): GameState {
  return {
    version: 1,
    country: 'br',
    city: 'São Paulo',
    birthCountry: 'br',
    rng: seed | 0,
    t: START_YEAR * 12,
    turn: 0,
    nextId: 0,
    player: null as never,
    attraction: 'ambos',
    money: 0,
    livesWithParents: true,
    npcs: {},
    agenda: emptyAgenda(),
    education: { level: 'nenhum', degrees: [], inSchool: false, schoolPerf: 50, enrolled: null },
    job: null,
    jobOffers: [],
    company: null,
    market: blankMarket(0),
    portfolio: emptyPortfolio(),
    shop: emptyShop(),
    life: defaultLife(),
    feed: [],
    pending: null,
    minigame: null,
    lastResult: null,
    cooldowns: {},
    flags: {},
    history: [],
    interactionsLeft: 3,
    ambitionsDone: [],
    generation: 1,
    lineage: [],
    dead: null,
  };
}

export function newGame(opts: NewGameOptions): GameState {
  const g = blankState(opts.seed ?? Math.floor(Math.random() * 2 ** 31));
  const country = opts.country ? countryById(opts.country) : COUNTRIES[Math.floor(rnd(g) * COUNTRIES.length)];
  const city = country.cities.find((c) => c.name === opts.city) ?? country.cities[Math.floor(rnd(g) * country.cities.length)];
  g.country = country.id;
  g.birthCountry = country.id;
  g.city = city.name;
  setWorld(g);
  g.attraction = opts.attraction;
  g.player = createPerson(g, {
    gender: opts.gender,
    firstName: opts.firstName,
    lastName: opts.lastName,
    birth: g.t,
    prefix: 'p',
  });
  g.agenda = { ...g.agenda, estudo: 4, exercicio: 4, social: 6, lazer: 6 };
  createFamily(g);
  const mae = npcsByRole(g, 'mae')[0];
  pushFeed(
    g, '👶',
    t('Você nasceu em {name}, {name2}, numa família {familia}. {v}', { name: t(worldOf(g).city.name), name2: t(worldOf(g).country.name), familia: t(String(g.flags.familia)), v: mae ? t('{firstName} chorou ao te segurar pela primeira vez.', { firstName: mae.firstName }) : '' }),
    'milestone',
  );
  initMarket(g);
  initShop(g);
  g.life.fertility = rollFertility(g);
  g.life.premium = !!opts.premium;
  if (opts.premium && opts.talent) applyTalent(g, opts.talent);
  return g;
}

/** Quantos meses cada turno avança, de acordo com a fase da vida. */
export function turnLength(g: GameState): number {
  const age = ageYears(g);
  if (age < 12) return 12;
  if (age < 18) return 3;
  return 1;
}

export function turnLabel(g: GameState): string {
  const m = turnLength(g);
  return m === 12 ? t('+1 ano') : m === 3 ? t('+3 meses') : t('+1 mês');
}

function eventChance(g: GameState): number {
  const m = turnLength(g);
  return m === 12 ? 0.95 : m === 3 ? 0.7 : 0.32;
}

function monthTick(g: GameState, acc: Deltas) {
  if (g.player.stats.saude <= 0) return die(g, t('complicações de saúde'));
  g.t += 1;
  educationTick(g, acc);
  agendaTick(g, acc);
  careerTick(g, acc);
  companyTick(g, acc);
  lifeTick(g, acc);
  marketTick(g, acc);
  shopTick(g, acc);
  healthTick(g, acc);
  petsTick(g, acc);
  crimeTick(g, acc);
  specialTick(g, acc);

  const age = ageYears(g);
  if ((g.t - g.player.birth) % 12 === 0 && age >= 1) {
    if (age === 18) pushFeed(g, '🎉', t('Maioridade! Agora você responde pelos seus atos (e boletos).'), 'milestone');
    else if (age % 10 === 0) pushFeed(g, '🎂', t('Você fez {age} anos.', { age }), 'info');
    g.history.push({ t: g.t, money: Math.round(netWorth(g)), felicidade: Math.round(g.player.stats.felicidade), saude: Math.round(g.player.stats.saude) });
  }
  if (g.t % 3 === 0) refreshOffers(g);

  const death = checkDeath(g);
  if (death) die(g, death.cause, death.key);
}

function die(g: GameState, cause: string, causeKey?: string) {
  g.dead = { cause, causeKey, t: g.t };
  g.player.alive = false;
  g.player.deathT = g.t;
  g.pending = null;
  pushFeed(g, '⚰️', t('{v} morreu aos {v2} anos: {cause}.', { v: fullName(g.player), v2: ageYears(g), cause }), 'bad');
  g.dead.score = lifeScore(g).total;
  g.dead.ribbons = earnedRibbons(g).map((r) => r.id);
}

/** Avança um turno. Puro: devolve um novo estado. */
export function advance(prev: GameState): GameState {
  if (prev.pending || prev.dead || prev.minigame) return prev;
  const g = structuredClone(prev);
  setWorld(g);
  g.lastResult = null;
  const acc: Deltas = {};
  const months = turnLength(g);
  for (let i = 0; i < months && !g.dead; i++) monthTick(g, acc);
  g.turn += 1;
  g.interactionsLeft = months >= 3 ? 4 : 3;
  if (!g.dead) {
    triggerEvent(g, eventChance(g));
    checkAmbitions(g);
  }
  return g;
}

export function choose(prev: GameState, index: number): GameState {
  if (!prev.pending) return prev;
  const g = structuredClone(prev);
  setWorld(g);
  resolvePending(g, index);
  checkAmbitions(g);
  return g;
}

/** Aplica uma ação do jogador (fora do turno) sobre uma cópia do estado. */
export function act<T extends unknown[]>(prev: GameState, fn: (g: GameState, ...args: T) => string | void, ...args: T) {
  const g = structuredClone(prev);
  setWorld(g);
  const msg = fn(g, ...args) ?? '';
  setWorld(g);
  checkAmbitions(g);
  return { state: g, message: msg };
}

export function heirs(g: GameState): NPC[] {
  return npcsByRole(g, 'filho').filter((n) => n.alive);
}

/** Meta-loop: continua a dinastia como um dos filhos. */
export function continueAsHeir(prev: GameState, heirId: string): GameState {
  const old = structuredClone(prev);
  const heir = old.npcs[heirId];
  if (!heir) return prev;
  setWorld(old);
  settleEstate(old);
  const estate = inheritShop(old);
  old.money += estate.cash;
  const g = blankState(old.rng);
  g.country = old.country;
  g.city = old.city;
  g.birthCountry = old.country;
  setWorld(g);
  g.t = old.t;
  g.nextId = old.nextId;
  g.attraction = 'ambos';
  g.generation = old.generation + 1;
  g.lineage = [
    ...old.lineage,
    { name: fullName(old.player), born: old.player.birth, died: old.t, netWorth: Math.round(netWorth(old)), cause: old.dead?.cause ?? '' },
  ];
  g.flags.familia = netWorth(old) > 300000 ? 'rica' : netWorth(old) > 20000 ? 'classe média' : 'humilde';

  const { role: _r, relation: _rel, memories: _m, since: _s, ...person } = heir;
  g.player = { ...person, alive: true };

  const siblings = heirs(old).filter((n) => n.id !== heirId);
  const share = 1 / (siblings.length + 1);
  g.money = Math.round(Math.max(0, old.money) * share);
  if (old.company) g.company = old.company;
  g.market = old.market;
  g.portfolio = inheritLongs(g, old.portfolio, share);
  g.shop = estate.shop;
  g.life.premium = old.life.premium;
  g.life.fertility = rollFertility(g);

  const parentRole = old.player.gender === 'f' ? 'mae' : 'pai';
  const parent: NPC = { ...old.player, role: parentRole, relation: heir.relation, memories: heir.memories, since: old.t };
  g.npcs[parent.id] = parent;
  const partner = Object.values(old.npcs).find((n) => n.role === 'conjuge');
  if (partner) g.npcs[partner.id] = { ...partner, role: partner.gender === 'f' ? 'mae' : 'pai', relation: 60 };
  for (const s of siblings) g.npcs[s.id] = { ...s, role: 'irmao' };

  const age = ageYears(g);
  g.livesWithParents = age < 18;
  if (age >= 6 && age < 18) g.education.inSchool = true;
  if (age >= 14) g.education.level = 'fundamental';
  if (age >= 18) g.education.level = 'medio';
  refreshOffers(g);

  pushFeed(
    g, '🌳',
    t('Geração {generation}: você agora é {v}, {age} anos, em {v2}. Herdou {v3} em dinheiro{v4}.', { generation: g.generation, v: fullName(g.player), age, v2: placeLabel(g), v3: formatMoney(g.money), v4: g.company ? ` e a empresa ${g.company.name}` : '' }),
    'milestone',
  );
  return g;
}
