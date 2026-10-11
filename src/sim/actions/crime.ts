import { addEn, t } from '../../i18n';
import { changeMoney, changeStats, clamp, formatMoney } from '../core';
import { CRIMES } from '../data/crime';
import { chance, rint, rrange } from '../rng';
import { registerAction, showResult } from '../systems/actions';
import { arrest, attemptCrime, becomeInformant, crimeFromMinigame, joinMafia, leaveMafia, promoteMafia } from '../systems/crime';
import { bump, changeKarma, queueDeath } from '../systems/lifestate';
import type { GameState } from '../types';

addEn({
  'Você é um fugitivo: a polícia está atrás de você.': 'You are a fugitive: the police are after you.',
  'Você não está preso.': 'You are not in prison.',
  'Você não está na máfia.': 'You are not in the mob.',
  'Você já está na máfia.': 'You are already in the mob.',
  'A máfia só recruta quem já tem passagem pelo crime.': 'The mob only recruits people with a criminal past.',
  'Compraram o silêncio de testemunhas e você ficou livre por ora.': 'Witnesses were bought off and you are free for now.',
  'Arma comprada no mercado negro.': 'Gun bought on the black market.',
  'A missão deu certo: você coletou {v} e ganhou respeito.': 'The mission went well: you collected {v} and earned respect.',
  'A missão deu errado e a polícia apareceu.': 'The mission went wrong and the police showed up.',
  'A guerra de gangues terminou a seu favor. Seu nome agora é respeitado.': 'The gang war ended in your favor. Your name is now respected.',
  'A guerra de gangues foi sangrenta e você levou a pior.': 'The gang war was bloody and you got the worst of it.',
  'Você se entregou à polícia.': 'You turned yourself in to the police.',
  'Você estudou na biblioteca da prisão e ganhou pontos de conduta.': 'You studied in the prison library and earned conduct points.',
  'Trabalho na lavanderia: poucas moedas, boa conduta.': 'Laundry work: a few coins, good conduct.',
  'Você entrou para um grupo da prisão: proteção em troca de favores.': 'You joined a prison group: protection in exchange for favors.',
  'O advogado conseguiu a liberdade condicional: a pena caiu pela metade.': 'The lawyer got you parole: the sentence was cut in half.',
  'O pedido foi negado. O advogado cobrou mesmo assim.': 'The request was denied. The lawyer billed you anyway.',
  'O guarda aceitou o suborno e fechou os olhos: a pena encolheu.': 'The guard took the bribe and looked away: the sentence shrank.',
  'O guarda te dedurou. Mais seis meses e muita dor de cabeça.': 'The guard snitched. Six more months and a big headache.',
  'Você escapou! Agora é um fugitivo, e a polícia vai te procurar.': 'You escaped! Now you are a fugitive, and the police will hunt you.',
  'A fuga falhou. Você passou semanas na solitária e a pena aumentou.': 'The escape failed. You spent weeks in solitary and the sentence grew.',
});

// ---------- Crimes ----------

for (const c of CRIMES) {
  registerAction({
    id: `act_crime_${c.id}`, group: 'crime', icon: c.icon, name: c.name, desc: c.desc, minAge: c.minAge, risk: c.risk, cooldown: 1,
    ...(c.minigame
      ? { minigame: c.minigame, level: (g: GameState) => 1 + Math.floor(g.life.crime.heat / 30), onMinigame: (g: GameState, r: { cancelled?: boolean; win: boolean; score: number; max: number }) => { if (!r.cancelled) crimeFromMinigame(g, c.id, r.win, r.score, r.max); } }
      : { run: (g: GameState) => attemptCrime(g, c.id) }),
    en: { name: c.en, desc: c.enDesc },
  });
}

registerAction({
  id: 'act_arma_ilegal', group: 'crime', icon: '🔫', name: 'Comprar arma no mercado negro', desc: 'Sem papéis e sem perguntas. Ajuda em crimes violentos e aumenta a atenção da polícia.',
  minAge: 18, cost: 2500, risk: 'alto', blocked: (g) => (g.life.crime.weapon ? t('Você já tem essa licença.') : null),
  run: (g) => {
    g.life.crime.weapon = true;
    g.life.crime.heat = clamp(g.life.crime.heat + 5);
    changeKarma(g, -3);
    showResult(g, { title: t('Comprar arma no mercado negro'), icon: '🔫', scene: 'perigo', text: t('Arma comprada no mercado negro.'), kind: 'bad' });
    return '';
  },
  en: { name: 'Buy a black-market gun', desc: 'No papers, no questions. Helps in violent crimes and raises police attention.' },
});

registerAction({
  id: 'act_calar', group: 'crime', icon: '🤫', name: 'Comprar o silêncio de testemunhas', desc: 'Baixa a atenção da polícia, se você tiver dinheiro e coragem.',
  minAge: 16, cost: 4000, cooldown: 3, risk: 'medio', blocked: (g) => (g.life.crime.heat < 10 ? t('Não há nada para esconder agora.') : null),
  run: (g) => {
    g.life.crime.heat = clamp(g.life.crime.heat - 35);
    changeKarma(g, -2);
    showResult(g, { title: t('Comprar o silêncio de testemunhas'), icon: '🤫', scene: 'dinheiro', text: t('Compraram o silêncio de testemunhas e você ficou livre por ora.') });
    return '';
  },
  en: { name: 'Buy witnesses’ silence', desc: 'Lowers police attention, if you have the money and the nerve.' },
});

// ---------- Máfia ----------

const noGang = (g: GameState) => (!g.life.crime.gang ? t('Você não está na máfia.') : null);

registerAction({
  id: 'act_mafia_entrar', group: 'mafia', icon: '🎩', name: 'Entrar para a máfia', desc: 'Dinheiro mensal, proteção e uma dívida que nunca acaba.',
  minAge: 18, risk: 'alto',
  blocked: (g) => (g.life.crime.gang ? t('Você já está na máfia.') : g.life.crime.record < 1 && (g.life.counters.crimes ?? 0) < 3 ? t('A máfia só recruta quem já tem passagem pelo crime.') : null),
  run: (g) => { joinMafia(g); return ''; },
  en: { name: 'Join the mob', desc: 'Monthly pay, protection and a debt that never ends.' },
});

function mission(g: GameState, name: string, icon: string, kind: 'ganho' | 'guerra'): string {
  const gang = g.life.crime.gang!;
  const rank = gang.rank + 1;
  if (kind === 'ganho') {
    if (chance(g, 0.72)) {
      const gain = Math.round(rrange(g, 800, 4000) * rank);
      changeMoney(g, gain);
      gang.loyalty = clamp(gang.loyalty + 4);
      g.life.crime.mafiaMissions += 1;
      g.life.crime.heat = clamp(g.life.crime.heat + 10);
      changeKarma(g, -5);
      bump(g, 'crimes');
      showResult(g, { title: t(name), icon, scene: 'dinheiro', text: t('A missão deu certo: você coletou {v} e ganhou respeito.', { v: formatMoney(gain) }), kind: 'bad' });
      return '';
    }
    showResult(g, { title: t(name), icon, scene: 'perigo', text: t('A missão deu errado e a polícia apareceu.'), kind: 'bad' });
    arrest(g, 'golpe');
    return '';
  }
  // guerra de gangues
  if (chance(g, 0.55 + g.player.stats.saude / 400)) {
    gang.loyalty = clamp(gang.loyalty + 12);
    g.life.crime.mafiaMissions += 2;
    g.life.crime.heat = clamp(g.life.crime.heat + 20);
    changeKarma(g, -10);
    bump(g, 'crimes');
    changeStats(g, { carisma: 2, estresse: 12 });
    showResult(g, { title: t(name), icon, scene: 'perigo', text: t('A guerra de gangues terminou a seu favor. Seu nome agora é respeitado.'), kind: 'bad' });
    return '';
  }
  changeStats(g, { saude: -rint(g, 15, 35), estresse: 15 });
  if (chance(g, 0.12)) queueDeath(g, 'tiroteio');
  showResult(g, { title: t(name), icon, scene: 'perigo', text: t('A guerra de gangues foi sangrenta e você levou a pior.'), kind: 'bad' });
  return '';
}

registerAction({ id: 'act_mafia_extorsao', group: 'mafia', icon: '💼', name: 'Cobrar proteção', desc: 'Visite os comerciantes do bairro e "garanta a segurança" deles.', minAge: 18, cooldown: 1, risk: 'medio', blocked: noGang, run: (g) => mission(g, t('Cobrar proteção'), '💼', 'ganho'), en: { name: 'Collect protection money', desc: 'Visit the neighborhood shops and “guarantee their safety”.' } });
registerAction({ id: 'act_mafia_contrabando', group: 'mafia', icon: '📦', name: 'Contrabando', desc: 'Receba e entregue cargas sem nota fiscal.', minAge: 18, cooldown: 1, risk: 'alto', blocked: noGang, run: (g) => mission(g, 'Contrabando', '📦', 'ganho'), en: { name: 'Smuggling', desc: 'Receive and deliver cargo with no invoice.' } });
registerAction({ id: 'act_mafia_guerra', group: 'mafia', icon: '💥', name: 'Guerra de gangues', desc: 'Defenda o território à força. Dá respeito, ou enterro.', minAge: 18, cooldown: 2, risk: 'alto', blocked: noGang, run: (g) => mission(g, t('Guerra de gangues'), '💥', 'guerra'), en: { name: 'Gang war', desc: 'Defend the turf by force. Earns respect, or a funeral.' } });
registerAction({ id: 'act_mafia_subir', group: 'mafia', icon: '🎖️', name: 'Pedir promoção', desc: 'Exige lealdade e missões cumpridas.', minAge: 18, cooldown: 2, risk: 'baixo', blocked: noGang, run: (g) => { const m = promoteMafia(g); if (m) showResult(g, { title: t('Pedir promoção'), icon: '🎖️', scene: 'trabalho', text: m, kind: 'event' }); return ''; }, en: { name: 'Ask for a promotion', desc: 'Requires loyalty and completed missions.' } });
registerAction({ id: 'act_mafia_sair', group: 'mafia', icon: '🚪', name: 'Tentar sair da máfia', desc: 'Nem sempre eles deixam.', minAge: 18, cooldown: 3, risk: 'alto', blocked: noGang, run: (g) => { const m = leaveMafia(g); showResult(g, { title: t('Tentar sair da máfia'), icon: '🚪', scene: 'perigo', text: m, kind: 'event' }); return ''; }, en: { name: 'Try to leave the mob', desc: 'They do not always let you.' } });
registerAction({
  id: 'act_informante', group: 'mafia', icon: '🐀', name: 'Virar informante', desc: 'A polícia protege você, mas o crime não perdoa.', minAge: 18, risk: 'alto',
  blocked: (g) => (g.life.crime.informant ? t('Você já é informante.') : g.life.crime.gang || g.life.crime.record > 0 || (g.life.counters.crimes ?? 0) > 0 ? null : t('Você não tem o que contar.')),
  run: (g) => { becomeInformant(g); showResult(g, { title: t('Virar informante'), icon: '🐀', scene: 'perigo', text: t('Você virou informante da polícia.') }); return ''; },
  en: { name: 'Become an informant', desc: 'The police protect you, but crime never forgives.' },
});

// ---------- Prisão ----------

const jailed = (g: GameState) => (g.life.crime.prison ? null : t('Você não está preso.'));

registerAction({
  id: 'act_prisao_estudar', group: 'prisao', icon: '📚', name: 'Estudar na biblioteca', desc: 'Boa conduta e uma mente mais afiada.', minAge: 0, cooldown: 1, risk: 'baixo', blocked: jailed,
  run: (g) => {
    const p = g.life.crime.prison!;
    p.conduct = clamp(p.conduct + 8);
    changeStats(g, { inteligencia: 0.8, estresse: -3 });
    showResult(g, { title: t('Estudar na biblioteca'), icon: '📚', scene: 'escola', text: t('Você estudou na biblioteca da prisão e ganhou pontos de conduta.'), kind: 'good' });
    return '';
  },
  en: { name: 'Study in the library', desc: 'Good conduct and a sharper mind.' },
});
registerAction({
  id: 'act_prisao_trabalhar', group: 'prisao', icon: '🧺', name: 'Trabalhar na prisão', desc: 'Poucas moedas e pontos de boa conduta.', minAge: 0, cooldown: 1, risk: 'baixo', blocked: jailed,
  run: (g) => {
    const p = g.life.crime.prison!;
    p.conduct = clamp(p.conduct + 6);
    changeMoney(g, 120);
    showResult(g, { title: t('Trabalhar na prisão'), icon: '🧺', scene: 'trabalho', text: t('Trabalho na lavanderia: poucas moedas, boa conduta.'), kind: 'good' });
    return '';
  },
  en: { name: 'Work in prison', desc: 'A few coins and good-conduct points.' },
});
registerAction({
  id: 'act_prisao_gangue', group: 'prisao', icon: '🤝', name: 'Entrar num grupo da prisão', desc: 'Proteção em troca de favores. A conduta piora.', minAge: 0, risk: 'medio',
  blocked: (g) => (!g.life.crime.prison ? t('Você não está preso.') : g.life.crime.prison.gang ? t('Você já está num grupo.') : null),
  run: (g) => {
    const p = g.life.crime.prison!;
    p.gang = 'grupo';
    p.conduct = clamp(p.conduct - 12);
    changeKarma(g, -3);
    showResult(g, { title: t('Entrar num grupo da prisão'), icon: '🤝', scene: 'perigo', text: t('Você entrou para um grupo da prisão: proteção em troca de favores.') });
    return '';
  },
  en: { name: 'Join a prison group', desc: 'Protection in exchange for favors. Conduct drops.' },
});
registerAction({
  id: 'act_prisao_condicional', group: 'prisao', icon: '⚖️', name: 'Pedir liberdade condicional', desc: 'Um advogado tenta reduzir sua pena. Funciona melhor com boa conduta.', minAge: 0, cost: 2000, cooldown: 6, risk: 'baixo', blocked: jailed,
  run: (g) => {
    const p = g.life.crime.prison!;
    if (chance(g, clamp(p.conduct / 150, 0.05, 0.75))) {
      p.monthsLeft = Math.max(1, Math.floor(p.monthsLeft * 0.5));
      showResult(g, { title: t('Pedir liberdade condicional'), icon: '⚖️', scene: 'trabalho', text: t('O advogado conseguiu a liberdade condicional: a pena caiu pela metade.'), kind: 'good' });
    } else showResult(g, { title: t('Pedir liberdade condicional'), icon: '⚖️', scene: 'trabalho', text: t('O pedido foi negado. O advogado cobrou mesmo assim.'), kind: 'bad' });
    return '';
  },
  en: { name: 'Request parole', desc: 'A lawyer tries to shorten your sentence. Works better with good conduct.' },
});
registerAction({
  id: 'act_prisao_suborno', group: 'prisao', icon: '💵', name: 'Subornar um guarda', desc: 'Pode encurtar a pena. Ou render mais seis meses.', minAge: 0, cost: 1500, cooldown: 6, risk: 'alto', blocked: jailed,
  run: (g) => {
    const p = g.life.crime.prison!;
    changeKarma(g, -4);
    if (chance(g, 0.4)) {
      p.monthsLeft = Math.max(1, Math.floor(p.monthsLeft * 0.7));
      showResult(g, { title: t('Subornar um guarda'), icon: '💵', scene: 'dinheiro', text: t('O guarda aceitou o suborno e fechou os olhos: a pena encolheu.'), kind: 'good' });
    } else {
      p.monthsLeft += 6;
      p.total += 6;
      p.conduct = clamp(p.conduct - 20);
      showResult(g, { title: t('Subornar um guarda'), icon: '💵', scene: 'perigo', text: t('O guarda te dedurou. Mais seis meses e muita dor de cabeça.'), kind: 'bad' });
    }
    return '';
  },
  en: { name: 'Bribe a guard', desc: 'May shorten your sentence. Or earn you six more months.' },
});
registerAction({
  id: 'act_fuga', group: 'prisao', icon: '🏃', name: 'Planejar uma fuga', desc: 'Atravesse a prisão sem ser visto. Se der certo, você vira fugitivo.', minAge: 0, cooldown: 3, risk: 'alto', minigame: 'fuga',
  level: (g) => 1 + Math.floor((g.life.crime.prison?.total ?? 0) / 120),
  blocked: jailed,
  onMinigame: (g, r) => {
    if (r.cancelled) return;
    const c = g.life.crime;
    if (r.win) {
      c.prison = null;
      c.fugitive = true;
      c.heat = 100;
      bump(g, 'escapes');
      changeKarma(g, -5);
      showResult(g, { title: t('Planejar uma fuga'), icon: '🏃', scene: 'perigo', text: t('Você escapou! Agora é um fugitivo, e a polícia vai te procurar.'), kind: 'good' });
    } else if (c.prison) {
      c.prison.monthsLeft += 12;
      c.prison.total += 12;
      c.prison.conduct = clamp(c.prison.conduct - 25);
      showResult(g, { title: t('Planejar uma fuga'), icon: '🏃', scene: 'perigo', text: t('A fuga falhou. Você passou semanas na solitária e a pena aumentou.'), kind: 'bad' });
    }
  },
  en: { name: 'Plan an escape', desc: 'Cross the prison unseen. If it works, you become a fugitive.' },
});
registerAction({
  id: 'act_entregar', group: 'prisao', icon: '🏳️', name: 'Entregar-se à polícia', desc: 'Encerra a vida de fugitivo, com uma pena menor que a da recaptura.', minAge: 0, risk: 'medio',
  blocked: (g) => (g.life.crime.fugitive ? null : t('Você não é um fugitivo.')),
  run: (g) => {
    const c = g.life.crime;
    c.fugitive = false;
    pushSurrender(g);
    return '';
  },
  en: { name: 'Turn yourself in', desc: 'Ends the fugitive life, with a lighter sentence than recapture.' },
});

import { crimeById } from '../data/crime';
import { sentenceMonths, serveSentence } from '../systems/crime';
function pushSurrender(g: GameState) {
  const def = crimeById(g.life.crime.last ?? 'furto_loja');
  serveSentence(g, Math.round(sentenceMonths(g, def) * 0.6), def.id);
  changeKarma(g, 3);
  showResult(g, { title: t('Entregar-se à polícia'), icon: '🏳️', scene: 'trabalho', text: t('Você se entregou à polícia.') });
}

