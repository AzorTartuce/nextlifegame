import { registerAction } from '../systems/actions';

import { changeStats, partnerOf } from '../core';
import { addEn, t } from '../../i18n';

addEn({
  'Você e {n} tiveram uma noite memorável.': 'You and {n} had a memorable night.',
  'Você leu {n} páginas e saiu mais esperto.': 'You read {n} pages and came out smarter.',
  'Você terminou o livro e ficou pensando nele por dias.': 'You finished the book and kept thinking about it for days.',
  'Você desistiu do livro na metade.': 'You gave up on the book halfway.',
});

registerAction({
  id: 'act_cinema', group: 'lazer', icon: '🎬', name: 'Ir ao cinema', desc: 'Pipoca, escuro e duas horas fora do mundo.',
  minAge: 8, cost: 40, cooldown: 1, risk: 'baixo', scene: 'festa',
  instant: {
    outcomes: [
      { chance: 0.7, text: 'O filme era ótimo! Você saiu emocionado e comentando as cenas.', effects: { stats: { felicidade: 4, estresse: -3 } } },
      { chance: 1, text: 'O filme era péssimo, mas a pipoca salvou a noite.', effects: { stats: { felicidade: 1, estresse: -1 } } },
    ],
  },
  en: { name: 'Go to the movies', desc: 'Popcorn, darkness and two hours out of this world.', instant: { outcomes: ['The movie was great! You left moved, talking about the scenes.', 'The movie was terrible, but the popcorn saved the night.'] } },
});

registerAction({
  id: 'act_ler', group: 'lazer', icon: '📖', name: 'Ler um livro', desc: 'Vire as páginas o mais rápido que conseguir.',
  minAge: 6, cooldown: 1, risk: 'baixo', minigame: 'livro', level: (g) => 1 + Math.floor(g.player.stats.inteligencia / 40),
  onMinigame: (g, r) => {
    if (r.cancelled) return;
    const gain = 0.5 + (r.score / Math.max(1, r.max)) * 1.5;
    changeStats(g, { inteligencia: gain, felicidade: r.win ? 3 : 1, estresse: -2 });
    g.lastResult = { title: t('Ler um livro'), icon: '📖', scene: 'escola', text: r.win ? t('Você terminou o livro e ficou pensando nele por dias.') : t('Você leu {n} páginas e saiu mais esperto.', { n: r.score }), deltas: {} };
  },
  en: { name: 'Read a book', desc: 'Turn the pages as fast as you can.' },
});

registerAction({
  id: 'act_restaurante', group: 'lazer', icon: '🍽️', name: 'Jantar fora', desc: 'Uma boa mesa, boa companhia e a conta no final.',
  minAge: 14, cost: 120, cooldown: 1, risk: 'baixo', scene: 'amor',
  instant: {
    text: 'A comida estava ótima e a conversa melhor ainda.',
    effects: { stats: { felicidade: 5, estresse: -3 }, run: (g) => { const p = partnerOf(g); if (p) { p.relation = Math.min(100, p.relation + 7); return t('Você e {n} tiveram uma noite memorável.', { n: p.firstName }); } } },
  },
  en: { name: 'Dine out', desc: 'A good table, good company and the bill at the end.', instant: { text: 'The food was great and the conversation even better.' } },
});

registerAction({
  id: 'act_show', group: 'lazer', icon: '🎤', name: 'Ir a um show', desc: 'Música ao vivo, gente cantando junto e a voz rouca no dia seguinte.',
  minAge: 12, cost: 200, cooldown: 1, risk: 'baixo', scene: 'festa',
  instant: { text: 'Você cantou todas as músicas e perdeu a voz.', effects: { stats: { felicidade: 7, carisma: 0.5, estresse: -4 } } },
  en: { name: 'Go to a concert', desc: 'Live music, people singing along and a hoarse voice the next day.', instant: { text: 'You sang every song and lost your voice.' } },
});

registerAction({
  id: 'act_museu', group: 'lazer', icon: '🏛️', name: 'Visitar um museu', desc: 'Arte, história e um café caro na saída.',
  minAge: 6, cost: 60, cooldown: 1, risk: 'baixo', scene: 'escola',
  instant: { text: 'Você aprendeu mais em três horas do que em um mês de aula.', effects: { stats: { inteligencia: 1, felicidade: 2 } } },
  en: { name: 'Visit a museum', desc: 'Art, history and an expensive coffee on the way out.', instant: { text: 'You learned more in three hours than in a month of class.' } },
});

registerAction({
  id: 'act_parque', group: 'lazer', icon: '🌳', name: 'Passeio no parque', desc: 'Grama, sol e nenhuma notificação.',
  minAge: 4, cost: 30, cooldown: 1, risk: 'baixo', scene: 'natureza',
  instant: { text: 'Você caminhou, respirou fundo e esqueceu o celular no bolso.', effects: { stats: { saude: 1, felicidade: 3, estresse: -4 } } },
  en: { name: 'Walk in the park', desc: 'Grass, sun and zero notifications.', instant: { text: 'You walked, took a deep breath and forgot the phone in your pocket.' } },
});
