import { ageYears, changeMoney, clamp } from '../../core';
import { amount, role } from '../binders';
import type { GameState } from '../../types';
import type { Storylet } from '../engine';

const employed = (g: GameState) => !!g.job;
const owner = (g: GameState) => !!g.company;
const firm = (g: GameState, d: { cash?: number; reputation?: number; quality?: number }) => {
  const c = g.company;
  if (!c) return;
  c.cash += d.cash ?? 0;
  c.reputation = clamp(c.reputation + (d.reputation ?? 0));
  c.quality = clamp(c.quality + (d.quality ?? 0));
};

/** Eventos extras: trabalho, dinheiro, bolsa/cripto, empresa e dilemas de caráter. */
export const EXTRA2: Storylet[] = [
  {
    id: 'x_hora_extra', title: 'Hora extra', icon: '🕗', scene: 'trabalho', minAge: 18, maxAge: 65, cooldown: 18,
    when: employed,
    text: 'Seu chefe pede para você ficar até tarde nesta sexta, "só dessa vez". Já é a terceira "só dessa vez" do mês.',
    choices: [
      { label: 'Ficar e fazer o relatório', text: 'Entregou de madrugada. O chefe elogiou e prometeu "lembrar disso".', effects: { stats: { estresse: 6, felicidade: -3 }, money: 120, run: (g) => { if (g.job) g.job.performance = clamp(g.job.performance + 4); } } },
      { label: 'Negociar para compensar na segunda', text: 'Combinado, e você não perdeu o jantar com a família.', effects: { stats: { estresse: 1, carisma: 0.5 } } },
      { label: 'Recusar', text: 'Você foi embora às 18h. O chefe fechou a cara, mas não disse nada.', effects: { stats: { felicidade: 3, estresse: -3 }, run: (g) => { if (g.job) g.job.performance = clamp(g.job.performance - 4); } } },
    ],
    en: { title: 'Overtime', text: 'Your boss asks you to stay late this Friday, “just this once.” It is already the third “just this once” this month.', choices: [{ label: 'Stay and do the report', text: 'You delivered at dawn. The boss praised you and promised to “remember this.”' }, { label: 'Negotiate to make up on Monday', text: 'Deal, and you did not miss dinner with the family.' }, { label: 'Refuse', text: 'You left at 6 p.m. The boss scowled but said nothing.' }] },
  },
  {
    id: 'x_credito_roubado', title: 'Crédito roubado', icon: '😤', scene: 'trabalho', minAge: 20, maxAge: 65, cooldown: 30,
    when: employed,
    bind: { rival: role('colega', 'rival') },
    text: 'Na reunião, {rival.nome} apresentou como sua uma ideia que era sua.',
    choices: [
      { label: 'Confrontar na hora', outcomes: [
        { chance: (g) => 0.4 + g.player.stats.carisma / 250, text: 'Você expôs os e-mails e o chefe reconheceu seu trabalho.', effects: { rel: { rival: -20 }, stats: { carisma: 1 }, run: (g) => { if (g.job) g.job.performance = clamp(g.job.performance + 6); } } },
        { chance: 1, text: 'Ninguém acreditou. Você ficou com fama de reclamão.', effects: { rel: { rival: -15 }, stats: { estresse: 6 } } },
      ] },
      { label: 'Engolir e documentar tudo', text: 'Seus registros viraram munição para uma próxima vez.', effects: { stats: { estresse: 3, inteligencia: 0.5 } } },
      { label: 'Sabotar {rival.nome}', text: 'Um e-mail "errado" e uma planilha corrompida depois, {rival.nome} caiu em desgraça. Você ficou com a consciência pesada.', effects: { karma: -6, rel: { rival: -30 } } },
    ],
    en: { title: 'Stolen credit', text: 'In the meeting, {rival.nome} presented as their own an idea that was yours.', choices: [{ label: 'Confront on the spot', outcomes: ['You showed the emails and the boss recognized your work.', 'Nobody believed you. You got a reputation as a complainer.'] }, { label: 'Swallow it and document everything', text: 'Your records became ammunition for next time.' }, { label: 'Sabotage {rival.nome}', text: 'A "wrong" email and a corrupted spreadsheet later, {rival.nome} fell from grace. Your conscience weighs heavy.' }] },
  },
  {
    id: 'x_proposta_concorrente', title: 'Proposta de outra empresa', icon: '📨', scene: 'trabalho', minAge: 22, maxAge: 58, cooldown: 36,
    when: (g) => employed(g) && !owner(g),
    text: 'Um recrutador mandou mensagem: uma empresa concorrente oferece mais salário e menos burocracia.',
    choices: [
      { label: 'Aceitar a proposta', outcomes: [
        { chance: 0.6, text: 'O novo time é ótimo e o salário também. Valeu o risco.', effects: { money: 800, stats: { felicidade: 6, estresse: -2 } } },
        { chance: 1, text: 'A proposta tinha pegadinhas: metas absurdas e um gerente tóxico.', effects: { stats: { estresse: 9, felicidade: -5 } } },
      ] },
      { label: 'Usar a oferta para negociar aumento', outcomes: [
        { chance: (g) => 0.35 + g.player.stats.carisma / 300, text: 'Seu chefe cobriu a oferta: aumento na hora.', effects: { money: 400, stats: { felicidade: 4 } } },
        { chance: 1, text: '"Se quiser ir, vá." Clima péssimo por semanas.', effects: { stats: { estresse: 5 } } },
      ] },
      { label: 'Recusar por lealdade', text: 'Você valorizou o ambiente em que está.', effects: { karma: 1, stats: { felicidade: 1 } } },
    ],
    en: { title: 'Offer from another company', text: 'A recruiter messaged you: a rival company offers more salary and less bureaucracy.', choices: [{ label: 'Accept the offer', outcomes: ['The new team is great and so is the pay. Worth the risk.', 'The offer had catches: absurd targets and a toxic manager.'] }, { label: 'Use the offer to negotiate a raise', outcomes: ['Your boss matched the offer: raise on the spot.', '“If you want to go, go.” Terrible mood for weeks.'] }, { label: 'Decline out of loyalty', text: 'You valued the environment you are in.' }] },
  },
  {
    id: 'x_reuniao_inutil', title: 'Reunião que poderia ser e-mail', icon: '🪑', scene: 'trabalho', minAge: 20, maxAge: 65, cooldown: 12, weight: 1.3,
    when: employed,
    text: 'Duas horas de reunião para decidir a cor de um botão. A palavra "alinhamento" apareceu 23 vezes.',
    choices: [
      { label: 'Fingir interesse e anotar', text: 'Você ganhou fama de engajad{eu.o}. Ninguém sabe que você desenhou um dragão.', effects: { stats: { estresse: 2, carisma: 0.5 } } },
      { label: 'Sugerir encerrar a reunião', text: 'Houve um silêncio constrangedor e depois aplausos. Você virou herói da sala.', effects: { stats: { carisma: 1, felicidade: 2 } } },
      { label: 'Dormir de olhos abertos', text: 'Tudo ótimo, até te perguntarem algo.', effects: { stats: { estresse: -1, felicidade: -1 } } },
    ],
    en: { title: 'A meeting that could be an email', text: 'Two hours of meeting to decide the color of a button. The word “alignment” came up 23 times.', choices: [{ label: 'Pretend interest and take notes', text: 'You earned a reputation as engaged. Nobody knows you drew a dragon.' }, { label: 'Suggest ending the meeting', text: 'There was an awkward silence and then applause. You became the room’s hero.' }, { label: 'Sleep with eyes open', text: 'All fine, until someone asked you something.' }] },
  },
  {
    id: 'x_burnout', title: 'Sinais de esgotamento', icon: '🔥', scene: 'trabalho', minAge: 22, maxAge: 62, cooldown: 36,
    when: (g) => employed(g) && g.player.stats.estresse >= 60,
    text: 'Você acordou sem vontade de levantar da cama. O trabalho virou um peso físico.',
    choices: [
      { label: 'Tirar uma semana de folga', text: 'Dormir, caminhar, não ler e-mail. Voltou diferente.', effects: { stats: { estresse: -20, felicidade: 8, saude: 3 }, run: (g) => { if (g.job) g.job.performance = clamp(g.job.performance - 3); } } },
      { label: 'Procurar terapia ($250)', hint: '$250', when: (g) => g.money >= 250, text: 'A terapeuta ajudou você a pôr limites. Foi um divisor de águas.', effects: { money: -250, stats: { estresse: -14, felicidade: 7, inteligencia: 0.5 } } },
      { label: 'Aguentar firme', text: 'Você seguiu empurrando. O corpo mandou a conta em forma de dor de cabeça.', effects: { stats: { saude: -6, estresse: 6, felicidade: -4 } } },
    ],
    en: { title: 'Signs of burnout', text: 'You woke up with no desire to leave bed. Work became a physical weight.', choices: [{ label: 'Take a week off', text: 'Sleep, walks, no email. You came back different.' }, { label: 'Seek therapy ($250)', hint: '$250', text: 'The therapist helped you set limits. A turning point.' }, { label: 'Tough it out', text: 'You kept pushing. The body sent the bill as headaches.' }] },
  },
  {
    id: 'x_indicacao_vaga', title: 'Amigo indica vaga', icon: '💼', scene: 'trabalho', minAge: 18, maxAge: 55, cooldown: 30,
    when: (g) => !employed(g) && !owner(g),
    bind: { amigo: role('amigo', 'colega', 'conhecido') },
    text: '{amigo.nome} soube de uma vaga e pode te indicar.',
    choices: [
      { label: 'Aceitar a indicação', text: 'A entrevista foi tranquila, graças ao selo de {amigo.nome}. Começa segunda-feira.', effects: { rel: { amigo: 8 }, stats: { felicidade: 6 }, flags: { indicacaoVaga: true }, money: 600 } },
      { label: 'Preferir conseguir sozinh{eu.o}', text: 'Orgulho intacto, mas o currículo continua circulando.', effects: { stats: { inteligencia: 0.5, estresse: 2 } } },
    ],
    en: { title: 'Friend recommends a job', text: '{amigo.nome} heard of an opening and can recommend you.', choices: [{ label: 'Accept the referral', text: 'The interview was smooth thanks to {amigo.nome}’s endorsement. You start Monday.' }, { label: 'Prefer to get it on your own', text: 'Pride intact, but the resume keeps circulating.' }] },
  },
  {
    id: 'x_corte_pessoal', title: 'Boato de demissões', icon: '🗞️', scene: 'trabalho', minAge: 22, maxAge: 62, cooldown: 36,
    when: (g) => employed(g) && !owner(g),
    text: 'Corre pelo corredor um boato: a empresa vai cortar 15% do pessoal no trimestre.',
    choices: [
      { label: 'Atualizar o currículo discretamente', text: 'Você marcou três entrevistas. Ninguém sabe.', effects: { stats: { estresse: 3, inteligencia: 0.5 } } },
      { label: 'Trabalhar dobrado para se destacar', text: 'Se for cortar alguém, não será você.', effects: { stats: { estresse: 6, saude: -2 }, run: (g) => { if (g.job) g.job.performance = clamp(g.job.performance + 8); } } },
      { label: 'Reservar dinheiro para o pior', hint: '$500', when: (g) => g.money >= 500, text: 'Montou uma reserva de emergência. A noite ficou mais calma.', effects: { stats: { estresse: -4 }, flags: { reservaEmergencia: true } } },
    ],
    en: { title: 'Layoff rumor', text: 'A rumor is going around: the company will cut 15% of staff this quarter.', choices: [{ label: 'Quietly update your resume', text: 'You scheduled three interviews. Nobody knows.' }, { label: 'Work double to stand out', text: 'If someone gets cut, it will not be you.' }, { label: 'Set money aside for the worst', hint: '$500', text: 'You built an emergency reserve. The night got calmer.' }] },
  },
  {
    id: 'x_assedio_testemunha', title: 'Comportamento inaceitável', icon: '⚠️', scene: 'trabalho', minAge: 20, maxAge: 65, cooldown: 48, weight: 0.7,
    when: employed,
    bind: { colega: role('colega') },
    text: 'Você presenciou um supervisor humilhando {colega.nome} na frente da equipe, de novo. {colega.nome} não disse nada.',
    choices: [
      { label: 'Apoiar {colega.nome} e denunciar ao RH', hint: 'Risco para você', outcomes: [
        { chance: 0.55, text: 'O RH abriu investigação e o supervisor foi afastado. {colega.nome} agradeceu emocionad{colega.o}.', effects: { karma: 7, rel: { colega: 25 }, stats: { felicidade: 4 } } },
        { chance: 1, text: 'O RH abafou o caso e você virou alvo de olhares atravessados.', effects: { karma: 7, rel: { colega: 20 }, stats: { estresse: 8 }, run: (g) => { if (g.job) g.job.performance = clamp(g.job.performance - 6); } } },
      ] },
      { label: 'Conversar em particular com {colega.nome}', text: 'Você ofereceu apoio e ajuda. Ajudou, ainda que o problema continuasse.', effects: { karma: 2, rel: { colega: 12 } } },
      { label: 'Não se meter', text: 'Não era com você. Mas a cena ficou na cabeça.', effects: { karma: -3, stats: { felicidade: -2 } } },
    ],
    en: { title: 'Unacceptable behavior', text: 'You witnessed a supervisor humiliating {colega.nome} in front of the team, again. {colega.nome} said nothing.', choices: [{ label: 'Back {colega.nome} and report to HR', hint: 'Risky for you', outcomes: ['HR opened an investigation and the supervisor was removed. {colega.nome} thanked you, moved.', 'HR buried the case and you became the target of sideways looks.'] }, { label: 'Talk privately with {colega.nome}', text: 'You offered support and help. It helped, even though the problem continued.' }, { label: 'Stay out of it', text: 'It was not your business. But the scene stayed in your head.' }] },
  },
  {
    id: 'x_bonus_inesperado', title: 'Bônus inesperado', icon: '🎁', scene: 'dinheiro', minAge: 20, maxAge: 65, cooldown: 24,
    when: (g) => employed(g) && !owner(g),
    bind: { valor: amount(800, 2500, 100) },
    text: 'O RH mandou um e-mail: você recebeu um bônus de {$valor} por bons resultados no trimestre.',
    choices: [
      { label: 'Guardar na poupança', text: 'Seu eu do futuro agradece.', effects: { stats: { estresse: -3, felicidade: 2 }, run: (g, ctx) => { changeMoney(g, Number(ctx.valor)); } } },
      { label: 'Comemorar com amigos', text: 'A noite custou um terço do bônus e rendeu boas fotos.', effects: { stats: { felicidade: 7, carisma: 0.5 }, run: (g, ctx) => { changeMoney(g, Math.round(Number(ctx.valor) * 0.65)); } } },
      { label: 'Investir em um curso', text: 'Foi um bom investimento no seu futuro profissional.', effects: { stats: { inteligencia: 2, felicidade: 2 }, run: (g, ctx) => { changeMoney(g, Math.round(Number(ctx.valor) * 0.4)); } } },
    ],
    en: { title: 'Surprise bonus', text: 'HR sent an email: you received a bonus of {$valor} for strong quarterly results.', choices: [{ label: 'Save it', text: 'Your future self thanks you.' }, { label: 'Celebrate with friends', text: 'The night cost a third of the bonus and gave good photos.' }, { label: 'Invest in a course', text: 'It was a good investment in your professional future.' }] },
  },
  {
    id: 'x_freelance_noite', title: 'Bico à noite', icon: '🌙', scene: 'dinheiro', minAge: 18, maxAge: 60, cooldown: 18,
    when: (g) => g.money < 8000,
    bind: { valor: amount(300, 900, 50) },
    text: 'Surgiu um bico de fim de semana que paga {$valor}. Seria seu único descanso.',
    choices: [
      { label: 'Aceitar o bico', text: 'Cansado e mais rico. Valeu a pena (quase).', effects: { stats: { estresse: 5, saude: -1 }, run: (g, ctx) => { changeMoney(g, Number(ctx.valor)); } } },
      { label: 'Recusar e descansar', text: 'Fim de semana de sofá e série. Nada mal.', effects: { stats: { estresse: -6, felicidade: 4 } } },
    ],
    en: { title: 'Night gig', text: 'A weekend gig came up that pays {$valor}. It would be your only rest.', choices: [{ label: 'Take the gig', text: 'Tired and richer. Worth it (almost).' }, { label: 'Decline and rest', text: 'A weekend of couch and series. Not bad.' }] },
  },
  {
    id: 'x_transferencia', title: 'Transferência de cidade', icon: '✈️', scene: 'trabalho', minAge: 24, maxAge: 55, cooldown: 60, weight: 0.6,
    when: (g) => employed(g) && !owner(g),
    text: 'A empresa oferece uma promoção, mas em outra cidade. Salário maior, longe de tudo que você conhece.',
    choices: [
      { label: 'Aceitar o desafio', text: 'Mudança, caixas, saudade. Mas o contracheque agradeceu.', effects: { money: 1500, stats: { estresse: 7, inteligencia: 1, felicidade: -2, carisma: 1 } } },
      { label: 'Recusar para ficar perto de casa', text: 'A carreira esfriou, mas você manteve sua rotina e as pessoas que ama.', effects: { stats: { felicidade: 4 }, run: (g) => { if (g.job) g.job.performance = clamp(g.job.performance - 3); } } },
    ],
    en: { title: 'City transfer', text: 'The company offers a promotion, but in another city. Higher pay, far from everything you know.', choices: [{ label: 'Accept the challenge', text: 'Move, boxes, homesickness. But the paycheck was grateful.' }, { label: 'Decline to stay near home', text: 'The career cooled, but you kept your routine and the people you love.' }] },
  },
  {
    id: 'x_dica_bolsa', title: 'Dica quente', icon: '📈', scene: 'dinheiro', minAge: 20, maxAge: 85, cooldown: 18,
    when: (g) => g.money >= 3000,
    bind: { amigo: role('amigo', 'colega', 'conhecido'), valor: amount(500, 2000, 100) },
    text: '{amigo.nome} jura que tem uma dica infalível de ação: "Vai dobrar em um mês, confia."',
    choices: [
      { label: 'Apostar {$valor}', hint: 'Dicas nunca são certas', outcomes: [
        { chance: 0.28, text: 'A ação subiu 40%! {amigo.nome} se achou o novo oráculo.', effects: { run: (g, ctx) => { changeMoney(g, Math.round(Number(ctx.valor) * 0.4)); } } },
        { chance: 0.6, text: 'A ação ficou de lado e as taxas comeram o lucro.', effects: { run: (g, ctx) => { changeMoney(g, -Math.round(Number(ctx.valor) * 0.05)); } } },
        { chance: 1, text: 'A empresa soltou um balanço ruim e a ação desabou 35%.', effects: { stats: { estresse: 5 }, run: (g, ctx) => { changeMoney(g, -Math.round(Number(ctx.valor) * 0.35)); } } },
      ] },
      { label: 'Pesquisar antes de decidir', text: 'Você leu o balanço, viu os riscos e preferiu não entrar. Aprendeu algo.', effects: { stats: { inteligencia: 1 } } },
      { label: 'Ignorar', text: 'Mais uma "dica infalível" que você não perdeu.', effects: {} },
    ],
    en: { title: 'Hot tip', text: '{amigo.nome} swears by an infallible stock tip: “It will double in a month, trust me.”', choices: [{ label: 'Bet {$valor}', hint: 'Tips are never certain', outcomes: ['The stock rose 40%! {amigo.nome} thinks they are the new oracle.', 'The stock moved sideways and fees ate the profit.', 'The company released a bad report and the stock crashed 35%.'] }, { label: 'Research before deciding', text: 'You read the report, saw the risks and chose not to join. You learned something.' }, { label: 'Ignore it', text: 'Another “infallible tip” you did not lose on.' }] },
  },
  {
    id: 'x_cripto_hype', title: 'Febre das criptomoedas', icon: '🪙', scene: 'dinheiro', minAge: 18, maxAge: 70, cooldown: 24,
    when: (g) => g.money >= 1200,
    bind: { valor: amount(300, 1000, 100) },
    text: 'Uma moeda digital desconhecida está bombando nas redes. Todo mundo diz que é "o próximo grande salto".',
    choices: [
      { label: 'Comprar {$valor} na euforia', hint: 'Altíssimo risco', outcomes: [
        { chance: 0.2, text: 'A moeda multiplicou por quatro! Você vendeu na hora certa e comemorou.', effects: { run: (g, ctx) => { changeMoney(g, Math.round(Number(ctx.valor) * 3)); } } },
        { chance: 0.55, text: 'A moeda perdeu metade do valor e você vendeu no pânico.', effects: { stats: { estresse: 4 }, run: (g, ctx) => { changeMoney(g, -Math.round(Number(ctx.valor) * 0.5)); } } },
        { chance: 1, text: 'O projeto sumiu da internet. Seu investimento virou pó.', effects: { stats: { estresse: 7, felicidade: -4 }, run: (g, ctx) => { changeMoney(g, -Number(ctx.valor)); } } },
      ] },
      { label: 'Comprar apenas $100 para brincar', hint: '$100', when: (g) => g.money >= 100, outcomes: [
        { chance: 0.3, text: 'Subiu bastante! Foi um lucro pequeno, mas gostoso.', effects: { money: 250 } },
        { chance: 1, text: 'Caiu, mas você já tinha encarado como diversão.', effects: { money: -100 } },
      ] },
      { label: 'Ficar de fora', text: 'Você não entende a moeda, então não entra. Dormiu em paz.', effects: { stats: { inteligencia: 0.5 } } },
    ],
    en: { title: 'Crypto fever', text: 'An unknown digital coin is booming on social media. Everyone says it is “the next big leap.”', choices: [{ label: 'Buy {$valor} in the euphoria', hint: 'Sky-high risk', outcomes: ['The coin quadrupled! You sold at the right time and celebrated.', 'The coin lost half its value and you sold in a panic.', 'The project vanished from the internet. Your investment turned to dust.'] }, { label: 'Buy only $100 for fun', hint: '$100', outcomes: ['It rose a lot! A small but pleasant profit.', 'It fell, but you had already treated it as entertainment.'] }, { label: 'Stay out', text: 'You do not understand the coin, so you do not enter. You slept in peace.' }] },
  },
  {
    id: 'x_piramide', title: 'Oportunidade única', icon: '🔺', scene: 'perigo', minAge: 20, maxAge: 70, cooldown: 48, weight: 0.8,
    bind: { amigo: role('amigo', 'conhecido', 'colega') },
    text: '{amigo.nome} te convida para uma "oportunidade de negócio" com palestras motivacionais e promessa de renda passiva. Você só precisa recrutar amigos.',
    choices: [
      { label: 'Entrar com $500', hint: '$500', when: (g) => g.money >= 500, outcomes: [
        { chance: 0.12, text: 'Você saiu a tempo e ainda ganhou um pouco. Sorte de principiante.', effects: { money: 200, karma: -3 } },
        { chance: 1, text: 'O esquema caiu e você perdeu tudo. Pior: indicou outros.', effects: { money: -500, karma: -4, rel: { amigo: -8 }, stats: { estresse: 6 } } },
      ] },
      { label: 'Recusar e alertar os amigos', text: 'Você explicou os riscos. Alguns te ouviram, outros te chamaram de pessimista.', effects: { karma: 3, rel: { amigo: -4 } } },
      { label: 'Denunciar à polícia', text: 'A polícia investigou e o esquema foi desmantelado meses depois.', effects: { karma: 4, rel: { amigo: -20 } } },
    ],
    en: { title: 'One-time opportunity', text: '{amigo.nome} invites you to a “business opportunity” with motivational talks and promises of passive income. You only need to recruit friends.', choices: [{ label: 'Join with $500', hint: '$500', outcomes: ['You got out in time and even profited a bit. Beginner’s luck.', 'The scheme collapsed and you lost everything. Worse: you recruited others.'] }, { label: 'Decline and warn your friends', text: 'You explained the risks. Some listened, others called you a pessimist.' }, { label: 'Report to the police', text: 'The police investigated and the scheme was dismantled months later.' }] },
  },
  {
    id: 'x_heranca_tia', title: 'Herança inesperada', icon: '📜', scene: 'dinheiro', minAge: 25, maxAge: 80, once: true, weight: 0.4,
    text: 'Um advogado liga: uma tia-avó distante que você mal conhecia deixou uma pequena herança em seu nome.',
    choices: [
      { label: 'Aceitar a herança', text: 'Entre o cartório e os impostos, sobrou uma quantia razoável.', effects: { money: 3500, stats: { felicidade: 5 } } },
      { label: 'Dividir com primos que ficaram de fora', text: 'Ninguém esperava a generosidade. A família passou a te ver com outros olhos.', effects: { money: 2000, karma: 5, stats: { felicidade: 6 } } },
    ],
    en: { title: 'Unexpected inheritance', text: 'A lawyer calls: a distant great-aunt you barely knew left a small inheritance in your name.', choices: [{ label: 'Accept the inheritance', text: 'Between the notary and taxes, a reasonable sum remained.' }, { label: 'Share with cousins who were left out', text: 'Nobody expected the generosity. The family saw you with new eyes.' }] },
  },
  {
    id: 'x_malha_fina', title: 'Malha fina', icon: '🧾', scene: 'dinheiro', minAge: 22, maxAge: 85, cooldown: 48,
    when: (g) => g.money >= 5000,
    text: 'A Receita notificou: há inconsistências na sua declaração do ano passado.',
    choices: [
      { label: 'Contratar contador ($300)', hint: '$300', when: (g) => g.money >= 300, text: 'O contador achou o erro, pagou a multa pequena e resolveu.', effects: { money: -500, stats: { estresse: 3 } } },
      { label: 'Resolver sozinho', outcomes: [
        { chance: (g) => 0.3 + g.player.stats.inteligencia / 250, text: 'Você corrigiu os dados e evitou a multa.', effects: { stats: { estresse: 4, inteligencia: 0.5 } } },
        { chance: 1, text: 'Piorou: multa cheia e noites mal dormidas.', effects: { money: -900, stats: { estresse: 8 } } },
      ] },
      { label: 'Ignorar a notificação', text: 'A multa cresceu com juros. Você fingiu que não era com você.', effects: { money: -1500, karma: -2, stats: { estresse: 6 } } },
    ],
    en: { title: 'Tax audit', text: 'The tax agency notified you: there are inconsistencies in last year’s return.', choices: [{ label: 'Hire an accountant ($300)', hint: '$300', text: 'The accountant found the error, paid the small fine and sorted it out.' }, { label: 'Handle it yourself', outcomes: ['You fixed the data and avoided the fine.', 'It got worse: full fine and sleepless nights.'] }, { label: 'Ignore the notice', text: 'The fine grew with interest. You pretended it was not about you.' }] },
  },
  {
    id: 'x_carro_quebrou', title: 'Carro no prego', icon: '🚗', scene: 'dinheiro', minAge: 20, maxAge: 85, cooldown: 24,
    when: (g) => g.money >= 800,
    text: 'No meio da avenida, seu carro engasga, solta fumaça e para. O mecânico faz careta ao ver o motor.',
    choices: [
      { label: 'Consertar tudo ($900)', hint: '$900', when: (g) => g.money >= 900, text: 'Carro novo em folha (quase). Foi dolorido para o bolso.', effects: { money: -900, stats: { estresse: 3 } } },
      { label: 'Gambiarra barata ($250)', hint: '$250', when: (g) => g.money >= 250, outcomes: [
        { chance: 0.5, text: 'O remendo segurou por meses.', effects: { money: -250 } },
        { chance: 1, text: 'A gambiarra falhou duas semanas depois e você pagou o conserto completo.', effects: { money: -1150, stats: { estresse: 5 } } },
      ] },
      { label: 'Vender como sucata', text: 'Você virou usuário de transporte público. Descobriu um mundo novo.', effects: { money: 400, stats: { felicidade: -1, saude: 1 } } },
    ],
    en: { title: 'Car in the shop', text: 'In the middle of the avenue, your car chokes, smokes and stops. The mechanic grimaces at the engine.', choices: [{ label: 'Fix everything ($900)', hint: '$900', text: 'Like new (almost). Painful for the wallet.' }, { label: 'Cheap patch ($250)', hint: '$250', outcomes: ['The patch held for months.', 'The patch failed two weeks later and you paid for the full repair.'] }, { label: 'Sell it for scrap', text: 'You became a public transport user. You discovered a new world.' }] },
  },
  {
    id: 'x_golpe_mensagem', title: 'Mensagem suspeita', icon: '📲', scene: 'perigo', minAge: 14, maxAge: 90, cooldown: 24,
    text: 'Chegou uma mensagem de um número desconhecido: "Mãe, mudei de número, pode me fazer um Pix? É urgente."',
    choices: [
      { label: 'Fazer o Pix de $300', hint: '$300', when: (g) => g.money >= 300, text: 'Era golpe. O dinheiro sumiu em minutos.', effects: { money: -300, stats: { estresse: 6, felicidade: -3 } } },
      { label: 'Ligar para confirmar', text: 'Você ligou e a pessoa verdadeira estava em casa. Golpe evitado!', effects: { stats: { inteligencia: 0.5 } } },
      { label: 'Bloquear e denunciar', text: 'Você aproveitou para avisar a família sobre o golpe.', effects: { karma: 1, stats: { inteligencia: 0.5 } } },
    ],
    en: { title: 'Suspicious message', text: 'A message arrived from an unknown number: “Mom, I changed numbers, can you send me money? It is urgent.”', choices: [{ label: 'Send $300', hint: '$300', text: 'It was a scam. The money vanished in minutes.' }, { label: 'Call to confirm', text: 'You called and the real person was at home. Scam avoided!' }, { label: 'Block and report', text: 'You took the chance to warn the family about the scam.' }] },
  },
  {
    id: 'x_empresa_talento', title: 'Talento na porta', icon: '🧑‍💻', scene: 'negocio', minAge: 21, maxAge: 75, cooldown: 24,
    when: owner,
    text: 'Um profissional brilhante pede emprego na {empresa}, mas exige um salário alto e autonomia.',
    choices: [
      { label: 'Contratar com o pacote completo ($1.200)', hint: '$1.200', when: (g) => !!g.company && g.company.cash >= 1200, text: 'A nova contratação trouxe ideias novas e energia à equipe.', effects: { run: (g) => { firm(g, { cash: -1200, quality: 4, reputation: 2 }); if (g.company) g.company.employees += 1; } } },
      { label: 'Oferecer metade do salário', outcomes: [
        { chance: 0.4, text: 'Ele aceitou, com uma cara meio torta, e se dedicou mesmo assim.', effects: { run: (g) => { firm(g, { quality: 2 }); if (g.company) g.company.employees += 1; } } },
        { chance: 1, text: 'Ele recusou e foi para a concorrência.', effects: { stats: { estresse: 2 } } },
      ] },
      { label: 'Agradecer e dispensar', text: 'Você achou arriscado aumentar a folha agora.', effects: {} },
    ],
    en: { title: 'Talent at the door', text: 'A brilliant professional asks for a job at {empresa}, but demands a high salary and autonomy.', choices: [{ label: 'Hire with the full package ($1.200)', hint: '$1.200', text: 'The new hire brought new ideas and energy to the team.' }, { label: 'Offer half the salary', outcomes: ['They accepted, with a crooked smile, and worked hard anyway.', 'They declined and went to the competition.'] }, { label: 'Thank and dismiss', text: 'You found it risky to increase payroll right now.' }] },
  },
  {
    id: 'x_empresa_fiscal', title: 'Visita da fiscalização', icon: '🕵️', scene: 'negocio', minAge: 21, maxAge: 75, cooldown: 36,
    when: owner,
    text: 'Dois fiscais apareceram na {empresa} sem avisar, com pranchetas e olhares atentos.',
    choices: [
      { label: 'Mostrar tudo com transparência', outcomes: [
        { chance: 0.7, text: 'Tudo em ordem. Eles elogiaram a organização e foram embora.', effects: { karma: 2, run: (g) => { firm(g, { reputation: 2 }); } } },
        { chance: 1, text: 'Acharam uma pendência pequena. Multa leve e nota de advertência.', effects: { run: (g) => { firm(g, { cash: -400 }); } } },
      ] },
      { label: 'Tentar um "agrado"', hint: 'Ilegal', outcomes: [
        { chance: 0.4, text: 'O fiscal fez vista grossa, mas você ficou com a sensação de sujeira.', effects: { karma: -6, run: (g) => { firm(g, { cash: -300 }); } } },
        { chance: 1, text: 'O fiscal anotou a tentativa de suborno. Multa pesada.', effects: { karma: -6, run: (g) => { firm(g, { cash: -2500, reputation: -8 }); } } },
      ] },
    ],
    en: { title: 'Inspection visit', text: 'Two inspectors showed up at {empresa} unannounced, with clipboards and watchful eyes.', choices: [{ label: 'Show everything transparently', outcomes: ['All in order. They praised the organization and left.', 'They found a small pending issue. Light fine and a warning notice.'] }, { label: 'Try a "gift"', hint: 'Illegal', outcomes: ['The inspector turned a blind eye, but you felt dirty.', 'The inspector noted the bribery attempt. Heavy fine.'] }] },
  },
  {
    id: 'x_empresa_anjo', title: 'Investidor-anjo', icon: '👼', scene: 'negocio', minAge: 21, maxAge: 65, cooldown: 48, weight: 0.6,
    when: (g) => owner(g) && (g.company?.reputation ?? 0) >= 45,
    text: 'Uma investidora ouviu falar da {empresa} e propõe aportar dinheiro em troca de palpite em todas as decisões.',
    choices: [
      { label: 'Aceitar o aporte de $8.000', hint: '$8.000', text: 'Caixa reforçado, mas agora toda decisão passa por uma segunda opinião.', effects: { stats: { estresse: 3 }, run: (g) => { firm(g, { cash: 8000, reputation: 2 }); } } },
      { label: 'Recusar para manter o controle', text: 'A empresa segue 100% sua, para o bem e para o mal.', effects: { stats: { felicidade: 2 } } },
    ],
    en: { title: 'Angel investor', text: 'An investor heard about {empresa} and proposes to inject money in exchange for a say in every decision.', choices: [{ label: 'Accept the $8.000 investment', hint: '$8.000', text: 'Cash reinforced, but now every decision goes through a second opinion.' }, { label: 'Decline to keep control', text: 'The company stays 100% yours, for better or worse.' }] },
  },
  {
    id: 'x_empresa_reclamacao', title: 'Cliente furioso', icon: '😡', scene: 'negocio', minAge: 21, maxAge: 75, cooldown: 24,
    when: owner,
    text: 'Um cliente publicou um vídeo reclamando da {empresa}. Já tem milhares de visualizações.',
    choices: [
      { label: 'Responder com humildade e resolver', outcomes: [
        { chance: (g) => 0.5 + g.player.stats.carisma / 300, text: 'O cliente voltou ao vídeo para agradecer. A empresa ganhou pontos de confiança.', effects: { run: (g) => { firm(g, { reputation: 4, cash: -150 }); } } },
        { chance: 1, text: 'O pedido de desculpas foi aceito, mas o vídeo continuou circulando.', effects: { run: (g) => { firm(g, { reputation: -1, cash: -150 }); } } },
      ] },
      { label: 'Processar por difamação', text: 'Mal vista pelo público, a empresa virou assunto nas redes.', effects: { karma: -2, run: (g) => { firm(g, { reputation: -6, cash: -500 }); } } },
      { label: 'Ignorar', text: 'O assunto morreu em uma semana, mas deixou um gosto ruim.', effects: { run: (g) => { firm(g, { reputation: -3 }); } } },
    ],
    en: { title: 'Furious customer', text: 'A customer posted a video complaining about {empresa}. It already has thousands of views.', choices: [{ label: 'Respond with humility and fix it', outcomes: ['The customer returned to the video to say thanks. The company gained trust.', 'The apology was accepted, but the video kept circulating.'] }, { label: 'Sue for defamation', text: 'Poorly seen by the public, the company became a social media topic.' }, { label: 'Ignore it', text: 'The topic died within a week but left a bad taste.' }] },
  },
  {
    id: 'x_empresa_copia', title: 'Concorrente copiou', icon: '🪞', scene: 'negocio', minAge: 21, maxAge: 70, cooldown: 48, weight: 0.7,
    when: owner,
    text: 'Um concorrente lançou um produto praticamente idêntico ao da {empresa}, com preço menor.',
    choices: [
      { label: 'Baixar o preço e competir', text: 'A margem apertou, mas os clientes ficaram.', effects: { stats: { estresse: 4 }, run: (g) => { firm(g, { cash: -600, reputation: 1 }); } } },
      { label: 'Investir em qualidade ($1.000)', hint: '$1.000', when: (g) => !!g.company && g.company.cash >= 1000, text: 'Seu produto ficou claramente superior. Quem copia não alcança.', effects: { run: (g) => { firm(g, { cash: -1000, quality: 6, reputation: 3 }); } } },
      { label: 'Ignorar a cópia', text: 'Você apostou que o mercado percebe a diferença. Em parte, percebeu.', effects: { run: (g) => { firm(g, { reputation: -2 }); } } },
    ],
    en: { title: 'Competitor copied you', text: 'A competitor launched a nearly identical product to {empresa}’s, at a lower price.', choices: [{ label: 'Lower the price and compete', text: 'Margins tightened, but customers stayed.' }, { label: 'Invest in quality ($1.000)', hint: '$1.000', text: 'Your product became clearly superior. Copycats cannot catch up.' }, { label: 'Ignore the copy', text: 'You bet the market notices the difference. It partly did.' }] },
  },
  {
    id: 'x_carteira_achada', title: 'Carteira no chão', icon: '👛', scene: 'dinheiro', minAge: 8, maxAge: 90, cooldown: 36,
    text: 'No banco da praça, você encontra uma carteira com documentos e $400 em dinheiro. Ninguém por perto.',
    choices: [
      { label: 'Devolver ao dono', text: 'O dono quase chorou de alívio e te agradeceu mil vezes. A recompensa foi o abraço.', effects: { karma: 6, stats: { felicidade: 5 }, money: 40 } },
      { label: 'Ficar com o dinheiro e devolver os documentos', text: 'Metade do problema resolvido. A outra metade pesou na consciência.', effects: { karma: -3, money: 400 } },
      { label: 'Ficar com tudo', text: 'Você gastou o dinheiro em dois dias. A culpa durou mais.', effects: { karma: -7, money: 400, stats: { felicidade: -2 } } },
    ],
    en: { title: 'Wallet on the ground', text: 'On a park bench, you find a wallet with documents and $400 in cash. Nobody around.', choices: [{ label: 'Return it to the owner', text: 'The owner nearly cried with relief and thanked you a thousand times. The reward was the hug.' }, { label: 'Keep the cash and return the documents', text: 'Half the problem solved. The other half weighed on your conscience.' }, { label: 'Keep everything', text: 'You spent the money in two days. The guilt lasted longer.' }] },
  },
  {
    id: 'x_troco_errado', title: 'Troco a mais', icon: '🪙', scene: 'dinheiro', minAge: 8, maxAge: 90, cooldown: 24,
    text: 'No caixa do mercado, o atendente te devolveu $50 a mais de troco. Ele nem percebeu.',
    choices: [
      { label: 'Avisar e devolver', text: 'O atendente agradeceu aliviado. Dizem que um erro daquele sai do salário dele.', effects: { karma: 3, stats: { felicidade: 2 } } },
      { label: 'Sair de fininho', text: 'Pequeno lucro, pequena culpa.', effects: { karma: -2, money: 50 } },
    ],
    en: { title: 'Extra change', text: 'At the supermarket checkout, the cashier gave you $50 too much in change. He did not even notice.', choices: [{ label: 'Tell him and give it back', text: 'The cashier thanked you, relieved. They say a mistake like that comes out of his pay.' }, { label: 'Slip away', text: 'Small profit, small guilt.' }] },
  },
  {
    id: 'x_doacao', title: 'Pedido de doação', icon: '🤲', scene: 'casa', minAge: 14, maxAge: 95, cooldown: 24,
    text: 'Uma instituição de caridade faz uma campanha de arrecadação no seu bairro.',
    choices: [
      { label: 'Doar $100', hint: '$100', when: (g) => g.money >= 100, text: 'Pouco para você, muito para quem recebe.', effects: { money: -100, karma: 4, stats: { felicidade: 4 } } },
      { label: 'Doar tempo, como voluntário', text: 'Passou o sábado organizando cestas básicas. Cansou, mas voltou com a alma leve.', effects: { karma: 5, stats: { felicidade: 6, estresse: -3, carisma: 1 } } },
      { label: 'Passar direto', text: 'Hoje não deu. Quem sabe amanhã.', effects: {} },
    ],
    en: { title: 'Donation request', text: 'A charity is running a fundraising campaign in your neighborhood.', choices: [{ label: 'Donate $100', hint: '$100', text: 'Little for you, a lot for those who receive it.' }, { label: 'Donate time as a volunteer', text: 'You spent Saturday organizing food baskets. Tiring, but you left with a light soul.' }, { label: 'Walk past', text: 'Not today. Maybe tomorrow.' }] },
  },
  {
    id: 'x_aluguel_sobe', title: 'Reajuste do aluguel', icon: '📈', scene: 'casa', minAge: 20, maxAge: 85, cooldown: 36,
    when: (g) => !g.livesWithParents && ageYears(g) >= 20,
    text: 'O proprietário avisa: o aluguel vai subir 20% no próximo contrato.',
    choices: [
      { label: 'Aceitar o reajuste', text: 'Mais uma conta pesando todo mês.', effects: { money: -300, stats: { estresse: 3 } } },
      { label: 'Negociar', hint: 'Carisma ajuda', outcomes: [
        { chance: (g) => 0.3 + g.player.stats.carisma / 250, text: 'Conseguiu um reajuste menor, de 8%.', effects: { money: -100 } },
        { chance: 1, text: '"Não tem negociação." Você aceitou os 20%.', effects: { money: -300, stats: { estresse: 4 } } },
      ] },
      { label: 'Procurar outro lugar', text: 'Foram semanas visitando apartamentos minúsculos e caros.', effects: { money: -200, stats: { estresse: 7, felicidade: -2 } } },
    ],
    en: { title: 'Rent hike', text: 'The landlord says: rent will go up 20% in the next contract.', choices: [{ label: 'Accept the hike', text: 'One more bill weighing every month.' }, { label: 'Negotiate', hint: 'Charisma helps', outcomes: ['You got a smaller hike, 8%.', '“No negotiation.” You accepted the 20%.'] }, { label: 'Look for another place', text: 'Weeks of visiting tiny, expensive apartments.' }] },
  },
  {
    id: 'x_promocao_irresistivel', title: 'Liquidação', icon: '🛍️', scene: 'dinheiro', minAge: 16, maxAge: 85, cooldown: 12, weight: 1.2,
    when: (g) => g.money >= 400,
    text: 'Anúncio piscando no celular: "Liquidação de 70% por 24 horas." Uma TV enorme custa só $600.',
    choices: [
      { label: 'Comprar a TV', text: 'Sua sala virou um cinema. Você esqueceu que não precisava de TV.', effects: { money: -600, stats: { felicidade: 5 } } },
      { label: 'Resistir', text: 'Fechou o app e pensou duas vezes. Economizou e se sentiu esperto.', effects: { stats: { inteligencia: 0.5, felicidade: 1 } } },
    ],
    en: { title: 'Flash sale', text: 'Blinking ad on your phone: “70% off for 24 hours.” A huge TV costs only $600.', choices: [{ label: 'Buy the TV', text: 'Your living room became a cinema. You forgot you did not need a TV.' }, { label: 'Resist', text: 'You closed the app and thought twice. You saved and felt clever.' }] },
  },
];
