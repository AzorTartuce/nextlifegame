import { addEn, t } from '../../i18n';
import { ageYears, changeMoney, changeStats, clamp, formatMoney, pushFeed } from '../core';
import { HEAD_TITLE, LAWS, OFFICES, lawById, partyById, type OfficeDef } from '../data/politics';
import { rint, rnd, rrange } from '../rng';
import type { Deltas, GameState, PoliticsCareer } from '../types';
import { showResult } from './actions';
import { arrest } from './crime';
import { bump, changeKarma, luck } from './lifestate';
import { statusScore } from './shop';

addEn({
  'Você se filiou: {p}.': 'You joined: {p}.',
  'Campanha de {o} lançada: seis meses até a eleição.': 'Campaign for {o} launched: six months until the election.',
  'Eleição para {o}': 'Election for {o}',
  'Você foi eleito {o} com {v}% dos votos!': 'You were elected {o} with {v}% of the votes!',
  'Você perdeu a eleição para {o}, com {v}% dos votos.': 'You lost the election for {o}, with {v}% of the votes.',
  'Seu mandato de {o} terminou.': 'Your term as {o} has ended.',
  'Sofreu impeachment: a aprovação ficou baixa demais.': 'You were impeached: approval fell too low.',
  'Você renunciou ao cargo de {o}.': 'You resigned as {o}.',
  'Lei aprovada: {l}.': 'Law passed: {l}.',
  'O suborno rendeu {v}, e ninguém soube.': 'The bribe paid {v}, and nobody knew.',
  'O suborno virou escândalo na imprensa.': 'The bribe became a press scandal.',
  'Sua carreira política acabou em escândalo e investigação.': 'Your political career ended in scandal and investigation.',
  'O discurso foi bem recebido e a aprovação subiu.': 'The speech was well received and approval went up.',
  'Comício lotado: o apoio cresceu.': 'Packed rally: support grew.',
  'A propaganda na TV colou: o apoio subiu bastante.': 'The TV ads stuck: support rose a lot.',
  'Você foi bem no debate e roubou a cena.': 'You did well in the debate and stole the show.',
  'Você tropeçou no debate e virou meme.': 'You stumbled in the debate and became a meme.',
  'O ataque ao adversário funcionou, e você ganhou terreno.': 'The attack on your opponent worked, and you gained ground.',
  'O ataque virou escândalo: você perdeu apoio.': 'The attack turned into a scandal: you lost support.',
  'Filie-se a um partido primeiro.': 'Join a party first.',
  'Você já é filiado a um partido.': 'You are already in a party.',
  'Já há uma campanha em andamento.': 'A campaign is already under way.',
  'Não há campanha em andamento.': 'There is no campaign under way.',
  'Você não tem um cargo.': 'You do not hold office.',
  'Só dá para disputar o cargo seguinte ou a reeleição (nos últimos 8 meses).': 'You can only run for the next office, or re-election (in the last 8 months).',
  'Ficha limpa é exigida.': 'A clean record is required.',
});

export const headTitle = (g: GameState) => {
  const [pt] = HEAD_TITLE[g.country] ?? [t('Chefe de governo')];
  return pt;
};

/** Nome do cargo no país do jogador (o topo muda: Presidente, Primeiro-ministro, Chanceler). */
export const officeName = (g: GameState, level: number) => (level === OFFICES.length - 1 ? headTitle(g) : OFFICES[level].name);

export const politicsOf = (g: GameState) => g.life.special.politics;

export function baseSupport(g: GameState, p: PoliticsCareer, level: number): number {
  const s = g.player.stats;
  const sp = g.life.special;
  const party = partyById(p.party);
  const mood = (g.flags.polMood as number) ?? 0;
  let b = 12 + s.carisma * 0.22 + s.inteligencia * 0.08 + statusScore(g) * 0.12;
  b += (sp.acting?.fame ?? 0) * 0.12 + Math.min(10, Math.log10(1 + (sp.music?.fans ?? 0)) * 2);
  b += 12 * (1 - Math.abs(mood - party.lean)) - 6;
  if (p.office === level && p.office >= 0) b += p.approval * 0.2 - 8;
  b -= p.scandals * 7;
  b -= g.life.crime.record * 30;
  b += g.life.karma * 0.08;
  return clamp(b, 5, 90);
}

export function joinParty(g: GameState, partyId: string) {
  const prev = g.life.special.politics;
  g.life.special.politics = prev ?? { party: partyId, office: -1, monthsLeft: 0, approval: 50, terms: 0, scandals: 0, laws: [], campaign: null };
  g.life.special.politics.party = partyId;
  pushFeed(g, '🗳️', t('Você se filiou: {p}.', { p: t(partyById(partyId).name) }), 'info');
}

export function canRun(g: GameState, level: number): string | null {
  const p = politicsOf(g);
  const o = OFFICES[level];
  if (!p) return t('Filie-se a um partido primeiro.');
  if (p.campaign) return t('Já há uma campanha em andamento.');
  if (g.life.crime.record > 0) return t('Ficha limpa é exigida.');
  if (ageYears(g) < o.minAge) return t('A partir de {n} anos.', { n: o.minAge });
  const next = p.office + 1;
  if (level !== next && !(level === p.office && p.monthsLeft <= 8)) return t('Só dá para disputar o cargo seguinte ou a reeleição (nos últimos 8 meses).');
  return null;
}

export function startCampaign(g: GameState, level: number): string {
  const err = canRun(g, level);
  if (err) return err;
  const p = politicsOf(g)!;
  const o: OfficeDef = OFFICES[level];
  p.campaign = { office: level, months: 6, support: baseSupport(g, p, level), opp: rrange(g, o.opp - 6, o.opp + 8) };
  const msg = t('Campanha de {o} lançada: seis meses até a eleição.', { o: t(officeName(g, level)) });
  pushFeed(g, o.icon, msg, 'info');
  return msg;
}

function leaveOffice(p: PoliticsCareer) {
  p.office = -1;
  p.laws = [];
  p.monthsLeft = 0;
}

function election(g: GameState, p: PoliticsCareer) {
  const c = p.campaign!;
  p.campaign = null;
  const o = OFFICES[c.office];
  const margin = c.support - c.opp + rrange(g, -7, 7);
  const votes = Math.round(clamp(50 + margin * 0.9, 30, 78));
  const name = t(officeName(g, c.office));
  if (margin > 0) {
    p.office = c.office;
    p.monthsLeft = o.term;
    p.terms += 1;
    p.approval = c.office === p.office && p.terms > 1 ? Math.max(p.approval, 55) : 60;
    if (c.office === OFFICES.length - 1) bump(g, 'topOffice');
    if (c.office === 0 && p.terms === 1) p.laws = [];
    showResult(g, { title: t('Eleição para {o}', { o: name }), icon: '🗳️', scene: 'festa', text: t('Você foi eleito {o} com {v}% dos votos!', { o: name, v: votes }), deltas: {}, kind: 'good' });
    changeStats(g, { felicidade: 12, carisma: 1 });
  } else {
    showResult(g, { title: t('Eleição para {o}', { o: name }), icon: '🗳️', scene: 'perigo', text: t('Você perdeu a eleição para {o}, com {v}% dos votos.', { o: name, v: votes }), deltas: {}, kind: 'bad' });
    changeStats(g, { felicidade: -8, estresse: 6 });
  }
}

/** Efeito de cada ação de campanha sobre o apoio. */
export function boostSupport(g: GameState, amount: number): boolean {
  const p = politicsOf(g);
  if (!p?.campaign) return false;
  p.campaign.support = clamp(p.campaign.support + amount, 0, 100);
  return true;
}

export function enactLaw(g: GameState, id: string): string {
  const p = politicsOf(g);
  if (!p || p.office < 0) return t('Você não tem um cargo.');
  const law = lawById(id);
  if (law.against) p.laws = p.laws.filter((x) => x !== law.against);
  p.laws = [...p.laws.filter((x) => x !== id), id].slice(-4);
  p.approval = clamp(p.approval + (law.approval > 0 ? 2 : -3));
  return t('Lei aprovada: {l}.', { l: t(law.name) });
}

export function giveSpeech(g: GameState): string {
  const p = politicsOf(g)!;
  p.approval = clamp(p.approval + 3 + g.player.stats.carisma / 40);
  return t('O discurso foi bem recebido e a aprovação subiu.');
}

export function impeach(g: GameState, why: 'aprovacao' | 'escandalo') {
  const p = politicsOf(g)!;
  p.scandals += 1;
  leaveOffice(p);
  changeStats(g, { felicidade: -15, estresse: 12 });
  pushFeed(g, '📰', why === 'aprovacao' ? t('Sofreu impeachment: a aprovação ficou baixa demais.') : t('Sua carreira política acabou em escândalo e investigação.'), 'bad');
  if (why === 'escandalo') arrest(g, 'golpe', 'investigacao');
}

export function acceptBribe(g: GameState): string {
  const p = politicsOf(g)!;
  const gain = rint(g, 5000, 40000) * (p.office + 1);
  changeMoney(g, gain);
  changeKarma(g, -8);
  bump(g, 'crimes');
  if (rnd(g) < 0.22 / luck(g)) {
    p.scandals += 1;
    p.approval = clamp(p.approval - 20);
    if (p.scandals >= 3) {
      impeach(g, 'escandalo');
      return '';
    }
    return t('O suborno virou escândalo na imprensa.');
  }
  return t('O suborno rendeu {v}, e ninguém soube.', { v: formatMoney(gain) });
}

export function resign(g: GameState): string {
  const p = politicsOf(g)!;
  const name = t(officeName(g, p.office));
  leaveOffice(p);
  const msg = t('Você renunciou ao cargo de {o}.', { o: name });
  pushFeed(g, '🚪', msg, 'info');
  return msg;
}

export function politicsHours(g: GameState): number {
  const p = politicsOf(g);
  if (!p) return 0;
  return p.office >= 0 ? 25 : p.campaign ? 20 : 0;
}

export function politicsTick(g: GameState, acc: Deltas) {
  if (g.t % 24 === 0) g.flags.polMood = Math.round((rnd(g) * 2 - 1) * 100) / 100;
  const p = politicsOf(g);
  if (!p) return;
  const c = p.campaign;
  if (c) {
    c.months -= 1;
    c.support = clamp(c.support + (baseSupport(g, p, c.office) - c.support) * 0.06 + rrange(g, -1.5, 1.5));
    if (c.months <= 0) election(g, p);
  }
  if (p.office >= 0) {
    const o = OFFICES[p.office];
    changeMoney(g, o.pay, acc);
    const regime = g.market.regime.effect * 400;
    const target = 50 + p.laws.reduce((s, id) => s + (lawById(id)?.approval ?? 0), 0) + regime - p.scandals * 4;
    p.approval = clamp(p.approval + (target - p.approval) * 0.1 + rrange(g, -2, 2));
    p.monthsLeft -= 1;
    if (p.approval < 15) impeach(g, 'aprovacao');
    else if (p.monthsLeft <= 0 && !(p.campaign && p.campaign.months > 0 && p.campaign.office === p.office)) {
      pushFeed(g, o.icon, t('Seu mandato de {o} terminou.', { o: t(officeName(g, p.office)) }), 'info');
      leaveOffice(p);
    }
  }
}

export const LAW_IDS = LAWS.map((l) => l.id);
