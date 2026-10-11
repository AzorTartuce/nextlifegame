import { countryById } from './world';
import { STOCKS } from './stocks.generated';
import { addEn, numberLocale } from '../../i18n';

export type StockSector =
  | 'tecnologia' | 'financeiro' | 'energia' | 'saude' | 'consumo' | 'varejo'
  | 'industria' | 'utilidades' | 'telecom' | 'imobiliario' | 'materiais' | 'luxo' | 'cripto';

export type StockGroup = 'eua' | 'brasil' | 'europa' | 'asia' | 'emirados' | 'cripto';

export interface StockDef {
  ticker: string;
  name: string;
  group: StockGroup;
  country: string;
  flag: string;
  /** Id do país do jogo onde a empresa é "doméstica" (corretagem menor). */
  home: string | null;
  currency: string;
  /** Preço inicial na moeda da própria ação. */
  price: number;
  sector: StockSector;
  desc: string;
  /** Meia-amplitude da flutuação mensal aleatória (sorteio uniforme entre -vol e +vol). */
  vol: number;
  /** Tendência (drift) mensal de longo prazo. */
  drift: number;
  /** Dividend yield anual. */
  yield: number;
  /** Sensibilidade ao clima do mercado. */
  beta: number;
}

export const SECTOR_META: Record<StockSector, { name: string; icon: string }> = {
  tecnologia: { name: 'Tecnologia', icon: '💻' },
  financeiro: { name: 'Financeiro', icon: '🏦' },
  energia: { name: 'Energia', icon: '🛢️' },
  saude: { name: 'Saúde', icon: '💊' },
  consumo: { name: 'Consumo', icon: '🛒' },
  varejo: { name: 'Varejo', icon: '🏬' },
  industria: { name: 'Indústria', icon: '🏭' },
  utilidades: { name: 'Utilidades', icon: '💡' },
  telecom: { name: 'Telecom', icon: '📡' },
  imobiliario: { name: 'Imobiliário', icon: '🏗️' },
  materiais: { name: 'Materiais', icon: '⛏️' },
  luxo: { name: 'Luxo', icon: '👜' },
  cripto: { name: 'Cripto', icon: '₿' },
};

export const GROUP_META: Record<StockGroup, { name: string; flag: string; short: string }> = {
  eua: { name: 'Wall Street', flag: '🇺🇸', short: 'EUA' },
  brasil: { name: 'Bolsa brasileira', flag: '🇧🇷', short: 'Brasil' },
  europa: { name: 'Bolsas europeias', flag: '🇪🇺', short: 'Europa' },
  asia: { name: 'Bolsas asiáticas', flag: '🌏', short: 'Ásia' },
  emirados: { name: 'Bolsas do Golfo', flag: '🇦🇪', short: 'Emirados' },
  cripto: { name: 'Mercado cripto', flag: '₿', short: 'Cripto' },
};

/** Câmbio de mercado: unidades de cada moeda por 1 dólar. Fixo (o câmbio não flutua no jogo). */
export const FX_PER_USD: Record<string, number> = {
  USD: 1, BRL: 5.45, EUR: 0.92, GBP: 0.78, CHF: 0.88, JPY: 150, KRW: 1350, HKD: 7.8, CNY: 7.2, INR: 84,
  AED: 3.6725, CAD: 1.37, AUD: 1.5, MXN: 18.5, ARS: 950, NGN: 1550, ZAR: 18.2,
};

export const CURRENCY_SYMBOL: Record<string, string> = {
  USD: 'US$', BRL: 'R$', EUR: '€', GBP: '£', CHF: 'CHF ', JPY: '¥', KRW: '₩', HKD: 'HK$', CNY: 'CN¥', INR: '₹',
  AED: 'AED ', CAD: 'C$', AUD: 'A$', MXN: 'MX$', ARS: 'AR$', NGN: '₦', ZAR: 'R',
};

/** Quantas unidades internas vale 1 unidade de `currency` para quem vive em `countryId`. */
export function unitsPerCurrency(currency: string, countryId: string): number {
  const c = countryById(countryId);
  return FX_PER_USD[c.currency.code] / FX_PER_USD[currency] / c.k;
}

export function formatPrice(currency: string, value: number): string {
  const sym = CURRENCY_SYMBOL[currency] ?? `${currency} `;
  const digits = value >= 10000 ? 0 : value >= 100 ? 1 : 2;
  const n = value.toLocaleString(numberLocale(), { minimumFractionDigits: value >= 10000 ? 0 : digits, maximumFractionDigits: digits });
  return `${sym}${n}`;
}

const coin = (ticker: string, name: string, price: number, vol: number, drift: number, beta: number, desc: string, yieldPct = 0): StockDef => ({
  ticker, name, group: 'cripto', country: 'Global', flag: '₿', home: null, currency: 'USD', price, sector: 'cripto', desc, vol, drift, yield: yieldPct, beta,
});

/** Criptomoedas: voláteis, 24h por dia, sem dividendos (a stablecoin paga uma pequena taxa). */
export const CRYPTO: StockDef[] = [
  coin('BTC', 'Bitcoin', 62000, 0.16, 0.008, 1.5, 'A primeira e maior criptomoeda, apelidada de ouro digital.'),
  coin('ETH', 'Ethereum', 3000, 0.19, 0.008, 1.6, 'Rede de contratos inteligentes sobre a qual roda boa parte do mundo cripto.'),
  coin('SOL', 'Solana', 150, 0.24, 0.008, 1.8, 'Rede rápida e barata, popular entre desenvolvedores e especuladores.'),
  coin('XRP', 'XRP', 0.55, 0.2, 0.005, 1.5, 'Moeda focada em pagamentos entre bancos e remessas internacionais.'),
  coin('ADA', 'Cardano', 0.45, 0.22, 0.005, 1.6, 'Rede desenvolvida com forte base acadêmica e ritmo lento.'),
  coin('LTC', 'Litecoin', 80, 0.18, 0.004, 1.4, 'A "prata" ao lado do ouro digital: antiga e estável para o padrão cripto.'),
  coin('DOGE', 'Dogecoin', 0.15, 0.3, 0.004, 1.9, 'Nasceu como piada e virou fenômeno de internet.'),
  coin('USDT', 'Tether', 1, 0.003, 0, 0, 'Stablecoin atrelada ao dólar: serve de porto seguro entre uma aposta e outra.', 0.02),
];

export const ALL_STOCKS: readonly StockDef[] = [...STOCKS, ...CRYPTO];
const BY_TICKER = new Map(ALL_STOCKS.map((s) => [s.ticker, s]));
export const stockByTicker = (t: string): StockDef | undefined => BY_TICKER.get(t);

/** Alíquota de imposto sobre ganhos de capital do país (derivada da faixa alta do imposto de renda). */
export const capGainsRate = (countryId: string) => Math.round(countryById(countryId).tax[1] * 0.65 * 100) / 100;

addEn({
  Cripto: 'Crypto', 'Mercado cripto': 'Crypto market',
  'A primeira e maior criptomoeda, apelidada de ouro digital.': 'The first and largest cryptocurrency, nicknamed digital gold.',
  'Rede de contratos inteligentes sobre a qual roda boa parte do mundo cripto.': 'A smart-contract network that much of the crypto world runs on.',
  'Rede rápida e barata, popular entre desenvolvedores e especuladores.': 'A fast, cheap network popular with developers and speculators.',
  'Moeda focada em pagamentos entre bancos e remessas internacionais.': 'A coin focused on payments between banks and international transfers.',
  'Rede desenvolvida com forte base acadêmica e ritmo lento.': 'A network built on strong academic foundations and a slow pace.',
  'A "prata" ao lado do ouro digital: antiga e estável para o padrão cripto.': 'The “silver” next to digital gold: old and stable by crypto standards.',
  'Nasceu como piada e virou fenômeno de internet.': 'Born as a joke and became an internet phenomenon.',
  'Stablecoin atrelada ao dólar: serve de porto seguro entre uma aposta e outra.': 'A dollar-pegged stablecoin: a safe harbor between one bet and the next.',
  Global: 'Global',
});
