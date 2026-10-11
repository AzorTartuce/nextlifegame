import { addEn, t } from '../../i18n';
import { registerAction } from '../systems/actions';
import type { GameState } from '../types';

addEn({ 'Você precisa estar na escola.': 'You need to be in school.', 'Você precisa de um diploma superior.': 'You need a college degree.' });

const inSchool = (g: GameState) => (g.education.inSchool ? null : t('Você precisa estar na escola.'));
const perf = (g: GameState, d: number) => { g.education.schoolPerf = Math.max(0, Math.min(100, g.education.schoolPerf + d)); };

registerAction({
  id: 'act_clube_xadrez', group: 'escola', icon: '♟️', name: 'Clube de xadrez', desc: 'Raciocínio, silêncio e algumas derrotas humilhantes.', minAge: 8, maxAge: 18, cooldown: 3, risk: 'baixo', scene: 'escola', blocked: inSchool,
  instant: { text: 'Você perdeu três partidas e aprendeu cinco aberturas.', effects: { stats: { inteligencia: 1.2, felicidade: 1 }, run: (g) => perf(g, 3) } },
  en: { name: 'Chess club', desc: 'Reasoning, silence and a few humiliating defeats.', instant: { text: 'You lost three games and learned five openings.' } },
});
registerAction({
  id: 'act_clube_teatro', group: 'escola', icon: '🎭', name: 'Clube de teatro', desc: 'Perder a vergonha no palco da escola.', minAge: 8, maxAge: 18, cooldown: 3, risk: 'baixo', scene: 'festa', blocked: inSchool,
  instant: { text: 'Você esqueceu a fala, improvisou e a plateia aplaudiu.', effects: { stats: { carisma: 1.2, felicidade: 3 } } },
  en: { name: 'Drama club', desc: 'Losing the shyness on the school stage.', instant: { text: 'You forgot your line, improvised and the audience applauded.' } },
});
registerAction({
  id: 'act_clube_esporte', group: 'escola', icon: '⚽', name: 'Time da escola', desc: 'Treinos depois da aula e jogos nos fins de semana.', minAge: 8, maxAge: 18, cooldown: 3, risk: 'baixo', scene: 'escola', blocked: inSchool,
  instant: { text: 'Treino puxado, canelas roxas e muita resenha no vestiário.', effects: { stats: { saude: 1.5, carisma: 0.6, aparencia: 0.3, felicidade: 2 } } },
  en: { name: 'School team', desc: 'After-class training and weekend games.', instant: { text: 'Hard training, bruised shins and lots of locker-room chatter.' } },
});
registerAction({
  id: 'act_professor', group: 'escola', icon: '👩‍🏫', name: 'Pedir ajuda ao professor', desc: 'Tirar dúvidas depois da aula melhora as notas.', minAge: 6, maxAge: 18, cooldown: 2, risk: 'baixo', scene: 'escola', blocked: inSchool,
  instant: { text: 'O professor explicou de um jeito que nunca tinha explicado. Agora fez sentido.', effects: { stats: { inteligencia: 0.5 }, run: (g) => perf(g, 6) } },
  en: { name: 'Ask the teacher for help', desc: 'Asking questions after class improves your grades.', instant: { text: 'The teacher explained it in a way no one had before. Now it made sense.' } },
});
registerAction({
  id: 'act_matar_aula', group: 'escola', icon: '🛹', name: 'Matar aula', desc: 'Um dia livre, uma bronca garantida.', minAge: 11, maxAge: 18, cooldown: 1, risk: 'medio', scene: 'festa', blocked: inSchool,
  instant: {
    outcomes: [
      { chance: 0.6, text: 'Ninguém percebeu. Foi o melhor dia da semana.', effects: { stats: { felicidade: 4, estresse: -3 }, run: (g) => perf(g, -5) } },
      { chance: 1, text: 'A escola ligou para a sua casa. Bronca épica e castigo.', effects: { stats: { felicidade: -4, estresse: 5 }, run: (g) => perf(g, -8) } },
    ],
  },
  en: { name: 'Skip class', desc: 'A free day, a guaranteed scolding.', instant: { outcomes: ['Nobody noticed. It was the best day of the week.', 'The school called your home. Epic scolding and punishment.'] } },
});
registerAction({
  id: 'act_pos', group: 'escola', icon: '🎓', name: 'Pós-graduação', desc: 'Mestrado ou doutorado: mais inteligência e salário maior nas carreiras com diploma.', minAge: 22, cost: 4000, cooldown: 24, risk: 'baixo', scene: 'escola',
  blocked: (g) => (!g.education.degrees.length ? t('Você precisa de um diploma superior.') : (g.flags.posgrad as number ?? 0) >= 2 ? t('Você já tem o máximo de títulos.') : null),
  choices: [
    { label: 'Mestrado', text: 'Dois anos de pesquisa, orientador e cafeína.', effects: { stats: { inteligencia: 3, estresse: 8 }, run: (g) => { g.flags.posgrad = Math.max(1, (g.flags.posgrad as number ?? 0) + 1); } } },
    { label: 'Doutorado', text: 'Quatro anos de tese. Você virou especialista no assunto, e no cansaço.', effects: { stats: { inteligencia: 5, estresse: 12 }, run: (g) => { g.flags.posgrad = 2; } } },
  ],
  en: { name: 'Graduate school', desc: 'Master’s or PhD: more intelligence and higher pay in degree careers.', choices: [{ label: 'Master’s', text: 'Two years of research, an advisor and caffeine.' }, { label: 'PhD', text: 'Four years of thesis. You became an expert in the subject, and in exhaustion.' }] },
});
addEn({ 'Você já tem o máximo de títulos.': 'You already have the maximum degrees.' });
