import { clamp } from '../core';
import { gauss } from '../rng';
import type { GameState, LifeState } from '../types';
import { t } from '../../i18n';

export function defaultLife(): LifeState {
  return {
    karma: 0,
    fertility: 70,
    talent: null,
    premium: false,
    counters: {},
    licenses: {},
    health: { conditions: [], addictions: {}, rehabLeft: 0, martial: null, gym: false, lastCheckup: -999 },
    crime: { record: 0, heat: 0, prison: null, fugitive: false, gang: null, informant: false, weapon: false, last: null, trial: null, mafiaMissions: 0 },
    special: { music: null, acting: null, sport: null, politics: null, space: null },
    pets: [],
    travel: { visited: [], trips: 0, lastTrip: -999 },
  };
}

/** Saves antigos não tinham estas partes: preenche o que faltar sem apagar o que existe. */
export function ensureLife(g: GameState) {
  const d = defaultLife();
  const cur = (g.life ?? {}) as Partial<LifeState>;
  g.life = {
    ...d,
    ...cur,
    health: { ...d.health, ...cur.health },
    crime: { ...d.crime, ...cur.crime },
    special: { ...d.special, ...cur.special },
    travel: { ...d.travel, ...cur.travel },
    counters: { ...cur.counters },
    licenses: { ...cur.licenses },
    pets: cur.pets ?? [],
  };
  // O antigo marcador de bichinho vira um pet de verdade.
  if (g.flags?.pet === true && !g.life.pets.length) {
    g.nextId += 1;
    g.life.pets.push({ id: g.nextId, kind: 'cachorro', name: t('Paçoca'), born: g.t - 24, health: 100, bond: 60 });
    delete g.flags.pet;
  }
}

/** Fertilidade sorteada ao nascer: a maioria é fértil, alguns têm dificuldade. */
export const rollFertility = (g: GameState) => clamp(Math.round(gauss(g, 72, 40)));

/** Chance relativa de conseguir engravidar: fertilidade oculta e idade. */
export function fertilityFactor(g: GameState): number {
  const age = Math.floor((g.t - g.player.birth) / 12);
  const byAge = age <= 30 ? 1 : age <= 38 ? 0.8 : age <= 44 ? 0.45 : 0.15;
  return clamp((g.life.fertility / 70) * byAge, 0.05, 1.3);
}

export const bump = (g: GameState, key: string, n = 1) => {
  g.life.counters[key] = (g.life.counters[key] ?? 0) + n;
};
export const count = (g: GameState, key: string) => g.life.counters[key] ?? 0;

export function changeKarma(g: GameState, delta: number) {
  g.life.karma = clamp(g.life.karma + delta, -100, 100);
}

/** Karma bom reduz a chance de eventos ruins; karma ruim aumenta. Retorna um multiplicador (0,7 a 1,3). */
export const luck = (g: GameState) => 1 - g.life.karma / 330;

/** Causas de morte "contadas" por eventos, com o texto que aparece no obituário. */
export const DEATH_CAUSES: Record<string, string> = {
  heroi: 'salvando a vida de outra pessoa',
  overdose: 'uma overdose',
  tiroteio: 'num tiroteio',
  execucao: 'executado pela máfia',
  motim: 'num motim na prisão',
  espaco: 'numa missão espacial',
};

/** Marca uma morte que acontece no fim do turno (o evento só decide, a morte vem depois). */
export function queueDeath(g: GameState, key: string) {
  g.flags.pendingDeath = key;
}

export function takeQueuedDeath(g: GameState): { cause: string; key: string } | null {
  const key = g.flags.pendingDeath;
  if (typeof key !== 'string') return null;
  delete g.flags.pendingDeath;
  return { cause: t(DEATH_CAUSES[key] ?? key), key };
}
