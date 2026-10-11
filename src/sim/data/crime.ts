import { addEn } from '../../i18n';

export type CrimeKind = 'furto' | 'violento' | 'fraude' | 'drogas';

export interface CrimeDef {
  id: string;
  name: string;
  en: string;
  icon: string;
  desc: string;
  enDesc: string;
  minAge: number;
  /** Chance-base de dar certo, antes dos bônus. */
  base: number;
  stat: 'inteligencia' | 'carisma' | 'saude';
  /** Ganho em unidades internas. */
  loot: [number, number];
  /** Quanta atenção da polícia o crime atrai. */
  heat: number;
  /** Pena em anos se for condenado. */
  years: [number, number];
  karma: number;
  kind: CrimeKind;
  /** Risco de morrer na tentativa, em fração. */
  death?: number;
  /** Abre um minigame; sucesso e fracasso dependem dele. */
  minigame?: string;
  /** Precisa de arma (com porte ou não). */
  weapon?: boolean;
  risk: 'baixo' | 'medio' | 'alto';
}

export const CRIMES: CrimeDef[] = [
  { id: 'furto_loja', name: 'Furtar numa loja', en: 'Shoplift', icon: '🛍️', desc: 'Pequeno, rápido e nervoso.', enDesc: 'Small, quick and nerve-racking.', minAge: 10, base: 0.62, stat: 'carisma', loot: [30, 150], heat: 4, years: [0.1, 0.5], karma: -2, kind: 'furto', risk: 'baixo' },
  { id: 'carteira', name: 'Bater carteira', en: 'Pickpocket', icon: '👛', desc: 'Dedos leves numa multidão distraída.', enDesc: 'Light fingers in a distracted crowd.', minAge: 12, base: 0.5, stat: 'carisma', loot: [20, 220], heat: 5, years: [0.2, 0.8], karma: -3, kind: 'furto', risk: 'baixo' },
  { id: 'vandalismo', name: 'Pichar e depredar', en: 'Vandalize', icon: '🎨', desc: 'Arte (ou crime) nas paredes da cidade.', enDesc: 'Art (or crime) on the city walls.', minAge: 11, base: 0.7, stat: 'carisma', loot: [0, 0], heat: 3, years: [0.1, 0.4], karma: -1, kind: 'furto', risk: 'baixo' },
  { id: 'roubo_casa', name: 'Roubar uma casa', en: 'Burgle a house', icon: '🏠', desc: 'Entre, pegue o que der e saia antes do vigia.', enDesc: 'Get in, grab what you can and leave before the guard.', minAge: 14, base: 0.55, stat: 'inteligencia', loot: [600, 6000], heat: 12, years: [1, 4], karma: -6, kind: 'furto', minigame: 'assalto', risk: 'medio' },
  { id: 'roubo_carro', name: 'Roubar um carro', en: 'Steal a car', icon: '🚗', desc: 'Ligação direta e um desmanche à espera.', enDesc: 'Hotwire it and a chop shop is waiting.', minAge: 16, base: 0.45, stat: 'inteligencia', loot: [2000, 12000], heat: 15, years: [2, 6], karma: -7, kind: 'furto', risk: 'medio' },
  { id: 'golpe', name: 'Aplicar um golpe', en: 'Run a scam', icon: '🎭', desc: 'Conversa boa, promessa fácil e uma conta bancária que não é sua.', enDesc: 'Smooth talk, easy promises and a bank account that is not yours.', minAge: 18, base: 0.5, stat: 'carisma', loot: [3000, 25000], heat: 10, years: [1, 5], karma: -8, kind: 'fraude', risk: 'medio' },
  { id: 'trafico', name: 'Vender drogas', en: 'Sell drugs', icon: '💊', desc: 'Dinheiro rápido, perigo constante.', enDesc: 'Quick money, constant danger.', minAge: 16, base: 0.55, stat: 'carisma', loot: [800, 6000], heat: 18, years: [3, 10], karma: -10, kind: 'drogas', death: 0.01, risk: 'alto' },
  { id: 'assalto_banco', name: 'Assaltar um banco', en: 'Rob a bank', icon: '🏦', desc: 'A grande jogada. Ou o grande erro.', enDesc: 'The big score. Or the big mistake.', minAge: 18, base: 0.25, stat: 'inteligencia', loot: [50000, 400000], heat: 40, years: [10, 25], karma: -18, kind: 'violento', death: 0.06, weapon: true, risk: 'alto' },
  { id: 'assalto_comboio', name: 'Assaltar um carro-forte', en: 'Hit an armored truck', icon: '🚛', desc: 'Planejamento de meses para minutos de ação.', enDesc: 'Months of planning for minutes of action.', minAge: 18, base: 0.18, stat: 'inteligencia', loot: [100000, 800000], heat: 45, years: [15, 30], karma: -22, kind: 'violento', death: 0.1, weapon: true, risk: 'alto' },
  { id: 'assassinato', name: 'Matar alguém', en: 'Kill someone', icon: '🔪', desc: 'Sem volta. Uma decisão que muda tudo, para sempre.', enDesc: 'No way back. A decision that changes everything, forever.', minAge: 16, base: 0.5, stat: 'saude', loot: [0, 0], heat: 50, years: [20, 40], karma: -35, kind: 'violento', death: 0.04, risk: 'alto' },
];

export const crimeById = (id: string) => CRIMES.find((c) => c.id === id)!;

/** Rigor da justiça por país: multiplica as penas. */
export const JUSTICE: Record<string, number> = {
  us: 1.35, ca: 0.8, au: 0.85, mx: 1.1, br: 0.95, ar: 0.9, pt: 0.7, fr: 0.8, de: 0.7, es: 0.8, it: 0.9, uk: 0.9,
  za: 1.1, ng: 1.15, jp: 1.2, kr: 1.1, cn: 1.4, in: 1.1, ae: 1.5,
};

export const GANG_RANKS = [
  { name: 'Associado', pay: 800 },
  { name: 'Soldado', pay: 2500 },
  { name: 'Capo', pay: 8000 },
  { name: 'Subchefe', pay: 25000 },
  { name: 'Chefe', pay: 80000 },
];

export const GANG_NAMES = ['Família Moretti', 'Cartel do Sul', 'Os Corvos', 'Irmandade da Lua', 'Clã Vermelho', 'Sindicato do Porto', 'Os Lobos de Aço'];

addEn({
  ...Object.fromEntries(CRIMES.flatMap((c) => [[c.name, c.en], [c.desc, c.enDesc]])),
  Associado: 'Associate', Soldado: 'Soldier', Capo: 'Capo', Subchefe: 'Underboss', Chefe: 'Boss',
  'Família Moretti': 'Moretti Family', 'Cartel do Sul': 'Southern Cartel', 'Os Corvos': 'The Crows', 'Irmandade da Lua': 'Brotherhood of the Moon',
  'Clã Vermelho': 'Red Clan', 'Sindicato do Porto': 'Harbor Syndicate', 'Os Lobos de Aço': 'The Steel Wolves',
  'salvando a vida de outra pessoa': 'saving another person’s life', 'uma overdose': 'an overdose', 'num tiroteio': 'in a shootout',
  'executado pela máfia': 'executed by the mob', 'num motim na prisão': 'in a prison riot',
});
