import { addEn, t } from '../../i18n';
import { ageYears, changeMoney, changeStats } from '../core';
import { registerAction, showResult, type ActionGroup } from '../systems/actions';
import {
  INSTRUMENTS, SPORTS, acting, applySpace, audition, bandName, gig, launch, music, playMatch, practiceMusic, releaseAlbum,
  space, sport, startMusic, tour, trainSport, transfer, tryout,
} from '../systems/special';
import type { Storylet } from '../storylets/engine';
import type { GameState } from '../types';

addEn({
  'Você começou a aprender {i}.': 'You started learning {i}.',
  'Você formou a banda {b}.': 'You formed the band {b}.',
  'Você assinou com uma gravadora e recebeu um adiantamento de {v}.': 'You signed with a label and got an advance of {v}.',
  'Você começou a carreira de atleta: {s}.': 'You started an athlete career: {s}.',
  'Você se aposentou do esporte.': 'You retired from sports.',
  'Aulas de atuação: você ganhou presença de palco.': 'Acting classes: you gained stage presence.',
  'Você contratou um agente: agora os testes aparecem.': 'You hired an agent: now the auditions show up.',
  'Requisitos: 25 a 50 anos, saúde 75, inteligência 80, diploma superior e ficha limpa.': 'Requirements: age 25 to 50, health 75, intelligence 80, a college degree and a clean record.',
  'Você já tem um agente.': 'You already have an agent.',
  'Você precisa de mais nível.': 'You need a higher level.',
  'Você ainda não formou uma banda.': 'You have not formed a band yet.',
  'Você precisa de 20 mil fãs.': 'You need 20,000 fans.',
  'Você já tem contrato.': 'You already have a contract.',
  'Já tem time.': 'You already have a team.',
  'Você não está em um time.': 'You are not on a team.',
  'Idade entre 10 e 35 anos e saúde razoável.': 'Age 10 to 35 and decent health.',
  'Você precisa de um álbum lançado.': 'You need a released album.',
  'Você ainda não está no programa.': 'You are not in the program yet.',
  'Você precisa completar o treinamento.': 'You must finish training first.',
});

type Run = (g: GameState) => string;

/** Atalho: ação com lógica própria e cena de resultado. */
function act(
  id: string, group: ActionGroup, icon: string, name: string, desc: string, en: { name: string; desc: string },
  opts: { minAge?: number; cost?: number; cooldown?: number; risk?: 'baixo' | 'medio' | 'alto'; blocked?: (g: GameState) => string | null; scene?: NonNullable<Storylet['scene']> },
  run: Run,
) {
  registerAction({
    id, group, icon, name, desc, ...opts,
    run: (g) => { const text = run(g); if (text) showResult(g, { title: t(name), icon, scene: opts.scene ?? 'trabalho', text }); return ''; },
    en,
  });
}

// ---------- Música ----------

const noMusic = (g: GameState) => (!music(g) ? t('Você ainda não começou essa carreira.') : null);

registerAction({
  id: 'act_mus_comecar', group: 'banda', icon: '🎸', name: 'Começar na música', desc: 'Escolha um instrumento e comece do zero.', minAge: 8, cost: 300, risk: 'baixo', scene: 'festa',
  blocked: (g) => (music(g) ? t('Você já começou essa carreira.') : null),
  choices: INSTRUMENTS.map((i) => ({ label: i.name, text: t('Os primeiros acordes saíram tortos, mas a vontade era enorme.'), effects: { stats: { felicidade: 4 }, run: (g: GameState) => { startMusic(g, i.id); } } })),
  en: { name: 'Start in music', desc: 'Pick an instrument and start from zero.', choices: INSTRUMENTS.map((i) => ({ label: i.en, text: 'The first chords came out crooked, but the drive was huge.' })) },
});
act('act_mus_praticar', 'banda', '🎹', 'Ensaiar', 'Horas de prática para evoluir.', { name: 'Rehearse', desc: 'Hours of practice to improve.' }, { minAge: 8, cooldown: 1, risk: 'baixo', blocked: noMusic, scene: 'festa' }, practiceMusic);
act('act_mus_banda', 'banda', '🥁', 'Formar uma banda', 'Reúna amigos e dê um nome ao som.', { name: 'Form a band', desc: 'Gather friends and give the sound a name.' }, {
  minAge: 12, risk: 'baixo', scene: 'festa', blocked: (g) => (!music(g) ? t('Você ainda não começou essa carreira.') : music(g)!.band ? t('Você já começou essa carreira.') : music(g)!.skill < 25 ? t('Você precisa de mais nível.') : null),
}, (g) => { const m = music(g)!; m.band = bandName(g); m.fans += 50; return t('Você formou a banda {b}.', { b: m.band }); });
act('act_mus_show', 'banda', '🎤', 'Tocar num bar', 'Cachê pequeno, fãs novos e muita estrada pela frente.', { name: 'Play at a bar', desc: 'Small fee, new fans and a long road ahead.' }, { minAge: 14, cooldown: 1, risk: 'baixo', blocked: (g) => (!music(g) ? t('Você ainda não começou essa carreira.') : music(g)!.skill < 10 ? t('Você precisa de mais nível.') : null), scene: 'festa' }, gig);
act('act_mus_album', 'banda', '💿', 'Gravar um álbum', 'Estúdio, produção e o frio na barriga do lançamento.', { name: 'Record an album', desc: 'Studio, production and the butterflies of release day.' }, { minAge: 14, cost: 8000, cooldown: 12, risk: 'medio', blocked: (g) => (!music(g) ? t('Você ainda não começou essa carreira.') : music(g)!.skill < 35 ? t('Você precisa de mais nível.') : null), scene: 'festa' }, releaseAlbum);
act('act_mus_turne', 'banda', '🚌', 'Sair em turnê', 'Estádios, estrada e exaustão. Rende muito, cobra o corpo.', { name: 'Go on tour', desc: 'Stadiums, road and exhaustion. Pays a lot, charges the body.' }, { minAge: 16, cost: 20000, cooldown: 12, risk: 'alto', blocked: (g) => (!music(g) ? t('Você ainda não começou essa carreira.') : music(g)!.albums < 1 ? t('Você precisa de um álbum lançado.') : null), scene: 'festa' }, tour);
act('act_mus_gravadora', 'banda', '📜', 'Assinar com uma gravadora', 'Adiantamento, divulgação e menos liberdade.', { name: 'Sign with a label', desc: 'Advance, promotion and less freedom.' }, {
  minAge: 16, risk: 'baixo', blocked: (g) => (!music(g) ? t('Você ainda não começou essa carreira.') : music(g)!.label ? t('Você já tem contrato.') : music(g)!.fans < 20000 ? t('Você precisa de 20 mil fãs.') : null),
}, (g) => { music(g)!.label = true; changeMoney(g, 30000); return t('Você assinou com uma gravadora e recebeu um adiantamento de {v}.', { v: '30.000' }); });

// ---------- Atuação ----------

const noActing = (g: GameState) => (!acting(g) ? t('Você ainda não começou essa carreira.') : null);

act('act_atu_aulas', 'cinema', '🎭', 'Aulas de atuação', 'Improvise, chore sob comando e perca a vergonha.', { name: 'Acting classes', desc: 'Improvise, cry on cue and lose the shyness.' }, { minAge: 12, cost: 300, cooldown: 1, risk: 'baixo', scene: 'festa' }, (g) => {
  if (!acting(g)) g.life.special.acting = { skill: 5, agent: false, roles: 0, awards: 0, fame: 0, lastRole: -99 };
  const a = acting(g)!;
  a.skill = Math.min(100, a.skill + 3 * (1 - a.skill / 140));
  changeStats(g, { carisma: 0.8, felicidade: 2 });
  return t('Aulas de atuação: você ganhou presença de palco.');
});
act('act_atu_agente', 'cinema', '🤵', 'Contratar um agente', 'Quem tem agente recebe mais testes.', { name: 'Hire an agent', desc: 'People with agents get more auditions.' }, { minAge: 14, cost: 2000, risk: 'baixo', blocked: (g) => (!acting(g) ? t('Você ainda não começou essa carreira.') : acting(g)!.agent ? t('Você já tem um agente.') : acting(g)!.skill < 15 ? t('Você precisa de mais nível.') : null) }, (g) => { acting(g)!.agent = true; return t('Você contratou um agente: agora os testes aparecem.'); });
act('act_atu_teste', 'cinema', '🎬', 'Fazer um teste de elenco', 'Dezenas de candidatos, um papel.', { name: 'Go to an audition', desc: 'Dozens of candidates, one role.' }, { minAge: 8, cooldown: 1, risk: 'medio', blocked: noActing, scene: 'festa' }, audition);

// ---------- Esporte ----------

const noSport = (g: GameState) => (!sport(g) ? t('Você ainda não começou essa carreira.') : null);

registerAction({
  id: 'act_esp_comecar', group: 'atletismo', icon: '🏅', name: 'Começar no esporte', desc: 'Escolha uma modalidade e comece a treinar para valer.', minAge: 10, risk: 'baixo', scene: 'natureza',
  blocked: (g) => (sport(g) ? t('Você já começou essa carreira.') : ageYears(g) > 35 || g.player.stats.saude < 40 ? t('Idade entre 10 e 35 anos e saúde razoável.') : null),
  choices: SPORTS.map((s) => ({ label: s.name, text: t('Primeiro treino: tudo dói, mas você voltou no dia seguinte.'), effects: { stats: { felicidade: 4, saude: 1 }, run: (g: GameState) => { g.life.special.sport = { sport: s.id, skill: 10, team: null, tier: 0, salary: 0, titles: 0, injured: 0 }; } } })),
  en: { name: 'Start in sports', desc: 'Pick a discipline and start training for real.', choices: SPORTS.map((s) => ({ label: s.en, text: 'First training: everything hurts, but you came back the next day.' })) },
});
act('act_esp_treinar', 'atletismo', '💪', 'Treinar', 'Evolua o nível e a forma física.', { name: 'Train', desc: 'Improve your level and fitness.' }, { minAge: 10, cooldown: 1, risk: 'baixo', blocked: noSport, scene: 'natureza' }, trainSport);
act('act_esp_peneira', 'atletismo', '🧢', 'Fazer uma peneira', 'Um clube olha você jogar. É a sua chance.', { name: 'Go to a tryout', desc: 'A club watches you play. This is your chance.' }, { minAge: 12, cooldown: 3, risk: 'medio', blocked: (g) => (!sport(g) ? t('Você ainda não começou essa carreira.') : sport(g)!.team ? t('Já tem time.') : sport(g)!.skill < 30 ? t('Você precisa de mais nível.') : null), scene: 'natureza' }, tryout);
act('act_esp_jogo', 'atletismo', '🏟️', 'Disputar uma partida', 'Resultado conta para o salário e para a fama.', { name: 'Play a match', desc: 'The result counts toward salary and fame.' }, { minAge: 12, cooldown: 1, risk: 'baixo', blocked: (g) => (!sport(g) ? t('Você ainda não começou essa carreira.') : !sport(g)!.team ? t('Você não está em um time.') : null), scene: 'natureza' }, playMatch);
act('act_esp_transferencia', 'atletismo', '🔁', 'Buscar uma transferência', 'Um clube maior, um salário maior.', { name: 'Seek a transfer', desc: 'A bigger club, a bigger salary.' }, { minAge: 14, cooldown: 6, risk: 'baixo', blocked: (g) => (!sport(g) ? t('Você ainda não começou essa carreira.') : !sport(g)!.team ? t('Você não está em um time.') : null), scene: 'natureza' }, transfer);
act('act_esp_aposentar', 'atletismo', '🧤', 'Aposentar-se', 'Pendura as chuteiras com a pensão dos títulos.', { name: 'Retire', desc: 'Hang up the boots with a pension from the titles.' }, { minAge: 25, risk: 'baixo', blocked: noSport }, (g) => {
  const s = sport(g)!;
  changeMoney(g, 5000 * s.titles);
  g.life.special.sport = null;
  return t('Você se aposentou do esporte.');
});

// ---------- Espaço ----------

act('act_espaco_candidatar', 'nasa', '🚀', 'Candidatar-se à agência espacial', 'Exige 25 a 50 anos, saúde 75, inteligência 80, diploma superior e ficha limpa.', { name: 'Apply to the space agency', desc: 'Requires age 25 to 50, health 75, intelligence 80, a college degree and a clean record.' }, {
  minAge: 25, cooldown: 12, risk: 'medio', scene: 'natureza',
  blocked: (g) => (space(g) ? t('Você já começou essa carreira.') : ageYears(g) > 50 || g.player.stats.saude < 75 || g.player.stats.inteligencia < 80 || !g.education.degrees.length || g.life.crime.record > 0 ? t('Requisitos: 25 a 50 anos, saúde 75, inteligência 80, diploma superior e ficha limpa.') : null),
}, applySpace);
act('act_espaco_missao', 'nasa', '🛰️', 'Embarcar numa missão', 'Estação espacial, Lua e, quem sabe, Marte. O risco é real.', { name: 'Fly a mission', desc: 'Space station, the Moon and maybe Mars. The risk is real.' }, {
  minAge: 25, cooldown: 12, risk: 'alto', scene: 'natureza',
  blocked: (g) => (!space(g) ? t('Você ainda não está no programa.') : space(g)!.stage < 2 ? t('Você precisa completar o treinamento.') : null),
}, launch);
