import { addEn, t } from '../../i18n';
import { ageYears, changeMoney, formatMoney, pushFeed } from '../core';
import { fireById, registerStorylets, type Storylet, type StoryletEn } from '../storylets/engine';
import type { Deltas, GameState, MinigameResult } from '../types';

export type ActionGroup =
  | 'saude' | 'beleza' | 'viagem' | 'crime' | 'cassino' | 'pets' | 'musica' | 'atuacao' | 'esporte'
  | 'politica' | 'mafia' | 'espaco' | 'familia' | 'escola' | 'prisao' | 'vicios' | 'cirurgia' | 'lazer' | 'licenca' | 'campanha' | 'mandato' | 'banda' | 'estudio' | 'cinema' | 'atletismo' | 'nasa';

export interface ActionDef {
  id: string;
  group: ActionGroup;
  icon: string;
  name: string;
  desc: string;
  minAge?: number;
  maxAge?: number;
  /** Custo em unidades internas, cobrado ao executar. */
  cost?: number | ((g: GameState) => number);
  /** Motivo pelo qual não está disponível agora, ou null se estiver. */
  blocked?: (g: GameState) => string | null;
  /** Meses até poder repetir. */
  cooldown?: number;
  risk?: 'baixo' | 'medio' | 'alto';
  /** Se definido, a ação abre este minigame; `onMinigame` aplica o resultado. */
  minigame?: string;
  /** Dificuldade passada ao minigame (padrão 1). */
  level?: number | ((g: GameState) => number);
  onMinigame?: (g: GameState, r: MinigameResult) => void;
  /** Lógica própria (sem evento): devolve uma mensagem em caso de erro. */
  run?: (g: GameState) => string;
}

export interface ActionSpec extends Omit<Storylet, 'manual' | 'title' | 'text' | 'en' | 'id'>, ActionDef {
  /** Ações com `run` próprio não precisam de evento. */
  title?: string;
  text?: string;
  en?: StoryletEn & { name?: string; desc?: string };
}

const ACTIONS = new Map<string, ActionDef>();

/** Registra a ação (aparece nos menus) e o evento manual que a executa. */
export function registerAction(spec: ActionSpec) {
  const { group, name, desc, minAge, maxAge, cost, blocked, cooldown, risk, minigame, level, onMinigame, run, title, text, en, ...rest } = spec;
  const def: ActionDef = { id: spec.id, group, icon: spec.icon, name, desc, minAge, maxAge, cost, blocked, cooldown, risk, minigame, level, onMinigame, run };
  if (ACTIONS.has(def.id)) throw new Error(`Ação duplicada: ${def.id}`);
  ACTIONS.set(def.id, def);
  if (en?.name || en?.desc) addEn({ ...(en.name ? { [name]: en.name } : {}), ...(en.desc ? { [desc]: en.desc } : {}) });
  const { name: _n, desc: _d, ...enStory } = en ?? {};
  void _n; void _d;
  if (run || minigame) return;
  registerStorylets([{
    ...rest,
    id: spec.id,
    title: title ?? name,
    text: text ?? desc,
    manual: true,
    cooldown: undefined,
    en: { title: en?.title ?? en?.name, text: en?.text ?? en?.desc, ...enStory },
  }]);
}

export const getAction = (id: string) => ACTIONS.get(id);
export const listActions = (group: ActionGroup) => [...ACTIONS.values()].filter((a) => a.group === group);
export const allActions = () => [...ACTIONS.values()];

export const actionCost = (g: GameState, a: ActionDef) => (typeof a.cost === 'function' ? a.cost(g) : (a.cost ?? 0));

export interface ActionStatus {
  ok: boolean;
  reason: string | null;
  cost: number;
}

export function actionStatus(g: GameState, a: ActionDef): ActionStatus {
  const cost = actionCost(g, a);
  const age = ageYears(g);
  if (g.dead) return { ok: false, reason: t('Indisponível.'), cost };
  if (a.minAge !== undefined && age < a.minAge) return { ok: false, reason: t('A partir de {n} anos.', { n: a.minAge }), cost };
  if (a.maxAge !== undefined && age > a.maxAge) return { ok: false, reason: t('Até {n} anos.', { n: a.maxAge }), cost };
  if (g.life.crime.prison && !['prisao', 'saude', 'vicios'].includes(a.group)) return { ok: false, reason: t('Você está preso.'), cost };
  const until = g.cooldowns[`act:${a.id}`] ?? -Infinity;
  if (until > g.t) return { ok: false, reason: t('Espere {n} meses.', { n: until - g.t }), cost };
  const why = a.blocked?.(g);
  if (why) return { ok: false, reason: why, cost };
  if (cost > g.money + 1e-6) return { ok: false, reason: t('Faltam {v}.', { v: formatMoney(cost - g.money) }), cost };
  return { ok: true, reason: null, cost };
}

/** Executa uma ação: cobra o custo e mostra a cena de resultado. Devolve uma mensagem só em caso de erro. */
export function runAction(g: GameState, id: string): string {
  const a = ACTIONS.get(id);
  if (!a) return '';
  const st = actionStatus(g, a);
  if (!st.ok) return st.reason ?? '';
  if (g.pending || g.minigame) return t('Resolva o evento primeiro.');
  if (st.cost > 0) changeMoney(g, -st.cost);
  if (a.cooldown) g.cooldowns[`act:${a.id}`] = g.t + a.cooldown;
  if (a.minigame) {
    g.minigame = { id: a.minigame, action: a.id, level: typeof a.level === 'function' ? a.level(g) : (a.level ?? 1) };
    return '';
  }
  if (a.run) return a.run(g);
  if (!fireById(g, id)) {
    if (st.cost > 0) changeMoney(g, st.cost);
    return t('Não foi possível agora.');
  }
  return '';
}

/** Mostra uma cena de resultado (e o registro na linha da vida) sem passar por um evento. */
export function showResult(g: GameState, r: { title: string; icon: string; scene: string; text: string; deltas?: Deltas; kind?: 'good' | 'bad' | 'event' }) {
  g.lastResult = { title: r.title, icon: r.icon, scene: r.scene, text: r.text, deltas: r.deltas ?? {} };
  pushFeed(g, r.icon, `${r.title}: ${r.text}`, r.kind ?? 'event', r.deltas);
}

/** Recebe o resultado do minigame aberto, aplica na ação que o abriu e o fecha. */
export function finishMinigame(g: GameState, result: MinigameResult): string {
  const mg = g.minigame;
  g.minigame = null;
  if (!mg) return '';
  const a = ACTIONS.get(mg.action);
  a?.onMinigame?.(g, result);
  return '';
}
