import { addEn } from '../../i18n';
import type { GameState } from '../types';

export interface OfficeDef {
  name: string;
  en: string;
  icon: string;
  minAge: number;
  /** Custo da candidatura (campanha mínima), em unidades internas. */
  cost: number;
  /** Duração do mandato em meses. */
  term: number;
  /** Subsídio mensal. */
  pay: number;
  /** Força média do adversário. */
  opp: number;
}

export const OFFICES: OfficeDef[] = [
  { name: 'Vereador', en: 'City councilor', icon: '🏘️', minAge: 21, cost: 8000, term: 48, pay: 3500, opp: 47 },
  { name: 'Prefeito', en: 'Mayor', icon: '🏙️', minAge: 25, cost: 40000, term: 48, pay: 9000, opp: 53 },
  { name: 'Deputado', en: 'Legislator', icon: '🏛️', minAge: 30, cost: 150000, term: 48, pay: 16000, opp: 59 },
  { name: 'Governador', en: 'Governor', icon: '🎖️', minAge: 35, cost: 500000, term: 48, pay: 25000, opp: 65 },
  { name: 'Chefe de governo', en: 'Head of government', icon: '👑', minAge: 40, cost: 2000000, term: 48, pay: 45000, opp: 71 },
];

/** Título do cargo mais alto em cada país. */
export const HEAD_TITLE: Record<string, [string, string]> = {
  br: ['Presidente', 'President'], us: ['Presidente', 'President'], mx: ['Presidente', 'President'], ar: ['Presidente', 'President'],
  fr: ['Presidente', 'President'], kr: ['Presidente', 'President'], cn: ['Presidente', 'President'], za: ['Presidente', 'President'],
  ng: ['Presidente', 'President'], ae: ['Presidente', 'President'],
  uk: ['Primeiro-ministro', 'Prime Minister'], ca: ['Primeiro-ministro', 'Prime Minister'], au: ['Primeiro-ministro', 'Prime Minister'],
  jp: ['Primeiro-ministro', 'Prime Minister'], it: ['Primeiro-ministro', 'Prime Minister'], es: ['Presidente do governo', 'Prime Minister'],
  pt: ['Primeiro-ministro', 'Prime Minister'], in: ['Primeiro-ministro', 'Prime Minister'], de: ['Chanceler', 'Chancellor'],
};

export interface PartyDef {
  id: string;
  name: string;
  en: string;
  /** Posição no espectro: -1 progressista, 0 centro, 1 conservador. */
  lean: number;
}

export const PARTIES: PartyDef[] = [
  { id: 'prog', name: 'Partido Progressista', en: 'Progressive Party', lean: -1 },
  { id: 'centro', name: 'Partido do Centro', en: 'Centrist Party', lean: 0 },
  { id: 'cons', name: 'Partido Conservador', en: 'Conservative Party', lean: 1 },
  { id: 'ind', name: 'Candidatura independente', en: 'Independent run', lean: 0 },
];
export const partyById = (id: string) => PARTIES.find((p) => p.id === id)!;

export interface LawDef {
  id: string;
  name: string;
  en: string;
  icon: string;
  desc: string;
  enDesc: string;
  /** Deslocamento permanente na meta de aprovação enquanto a lei vigora. */
  approval: number;
  /** Excluem-se mutuamente. */
  against?: string;
  effect: Partial<Policy>;
}

/** Efeitos das leis sobre o mundo do jogador. Tudo começa neutro. */
export interface Policy {
  /** Pontos de imposto de renda somados às alíquotas. */
  tax: number;
  /** Multiplicador da mortalidade. */
  mortality: number;
  /** Multiplicador da chance de a polícia prender. */
  arrest: number;
  /** Multiplicador do aprendizado. */
  learn: number;
  /** Variação mensal do preço real dos bens. */
  price: number;
  /** Variação mensal do clima do mercado de ações. */
  market: number;
}

export const NEUTRAL: Policy = { tax: 0, mortality: 1, arrest: 1, learn: 1, price: 0, market: 0 };

export const LAWS: LawDef[] = [
  { id: 'cortar_impostos', name: 'Cortar impostos', en: 'Cut taxes', icon: '✂️', desc: 'Menos imposto de renda para todos; o mercado comemora.', enDesc: 'Lower income tax for everyone; the market cheers.', approval: 5, against: 'aumentar_impostos', effect: { tax: -0.03, market: 0.002 } },
  { id: 'aumentar_impostos', name: 'Aumentar impostos', en: 'Raise taxes', icon: '💸', desc: 'Mais imposto de renda para financiar o Estado. Impopular.', enDesc: 'Higher income tax to fund the state. Unpopular.', approval: -6, against: 'cortar_impostos', effect: { tax: 0.03, market: -0.001 } },
  { id: 'saude_publica', name: 'Investir em saúde pública', en: 'Invest in public health', icon: '🏥', desc: 'Menos mortes e mais gente atendida.', enDesc: 'Fewer deaths and more people treated.', approval: 4, effect: { mortality: 0.92 } },
  { id: 'educacao', name: 'Investir em educação', en: 'Invest in education', icon: '🎓', desc: 'Escolas melhores: todo mundo aprende mais rápido.', enDesc: 'Better schools: everyone learns faster.', approval: 3, effect: { learn: 1.15 } },
  { id: 'seguranca', name: 'Reforçar a segurança', en: 'Strengthen security', icon: '🚓', desc: 'Mais policiais, mais prisões. Mais pena para quem erra.', enDesc: 'More police, more arrests. Harsher on offenders.', approval: 3, effect: { arrest: 1.3 } },
  { id: 'infraestrutura', name: 'Obras de infraestrutura', en: 'Infrastructure works', icon: '🌉', desc: 'Pontes, estradas e portos: a economia respira.', enDesc: 'Bridges, roads and ports: the economy breathes.', approval: 3, effect: { price: -0.0006, market: 0.001 } },
  { id: 'assistencia', name: 'Programa de assistência social', en: 'Social assistance program', icon: '🤲', desc: 'Renda para quem mais precisa. Popular, mas puxa os preços.', enDesc: 'Income for those who need it most. Popular, but pushes prices.', approval: 6, effect: { price: 0.0004 } },
  { id: 'cortar_gastos', name: 'Cortar gastos públicos', en: 'Cut public spending', icon: '🔪', desc: 'Contas em ordem e investidores felizes. Eleitores, nem tanto.', enDesc: 'Books in order and happy investors. Voters, not so much.', approval: -4, effect: { market: 0.003 } },
];
export const lawById = (id: string) => LAWS.find((l) => l.id === id)!;

/** Efeito somado das leis em vigor (neutro se o jogador não for político). */
export function policyOf(g: Pick<GameState, 'life'>): Policy {
  const p = g.life?.special?.politics;
  const out = { ...NEUTRAL };
  if (!p || p.office < 0) return out;
  for (const id of p.laws) {
    const e = lawById(id)?.effect;
    if (!e) continue;
    out.tax += e.tax ?? 0;
    out.mortality *= e.mortality ?? 1;
    out.arrest *= e.arrest ?? 1;
    out.learn *= e.learn ?? 1;
    out.price += e.price ?? 0;
    out.market += e.market ?? 0;
  }
  return out;
}

addEn({
  ...Object.fromEntries(OFFICES.map((o) => [o.name, o.en])),
  ...Object.fromEntries(Object.values(HEAD_TITLE).map(([pt, en]) => [pt, en])),
  ...Object.fromEntries(PARTIES.map((p) => [p.name, p.en])),
  ...Object.fromEntries(LAWS.flatMap((l) => [[l.name, l.en], [l.desc, l.enDesc]])),
});
