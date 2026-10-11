import { addEn, t } from '../../i18n';
import { ageYears, changeMoney, changeStats, clamp, currentPolicy, formatMoney, pushFeed, worldOf } from '../core';
import { CRIMES, GANG_NAMES, GANG_RANKS, JUSTICE, crimeById, type CrimeDef } from '../data/crime';
import { chance, pick, rint, rrange } from '../rng';
import type { Deltas, GameState } from '../types';
import { showResult } from './actions';
import { bump, changeKarma, queueDeath } from './lifestate';
import { fireById } from '../storylets/engine';

addEn({
  'Você foi preso em flagrante. A polícia chegou antes de você sair.': 'You were caught red-handed. The police arrived before you could leave.',
  'A polícia bateu na sua porta com um mandado: o crime deixou rastros.': 'The police showed up at your door with a warrant: the crime left traces.',
  'Deu certo! Você saiu sem ser visto e ganhou {v}.': 'It worked! You got away unseen and made {v}.',
  'Deu certo! Ninguém viu nada.': 'It worked! Nobody saw a thing.',
  'Houve troca de tiros e você não saiu dessa.': 'There was an exchange of gunfire and you did not make it out.',
  'Você cumpriu a pena e foi solto. A ficha, no entanto, ficou.': 'You served your sentence and were released. The record, however, stayed.',
  'Você pegou {n} meses de prisão.': 'You got {n} months in prison.',
  'Você pegou {n} anos de prisão.': 'You got {n} years in prison.',
  'Liberdade condicional: a pena foi reduzida pela boa conduta.': 'Parole: your sentence was cut for good behavior.',
  'Você foi recapturado e a pena aumentou.': 'You were recaptured and the sentence increased.',
  'Você se entregou à polícia.': 'You turned yourself in to the police.',
  'Absolvido! O promotor não conseguiu provar nada.': 'Acquitted! The prosecutor could not prove a thing.',
  'Você entrou para {g} como {r}.': 'You joined {g} as {r}.',
  'Você subiu na hierarquia: agora é {r} da {g}.': 'You moved up the ranks: you are now {r} of {g}.',
  'Você precisa de mais lealdade e missões cumpridas para subir.': 'You need more loyalty and completed missions to move up.',
  'A máfia deixou você sair, desta vez.': 'The mob let you leave, this time.',
  'Você não pôde sair: a máfia mandou um recado violento.': 'You could not leave: the mob sent a violent message.',
  'Você virou informante da polícia.': 'You became a police informant.',
  'Antecedentes criminais.': 'Criminal record.',
});

/** Anos de pena para um crime, com o rigor do país e a idade (menores cumprem bem menos). */
export function sentenceMonths(g: GameState, def: CrimeDef): number {
  const base = rrange(g, def.years[0], def.years[1]) * 12;
  const severity = JUSTICE[g.country] ?? 1;
  const juvenile = ageYears(g) < 18 ? 0.25 : 1;
  return Math.max(1, Math.round(base * severity * juvenile));
}

const sentenceText = (months: number) => (months >= 24 ? t('Você pegou {n} anos de prisão.', { n: Math.round(months / 12) }) : t('Você pegou {n} meses de prisão.', { n: months }));
export { sentenceText };

/** A polícia pega o jogador: abre o julgamento. */
export function arrest(g: GameState, crimeId: string, why: 'flagrante' | 'investigacao' = 'flagrante') {
  const def = crimeById(crimeId);
  const c = g.life.crime;
  c.trial = { crime: crimeId, months: sentenceMonths(g, def) };
  c.heat = 0;
  pushFeed(g, '🚓', why === 'flagrante' ? t('Você foi preso em flagrante. A polícia chegou antes de você sair.') : t('A polícia bateu na sua porta com um mandado: o crime deixou rastros.'), 'bad');
  fireById(g, 'julgamento');
}

/** Cumpre a pena na prisão: perde o emprego e a rotina. */
export function serveSentence(g: GameState, months: number, crimeId: string) {
  const c = g.life.crime;
  c.trial = null;
  c.record += 1;
  c.prison = { monthsLeft: months, total: months, crime: crimeId, conduct: 50, gang: null };
  c.fugitive = false;
  g.job = null;
  g.agenda.carreira = 0;
  changeStats(g, { felicidade: -15, estresse: 20 });
  pushFeed(g, '⛓️', sentenceText(months), 'bad');
}

export function acquit(g: GameState) {
  g.life.crime.trial = null;
  changeStats(g, { felicidade: 8 });
  pushFeed(g, '⚖️', t('Absolvido! O promotor não conseguiu provar nada.'), 'good');
}

function chanceOfSuccess(g: GameState, def: CrimeDef): number {
  const s = g.player.stats;
  const c = g.life.crime;
  let p = def.base + s[def.stat] / 300 - c.heat / 300 + (g.life.talent === 'crime' ? 0.1 : 0);
  if (def.weapon || def.kind === 'violento') p += c.weapon ? 0.12 : 0;
  if (g.life.health.martial) p += Math.floor(g.life.health.martial.belt) * 0.015;
  if (def.weapon && !c.weapon) p -= 0.08;
  return clamp(p, 0.05, 0.9);
}

function loot(g: GameState, def: CrimeDef, mult = 1) {
  return Math.round(rrange(g, def.loot[0], def.loot[1]) * mult);
}

/** Resolve uma tentativa de crime (a partir de um sucesso/fracasso já sorteado). Com `silent`, devolve o texto em vez de abrir a cena. */
export function resolveCrime(g: GameState, def: CrimeDef, ok: boolean, lootMult = 1, silent = false): string {
  const acc: Deltas = {};
  const out = (text: string, kind: 'good' | 'bad') => {
    if (silent) return text;
    showResult(g, { title: t(def.name), icon: def.icon, scene: 'perigo', text, deltas: acc, kind });
    return '';
  };
  bump(g, 'crimes');
  if (def.kind === 'furto') bump(g, 'thefts');
  g.life.crime.last = def.id;
  changeKarma(g, def.karma);
  g.life.crime.heat = clamp(g.life.crime.heat + def.heat);

  if (ok) {
    const gain = loot(g, def, lootMult);
    if (gain > 0) changeMoney(g, gain, acc);
    if (def.id === 'assassinato') bump(g, 'kills');
    changeStats(g, { estresse: 6 + Math.round(def.heat / 6), felicidade: def.id === 'assassinato' ? -18 : 3 }, acc);
    // O risco de morrer na ação conta mesmo quando dá certo.
    if (def.death && chance(g, def.death / 2)) {
      queueDeath(g, 'tiroteio');
      return out(t('Houve troca de tiros e você não saiu dessa.'), 'bad');
    }
    return out(gain > 0 ? t('Deu certo! Você saiu sem ser visto e ganhou {v}.', { v: formatMoney(gain) }) : t('Deu certo! Ninguém viu nada.'), 'good');
  }
  if (def.death && chance(g, def.death)) {
    queueDeath(g, 'tiroteio');
    return out(t('Houve troca de tiros e você não saiu dessa.'), 'bad');
  }
  arrest(g, def.id);
  return '';
}

export function attemptCrime(g: GameState, id: string, silent = false): string {
  const def = crimeById(id);
  if (g.life.crime.prison) return t('Você está preso.');
  const ok = chance(g, chanceOfSuccess(g, def));
  return resolveCrime(g, def, ok, 1, silent);
}

/** Resultado de um minigame de crime. `score/max` define quanto da pilhagem você levou. */
export function crimeFromMinigame(g: GameState, id: string, win: boolean, score: number, max: number) {
  const def = crimeById(id);
  resolveCrime(g, def, win, win ? 0.4 + 0.8 * (score / Math.max(1, max)) : 1);
}

// ---------- Mês a mês ----------

export function crimeTick(g: GameState, acc: Deltas) {
  const c = g.life.crime;
  c.heat = Math.max(0, c.heat * 0.96 - 0.3);

  if (c.prison) {
    const p = c.prison;
    p.monthsLeft -= 1;
    bump(g, 'jailMonths');
    p.conduct = clamp(p.conduct + rint(g, -2, 3));
    if (p.conduct >= 70 && p.monthsLeft > 6 && chance(g, 0.05)) {
      p.monthsLeft = Math.max(1, Math.floor(p.monthsLeft * 0.5));
      pushFeed(g, '🕊️', t('Liberdade condicional: a pena foi reduzida pela boa conduta.'), 'good');
    }
    if (p.monthsLeft <= 0) {
      c.prison = null;
      changeStats(g, { felicidade: 12, estresse: -15 }, acc);
      pushFeed(g, '🔓', t('Você cumpriu a pena e foi solto. A ficha, no entanto, ficou.'), 'info');
    }
    return;
  }

  if (c.fugitive) {
    if (chance(g, 0.02 + (c.heat / 100) * 0.05)) {
      c.fugitive = false;
      const def = crimeById(c.last ?? 'furto_loja');
      c.trial = { crime: def.id, months: Math.round(sentenceMonths(g, def) * 1.5) };
      pushFeed(g, '🚓', t('Você foi recapturado e a pena aumentou.'), 'bad');
      fireById(g, 'julgamento');
    }
    return;
  }

  // A polícia investiga: quanto mais "calor", maior a chance de bater na sua porta.
  if (c.heat > 15 && chance(g, (c.heat / 100) * 0.05 * currentPolicy().arrest)) arrest(g, c.last ?? 'furto_loja', 'investigacao');

  mafiaTick(g, acc);
  if (c.informant && chance(g, 0.01)) queueDeath(g, 'execucao');
}

// ---------- Máfia ----------

export const gangRank = (g: GameState) => (g.life.crime.gang ? GANG_RANKS[g.life.crime.gang.rank] : null);

function mafiaTick(g: GameState, acc: Deltas) {
  const gang = g.life.crime.gang;
  if (!gang) return;
  const rank = GANG_RANKS[gang.rank];
  changeMoney(g, Math.round(rank.pay * (0.5 + gang.loyalty / 100)), acc);
  gang.loyalty = clamp(gang.loyalty + rint(g, -3, 2));
  g.life.crime.heat = clamp(g.life.crime.heat + 1.5 + gang.rank);
  if (gang.loyalty <= 5 && chance(g, 0.15)) queueDeath(g, 'execucao');
}

export function joinMafia(g: GameState): string {
  const c = g.life.crime;
  if (c.gang) return '';
  c.gang = { name: pick(g, GANG_NAMES), rank: 0, loyalty: 50, since: g.t };
  changeKarma(g, -10);
  const msg = t('Você entrou para {g} como {r}.', { g: t(c.gang.name), r: t(GANG_RANKS[0].name) });
  pushFeed(g, '🎩', msg, 'bad');
  return msg;
}

export function promoteMafia(g: GameState): string {
  const gang = g.life.crime.gang;
  if (!gang) return '';
  if (gang.rank >= GANG_RANKS.length - 1 || gang.loyalty < 55 || g.life.crime.mafiaMissions < (gang.rank + 1) * 2) return t('Você precisa de mais lealdade e missões cumpridas para subir.');
  gang.rank += 1;
  g.life.crime.mafiaMissions = 0;
  gang.loyalty = clamp(gang.loyalty - 15);
  if (gang.rank === GANG_RANKS.length - 1) bump(g, 'topMafia');
  const msg = t('Você subiu na hierarquia: agora é {r} da {g}.', { r: t(GANG_RANKS[gang.rank].name), g: t(gang.name) });
  pushFeed(g, '🎖️', msg, 'milestone');
  return msg;
}

export function leaveMafia(g: GameState): string {
  const c = g.life.crime;
  if (!c.gang) return '';
  if (chance(g, 0.5)) {
    c.gang = null;
    const msg = t('A máfia deixou você sair, desta vez.');
    pushFeed(g, '🚪', msg, 'good');
    return msg;
  }
  changeStats(g, { saude: -20, estresse: 15 });
  c.gang.loyalty = clamp(c.gang.loyalty - 10);
  const msg = t('Você não pôde sair: a máfia mandou um recado violento.');
  pushFeed(g, '👊', msg, 'bad');
  return msg;
}

export function becomeInformant(g: GameState): string {
  const c = g.life.crime;
  c.informant = true;
  c.gang = null;
  c.heat = Math.max(0, c.heat - 40);
  changeKarma(g, 3);
  const msg = t('Você virou informante da polícia.');
  pushFeed(g, '🐀', msg, 'info');
  return msg;
}

export const inPrison = (g: GameState) => !!g.life.crime.prison;
export const worldJustice = (g: GameState) => JUSTICE[worldOf(g).country.id] ?? 1;
export const crimeCount = () => CRIMES.length;
