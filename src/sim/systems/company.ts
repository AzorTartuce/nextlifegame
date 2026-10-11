import { ageYears, changeMoney, changeStats, clamp, companyValuation, formatMoney, hasTrait, pushFeed, worldOf } from '../core';
import { COMPANY_PREFIX, COMPANY_SUFFIX } from '../data/names';
import { SECTORS } from '../data/sectors';
import { pick, rrange } from '../rng';
import type { Company, CompanyMonth, Deltas, GameState, SectorId } from '../types';
import { effectiveAgenda } from './agenda';
import { bonuses } from './shop';
import { dec, t } from '../../i18n';

export const MANAGER_COST = 6500;

export function suggestCompanyName(g: GameState, sector: SectorId): string {
  return `${pick(g, COMPANY_PREFIX)} ${pick(g, COMPANY_SUFFIX[sector])}`;
}

export function canFound(g: GameState, sector: SectorId): string | null {
  if (g.company) return t('Você já tem uma empresa.');
  if (ageYears(g) < 18) return t('Precisa ter 18 anos.');
  if (g.money < SECTORS[sector].startCost) return t('Precisa de {v}.', { v: formatMoney(SECTORS[sector].startCost) });
  return null;
}

export function foundCompany(g: GameState, sector: SectorId, name: string): string {
  const err = canFound(g, sector);
  if (err) return err;
  const def = SECTORS[sector];
  changeMoney(g, -def.startCost);
  const p = g.player.stats;
  g.company = {
    name: name.trim() || suggestCompanyName(g, sector),
    sector,
    founded: g.t,
    cash: def.startCost * 0.75,
    quality: clamp(35 + (p.inteligencia - 50) / 5 + (hasTrait(g.player, 'criativo') ? 10 : 0)),
    price: 1,
    marketing: Math.round(def.mktScale * 0.6),
    awareness: 20,
    employees: 1,
    branches: 1,
    reputation: 50,
    manager: false,
    salaryDraw: 0,
    negativeMonths: 0,
    last: null,
    history: [],
  };
  if (g.agenda.empresa < 10) g.agenda.empresa = 15;
  const msg = t('Nasceu a {name}! {icon} Investimento de {v} (75% vira caixa, 25% foi para montar o negócio).', { name: t(g.company.name), icon: def.icon, v: formatMoney(def.startCost) });
  pushFeed(g, '🏁', msg, 'milestone');
  return msg;
}

/** Simula um mês sem efeitos colaterais — usado pela UI para prévias. */
export function forecast(g: GameState, c: Company, noise = 1): CompanyMonth {
  const def = SECTORS[c.sector];
  const { city } = worldOf(g);
  const founderHours = effectiveAgenda(g).empresa;
  const priceFactor = Math.pow(c.price, -1.6);
  const attract = (c.quality / 100) * priceFactor * (0.5 + c.reputation / 100);
  const demand = Math.round(def.market * city.size * c.branches * (c.awareness / 100) * attract * noise);
  const founderCap = founderHours >= 10 ? def.capPerEmployee * Math.min(1, founderHours / 40) : 0;
  const capacity = Math.round(c.employees * def.capPerEmployee + founderCap);
  const customers = Math.min(demand, capacity);
  const revenue = Math.round(customers * def.ticket * c.price);
  const costs = Math.round(
    customers * def.unitCost + c.employees * def.salary * city.wage + c.branches * def.fixed * city.cost + c.marketing + (c.manager ? MANAGER_COST : 0) + c.salaryDraw,
  );
  return { t: g.t, revenue, costs, profit: revenue - costs, customers, demand, capacity, cash: c.cash + revenue - costs };
}

function autoManage(c: Company, m: CompanyMonth) {
  const def = SECTORS[c.sector];
  const needed = Math.ceil((m.demand * 1.1) / def.capPerEmployee);
  if (needed > c.employees) c.employees = Math.min(needed, c.employees + 2);
  else if (needed < c.employees - 1) c.employees = Math.max(1, c.employees - 1);
  const target = clamp(Math.round(m.revenue * 0.1), def.mktScale * 0.3, def.mktScale * 2.5 * c.branches);
  c.marketing = Math.round(target / 50) * 50;
  if (m.demand > m.capacity * 1.4 && c.price < 1.5) c.price = Math.round((c.price + 0.05) * 100) / 100;
  if (m.demand < m.capacity * 0.6 && c.price > 0.8) c.price = Math.round((c.price - 0.05) * 100) / 100;
}

export function companyTick(g: GameState, acc: Deltas) {
  const c = g.company;
  if (!c) return;
  const def = SECTORS[c.sector];

  // Marketing → alcance; reputação → boca a boca.
  const target = 100 * (1 - Math.exp(-c.marketing / (def.mktScale * c.branches)));
  c.awareness = clamp(c.awareness + (target - c.awareness) * 0.25 + (c.reputation - 50) / 50);

  const founderHours = effectiveAgenda(g).empresa;
  c.quality = clamp(c.quality + Math.sqrt(founderHours) * 0.12 - 0.15 + (hasTrait(g.player, 'criativo') ? 0.1 : 0) + Math.min(0.3, bonuses(g).prod * 0.012));

  const m = forecast(g, c, rrange(g, 0.88, 1.12));
  c.cash = m.cash;
  if (c.salaryDraw > 0) changeMoney(g, c.salaryDraw, acc);

  const overflow = m.capacity > 0 ? m.demand / m.capacity : 2;
  c.reputation = clamp(c.reputation + (c.quality - 55) / 30 - (overflow > 1.3 ? 2.5 : 0) - (c.price > 1.6 ? 0.8 : 0) + 0.1);

  c.last = m;
  c.history.push(m);
  if (c.history.length > 36) c.history.shift();

  if (c.manager) autoManage(c, m);

  if (m.profit > 0 && c.history.length % 12 === 0) changeStats(g, { felicidade: 3 }, acc);

  // O dono cobre o rombo com dinheiro do próprio bolso enquanto puder.
  if (c.cash < 0 && g.money > 0) {
    const cover = Math.min(g.money, -c.cash);
    changeMoney(g, -cover, acc);
    c.cash += cover;
    if (!g.flags.aviso_cobertura || (g.flags.aviso_cobertura as number) < g.t - 6) {
      g.flags.aviso_cobertura = g.t;
      pushFeed(g, '🩹', t('Você tirou {v} do bolso para cobrir o caixa da {name}.', { v: formatMoney(cover), name: t(c.name) }), 'bad');
    }
  }

  if (c.cash < 0) {
    c.negativeMonths += 1;
    if (c.negativeMonths === 1) pushFeed(g, '⚠️', t('{name} está no vermelho! Aporte dinheiro ou corte custos.', { name: t(c.name) }), 'bad');
    if (c.negativeMonths >= 4) {
      pushFeed(g, '💥', t('{name} faliu. As dívidas de {v} caíram no seu colo.', { name: t(c.name), v: formatMoney(-c.cash) }), 'bad');
      changeMoney(g, c.cash, acc);
      changeStats(g, { felicidade: -20, estresse: 20 }, acc);
      g.company = null;
      g.agenda.empresa = 0;
      g.flags.faliu = ((g.flags.faliu as number) ?? 0) + 1;
    }
  } else {
    c.negativeMonths = 0;
  }
}

// ---------- Ações do jogador ----------

export function setCompany<K extends 'price' | 'marketing' | 'employees' | 'salaryDraw' | 'manager'>(
  g: GameState, key: K, value: Company[K],
) {
  if (!g.company) return;
  g.company[key] = value;
}

export function investQuality(g: GameState): string {
  const c = g.company;
  if (!c) return '';
  const cost = qualityCost(c);
  if (c.cash < cost) return t('Caixa insuficiente.');
  c.cash -= cost;
  const gain = Math.max(1.5, (100 - c.quality) * 0.12);
  c.quality = clamp(c.quality + gain);
  const msg = t('Investimento em qualidade: +{v} pontos ({v2}).', { v: dec(gain, 1), v2: formatMoney(cost) });
  pushFeed(g, '✨', msg, 'good');
  return msg;
}

export const qualityCost = (c: Company) => Math.round(SECTORS[c.sector].startCost * 0.12 * (1 + c.quality / 50));

export const branchCost = (c: Company) => Math.round(SECTORS[c.sector].branchCost * (1 + (c.branches - 1) * 0.35));

export function openBranch(g: GameState): string {
  const c = g.company;
  if (!c) return '';
  const cost = branchCost(c);
  if (c.cash < cost) return t('Caixa insuficiente: precisa de {v}.', { v: formatMoney(cost) });
  c.cash -= cost;
  c.branches += 1;
  c.employees += 1;
  c.awareness = clamp(c.awareness * 0.85);
  const msg = c.sector === 'app' ? t('{name} chegou a um novo mercado! 🌎', { name: t(c.name) }) : t('Nova filial da {name} inaugurada! ✂️🎀', { name: t(c.name) });
  pushFeed(g, SECTORS[c.sector].building, msg, 'milestone');
  return msg;
}

export function transferToCompany(g: GameState, amount: number): string {
  const c = g.company;
  if (!c || amount <= 0) return '';
  const v = Math.min(amount, Math.max(0, g.money));
  if (v <= 0) return t('Você não tem dinheiro para aportar.');
  g.money -= v;
  c.cash += v;
  return t('Você aportou {v} na empresa.', { v: formatMoney(v) });
}

export function withdrawFromCompany(g: GameState, amount: number): string {
  const c = g.company;
  if (!c || amount <= 0) return '';
  const v = Math.min(amount, Math.max(0, c.cash));
  if (v <= 0) return t('O caixa está vazio.');
  c.cash -= v;
  g.money += v;
  return t('Você retirou {v} da empresa.', { v: formatMoney(v) });
}

export function sellCompany(g: GameState, priceOverride?: number): string {
  const c = g.company;
  if (!c) return '';
  const value = priceOverride ?? companyValuation(g);
  changeMoney(g, value);
  g.company = null;
  g.agenda.empresa = 0;
  g.flags.vendeu_empresa = true;
  const msg = t('Você vendeu a {name} por {v}. 🤝', { name: t(c.name), v: formatMoney(value) });
  pushFeed(g, '💼', msg, 'milestone');
  return msg;
}

/** Dicas do "consultor" — transformam números em linguagem humana. */
export function advisorInsights(g: GameState): { icon: string; text: string; tone: 'good' | 'bad' | 'info' }[] {
  const c = g.company;
  if (!c || !c.last) return c ? [{ icon: '🕐', text: t('Primeiro mês de operação. Avance o tempo para ver os resultados.'), tone: 'info' }] : [];
  const m = c.last;
  const out: { icon: string; text: string; tone: 'good' | 'bad' | 'info' }[] = [];
  if (m.demand > m.capacity * 1.15) out.push({ icon: '🚶‍♂️🚶‍♀️🚶', text: t('Filas! {v} clientes não foram atendidos. Contrate mais gente.', { v: m.demand - m.capacity }), tone: 'bad' });
  if (m.capacity > m.demand * 1.6 && c.employees > 1) out.push({ icon: '🥱', text: t('Equipe ociosa. Dá pra reduzir funcionários ou investir em marketing.'), tone: 'info' });
  if (c.awareness < 25) out.push({ icon: '📣', text: t('Pouca gente conhece sua marca. Aumente o marketing.'), tone: 'info' });
  if (c.quality < 40) out.push({ icon: '🧪', text: t('Clientes reclamam da qualidade. Invista ou dedique mais horas.'), tone: 'bad' });
  if (c.price > 1.5 && m.demand < m.capacity) out.push({ icon: '🏷️', text: t('Preço salgado está espantando clientes.'), tone: 'info' });
  if (c.price < 0.8 && m.demand > m.capacity) out.push({ icon: '💡', text: t('Sobra cliente: você pode cobrar mais caro.'), tone: 'info' });
  if (m.profit > 0 && c.cash > branchCost(c) * 1.3) out.push({ icon: '🗺️', text: t('Caixa saudável. Que tal abrir uma filial?'), tone: 'good' });
  if (m.profit < 0) out.push({ icon: '🩸', text: t('Prejuízo de {v} no mês.', { v: formatMoney(-m.profit) }), tone: 'bad' });
  if (!out.length) out.push({ icon: '👌', text: t('Operação redondinha. Continue assim!'), tone: 'good' });
  return out.slice(0, 3);
}
