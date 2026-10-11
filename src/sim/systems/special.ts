import { addEn, fmtNum, t } from '../../i18n';
import { ageYears, changeMoney, changeStats, clamp, formatMoney, pushFeed } from '../core';
import { chance, pick, rint, rrange } from '../rng';
import type { Deltas, GameState } from '../types';
import { addAddiction } from './health';
import { bump, queueDeath } from './lifestate';
import { politicsHours, politicsTick } from './politics';

addEn({
  'Você ainda não começou essa carreira.': 'You have not started this career yet.',
  'Você já começou essa carreira.': 'You already started this career.',
  'Seu estado de saúde impede isso agora.': 'Your health prevents that right now.',
});

// ======================= Música =======================

export const INSTRUMENTS = [
  { id: 'violao', name: 'Violão', en: 'Guitar' }, { id: 'teclado', name: 'Teclado', en: 'Keyboard' }, { id: 'bateria', name: 'Bateria', en: 'Drums' },
  { id: 'baixo', name: 'Baixo', en: 'Bass' }, { id: 'voz', name: 'Canto', en: 'Singing' },
];
const BANDS = ['Os Cometas', 'Noite Azul', 'Vento Sul', 'Caos Criativo', 'Maré Alta', 'Fio de Prata', 'Rádio Fantasma'];
addEn({ ...Object.fromEntries(INSTRUMENTS.map((i) => [i.name, i.en])) });

export const music = (g: GameState) => g.life.special.music;

export function startMusic(g: GameState, instrument: string) {
  g.life.special.music = { instrument, skill: 6, band: null, albums: 0, fans: 0, label: false, lastAlbum: -99 };
}

export function practiceMusic(g: GameState): string {
  const m = music(g)!;
  m.skill = clamp(m.skill + rrange(g, 2, 4) * (1 - m.skill / 130));
  changeStats(g, { felicidade: 2, estresse: -3 });
  return t('Horas de ensaio: seus dedos (ou sua voz) agradecem.');
}

export function gig(g: GameState): string {
  const m = music(g)!;
  if (chance(g, 0.85)) {
    const pay = Math.round(100 + m.fans * 0.002 + m.skill * 3);
    changeMoney(g, pay);
    m.fans += Math.round(15 + m.skill / 3);
    changeStats(g, { felicidade: 4, carisma: 0.5 });
    return t('A casa estava cheia e o público cantou junto. Cachê de {v}.', { v: formatMoney(pay) });
  }
  changeStats(g, { felicidade: -3 });
  return t('Som quebrado e público disperso. Noite para esquecer.');
}

export function releaseAlbum(g: GameState): string {
  const m = music(g)!;
  const p = clamp(0.25 + m.skill / 150 + (m.band ? 0.1 : 0) + (m.label ? 0.15 : 0), 0.1, 0.85);
  m.lastAlbum = g.t;
  if (chance(g, p)) {
    m.albums += 1;
    m.fans = Math.round((m.fans + 200) * rrange(g, 1.4, 3.5));
    const adv = Math.round(m.fans * 0.05);
    changeMoney(g, adv);
    changeStats(g, { felicidade: 12, carisma: 2 });
    return t('O álbum estourou! Os fãs agora são {n} e os direitos autorais rendem {v}.', { n: fmtNum(m.fans), v: formatMoney(adv) });
  }
  m.fans = Math.round(m.fans * 0.9);
  changeStats(g, { felicidade: -6, estresse: 6 });
  return t('O álbum passou despercebido. A crítica foi dura.');
}

export function tour(g: GameState): string {
  const m = music(g)!;
  const revenue = Math.round(m.fans * 0.25 * (0.5 + m.skill / 100) * (m.label ? 1.4 : 1));
  changeMoney(g, revenue);
  changeStats(g, { estresse: 18, saude: -4, felicidade: 6 });
  m.fans = Math.round(m.fans * 1.15);
  if (chance(g, 0.15)) addAddiction(g, chance(g, 0.4) ? 'drogas' : 'alcool', 10);
  return t('A turnê passou por dezenas de cidades e rendeu {v}. O corpo sentiu.', { v: formatMoney(revenue) });
}

export const bandName = (g: GameState) => pick(g, BANDS);

function musicTick(g: GameState, acc: Deltas) {
  const m = music(g);
  if (!m) return;
  const roy = m.fans * 0.004 * (1 + m.albums * 0.3) * (m.label ? 1.5 : 1);
  if (roy > 0) changeMoney(g, Math.round(roy), acc);
  m.fans = Math.round(m.fans * 0.992);
}

// ======================= Atuação =======================

export const acting = (g: GameState) => g.life.special.acting;

export function audition(g: GameState): string {
  const a = acting(g)!;
  const p = clamp(0.2 + a.skill / 150 + g.player.stats.aparencia / 400 + (a.agent ? 0.15 : 0) + a.fame / 300, 0.08, 0.85);
  if (!chance(g, p)) {
    changeStats(g, { felicidade: -3 });
    return t('Você não passou no teste. "Entraremos em contato", disseram.');
  }
  const tier = a.fame < 20 ? 0 : a.fame < 60 ? 1 : 2;
  const pay = Math.round([1200, 7000, 45000][tier] * (1 + a.fame / 80));
  changeMoney(g, pay);
  a.roles += 1;
  a.lastRole = g.t;
  a.fame = clamp(a.fame + [4, 10, 18][tier]);
  bump(g, 'roles');
  changeStats(g, { felicidade: 8, carisma: 1 });
  const role = [t('figurante'), t('coadjuvante'), t('protagonista')][tier];
  let extra = '';
  if (tier === 2 && chance(g, 0.15 + a.skill / 400)) {
    a.awards += 1;
    a.fame = clamp(a.fame + 25);
    extra = ' ' + t('E você ainda levou um grande prêmio de atuação!');
  }
  return t('Você foi escalado como {r} e recebeu {v}.', { r: role, v: formatMoney(pay) }) + extra;
}

function actingTick(g: GameState) {
  const a = acting(g);
  if (a) a.fame = clamp(a.fame - 0.8);
}

// ======================= Esporte =======================

export const SPORTS = [
  { id: 'futebol', name: 'Futebol', en: 'Soccer' }, { id: 'basquete', name: 'Basquete', en: 'Basketball' }, { id: 'tenis', name: 'Tênis', en: 'Tennis' },
  { id: 'natacao', name: 'Natação', en: 'Swimming' }, { id: 'mma', name: 'Artes marciais mistas', en: 'Mixed martial arts' },
];
addEn({ ...Object.fromEntries(SPORTS.map((s) => [s.name, s.en])) });
export const TEAMS = ['Atlético do Porto', 'Sport Club Norte', 'Estrela Dourada', 'União Capital', 'Real Esperança', 'Furacão FC', 'Leões do Sul'];
export const TIER_NAMES = ['Clube regional', 'Liga nacional', 'Elite do país', 'Estrela internacional'];
export const TIER_PAY = [4000, 14000, 45000, 150000];
export const TIER_SKILL = [45, 60, 75, 88];
addEn({ 'Clube regional': 'Regional club', 'Liga nacional': 'National league', 'Elite do país': 'Top of the country', 'Estrela internacional': 'International star' });

export const sport = (g: GameState) => g.life.special.sport;

export function trainSport(g: GameState): string {
  const s = sport(g)!;
  if (s.injured > 0) return t('Você está machucado: descanse antes de treinar.');
  s.skill = clamp(s.skill + rrange(g, 1.5, 3.5) * (g.player.stats.saude / 100) * (1 - s.skill / 140));
  changeStats(g, { saude: 1, estresse: -2, felicidade: 1 });
  if (chance(g, 0.03)) {
    s.injured = rint(g, 2, 6);
    return t('Você se machucou no treino e ficará {n} meses afastado.', { n: s.injured });
  }
  return t('Treino puxado, mas você sente a evolução.');
}

export function tryout(g: GameState): string {
  const s = sport(g)!;
  const p = clamp((s.skill - 30) / 60 + g.player.stats.saude / 400, 0.05, 0.85);
  if (!chance(g, p)) return t('Você não passou na peneira. Continue treinando.');
  s.team = pick(g, TEAMS);
  s.tier = 0;
  s.salary = TIER_PAY[0];
  return t('Aprovado na peneira! Você assinou com o {tm}.', { tm: s.team });
}

export function transfer(g: GameState): string {
  const s = sport(g)!;
  const next = s.tier + 1;
  if (next >= TIER_PAY.length) return t('Você já está no topo do esporte.');
  if (s.skill < TIER_SKILL[next]) return t('Você ainda não tem nível para esse salto.');
  s.tier = next;
  s.team = pick(g, TEAMS);
  s.salary = TIER_PAY[next];
  return t('Você foi contratado pelo {tm}: {c}.', { tm: s.team, c: t(TIER_NAMES[next]) });
}

export function playMatch(g: GameState): string {
  const s = sport(g)!;
  if (s.injured > 0) return t('Você está machucado e não pode jogar.');
  const win = chance(g, clamp(0.35 + s.skill / 200 + s.tier * 0.02, 0.2, 0.85));
  let extra = '';
  if (win && s.tier >= 2 && chance(g, 0.08)) {
    s.titles += 1;
    extra = ' ' + t('E o seu time levantou a taça: um título!');
  }
  if (win) changeMoney(g, Math.round(s.salary * 0.15));
  changeStats(g, { felicidade: win ? 5 : -2, estresse: 3 });
  return (win ? t('Vitória em campo! Prêmio de partida: {v}.', { v: formatMoney(Math.round(s.salary * 0.15)) }) : t('Derrota amarga hoje, mas há revanche.')) + extra;
}

function sportTick(g: GameState, acc: Deltas) {
  const s = sport(g);
  if (!s) return;
  if (s.injured > 0) s.injured -= 1;
  if (s.team && s.injured === 0) changeMoney(g, s.salary, acc);
  if (ageYears(g) > 33) s.skill = clamp(s.skill - 0.35);
  if (s.team && chance(g, 0.01)) {
    s.injured = rint(g, 3, 9);
    pushFeed(g, '🩼', t('Lesão grave: você ficará {n} meses fora.', { n: s.injured }), 'bad');
  }
  if (s.team && s.tier >= 2 && chance(g, (s.skill / 100) * 0.015)) {
    s.titles += 1;
    pushFeed(g, '🏆', t('Seu time conquistou o campeonato! São {n} título(s) na carreira.', { n: s.titles }), 'milestone');
  }
}

// ======================= Espaço =======================

export const space = (g: GameState) => g.life.special.space;

export function applySpace(g: GameState): string {
  const p = clamp(0.04 + g.player.stats.inteligencia / 800 + g.player.stats.saude / 1000, 0.03, 0.3);
  if (!chance(g, p)) return t('A agência espacial recusou a candidatura. Milhares disputam poucas vagas.');
  g.life.special.space = { stage: 1, trainingLeft: 24, missions: 0 };
  return t('Aprovado! Você começou o treinamento de astronauta: 24 meses de provas extremas.');
}

export function launch(g: GameState): string {
  const s = space(g)!;
  const n = s.missions;
  const dest = [t('a Estação Espacial'), t('a Lua'), t('a Lua'), t('Marte')][Math.min(3, n)];
  const risk = 0.02 + n * 0.015;
  if (chance(g, risk)) {
    queueDeath(g, 'espaco');
    return t('Algo deu errado no lançamento rumo a {d}.', { d: dest });
  }
  s.missions += 1;
  bump(g, 'spaceMissions');
  const bonus = 50000 * (n + 1);
  changeMoney(g, bonus);
  changeStats(g, { felicidade: 20, carisma: 3, estresse: 10 });
  return t('Missão cumprida rumo a {d}! Você voltou herói e recebeu {v}.', { d: dest, v: formatMoney(bonus) });
}

function spaceTick(g: GameState, acc: Deltas) {
  const s = space(g);
  if (!s) return;
  changeMoney(g, s.stage === 1 ? 6000 : 14000, acc);
  if (s.stage === 1) {
    s.trainingLeft -= 1;
    if ((g.player.stats.saude < 55 || g.player.stats.estresse > 80) && chance(g, 0.04)) {
      g.life.special.space = null;
      pushFeed(g, '🚀', t('Você foi desligado do programa espacial: a saúde não aguentou o treinamento.'), 'bad');
      return;
    }
    if (s.trainingLeft <= 0) {
      s.stage = 2;
      pushFeed(g, '🧑‍🚀', t('Você completou o treinamento e agora é astronauta oficial!'), 'milestone');
    }
  }
}

// ======================= Soma =======================

export function specialHours(g: GameState): number {
  const sp = g.life.special;
  let h = politicsHours(g);
  if (sp.music?.band) h += 10;
  if (sp.acting && g.t - sp.acting.lastRole < 3) h += 25;
  if (sp.sport?.team) h += 35;
  if (sp.space) h += sp.space.stage === 1 ? 40 : 20;
  return h;
}

export function specialTick(g: GameState, acc: Deltas) {
  politicsTick(g, acc);
  musicTick(g, acc);
  actingTick(g);
  sportTick(g, acc);
  spaceTick(g, acc);
}

addEn({
  'Horas de ensaio: seus dedos (ou sua voz) agradecem.': 'Hours of rehearsal: your fingers (or your voice) say thanks.',
  'A casa estava cheia e o público cantou junto. Cachê de {v}.': 'The house was full and the crowd sang along. Fee: {v}.',
  'Som quebrado e público disperso. Noite para esquecer.': 'Broken sound system and a scattered crowd. A night to forget.',
  'O álbum estourou! Os fãs agora são {n} e os direitos autorais rendem {v}.': 'The album blew up! Fans now number {n} and royalties pay {v}.',
  'O álbum passou despercebido. A crítica foi dura.': 'The album went unnoticed. Critics were harsh.',
  'A turnê passou por dezenas de cidades e rendeu {v}. O corpo sentiu.': 'The tour hit dozens of cities and earned {v}. Your body felt it.',
  'Você não passou no teste. "Entraremos em contato", disseram.': 'You did not pass the audition. “We will be in touch,” they said.',
  'figurante': 'extra', 'coadjuvante': 'supporting actor', 'protagonista': 'lead',
  'Você foi escalado como {r} e recebeu {v}.': 'You were cast as {r} and received {v}.',
  'E você ainda levou um grande prêmio de atuação!': 'And you even won a major acting award!',
  'Você está machucado: descanse antes de treinar.': 'You are injured: rest before training.',
  'Você se machucou no treino e ficará {n} meses afastado.': 'You got hurt in training and will be out for {n} months.',
  'Treino puxado, mas você sente a evolução.': 'A tough workout, but you feel the progress.',
  'Você não passou na peneira. Continue treinando.': 'You did not make the tryout. Keep training.',
  'Aprovado na peneira! Você assinou com o {tm}.': 'You made the tryout! You signed with {tm}.',
  'Você já está no topo do esporte.': 'You are already at the top of the sport.',
  'Você ainda não tem nível para esse salto.': 'You are not good enough for that jump yet.',
  'Você foi contratado pelo {tm}: {c}.': 'You were signed by {tm}: {c}.',
  'Você está machucado e não pode jogar.': 'You are injured and cannot play.',
  'E o seu time levantou a taça: um título!': 'And your team lifted the trophy: a title!',
  'Vitória em campo! Prêmio de partida: {v}.': 'Victory on the field! Match bonus: {v}.',
  'Derrota amarga hoje, mas há revanche.': 'A bitter loss today, but there is a rematch.',
  'Lesão grave: você ficará {n} meses fora.': 'Serious injury: you will be out for {n} months.',
  'Seu time conquistou o campeonato! São {n} título(s) na carreira.': 'Your team won the championship! That is {n} title(s) in your career.',
  'A agência espacial recusou a candidatura. Milhares disputam poucas vagas.': 'The space agency turned down your application. Thousands compete for a few spots.',
  'Aprovado! Você começou o treinamento de astronauta: 24 meses de provas extremas.': 'Accepted! You started astronaut training: 24 months of extreme tests.',
  'a Estação Espacial': 'the Space Station', 'a Lua': 'the Moon', 'Marte': 'Mars',
  'Algo deu errado no lançamento rumo a {d}.': 'Something went wrong in the launch toward {d}.',
  'Missão cumprida rumo a {d}! Você voltou herói e recebeu {v}.': 'Mission accomplished toward {d}! You came back a hero and received {v}.',
  'Você foi desligado do programa espacial: a saúde não aguentou o treinamento.': 'You were dropped from the space program: your health could not take the training.',
  'Você completou o treinamento e agora é astronauta oficial!': 'You completed training and are now an official astronaut!',
  ...Object.fromEntries(TEAMS.map((x) => [x, x])),
});
