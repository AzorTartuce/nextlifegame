import { healthPenalty } from './health';
import { petBonus } from './pets';
import type { GameState } from '../types';

/**
 * Deslocamentos nas metas de saúde, felicidade e estresse vindos dos sistemas de vida
 * (doenças, vícios, prisão...). A agenda só conhece este módulo.
 */
export function targetShift(g: GameState): { saude: number; felicidade: number; estresse: number } {
  const h = healthPenalty(g);
  const pets = petBonus(g);
  let estresse = (g.life.health.rehabLeft > 0 ? 6 : 0) + pets.estresse;
  let saude = -h.saude;
  let felicidade = -h.felicidade + pets.felicidade;
  const prison = g.life.crime.prison;
  if (prison) {
    estresse += 25;
    felicidade -= 22;
    saude -= 4;
  }
  return { saude, felicidade, estresse };
}
