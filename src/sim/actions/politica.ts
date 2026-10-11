import { addEn, t } from '../../i18n';

import { LAWS, OFFICES, PARTIES } from '../data/politics';
import { chance } from '../rng';
import { registerAction, showResult } from '../systems/actions';
import { changeKarma } from '../systems/lifestate';
import {
  acceptBribe, boostSupport, canRun, enactLaw, giveSpeech, joinParty, politicsOf, resign, startCampaign,
} from '../systems/politics';
import type { GameState } from '../types';

addEn({ 'Você não tem um cargo.': 'You do not hold office.' });

const needOffice = (g: GameState) => (politicsOf(g) && politicsOf(g)!.office >= 0 ? null : t('Você não tem um cargo.'));
const needCampaign = (g: GameState) => (politicsOf(g)?.campaign ? null : t('Não há campanha em andamento.'));

registerAction({
  id: 'act_pol_filiar', group: 'politica', icon: '🗳️', name: 'Filiar-se a um partido', desc: 'O primeiro passo da carreira política. Exige ficha limpa.',
  minAge: 18, risk: 'baixo', scene: 'trabalho',
  blocked: (g) => (politicsOf(g) ? t('Você já é filiado a um partido.') : g.life.crime.record > 0 ? t('Ficha limpa é exigida.') : null),
  choices: PARTIES.map((p) => ({
    label: p.name,
    text: p.lean === 0 ? t('Você assinou a ficha de filiação. O centro é um bom lugar para negociar.') : p.lean < 0 ? t('Você assinou a ficha de filiação e vestiu a camisa vermelha da militância.') : t('Você assinou a ficha de filiação e foi apresentado ao diretório do partido.'),
    effects: { run: (g: GameState) => { joinParty(g, p.id); } },
  })),
  en: {
    name: 'Join a party', desc: 'The first step of a political career. A clean record is required.',
    choices: PARTIES.map((p) => ({ label: p.en, text: p.lean === 0 ? 'You signed the membership form. The center is a good place to negotiate.' : p.lean < 0 ? 'You signed the membership form and put on the activist shirt.' : 'You signed the membership form and were introduced to the party board.' })),
  },
});

OFFICES.forEach((o, i) => {
  registerAction({
    id: `act_pol_cand_${i}`, group: 'politica', icon: o.icon, name: `Candidatar-se: ${o.name}`, desc: t('Campanha de seis meses. Custo mínimo para concorrer a {v}.', { v: o.name.toLowerCase() }),
    minAge: o.minAge, cost: o.cost, risk: 'medio', blocked: (g) => canRun(g, i),
    run: (g) => {
      const msg = startCampaign(g, i);
      showResult(g, { title: t(`Candidatar-se: ${o.name}`), icon: o.icon, scene: 'trabalho', text: msg });
      return '';
    },
    en: { name: `Run for: ${o.en}`, desc: `Six-month campaign. Minimum cost to run for ${o.en.toLowerCase()}.` },
  });
});

const campaignAction = (id: string, icon: string, name: string, desc: string, en: { name: string; desc: string }, cost: number, run: (g: GameState) => string, risk: 'baixo' | 'medio' | 'alto' = 'baixo') => {
  registerAction({ id, group: 'campanha', icon, name, desc, minAge: 18, cost, cooldown: 1, risk, blocked: needCampaign, run: (g) => { const text = run(g); showResult(g, { title: t(name), icon, scene: 'festa', text }); return ''; }, en });
};
campaignAction('act_camp_comicio', '📣', 'Fazer um comício', 'Praça cheia, microfone na mão e apoio crescendo.', { name: 'Hold a rally', desc: 'Packed square, microphone in hand and support growing.' }, 3000, (g) => { boostSupport(g, 6 + g.player.stats.carisma / 25); return t('Comício lotado: o apoio cresceu.'); });
campaignAction('act_camp_tv', '📺', 'Propaganda na TV e na internet', 'Alcance enorme, preço idem.', { name: 'TV and internet ads', desc: 'Huge reach, huge price.' }, 12000, (g) => { boostSupport(g, 10); return t('A propaganda na TV colou: o apoio subiu bastante.'); });
campaignAction('act_camp_debate', '🎤', 'Participar de um debate', 'Uma chance de brilhar ou de virar meme.', { name: 'Join a debate', desc: 'A chance to shine or become a meme.' }, 0, (g) => {
  if (chance(g, 0.35 + g.player.stats.carisma / 200 + g.player.stats.inteligencia / 400)) { boostSupport(g, 12); return t('Você foi bem no debate e roubou a cena.'); }
  boostSupport(g, -8);
  return t('Você tropeçou no debate e virou meme.');
}, 'medio');
campaignAction('act_camp_ataque', '🗞️', 'Atacar o adversário', 'Sujo e eficiente, até alguém descobrir.', { name: 'Attack your opponent', desc: 'Dirty and effective, until someone finds out.' }, 0, (g) => {
  if (chance(g, 0.7)) { boostSupport(g, 8); changeKarma(g, -3); return t('O ataque ao adversário funcionou, e você ganhou terreno.'); }
  boostSupport(g, -12);
  changeKarma(g, -5);
  return t('O ataque virou escândalo: você perdeu apoio.');
}, 'alto');

for (const l of LAWS) {
  registerAction({
    id: `act_lei_${l.id}`, group: 'mandato', icon: l.icon, name: l.name, desc: l.desc, minAge: 18, cooldown: 12, risk: 'baixo', blocked: needOffice,
    run: (g) => { const msg = enactLaw(g, l.id); showResult(g, { title: t(l.name), icon: l.icon, scene: 'trabalho', text: msg, kind: 'good' }); return ''; },
    en: { name: l.en, desc: l.enDesc },
  });
}
registerAction({ id: 'act_pol_discurso', group: 'mandato', icon: '🎙️', name: 'Fazer um discurso', desc: 'Fale ao povo e sinta a aprovação mudar.', minAge: 18, cooldown: 1, risk: 'baixo', blocked: needOffice, run: (g) => { const text = giveSpeech(g); showResult(g, { title: t('Fazer um discurso'), icon: '🎙️', scene: 'festa', text }); return ''; }, en: { name: 'Give a speech', desc: 'Speak to the people and watch approval change.' } });
registerAction({ id: 'act_pol_suborno', group: 'mandato', icon: '💼', name: 'Aceitar suborno de lobistas', desc: 'Dinheiro rápido, escândalo à espreita.', minAge: 18, cooldown: 3, risk: 'alto', blocked: needOffice, run: (g) => { const text = acceptBribe(g); if (text) showResult(g, { title: t('Aceitar suborno de lobistas'), icon: '💼', scene: 'dinheiro', text, kind: 'bad' }); return ''; }, en: { name: 'Accept lobbyist bribes', desc: 'Quick money, scandal lurking.' } });
registerAction({ id: 'act_pol_renunciar', group: 'mandato', icon: '🚪', name: 'Renunciar ao cargo', desc: 'Deixa o mandato e volta à vida comum.', minAge: 18, risk: 'baixo', blocked: needOffice, run: (g) => { const text = resign(g); showResult(g, { title: t('Renunciar ao cargo'), icon: '🚪', scene: 'trabalho', text }); return ''; }, en: { name: 'Resign', desc: 'Leave the term and return to ordinary life.' } });

