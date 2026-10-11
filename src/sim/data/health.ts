import { addEn } from '../../i18n';
import { ageYears } from '../core';
import type { GameState } from '../types';

export interface ConditionDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  chronic: boolean;
  /** Só some sozinha se for aguda; crônicas nunca. */
  natural: number;
  /** Probabilidade anual de surgir, já com idade, estilo de vida e vícios. */
  risk: (g: GameState) => number;
  start: [number, number];
  /** Piora mensal sem tratamento. */
  worsen: number;
  /** Melhora mensal com tratamento (0 = só desacelera). */
  heal: number;
  /** Mortalidade anual extra com gravidade 100. */
  death: number;
  /** Custo de uma consulta de tratamento. */
  cost: number;
  /** Remédios por mês enquanto o tratamento durar. */
  upkeep: number;
  /** Peso na meta de saúde com gravidade 100. */
  stat: number;
  /** Peso na meta de felicidade com gravidade 100. */
  mood: number;
  /** Tratamento bem-sucedido leva à remissão total. */
  curable?: boolean;
  en: { name: string; desc: string };
}

const age = (g: GameState) => ageYears(g);
const exp = (a: number, base: number, k: number, from: number) => base * Math.exp(k * Math.max(0, a - from));
const s = (g: GameState) => g.player.stats;
const add = (g: GameState, k: string) => g.life.health.addictions[k] ?? 0;

export const CONDITIONS: ConditionDef[] = [
  { id: 'gripe', name: 'Gripe forte', icon: '🤧', desc: 'Febre, tosse e uma semana de cama.', chronic: false, natural: 9, risk: (g) => 0.5 * (1 + s(g).estresse / 120) * (1 - s(g).saude / 250), start: [12, 35], worsen: 0, heal: 15, death: 0.003, cost: 60, upkeep: 0, stat: 8, mood: 6, en: { name: 'Bad flu', desc: 'Fever, cough and a week in bed.' } },
  { id: 'fratura', name: 'Fratura', icon: '🦴', desc: 'Um osso quebrado e meses de recuperação.', chronic: false, natural: 6, risk: () => 0.035, start: [25, 50], worsen: 0, heal: 14, death: 0.001, cost: 400, upkeep: 0, stat: 10, mood: 8, en: { name: 'Fracture', desc: 'A broken bone and months of recovery.' } },
  { id: 'apendicite', name: 'Apendicite', icon: '🚑', desc: 'Dor aguda no abdômen: precisa de cirurgia rápida.', chronic: false, natural: 0, risk: () => 0.0012, start: [65, 90], worsen: 18, heal: 40, death: 0.7, cost: 3500, upkeep: 0, stat: 15, mood: 10, en: { name: 'Appendicitis', desc: 'Sharp abdominal pain: needs surgery fast.' } },
  { id: 'infarto', name: 'Infarto', icon: '🫀', desc: 'O coração falhou. Cada minuto conta.', chronic: false, natural: 0, risk: (g) => exp(age(g), 0.0004, 0.085, 30) * (1 + g.shop.junk / 8) * (1 + s(g).estresse / 80) * (1 + (add(g, 'cigarro') / 100) * 1.5) * (1 + (100 - s(g).saude) / 100), start: [60, 90], worsen: 12, heal: 25, death: 0.6, cost: 9000, upkeep: 0, stat: 25, mood: 15, en: { name: 'Heart attack', desc: 'The heart failed. Every minute counts.' } },
  { id: 'avc', name: 'AVC', icon: '🧠', desc: 'Um derrame que pode deixar sequelas.', chronic: false, natural: 0, risk: (g) => exp(age(g), 0.0003, 0.09, 40) * (1 + g.shop.junk / 10) * (1 + s(g).estresse / 90), start: [55, 85], worsen: 10, heal: 20, death: 0.5, cost: 8000, upkeep: 0, stat: 22, mood: 14, en: { name: 'Stroke', desc: 'A stroke that can leave lasting damage.' } },
  { id: 'diabetes', name: 'Diabetes', icon: '🩸', desc: 'Controle do açúcar no sangue para o resto da vida.', chronic: true, natural: 0, risk: (g) => exp(age(g), 0.004, 0.05, 25) * (1 + g.shop.junk / 5) * (1 + (100 - s(g).saude) / 150), start: [15, 35], worsen: 0.35, heal: 3, death: 0.25, cost: 400, upkeep: 90, stat: 20, mood: 8, en: { name: 'Diabetes', desc: 'Blood sugar control for life.' } },
  { id: 'hipertensao', name: 'Hipertensão', icon: '📈', desc: 'Pressão alta: silenciosa e perigosa.', chronic: true, natural: 0, risk: (g) => exp(age(g), 0.006, 0.05, 30) * (1 + s(g).estresse / 70) * (1 + g.shop.junk / 12), start: [15, 35], worsen: 0.25, heal: 2.5, death: 0.2, cost: 300, upkeep: 60, stat: 14, mood: 4, en: { name: 'Hypertension', desc: 'High blood pressure: silent and dangerous.' } },
  { id: 'asma', name: 'Asma', icon: '🫁', desc: 'Falta de ar em crises que vêm e vão.', chronic: true, natural: 0, risk: (g) => (age(g) < 15 ? 0.02 : 0.002), start: [10, 35], worsen: 0.08, heal: 2, death: 0.02, cost: 250, upkeep: 40, stat: 10, mood: 4, en: { name: 'Asthma', desc: 'Shortness of breath in waves.' } },
  { id: 'depressao', name: 'Depressão', icon: '🌧️', desc: 'Um peso que tira a cor de tudo.', chronic: true, natural: 0, risk: (g) => 0.006 + (s(g).felicidade < 35 ? 0.05 : 0) + (s(g).estresse > 70 ? 0.03 : 0), start: [25, 55], worsen: 0.3, heal: 4, death: 0.04, cost: 350, upkeep: 100, stat: 8, mood: 45, en: { name: 'Depression', desc: 'A weight that drains the color out of everything.' } },
  { id: 'ansiedade', name: 'Ansiedade', icon: '😰', desc: 'A mente corre mais rápido que a vida.', chronic: true, natural: 0, risk: (g) => 0.004 + (s(g).estresse > 60 ? 0.04 : 0), start: [20, 50], worsen: 0.2, heal: 4, death: 0.01, cost: 300, upkeep: 80, stat: 5, mood: 25, en: { name: 'Anxiety', desc: 'The mind runs faster than life.' } },
  { id: 'cancer', name: 'Câncer', icon: '🎗️', desc: 'Tratamento longo e difícil, mas há esperança.', chronic: true, natural: 0, risk: (g) => exp(age(g), 0.0006, 0.085, 30) * (1 + (add(g, 'cigarro') / 100) * 1.2), start: [25, 50], worsen: 3, heal: 4, death: 0.6, cost: 12000, upkeep: 800, stat: 35, mood: 25, curable: true, en: { name: 'Cancer', desc: 'A long, hard treatment, but there is hope.' } },
  { id: 'cirrose', name: 'Cirrose', icon: '🍷', desc: 'O fígado cobrando anos de bebida.', chronic: true, natural: 0, risk: (g) => (add(g, 'alcool') > 45 ? 0.04 * (add(g, 'alcool') / 100) : 0), start: [25, 50], worsen: 0.6, heal: 2, death: 0.5, cost: 1500, upkeep: 200, stat: 25, mood: 10, en: { name: 'Cirrhosis', desc: 'The liver collecting years of drinking.' } },
  { id: 'enfisema', name: 'Enfisema', icon: '🚬', desc: 'Os pulmões cobrando anos de cigarro.', chronic: true, natural: 0, risk: (g) => (add(g, 'cigarro') > 40 ? 0.03 * (add(g, 'cigarro') / 100) * Math.min(2, 1 + (age(g) - 30) / 40) : 0), start: [20, 45], worsen: 0.4, heal: 2, death: 0.3, cost: 800, upkeep: 150, stat: 22, mood: 8, en: { name: 'Emphysema', desc: 'The lungs collecting years of smoking.' } },
  { id: 'alzheimer', name: 'Alzheimer', icon: '🧩', desc: 'As memórias se apagando, devagar.', chronic: true, natural: 0, risk: (g) => (age(g) > 65 ? exp(age(g), 0.006, 0.1, 65) : 0), start: [10, 30], worsen: 0.5, heal: 0, death: 0.15, cost: 500, upkeep: 300, stat: 12, mood: 30, en: { name: 'Alzheimer’s', desc: 'Memories fading, slowly.' } },
];

export const conditionById = (id: string) => CONDITIONS.find((c) => c.id === id)!;

export interface SubstanceDef {
  id: string;
  name: string;
  icon: string;
  /** Gasto mensal com nível 100. */
  cost: number;
  /** Peso na meta de saúde com nível 100. */
  hit: number;
  /** Crescimento mensal quando a pessoa continua usando. */
  grow: number;
  en: string;
}

export const SUBSTANCES: SubstanceDef[] = [
  { id: 'alcool', name: 'Álcool', icon: '🍺', cost: 120, hit: 0.1, grow: 1.2, en: 'Alcohol' },
  { id: 'cigarro', name: 'Cigarro', icon: '🚬', cost: 90, hit: 0.12, grow: 1, en: 'Cigarettes' },
  { id: 'jogo', name: 'Jogo', icon: '🎰', cost: 400, hit: 0, grow: 1.5, en: 'Gambling' },
  { id: 'drogas', name: 'Drogas pesadas', icon: '💉', cost: 600, hit: 0.22, grow: 2.5, en: 'Hard drugs' },
];

export const substanceById = (id: string) => SUBSTANCES.find((s) => s.id === id)!;

addEn({
  ...Object.fromEntries(CONDITIONS.flatMap((c) => [[c.name, c.en.name], [c.desc, c.en.desc]])),
  ...Object.fromEntries(SUBSTANCES.map((x) => [x.name, x.en])),
});

export const ARTS = [
  { id: 'judo', name: 'Judô', en: 'Judo' },
  { id: 'karate', name: 'Karatê', en: 'Karate' },
  { id: 'jiujitsu', name: 'Jiu-jitsu', en: 'Jiu-jitsu' },
  { id: 'boxe', name: 'Boxe', en: 'Boxing' },
];
export const BELTS = ['Branca', 'Amarela', 'Laranja', 'Verde', 'Roxa', 'Preta'];
addEn({
  Judô: 'Judo', Karatê: 'Karate', 'Jiu-jitsu': 'Jiu-jitsu', Boxe: 'Boxing',
  Branca: 'White', Amarela: 'Yellow', Laranja: 'Orange', Verde: 'Green', Roxa: 'Purple', Preta: 'Black',
});
