import { addMemory, ageYears, changeMoney, changeRelation, changeStats, pushFeed } from '../core';
import { pickLang, t } from '../../i18n';
import { render } from '../grammar';
import { bump, changeKarma } from '../systems/lifestate';
import { chance, weighted } from '../rng';
import type { Deltas, GameState, Stats } from '../types';

export type Ctx = Record<string, string>;

export interface Effect {
  stats?: Partial<Stats>;
  money?: number;
  /** Chave do contexto → variação de relação. */
  rel?: Record<string, number>;
  memory?: { who: string; tag: string; text: string; weight?: number };
  flags?: Record<string, number | boolean | string>;
  /** Karma oculto. */
  karma?: number;
  /** Incrementa contadores usados nas fitas de fim de vida. */
  count?: Record<string, number>;
  /** Efeito livre; pode devolver texto extra para o resultado. */
  run?: (g: GameState, ctx: Ctx, acc: Deltas) => string | void;
}

export interface Outcome {
  chance: number | ((g: GameState, ctx: Ctx) => number);
  text: string;
  effects?: Effect;
}

export interface Choice {
  label: string;
  hint?: string;
  when?: (g: GameState, ctx: Ctx) => boolean;
  text?: string;
  effects?: Effect;
  /** Avaliados em ordem; o último é o "senão". */
  outcomes?: Outcome[];
}

/** Tradução em inglês de um evento, na mesma forma do original. */
export interface StoryletEn {
  title?: string;
  text?: string;
  choices?: { label?: string; hint?: string; text?: string; outcomes?: string[] }[];
  instant?: { text?: string; outcomes?: string[] };
}

export type Binder = (g: GameState, ctx: Ctx) => string | null;

export interface Storylet {
  id: string;
  title: string;
  icon: string;
  /** Tema visual da cena (cor/animação). */
  scene?: 'casa' | 'escola' | 'trabalho' | 'amor' | 'perigo' | 'festa' | 'saude' | 'negocio' | 'dinheiro' | 'natureza';
  minAge?: number;
  maxAge?: number;
  weight?: number | ((g: GameState) => number);
  /** Meses até poder repetir. Padrão: 24. */
  cooldown?: number;
  once?: boolean;
  /** Evento que só acontece na prisão (e, na prisão, só eles acontecem). */
  prison?: boolean;
  /** Eventos prioritários disparam antes do sorteio (marcos de vida). */
  priority?: boolean;
  when?: (g: GameState) => boolean;
  bind?: Record<string, Binder>;
  /** Checagem após ligar o contexto. */
  check?: (g: GameState, ctx: Ctx) => boolean;
  text: string;
  choices?: Choice[];
  /** Ação manual: não entra no sorteio e resolve na hora, mostrando a cena de resultado. */
  manual?: boolean;
  instant?: Omit<Choice, 'label'>;
  en?: StoryletEn;
  /** Para eventos sem escolha: aplicados direto e vão para o feed. */
  effects?: Effect;
}

const registry = new Map<string, Storylet>();

export function registerStorylets(list: Storylet[]) {
  for (const s of list) {
    if (registry.has(s.id)) throw new Error(`Storylet duplicado: ${s.id}`);
    registry.set(s.id, s);
  }
}

export const getStorylet = (id: string) => registry.get(id);
export const allStorylets = () => [...registry.values()];

function eligible(g: GameState, s: Storylet): boolean {
  if (!!g.life.crime.prison !== !!s.prison) return false;
  const age = ageYears(g);
  if (s.minAge !== undefined && age < s.minAge) return false;
  if (s.maxAge !== undefined && age > s.maxAge) return false;
  if (s.once && g.flags[`done:${s.id}`]) return false;
  if ((g.cooldowns[s.id] ?? -Infinity) > g.t) return false;
  if (s.when && !s.when(g)) return false;
  return true;
}

function weightOf(g: GameState, s: Storylet) {
  return typeof s.weight === 'function' ? s.weight(g) : (s.weight ?? 1);
}

function tryBind(g: GameState, s: Storylet): Ctx | null {
  const ctx: Ctx = {};
  for (const [key, binder] of Object.entries(s.bind ?? {})) {
    const v = binder(g, ctx);
    if (v === null) return null;
    ctx[key] = v;
  }
  if (s.check && !s.check(g, ctx)) return null;
  return ctx;
}

export function applyEffect(g: GameState, e: Effect | undefined, ctx: Ctx, acc: Deltas): string {
  if (!e) return '';
  if (e.stats) changeStats(g, e.stats, acc);
  if (e.money) changeMoney(g, e.money, acc);
  for (const [key, d] of Object.entries(e.rel ?? {})) {
    const npc = g.npcs[ctx[key]];
    if (npc) changeRelation(g, npc, d);
  }
  if (e.memory) {
    const npc = g.npcs[ctx[e.memory.who]];
    if (npc) addMemory(npc, g.t, e.memory.tag, render(g, t(e.memory.text), ctx), e.memory.weight);
  }
  Object.assign(g.flags, e.flags ?? {});
  if (e.karma) changeKarma(g, e.karma);
  for (const [k, n] of Object.entries(e.count ?? {})) bump(g, k, n);
  return (e.run?.(g, ctx, acc) as string | undefined) ?? '';
}

function markUsed(g: GameState, s: Storylet) {
  if (!s.manual || s.cooldown !== undefined) g.cooldowns[s.id] = g.t + (s.cooldown ?? 24);
  if (s.once) g.flags[`done:${s.id}`] = true;
}

/** Tenta disparar um evento. Retorna true se algum aconteceu. */
export function triggerEvent(g: GameState, probability: number): boolean {
  const all = [...registry.values()].filter((s) => !s.manual && eligible(g, s));

  const priority = all.filter((s) => s.priority);
  for (const s of priority) {
    const ctx = tryBind(g, s);
    if (ctx) return fire(g, s, ctx);
  }

  if (!chance(g, probability)) return false;
  let pool = all.filter((s) => !s.priority).map((s) => ({ item: s, w: weightOf(g, s) }));
  while (pool.length) {
    const s = weighted(g, pool);
    if (!s) return false;
    const ctx = tryBind(g, s);
    if (ctx) return fire(g, s, ctx);
    pool = pool.filter((p) => p.item !== s);
  }
  return false;
}

/** Dispara um evento específico (usado por ações e testes). */
export function fireById(g: GameState, id: string): boolean {
  const s = registry.get(id);
  if (!s) return false;
  const ctx = tryBind(g, s);
  return ctx ? fire(g, s, ctx) : false;
}

function fire(g: GameState, s: Storylet, ctx: Ctx): boolean {
  markUsed(g, s);
  const en = s.en;
  const title = render(g, pickLang(s.title, en?.title), ctx);
  const text = render(g, pickLang(s.text, en?.text), ctx);

  if (s.instant) {
    resolveChoice(g, s, s.instant, ctx, { title, icon: s.icon, scene: s.scene ?? 'casa' }, en?.instant);
    return true;
  }

  const choices = (s.choices ?? [])
    .map((c, index) => ({ c, index }))
    .filter(({ c }) => !c.when || c.when(g, ctx));

  if (!choices.length) {
    const acc: Deltas = {};
    const extra = applyEffect(g, s.effects, ctx, acc);
    pushFeed(g, s.icon, extra ? `${text} ${extra}` : text, 'event', acc);
    return true;
  }

  g.pending = {
    storyletId: s.id,
    title,
    icon: s.icon,
    scene: s.scene ?? 'casa',
    text,
    choices: choices.map(({ c, index }) => {
      const ec = en?.choices?.[index];
      return { index, label: render(g, pickLang(c.label, ec?.label), ctx), hint: c.hint ? render(g, pickLang(c.hint, ec?.hint), ctx) : undefined };
    }),
    ctx,
  };
  return true;
}

interface SceneInfo {
  title: string;
  icon: string;
  scene: string;
}

/** Aplica uma escolha (ou o resultado imediato de uma ação) e mostra a cena de resultado. */
function resolveChoice(
  g: GameState, s: Storylet, c: Omit<Choice, 'label'>, ctx: Ctx, info: SceneInfo,
  en?: { text?: string; outcomes?: string[] },
) {
  const acc: Deltas = {};
  const parts: string[] = [];
  if (c.text) parts.push(render(g, pickLang(c.text, en?.text), ctx));
  const extra = applyEffect(g, c.effects, ctx, acc);
  if (extra) parts.push(extra);

  if (c.outcomes?.length) {
    let idx = c.outcomes.length - 1;
    for (let i = 0; i < c.outcomes.length; i++) {
      const o = c.outcomes[i];
      const pr = typeof o.chance === 'function' ? o.chance(g, ctx) : o.chance;
      if (chance(g, pr)) { idx = i; break; }
    }
    const chosen = c.outcomes[idx];
    parts.push(render(g, pickLang(chosen.text, en?.outcomes?.[idx]), ctx));
    const more = applyEffect(g, chosen.effects, ctx, acc);
    if (more) parts.push(more);
  }

  const resultText = parts.join(' ').trim() || t('Feito.');
  g.lastResult = { title: info.title, icon: info.icon, scene: info.scene, text: resultText, deltas: acc };
  pushFeed(g, info.icon, `${/[!?.]$/.test(info.title) ? info.title : `${info.title}:`} ${resultText}`, 'event', acc);
  void s;
}

export function resolvePending(g: GameState, choiceIndex: number) {
  const p = g.pending;
  if (!p) return;
  const s = registry.get(p.storyletId);
  const c = s?.choices?.[choiceIndex];
  g.pending = null;
  if (!s || !c) return;
  resolveChoice(g, s, c, p.ctx, { title: p.title, icon: p.icon, scene: p.scene }, s.en?.choices?.[choiceIndex]);
}
