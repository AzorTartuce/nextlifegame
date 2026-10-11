import { t } from '../../../i18n';
import { role } from '../binders';
import { addAddiction, addCondition, runCheckup } from '../../systems/health';
import { queueDeath } from '../../systems/lifestate';
import type { Storylet } from '../engine';

export const SAUDE: Storylet[] = [
  {
    id: 'amigo_cigarro', title: 'Cigarro no recreio', icon: '🚬', scene: 'escola', minAge: 13, maxAge: 19, cooldown: 36,
    text: 'No fundo da escola, um grupo passa um cigarro de mão em mão. Todo mundo olha pra você.',
    choices: [
      { label: 'Experimentar', text: 'Você tossiu até chorar, mas todo mundo riu junto. Fez parte da turma.', effects: { stats: { carisma: 1, saude: -1 }, run: (g) => { addAddiction(g, 'cigarro', 8); } } },
      { label: 'Recusar', text: '"Não curto." Alguns riram, mas ninguém insistiu.', effects: { karma: 1, stats: { estresse: 2 } } },
    ],
    en: {
      title: 'Cigarette behind the school', text: 'Behind the school, a group passes a cigarette hand to hand. Everyone looks at you.',
      choices: [{ label: 'Try it', text: 'You coughed until you cried, but everyone laughed together. You were part of the crowd.' }, { label: 'Decline', text: '“Not my thing.” A few laughed, but nobody pushed.' }],
    },
  },
  {
    id: 'festa_bebida', title: 'Noite de balada', icon: '🍹', scene: 'festa', minAge: 16, cooldown: 14,
    text: 'A festa está no auge. Alguém coloca um copo cheio na sua mão: "Só mais um!"',
    choices: [
      {
        label: 'Beber até cair', hint: 'Divertido, arriscado',
        outcomes: [
          { chance: 0.6, text: 'Foi lendário. Você dançou em cima da mesa e todo mundo filmou.', effects: { stats: { felicidade: 7, carisma: 1, saude: -2 }, run: (g) => { addAddiction(g, 'alcool', 6); } } },
          { chance: 1, text: 'Vexame total. Você acordou sem lembrar de nada, com a cabeça explodindo e um vídeo circulando.', effects: { stats: { felicidade: -6, carisma: -2, saude: -3, estresse: 6 }, run: (g) => { addAddiction(g, 'alcool', 6); } } },
        ],
      },
      { label: 'Beber com moderação', text: 'Dois drinks, boa conversa e uma noite sem ressaca.', effects: { stats: { felicidade: 3, carisma: 1 } } },
      { label: 'Ficar no refrigerante', text: 'Você foi o último a sair e o único que lembrava de tudo.', effects: { stats: { felicidade: 1 }, karma: 1 } },
    ],
    en: {
      title: 'Night out', text: 'The party is at its peak. Someone puts a full glass in your hand: “Just one more!”',
      choices: [
        { label: 'Drink till you drop', hint: 'Fun, risky', outcomes: ['It was legendary. You danced on the table and everyone filmed it.', 'Total embarrassment. You woke up remembering nothing, head pounding and a video going around.'] },
        { label: 'Drink in moderation', text: 'Two drinks, good conversation and a hangover-free night.' },
        { label: 'Stick to soda', text: 'You were the last to leave and the only one who remembered everything.' },
      ],
    },
  },
  {
    id: 'amigo_droga', title: 'Oferta perigosa', icon: '💊', scene: 'perigo', minAge: 15, cooldown: 36,
    bind: { amigo: role('amigo', 'conhecido') },
    text: '{amigo.nome} tira um saquinho do bolso: "Só pra experimentar, todo mundo faz. Confia em mim."',
    choices: [
      { label: 'Aceitar', text: 'Foi uma sensação que você nunca tinha sentido. E já quer de novo.', effects: { stats: { felicidade: 9, saude: -3 }, karma: -2, count: { drugUses: 1 }, run: (g) => { addAddiction(g, 'drogas', 14); } } },
      { label: 'Recusar e ir embora', text: '{amigo.nome} ficou chateado, mas você dormiu em paz.', effects: { karma: 2, rel: { amigo: -4 } } },
      { label: 'Convencer {amigo.nome} a parar', hint: 'Carisma ajuda', outcomes: [
        { chance: (g) => 0.2 + g.player.stats.carisma / 200, text: '{amigo.nome} jogou fora e agradeceu depois. Você pode ter salvo uma vida.', effects: { karma: 4, rel: { amigo: 12 }, stats: { carisma: 2 } } },
        { chance: 1, text: '{amigo.nome} riu e disse que você virou careta. A amizade esfriou.', effects: { rel: { amigo: -10 } } },
      ] },
    ],
    en: {
      title: 'Dangerous offer', text: '{amigo.nome} pulls a little bag from a pocket: “Just to try, everyone does. Trust me.”',
      choices: [
        { label: 'Accept', text: 'A feeling you had never felt before. And you already want it again.' },
        { label: 'Decline and walk away', text: '{amigo.nome} got upset, but you slept in peace.' },
        { label: 'Talk {amigo.nome} out of it', hint: 'Charisma helps', outcomes: ['{amigo.nome} threw it away and thanked you later. You may have saved a life.', '{amigo.nome} laughed and said you turned boring. The friendship cooled.'] },
      ],
    },
  },
  {
    id: 'resgate', title: 'Cada segundo conta', icon: '🆘', scene: 'perigo', minAge: 16, cooldown: 120, weight: 0.08,
    text: 'Gritos na beira do rio: uma criança foi levada pela correnteza. Ninguém se mexe.',
    choices: [
      {
        label: 'Pular para salvar', hint: 'Muito arriscado',
        outcomes: [
          { chance: (g) => 0.955 + g.player.stats.saude / 2500, text: 'Você chegou a tempo. A criança chorava, viva, nos braços da mãe. Os aplausos vieram depois.', effects: { karma: 12, stats: { carisma: 3, felicidade: 10, saude: -4 }, count: { rescues: 1 } } },
          { chance: 1, text: 'A correnteza foi mais forte. Você conseguiu empurrá-la até a margem, mas não teve força para voltar.', effects: { karma: 15, count: { rescues: 1 }, run: (g) => { queueDeath(g, 'heroi'); } } },
        ],
      },
      { label: 'Ligar para os bombeiros', text: 'Você fez a ligação, e a ajuda chegou. Fez o que podia.', effects: { karma: 2, stats: { estresse: 4 } } },
      { label: 'Ficar paralisado', text: 'Os bombeiros chegaram a tempo. Você nunca esqueceu como ficou parado.', effects: { karma: -2, stats: { felicidade: -4, estresse: 8 } } },
    ],
    en: {
      title: 'Every second counts', text: 'Screams at the riverbank: a child was swept away by the current. Nobody moves.',
      choices: [
        { label: 'Jump in to save them', hint: 'Very risky', outcomes: ['You made it in time. The child was crying, alive, in the mother’s arms. The applause came later.', 'The current was stronger. You managed to push them to the bank, but had no strength left to return.'] },
        { label: 'Call the fire department', text: 'You made the call and help arrived. You did what you could.' },
        { label: 'Freeze', text: 'The firefighters arrived in time. You never forgot how you just stood there.' },
      ],
    },
  },
  {
    id: 'exame_rotina', title: 'Hora do check-up', icon: '🩺', scene: 'saude', minAge: 35, cooldown: 36,
    when: (g) => g.t - g.life.health.lastCheckup > 36,
    text: 'Seu médico mandou um lembrete: já faz anos desde o seu último check-up completo.',
    choices: [
      { label: 'Fazer agora ($150)', when: (g) => g.money >= 150, text: '', effects: { money: -150, run: (g) => { const f = runCheckup(g); return f.length ? t('O check-up encontrou algo. Veja na aba Saúde do celular.') : t('Tudo em ordem! O médico elogiou seus exames.'); } } },
      { label: 'Deixar para depois', text: '"Semana que vem eu marco." Você sabe que não vai marcar.', effects: { stats: { estresse: 1 } } },
    ],
    en: {
      title: 'Check-up time', text: 'Your doctor sent a reminder: it has been years since your last full check-up.',
      choices: [{ label: 'Do it now ($150)' }, { label: 'Put it off', text: '“I’ll book it next week.” You know you won’t.' }],
    },
  },
  {
    id: 'lesao_academia', title: 'Exagerou no treino', icon: '🏋️', scene: 'saude', minAge: 14, cooldown: 48,
    when: (g) => g.life.health.gym || g.agenda.exercicio >= 8,
    text: 'No meio de uma série pesada, você sentiu algo estalar.',
    choices: [
      { label: 'Ir ao pronto-socorro', text: 'Era só um estiramento feio, mas o médico elogiou a decisão.', effects: { money: -200, stats: { saude: -2 } } },
      { label: 'Ignorar a dor', outcomes: [
        { chance: 0.7, text: 'Com uns dias de repouso, passou.', effects: { stats: { saude: -2 } } },
        { chance: 1, text: 'Era uma fratura. Meses de recuperação pela frente.', effects: { run: (g) => { addCondition(g, 'fratura'); } } },
      ] },
    ],
    en: {
      title: 'Overdid the workout', text: 'In the middle of a heavy set, you felt something snap.',
      choices: [{ label: 'Go to the ER', text: 'It was just a nasty strain, but the doctor praised your decision.' }, { label: 'Ignore the pain', outcomes: ['After a few days of rest, it went away.', 'It was a fracture. Months of recovery ahead.'] }],
    },
  },
];
