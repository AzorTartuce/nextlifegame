import { addEn, t } from '../../i18n';
import { changeMoney, clamp, pushFeed } from '../core';
import { TRAITS } from '../data/traits';
import type { GameState, Stats } from '../types';

export interface Talent { id: string; icon: string; name: string; en: string }
export const TALENTS: Talent[] = [
  { id: 'musica', icon: '🎵', name: 'Música', en: 'Music' },
  { id: 'esporte', icon: '🏃', name: 'Esportes', en: 'Sports' },
  { id: 'crime', icon: '🕶️', name: 'Crime', en: 'Crime' },
  { id: 'negocios', icon: '💼', name: 'Negócios', en: 'Business' },
  { id: 'arte', icon: '🎭', name: 'Artes cênicas', en: 'Performing arts' },
  { id: 'ciencia', icon: '🔬', name: 'Ciência', en: 'Science' },
];

addEn({
  ...Object.fromEntries(TALENTS.map((x) => [x.name, x.en])),
  'O Modo Destino é um recurso premium.': 'Destiny Mode is a premium feature.',
  'Pessoa não encontrada.': 'Person not found.',
  'Você mexeu no destino de {n}.': 'You tampered with {n}’s fate.',
});

/** Talento especial ao nascer (Modo Destino): dá um empurrão numa área da vida. */
export function applyTalent(g: GameState, id: string) {
  g.life.talent = id;
  const s = g.player.stats;
  const addTrait = (tr: string) => { if (!g.player.traits.includes(tr) && g.player.traits.length < 3) g.player.traits.push(tr); };
  if (id === 'musica') {
    g.life.special.music = { instrument: 'violao', skill: 22, band: null, albums: 0, fans: 0, label: false, lastAlbum: -99 };
    addTrait('criativo');
  } else if (id === 'esporte') {
    g.life.special.sport = { sport: 'futebol', skill: 25, team: null, tier: 0, salary: 0, titles: 0, injured: 0 };
    s.saude = clamp(s.saude + 8);
    addTrait('atletico');
  } else if (id === 'negocios') {
    s.carisma = clamp(s.carisma + 10);
    addTrait('ambicioso');
  } else if (id === 'arte') {
    s.aparencia = clamp(s.aparencia + 8);
    g.life.special.acting = { skill: 15, agent: false, roles: 0, awards: 0, fame: 0, lastRole: -99 };
  } else if (id === 'ciencia') {
    s.inteligencia = clamp(s.inteligencia + 15);
    addTrait('genio');
  }
}

export interface GodPatch {
  stats?: Partial<Stats>;
  traits?: string[];
  relation?: number;
  money?: number;
}

/** Modo Destino: mexe nos atributos do jogador ou de qualquer pessoa. */
export function godEdit(g: GameState, targetId: string, patch: GodPatch): string {
  if (!g.life.premium) return t('O Modo Destino é um recurso premium.');
  const npc = g.npcs[targetId];
  const person = targetId === g.player.id ? g.player : npc;
  if (!person) return t('Pessoa não encontrada.');
  for (const [k, v] of Object.entries(patch.stats ?? {}) as [keyof Stats, number][]) person.stats[k] = clamp(Math.round(v));
  if (patch.traits) person.traits = patch.traits.filter((x) => TRAITS.some((tr) => tr.id === x)).slice(0, 3);
  if (patch.relation !== undefined && npc) npc.relation = clamp(Math.round(patch.relation));
  if (patch.money && targetId === g.player.id) changeMoney(g, patch.money);
  const msg = t('Você mexeu no destino de {n}.', { n: person.firstName });
  pushFeed(g, '⚡', msg, 'info');
  return msg;
}

export function setPremium(g: GameState, on: boolean): string {
  g.life.premium = on;
  return '';
}
