import { addEn, t } from '../../i18n';
import { ageYears, changeMoney, changeStats, clamp, formatMoney, pushFeed } from '../core';
import { ARTS, BELTS, CONDITIONS, SUBSTANCES, conditionById } from '../data/health';
import { chance, rnd, rrange } from '../rng';
import type { Condition, Deltas, GameState } from '../types';
import { bump, changeKarma, luck, queueDeath } from './lifestate';

export const GYM_FEE = 70;
export const DOJO_FEE = 90;

export type DoctorKind = 'ocidental' | 'alternativo' | 'curandeiro';
export const DOCTORS: Record<DoctorKind, { mult: number; p: number; label: string; icon: string; note: string }> = {
  ocidental: { mult: 1, p: 0.9, label: 'Médico', icon: '🩺', note: 'Eficaz e caro' },
  alternativo: { mult: 0.45, p: 0.35, label: 'Alternativo', icon: '🌿', note: 'Acalma, mas cura pouco' },
  curandeiro: { mult: 0.15, p: 0.12, label: 'Curandeiro', icon: '🔮', note: 'Barato e arriscado' },
};

addEn({
  Médico: 'Doctor', Alternativo: 'Alternative', Curandeiro: 'Folk healer',
  'Eficaz e caro': 'Effective but pricey', 'Acalma, mas cura pouco': 'Soothing, rarely cures', 'Barato e arriscado': 'Cheap and risky',
  ...Object.fromEntries(CONDITIONS.map((c) => [`complicações de ${c.name.toLowerCase()}`, `complications from ${c.en.name.toLowerCase()}`])),
  'uma overdose': 'an overdose',
  'Você ficou doente: {n}.': 'You fell ill: {n}.',
  'Sintomas de {n}: você foi ao médico e recebeu o diagnóstico.': 'Symptoms of {n}: you saw a doctor and got the diagnosis.',
  'Você não conseguiu pagar o tratamento de {n}.': 'You could not afford the treatment for {n}.',
  'Você se recuperou: {n}.': 'You recovered: {n}.',
  '{n} entrou em remissão. Uma segunda chance!': '{n} went into remission. A second chance!',
  'Você teve uma overdose e acordou no hospital. Foi por pouco.': 'You overdosed and woke up in the hospital. That was close.',
  'Você saiu da reabilitação. O mais difícil foi dar o primeiro passo.': 'You left rehab. The hardest part was the first step.',
  'Você saiu da reabilitação, mas a luta continua.': 'You left rehab, but the fight goes on.',
  'Você largou a academia por falta de dinheiro.': 'You quit the gym for lack of money.',
  'Você largou o dojô por falta de dinheiro.': 'You quit the dojo for lack of money.',
  'Você subiu para a faixa {b} de {a}!': 'You moved up to the {b} belt in {a}!',
  'Doença não encontrada.': 'Condition not found.',
  'Você já está em tratamento.': 'You are already in treatment.',
  'Tratamento de {n} iniciado com {d}.': 'Treatment for {n} started with {d}.',
  'O tratamento de {n} com {d} não funcionou.': 'The treatment for {n} with {d} did not work.',
  'Um milagre? {n} simplesmente sumiu.': 'A miracle? {n} just vanished.',
  'A "cura" piorou {n}.': 'The “cure” made {n} worse.',
  'Faltam {v}.': 'You are short by {v}.',
  'Você procurou um médico e iniciou o tratamento de {n}.': 'You saw a doctor and started treatment for {n}.',
  'Atendimento no sistema público: tratamento de {n} iniciado.': 'Public health service: treatment for {n} started.',
});

export const hasCondition = (g: GameState, id: string) => g.life.health.conditions.some((c) => c.id === id);

export function addCondition(g: GameState, id: string, severity?: number): Condition | null {
  if (hasCondition(g, id)) return null;
  const def = conditionById(id);
  const c: Condition = { id, since: g.t, known: !def.chronic, severity: severity ?? Math.round(rrange(g, def.start[0], def.start[1])), treated: false };
  g.life.health.conditions.push(c);
  if (c.known) pushFeed(g, def.icon, t('Você ficou doente: {n}.', { n: t(def.name) }), 'bad');
  return c;
}

function removeCondition(g: GameState, c: Condition) {
  g.life.health.conditions = g.life.health.conditions.filter((x) => x !== c);
}

/** Peso das doenças e vícios nas metas de saúde e felicidade. */
export function healthPenalty(g: GameState): { saude: number; felicidade: number } {
  const h = g.life.health;
  let saude = 0;
  let felicidade = 0;
  for (const c of h.conditions) {
    const def = conditionById(c.id);
    saude += (def.stat * c.severity) / 100;
    felicidade += (def.mood * c.severity) / 100;
  }
  for (const s of SUBSTANCES) {
    const lvl = h.addictions[s.id] ?? 0;
    saude += lvl * s.hit;
    felicidade += lvl * 0.04;
  }
  if (h.rehabLeft > 0) felicidade += 4;
  if (h.gym) saude -= 3;
  if (h.martial) saude -= 0.8 * Math.floor(h.martial.belt);
  return { saude, felicidade };
}

/** Mortalidade extra por doenças (e overdose, que o mês corrente já decidiu). */
export function healthDeath(g: GameState): { cause: string; key?: string } | null {
  let total = 0;
  let worst: { id: string; w: number } | null = null;
  for (const c of g.life.health.conditions) {
    const def = conditionById(c.id);
    const w = def.death * Math.pow(Math.max(0, c.severity - 25) / 75, 2);
    total += w;
    if (!worst || w > worst.w) worst = { id: c.id, w };
  }
  if (!worst || total <= 0) return null;
  if (!chance(g, (total / 12) / luck(g))) return null;
  return { cause: t('complicações de {v}', { v: conditionById(worst.id).name.toLowerCase() }), key: worst.id };
}

/** Mal-estar que atrapalha o trabalho. */
export const sickness = (g: GameState) => healthPenalty(g).saude;

/**
 * Quando os sintomas ficam sérios, o personagem procura atendimento sozinho: pais pagam até os 17 anos,
 * depois o próprio bolso; sem dinheiro, vai ao sistema público, que cura menos.
 */
function autoCare(g: GameState, c: Condition, acc: Deltas) {
  const def = conditionById(c.id);
  const kid = ageYears(g) < 18;
  const cost = def.cost;
  const private_ = kid || g.money >= cost;
  if (private_ && !kid) changeMoney(g, -cost, acc);
  if (chance(g, private_ ? 0.9 : 0.5)) {
    c.treated = true;
    pushFeed(g, '🩺', private_ ? t('Você procurou um médico e iniciou o tratamento de {n}.', { n: t(def.name) }) : t('Atendimento no sistema público: tratamento de {n} iniciado.', { n: t(def.name) }), 'info');
  }
}

function monthlyConditions(g: GameState, acc: Deltas) {
  const h = g.life.health;
  // Novas doenças.
  for (const def of CONDITIONS) {
    if (hasCondition(g, def.id)) continue;
    const p = Math.min(0.5, def.risk(g) * luck(g) ) / 12;
    if (p > 0 && chance(g, p)) addCondition(g, def.id);
  }
  // Evolução das existentes.
  for (const c of [...h.conditions]) {
    const def = conditionById(c.id);
    if (!c.treated && c.known && (def.chronic ? c.severity >= 35 : def.worsen > 0 || c.severity >= 50)) autoCare(g, c, acc);
    if (c.treated) {
      if (def.upkeep > 0) {
        if (g.money < def.upkeep) {
          c.treated = false;
          pushFeed(g, '💊', t('Você não conseguiu pagar o tratamento de {n}.', { n: t(def.name) }), 'bad');
        } else changeMoney(g, -def.upkeep, acc);
      }
      if (def.chronic) c.severity += def.heal > 0 ? -def.heal : def.worsen * 0.3;
      else c.severity -= def.heal;
    } else if (def.natural > 0) c.severity -= def.natural;
    else c.severity += def.worsen;

    c.severity = Math.min(100, c.severity);
    const remission = def.curable && c.treated && c.severity <= 0;
    if (remission || (!def.chronic && c.severity <= 0)) {
      removeCondition(g, c);
      if (def.death >= 0.3) bump(g, 'survived');
      pushFeed(g, '💚', remission ? t('{n} entrou em remissão. Uma segunda chance!', { n: t(def.name) }) : t('Você se recuperou: {n}.', { n: t(def.name) }), 'good');
      continue;
    }
    if (def.chronic) c.severity = Math.max(c.treated && def.heal > 0 ? 8 : 5, c.severity);
    if (!c.known && c.severity >= 30) {
      c.known = true;
      pushFeed(g, def.icon, t('Sintomas de {n}: você foi ao médico e recebeu o diagnóstico.', { n: t(def.name) }), 'bad');
    }
  }
}

function monthlyAddictions(g: GameState, acc: Deltas) {
  const h = g.life.health;
  for (const sub of SUBSTANCES) {
    let lvl = h.addictions[sub.id] ?? 0;
    if (lvl <= 0) continue;
    if (h.rehabLeft > 0) lvl = Math.max(0, lvl - 30);
    else if (lvl >= 25) {
      lvl = Math.min(100, lvl + sub.grow);
      if (sub.id === 'jogo') {
        const loss = sub.cost * (lvl / 100) * (rnd(g) * 1.2 - 0.3);
        changeMoney(g, -loss, acc);
        if (loss > 0) bump(g, 'gamblingLost', Math.round(loss));
      } else changeMoney(g, -sub.cost * (lvl / 100), acc);
      if (sub.id === 'drogas' && lvl > 30 && chance(g, (Math.pow((lvl - 30) / 70, 2) * 0.02) / luck(g))) {
        if (chance(g, 0.55)) queueDeath(g, 'overdose');
        else {
          changeStats(g, { saude: -25, felicidade: -10 }, acc);
          bump(g, 'overdoses');
          bump(g, 'survived');
          pushFeed(g, '🚑', t('Você teve uma overdose e acordou no hospital. Foi por pouco.'), 'bad');
        }
      }
    } else lvl = Math.max(0, lvl - 2);
    if (lvl <= 0) delete h.addictions[sub.id];
    else h.addictions[sub.id] = lvl;
    g.life.counters.peakAddiction = Math.max(g.life.counters.peakAddiction ?? 0, lvl);
  }
  if (h.rehabLeft > 0) {
    h.rehabLeft -= 1;
    if (h.rehabLeft === 0) {
      const clean = Object.values(h.addictions).every((v) => v < 30);
      if (clean) {
        bump(g, 'rehabs');
        changeKarma(g, 3);
      }
      pushFeed(g, '💚', clean ? t('Você saiu da reabilitação. O mais difícil foi dar o primeiro passo.') : t('Você saiu da reabilitação, mas a luta continua.'), clean ? 'good' : 'info');
    }
  }
}

function monthlyTraining(g: GameState, acc: Deltas) {
  const h = g.life.health;
  if (h.gym) {
    if (g.money < GYM_FEE) {
      h.gym = false;
      pushFeed(g, '🏋️', t('Você largou a academia por falta de dinheiro.'), 'bad');
    } else changeMoney(g, -GYM_FEE, acc);
  }
  if (h.martial) {
    if (g.money < DOJO_FEE) {
      h.martial = null;
      pushFeed(g, '🥋', t('Você largou o dojô por falta de dinheiro.'), 'bad');
      return;
    }
    changeMoney(g, -DOJO_FEE, acc);
    const before = Math.floor(h.martial.belt);
    h.martial.belt = Math.min(5, h.martial.belt + 0.06 + Math.min(8, g.agenda.exercicio / 2) * 0.008);
    const after = Math.floor(h.martial.belt);
    if (after > before) {
      const art = ARTS.find((a) => a.id === h.martial!.art);
      pushFeed(g, '🥋', t('Você subiu para a faixa {b} de {a}!', { b: t(BELTS[after]), a: t(art?.name ?? '') }), 'good');
      changeStats(g, { carisma: 1, saude: 1 }, acc);
    }
  }
}

export function healthTick(g: GameState, acc: Deltas) {
  monthlyConditions(g, acc);
  monthlyAddictions(g, acc);
  monthlyTraining(g, acc);
}

// ---------- Ações do jogador ----------

export function treatCondition(g: GameState, id: string, kind: DoctorKind): string {
  const c = g.life.health.conditions.find((x) => x.id === id);
  if (!c || !c.known) return t('Doença não encontrada.');
  if (c.treated) return t('Você já está em tratamento.');
  const def = conditionById(id);
  const doc = DOCTORS[kind];
  const cost = Math.max(30, Math.round(def.cost * doc.mult));
  if (g.money < cost) return t('Faltam {v}.', { v: formatMoney(cost - g.money) });
  changeMoney(g, -cost);
  bump(g, 'treatments');
  if (kind !== 'ocidental') changeStats(g, { felicidade: 3, estresse: -4 });
  const n = t(def.name);
  const d = t(doc.label);
  if (kind === 'curandeiro' && chance(g, 0.04)) {
    removeCondition(g, c);
    if (def.death >= 0.3) bump(g, 'survived');
    const msg = t('Um milagre? {n} simplesmente sumiu.', { n });
    pushFeed(g, '✨', msg, 'good');
    return msg;
  }
  if (chance(g, doc.p)) {
    c.treated = true;
    const msg = t('Tratamento de {n} iniciado com {d}.', { n, d });
    pushFeed(g, doc.icon, msg, 'good');
    return msg;
  }
  if (kind === 'curandeiro' && chance(g, 0.3)) {
    c.severity = Math.min(100, c.severity + 15);
    const msg = t('A "cura" piorou {n}.', { n });
    pushFeed(g, '⚠️', msg, 'bad');
    return msg;
  }
  const msg = t('O tratamento de {n} com {d} não funcionou.', { n, d });
  pushFeed(g, '😕', msg, 'info');
  return msg;
}

/** Revela as doenças ainda sem diagnóstico. Devolve a lista descoberta. */
export function runCheckup(g: GameState): Condition[] {
  const found = g.life.health.conditions.filter((c) => !c.known);
  for (const c of found) c.known = true;
  g.life.health.lastCheckup = g.t;
  return found;
}

export function addAddiction(g: GameState, id: string, amount: number) {
  const h = g.life.health;
  h.addictions[id] = clamp((h.addictions[id] ?? 0) + amount);
  g.life.counters.peakAddiction = Math.max(g.life.counters.peakAddiction ?? 0, h.addictions[id]);
}

export const addictionLevel = (g: GameState, id: string) => g.life.health.addictions[id] ?? 0;
export const knownConditions = (g: GameState) => g.life.health.conditions.filter((c) => c.known);
export const anyAddiction = (g: GameState) => Object.keys(g.life.health.addictions).length > 0;
