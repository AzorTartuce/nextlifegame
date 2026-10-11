import { ageYears, changeStats, formatMoney, livingNpcs, placeLabel, pushFeed, setWorld, worldOf } from '../core';
import { cityOf, countryById, purchasingIndex } from '../data/world';
import type { GameState } from '../types';
import { refreshOffers } from './career';
import { rescalePortfolio } from './market';
import { sellHomes } from './shop';
import { t } from '../../i18n';

export interface MoveQuote {
  abroad: boolean;
  /** Custo da mudança, em unidades internas. */
  cost: number;
  /** Variação do poder de compra dos salários (real, já descontado o custo de vida do país). */
  incomeDelta: number;
  /** Variação do custo de moradia. */
  rentDelta: number;
  /** Variação do imposto marginal (pontos percentuais da faixa alta). */
  taxDelta: number;
}

export function moveQuote(g: GameState, countryId: string, cityName: string): MoveQuote {
  const from = worldOf(g);
  const toCountry = countryById(countryId);
  const toCity = cityOf(toCountry, cityName);
  const abroad = toCountry.id !== from.country.id;
  const real = (c: typeof toCountry, city: typeof toCity) => purchasingIndex(c) * city.wage;
  return {
    abroad,
    cost: abroad ? 2500 : 600,
    incomeDelta: real(toCountry, toCity) / real(from.country, from.city) - 1,
    rentDelta: abroad ? (toCity.cost * purchasingIndex(toCountry)) / (from.city.cost * purchasingIndex(from.country)) - 1 : toCity.cost / from.city.cost - 1,
    taxDelta: toCountry.tax[1] - from.country.tax[1],
  };
}

export function canMove(g: GameState, countryId: string, cityName: string): string | null {
  if (g.country === countryId && g.city === cityName) return t('Você já mora aqui.');
  if (ageYears(g) < 18) return t('Só depois dos 18 anos.');
  if (g.company) return t('Venda ou encerre sua empresa antes de se mudar.');
  if (g.flags.mudou !== undefined && g.t - Number(g.flags.mudou) < 12) return t('Você se mudou há pouco tempo. Espere um ano.');
  const q = moveQuote(g, countryId, cityName);
  if (g.money < q.cost) return t('Precisa de {v} para a mudança.', { v: formatMoney(q.cost) });
  return null;
}

/** Muda de cidade ou de país: perde o emprego e os vínculos locais, mantém o poder de compra do patrimônio. */
export function relocate(g: GameState, countryId: string, cityName: string): string {
  const err = canMove(g, countryId, cityName);
  if (err) return err;
  const q = moveQuote(g, countryId, cityName);
  const from = worldOf(g);
  const toCountry = countryById(countryId);

  g.money -= q.cost;
  if (q.abroad) {
    // O patrimônio mantém o poder de compra: o que é "muito" num país pode ser "pouco" em outro.
    const k = purchasingIndex(from.country) / purchasingIndex(toCountry);
    g.money = Math.round(g.money * k);
    if (g.flags.pensao) g.flags.pensao = Math.round(Number(g.flags.pensao) * k);
  }
  rescalePortfolio(g, from.country.id, toCountry.id);
  g.country = toCountry.id;
  g.city = cityName;
  setWorld(g);

  // Vínculos: quem é local fica para trás; quem é próximo sente a distância.
  for (const n of livingNpcs(g)) {
    if (n.role === 'colega' || n.role === 'rival' || n.role === 'conhecido') {
      delete g.npcs[n.id];
    } else if (n.role === 'parceiro' || n.role === 'conjuge') {
      if (n.relation < 50 && n.role === 'parceiro') n.role = 'ex';
    } else if (n.role !== 'filho') {
      n.relation = Math.max(0, n.relation - (q.abroad ? 25 : 12));
    }
  }

  sellHomes(g);
  if (q.abroad) g.life.crime.heat *= 0.3;
  g.job = null;
  g.agenda.carreira = 0;
  g.livesWithParents = false;
  g.flags.mudou = g.t;
  if (q.abroad) g.flags.emigrou = true;
  refreshOffers(g);
  changeStats(g, q.abroad ? { estresse: 12, felicidade: -6 } : { estresse: 5, felicidade: -3 });

  const msg = q.abroad
    ? t('Você se mudou para {v}, {name}. Nova língua de rua, nova moeda, nova vida.', { v: placeLabel(g), name: t(toCountry.name) })
    : t('Você se mudou para {v}.', { v: placeLabel(g) });
  pushFeed(g, q.abroad ? '✈️' : '📦', msg, 'milestone');
  return msg;
}
