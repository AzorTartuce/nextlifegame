import { addEn, t } from '../../i18n';
import { ageYears, changeMoney, changeStats, formatMoney } from '../core';
import { CLASSES, TIER_USD, VIBE_LABEL, destById, type Destination, type TripClass } from '../data/travel';
import { IMPORT_MARKUP } from '../data/shop';
import { unitsPerCurrency } from '../data/market';
import { chance, pick } from '../rng';
import type { Deltas, GameState } from '../types';
import { addCondition } from './health';
import { bump, changeKarma } from './lifestate';
import { showResult } from './actions';
import { meetSomeone } from './life';

addEn({
  'Você viaja a partir dos 16 anos.': 'You can travel from age 16.',
  'Você está preso.': 'You are in prison.',
  'Espere um pouco antes da próxima viagem.': 'Wait a while before the next trip.',
  'Resolva o evento primeiro.': 'Resolve the event first.',
  'Viagem para {d}': 'Trip to {d}',
  'Uma semana inesquecível em {d}. {v}': 'An unforgettable week in {d}. {v}',
  'Tudo correu bem: bons passeios, boa comida e fotos para a vida toda.': 'Everything went well: great tours, great food and photos for a lifetime.',
  'Sua mala foi extraviada e você passou dias com a mesma roupa. Perrengue, mas virou história.': 'Your luggage got lost and you spent days in the same clothes. A hassle, but it became a story.',
  'Uma intoxicação alimentar estragou três dias da viagem.': 'Food poisoning ruined three days of the trip.',
  'Você conheceu {n} num mirante e a conversa rendeu a noite toda.': 'You met {n} at a lookout and the conversation lasted all night.',
  'Você fez amizade com {n}, que virou companhia de passeios.': 'You made friends with {n}, who became a sightseeing buddy.',
  'Um golpe de turista levou parte do seu dinheiro.': 'A tourist scam took part of your money.',
  'Uma conversa com um desconhecido mudou seu jeito de ver o mundo.': 'A chat with a stranger changed how you see the world.',
  'Você voltou com um bronzeado digno de comercial.': 'You came back with a tan worthy of a commercial.',
});

/** Custo da viagem, em unidades internas. Voos são em dólar; viagem dentro do país sai bem mais barata. */
export function tripCost(g: GameState, d: Destination, cls: TripClass): number {
  const domestic = d.gc === g.country;
  const usd = TIER_USD[d.tier] * CLASSES[cls].mult * (domestic ? 0.35 : 1);
  const markup = domestic ? 1 : 1 + ((IMPORT_MARKUP[g.country] ?? 1) - 1) * 0.3;
  return Math.round(usd * unitsPerCurrency('USD', g.country) * markup * g.shop.priceIndex);
}

export function canTravel(g: GameState): string | null {
  if (g.dead) return t('Indisponível.');
  if (ageYears(g) < 16) return t('Você viaja a partir dos 16 anos.');
  if (g.life.crime.prison) return t('Você está preso.');
  if (g.pending || g.minigame) return t('Resolva o evento primeiro.');
  if ((g.cooldowns.trip ?? -Infinity) > g.t) return t('Espere um pouco antes da próxima viagem.');
  return null;
}

function vibeEffects(d: Destination, acc: Deltas, g: GameState) {
  for (const v of d.vibes) {
    if (v === 'praia') changeStats(g, { saude: 1.5, aparencia: 0.5 }, acc);
    else if (v === 'cultura') changeStats(g, { inteligencia: 1.5, carisma: 0.5 }, acc);
    else if (v === 'natureza') changeStats(g, { saude: 2, estresse: -4 }, acc);
    else if (v === 'festa') changeStats(g, { felicidade: 3, carisma: 1 }, acc);
    else if (v === 'luxo') changeStats(g, { carisma: 1, felicidade: 3 }, acc);
    else if (v === 'aventura') changeStats(g, { saude: 1, carisma: 1 }, acc);
    else if (v === 'gastronomia') changeStats(g, { felicidade: 2 }, acc);
  }
}

export function takeTrip(g: GameState, destId: string, cls: TripClass): string {
  const err = canTravel(g);
  if (err) return err;
  const d = destById(destId);
  const cost = tripCost(g, d, cls);
  if (g.money < cost) return t('Faltam {v}.', { v: formatMoney(cost - g.money) });
  const acc: Deltas = {};
  changeMoney(g, -cost, acc);
  g.cooldowns.trip = g.t + 2;
  changeStats(g, { felicidade: CLASSES[cls].mood, estresse: -CLASSES[cls].calm }, acc);
  vibeEffects(d, acc, g);

  const tr = g.life.travel;
  tr.trips += 1;
  tr.lastTrip = g.t;
  if (!tr.visited.includes(d.id)) tr.visited.push(d.id);
  bump(g, 'trips');

  const r = (() => {
    const roll = chance(g, 0.45) ? 'ok' : pick(g, ['perrengue', 'perrengue', 'romance', 'amigo', 'golpe', 'inspira', 'sol', 'ok']);
    switch (roll) {
      case 'perrengue':
        if (chance(g, 0.5)) {
          changeStats(g, { felicidade: -3, estresse: 4 }, acc);
          return t('Sua mala foi extraviada e você passou dias com a mesma roupa. Perrengue, mas virou história.');
        }
        changeStats(g, { saude: -4 }, acc);
        if (chance(g, 0.3)) addCondition(g, 'gripe');
        return t('Uma intoxicação alimentar estragou três dias da viagem.');
      case 'romance': {
        if (ageYears(g) < 18) return t('Tudo correu bem: bons passeios, boa comida e fotos para a vida toda.');
        const n = meetSomeone(g, true);
        n.relation = 55;
        changeStats(g, { felicidade: 4 }, acc);
        return t('Você conheceu {n} num mirante e a conversa rendeu a noite toda.', { n: n.firstName });
      }
      case 'amigo': {
        const n = meetSomeone(g, false);
        n.relation = 55;
        n.role = 'amigo';
        return t('Você fez amizade com {n}, que virou companhia de passeios.', { n: n.firstName });
      }
      case 'golpe': {
        const loss = Math.round(cost * 0.06);
        changeMoney(g, -loss, acc);
        changeStats(g, { estresse: 5, felicidade: -2 }, acc);
        return t('Um golpe de turista levou parte do seu dinheiro.');
      }
      case 'inspira':
        changeStats(g, { inteligencia: 1.5, carisma: 1 }, acc);
        changeKarma(g, 1);
        return t('Uma conversa com um desconhecido mudou seu jeito de ver o mundo.');
      case 'sol':
        changeStats(g, { aparencia: 1.5 }, acc);
        return t('Você voltou com um bronzeado digno de comercial.');
      default:
        return t('Tudo correu bem: bons passeios, boa comida e fotos para a vida toda.');
    }
  })();

  const name = t(d.name);
  showResult(g, { title: t('Viagem para {d}', { d: name }), icon: d.flag, scene: 'natureza', text: t('Uma semana inesquecível em {d}. {v}', { d: name, v: r }), deltas: acc });
  return '';
}

export const visitedCount = (g: GameState) => g.life.travel.visited.length;
export const vibeName = (v: keyof typeof VIBE_LABEL) => VIBE_LABEL[v];
