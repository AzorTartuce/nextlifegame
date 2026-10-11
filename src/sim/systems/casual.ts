import { ageYears } from '../core';
import { availableActivities, emptyAgenda, freeHours } from './agenda';
import type { ActivityId, Agenda, GameState } from '../types';

/**
 * Modo casual: lógica pura que sugere a agenda semanal a partir de prioridades simples
 * (saúde, estudo/trabalho, social, lazer). Não altera nenhuma regra da simulação:
 * só devolve uma agenda que a UI grava em `g.agenda` quando o piloto automático está ligado.
 */

/** Horas por semana que o piloto automático sempre deixa para descanso (acima do mínimo de 14h). */
export const AUTO_REST = 36;
const STEP = 2;
const CAP = 20;

export type CasualFocus = 'saude' | 'estudo' | 'trabalho' | 'social' | 'lazer';

/** Peso de cada atividade segundo o estado atual. Zero = fora. */
export function autoWeights(g: GameState): Partial<Record<ActivityId, number>> {
  const s = g.player.stats;
  const age = ageYears(g);
  const studying = g.education.inSchool || !!g.education.enrolled;
  const w: Partial<Record<ActivityId, number>> = {};
  w.exercicio = 1 + (s.saude < 60 ? 1.5 : 0) + (s.estresse > 50 ? 0.5 : 0);
  w.estudo = studying ? 0.8 : age < 25 ? 1 : age < 40 ? 0.4 : 0.2;
  if (s.inteligencia < 40 && age < 25) w.estudo += 1;
  w.social = 1 + (s.felicidade < 50 ? 1 : 0);
  w.lazer = 1 + (s.estresse > 55 ? 1.5 : 0) + (s.felicidade < 45 ? 1 : 0);
  w.carreira = g.job && s.estresse <= 60 ? 1.2 : 0;
  w.bico = !g.job && !studying && age >= 16 ? (g.money < 2000 ? 1.5 : 0.3) : 0;
  w.empresa = g.company && s.estresse <= 60 ? 1 : 0;
  return w;
}

/** Agenda sugerida (horas/semana, múltiplos de 2). Respeita as horas livres e a idade. */
export function autoAgenda(g: GameState): Agenda {
  const out = emptyAgenda();
  if (g.life.crime.prison || ageYears(g) < 6) return out;
  const avail = availableActivities(g).map((a) => a.id);
  const weights = autoWeights(g);
  const budget = Math.max(0, freeHours(g) - AUTO_REST);
  const units = Math.floor(budget / STEP);
  const total = avail.reduce((sum, id) => sum + (weights[id] ?? 0), 0);
  if (!units || total <= 0) return out;
  const raw = avail.map((id) => ({ id, x: ((weights[id] ?? 0) / total) * units }));
  let left = units;
  for (const r of raw) {
    const u = Math.min(Math.floor(r.x), CAP / STEP);
    out[r.id] = u * STEP;
    left -= u;
  }
  // Sobras vão para quem perdeu mais no arredondamento.
  const order = [...raw].sort((a, b) => b.x - Math.floor(b.x) - (a.x - Math.floor(a.x)));
  for (let i = 0; left > 0 && i < order.length * 2; i++) {
    const r = order[i % order.length];
    if ((weights[r.id] ?? 0) > 0 && out[r.id] + STEP <= CAP) {
      out[r.id] += STEP;
      left--;
    }
  }
  return out;
}

/** O foco principal da rotina sugerida, em linguagem simples. */
export function casualFocus(g: GameState): CasualFocus {
  const s = g.player.stats;
  if (s.saude < 50) return 'saude';
  if (s.estresse > 60 || s.felicidade < 40) return 'lazer';
  if (s.felicidade < 55) return 'social';
  if (g.job || g.company) return 'trabalho';
  if (g.education.inSchool || g.education.enrolled || ageYears(g) < 25) return 'estudo';
  return 'social';
}

/** Recomendação em português simples (chave para t()). */
export function casualAdvice(g: GameState): string {
  if (ageYears(g) < 6) return 'Por enquanto não há o que decidir: aproveite a infância.';
  switch (casualFocus(g)) {
    case 'saude': return 'Sua saúde pede atenção: a rotina dá mais espaço a exercício e descanso.';
    case 'lazer': return 'Você anda no limite: a rotina reserva tempo para lazer e relaxar.';
    case 'social': return 'Hora de cuidar de quem importa: a rotina ganha mais tempo com amigos e família.';
    case 'trabalho': return 'Tudo em ordem: a rotina investe na carreira sem esquecer de você.';
    default: return 'Tudo em ordem: a rotina investe nos estudos sem esquecer de você.';
  }
}
