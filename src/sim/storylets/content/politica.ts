import { clamp } from '../../core';
import { PARTIES } from '../../data/politics';
import { pick } from '../../rng';
import { boostSupport, impeach, joinParty, politicsOf } from '../../systems/politics';
import type { GameState } from '../../types';
import type { Storylet } from '../engine';

const pol = (g: GameState) => politicsOf(g)!;
const approve = (g: GameState, d: number) => { pol(g).approval = clamp(pol(g).approval + d); };
const inOffice = (g: GameState) => !!politicsOf(g) && politicsOf(g)!.office >= 0;
const scandal = (g: GameState, hit: number) => {
  pol(g).scandals += 1;
  approve(g, -hit);
  if (pol(g).scandals >= 3) impeach(g, 'escandalo');
};

export const POLITICA: Storylet[] = [
  {
    id: 'convite_partido', title: 'Convite para a política', icon: '🗳️', scene: 'trabalho', minAge: 21, cooldown: 60, weight: 0.7,
    when: (g) => !politicsOf(g) && g.life.crime.record === 0 && g.player.stats.carisma >= 50 && g.player.stats.inteligencia >= 45,
    text: 'Um dirigente de partido te viu discursando numa reunião do bairro: "Você tem jeito para isso. Já pensou em se candidatar?"',
    choices: [
      { label: 'Aceitar e se filiar', text: 'Você assinou a ficha de filiação. Uma nova vida começa.', effects: { run: (g) => { joinParty(g, pick(g, PARTIES.filter((p) => p.id !== 'ind')).id); } } },
      { label: 'Agradecer e recusar', text: '"Prefiro cuidar da minha vida." Ele deixou o cartão, caso mude de ideia.', effects: { karma: 0 } },
    ],
    en: { title: 'An invitation to politics', text: 'A party official saw you speaking at a neighborhood meeting: “You have the knack. Ever thought of running?”', choices: [{ label: 'Accept and join', text: 'You signed the membership form. A new life begins.' }, { label: 'Thank them and decline', text: '“I prefer to mind my own life.” He left his card, in case you change your mind.' }] },
  },
  {
    id: 'escandalo_imprensa', title: 'Manchete ruim', icon: '📰', scene: 'perigo', cooldown: 18, weight: 1.2,
    when: (g) => inOffice(g),
    text: 'Um jornal publica uma reportagem sobre uma doação suspeita na sua campanha. Os telefones não param de tocar.',
    choices: [
      { label: 'Negar tudo', outcomes: [
        { chance: (g) => 0.45 + g.player.stats.carisma / 300, text: 'Sem provas, a história morreu em três dias.', effects: {} },
        { chance: 1, text: 'Surgiram documentos. Negar só piorou tudo.', effects: { run: (g) => { scandal(g, 15); } } },
      ] },
      { label: 'Pedir desculpas em público', text: 'A franqueza custou pontos, mas ganhou respeito.', effects: { karma: 2, run: (g) => { approve(g, -4); } } },
      { label: 'Culpar um assessor', outcomes: [
        { chance: 0.6, text: 'O assessor assumiu a culpa (e um bom cargo na iniciativa privada).', effects: { karma: -5 } },
        { chance: 1, text: 'O assessor gravou tudo. Você caiu junto.', effects: { karma: -6, run: (g) => { scandal(g, 20); } } },
      ] },
    ],
    en: { title: 'Bad headline', text: 'A newspaper runs a story on a suspicious donation to your campaign. The phones will not stop ringing.', choices: [{ label: 'Deny everything', outcomes: ['With no proof, the story died in three days.', 'Documents surfaced. Denying only made it worse.'] }, { label: 'Apologize publicly', text: 'Frankness cost points, but earned respect.' }, { label: 'Blame an aide', outcomes: ['The aide took the blame (and a nice private-sector job).', 'The aide recorded everything. You fell along with him.'] }] },
  },
  {
    id: 'greve_geral', title: 'Greve geral', icon: '📢', scene: 'trabalho', cooldown: 24, weight: 0.8,
    when: (g) => inOffice(g) && pol(g).office >= 1,
    text: 'Sindicatos paralisaram o transporte da cidade inteira. O povo olha para você.',
    choices: [
      { label: 'Negociar com os sindicatos', text: 'Dias de reuniões e um acordo imperfeito. O povo gostou do diálogo.', effects: { stats: { estresse: 6 }, run: (g) => { approve(g, 4); } } },
      { label: 'Endurecer e reprimir', text: 'A ordem voltou rápido, mas a imagem ficou arranhada.', effects: { karma: -3, run: (g) => { approve(g, -8); } } },
      { label: 'Esperar passar', text: 'A greve acabou sozinha, depois de uma semana de caos.', effects: { run: (g) => { approve(g, -4); } } },
    ],
    en: { title: 'General strike', text: 'Unions shut down the city’s transport. The people look to you.', choices: [{ label: 'Negotiate with the unions', text: 'Days of meetings and an imperfect deal. People liked the dialogue.' }, { label: 'Crack down', text: 'Order returned fast, but your image got scratched.' }, { label: 'Wait it out', text: 'The strike ended on its own after a week of chaos.' }] },
  },
  {
    id: 'entrevista_tv', title: 'Entrevista ao vivo', icon: '📺', scene: 'festa', cooldown: 4, weight: 1.5,
    when: (g) => !!politicsOf(g)?.campaign,
    text: 'Uma emissora de TV te chamou para uma entrevista ao vivo, em horário nobre.',
    choices: [
      { label: 'Falar das propostas', outcomes: [
        { chance: (g) => 0.35 + g.player.stats.inteligencia / 200, text: 'Você foi claro e convincente. A pesquisa subiu.', effects: { run: (g) => { boostSupport(g, 7); } } },
        { chance: 1, text: 'As propostas soaram vagas e o apresentador te encurralou.', effects: { run: (g) => { boostSupport(g, -5); } } },
      ] },
      { label: 'Contar uma piada', outcomes: [
        { chance: (g) => 0.3 + g.player.stats.carisma / 200, text: 'A piada viralizou. O povo riu com você, não de você.', effects: { run: (g) => { boostSupport(g, 8); } } },
        { chance: 1, text: 'A piada foi lida como falta de respeito. Chuva de críticas.', effects: { run: (g) => { boostSupport(g, -8); } } },
      ] },
      { label: 'Recusar a entrevista', text: 'Seu adversário ocupou a cadeira vazia.', effects: { run: (g) => { boostSupport(g, -3); } } },
    ],
    en: { title: 'Live interview', text: 'A TV network invited you for a live prime-time interview.', choices: [{ label: 'Talk about proposals', outcomes: ['You were clear and convincing. The polls went up.', 'Your proposals sounded vague and the host cornered you.'] }, { label: 'Tell a joke', outcomes: ['The joke went viral. People laughed with you, not at you.', 'The joke read as disrespect. A rain of criticism.'] }, { label: 'Decline', text: 'Your opponent took the empty chair.' }] },
  },
];
