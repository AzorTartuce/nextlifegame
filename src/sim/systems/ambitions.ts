import { t } from '../../i18n';
import { ageYears, changeStats, genderTitle, localizeMoney, netWorth, npcsByRole, partnerOf, pushFeed } from '../core';
import type { GameState } from '../types';
import { ownsHome, statusScore } from './shop';
import { itemOf, portfolioValue } from './valuation';

export interface AmbitionDef {
  id: string;
  icon: string;
  text: string;
  available: (g: GameState) => boolean;
  done: (g: GameState) => boolean;
  /** 0..1 para a barra de progresso. */
  progress?: (g: GameState) => number;
}

const ratio = (v: number, goal: number) => Math.max(0, Math.min(1, v / goal));

export const AMBITIONS: AmbitionDef[] = [
  { id: 'amigo', icon: '🫂', text: 'Fazer um melhor amigo', available: (g) => ageYears(g) >= 6, done: (g) => npcsByRole(g, 'amigo').some((n) => n.relation >= 80) },
  { id: 'nota', icon: '📚', text: 'Ser um dos melhores da escola', available: (g) => g.education.inSchool, done: (g) => g.education.schoolPerf >= 85, progress: (g) => ratio(g.education.schoolPerf, 85) },
  { id: 'emprego', icon: '💼', text: 'Conseguir o primeiro emprego', available: (g) => ageYears(g) >= 16, done: (g) => !!g.job },
  { id: 'faculdade', icon: '🎓', text: 'Concluir uma faculdade', available: (g) => g.education.level === 'medio' || !!g.education.enrolled, done: (g) => g.education.degrees.length > 0 },
  { id: 'casa', icon: '🏠', text: 'Morar sozinho(a)', available: (g) => ageYears(g) >= 18, done: (g) => !g.livesWithParents },
  { id: 'poupar10k', icon: '💰', text: 'Juntar $10.000', available: (g) => ageYears(g) >= 16, done: (g) => g.money >= 10000, progress: (g) => ratio(g.money, 10000) },
  { id: 'promocao', icon: '🎖️', text: 'Ser promovido(a)', available: (g) => !!g.job, done: (g) => !!g.flags.promovido },
  { id: 'empresa', icon: '🏁', text: 'Abrir sua própria empresa', available: (g) => ageYears(g) >= 20 && g.money >= 8000, done: (g) => !!g.company },
  { id: 'lucro10k', icon: '📈', text: 'Empresa com lucro de $10.000/mês', available: (g) => !!g.company, done: (g) => (g.company?.last?.profit ?? 0) >= 10000, progress: (g) => ratio(g.company?.last?.profit ?? 0, 10000) },
  { id: 'filial3', icon: '🗺️', text: 'Ter 3 filiais', available: (g) => !!g.company, done: (g) => (g.company?.branches ?? 0) >= 3, progress: (g) => ratio(g.company?.branches ?? 0, 3) },
  { id: 'namoro', icon: '💕', text: 'Encontrar um amor', available: (g) => ageYears(g) >= 15, done: (g) => !!partnerOf(g) },
  { id: 'casar', icon: '💍', text: 'Casar', available: (g) => partnerOf(g)?.role === 'parceiro', done: (g) => !!g.flags.casou },
  { id: 'filho', icon: '👶', text: 'Ter um filho', available: (g) => !!g.flags.casou && ageYears(g) <= 48, done: (g) => !!g.flags.teve_filho },
  { id: 'primeira_acao', icon: '📈', text: 'Comprar sua primeira ação', available: (g) => ageYears(g) >= 18, done: (g) => g.portfolio.trades.length > 0 },
  { id: 'dividendos', icon: '💰', text: 'Receber dividendos', available: (g) => ageYears(g) >= 18 && g.portfolio.trades.length > 0, done: (g) => g.portfolio.dividendsTotal > 0 },
  { id: 'investidor', icon: '🧑‍💼', text: 'Ter $20.000 investidos na bolsa', available: (g) => ageYears(g) >= 18 && g.portfolio.trades.length > 0, done: (g) => portfolioValue(g) >= 20000, progress: (g) => ratio(portfolioValue(g), 20000) },
  { id: 'carro_proprio', icon: '🚗', text: 'Comprar um carro', available: (g) => ageYears(g) >= 18, done: (g) => g.shop.inventory.some((o) => itemOf(o)?.cat === 'carro') },
  { id: 'casa_propria', icon: '🏠', text: 'Ter casa própria', available: (g) => ageYears(g) >= 21, done: (g) => ownsHome(g) },
  { id: 'estilo', icon: '👔', text: 'Chegar a 40 de status social', available: (g) => ageYears(g) >= 16, done: (g) => statusScore(g) >= 40, progress: (g) => ratio(statusScore(g), 40) },
  { id: 'saude90', icon: '💪', text: 'Chegar a 90 de saúde', available: (g) => ageYears(g) >= 14, done: (g) => g.player.stats.saude >= 90, progress: (g) => ratio(g.player.stats.saude, 90) },
  { id: 'cemmil', icon: '🏦', text: 'Patrimônio de $100.000', available: (g) => netWorth(g) >= 20000, done: (g) => netWorth(g) >= 100000, progress: (g) => ratio(netWorth(g), 100000) },
  { id: 'milhao', icon: '💎', text: 'Ser milionário(a)', available: (g) => netWorth(g) >= 150000, done: (g) => netWorth(g) >= 1_000_000, progress: (g) => ratio(netWorth(g), 1_000_000) },
  { id: 'paz', icon: '🧘', text: 'Viver em paz (estresse < 15)', available: (g) => ageYears(g) >= 30, done: (g) => g.player.stats.estresse < 15, progress: (g) => ratio(100 - g.player.stats.estresse, 85) },
];

export function activeAmbitions(g: GameState, n = 3): AmbitionDef[] {
  return AMBITIONS.filter((a) => !g.ambitionsDone.includes(a.id) && a.available(g)).slice(0, n);
}

export function checkAmbitions(g: GameState) {
  for (const a of activeAmbitions(g, 3)) {
    if (a.done(g)) {
      g.ambitionsDone.push(a.id);
      changeStats(g, { felicidade: 6 });
      pushFeed(g, '🏆', t('Ambição realizada: {text}!', { text: genderTitle(localizeMoney(t(a.text)), g.player.gender) }), 'milestone');
    }
  }
}
