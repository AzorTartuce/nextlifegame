import { targetShift } from './modifiers';
import { specialHours } from './special';
import { bonuses, junkPenalty } from './shop';
import { ageYears, changeMoney, changeRelation, changeStats, clamp, currentPolicy, hasTrait, npcsByRole, partnerOf } from '../core';
import { ACTIVITIES, WAKING_HOURS, type ActivityDef } from '../data/activities';
import { careerById } from '../data/careers';
import type { ActivityId, Agenda, Deltas, GameState } from '../types';

export const emptyAgenda = (): Agenda => ({ estudo: 0, exercicio: 0, social: 0, lazer: 0, bico: 0, carreira: 0, empresa: 0 });

export function commitments(g: GameState) {
  const age = ageYears(g);
  return {
    escola: g.education.inSchool ? (age < 6 ? 0 : 25) : 0,
    faculdade: g.education.enrolled ? 20 : 0,
    trabalho: g.job ? careerById(g.job.careerId).hours : 0,
    especial: specialHours(g),
  };
}

export function freeHours(g: GameState): number {
  const c = commitments(g);
  return Math.max(0, WAKING_HOURS - c.escola - c.faculdade - c.trabalho - c.especial);
}

export function activityAvailable(g: GameState, a: ActivityDef): boolean {
  if (ageYears(g) < a.minAge) return false;
  if (a.id === 'carreira') return !!g.job;
  if (a.id === 'empresa') return !!g.company;
  return true;
}

export const availableActivities = (g: GameState) => ACTIVITIES.filter((a) => activityAvailable(g, a));

/** Agenda efetiva: zera o que não está disponível e reduz proporcionalmente se passar das horas livres. */
export function effectiveAgenda(g: GameState): Agenda {
  const out = emptyAgenda();
  if (g.life.crime.prison) return out;
  for (const a of ACTIVITIES) out[a.id] = activityAvailable(g, a) ? Math.max(0, g.agenda[a.id] ?? 0) : 0;
  const total = Object.values(out).reduce((s, v) => s + v, 0);
  const free = freeHours(g);
  if (total > free && total > 0) {
    const k = free / total;
    for (const id of Object.keys(out) as ActivityId[]) out[id] = out[id] * k;
  }
  return out;
}

export function restHours(g: GameState): number {
  const a = effectiveAgenda(g);
  return freeHours(g) - Object.values(a).reduce((s, v) => s + v, 0);
}

/** Energia é derivada: estresse e falta de descanso drenam. */
export function energy(g: GameState): number {
  const rest = restHours(g);
  const overload = rest < 14 ? (14 - rest) * 3 : 0;
  return Math.max(0, Math.min(100, Math.round(100 - g.player.stats.estresse * 0.55 - overload)));
}

const dim = (h: number) => Math.sqrt(Math.max(0, h));

/**
 * Saúde, estresse e felicidade não acumulam: cada um tende a um ALVO definido pela rotina.
 * Eventos dão "choques" que se dissipam com o tempo. Isso deixa a rotina legível para o jogador.
 */
export function targets(g: GameState) {
  const age = ageYears(g);
  const p = g.player;
  const a = effectiveAgenda(g);
  const rest = restHours(g);
  const c = commitments(g);

  let estresse = 12;
  if (g.job) estresse += careerById(g.job.careerId).stress * 18;
  if (c.escola) estresse += 6;
  if (c.faculdade) estresse += 10;
  estresse += a.estudo * 0.5 + a.bico * 0.6 + a.carreira * 0.7 + a.empresa * 0.45;
  if (g.company?.last && g.company.last.profit < 0) estresse += 8;
  if (g.money < 0 && age >= 18) estresse += Math.min(15, -g.money / 2000);
  if (rest < 14) estresse += (14 - rest) * 2.5;
  estresse -= dim(a.exercicio) * 3 + dim(a.lazer) * 3 + dim(a.social) * 1.5;
  if (g.flags.terapia) estresse -= 10;
  if (hasTrait(p, 'ansioso')) estresse *= 1.25;
  if (hasTrait(p, 'preguicoso')) estresse *= 0.85;

  const fit = hasTrait(p, 'atletico') ? 1.4 : 1;
  const saude =
    70 + Math.min(24, dim(a.exercicio) * 6 * fit * (g.life.health.gym ? 1.25 : 1)) - Math.max(0, age - 40) * 0.55 - Math.max(0, estresse - 55) * 0.35 - (age < 3 ? 5 : 0);

  const close = npcsByRole(g, 'pai', 'mae', 'irmao', 'amigo', 'parceiro', 'conjuge', 'filho');
  const bonds = close.filter((n) => n.relation >= 60).length;
  const soc = hasTrait(p, 'sociavel') ? 1.3 : 1;
  const felicidade =
    36 + Math.min(16, bonds * 4) + dim(a.lazer) * 3 + dim(a.social) * 2.5 * soc +
    (partnerOf(g) ? 6 : 0) +
    (!g.livesWithParents && age >= 18 ? [0, 6, 12][(g.flags.estilo as number) ?? 0] : 0) -
    Math.max(0, estresse - 45) * 0.45 - (p.stats.saude < 40 ? (40 - p.stats.saude) * 0.4 : 0) -
    (g.money < 0 && age >= 18 ? 8 : 0);

  // Bens passivos e saúde oculta (alimentação) entram nas metas.
  const b = bonuses(g);
  const shift = targetShift(g);
  return {
    saude: clamp(saude + b.health - junkPenalty(g) + shift.saude),
    felicidade: clamp(felicidade + b.mood - Math.max(0, g.shop.junk - 10) * 0.3 + shift.felicidade),
    estresse: clamp(estresse - b.calm + shift.estresse),
  };
}

/** Efeitos de um mês da agenda. */
export function agendaTick(g: GameState, acc: Deltas) {
  const age = ageYears(g);
  const p = g.player;
  const a = effectiveAgenda(g);
  const learn = (hasTrait(p, 'genio') ? 1.3 : 1) * (age < 25 ? 1.15 : age > 60 ? 0.6 : 1) * currentPolicy().learn;
  const room = (v: number) => Math.pow(Math.max(0, 1 - v / 105), 1.5);

  const tg = targets(g);
  const d = { saude: 0, felicidade: 0, inteligencia: 0, aparencia: 0, carisma: 0, estresse: 0 };
  d.saude = (tg.saude - p.stats.saude) * 0.05;
  d.felicidade = (tg.felicidade - p.stats.felicidade) * 0.07;
  d.estresse = (tg.estresse - p.stats.estresse) * 0.15;

  if (g.education.inSchool && age >= 6) d.inteligencia += 0.13 * learn * room(p.stats.inteligencia);
  d.inteligencia += 0.065 * dim(a.estudo) * learn * room(p.stats.inteligencia);
  d.carisma += 0.05 * dim(a.social) * (hasTrait(p, 'sociavel') ? 1.4 : 1) * room(p.stats.carisma);
  d.aparencia += 0.025 * dim(a.exercicio) * room(p.stats.aparencia);

  d.inteligencia += 0.05 * bonuses(g).learn * room(p.stats.inteligencia);
  changeStats(g, d, acc);

  if (age >= 16) {
    const leisureCost = a.lazer * 4.3 * 12 + a.social * 4.3 * 6;
    if (leisureCost > 0 && g.money > 0) changeMoney(g, -Math.round(leisureCost), acc);
  }
  if (a.bico > 0) {
    const rate = 9 + p.stats.inteligencia * 0.08 + p.stats.carisma * 0.05;
    changeMoney(g, Math.round(a.bico * 4.3 * rate), acc);
  }

  // Tempo social mantém as relações próximas.
  const close = npcsByRole(g, 'pai', 'mae', 'irmao', 'amigo', 'parceiro', 'conjuge', 'filho');
  const care = dim(a.social);
  for (const n of close) {
    const home = g.livesWithParents && (n.role === 'pai' || n.role === 'mae' || n.role === 'irmao');
    const decay = home ? 0 : n.role === 'amigo' ? 0.6 : n.role === 'parceiro' || n.role === 'conjuge' ? 0.5 : 0.25;
    changeRelation(g, n, care * 0.18 - decay);
  }
}
