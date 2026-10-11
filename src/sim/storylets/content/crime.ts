import { t } from '../../../i18n';
import { changeMoney, clamp } from '../../core';
import { crimeById } from '../../data/crime';
import { addCondition } from '../../systems/health';
import { acquit, attemptCrime, serveSentence } from '../../systems/crime';
import { queueDeath } from '../../systems/lifestate';
import { role } from '../binders';
import type { GameState } from '../../types';
import type { Storylet } from '../engine';

const trial = (g: GameState) => g.life.crime.trial!;
const serve = (g: GameState, mult: number) => serveSentence(g, Math.max(1, Math.round(trial(g).months * mult)), trial(g).crime);
const pena = (months: number) => (months >= 24 ? t('{n} anos', { n: Math.round(months / 12) }) : t('{n} meses', { n: months }));
const conduct = (g: GameState, d: number) => { if (g.life.crime.prison) g.life.crime.prison.conduct = clamp(g.life.crime.prison.conduct + d); };

export const CRIME: Storylet[] = [
  {
    id: 'julgamento', title: 'Julgamento', icon: '⚖️', scene: 'perigo', manual: true,
    bind: {
      crime: (g) => t(crimeById(trial(g).crime).name),
      pena: (g) => pena(trial(g).months),
      custo: (g) => String(Math.round(3000 + trial(g).months * 250)),
      suborno: (g) => String(Math.round(8000 + trial(g).months * 500)),
    },
    text: 'Você está no tribunal, acusado de: {crime}. O promotor pede {pena} de prisão. O que você faz?',
    choices: [
      {
        label: 'Aceitar o advogado público', hint: 'Grátis',
        outcomes: [
          { chance: (g) => 0.12 + g.player.stats.inteligencia / 600, text: 'O defensor público fez milagre: faltaram provas e você foi absolvido.', effects: { run: (g) => { acquit(g); } } },
          { chance: 1, text: 'O defensor tinha quarenta processos naquela manhã. Condenado.', effects: { run: (g) => { serve(g, 1); } } },
        ],
      },
      {
        label: 'Contratar um advogado particular ({$custo})', when: (g, ctx) => g.money >= Number(ctx.custo),
        effects: { run: (g, ctx) => { changeMoney(g, -Number(ctx.custo)); } },
        outcomes: [
          { chance: (g) => 0.42 + g.player.stats.inteligencia / 500, text: 'O advogado caro desmontou o caso da acusação. Absolvido!', effects: { run: (g) => { acquit(g); } } },
          { chance: 1, text: 'Nem o melhor advogado salvou você, mas ele negociou uma pena menor.', effects: { run: (g) => { serve(g, 0.8); } } },
        ],
      },
      { label: 'Confessar e negociar a pena', text: 'Você confessou. O juiz reconheceu a colaboração e reduziu a pena.', effects: { run: (g) => { serve(g, 0.6); } } },
      {
        label: 'Subornar o juiz ({$suborno})', hint: 'Muito arriscado', when: (g, ctx) => g.money >= Number(ctx.suborno),
        effects: { karma: -8, run: (g, ctx) => { changeMoney(g, -Number(ctx.suborno)); } },
        outcomes: [
          { chance: 0.4, text: 'O envelope sumiu da mesa e o processo, do tribunal. Absolvido.', effects: { run: (g) => { acquit(g); } } },
          { chance: 1, text: 'O juiz era honesto. Agora há mais uma acusação.', effects: { run: (g) => { serve(g, 1.4); } } },
        ],
      },
    ],
    en: {
      title: 'Trial', text: 'You are in court, charged with: {crime}. The prosecutor asks for {pena} in prison. What do you do?',
      choices: [
        { label: 'Accept the public defender', hint: 'Free', outcomes: ['The public defender worked a miracle: evidence was missing and you were acquitted.', 'The defender had forty cases that morning. Convicted.'] },
        { label: 'Hire a private lawyer ({$custo})', outcomes: ['The expensive lawyer dismantled the prosecution’s case. Acquitted!', 'Not even the best lawyer could save you, but he negotiated a lighter sentence.'] },
        { label: 'Confess and negotiate', text: 'You confessed. The judge recognized your cooperation and reduced the sentence.' },
        { label: 'Bribe the judge ({$suborno})', hint: 'Very risky', outcomes: ['The envelope vanished from the desk and the case from the court. Acquitted.', 'The judge was honest. Now there is one more charge.'] },
      ],
    },
  },

  // ---------- Convites do mundo do crime ----------
  {
    id: 'convite_furto', title: 'Aposta de amigos', icon: '🛍️', scene: 'perigo', minAge: 12, maxAge: 22, cooldown: 36,
    bind: { amigo: role('amigo', 'conhecido') },
    text: '{amigo.nome} desafia: "Aposto que você não tem coragem de pegar um doce naquela loja sem pagar."',
    choices: [
      { label: 'Aceitar o desafio', effects: { run: (g) => attemptCrime(g, 'furto_loja', true) } },
      { label: 'Recusar', text: '"Prefiro ficar com meu nome limpo." {amigo.nome} zoou um pouco, mas respeitou.', effects: { karma: 1 } },
    ],
    en: { title: 'Dare from friends', text: '{amigo.nome} dares you: “Bet you do not have the guts to grab candy at that store without paying.”', choices: [{ label: 'Take the dare' }, { label: 'Decline', text: '“I would rather keep my record clean.” {amigo.nome} teased a bit, but respected it.' }] },
  },
  {
    id: 'dinheiro_facil', title: 'Dinheiro fácil', icon: '🤑', scene: 'dinheiro', minAge: 18, cooldown: 48, weight: 0.6,
    when: (g) => g.money < 1000 || (g.life.counters.crimes ?? 0) > 0,
    text: 'Um conhecido sussurra um esquema: "Meia hora de trabalho, sem risco, dinheiro na hora."',
    choices: [
      { label: 'Entrar no esquema', effects: { run: (g) => attemptCrime(g, 'golpe', true) } },
      { label: 'Dizer que não', text: 'Você foi embora antes de ouvir os detalhes. Dormiu em paz.', effects: { karma: 2 } },
    ],
    en: { title: 'Easy money', text: 'An acquaintance whispers a scheme: “Half an hour of work, no risk, cash on the spot.”', choices: [{ label: 'Join the scheme' }, { label: 'Say no', text: 'You left before hearing the details. You slept in peace.' }] },
  },

  // ---------- Vida na prisão ----------
  {
    id: 'prisao_briga', title: 'Briga no pátio', icon: '🥊', scene: 'perigo', prison: true, cooldown: 6, weight: 1.2,
    text: 'No pátio, um detento esbarra em você de propósito. O pátio inteiro está olhando.',
    choices: [
      {
        label: 'Revidar', hint: 'Saúde ajuda',
        outcomes: [
          { chance: (g) => 0.4 + g.player.stats.saude / 400 + (g.life.health.martial ? Math.floor(g.life.health.martial.belt) * 0.06 : 0), text: 'Você foi mais rápido. Ninguém mexeu com você de novo.', effects: { stats: { carisma: 1, estresse: 4 }, run: (g) => { conduct(g, -10); } } },
          { chance: 1, text: 'A briga terminou na enfermaria, e você é quem estava na maca.', effects: { stats: { saude: -15, estresse: 8 }, run: (g) => { conduct(g, -10); } } },
        ],
      },
      { label: 'Apanhar calado', text: 'Doeu, mas você evitou problemas maiores com a direção.', effects: { stats: { saude: -8, estresse: 6 }, run: (g) => { conduct(g, 2); } } },
      { label: 'Pedir proteção a um grupo', text: 'Eles aceitaram. Agora você deve favores.', effects: { karma: -2, run: (g) => { if (g.life.crime.prison) g.life.crime.prison.gang = 'grupo'; conduct(g, -8); } } },
    ],
    en: { title: 'Yard fight', text: 'In the yard, an inmate bumps into you on purpose. The whole yard is watching.', choices: [{ label: 'Fight back', hint: 'Health helps', outcomes: ['You were faster. Nobody messed with you again.', 'The fight ended in the infirmary, and you were the one on the stretcher.'] }, { label: 'Take it quietly', text: 'It hurt, but you avoided bigger trouble with the warden.' }, { label: 'Ask a group for protection', text: 'They accepted. Now you owe favors.' }] },
  },
  {
    id: 'prisao_visita', title: 'Dia de visita', icon: '💌', scene: 'casa', prison: true, cooldown: 8,
    bind: { p: role('mae', 'pai', 'conjuge', 'parceiro', 'irmao', 'amigo', 'filho') },
    text: '{p.nome} atravessou a cidade para te ver por vinte minutos através do vidro.',
    effects: { stats: { felicidade: 8, estresse: -6 }, rel: { p: 8 } },
    en: { title: 'Visiting day', text: '{p.nome} crossed the city to see you for twenty minutes through the glass.' },
  },
  {
    id: 'prisao_motim', title: 'Rebelião', icon: '🔥', scene: 'perigo', prison: true, cooldown: 24, weight: 0.4,
    text: 'Gritos nos corredores: uma rebelião começou. Os portões da ala estão abertos.',
    choices: [
      {
        label: 'Participar', hint: 'Perigoso',
        outcomes: [
          { chance: 0.1, text: 'A situação saiu do controle. Você não saiu vivo da rebelião.', effects: { run: (g) => { queueDeath(g, 'motim'); } } },
          { chance: 1, text: 'A polícia retomou o controle. Você levou punição e mais seis meses.', effects: { stats: { saude: -10, estresse: 10 }, karma: -3, run: (g) => { if (g.life.crime.prison) { g.life.crime.prison.monthsLeft += 6; g.life.crime.prison.total += 6; } conduct(g, -20); } } },
        ],
      },
      { label: 'Ficar quieto na cela', text: 'Você passou a noite no chão, ouvindo tudo. No dia seguinte, estava ileso.', effects: { stats: { estresse: 6 }, run: (g) => { conduct(g, 4); } } },
    ],
    en: { title: 'Riot', text: 'Screams in the corridors: a riot has started. The wing gates are open.', choices: [{ label: 'Join in', hint: 'Dangerous', outcomes: ['Things got out of hand. You did not leave the riot alive.', 'Police regained control. You got punished and six more months.'] }, { label: 'Stay quiet in the cell', text: 'You spent the night on the floor, hearing everything. The next day you were unharmed.' }] },
  },
  {
    id: 'prisao_estudo', title: 'Supletivo na cadeia', icon: '🎓', scene: 'escola', prison: true, cooldown: 12,
    text: 'A direção oferece aulas de supletivo para quem quiser estudar. Cada hora vale pontos de conduta.',
    choices: [
      { label: 'Estudar', text: 'Foram meses de caderno e giz. Você aprendeu mais do que esperava.', effects: { stats: { inteligencia: 1.5, felicidade: 3 }, run: (g) => { conduct(g, 8); } } },
      { label: 'Ignorar', text: 'O tempo na cela custou a passar.', effects: { stats: { estresse: 3 } } },
    ],
    en: { title: 'High school in prison', text: 'The administration offers equivalency classes for anyone who wants to study. Every hour earns conduct points.', choices: [{ label: 'Study', text: 'Months of notebooks and chalk. You learned more than expected.' }, { label: 'Ignore it', text: 'Time in the cell dragged on.' }] },
  },
  {
    id: 'prisao_doente', title: 'Enfermaria lotada', icon: '🤒', scene: 'saude', prison: true, cooldown: 24,
    text: 'Uma gripe se espalhou pela ala. Você acordou com febre e a enfermaria está lotada.',
    effects: { stats: { saude: -5, estresse: 5 }, run: (g) => { addCondition(g, 'gripe'); } },
    en: { title: 'Packed infirmary', text: 'A flu spread through the wing. You woke up with a fever and the infirmary is packed.' },
  },
  {
    id: 'prisao_carta', title: 'Carta de casa', icon: '✉️', scene: 'casa', prison: true, cooldown: 12,
    text: 'Entregaram uma carta dobrada em quatro. A letra era conhecida.',
    effects: { stats: { felicidade: 5, estresse: -4 } },
    en: { title: 'Letter from home', text: 'They handed over a letter folded in four. The handwriting was familiar.' },
  },
];

