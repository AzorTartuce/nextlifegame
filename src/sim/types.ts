import type { ShopItem } from './data/shop';

export type StatKey = 'saude' | 'felicidade' | 'inteligencia' | 'aparencia' | 'carisma' | 'estresse';
export type Stats = Record<StatKey, number>;
export type DeltaKey = StatKey | 'dinheiro';
export type Deltas = Partial<Record<DeltaKey, number>>;

export type Gender = 'm' | 'f';
export type Attraction = 'm' | 'f' | 'ambos';

export interface Look {
  skin: number;
  hair: number;
  hairStyle: number;
  eyes: number;
  shirt: number;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  /** Mês absoluto do nascimento (ano * 12 + mês). */
  birth: number;
  stats: Stats;
  traits: string[];
  look: Look;
  alive: boolean;
  deathT?: number;
}

export type Role =
  | 'pai' | 'mae' | 'irmao' | 'amigo' | 'parceiro' | 'conjuge' | 'filho'
  | 'ex' | 'colega' | 'rival' | 'conhecido';

export interface Memory {
  t: number;
  tag: string;
  text: string;
  weight: number;
}

export interface NPC extends Person {
  role: Role;
  relation: number;
  memories: Memory[];
  /** Mês em que o relacionamento atual começou. */
  since: number;
}

export type ActivityId = 'estudo' | 'exercicio' | 'social' | 'lazer' | 'bico' | 'carreira' | 'empresa';
export type Agenda = Record<ActivityId, number>;

export type EduLevel = 'nenhum' | 'fundamental' | 'medio' | 'superior';
export type CourseId =
  | 'tecnologia' | 'saude' | 'negocios' | 'direito' | 'artes' | 'educacao' | 'engenharia' | 'arquitetura' | 'psicologia'
  | 'odontologia' | 'veterinaria' | 'farmacia' | 'jornalismo' | 'ciencias' | 'contabilidade' | 'gastronomia';

export interface Education {
  level: EduLevel;
  degrees: CourseId[];
  inSchool: boolean;
  schoolPerf: number;
  enrolled: null | { course: CourseId; monthsLeft: number; performance: number; monthly: number };
}

export interface Job {
  careerId: string;
  level: number;
  performance: number;
  monthsInRole: number;
  salaryBonus: number;
}

export interface JobOffer {
  careerId: string;
  level: number;
  applied?: boolean;
}

export type SectorId = 'cafe' | 'roupas' | 'app' | 'academia';

export interface CompanyMonth {
  t: number;
  revenue: number;
  costs: number;
  profit: number;
  customers: number;
  demand: number;
  capacity: number;
  cash: number;
}

export interface Company {
  name: string;
  sector: SectorId;
  founded: number;
  cash: number;
  quality: number;
  /** Multiplicador do preço base do setor (0.6 a 2.0). */
  price: number;
  marketing: number;
  awareness: number;
  employees: number;
  branches: number;
  reputation: number;
  manager: boolean;
  /** Pró-labore mensal que vai para o bolso do dono. */
  salaryDraw: number;
  negativeMonths: number;
  last: CompanyMonth | null;
  history: CompanyMonth[];
}

export type FeedKind = 'info' | 'good' | 'bad' | 'event' | 'milestone';

export interface FeedEntry {
  id: number;
  t: number;
  icon: string;
  text: string;
  kind: FeedKind;
  deltas?: Deltas;
}

export interface PendingEvent {
  storyletId: string;
  title: string;
  icon: string;
  scene: string;
  text: string;
  choices: { index: number; label: string; hint?: string }[];
  ctx: Record<string, string>;
}

export interface EventResult {
  title: string;
  icon: string;
  scene: string;
  text: string;
  deltas: Deltas;
}

export interface LineageEntry {
  name: string;
  born: number;
  died: number;
  netWorth: number;
  cause: string;
}

// ---------- Mercado de ações ----------

export interface NewsItem {
  id: number;
  t: number;
  scope: 'empresa' | 'setor' | 'bolsa' | 'mundo';
  ticker?: string;
  sector?: string;
  group?: string;
  /** "fato" costuma se confirmar; "boato" erra com frequência. */
  kind: 'fato' | 'boato' | 'macro';
  tone: 'pos' | 'neg';
  strength: 1 | 2 | 3 | 4;
  headline: string;
  /** Efeito total do evento sobre o preço, revelado quando o evento termina de ser absorvido. */
  realized?: number;
  done: boolean;
}

export interface MarketState {
  /** Mês em que o mercado começou (âncora do valor fundamental). */
  t0: number;
  /** Preço atual de cada ação, na moeda da própria ação. */
  prices: Record<string, number>;
  /** Vantagem (ou desvantagem) oculta de cada empresa: parte do futuro que ninguém vê. */
  edge: Record<string, number>;
  /** Fechamentos mensais (mais antigo primeiro). */
  history: Record<string, number[]>;
  /** Variação do último mês, em fração. */
  lastChange: Record<string, number>;
  /** Índice geral (média igual de todas as ações), base 1000. */
  index: number[];
  regime: { kind: 'neutral' | 'bull' | 'bear'; effect: number; left: number };
  sectorMood: Record<string, { v: number; left: number }>;
  groupMood: Record<string, { v: number; left: number }>;
  /** Parte do impacto de um evento que ainda será absorvida pelo preço. */
  pending: { ticker: string; impact: number; t: number; newsId: number }[];
  news: NewsItem[];
}

export interface Trade {
  t: number;
  ticker: string;
  side: 'compra' | 'venda' | 'short' | 'cobertura' | 'margem';
  shares: number;
  /** Preço na moeda da ação. */
  price: number;
  /** Valor em unidades internas. */
  value: number;
  fee: number;
  gain?: number;
}

export interface Portfolio {
  long: Record<string, { shares: number; cost: number }>;
  short: Record<string, { shares: number; proceeds: number; margin: number; since: number }>;
  /** Ganhos realizados no ano fiscal corrente (vendas, dividendos, coberturas). */
  realizedYear: number;
  /** Prejuízo acumulado de anos anteriores, abatido de ganhos futuros. */
  lossCarry: number;
  realizedTotal: number;
  dividendsTotal: number;
  feesTotal: number;
  taxPaid: number;
  trades: Trade[];
}

// ---------- Compras ----------

export interface OwnedItem {
  uid: number;
  itemId: string;
  t: number;
  /** Quanto foi pago, em unidades internas da época. */
  paid: number;
  /** Ouro: índice do ouro na compra. Colecionáveis sorteados: multiplicador de raridade. */
  mult?: number;
  /** Imóvel alugado a terceiros: rende aluguel e não conta como moradia. */
  rented?: boolean;
  /** Itens únicos de ofertas ficam guardados por inteiro, pois não existem no catálogo. */
  custom?: ShopItem;
}

export interface ShopOffer {
  id: number;
  storeId: string;
  item: ShopItem;
  /** Fração de desconto (0 a 0,7). */
  discount: number;
  headline: string;
  expires: number;
}

export interface ShopTrend {
  /** Multiplicador do status dos itens da marca (0,4 = cancelada, 1,5 = viral). */
  status: number;
  /** Multiplicador dos preços da marca. */
  price: number;
  left: number;
}

export interface ShopNews {
  id: number;
  t: number;
  storeId: string;
  tone: 'pos' | 'neg';
  headline: string;
}

export interface ShopState {
  inventory: OwnedItem[];
  /** Preço real dos bens em relação à renda (1 = base). Sobe com o clima da economia. */
  priceIndex: number;
  priceHistory: number[];
  goldIdx: number;
  /** "Saúde oculta": acúmulo de má alimentação. */
  junk: number;
  /** Compras do mês por categoria (cada repetição rende menos). */
  monthly: Record<string, number>;
  trends: Record<string, ShopTrend>;
  offers: ShopOffer[];
  news: ShopNews[];
  spentTotal: number;
  lastJunkWarn: number;
}

// ---------- Vida: saúde, crime, carreiras especiais, viagem, pets, cripto ----------

export interface Condition {
  id: string;
  since: number;
  /** Doenças crônicas começam sem diagnóstico, até aparecerem sintomas ou um check-up. */
  known: boolean;
  /** 0 a 100: quanto pesa na saúde e na chance de morrer. */
  severity: number;
  treated: boolean;
}

export interface HealthState {
  conditions: Condition[];
  /** Nível de dependência (0 a 100) por vício: alcool, cigarro, jogo, drogas. */
  addictions: Record<string, number>;
  rehabLeft: number;
  martial: { art: string; belt: number } | null;
  gym: boolean;
  lastCheckup: number;
}

export interface PrisonState {
  monthsLeft: number;
  total: number;
  crime: string;
  /** Boa conduta reduz a pena. */
  conduct: number;
  gang: string | null;
}

export interface CrimeState {
  /** Condenações. Pesam em empregos e na política. */
  record: number;
  /** Atenção da polícia (0 a 100). */
  heat: number;
  prison: PrisonState | null;
  fugitive: boolean;
  gang: null | { name: string; rank: number; loyalty: number; since: number };
  informant: boolean;
  weapon: boolean;
  /** Último crime cometido (a polícia investiga esse). */
  last: string | null;
  /** Julgamento em andamento. */
  trial: null | { crime: string; months: number };
  mafiaMissions: number;
}

export interface Pet {
  id: number;
  kind: string;
  name: string;
  born: number;
  health: number;
  bond: number;
}

export interface TravelState {
  visited: string[];
  trips: number;
  lastTrip: number;
}

export interface MusicCareer { instrument: string; skill: number; band: string | null; albums: number; fans: number; label: boolean; lastAlbum: number }
export interface ActingCareer { skill: number; agent: boolean; roles: number; awards: number; fame: number; lastRole: number }
export interface SportCareer { sport: string; skill: number; team: string | null; tier: number; salary: number; titles: number; injured: number }
export interface PoliticsCareer {
  party: string;
  /** Índice do cargo atual (-1 = ainda sem cargo). */
  office: number;
  monthsLeft: number;
  approval: number;
  terms: number;
  scandals: number;
  laws: string[];
  campaign: null | { office: number; months: number; support: number; opp: number };
}
export interface SpaceCareer { stage: number; trainingLeft: number; missions: number }

export interface SpecialState {
  music: MusicCareer | null;
  acting: ActingCareer | null;
  sport: SportCareer | null;
  politics: PoliticsCareer | null;
  space: SpaceCareer | null;
}

export interface LifeState {
  /** Oculto: boas ações reduzem eventos ruins; más ações pioram a sorte. De -100 a 100. */
  karma: number;
  /** Oculto: chance de conseguir ter filhos. */
  fertility: number;
  talent: string | null;
  /** Recurso premium: editar qualquer pessoa. */
  premium: boolean;
  /** Contadores usados nas fitas de fim de vida (crimes, traições, cirurgias...). */
  counters: Record<string, number>;
  licenses: Record<string, boolean>;
  health: HealthState;
  crime: CrimeState;
  special: SpecialState;
  pets: Pet[];
  travel: TravelState;
}

export interface MinigameState {
  id: string;
  /** Ação que abriu o minigame; recebe o resultado ao terminar. */
  action: string;
  /** Parâmetros de dificuldade escolhidos pelo simulador. */
  level: number;
}

export interface MinigameResult {
  score: number;
  max: number;
  win: boolean;
  cancelled?: boolean;
}

export interface GameState {
  version: 1;
  country: string;
  city: string;
  birthCountry: string;
  rng: number;
  t: number;
  turn: number;
  nextId: number;
  player: Person;
  attraction: Attraction;
  money: number;
  livesWithParents: boolean;
  npcs: Record<string, NPC>;
  agenda: Agenda;
  education: Education;
  job: Job | null;
  jobOffers: JobOffer[];
  company: Company | null;
  market: MarketState;
  portfolio: Portfolio;
  shop: ShopState;
  life: LifeState;
  feed: FeedEntry[];
  pending: PendingEvent | null;
  minigame: MinigameState | null;
  lastResult: EventResult | null;
  cooldowns: Record<string, number>;
  flags: Record<string, number | boolean | string>;
  history: { t: number; money: number; felicidade: number; saude: number }[];
  interactionsLeft: number;
  ambitionsDone: string[];
  generation: number;
  lineage: LineageEntry[];
  dead: null | { cause: string; causeKey?: string; t: number; score?: number; ribbons?: string[] };
}
