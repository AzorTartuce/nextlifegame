import { addEn, t } from '../../i18n';
import { ARTS } from '../data/health';
import { registerAction } from '../systems/actions';
import { addAddiction, addictionLevel, anyAddiction, runCheckup } from '../systems/health';
import { queueDeath } from '../systems/lifestate';
import { conditionById } from '../data/health';
import { chance } from '../rng';

// ---------- Cuidados ----------

registerAction({
  id: 'act_checkup', group: 'saude', icon: '🩺', name: 'Check-up completo', desc: 'Exames de rotina descobrem doenças que ainda não deram sintomas.',
  minAge: 6, cost: 150, cooldown: 6, risk: 'baixo', scene: 'saude',
  instant: {
    effects: {
      run: (g) => {
        const found = runCheckup(g);
        if (!found.length) return t('Tudo em ordem! O médico elogiou seus exames.');
        return t('O check-up encontrou: {n}.', { n: found.map((c) => t(conditionById(c.id).name)).join(', ') });
      },
      stats: { felicidade: 1 },
    },
  },
  en: { name: 'Full check-up', desc: 'Routine exams catch illnesses that have not shown symptoms yet.' },
});

registerAction({
  id: 'act_terapia', group: 'saude', icon: '🛋️', name: 'Sessão de terapia', desc: 'Conversar com um profissional alivia o estresse e ajuda na depressão e na ansiedade.',
  minAge: 10, cost: 200, cooldown: 1, risk: 'baixo', scene: 'saude',
  instant: {
    text: 'Uma hora de conversa franca. Você saiu mais leve.',
    effects: {
      stats: { estresse: -8, felicidade: 3 },
      run: (g) => {
        for (const c of g.life.health.conditions) if (c.id === 'depressao' || c.id === 'ansiedade') c.severity = Math.max(5, c.severity - 10);
      },
    },
  },
  en: { name: 'Therapy session', desc: 'Talking to a professional eases stress and helps with depression and anxiety.', instant: { text: 'An hour of honest talk. You left feeling lighter.' } },
});

registerAction({
  id: 'act_academia_entrar', group: 'saude', icon: '🏋️', name: 'Matricular na academia', desc: 'Mensalidade de {fee}. Os exercícios rendem mais para a saúde.',
  minAge: 14, cost: 70, risk: 'baixo', scene: 'saude', blocked: (g) => (g.life.health.gym ? t('Você já é aluno.') : null),
  instant: { text: 'Matrícula feita! Agora é só não parar na segunda semana.', effects: { stats: { felicidade: 2 }, run: (g) => { g.life.health.gym = true; } } },
  en: { name: 'Join the gym', desc: 'Monthly fee applies. Workouts do more for your health.', instant: { text: 'Signed up! Now just do not quit in week two.' } },
});

registerAction({
  id: 'act_academia_sair', group: 'saude', icon: '🚪', name: 'Cancelar a academia', desc: 'Para de pagar a mensalidade.',
  minAge: 14, blocked: (g) => (!g.life.health.gym ? t('Você não é aluno.') : null),
  instant: { text: 'Matrícula cancelada.', effects: { run: (g) => { g.life.health.gym = false; } } },
  en: { name: 'Cancel gym membership', desc: 'Stop paying the monthly fee.', instant: { text: 'Membership cancelled.' } },
});

registerAction({
  id: 'act_dojo_entrar', group: 'saude', icon: '🥋', name: 'Entrar num dojô', desc: 'Aprenda uma arte marcial: saúde, disciplina e faixas.',
  minAge: 6, cost: 100, risk: 'baixo', scene: 'saude', blocked: (g) => (g.life.health.martial ? t('Você já treina uma arte marcial.') : null),
  choices: ARTS.map((a) => ({
    label: a.name,
    text: t('Você vestiu o kimono pela primeira vez. Primeira faixa: branca.'),
    effects: { stats: { felicidade: 3 }, run: (g) => { g.life.health.martial = { art: a.id, belt: 0 }; } },
  })),
  en: {
    name: 'Join a dojo', desc: 'Learn a martial art: health, discipline and belts.',
    choices: ARTS.map((a) => ({ label: a.en, text: 'You put on the uniform for the first time. First belt: white.' })),
  },
});

registerAction({
  id: 'act_dojo_sair', group: 'saude', icon: '🚪', name: 'Parar as artes marciais', desc: 'Deixa o dojô e o pagamento mensal.',
  minAge: 6, blocked: (g) => (!g.life.health.martial ? t('Você não treina.') : null),
  instant: { text: 'Você pendurou o kimono.', effects: { run: (g) => { g.life.health.martial = null; } } },
  en: { name: 'Quit martial arts', desc: 'Leave the dojo and the monthly fee.', instant: { text: 'You hung up the uniform.' } },
});

// ---------- Beleza ----------

registerAction({
  id: 'act_salao', group: 'beleza', icon: '💇', name: 'Salão de beleza', desc: 'Corte, cor e uma autoestima nova.',
  minAge: 8, cost: 80, cooldown: 1, risk: 'baixo', scene: 'festa',
  instant: { text: 'Saiu do salão se sentindo outra pessoa.', effects: { stats: { aparencia: 1, felicidade: 2, carisma: 0.5 } } },
  en: { name: 'Hair salon', desc: 'Cut, color and fresh self-esteem.', instant: { text: 'You left the salon feeling like a new person.' } },
});

registerAction({
  id: 'act_spa', group: 'beleza', icon: '🧖', name: 'Dia de spa', desc: 'Massagem, sauna e zero preocupações.',
  minAge: 14, cost: 300, cooldown: 2, risk: 'baixo', scene: 'saude',
  instant: { text: 'O mundo pode esperar. Seu corpo agradece.', effects: { stats: { estresse: -12, felicidade: 4, aparencia: 0.5 } } },
  en: { name: 'Spa day', desc: 'Massage, sauna and zero worries.', instant: { text: 'The world can wait. Your body says thanks.' } },
});

interface Surgery { id: string; name: string; en: string; icon: string; cost: number; gain: number; p: number; fail: number; hurt: number; desc: string; enDesc: string }
const SURGERIES: Surgery[] = [
  { id: 'botox', name: 'Botox e preenchimento', en: 'Botox and fillers', icon: '💉', cost: 600, gain: 1.5, p: 0.97, fail: 1.5, hurt: 1, desc: 'Rejuvenescimento sem bisturi.', enDesc: 'Rejuvenation without a scalpel.' },
  { id: 'rino', name: 'Rinoplastia', en: 'Rhinoplasty', icon: '👃', cost: 4000, gain: 6, p: 0.9, fail: 4, hurt: 5, desc: 'Um novo perfil.', enDesc: 'A new profile.' },
  { id: 'harmoniza', name: 'Harmonização facial', en: 'Facial harmonization', icon: '🎭', cost: 3000, gain: 5, p: 0.92, fail: 3, hurt: 3, desc: 'Equilíbrio entre os traços do rosto.', enDesc: 'Balance between facial features.' },
  { id: 'lipo', name: 'Lipoaspiração', en: 'Liposuction', icon: '🫧', cost: 5000, gain: 5, p: 0.88, fail: 3, hurt: 12, desc: 'Contorno do corpo, com recuperação demorada.', enDesc: 'Body contouring with a long recovery.' },
  { id: 'cabelo', name: 'Implante capilar', en: 'Hair transplant', icon: '💈', cost: 6000, gain: 4, p: 0.9, fail: 2, hurt: 2, desc: 'Fios de volta onde faltavam.', enDesc: 'Hair back where it was missing.' },
  { id: 'contorno', name: 'Contorno corporal', en: 'Body contouring', icon: '🏺', cost: 5500, gain: 6, p: 0.85, fail: 5, hurt: 10, desc: 'Silhueta nova, risco maior.', enDesc: 'A new silhouette, higher risk.' },
  { id: 'rosto_novo', name: 'Transformação total', en: 'Total makeover', icon: '🪞', cost: 25000, gain: 12, p: 0.7, fail: 12, hurt: 20, desc: 'Um rosto novo. Pode dar muito certo ou muito errado.', enDesc: 'A brand-new face. Could go very right or very wrong.' },
];

for (const s of SURGERIES) {
  registerAction({
    id: `act_cir_${s.id}`, group: 'cirurgia', icon: s.icon, name: s.name, desc: s.desc, minAge: 18, cost: s.cost, cooldown: 6, risk: s.p >= 0.95 ? 'baixo' : s.p >= 0.88 ? 'medio' : 'alto', scene: 'saude',
    instant: {
      outcomes: [
        { chance: s.p, text: 'A cirurgia foi um sucesso. Você mal se reconhece no espelho.', effects: { stats: { aparencia: s.gain, felicidade: 6 }, count: { surgeries: 1 } } },
        { chance: 1, text: 'Deu errado. O resultado não é o que você esperava, e a recuperação é difícil.', effects: { stats: { aparencia: -s.fail, saude: -s.hurt, felicidade: -8 }, count: { surgeries: 1 } } },
      ],
    },
    en: { name: s.en, desc: s.enDesc, instant: { outcomes: ['The surgery was a success. You barely recognize yourself in the mirror.', 'It went wrong. The result is not what you expected, and recovery is hard.'] } },
  });
}

// ---------- Vícios ----------

registerAction({
  id: 'act_beber', group: 'vicios', icon: '🍺', name: 'Tomar uns drinks', desc: 'Descontrai agora, cobra depois.',
  minAge: 16, cost: 25, risk: 'medio', scene: 'festa',
  instant: { text: 'Uma rodada virou três. A noite foi ótima.', effects: { stats: { felicidade: 4, estresse: -5, saude: -0.5 }, run: (g) => { addAddiction(g, 'alcool', 4); } } },
  en: { name: 'Have a few drinks', desc: 'Relaxes now, bills you later.', instant: { text: 'One round turned into three. The night was great.' } },
});

registerAction({
  id: 'act_fumar', group: 'vicios', icon: '🚬', name: 'Fumar um cigarro', desc: 'Alívio de cinco minutos e um pulmão a menos.',
  minAge: 16, cost: 15, risk: 'medio', scene: 'perigo',
  instant: { text: 'Você tragou fundo e prometeu que era o último.', effects: { stats: { felicidade: 2, estresse: -3, saude: -0.5 }, run: (g) => { addAddiction(g, 'cigarro', 6); } } },
  en: { name: 'Smoke a cigarette', desc: 'Five minutes of relief and a little less lung.', instant: { text: 'You took a deep drag and promised it was the last.' } },
});

registerAction({
  id: 'act_drogas', group: 'vicios', icon: '💉', name: 'Experimentar drogas pesadas', desc: 'Prazer intenso e risco real de dependência e overdose.',
  minAge: 15, cost: 150, risk: 'alto', scene: 'perigo',
  instant: {
    outcomes: [
      {
        chance: 0.82, text: 'Foi intenso. Você já está pensando na próxima vez.',
        effects: { stats: { felicidade: 12, saude: -3 }, karma: -2, count: { drugUses: 1 }, run: (g) => { addAddiction(g, 'drogas', 16); } },
      },
      {
        chance: 1, text: 'Uma viagem terrível. Você passou horas tremendo no chão do banheiro.',
        effects: { stats: { saude: -10, felicidade: -6, estresse: 10 }, karma: -2, count: { drugUses: 1 }, run: (g) => { addAddiction(g, 'drogas', 16); if (addictionLevel(g, 'drogas') > 25 && chance(g, 0.04)) queueDeath(g, 'overdose'); } },
      },
    ],
  },
  en: { name: 'Try hard drugs', desc: 'Intense pleasure and a real risk of addiction and overdose.', instant: { outcomes: ['It was intense. You are already thinking about the next time.', 'A terrible trip. You spent hours shaking on the bathroom floor.'] } },
});

registerAction({
  id: 'act_parar_sozinho', group: 'vicios', icon: '✋', name: 'Tentar parar sozinho', desc: 'Força de vontade contra o vício.',
  minAge: 14, cooldown: 3, risk: 'medio', scene: 'saude', blocked: (g) => (!anyAddiction(g) ? t('Você não tem vícios.') : null),
  instant: {
    outcomes: [
      {
        chance: (g) => Math.max(0.1, 0.25 + g.player.stats.inteligencia / 300 + g.player.stats.felicidade / 400 - Math.max(...Object.values(g.life.health.addictions), 0) / 200),
        text: 'Foi duro, mas você resistiu. A vontade ficou menor.',
        effects: { stats: { felicidade: 3, estresse: 4 }, karma: 1, run: (g) => { for (const k of Object.keys(g.life.health.addictions)) addAddiction(g, k, -20); } },
      },
      { chance: 1, text: 'A vontade foi maior. Você recaiu.', effects: { stats: { felicidade: -4, estresse: 6 }, run: (g) => { for (const k of Object.keys(g.life.health.addictions)) addAddiction(g, k, 5); } } },
    ],
  },
  en: { name: 'Try to quit on your own', desc: 'Willpower against the habit.', instant: { outcomes: ['It was tough, but you held out. The craving got smaller.', 'The craving won. You relapsed.'] } },
});

registerAction({
  id: 'act_reabilitacao', group: 'vicios', icon: '🏥', name: 'Reabilitação', desc: 'Três meses internado para tratar os vícios.',
  minAge: 14, cost: 3000, risk: 'baixo', scene: 'saude',
  blocked: (g) => (!anyAddiction(g) ? t('Você não tem vícios.') : g.life.health.rehabLeft > 0 ? t('Você já está internado.') : null),
  instant: { text: 'Você deu entrada na clínica. Três meses para recomeçar.', effects: { stats: { estresse: 5 }, karma: 1, run: (g) => { g.life.health.rehabLeft = 3; } } },
  en: { name: 'Rehab', desc: 'Three months inpatient to treat addictions.', instant: { text: 'You checked into the clinic. Three months to start over.' } },
});

addEn({
  'Tudo em ordem! O médico elogiou seus exames.': 'All clear! The doctor praised your results.',
  'O check-up encontrou: {n}.': 'The check-up found: {n}.',
  'Mensalidade de {fee}. Os exercícios rendem mais para a saúde.': 'Monthly fee applies. Workouts do more for your health.',
  'Você já é aluno.': 'You are already a member.',
  'Você não é aluno.': 'You are not a member.',
  'Você já treina uma arte marcial.': 'You already train a martial art.',
  'Você não treina.': 'You do not train.',
  'Você não tem vícios.': 'You have no addictions.',
  'Você já está internado.': 'You are already admitted.',
  'Risco baixo': 'Low risk', 'Risco médio': 'Medium risk', 'Risco alto': 'High risk',
  'A partir de {n} anos.': 'From age {n}.', 'Até {n} anos.': 'Up to age {n}.', 'Espere {n} meses.': 'Wait {n} months.',
  'Indisponível.': 'Unavailable.', 'Resolva o evento primeiro.': 'Resolve the event first.', 'Não foi possível agora.': 'Not possible right now.',
});
