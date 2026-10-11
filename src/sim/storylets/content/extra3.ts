import { clamp } from '../../core';
import { attemptCrime } from '../../systems/crime';
import { addAddiction, addictionLevel } from '../../systems/health';
import { politicsOf } from '../../systems/politics';
import { queueDeath } from '../../systems/lifestate';
import { addPet } from '../../systems/pets';
import { chance } from '../../rng';
import { role } from '../binders';
import type { GameState } from '../../types';
import type { Storylet } from '../engine';

const hasPet = (g: GameState) => g.life.pets.length > 0;
const petName = (g: GameState) => g.life.pets[0]?.name ?? null;
const bond = (g: GameState, d: number) => { const p = g.life.pets[0]; if (p) p.bond = clamp(p.bond + d); };
const inOffice = (g: GameState) => !!politicsOf(g) && politicsOf(g)!.office >= 0;
const approve = (g: GameState, d: number) => { const p = politicsOf(g); if (p) p.approval = clamp(p.approval + d); };

/** Eventos extras: viagem, pets, saúde, vício, crime e política. */
export const EXTRA3: Storylet[] = [
  {
    id: 'x_mala_extraviada', title: 'Mala extraviada', icon: '🧳', scene: 'natureza', minAge: 16, maxAge: 85, cooldown: 30,
    when: (g) => g.life.travel.visited.length > 0 && g.money >= 600,
    text: 'Você aterrissou, mas sua mala foi parar em outro continente. O guichê de reclamações tem uma fila de duas horas.',
    choices: [
      { label: 'Comprar roupas novas ($300)', hint: '$300', text: 'Você virou o turista mais bem vestido do aeroporto. A mala chegou três dias depois.', effects: { money: -300, stats: { estresse: 2, felicidade: 2 } } },
      { label: 'Esperar a companhia aérea', outcomes: [
        { chance: 0.6, text: 'A mala chegou no hotel no dia seguinte, com um vale de desculpas.', effects: { money: 80, stats: { estresse: 3 } } },
        { chance: 1, text: 'A mala só voltou após a viagem. Você lavou a mesma camiseta quatro vezes.', effects: { stats: { estresse: 7, felicidade: -3 } } },
      ] },
    ],
    en: { title: 'Lost luggage', text: 'You landed, but your suitcase ended up on another continent. The complaints desk has a two-hour line.', choices: [{ label: 'Buy new clothes ($300)', hint: '$300', text: 'You became the best-dressed tourist at the airport. The suitcase arrived three days later.' }, { label: 'Wait for the airline', outcomes: ['The suitcase reached the hotel the next day, with an apology voucher.', 'The suitcase only came back after the trip. You washed the same shirt four times.'] }] },
  },
  {
    id: 'x_trilha_perdida', title: 'Trilha errada', icon: '🥾', scene: 'natureza', minAge: 12, maxAge: 70, cooldown: 36,
    text: 'Numa trilha de domingo, você percebe que o caminho sumiu e o sol está baixando.',
    choices: [
      { label: 'Voltar pelo mesmo caminho', text: 'Demorou, mas você refez os passos e chegou ao carro antes do escuro.', effects: { stats: { inteligencia: 0.5, estresse: 3 } } },
      { label: 'Seguir o som de água', outcomes: [
        { chance: 0.5, text: 'Chegou a uma cachoeira linda e achou a trilha de volta.', effects: { stats: { felicidade: 7, saude: 1 } } },
        { chance: 1, text: 'Caiu num barranco, machucou o tornozelo e foi resgatad{eu.o} à noite.', effects: { stats: { saude: -8, estresse: 8 }, money: -150 } },
      ] },
    ],
    en: { title: 'Wrong trail', text: 'On a Sunday hike, you realize the path has vanished and the sun is setting.', choices: [{ label: 'Retrace your steps', text: 'It took a while, but you retraced your steps and reached the car before dark.' }, { label: 'Follow the sound of water', outcomes: ['You reached a beautiful waterfall and found the trail back.', 'You fell down a slope, hurt your ankle and were rescued at night.'] }] },
  },
  {
    id: 'x_viagem_golpe_turista', title: 'Golpe de turista', icon: '🗺️', scene: 'perigo', minAge: 18, maxAge: 80, cooldown: 36,
    when: (g) => g.life.travel.visited.length > 0,
    text: 'Um simpático "guia" oferece um passeio exclusivo por $200 "só para você, só hoje".',
    choices: [
      { label: 'Pagar o passeio', hint: '$200', when: (g) => g.money >= 200, outcomes: [
        { chance: 0.4, text: 'Foi o melhor passeio da viagem, com vistas que nenhum guia mostra.', effects: { money: -200, stats: { felicidade: 8 } } },
        { chance: 1, text: 'Era golpe: ele sumiu com o dinheiro na primeira esquina.', effects: { money: -200, stats: { estresse: 4, felicidade: -3 } } },
      ] },
      { label: 'Recusar e ir ao centro de informações', text: 'O passeio oficial foi mais barato e confiável.', effects: { money: -80, stats: { inteligencia: 0.5, felicidade: 3 } } },
    ],
    en: { title: 'Tourist scam', text: 'A friendly “guide” offers an exclusive tour for $200, “just for you, just today.”', choices: [{ label: 'Pay for the tour', hint: '$200', outcomes: ['It was the best tour of the trip, with views no guide shows.', 'It was a scam: he vanished with the money at the first corner.'] }, { label: 'Decline and visit the info center', text: 'The official tour was cheaper and trustworthy.' }] },
  },
  {
    id: 'x_pet_sumiu', title: 'Cadê o bichinho?', icon: '🔍', scene: 'casa', minAge: 6, maxAge: 95, cooldown: 36,
    when: hasPet,
    bind: { pet: petName },
    text: '{pet} sumiu de casa. A porta ficou aberta por alguns minutos.',
    choices: [
      { label: 'Sair gritando pelo bairro', outcomes: [
        { chance: 0.7, text: '{pet} apareceu embaixo de um carro, assustad{eu.o} mas inteiro. Abraço apertado!', effects: { stats: { estresse: 4, felicidade: 5 }, run: (g) => { bond(g, 8); } } },
        { chance: 1, text: 'Foram dois dias de angústia, até um vizinho ligar: {pet} estava na casa dele.', effects: { stats: { estresse: 8 }, run: (g) => { bond(g, 4); } } },
      ] },
      { label: 'Colar cartazes ($40)', hint: '$40', when: (g) => g.money >= 40, text: 'Os cartazes funcionaram. {pet} voltou no dia seguinte.', effects: { money: -40, stats: { estresse: 3 }, run: (g) => { bond(g, 5); } } },
    ],
    en: { title: 'Where is the pet?', text: '{pet} vanished from home. The door was open for a few minutes.', choices: [{ label: 'Go shouting around the neighborhood', outcomes: ['{pet} showed up under a car, scared but unharmed. Big hug!', 'Two days of anguish, until a neighbor called: {pet} was at his house.'] }, { label: 'Put up posters ($40)', hint: '$40', text: 'The posters worked. {pet} came back the next day.' }] },
  },
  {
    id: 'x_pet_veterinario', title: 'Veterinário de emergência', icon: '🏥', scene: 'saude', minAge: 6, maxAge: 95, cooldown: 36,
    when: hasPet,
    bind: { pet: petName },
    text: '{pet} comeu algo que não devia e passou mal de madrugada.',
    choices: [
      { label: 'Levar à emergência ($500)', hint: '$500', when: (g) => g.money >= 500, text: '{pet} se recuperou depois de uma noite de soro e carinho.', effects: { money: -500, run: (g) => { bond(g, 10); if (g.life.pets[0]) g.life.pets[0].health = clamp(g.life.pets[0].health + 20); } } },
      { label: 'Tentar cuidar em casa', outcomes: [
        { chance: 0.6, text: '{pet} melhorou com água e repouso.', effects: { run: (g) => { bond(g, 4); } } },
        { chance: 1, text: '{pet} piorou e você correu ao veterinário no dia seguinte, tarde demais para evitar um tratamento longo.', effects: { money: -900, stats: { estresse: 7 }, run: (g) => { if (g.life.pets[0]) g.life.pets[0].health = clamp(g.life.pets[0].health - 15); } } },
      ] },
    ],
    en: { title: 'Emergency vet', text: '{pet} ate something it should not have and got sick in the early hours.', choices: [{ label: 'Rush to the emergency vet ($500)', hint: '$500', text: '{pet} recovered after a night of fluids and cuddles.' }, { label: 'Try caring at home', outcomes: ['{pet} improved with water and rest.', '{pet} got worse and you ran to the vet the next day, too late to avoid a long treatment.'] }] },
  },
  {
    id: 'x_pet_travesso', title: 'Estrago de estimação', icon: '🐾', scene: 'casa', minAge: 6, maxAge: 95, cooldown: 24, weight: 1.2,
    when: hasPet,
    bind: { pet: petName },
    text: 'Você chegou em casa e viu {pet} rodeado de almofada destruída e um ar muito inocente.',
    choices: [
      { label: 'Rir e filmar', text: 'O vídeo ganhou milhares de curtidas. {pet} virou celebridade local.', effects: { stats: { felicidade: 5, carisma: 0.5 }, run: (g) => { bond(g, 3); } } },
      { label: 'Dar bronca', text: '{pet} baixou as orelhas por uma hora. Depois esqueceu.', effects: { stats: { estresse: 2 }, run: (g) => { bond(g, -2); } } },
      { label: 'Comprar brinquedo para distrair ($30)', hint: '$30', when: (g) => g.money >= 30, text: 'Bem melhor: agora o brinquedo é que está destruído.', effects: { money: -30, run: (g) => { bond(g, 4); } } },
    ],
    en: { title: 'Pet mischief', text: 'You got home and saw {pet} surrounded by a destroyed cushion and a very innocent look.', choices: [{ label: 'Laugh and film it', text: 'The video got thousands of likes. {pet} became a local celebrity.' }, { label: 'Scold', text: '{pet} lowered its ears for an hour. Then forgot.' }, { label: 'Buy a toy to distract ($30)', hint: '$30', text: 'Much better: now the toy is the one destroyed.' }] },
  },
  {
    id: 'x_adotar_vira_lata', title: 'Olhar na vitrine', icon: '🐶', scene: 'casa', minAge: 8, maxAge: 85, cooldown: 36,
    when: (g) => !hasPet(g) && !g.livesWithParents,
    text: 'Numa feira de adoção, um filhote de olhos tristes não para de olhar para você.',
    choices: [
      { label: 'Levar para casa', text: 'Vida bagunçada, ração e xixi no tapete. E um companheiro novo.', effects: { karma: 3, stats: { felicidade: 8, estresse: -2 }, money: -120, run: (g) => { addPet(g, 'cachorro'); } } },
      { label: 'Fazer uma doação e seguir', text: 'Doou um pouco para a ONG. O filhote achou outro lar na semana seguinte.', effects: { karma: 2, money: -40 } },
      { label: 'Resistir', text: 'Você não tem condições agora. Mas pensou no filhote por dias.', effects: { stats: { felicidade: -1 } } },
    ],
    en: { title: 'Window gaze', text: 'At an adoption fair, a sad-eyed puppy will not stop looking at you.', choices: [{ label: 'Take it home', text: 'Messy life, kibble and puddles on the rug. And a new companion.' }, { label: 'Make a donation and move on', text: 'You gave a little to the charity. The puppy found a home the following week.' }, { label: 'Resist', text: 'You are not ready now. But you thought about the puppy for days.' }] },
  },
  {
    id: 'x_check_up_susto', title: 'Exame com resultado estranho', icon: '🩺', scene: 'saude', minAge: 30, maxAge: 85, cooldown: 36,
    text: 'O médico liga: um exame de rotina veio com um resultado "para investigar melhor".',
    choices: [
      { label: 'Investigar logo ($350)', hint: '$350', when: (g) => g.money >= 350, text: 'Era um alarme falso. Mas o susto fez você reorganizar prioridades.', effects: { money: -350, stats: { estresse: 4, felicidade: 3 } } },
      { label: 'Deixar para depois', text: 'Você adiou, e a angústia ficou de companhia por semanas.', effects: { stats: { estresse: 8, felicidade: -3 } } },
    ],
    en: { title: 'Odd exam result', text: 'The doctor calls: a routine exam came back with a result “to be looked at further.”', choices: [{ label: 'Investigate right away ($350)', hint: '$350', text: 'It was a false alarm. But the scare made you reorganize priorities.' }, { label: 'Leave it for later', text: 'You postponed it, and anxiety kept you company for weeks.' }] },
  },
  {
    id: 'x_dor_costas', title: 'Dor nas costas', icon: '🦴', scene: 'saude', minAge: 25, maxAge: 80, cooldown: 30,
    text: 'Depois de horas na cadeira, suas costas travaram. Qualquer movimento é um desafio.',
    choices: [
      { label: 'Fazer fisioterapia ($200)', hint: '$200', when: (g) => g.money >= 200, text: 'Dez sessões depois você voltou a se mexer sem gemer.', effects: { money: -200, stats: { saude: 3, estresse: -2 } } },
      { label: 'Tomar um analgésico e seguir', text: 'A dor passou... até a próxima vez.', effects: { stats: { saude: -2, estresse: 2 } } },
      { label: 'Começar alongamento diário', text: 'Doze minutos por dia mudaram sua postura e seu humor.', effects: { stats: { saude: 2, felicidade: 2 } } },
    ],
    en: { title: 'Back pain', text: 'After hours in a chair, your back locked up. Any movement is a challenge.', choices: [{ label: 'Do physiotherapy ($200)', hint: '$200', text: 'Ten sessions later you moved again without groaning.' }, { label: 'Take a painkiller and carry on', text: 'The pain passed... until next time.' }, { label: 'Start daily stretching', text: 'Twelve minutes a day changed your posture and mood.' }] },
  },
  {
    id: 'x_insonia', title: 'Noites em claro', icon: '🌙', scene: 'saude', minAge: 18, maxAge: 85, cooldown: 24,
    when: (g) => g.player.stats.estresse >= 45,
    text: 'Faz uma semana que você deita e fica olhando o teto até as 4 da manhã.',
    choices: [
      { label: 'Cortar telas e café à noite', text: 'Demorou, mas o sono voltou ao normal.', effects: { stats: { estresse: -6, saude: 2 } } },
      { label: 'Tomar remédio para dormir', outcomes: [
        { chance: 0.75, text: 'Funcionou bem por algumas semanas.', effects: { stats: { estresse: -4 }, money: -40 } },
        { chance: 1, text: 'Dormiu, mas ficou dependente da pílula por um tempo.', effects: { money: -80, stats: { saude: -2 } } },
      ] },
      { label: 'Aguentar o cansaço', text: 'Quanto mais cansad{eu.o}, pior você dorme.', effects: { stats: { saude: -3, felicidade: -3, estresse: 3 } } },
    ],
    en: { title: 'Sleepless nights', text: 'For a week now you lie down and stare at the ceiling until 4 a.m.', choices: [{ label: 'Cut screens and night coffee', text: 'It took a while, but sleep returned to normal.' }, { label: 'Take a sleeping pill', outcomes: ['It worked well for a few weeks.', 'You slept, but became dependent on the pill for a while.'] }, { label: 'Endure the tiredness', text: 'The more tired you are, the worse you sleep.' }] },
  },
  {
    id: 'x_resolucao_ano_novo', title: 'Meta de saúde', icon: '🏃', scene: 'saude', minAge: 15, maxAge: 80, cooldown: 24, weight: 1.1,
    text: 'Você decidiu levar a saúde a sério: caminhar todo dia, comer melhor, dormir cedo.',
    choices: [
      { label: 'Começar de verdade', outcomes: [
        { chance: 0.45, text: 'Três meses depois, você ainda estava firme. Disposição nova!', effects: { stats: { saude: 5, felicidade: 4, estresse: -4 } } },
        { chance: 1, text: 'A segunda semana quebrou o ritmo e a meta virou promessa para o ano que vem.', effects: { stats: { felicidade: -1 } } },
      ] },
      { label: 'Contratar um personal ($250)', hint: '$250', when: (g) => g.money >= 250, text: 'Ter compromisso marcado ajudou. Você deu o primeiro passo.', effects: { money: -250, stats: { saude: 4, felicidade: 2 } } },
    ],
    en: { title: 'Health goal', text: 'You decided to take health seriously: walk daily, eat better, sleep early.', choices: [{ label: 'Really start', outcomes: ['Three months later, you were still going strong. New energy!', 'The second week broke the rhythm and the goal became a promise for next year.'] }, { label: 'Hire a personal trainer ($250)', hint: '$250', text: 'Having a scheduled commitment helped. You took the first step.' }] },
  },
  {
    id: 'x_festa_bebida', title: 'Mais uma rodada', icon: '🍻', scene: 'festa', minAge: 18, maxAge: 70, cooldown: 18, weight: 1.2,
    bind: { amigo: role('amigo', 'colega') },
    text: 'No bar, {amigo.nome} pede mais uma rodada. Já é a quinta.',
    choices: [
      { label: 'Pedir mais uma', text: 'A noite virou um borrão divertido... e a manhã, uma ressaca monstruosa.', effects: { stats: { felicidade: 5, saude: -3 }, rel: { amigo: 5 }, money: -60, run: (g) => { addAddiction(g, 'alcool', 4); } } },
      { label: 'Pedir água', text: 'Você curtiu a noite sem consequências. {amigo.nome} zoou, mas respeitou.', effects: { stats: { felicidade: 2 }, karma: 1 } },
      { label: 'Ser o motorista da vez', text: 'Levou todo mundo em segurança para casa. Heroi anônimo.', effects: { karma: 3, rel: { amigo: 6 } } },
    ],
    en: { title: 'One more round', text: 'At the bar, {amigo.nome} orders another round. It is already the fifth.', choices: [{ label: 'Order another', text: 'The night became a fun blur... and the morning, a monstrous hangover.' }, { label: 'Order water', text: 'You enjoyed the night without consequences. {amigo.nome} teased, but respected it.' }, { label: 'Be the designated driver', text: 'You took everyone home safely. Anonymous hero.' }] },
  },
  {
    id: 'x_parar_cigarro', title: 'Tentativa de parar', icon: '🚭', scene: 'saude', minAge: 18, maxAge: 85, cooldown: 24,
    when: (g) => addictionLevel(g, 'cigarro') >= 20,
    text: 'Depois de uma tosse que não passava, você decidiu tentar parar de fumar.',
    choices: [
      { label: 'Parar de uma vez', hint: 'Difícil', outcomes: [
        { chance: (g) => 0.3 + g.player.stats.saude / 300, text: 'Foram semanas duras, mas você conseguiu. Pulmões agradecem.', effects: { stats: { saude: 4, felicidade: 3 }, run: (g) => { addAddiction(g, 'cigarro', -35); } } },
        { chance: 1, text: 'Resistiu duas semanas e voltou na primeira crise.', effects: { stats: { estresse: 5 } } },
      ] },
      { label: 'Usar adesivos ($80)', hint: '$80', when: (g) => g.money >= 80, text: 'Ajudou a reduzir bastante o vício.', effects: { money: -80, stats: { estresse: 2 }, run: (g) => { addAddiction(g, 'cigarro', -20); } } },
      { label: 'Adiar para segunda-feira', text: 'Sempre tem uma segunda-feira.', effects: {} },
    ],
    en: { title: 'Trying to quit', text: 'After a cough that would not go away, you decided to try quitting smoking.', choices: [{ label: 'Quit cold turkey', hint: 'Hard', outcomes: ['Weeks were tough, but you made it. Lungs say thanks.', 'You resisted two weeks and relapsed at the first crisis.'] }, { label: 'Use patches ($80)', hint: '$80', text: 'It helped cut the habit by a lot.' }, { label: 'Postpone until Monday', text: 'There is always another Monday.' }] },
  },
  {
    id: 'x_bet_amigos', title: 'Aposta entre amigos', icon: '🎲', scene: 'festa', minAge: 18, maxAge: 75, cooldown: 24,
    when: (g) => g.money >= 500,
    bind: { amigo: role('amigo', 'colega', 'irmao') },
    text: '{amigo.nome} propõe uma aposta de $200 no resultado do jogo de sábado.',
    choices: [
      { label: 'Apostar', outcomes: [
        { chance: 0.45, text: 'Você ganhou! {amigo.nome} pagou pagando mico.', effects: { money: 200, stats: { felicidade: 4 }, run: (g) => { addAddiction(g, 'jogo', 3); } } },
        { chance: 1, text: 'Perdeu. {amigo.nome} guardou o dinheiro com um sorriso satisfeito.', effects: { money: -200, stats: { felicidade: -2 }, run: (g) => { addAddiction(g, 'jogo', 3); } } },
      ] },
      { label: 'Recusar', text: 'Você preferiu não misturar jogo e dinheiro. {amigo.nome} entendeu.', effects: { stats: { inteligencia: 0.5 } } },
    ],
    en: { title: 'Bet with friends', text: '{amigo.nome} proposes a $200 bet on Saturday’s game.', choices: [{ label: 'Bet', outcomes: ['You won! {amigo.nome} paid up looking embarrassed.', 'You lost. {amigo.nome} pocketed the money with a satisfied smile.'] }, { label: 'Decline', text: 'You preferred not to mix gambling and money. {amigo.nome} understood.' }] },
  },
  {
    id: 'x_remedio_tarja', title: 'Receita fácil', icon: '💊', scene: 'perigo', minAge: 20, maxAge: 70, cooldown: 36, weight: 0.7,
    when: (g) => g.player.stats.estresse >= 55,
    bind: { amigo: role('amigo', 'colega') },
    text: '{amigo.nome} oferece uns comprimidos "que resolvem tudo": "Tomo sempre, nunca me fez mal."',
    choices: [
      { label: 'Aceitar', text: 'Por algumas horas o mundo ficou mais leve. Depois, a vontade voltou.', effects: { stats: { estresse: -10, saude: -3 }, karma: -1, count: { drugUses: 1 }, run: (g) => { addAddiction(g, 'drogas', 8); } } },
      { label: 'Recusar e procurar ajuda', text: 'Você marcou uma consulta. Foi o primeiro passo certo.', effects: { karma: 2, money: -150, stats: { estresse: -4, felicidade: 2 } } },
    ],
    en: { title: 'Easy prescription', text: '{amigo.nome} offers some pills “that fix everything”: “I always take them, never hurt me.”', choices: [{ label: 'Accept', text: 'For a few hours the world felt lighter. Then the craving returned.' }, { label: 'Decline and seek help', text: 'You booked an appointment. It was the right first step.' }] },
  },
  {
    id: 'x_pichacao', title: 'Spray na parede', icon: '🎨', scene: 'perigo', minAge: 12, maxAge: 25, cooldown: 36,
    bind: { amigo: role('amigo', 'colega') },
    text: '{amigo.nome} tem latas de spray e uma parede branca em frente. "Vamos deixar nossa marca."',
    choices: [
      { label: 'Aderir', hint: 'Pode dar problema', effects: { run: (g) => attemptCrime(g, 'vandalismo', true) } },
      { label: 'Sugerir um mural autorizado', text: 'A prefeitura liberou a parede. Ficou lindo e virou ponto turístico do bairro.', effects: { karma: 3, stats: { carisma: 1.5, felicidade: 6 }, rel: { amigo: 6 } } },
      { label: 'Ir embora', text: 'Você deixou o amigo sozinho e foi para casa tranquil{eu.o}.', effects: { karma: 1 } },
    ],
    en: { title: 'Spray on the wall', text: '{amigo.nome} has spray cans and a white wall in front of you. “Let’s leave our mark.”', choices: [{ label: 'Join in', hint: 'Could get you in trouble' }, { label: 'Suggest an authorized mural', text: 'The city approved the wall. It looked great and became a neighborhood landmark.' }, { label: 'Leave', text: 'You left your friend alone and went home calmly.' }] },
  },
  {
    id: 'x_policia_abordagem', title: 'Batida policial', icon: '🚓', scene: 'perigo', minAge: 16, maxAge: 70, cooldown: 36,
    text: 'Você é parado numa blitz. O policial pede os documentos com olhar duro.',
    choices: [
      { label: 'Cooperar com educação', text: 'Tudo certo. O policial liberou e desejou boa noite.', effects: { stats: { estresse: 2 }, karma: 1 } },
      { label: 'Questionar a abordagem', outcomes: [
        { chance: (g) => 0.35 + g.player.stats.carisma / 300, text: 'Você manteve a calma e foi liberad{eu.o} com um pedido de desculpas.', effects: { stats: { carisma: 1 } } },
        { chance: 1, text: 'A discussão esquentou e você perdeu uma hora de vida na delegacia.', effects: { stats: { estresse: 8 }, karma: -1 } },
      ] },
    ],
    en: { title: 'Police stop', text: 'You are pulled over at a checkpoint. The officer asks for your documents with a hard look.', choices: [{ label: 'Cooperate politely', text: 'All fine. The officer let you go and wished you a good night.' }, { label: 'Question the stop', outcomes: ['You stayed calm and were released with an apology.', 'The argument heated up and you lost an hour of life at the station.'] }] },
  },
  {
    id: 'x_testemunha_crime', title: 'Testemunha', icon: '👁️', scene: 'perigo', minAge: 16, maxAge: 85, cooldown: 48,
    text: 'Você viu um assalto na rua. Ninguém mais parece ter percebido, e os assaltantes sumiram.',
    choices: [
      { label: 'Ligar para a polícia', text: 'A polícia chegou rápido e você deu seu depoimento. A vítima agradeceu.', effects: { karma: 5, stats: { estresse: 4 } } },
      { label: 'Socorrer a vítima', outcomes: [
        { chance: 0.97, text: 'Você ajudou a vítima, que estava assustada mas bem.', effects: { karma: 6, stats: { felicidade: 3, estresse: 3 } } },
        { chance: 1, text: 'Os assaltantes voltaram e a situação saiu do controle. Você não sobreviveu.', effects: { karma: 6, run: (g) => { queueDeath(g, 'heroi'); } } },
      ] },
      { label: 'Fingir que não viu', text: 'Você virou a esquina e apertou o passo. A culpa te acompanhou.', effects: { karma: -3, stats: { felicidade: -2 } } },
    ],
    en: { title: 'Witness', text: 'You saw a mugging on the street. Nobody else seems to have noticed, and the muggers are gone.', choices: [{ label: 'Call the police', text: 'The police arrived fast and you gave a statement. The victim thanked you.' }, { label: 'Help the victim', outcomes: ['You helped the victim, who was scared but fine.', 'The muggers came back and things got out of hand. You did not survive.'] }, { label: 'Pretend not to see', text: 'You turned the corner and sped up. The guilt followed you.' }] },
  },
  {
    id: 'x_protesto', title: 'Passeata na avenida', icon: '📢', scene: 'perigo', minAge: 16, maxAge: 75, cooldown: 36,
    text: 'Uma manifestação toma a avenida onde você mora. O barulho é enorme e há gente de todos os lados.',
    choices: [
      { label: 'Participar', text: 'Você marchou com cartaz e voz rouca. Sentiu fazer parte de algo.', effects: { karma: 1, stats: { felicidade: 4, carisma: 1, estresse: 2 } } },
      { label: 'Fotografar de longe', text: 'A foto viralizou entre os amigos.', effects: { stats: { carisma: 0.5, felicidade: 1 } } },
      { label: 'Evitar a região', text: 'Você deu a volta e chegou em casa uma hora depois.', effects: { stats: { estresse: 1 } } },
    ],
    en: { title: 'March on the avenue', text: 'A demonstration takes over the avenue where you live. The noise is huge and people are everywhere.', choices: [{ label: 'Join in', text: 'You marched with a sign and a hoarse voice. You felt part of something.' }, { label: 'Photograph from afar', text: 'The photo went viral among friends.' }, { label: 'Avoid the area', text: 'You took a detour and got home an hour later.' }] },
  },
  {
    id: 'x_pesquisa_eleitoral', title: 'Pesquisa de opinião', icon: '📊', scene: 'trabalho', minAge: 21, maxAge: 80, cooldown: 24,
    when: inOffice,
    text: 'Uma nova pesquisa mostra sua aprovação oscilando. A assessoria quer uma reação.',
    choices: [
      { label: 'Anunciar uma obra popular ($1.500)', hint: '$1.500', when: (g) => g.money >= 1500, text: 'A obra rendeu fotos, aplausos e alguns pontos de aprovação.', effects: { money: -1500, run: (g) => { approve(g, 6); } } },
      { label: 'Ignorar pesquisas', text: 'Você decidiu governar pelo que acha certo. Os números não mudaram.', effects: { karma: 1 } },
      { label: 'Atacar um adversário nas redes', text: 'Funcionou por uns dias, mas o tom pesado cobrou seu preço.', effects: { karma: -3, run: (g) => { approve(g, chance(g, 0.5) ? 4 : -5); } } },
    ],
    en: { title: 'Opinion poll', text: 'A new poll shows your approval wobbling. Your staff wants a response.', choices: [{ label: 'Announce a popular project ($1.500)', hint: '$1.500', text: 'The project brought photos, applause and a few approval points.' }, { label: 'Ignore polls', text: 'You decided to govern by what you think is right. The numbers did not change.' }, { label: 'Attack a rival on social media', text: 'It worked for a few days, but the harsh tone took its toll.' }] },
  },
  {
    id: 'x_lobby_oferta', title: 'Jantar com lobistas', icon: '🍷', scene: 'trabalho', minAge: 25, maxAge: 80, cooldown: 36, weight: 0.8,
    when: inOffice,
    text: 'Um grupo de empresários convida você para jantar e sugere apoiar seus projetos em troca de "boa vontade" em uma votação.',
    choices: [
      { label: 'Recusar educadamente', text: 'Você disse que decide por critérios técnicos. O grupo se afastou.', effects: { karma: 3, run: (g) => { approve(g, 2); } } },
      { label: 'Aceitar o apoio', outcomes: [
        { chance: 0.65, text: 'Ninguém soube. Você ganhou financiamento e um novo grupo de aliados.', effects: { karma: -5, money: 1500 } },
        { chance: 1, text: 'O jantar vazou para a imprensa e a oposição pediu explicações.', effects: { karma: -5, run: (g) => { approve(g, -10); const p = politicsOf(g); if (p) p.scandals += 1; } } },
      ] },
    ],
    en: { title: 'Dinner with lobbyists', text: 'A group of businesspeople invites you to dinner and suggests backing your projects in exchange for “goodwill” on a vote.', choices: [{ label: 'Politely decline', text: 'You said you decide on technical criteria. The group moved away.' }, { label: 'Accept the support', outcomes: ['Nobody knew. You gained funding and a new group of allies.', 'The dinner leaked to the press and the opposition demanded explanations.'] }] },
  },
  {
    id: 'x_debate_tv', title: 'Debate na TV', icon: '📺', scene: 'trabalho', minAge: 21, maxAge: 80, cooldown: 36, weight: 0.8,
    when: (g) => !!politicsOf(g),
    text: 'Você foi convidad{eu.o} para um debate ao vivo na TV. O adversário é conhecido por golpes baixos.',
    choices: [
      { label: 'Preparar-se com seriedade', hint: 'Inteligência e carisma ajudam', outcomes: [
        { chance: (g) => 0.25 + g.player.stats.inteligencia / 250 + g.player.stats.carisma / 250, text: 'Você brilhou e deixou o adversário sem resposta. A imprensa elogiou.', effects: { stats: { carisma: 1.5, felicidade: 5 }, run: (g) => { approve(g, 8); } } },
        { chance: 1, text: 'Você gaguejou num momento crucial e virou meme.', effects: { stats: { estresse: 6, felicidade: -4 }, run: (g) => { approve(g, -4); } } },
      ] },
      { label: 'Recusar o convite', text: 'Cadeira vazia no estúdio. Críticos disseram que você fugiu.', effects: { run: (g) => { approve(g, -3); } } },
    ],
    en: { title: 'TV debate', text: 'You were invited to a live TV debate. The opponent is known for cheap shots.', choices: [{ label: 'Prepare seriously', hint: 'Intelligence and charisma help', outcomes: ['You shone and left the opponent speechless. The press praised you.', 'You stammered at a crucial moment and became a meme.'] }, { label: 'Decline the invitation', text: 'Empty chair in the studio. Critics said you ran away.' }] },
  },
  {
    id: 'x_obra_corrupcao', title: 'Superfaturamento', icon: '🏗️', scene: 'perigo', minAge: 25, maxAge: 80, cooldown: 48, weight: 0.6,
    when: inOffice,
    text: 'Um assessor mostra que uma obra pública tem preços inflados em favor de uma empreiteira aliada.',
    choices: [
      { label: 'Cancelar e abrir investigação', text: 'Foi um custo político alto, mas você ficou com a consciência limpa.', effects: { karma: 6, run: (g) => { approve(g, -3); } } },
      { label: 'Fechar os olhos', text: 'A obra seguiu. Você não viu nada. Ninguém viu nada.', effects: { karma: -5 } },
    ],
    en: { title: 'Overpricing', text: 'An aide shows that a public project has inflated prices in favor of an allied contractor.', choices: [{ label: 'Cancel and open an investigation', text: 'It was a high political cost, but your conscience is clear.' }, { label: 'Turn a blind eye', text: 'The project went on. You saw nothing. Nobody saw anything.' }] },
  },
  {
    id: 'x_comicio_bairro', title: 'Conversa no bairro', icon: '🗣️', scene: 'trabalho', minAge: 21, maxAge: 80, cooldown: 24,
    when: (g) => !!politicsOf(g),
    text: 'Moradores de um bairro esquecido pedem uma audiência: falta asfalto, iluminação e posto de saúde.',
    choices: [
      { label: 'Ir pessoalmente e ouvir', text: 'Você passou a tarde ouvindo e anotando. A confiança cresceu.', effects: { karma: 2, stats: { carisma: 1, estresse: 2 }, run: (g) => { approve(g, 4); } } },
      { label: 'Mandar um assessor', text: 'O assessor prometeu o que não podia cumprir. A audiência azedou.', effects: { run: (g) => { approve(g, -2); } } },
    ],
    en: { title: 'Neighborhood talk', text: 'Residents of a forgotten neighborhood request a hearing: lack of paving, lighting and a health clinic.', choices: [{ label: 'Go in person and listen', text: 'You spent the afternoon listening and taking notes. Trust grew.' }, { label: 'Send an aide', text: 'The aide promised what could not be delivered. The hearing soured.' }] },
  },
];
