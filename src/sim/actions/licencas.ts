import { addEn, t } from '../../i18n';
import { showResult, registerAction } from '../systems/actions';

addEn({
  'Você tirou a carteira de motorista! A estrada é sua.': 'You got your driver’s license! The road is yours.',
  'Reprovado no teste dos sinais. Estude mais e tente de novo.': 'You failed the road signs test. Study more and try again.',
  'Você já tem a carteira de motorista.': 'You already have a driver’s license.',
  'Você já tem essa licença.': 'You already have this license.',
  'Antecedentes criminais impedem o porte de arma.': 'A criminal record prevents a gun permit.',
  'Carteira de motorista': 'Driver’s license',
  'Teste de sinais de trânsito: acerte pelo menos 7 de 10.': 'Road signs test: get at least 7 out of 10.',
  'Precisa da carteira de motorista (aba Celular > Viagens).': 'You need a driver’s license (Phone tab > Travel).',
  'Precisa da licença náutica (aba Celular > Viagens).': 'You need a boating license (Phone tab > Travel).',
  'Precisa do brevê de piloto (aba Celular > Viagens).': 'You need a pilot’s license (Phone tab > Travel).',
  'Imóvel colocado para alugar. O aluguel entra todo mês.': 'Property listed for rent. Rent comes in every month.',
  'Você voltou a usar o imóvel como moradia.': 'You went back to living in the property.',
  'Seus imóveis foram vendidos por {v} antes da mudança.': 'Your properties were sold for {v} before the move.',
});

registerAction({
  id: 'act_lic_carro', group: 'licenca', icon: '🚗', name: 'Carteira de motorista', desc: 'Teste de sinais de trânsito: acerte pelo menos 7 de 10.',
  minAge: 18, cost: 400, cooldown: 1, risk: 'baixo', minigame: 'sinais',
  blocked: (g) => (g.life.licenses.carro ? t('Você já tem a carteira de motorista.') : null),
  onMinigame: (g, r) => {
    if (r.win) {
      g.life.licenses.carro = true;
      showResult(g, { title: t('Carteira de motorista'), icon: '🚗', scene: 'festa', text: t('Você tirou a carteira de motorista! A estrada é sua.'), kind: 'good' });
    } else if (!r.cancelled) showResult(g, { title: t('Carteira de motorista'), icon: '🚗', scene: 'perigo', text: t('Reprovado no teste dos sinais. Estude mais e tente de novo.'), kind: 'bad' });
  },
  en: { name: 'Driver’s license', desc: 'Road signs test: get at least 7 out of 10.' },
});

registerAction({
  id: 'act_lic_lancha', group: 'licenca', icon: '⚓', name: 'Licença náutica (arrais)', desc: 'Exame para conduzir embarcações de lazer.',
  minAge: 18, cost: 800, cooldown: 2, risk: 'baixo', scene: 'natureza',
  blocked: (g) => (g.life.licenses.lancha ? t('Você já tem essa licença.') : null),
  instant: {
    outcomes: [
      { chance: (g) => 0.6 + g.player.stats.inteligencia / 300, text: 'Aprovado! Agora você pode navegar com a bandeira da sua marina.', effects: { stats: { felicidade: 4 }, run: (g) => { g.life.licenses.lancha = true; } } },
      { chance: 1, text: 'Reprovado nas cartas náuticas. Mais uma rodada de estudo.', effects: { stats: { felicidade: -2 } } },
    ],
  },
  en: { name: 'Boating license', desc: 'Exam to operate leisure boats.', instant: { outcomes: ['Passed! Now you can sail under your marina’s flag.', 'Failed the nautical charts. One more round of study.'] } },
});

registerAction({
  id: 'act_lic_aviao', group: 'licenca', icon: '🛩️', name: 'Brevê de piloto', desc: 'Horas de voo, prova teórica e a chance de pilotar o próprio avião.',
  minAge: 18, cost: 12000, cooldown: 3, risk: 'medio', scene: 'natureza',
  blocked: (g) => (g.life.licenses.aviao ? t('Você já tem essa licença.') : null),
  instant: {
    outcomes: [
      { chance: (g) => 0.45 + g.player.stats.inteligencia / 250, text: 'Voo solo concluído! O brevê está no seu bolso.', effects: { stats: { felicidade: 10, carisma: 2 }, run: (g) => { g.life.licenses.aviao = true; } } },
      { chance: 1, text: 'Você foi reprovado no cheque de voo. Muitas horas e muito dinheiro para repetir.', effects: { stats: { felicidade: -4, estresse: 6 } } },
    ],
  },
  en: { name: 'Pilot’s license', desc: 'Flight hours, a written exam and the chance to fly your own plane.', instant: { outcomes: ['Solo flight completed! The license is in your pocket.', 'You failed the flight check. Lots of hours and money to repeat.'] } },
});

registerAction({
  id: 'act_lic_arma', group: 'licenca', icon: '🔫', name: 'Porte de arma', desc: 'Exige ficha limpa. Mudam as opções e os riscos de alguns eventos.',
  minAge: 21, cost: 1500, cooldown: 3, risk: 'medio', scene: 'perigo',
  blocked: (g) => (g.life.crime.weapon ? t('Você já tem essa licença.') : g.life.crime.record > 0 ? t('Antecedentes criminais impedem o porte de arma.') : null),
  instant: { text: 'Documentos aprovados e curso de tiro concluído. Responsabilidade é tudo.', effects: { run: (g) => { g.life.crime.weapon = true; } } },
  en: { name: 'Gun permit', desc: 'Requires a clean record. Changes options and risks in some events.', instant: { text: 'Paperwork approved and shooting course done. Responsibility is everything.' } },
});
