import { addEn, t } from '../../i18n';
import { ageYears, clamp, netWorth, npcsByRole } from '../core';
import type { GameState } from '../types';
import { count } from './lifestate';
import { statusScore } from './shop';
import { itemOf } from './valuation';

export interface RibbonDef {
  id: string;
  icon: string;
  name: string;
  desc: string;
  test: (g: GameState) => boolean;
}

const avgHappiness = (g: GameState) => {
  const h = g.history.filter((x) => x.t > g.player.birth + 12 * 12);
  return h.length ? h.reduce((s, x) => s + x.felicidade, 0) / h.length : g.player.stats.felicidade;
};
const cause = (g: GameState) => g.dead?.causeKey ?? '';
const peakAddiction = (g: GameState) => Math.max(0, ...Object.values(g.life.health.addictions), count(g, 'peakAddiction'));
const collection = (g: GameState) => g.shop.inventory.filter((o) => itemOf(o)?.cat === 'colecao').length;
const kids = (g: GameState) => count(g, 'kids');

/** Em ordem de prestígio: a primeira que o jogador merecer vira a "fita principal" da vida. */
export const RIBBONS: RibbonDef[] = [
  { id: 'heroi', icon: '🦸', name: 'Herói Anônimo', desc: 'Morreu salvando a vida de outra pessoa.', test: (g) => cause(g) === 'heroi' },
  { id: 'presidente', icon: '🏛️', name: 'Chefe de Estado', desc: 'Chegou ao cargo mais alto do país.', test: (g) => count(g, 'topOffice') > 0 },
  { id: 'astronauta', icon: '🚀', name: 'Fora do Planeta', desc: 'Foi ao espaço pelo menos uma vez.', test: (g) => (g.life.special.space?.missions ?? 0) > 0 },
  { id: 'bilionario', icon: '🏦', name: 'Dinheiro Sem Fim', desc: 'Morreu com uma fortuna que dá para várias vidas.', test: (g) => netWorth(g) >= 50_000_000 },
  { id: 'lenda_palco', icon: '🎸', name: 'Lenda do Palco', desc: 'Lançou discos, lotou estádios e entrou para a história da música.', test: (g) => (g.life.special.music?.albums ?? 0) >= 3 && (g.life.special.music?.fans ?? 0) >= 500_000 },
  { id: 'estatueta', icon: '🌟', name: 'Estatueta Dourada', desc: 'Ganhou um grande prêmio de atuação.', test: (g) => (g.life.special.acting?.awards ?? 0) > 0 },
  { id: 'campeao', icon: '🏆', name: 'Campeão', desc: 'Ganhou três ou mais títulos como atleta profissional.', test: (g) => (g.life.special.sport?.titles ?? 0) >= 3 },
  { id: 'poderoso', icon: '🎩', name: 'O Poderoso', desc: 'Chegou ao topo da máfia.', test: (g) => count(g, 'topMafia') > 0 },
  { id: 'rico', icon: '💰', name: 'Milionário de Verdade', desc: 'Morreu com mais de um milhão.', test: (g) => netWorth(g) >= 1_000_000 },
  { id: 'imperio', icon: '🏢', name: 'Dono do Pedaço', desc: 'Construiu um império de lojas e filiais.', test: (g) => (g.company?.branches ?? 0) >= 5 || count(g, 'ipo') > 0 },
  { id: 'serial', icon: '🩸', name: 'Sem Remorso', desc: 'Tirou cinco vidas ou mais.', test: (g) => count(g, 'kills') >= 5 },
  { id: 'assassino', icon: '🔪', name: 'Mão Pesada', desc: 'Tirou uma vida.', test: (g) => count(g, 'kills') >= 1 },
  { id: 'fuga', icon: '🏃', name: 'Mestre da Fuga', desc: 'Escapou de uma prisão.', test: (g) => count(g, 'escapes') > 0 },
  { id: 'ficha_suja', icon: '🕶️', name: 'Ficha Suja', desc: 'Acumulou três condenações ou mais.', test: (g) => g.life.crime.record >= 3 },
  { id: 'cela', icon: '⛓️', name: 'Cela Cativa', desc: 'Passou dez anos ou mais atrás das grades.', test: (g) => count(g, 'jailMonths') >= 120 },
  { id: 'ladrao', icon: '🧤', name: 'Dedos Leves', desc: 'Cometeu dez furtos ou mais.', test: (g) => count(g, 'thefts') >= 10 },
  { id: 'informante', icon: '🐀', name: 'Dedo-Duro Profissional', desc: 'Virou informante da polícia.', test: (g) => g.life.crime.informant },
  { id: 'enrolado', icon: '📰', name: 'Político Enrolado', desc: 'Acumulou escândalos na carreira política.', test: (g) => (g.life.special.politics?.scandals ?? 0) >= 2 },
  { id: 'excelencia', icon: '🎖️', name: 'Excelência', desc: 'Exerceu um cargo eletivo.', test: (g) => (g.life.special.politics?.terms ?? 0) >= 1 },
  { id: 'overdose', icon: '💊', name: 'Escravo do Vício', desc: 'Perdeu a vida para as drogas.', test: (g) => cause(g) === 'overdose' },
  { id: 'recomeco', icon: '🌱', name: 'Recomeço', desc: 'Venceu um vício e saiu da reabilitação.', test: (g) => count(g, 'rehabs') > 0 && peakAddiction(g) < 30 },
  { id: 'jogador', icon: '🎰', name: 'Jogador Compulsivo', desc: 'Perdeu uma pequena fortuna nas apostas.', test: (g) => count(g, 'gamblingLost') >= 200_000 },
  { id: 'sortudo', icon: '🍀', name: 'Sortudo', desc: 'Ganhou um prêmio enorme na sorte.', test: (g) => count(g, 'jackpots') > 0 },
  { id: 'lobo', icon: '📈', name: 'Lobo da Bolsa', desc: 'Lucrou muito comprando e vendendo ações.', test: (g) => g.portfolio.realizedTotal >= 300_000 },
  { id: 'cripto', icon: '₿', name: 'Hodl até a Morte', desc: 'Enriqueceu (ou quebrou) com criptomoedas.', test: (g) => count(g, 'cryptoTrades') >= 10 },
  { id: 'falido', icon: '📉', name: 'No Vermelho', desc: 'Morreu devendo.', test: (g) => g.money < -5000 },
  { id: 'viajante', icon: '✈️', name: 'Cidadão do Mundo', desc: 'Visitou quinze lugares diferentes.', test: (g) => g.life.travel.visited.length >= 15 },
  { id: 'imigrante', icon: '🌍', name: 'Recomeço no Exterior', desc: 'Construiu a vida em outro país.', test: (g) => !!g.flags.emigrou },
  { id: 'inquieto', icon: '💍', name: 'Coração Inquieto', desc: 'Casou três vezes ou mais.', test: (g) => count(g, 'marriages') >= 3 },
  { id: 'traidor', icon: '💔', name: 'Coração Partido dos Outros', desc: 'Traiu três vezes ou mais.', test: (g) => count(g, 'affairs') >= 3 },
  { id: 'numerosa', icon: '👨‍👩‍👧‍👦', name: 'Família Numerosa', desc: 'Teve cinco filhos ou mais.', test: (g) => kids(g) >= 5 },
  { id: 'lar', icon: '🧸', name: 'Lar Aberto', desc: 'Adotou uma criança.', test: (g) => count(g, 'adopted') > 0 },
  { id: 'dinastia', icon: '🌳', name: 'Árvore Frondosa', desc: 'Fundou uma dinastia de três gerações.', test: (g) => g.generation >= 3 },
  { id: 'retocado', icon: '💉', name: 'Retocado', desc: 'Passou por quatro cirurgias plásticas ou mais.', test: (g) => count(g, 'surgeries') >= 4 },
  { id: 'aco', icon: '💪', name: 'Corpo de Aço', desc: 'Chegou à velhice em plena forma.', test: (g) => ageYears(g) >= 70 && g.player.stats.saude >= 80 },
  { id: 'duro', icon: '🩹', name: 'Duro na Queda', desc: 'Sobreviveu a várias doenças graves.', test: (g) => count(g, 'survived') >= 3 },
  { id: 'estudioso', icon: '🎓', name: 'Eterno Estudante', desc: 'Concluiu três cursos superiores ou mais.', test: (g) => g.education.degrees.length >= 3 },
  { id: 'genio', icon: '🧠', name: 'Mente Brilhante', desc: 'Inteligência no limite.', test: (g) => g.player.stats.inteligencia >= 95 },
  { id: 'capa', icon: '✨', name: 'Capa de Revista', desc: 'Beleza de parar o trânsito.', test: (g) => g.player.stats.aparencia >= 95 },
  { id: 'alma_festa', icon: '🗣️', name: 'Alma da Festa', desc: 'Carisma nas alturas.', test: (g) => g.player.stats.carisma >= 95 },
  { id: 'estilo', icon: '👔', name: 'Estilo Impecável', desc: 'Status social altíssimo.', test: (g) => statusScore(g) >= 80 },
  { id: 'colecionador', icon: '🧸', name: 'Acumulador', desc: 'Guardou vinte colecionáveis ou mais.', test: (g) => collection(g) >= 20 },
  { id: 'bicho', icon: '🐕', name: 'Melhor Amigo do Bicho', desc: 'Cuidou de cinco bichos de estimação ou mais.', test: (g) => count(g, 'petsOwned') >= 5 },
  { id: 'filantropo', icon: '❤️', name: 'Mão Aberta', desc: 'Ajudou muita gente com doações.', test: (g) => count(g, 'donations') >= 5 },
  { id: 'alma_limpa', icon: '😇', name: 'Alma Limpa', desc: 'Viveu fazendo o bem.', test: (g) => g.life.karma >= 60 },
  { id: 'alma_pesada', icon: '😈', name: 'Alma Pesada', desc: 'Viveu fazendo o mal.', test: (g) => g.life.karma <= -60 },
  { id: 'plena', icon: '😄', name: 'Vida Plena', desc: 'Foi feliz na maior parte do caminho.', test: (g) => avgHappiness(g) >= 85 },
  { id: 'centenario', icon: '🎂', name: 'Centenário', desc: 'Passou dos cem anos.', test: (g) => ageYears(g) >= 100 },
  { id: 'nonagenario', icon: '🕰️', name: 'Nonagenário', desc: 'Passou dos noventa anos.', test: (g) => ageYears(g) >= 90 },
  { id: 'monge', icon: '🏔️', name: 'Monge Moderno', desc: 'Viveu longe de todos, sem parceiro nem filhos.', test: (g) => ageYears(g) >= 50 && !count(g, 'marriages') && kids(g) === 0 && npcsByRole(g, 'amigo', 'parceiro', 'conjuge').length === 0 },
  { id: 'cedo', icon: '🕊️', name: 'Partiu Cedo', desc: 'Foi embora antes dos trinta.', test: (g) => ageYears(g) < 30 },
  { id: 'discreta', icon: '🥱', name: 'Vida Discreta', desc: 'Sem grandes feitos, mas sem grandes tragédias.', test: () => true },
];

addEn({
  'Herói Anônimo': 'Unsung Hero', 'Morreu salvando a vida de outra pessoa.': 'Died saving another person’s life.',
  'Chefe de Estado': 'Head of State', 'Chegou ao cargo mais alto do país.': 'Reached the highest office in the country.',
  'Fora do Planeta': 'Out of This World', 'Foi ao espaço pelo menos uma vez.': 'Went to space at least once.',
  'Dinheiro Sem Fim': 'Endless Money', 'Morreu com uma fortuna que dá para várias vidas.': 'Died with a fortune that could last several lifetimes.',
  'Lenda do Palco': 'Stage Legend', 'Lançou discos, lotou estádios e entrou para a história da música.': 'Released albums, filled stadiums and made music history.',
  'Estatueta Dourada': 'Golden Statuette', 'Ganhou um grande prêmio de atuação.': 'Won a major acting award.',
  'Campeão': 'Champion', 'Ganhou três ou mais títulos como atleta profissional.': 'Won three or more titles as a pro athlete.',
  'O Poderoso': 'The Boss', 'Chegou ao topo da máfia.': 'Reached the top of the mob.',
  'Milionário de Verdade': 'Actual Millionaire', 'Morreu com mais de um milhão.': 'Died with over a million.',
  'Dono do Pedaço': 'King of the Block', 'Construiu um império de lojas e filiais.': 'Built an empire of stores and branches.',
  'Sem Remorso': 'No Remorse', 'Tirou cinco vidas ou mais.': 'Took five lives or more.',
  'Mão Pesada': 'Heavy Hand', 'Tirou uma vida.': 'Took a life.',
  'Mestre da Fuga': 'Escape Artist', 'Escapou de uma prisão.': 'Broke out of prison.',
  'Ficha Suja': 'Rap Sheet', 'Acumulou três condenações ou mais.': 'Piled up three convictions or more.',
  'Cela Cativa': 'Cell Dweller', 'Passou dez anos ou mais atrás das grades.': 'Spent ten years or more behind bars.',
  'Dedos Leves': 'Sticky Fingers', 'Cometeu dez furtos ou mais.': 'Committed ten thefts or more.',
  'Dedo-Duro Profissional': 'Professional Snitch', 'Virou informante da polícia.': 'Became a police informant.',
  'Político Enrolado': 'Tangled Politician', 'Acumulou escândalos na carreira política.': 'Piled up scandals in a political career.',
  'Excelência': 'Your Excellency', 'Exerceu um cargo eletivo.': 'Held an elected office.',
  'Escravo do Vício': 'Slave to the Habit', 'Perdeu a vida para as drogas.': 'Lost their life to drugs.',
  'Recomeço': 'Fresh Start', 'Venceu um vício e saiu da reabilitação.': 'Beat an addiction and left rehab.',
  'Jogador Compulsivo': 'Compulsive Gambler', 'Perdeu uma pequena fortuna nas apostas.': 'Lost a small fortune gambling.',
  'Sortudo': 'Lucky Charm', 'Ganhou um prêmio enorme na sorte.': 'Won a huge prize on pure luck.',
  'Lobo da Bolsa': 'Wolf of the Market', 'Lucrou muito comprando e vendendo ações.': 'Made a lot buying and selling stocks.',
  'Hodl até a Morte': 'HODL Till Death', 'Enriqueceu (ou quebrou) com criptomoedas.': 'Got rich (or broke) with crypto.',
  'No Vermelho': 'In the Red', 'Morreu devendo.': 'Died in debt.',
  'Cidadão do Mundo': 'Citizen of the World', 'Visitou quinze lugares diferentes.': 'Visited fifteen different places.',
  'Recomeço no Exterior': 'Fresh Start Abroad', 'Construiu a vida em outro país.': 'Built a life in another country.',
  'Coração Inquieto': 'Restless Heart', 'Casou três vezes ou mais.': 'Married three times or more.',
  'Coração Partido dos Outros': 'Other People’s Heartbreaker', 'Traiu três vezes ou mais.': 'Cheated three times or more.',
  'Família Numerosa': 'Big Family', 'Teve cinco filhos ou mais.': 'Had five children or more.',
  'Lar Aberto': 'Open Home', 'Adotou uma criança.': 'Adopted a child.',
  'Árvore Frondosa': 'Mighty Family Tree', 'Fundou uma dinastia de três gerações.': 'Founded a three-generation dynasty.',
  'Retocado': 'Touched Up', 'Passou por quatro cirurgias plásticas ou mais.': 'Had four plastic surgeries or more.',
  'Corpo de Aço': 'Body of Steel', 'Chegou à velhice em plena forma.': 'Reached old age in top shape.',
  'Duro na Queda': 'Tough as Nails', 'Sobreviveu a várias doenças graves.': 'Survived several serious illnesses.',
  'Eterno Estudante': 'Eternal Student', 'Concluiu três cursos superiores ou mais.': 'Finished three college degrees or more.',
  'Mente Brilhante': 'Brilliant Mind', 'Inteligência no limite.': 'Intelligence off the charts.',
  'Capa de Revista': 'Cover Star', 'Beleza de parar o trânsito.': 'Looks that stop traffic.',
  'Alma da Festa': 'Life of the Party', 'Carisma nas alturas.': 'Sky-high charisma.',
  'Estilo Impecável': 'Impeccable Style', 'Status social altíssimo.': 'Sky-high social status.',
  'Acumulador': 'Hoarder', 'Guardou vinte colecionáveis ou mais.': 'Kept twenty collectibles or more.',
  'Melhor Amigo do Bicho': 'Animal’s Best Friend', 'Cuidou de cinco bichos de estimação ou mais.': 'Took care of five pets or more.',
  'Mão Aberta': 'Open Hand', 'Ajudou muita gente com doações.': 'Helped lots of people with donations.',
  'Alma Limpa': 'Pure Soul', 'Viveu fazendo o bem.': 'Lived doing good.',
  'Alma Pesada': 'Heavy Soul', 'Viveu fazendo o mal.': 'Lived doing evil.',
  'Vida Plena': 'Full Life', 'Foi feliz na maior parte do caminho.': 'Was happy for most of the way.',
  'Centenário': 'Centenarian', 'Passou dos cem anos.': 'Lived past one hundred.',
  'Nonagenário': 'Nonagenarian', 'Passou dos noventa anos.': 'Lived past ninety.',
  'Monge Moderno': 'Modern Monk', 'Viveu longe de todos, sem parceiro nem filhos.': 'Lived apart from everyone, with no partner or children.',
  'Partiu Cedo': 'Gone Too Soon', 'Foi embora antes dos trinta.': 'Left before thirty.',
  'Vida Discreta': 'Quiet Life', 'Sem grandes feitos, mas sem grandes tragédias.': 'No great feats, but no great tragedies.',
});

export function earnedRibbons(g: GameState): RibbonDef[] {
  return RIBBONS.filter((r) => r.test(g));
}

export interface ScoreTier {
  min: number;
  name: string;
  en: string;
}

export const TIERS: ScoreTier[] = [
  { min: 0, name: 'Vida Apagada', en: 'Faded Life' },
  { min: 200, name: 'Vida Comum', en: 'Ordinary Life' },
  { min: 350, name: 'Vida Boa', en: 'Good Life' },
  { min: 500, name: 'Vida Notável', en: 'Notable Life' },
  { min: 650, name: 'Vida Extraordinária', en: 'Extraordinary Life' },
  { min: 800, name: 'Vida de Lenda', en: 'Legendary Life' },
];
addEn(Object.fromEntries(TIERS.map((x) => [x.name, x.en])));

/** Pontuação da vida (0 a ~1000): longevidade, riqueza, felicidade, conquistas, família e caráter. */
export function lifeScore(g: GameState): { total: number; parts: { label: string; pts: number }[] } {
  const age = Math.min(100, ageYears(g));
  const worth = netWorth(g);
  const wealth = clamp(Math.log10(Math.max(1, worth)) - 2, 0, 5) * 40;
  const family = Math.min(100, npcsByRole(g, 'filho').length * 10 + (count(g, 'marriages') ? 20 : 0) + count(g, 'adopted') * 10);
  const parts = [
    { label: 'Longevidade', pts: age * 3 },
    { label: 'Riqueza', pts: wealth },
    { label: 'Felicidade', pts: Math.round(avgHappiness(g) * 1.5) },
    { label: 'Conquistas', pts: Math.min(240, g.ambitionsDone.length * 12) },
    { label: t('Família'), pts: family },
    { label: t('Caráter'), pts: Math.round(g.life.karma * 0.5) },
    { label: t('Crimes e prisão'), pts: -(count(g, 'crimes') * 4 + count(g, 'jailMonths')) },
  ].map((p) => ({ ...p, pts: Math.round(p.pts) }));
  return { total: Math.max(0, parts.reduce((s, p) => s + p.pts, 0)), parts };
}

export const tierOf = (score: number) => [...TIERS].reverse().find((x) => score >= x.min)!;

export const ribbonById = (id: string) => RIBBONS.find((r) => r.id === id);
