import type { ActivityId } from '../types';

export interface ActivityDef {
  id: ActivityId;
  name: string;
  icon: string;
  color: string;
  hint: string;
  minAge: number;
}

export const ACTIVITIES: ActivityDef[] = [
  { id: 'estudo', name: 'Estudar', icon: '📖', color: '#6c8cff', hint: '+Inteligência, +estresse', minAge: 6 },
  { id: 'exercicio', name: 'Exercício', icon: '🏃', color: '#3ecf8e', hint: '+Saúde, +aparência, −estresse', minAge: 6 },
  { id: 'social', name: 'Amigos & Família', icon: '🫂', color: '#ffb547', hint: '+Felicidade, +carisma, +relações', minAge: 6 },
  { id: 'lazer', name: 'Lazer', icon: '🎮', color: '#c77dff', hint: '+Felicidade, −estresse, custa $', minAge: 6 },
  { id: 'bico', name: 'Bicos', icon: '🧰', color: '#ff7b7b', hint: '+Dinheiro, +estresse', minAge: 14 },
  { id: 'carreira', name: 'Hora Extra', icon: '💼', color: '#4dd0e1', hint: '+Desempenho no emprego', minAge: 16 },
  { id: 'empresa', name: 'Minha Empresa', icon: '🏢', color: '#ffd166', hint: '+Qualidade e capacidade', minAge: 18 },
];

/** Horas semanais acordado (168h − 56h de sono). */
export const WAKING_HOURS = 112;
