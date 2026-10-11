import { addEn, t } from '../../i18n';
import { ageYears, changeMoney, changeStats, formatMoney, pushFeed } from '../core';
import { chance, rint, rnd, rrange, weighted, type HasRng } from '../rng';
import type { GameState } from '../types';
import { addAddiction } from './health';
import { bump, changeKarma } from './lifestate';

export const CASINO_MIN_AGE = 18;
export const BETS = [50, 200, 1000, 5000, 20000];

addEn({
  'Indisponível.': 'Unavailable.',
  'O cassino só abre aos 18 anos.': 'The casino opens at age 18.',
  'Você está preso.': 'You are in prison.',
  'Escolha um valor de aposta.': 'Pick a bet amount.',
  'Dinheiro insuficiente.': 'Not enough money.',
  'Jackpot! Você ganhou {v}.': 'Jackpot! You won {v}.',
  'Você ganhou {v}.': 'You won {v}.',
  'Você perdeu {v}.': 'You lost {v}.',
  'Empate: a aposta voltou.': 'Push: your bet came back.',
  'Resultado inválido.': 'Invalid result.',
});

export const SLOT_SYMBOLS = [
  { s: '🍒', w: 30, three: 5 }, { s: '🍋', w: 25, three: 8 }, { s: '🔔', w: 20, three: 15 },
  { s: '⭐', w: 12, three: 30 }, { s: '💎', w: 8, three: 60 }, { s: '7️⃣', w: 5, three: 150 },
];

export const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
export const colorOf = (n: number) => (n === 0 ? 'verde' : RED.has(n) ? 'vermelho' : 'preto');

export const HORSE_NAMES = ['Relâmpago', 'Dona Flor', 'Trovão Azul', 'Sombra', 'Estrela do Sul', 'Furacão', 'Pé de Vento'];

export interface CasinoResult {
  game: 'slots' | 'roleta' | 'cavalos' | 'blackjack';
  bet: number;
  /** Quanto voltou para o jogador (0 = perdeu tudo, bet = empate). */
  payout: number;
  detail: Record<string, unknown>;
}

function guard(g: GameState, bet: number): string | null {
  if (g.dead) return t('Indisponível.');
  if (ageYears(g) < CASINO_MIN_AGE) return t('O cassino só abre aos 18 anos.');
  if (g.life.crime.prison) return t('Você está preso.');
  if (!(bet > 0)) return t('Escolha um valor de aposta.');
  if (bet > g.money + 1e-6) return t('Dinheiro insuficiente.');
  return null;
}

/** Fecha a aposta: mexe no dinheiro, na felicidade, nos contadores e no risco de vício. */
export function settle(g: GameState, r: CasinoResult): string {
  const net = r.payout - r.bet;
  changeMoney(g, net);
  if (net < 0) bump(g, 'gamblingLost', Math.round(-net));
  const big = r.payout >= r.bet * 50 && net >= 20000;
  if (big) {
    bump(g, 'jackpots');
    changeKarma(g, 1);
  }
  changeStats(g, { felicidade: net > 0 ? Math.min(6, 1 + net / (r.bet * 4)) : -0.8, estresse: net < 0 ? 0.8 : -0.5 });
  // Quanto mais se aposta (e mais seguido), maior o risco de virar vício.
  const heavy = Math.min(0.12, (r.bet / (Math.max(g.money, 0) + r.bet + 1)) * 0.3);
  if (chance(g, 0.025 + heavy)) addAddiction(g, 'jogo', rint(g, 2, 6));
  g.flags.casinoResult = JSON.stringify(r);
  const msg = big ? t('Jackpot! Você ganhou {v}.', { v: formatMoney(net) }) : net > 0 ? t('Você ganhou {v}.', { v: formatMoney(net) }) : net < 0 ? t('Você perdeu {v}.', { v: formatMoney(-net) }) : t('Empate: a aposta voltou.');
  if (big) pushFeed(g, '🎰', msg, 'good');
  return msg;
}

export function spinSlots(g: GameState, bet: number): string {
  const err = guard(g, bet);
  if (err) return err;
  const reels = [0, 1, 2].map(() => weighted(g, SLOT_SYMBOLS.map((x) => ({ item: x, w: x.w })))!);
  const [a, b, c] = reels;
  let mult = 0;
  if (a.s === b.s && b.s === c.s) mult = a.three;
  else {
    const counts = new Map<string, number>();
    for (const r of reels) counts.set(r.s, (counts.get(r.s) ?? 0) + 1);
    for (const [sym, n] of counts) if (n === 2) mult = sym === '🍒' ? 1.5 : 0.5;
  }
  return settle(g, { game: 'slots', bet, payout: bet * mult, detail: { reels: reels.map((r) => r.s), mult } });
}

export type RouletteChoice = 'vermelho' | 'preto' | 'par' | 'impar' | 'baixo' | 'alto' | number;

export function spinRoulette(g: GameState, bet: number, choice: RouletteChoice): string {
  const err = guard(g, bet);
  if (err) return err;
  const n = rint(g, 0, 36);
  let win = false;
  let mult = 2;
  if (typeof choice === 'number') {
    win = n === choice;
    mult = 36;
  } else if (n !== 0) {
    win = choice === 'vermelho' ? RED.has(n) : choice === 'preto' ? !RED.has(n) : choice === 'par' ? n % 2 === 0 : choice === 'impar' ? n % 2 === 1 : choice === 'baixo' ? n <= 18 : n >= 19;
  }
  return settle(g, { game: 'roleta', bet, payout: win ? bet * mult : 0, detail: { n, color: colorOf(n), choice, win } });
}

export interface Horse { name: string; p: number; odds: number }

/** Cinco cavalos com chances e cotações diferentes; a casa fica com 15%. */
export function horseField(g: HasRng): Horse[] {
  const names = [...HORSE_NAMES].sort(() => rnd(g) - 0.5).slice(0, 5);
  const raw = names.map(() => rrange(g, 0.5, 2));
  const sum = raw.reduce((a, b) => a + b, 0);
  return names.map((name, i) => {
    const p = raw[i] / sum;
    return { name, p, odds: Math.max(1.2, Math.floor((0.85 / p) * 10) / 10) };
  });
}

export function raceHorses(g: GameState, bet: number, pick: number, field: Horse[]): string {
  const err = guard(g, bet);
  if (err) return err;
  const winner = weighted(g, field.map((h, i) => ({ item: i, w: h.p })))!;
  const order = field.map((_, i) => i).sort((a, b) => (a === winner ? -1 : b === winner ? 1 : rnd(g) - 0.5));
  const win = pick === winner;
  return settle(g, { game: 'cavalos', bet, payout: win ? bet * field[pick].odds : 0, detail: { winner, order, pick, odds: field[pick].odds } });
}

/** O blackjack é jogado na tela; aqui só se confere e fecha o resultado (de −2x a +2x a aposta). */
export function settleBlackjack(g: GameState, bet: number, profit: number): string {
  const err = guard(g, bet);
  if (err) return err;
  if (Math.abs(profit) > bet * 2 + 1e-6) return t('Resultado inválido.');
  return settle(g, { game: 'blackjack', bet, payout: bet + profit, detail: { profit } });
}

