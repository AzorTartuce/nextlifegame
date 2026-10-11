import { addEn, t } from '../../i18n';
import { changeMoney, changeStats, clamp, formatMoney, pushFeed } from '../core';
import { chance, pick, rint } from '../rng';
import type { Deltas, GameState, Pet } from '../types';
import { bump, changeKarma } from './lifestate';

export interface PetKind {
  id: string;
  name: string;
  en: string;
  icon: string;
  /** Vida média, em anos. */
  life: number;
  /** Ração e cuidados por mês. */
  upkeep: number;
  /** Consulta no veterinário. */
  vet: number;
  exotic?: boolean;
  /** Chance mensal de um incidente grave (só exóticos perigosos). */
  danger?: number;
}

export const PET_KINDS: PetKind[] = [
  { id: 'cachorro', name: 'Cachorro', en: 'Dog', icon: '🐕', life: 14, upkeep: 40, vet: 90 },
  { id: 'gato', name: 'Gato', en: 'Cat', icon: '🐈', life: 16, upkeep: 30, vet: 80 },
  { id: 'coelho', name: 'Coelho', en: 'Rabbit', icon: '🐇', life: 9, upkeep: 15, vet: 50 },
  { id: 'hamster', name: 'Hamster', en: 'Hamster', icon: '🐹', life: 3, upkeep: 6, vet: 30 },
  { id: 'passaro', name: 'Passarinho', en: 'Bird', icon: '🦜', life: 8, upkeep: 12, vet: 40 },
  { id: 'peixe', name: 'Peixe', en: 'Fish', icon: '🐠', life: 4, upkeep: 5, vet: 20 },
  { id: 'cobra', name: 'Cobra', en: 'Snake', icon: '🐍', life: 18, upkeep: 60, vet: 200, exotic: true, danger: 0.006 },
  { id: 'macaco', name: 'Macaco', en: 'Monkey', icon: '🐒', life: 30, upkeep: 300, vet: 400, exotic: true, danger: 0.008 },
  { id: 'tigre', name: 'Tigre', en: 'Tiger', icon: '🐅', life: 20, upkeep: 1500, vet: 2000, exotic: true, danger: 0.012 },
];
export const petKind = (id: string) => PET_KINDS.find((k) => k.id === id)!;

const NAMES = ['Paçoca', 'Biscoito', 'Pipoca', 'Thor', 'Mel', 'Luna', 'Bolinha', 'Nina', 'Simba', 'Zeca', 'Fred', 'Mingau', 'Pandora', 'Rex', 'Amora', 'Churros'];

addEn({
  ...Object.fromEntries(PET_KINDS.map((k) => [k.name, k.en])),
  'Você adotou {n}, {k}. Uma nova companhia!': 'You adopted {n}, a {k}. New company!',
  '{n} faleceu depois de uma vida cheia de carinho.': '{n} passed away after a life full of love.',
  '{n} ficou doente e o veterinário custou {v}.': '{n} got sick and the vet cost {v}.',
  '{n} adoeceu e você não teve como pagar o tratamento.': '{n} got sick and you could not afford the treatment.',
  'Você brincou com {n}. Que alegria!': 'You played with {n}. So much joy!',
  'Você levou {n} para passear.': 'You took {n} for a walk.',
  '{n} foi ao veterinário e está melhor.': '{n} went to the vet and is doing better.',
  '{n} foi encaminhado para adoção.': '{n} was given up for adoption.',
  '{n} fugiu de controle e te machucou.': '{n} got out of control and hurt you.',
});

export function addPet(g: GameState, kind: string, name?: string): Pet {
  g.nextId += 1;
  const pet: Pet = { id: g.nextId, kind, name: name ?? pick(g, NAMES), born: g.t, health: 100, bond: 60 };
  g.life.pets.push(pet);
  bump(g, 'petsOwned');
  pushFeed(g, petKind(kind).icon, t('Você adotou {n}, {k}. Uma nova companhia!', { n: pet.name, k: t(petKind(kind).name).toLowerCase() }), 'good');
  return pet;
}

/** Pets alegram a casa: felicidade e menos estresse, mas custam tempo e dinheiro. */
export function petBonus(g: GameState): { felicidade: number; estresse: number } {
  const bonded = g.life.pets.filter((p) => p.bond >= 40).length;
  return { felicidade: Math.min(8, bonded * 3), estresse: -Math.min(5, bonded * 1.5) };
}

export function petsTick(g: GameState, acc: Deltas) {
  const kept: Pet[] = [];
  for (const p of g.life.pets) {
    const kind = petKind(p.kind);
    const ageY = (g.t - p.born) / 12;
    changeMoney(g, -kind.upkeep, acc);
    p.bond = clamp(p.bond - 0.8);
    p.health = clamp(p.health - 0.6 - Math.max(0, ageY - kind.life * 0.7) * 1.2);

    if (chance(g, 0.02)) {
      p.health = clamp(p.health - 25);
      const cost = kind.vet;
      if (g.money >= cost) {
        changeMoney(g, -cost, acc);
        p.health = clamp(p.health + 40);
        pushFeed(g, '🩹', t('{n} ficou doente e o veterinário custou {v}.', { n: p.name, v: formatMoney(cost) }), 'info');
      } else pushFeed(g, '🩹', t('{n} adoeceu e você não teve como pagar o tratamento.', { n: p.name }), 'bad');
    }
    if (kind.danger && chance(g, kind.danger)) {
      changeStats(g, { saude: -rint(g, 8, 25), estresse: 10 }, acc);
      pushFeed(g, '⚠️', t('{n} fugiu de controle e te machucou.', { n: p.name }), 'bad');
    }

    const old = ageY > kind.life * 1.1 && chance(g, 0.04 + (ageY - kind.life) * 0.03);
    if (p.health <= 0 || old) {
      changeStats(g, { felicidade: -(8 * p.bond) / 100 - 3 }, acc);
      pushFeed(g, '🌈', t('{n} faleceu depois de uma vida cheia de carinho.', { n: p.name }), 'bad');
      continue;
    }
    kept.push(p);
  }
  g.life.pets = kept;
}

export type PetCare = 'brincar' | 'passear' | 'veterinario' | 'adocao';

export function carePet(g: GameState, id: number, kind: PetCare): string {
  const p = g.life.pets.find((x) => x.id === id);
  if (!p) return '';
  const k = petKind(p.kind);
  if (kind === 'brincar') {
    p.bond = clamp(p.bond + 12);
    changeStats(g, { felicidade: 2, estresse: -2 });
    const msg = t('Você brincou com {n}. Que alegria!', { n: p.name });
    pushFeed(g, k.icon, msg, 'good');
    return msg;
  }
  if (kind === 'passear') {
    p.bond = clamp(p.bond + 8);
    p.health = clamp(p.health + 3);
    changeStats(g, { saude: 0.5, estresse: -3 });
    const msg = t('Você levou {n} para passear.', { n: p.name });
    pushFeed(g, k.icon, msg, 'good');
    return msg;
  }
  if (kind === 'veterinario') {
    if (g.money < k.vet) return t('Faltam {v}.', { v: formatMoney(k.vet - g.money) });
    changeMoney(g, -k.vet);
    p.health = clamp(p.health + 45);
    const msg = t('{n} foi ao veterinário e está melhor.', { n: p.name });
    pushFeed(g, '🩺', msg, 'good');
    return msg;
  }
  g.life.pets = g.life.pets.filter((x) => x.id !== id);
  changeKarma(g, -1);
  const msg = t('{n} foi encaminhado para adoção.', { n: p.name });
  pushFeed(g, '🏠', msg, 'info');
  return msg;
}

export const petAge = (g: GameState, p: Pet) => Math.floor((g.t - p.born) / 12);
