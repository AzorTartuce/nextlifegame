import { npcsByRole, partnerOf } from '../core';
import { pick, rint } from '../rng';
import { meetSomeone } from '../systems/life';
import type { GameState, Role } from '../types';
import type { Binder, Ctx } from './engine';

export const role = (...roles: Role[]): Binder => (g) => {
  const list = npcsByRole(g, ...roles);
  return list.length ? pick(g, list).id : null;
};

/** Pessoa com relação mínima (ex.: melhor amigo). */
export const roleWith = (min: number, ...roles: Role[]): Binder => (g) => {
  const list = npcsByRole(g, ...roles).filter((n) => n.relation >= min);
  return list.length ? pick(g, list).id : null;
};

export const partner: Binder = (g) => partnerOf(g)?.id ?? null;

/** Cria um conhecido novo. Deve ser o último binder do evento. */
export const stranger = (romance = false): Binder => (g) => meetSomeone(g, romance).id;

export const amount = (min: number, max: number, step = 50): Binder => (g) =>
  String(Math.round(rint(g, min, max) / step) * step);

export const setRole = (key: string, r: Role) => (g: GameState, ctx: Ctx) => {
  const n = g.npcs[ctx[key]];
  if (n) {
    n.role = r;
    n.since = g.t;
  }
};
