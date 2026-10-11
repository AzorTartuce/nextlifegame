import { addEn, t } from '../../i18n';
import { changeStats, clamp, createNpc, pushFeed } from '../core';
import { registerAction } from '../systems/actions';
import { haveChild } from '../systems/life';
import { bump, changeKarma } from '../systems/lifestate';
import type { GameState } from '../types';

addEn({
  'Você adotou {n}. Agora a família é maior.': 'You adopted {n}. Now the family is bigger.',
  'O tratamento deu certo: a fertilidade melhorou.': 'The treatment worked: fertility improved.',
  'O tratamento ajudou, e vocês descobriram uma gravidez!': 'The treatment helped, and you found out about a pregnancy!',
  'O tratamento ainda não surtiu efeito.': 'The treatment has not worked yet.',
  'Você precisa ser casado(a) para o tratamento de casal.': 'You must be married for the couple treatment.',
});

function adopt(g: GameState, years: number): string {
  const kid = createNpc(g, { role: 'filho', age: [years, years], lastName: g.player.lastName, relation: 70 });
  bump(g, 'adopted');
  bump(g, 'kids');
  changeKarma(g, 8);
  changeStats(g, { felicidade: 14, estresse: 6 });
  const msg = t('Você adotou {n}. Agora a família é maior.', { n: kid.firstName });
  pushFeed(g, '🧸', msg, 'milestone');
  return msg;
}

registerAction({
  id: 'act_adotar', group: 'familia', icon: '🧸', name: 'Adotar uma criança', desc: 'Um lar novo para quem precisa. Processo longo, amor imediato.',
  minAge: 21, cost: 6000, risk: 'baixo', scene: 'casa',
  choices: [
    { label: 'Um bebê', text: 'Meses de burocracia e, de repente, um bebê nos seus braços.', effects: { run: (g) => adopt(g, 0) } },
    { label: 'Uma criança de 5 anos', text: 'Ele chegou com uma mochila e uma pergunta: "Posso ficar aqui?"', effects: { run: (g) => adopt(g, 5) } },
    { label: 'Um adolescente de 13 anos', text: 'Ela observou a casa em silêncio. Três dias depois, riu pela primeira vez.', effects: { run: (g) => adopt(g, 13) } },
  ],
  en: { name: 'Adopt a child', desc: 'A new home for someone who needs one. Long process, instant love.', choices: [{ label: 'A baby', text: 'Months of paperwork and, suddenly, a baby in your arms.' }, { label: 'A 5-year-old', text: 'He arrived with a backpack and a question: “Can I stay here?”' }, { label: 'A 13-year-old', text: 'She looked around the house in silence. Three days later, she laughed for the first time.' }] },
});

registerAction({
  id: 'act_barriga', group: 'familia', icon: '🤱', name: 'Barriga de aluguel', desc: 'Uma gestante generosa realiza o seu sonho. Caro e emocionante.',
  minAge: 25, maxAge: 60, cost: 40000, risk: 'baixo', scene: 'casa',
  instant: { text: 'Nove meses de ansiedade e uma ligação da maternidade: seu filho nasceu.', effects: { run: (g) => { haveChild(g); } } },
  en: { name: 'Surrogacy', desc: 'A generous surrogate makes your dream come true. Expensive and moving.', instant: { text: 'Nine months of anxiety and a call from the maternity ward: your child was born.' } },
});

registerAction({
  id: 'act_fertilidade', group: 'familia', icon: '🧬', name: 'Tratamento de fertilidade', desc: 'Exames e procedimentos que aumentam as chances de ter filhos.',
  minAge: 22, maxAge: 55, cost: 12000, cooldown: 12, risk: 'baixo', scene: 'saude',
  instant: {
    outcomes: [
      { chance: 0.25, text: 'O tratamento ajudou, e vocês descobriram uma gravidez!', effects: { run: (g) => { g.life.fertility = clamp(g.life.fertility + 12); const has = Object.values(g.npcs).some((n) => n.alive && n.role === 'conjuge'); if (has) haveChild(g); } } },
      { chance: 0.6, text: 'O tratamento deu certo: a fertilidade melhorou.', effects: { run: (g) => { g.life.fertility = clamp(g.life.fertility + 15); } } },
      { chance: 1, text: 'O tratamento ainda não surtiu efeito.', effects: { stats: { estresse: 5, felicidade: -2 } } },
    ],
  },
  en: { name: 'Fertility treatment', desc: 'Tests and procedures that raise the chances of having children.', instant: { outcomes: ['The treatment helped, and you found out about a pregnancy!', 'The treatment worked: fertility improved.', 'The treatment has not worked yet.'] } },
});

