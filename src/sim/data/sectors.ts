import type { SectorId } from '../types';

export interface SectorDef {
  id: SectorId;
  name: string;
  icon: string;
  building: string;
  startCost: number;
  /** Ticket médio por cliente/mês com preço 1.0. */
  ticket: number;
  unitCost: number;
  /** Clientes potenciais por filial por mês. */
  market: number;
  capPerEmployee: number;
  salary: number;
  fixed: number;
  branchCost: number;
  /** Verba de marketing que leva a ~63% de alcance. */
  mktScale: number;
  pitch: string;
}

export const SECTORS: Record<SectorId, SectorDef> = {
  cafe: {
    id: 'cafe', name: 'Cafeteria', icon: '☕', building: '🏪', startCost: 20000, ticket: 18, unitCost: 6,
    market: 3200, capPerEmployee: 600, salary: 1900, fixed: 3000, branchCost: 25000, mktScale: 2000,
    pitch: 'Barata para começar, margens apertadas. Ótima para aprender.',
  },
  roupas: {
    id: 'roupas', name: 'Loja de Roupas', icon: '👕', building: '🏬', startCost: 40000, ticket: 120, unitCost: 45,
    market: 900, capPerEmployee: 150, salary: 2100, fixed: 6000, branchCost: 45000, mktScale: 3500,
    pitch: 'Marketing e qualidade fazem toda a diferença.',
  },
  app: {
    id: 'app', name: 'Startup de App', icon: '📱', building: '🏢', startCost: 30000, ticket: 12, unitCost: 1,
    market: 5000, capPerEmployee: 1500, salary: 7000, fixed: 2500, branchCost: 60000, mktScale: 6000,
    pitch: 'Alto risco, escala enorme. Novos mercados = novas "filiais".',
  },
  academia: {
    id: 'academia', name: 'Academia', icon: '🏋️', building: '🏟️', startCost: 60000, ticket: 110, unitCost: 10,
    market: 950, capPerEmployee: 120, salary: 2300, fixed: 9000, branchCost: 70000, mktScale: 3000,
    pitch: 'Cara de abrir, receita recorrente e estável.',
  },
};
