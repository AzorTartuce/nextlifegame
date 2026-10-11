import { ageYears, changeMoney } from '../../core';
import { addCondition } from '../../systems/health';
import { amount, role, roleWith } from '../binders';
import type { Storylet } from '../engine';

/** Eventos extras: infância, adolescência, escola, família e amizades. */
export const EXTRA1: Storylet[] = [
  {
    id: 'x_dente_leite', title: 'Dente mole', icon: '🦷', scene: 'casa', minAge: 5, maxAge: 9, cooldown: 24,
    text: 'Seu dente de leite finalmente caiu! Você quer guardá-lo debaixo do travesseiro.',
    choices: [
      { label: 'Esperar a fada do dente', text: 'De manhã havia uma moedinha brilhante. Você ficou convencid{eu.o} de que a fada é real.', effects: { stats: { felicidade: 4 }, money: 5 } },
      { label: 'Ficar acordad{eu.o} para flagrar', text: 'Você viu o vulto de um adulto sonolento. Segredo guardado: você fingiu que dormia.', effects: { stats: { inteligencia: 1, felicidade: 2 }, money: 5 } },
    ],
    en: { title: 'Wobbly tooth', text: 'Your baby tooth finally came out! You want to keep it under the pillow.', choices: [{ label: 'Wait for the tooth fairy', text: 'In the morning there was a shiny little coin. You are convinced the fairy is real.' }, { label: 'Stay awake to catch her', text: 'You saw the silhouette of a sleepy adult. You kept the secret and pretended to sleep.' }] },
  },
  {
    id: 'x_show_talentos', title: 'Show de talentos', icon: '🎤', scene: 'escola', minAge: 6, maxAge: 14, cooldown: 30,
    text: 'A escola abriu inscrições para o show de talentos. A plateia terá a escola inteira.',
    choices: [
      {
        label: 'Se inscrever', hint: 'Carisma ajuda',
        outcomes: [
          { chance: (g) => 0.3 + g.player.stats.carisma / 200, text: 'Aplausos de pé! Você virou a estrela da semana.', effects: { stats: { carisma: 2, felicidade: 8 } } },
          { chance: 0.5, text: 'Esqueceu a letra no meio, mas todos riram junto e ninguém foi cruel.', effects: { stats: { felicidade: 1, estresse: 3 } } },
          { chance: 1, text: 'O microfone fez um chiado enorme e você saiu correndo do palco.', effects: { stats: { felicidade: -4, estresse: 6 } } },
        ],
      },
      { label: 'Ver da plateia', text: 'Torceu pelos colegas e comeu pipoca. Sem drama.', effects: { stats: { felicidade: 2 } } },
    ],
    en: { title: 'Talent show', text: 'The school opened sign-ups for the talent show. The whole school will be in the audience.', choices: [{ label: 'Sign up', hint: 'Charisma helps', outcomes: ['Standing ovation! You became the star of the week.', 'You forgot the lyrics halfway, but everyone laughed along and nobody was cruel.', 'The mic screeched horribly and you ran off the stage.'] }, { label: 'Watch from the audience', text: 'You cheered for classmates and ate popcorn. No drama.' }] },
  },
  {
    id: 'x_cola_prova', title: 'Cola na prova', icon: '📝', scene: 'escola', minAge: 10, maxAge: 19, cooldown: 24,
    bind: { colega: role('colega', 'amigo') },
    text: 'Na véspera da prova, {colega.nome} oferece um papelzinho com as respostas: "Todo mundo vai usar."',
    choices: [
      {
        label: 'Aceitar a cola', hint: 'Rende nota, custa consciência',
        outcomes: [
          { chance: 0.7, text: 'Passou batido. A nota veio alta, mas o gosto foi estranho.', effects: { karma: -3, stats: { inteligencia: -0.5 } } },
          { chance: 1, text: 'O professor viu o papel. Zero na prova e conversa com a diretoria.', effects: { karma: -3, stats: { estresse: 8, felicidade: -5 } } },
        ],
      },
      { label: 'Recusar e estudar', text: 'Você virou a noite estudando. A nota foi decente e honesta.', effects: { karma: 2, stats: { inteligencia: 1.5, estresse: 3 } } },
      { label: 'Denunciar ao professor', text: 'O professor agradeceu, mas o corredor ficou frio por semanas.', effects: { karma: 1, rel: { colega: -20 }, stats: { carisma: -1 } } },
    ],
    en: { title: 'Cheating on the test', text: 'The night before the test, {colega.nome} offers a slip of paper with the answers: “Everyone will use it.”', choices: [{ label: 'Take the cheat sheet', hint: 'Pays off in grades, costs conscience', outcomes: ['You got away with it. The grade was high, but it left a strange taste.', 'The teacher spotted the paper. Zero on the test and a talk with the principal.'] }, { label: 'Refuse and study', text: 'You stayed up studying. The grade was decent and honest.' }, { label: 'Report to the teacher', text: 'The teacher thanked you, but the hallway was cold for weeks.' }] },
  },
  {
    id: 'x_bullying', title: 'Zoação pesada', icon: '😠', scene: 'escola', minAge: 8, maxAge: 17, cooldown: 24,
    bind: { vitima: role('colega', 'conhecido') },
    text: 'Na saída da escola, um grupo está humilhando {vitima.nome} na frente de todos.',
    choices: [
      {
        label: 'Defender {vitima.nome}', hint: 'Corajoso, mas arriscado',
        outcomes: [
          { chance: (g) => 0.4 + g.player.stats.carisma / 250, text: 'Sua firmeza fez o grupo recuar. {vitima.nome} nunca esqueceu.', effects: { karma: 5, rel: { vitima: 25 }, stats: { carisma: 1.5, felicidade: 4 } } },
          { chance: 1, text: 'Sobrou para você: levou empurrões, mas {vitima.nome} escapou.', effects: { karma: 5, rel: { vitima: 20 }, stats: { saude: -4, estresse: 5 } } },
        ],
      },
      { label: 'Chamar um adulto', text: 'Um inspetor resolveu a situação. Sem heroísmo, mas funcionou.', effects: { karma: 3, rel: { vitima: 8 } } },
      { label: 'Ir embora', text: 'Você fingiu não ver. Aquela imagem voltou em várias noites.', effects: { karma: -3, stats: { felicidade: -3 } } },
      { label: 'Rir junto', text: 'Foi fácil rir junto. Difícil foi encarar o espelho depois.', effects: { karma: -6, rel: { vitima: -25 }, stats: { carisma: 0.5, felicidade: -2 } } },
    ],
    en: { title: 'Cruel teasing', text: 'After school, a group is humiliating {vitima.nome} in front of everyone.', choices: [{ label: 'Defend {vitima.nome}', hint: 'Brave but risky', outcomes: ['Your firmness made the group back off. {vitima.nome} never forgot it.', 'You took the heat: some shoving, but {vitima.nome} got away.'] }, { label: 'Call an adult', text: 'A hall monitor handled it. No heroics, but it worked.' }, { label: 'Walk away', text: 'You pretended not to see. That image came back on many nights.' }, { label: 'Laugh along', text: 'Laughing along was easy. Facing the mirror afterwards was hard.' }] },
  },
  {
    id: 'x_primeiro_celular', title: 'Primeiro celular', icon: '📱', scene: 'casa', minAge: 9, maxAge: 14, once: true,
    bind: { p: role('mae', 'pai') },
    text: '{p.nome} diz que você já tem idade para ter um celular, mas com regras.',
    choices: [
      { label: 'Aceitar as regras', text: 'Horários e senha compartilhada. Chato, mas você ganhou confiança.', effects: { rel: { p: 6 }, stats: { felicidade: 4 } } },
      { label: 'Burlar as regras à noite', text: 'Madrugadas de vídeo na cama. O sono sofreu, a diversão compensou.', effects: { stats: { felicidade: 6, saude: -2, inteligencia: -0.5, estresse: 2 }, rel: { p: -4 } } },
    ],
    en: { title: 'First phone', text: '{p.nome} says you are old enough for a phone, but with rules.', choices: [{ label: 'Accept the rules', text: 'Curfews and a shared passcode. Annoying, but you earned trust.' }, { label: 'Break the rules at night', text: 'Nights of videos under the covers. Sleep suffered; the fun made up for it.' }] },
  },
  {
    id: 'x_acampamento', title: 'Acampamento', icon: '⛺', scene: 'natureza', minAge: 8, maxAge: 17, cooldown: 36,
    text: 'A escola organizou um acampamento de fim de semana. Fogueira, trilha e histórias de terror.',
    choices: [
      { label: 'Ir e se jogar nas atividades', text: 'Você escalou, riu e aprendeu a montar barraca (mais ou menos).', effects: { stats: { saude: 3, felicidade: 7, estresse: -5 }, money: -60 } },
      { label: 'Ir mas ficar no celular', text: 'Sem sinal, a bateria acabou no primeiro dia. Foi forçado a conversar com gente.', effects: { stats: { carisma: 1, felicidade: 3 }, money: -60 } },
      { label: 'Inventar uma dor de barriga', text: 'Fim de semana de sofá. Seguro e levemente solitário.', effects: { stats: { felicidade: -1 } } },
    ],
    en: { title: 'Camp trip', text: 'The school organized a weekend camping trip. Bonfire, hiking and ghost stories.', choices: [{ label: 'Go and dive into the activities', text: 'You climbed, laughed and learned to pitch a tent (sort of).' }, { label: 'Go but stay on the phone', text: 'No signal; the battery died on day one. You were forced to talk to people.' }, { label: 'Fake a stomachache', text: 'A weekend on the couch. Safe and slightly lonely.' }] },
  },
  {
    id: 'x_mesada', title: 'Mesada', icon: '🐷', scene: 'dinheiro', minAge: 7, maxAge: 14, cooldown: 30,
    text: 'Você juntou $50 de mesada e viu uma vitrine com o brinquedo dos seus sonhos.',
    choices: [
      { label: 'Comprar o brinquedo', text: 'Alegria imediata... e três semanas depois já estava esquecido na gaveta.', effects: { money: -50, stats: { felicidade: 5 } } },
      { label: 'Guardar no cofrinho', text: 'Pequenas moedas, grandes hábitos. Você sentiu orgulho do cofre pesado.', effects: { stats: { inteligencia: 1, felicidade: 1 }, flags: { poupador: true } } },
      { label: 'Dividir com um amigo', text: 'Compraram doces e dividiram. Valeu mais que o brinquedo.', effects: { money: -50, karma: 2, stats: { carisma: 1, felicidade: 4 } } },
    ],
    en: { title: 'Allowance', text: 'You saved $50 of allowance and saw a shop window with your dream toy.', choices: [{ label: 'Buy the toy', text: 'Instant joy... and three weeks later it was forgotten in a drawer.' }, { label: 'Save it in the piggy bank', text: 'Small coins, big habits. You felt proud of the heavy piggy bank.' }, { label: 'Share with a friend', text: 'You bought candy and split it. Worth more than the toy.' }] },
  },
  {
    id: 'x_festa_pijama', title: 'Festa do pijama', icon: '🛏️', scene: 'festa', minAge: 6, maxAge: 14, cooldown: 24,
    bind: { amigo: role('amigo', 'colega') },
    text: '{amigo.nome} convidou você para dormir na casa {amigo.dele}. Prometeu pipoca e filme de terror.',
    choices: [
      { label: 'Ir ao filme de terror', text: 'Ninguém dormiu direito, e todo mundo jurou que não teve medo.', effects: { rel: { amigo: 10 }, stats: { felicidade: 6, estresse: 3 } } },
      { label: 'Pedir comédia no lugar', text: 'Risadas até de madrugada. Todos concordaram em segredo.', effects: { rel: { amigo: 8 }, stats: { felicidade: 7 } } },
    ],
    en: { title: 'Sleepover', text: '{amigo.nome} invited you to sleep over. Promised popcorn and a horror movie.', choices: [{ label: 'Watch the horror movie', text: 'Nobody slept well, and everyone swore they were not scared.' }, { label: 'Ask for a comedy instead', text: 'Laughs until dawn. Everyone secretly agreed.' }] },
  },
  {
    id: 'x_briga_brinquedo', title: 'Briga de irmãos', icon: '🧸', scene: 'casa', minAge: 4, maxAge: 13, cooldown: 18,
    bind: { irmao: role('irmao') },
    text: '{irmao.nome} pegou seu brinquedo favorito sem pedir. A guerra começou.',
    choices: [
      { label: 'Gritar por ajuda dos pais', text: 'Os pais mandaram dividirem. Ninguém ficou contente.', effects: { rel: { irmao: -5 }, stats: { felicidade: -1 } } },
      { label: 'Propor um jogo para decidir', text: 'Par ou ímpar resolveu. {irmao.nome} até aceitou perder.', effects: { rel: { irmao: 8 }, stats: { inteligencia: 1 } } },
      { label: 'Tomar de volta no grito', text: 'Gritaria, choro e castigo dos dois.', effects: { rel: { irmao: -10 }, stats: { estresse: 4 } } },
    ],
    en: { title: 'Sibling fight', text: '{irmao.nome} took your favorite toy without asking. War has begun.', choices: [{ label: 'Yell for the parents', text: 'The parents told you both to share. Nobody was happy.' }, { label: 'Propose a game to decide', text: 'Rock-paper-scissors settled it. {irmao.nome} even accepted losing.' }, { label: 'Grab it back and yell', text: 'Screaming, crying and both grounded.' }] },
  },
  {
    id: 'x_primeiro_beijo', title: 'Primeiro beijo', icon: '😘', scene: 'amor', minAge: 13, maxAge: 18, once: true,
    bind: { crush: role('colega', 'amigo', 'conhecido') },
    text: 'Numa festa da turma, você e {crush.nome} ficaram sozinhos perto do portão. O clima mudou.',
    choices: [
      {
        label: 'Tomar a iniciativa', hint: 'Carisma e aparência ajudam',
        outcomes: [
          { chance: (g) => 0.35 + g.player.stats.carisma / 300 + g.player.stats.aparencia / 400, text: 'Foi desajeitado e perfeito. Seu coração disparou por dias.', effects: { stats: { felicidade: 10, carisma: 1 }, rel: { crush: 15 }, memory: { who: 'crush', tag: 'primeiro_beijo', text: 'Nosso primeiro beijo', weight: 3 } } },
          { chance: 1, text: 'Vocês bateram os narizes. Rimos da situação, mas ficou o constrangimento.', effects: { stats: { felicidade: -2, estresse: 3 }, rel: { crush: -3 } } },
        ],
      },
      { label: 'Fingir que não percebeu', text: 'Você mudou de assunto. O momento passou e ficou a dúvida.', effects: { stats: { felicidade: -2 } } },
    ],
    en: { title: 'First kiss', text: 'At a class party, you and {crush.nome} ended up alone near the gate. The mood changed.', choices: [{ label: 'Make the move', hint: 'Charisma and looks help', outcomes: ['It was awkward and perfect. Your heart raced for days.', 'Your noses bumped. You laughed it off, but the embarrassment stayed.'] }, { label: 'Pretend not to notice', text: 'You changed the subject. The moment passed and doubt stayed.' }] },
  },
  {
    id: 'x_casa_vazia', title: 'Casa vazia', icon: '🏠', scene: 'festa', minAge: 15, maxAge: 19, cooldown: 36,
    when: (g) => g.livesWithParents,
    bind: { p: role('mae', 'pai'), amigo: role('amigo', 'colega') },
    text: '{p.nome} viajou no fim de semana. {amigo.nome} sugere: "Festa na sua casa?"',
    choices: [
      {
        label: 'Fazer a festa',
        outcomes: [
          { chance: 0.6, text: 'Foi lendária e ninguém quebrou nada. Você limpou até as 4 da tarde.', effects: { stats: { felicidade: 9, carisma: 2, estresse: 3 }, rel: { amigo: 8 } } },
          { chance: 1, text: 'Um vaso quebrou, o vizinho reclamou e {p.nome} descobriu tudo.', effects: { stats: { felicidade: 3, estresse: 8 }, rel: { p: -15, amigo: 4 }, money: -200 } },
        ],
      },
      { label: 'Chamar só dois amigos', text: 'Pizza, jogos e zero problema. Confiança renovada.', effects: { stats: { felicidade: 5 }, rel: { amigo: 5 } } },
      { label: 'Recusar', text: '"Meus pais confiam em mim." Você ficou orgulhos{eu.o} da decisão.', effects: { karma: 1, rel: { p: 4 } } },
    ],
    en: { title: 'Empty house', text: '{p.nome} traveled for the weekend. {amigo.nome} suggests: “Party at your place?”', choices: [{ label: 'Throw the party', outcomes: ['It was legendary and nothing broke. You cleaned until 4 p.m.', 'A vase broke, the neighbor complained and {p.nome} found out everything.'] }, { label: 'Invite just two friends', text: 'Pizza, games and zero problems. Trust renewed.' }, { label: 'Decline', text: '“My parents trust me.” You felt proud of the decision.' }] },
  },
  {
    id: 'x_banda_garagem', title: 'Banda de garagem', icon: '🎸', scene: 'festa', minAge: 13, maxAge: 22, cooldown: 36, weight: 0.8,
    bind: { amigo: role('amigo', 'colega') },
    text: '{amigo.nome} quer formar uma banda e te chamou para tocar. Ensaios na garagem, muito barulho e zero experiência.',
    choices: [
      {
        label: 'Entrar na banda', hint: 'Talento ajuda',
        outcomes: [
          { chance: 0.25, text: 'Vocês tocaram num festival do bairro e juntaram uma pequena legião de fãs!', effects: { stats: { carisma: 2, felicidade: 10 }, rel: { amigo: 12 }, money: 150 } },
          { chance: 1, text: 'Cinco ensaios depois, a banda acabou numa briga sobre o nome. Mas a música ficou.', effects: { stats: { felicidade: 4, carisma: 1 }, rel: { amigo: -3 } } },
        ],
      },
      { label: 'Deixar para lá', text: 'Você preferiu focar nos estudos. Às vezes ainda pensa no que poderia ter sido.', effects: { stats: { inteligencia: 1 } } },
    ],
    en: { title: 'Garage band', text: '{amigo.nome} wants to start a band and asked you to play. Rehearsals in the garage, lots of noise and zero experience.', choices: [{ label: 'Join the band', hint: 'Talent helps', outcomes: ['You played a neighborhood festival and gathered a small legion of fans!', 'Five rehearsals later, the band ended in a fight over the name. But the music stayed.'] }, { label: 'Let it go', text: 'You preferred to focus on studies. Sometimes you still wonder what could have been.' }] },
  },
  {
    id: 'x_pressao_vestibular', title: 'Pressão do vestibular', icon: '📚', scene: 'escola', minAge: 16, maxAge: 19, cooldown: 24,
    text: 'O ano do vestibular chegou. Parentes perguntam "Vai fazer o quê?" a cada almoço de domingo.',
    choices: [
      { label: 'Montar um cronograma rígido', text: 'Seis horas de estudo por dia. Cansa, mas rende.', effects: { stats: { inteligencia: 3, estresse: 8, felicidade: -3 } } },
      { label: 'Estudar com equilíbrio', text: 'Dormiu bem, treinou, estudou. O ritmo foi sustentável.', effects: { stats: { inteligencia: 1.5, estresse: 2, saude: 1 } } },
      { label: 'Fazer um ano sabático', text: 'Você viajou, trabalhou e se descobriu. Os parentes ficaram em choque.', effects: { stats: { felicidade: 6, carisma: 1, estresse: -4 }, money: -400 } },
    ],
    en: { title: 'Entrance exam pressure', text: 'Exam year has arrived. Relatives ask “So what will you do?” at every Sunday lunch.', choices: [{ label: 'Set a rigid schedule', text: 'Six hours of study a day. Tiring, but effective.' }, { label: 'Study with balance', text: 'You slept well, exercised, studied. The pace was sustainable.' }, { label: 'Take a gap year', text: 'You traveled, worked and found yourself. Relatives were shocked.' }] },
  },
  {
    id: 'x_intercambio', title: 'Oportunidade de intercâmbio', icon: '🌍', scene: 'escola', minAge: 16, maxAge: 24, once: true,
    text: 'Um programa de intercâmbio de seis meses abriu vagas. O custo é de $4.000, mas a experiência é única.',
    choices: [
      { label: 'Ir ($4.000)', hint: '$4.000', when: (g) => g.money >= 4000, text: 'Seis meses morando fora: idioma novo, amigos de vários países e muita saudade.', effects: { money: -4000, stats: { inteligencia: 3, carisma: 2, felicidade: 8 }, flags: { fezIntercambio: true } } },
      { label: 'Tentar bolsa', hint: 'Inteligência ajuda', outcomes: [
        { chance: (g) => 0.2 + g.player.stats.inteligencia / 250, text: 'Bolsa conquistada! Foi a melhor experiência da juventude.', effects: { stats: { inteligencia: 3, carisma: 2, felicidade: 9 }, flags: { fezIntercambio: true } } },
        { chance: 1, text: 'Concorrência acirrada. Você ficou na lista de espera para sempre.', effects: { stats: { felicidade: -3 } } },
      ] },
      { label: 'Desistir', text: 'Você achou melhor ficar e guardar o dinheiro.', effects: { stats: { felicidade: -1 } } },
    ],
    en: { title: 'Exchange opportunity', text: 'A six-month exchange program opened spots. It costs $4.000, but the experience is unique.', choices: [{ label: 'Go ($4.000)', hint: '$4.000', text: 'Six months living abroad: a new language, friends from many countries and lots of homesickness.' }, { label: 'Try for a scholarship', hint: 'Intelligence helps', outcomes: ['Scholarship won! It was the best experience of your youth.', 'Fierce competition. You stayed on the waiting list forever.'] }, { label: 'Give up', text: 'You thought it better to stay and keep the money.' }] },
  },
  {
    id: 'x_republica', title: 'Vida em república', icon: '🏘️', scene: 'escola', minAge: 18, maxAge: 26, cooldown: 36,
    when: (g) => !g.livesWithParents && g.money < 20000,
    text: 'Seus colegas de república comem sua comida, não lavam a louça e fazem festa nos dias de prova.',
    choices: [
      { label: 'Organizar uma reunião da casa', text: 'Fizeram uma escala de tarefas. Durou duas semanas, mas melhorou o clima.', effects: { stats: { carisma: 1, estresse: -3 } } },
      { label: 'Aderir à festa', text: 'Foi divertido até a prova. A nota sofreu.', effects: { stats: { felicidade: 7, inteligencia: -1, saude: -2 } } },
      { label: 'Mudar para um lugar sozinho ($800)', hint: '$800', when: (g) => g.money >= 800, text: 'Silêncio, comida sua na geladeira e paz.', effects: { money: -800, stats: { estresse: -6, felicidade: 3 } } },
    ],
    en: { title: 'Shared house life', text: 'Your housemates eat your food, skip the dishes and party on exam days.', choices: [{ label: 'Hold a house meeting', text: 'You made a chore chart. It lasted two weeks but improved the mood.' }, { label: 'Join the party', text: 'It was fun until the exam. The grade suffered.' }, { label: 'Move to a place alone ($800)', hint: '$800', text: 'Silence, your food in the fridge and peace.' }] },
  },
  {
    id: 'x_trote', title: 'Trote', icon: '🎓', scene: 'escola', minAge: 17, maxAge: 21, once: true,
    text: 'Veteranos estão organizando um "trote" para os calouros, com exigências cada vez mais humilhantes.',
    choices: [
      { label: 'Participar', text: 'Foi constrangedor e hilário. Fez amigos para a vida toda.', effects: { stats: { carisma: 1.5, felicidade: 4, saude: -1 } } },
      { label: 'Recusar e denunciar abusos', text: 'A coordenação deu um basta ao trote. Você foi chamad{eu.o} de estraga-prazeres por alguns e de herói por outros.', effects: { karma: 4, stats: { carisma: -0.5, felicidade: 1 } } },
      { label: 'Sumir naquela semana', text: 'Você dormiu em casa e ninguém sentiu falta. Pelo menos até a festa de integração.', effects: { stats: { felicidade: -1 } } },
    ],
    en: { title: 'Freshman hazing', text: 'Seniors are organizing a hazing ritual for freshmen, with increasingly humiliating demands.', choices: [{ label: 'Take part', text: 'It was embarrassing and hilarious. You made lifelong friends.' }, { label: 'Refuse and report abuses', text: 'The administration put an end to the hazing. Some called you a killjoy; others, a hero.' }, { label: 'Disappear that week', text: 'You slept at home and nobody missed you. At least until the welcome party.' }] },
  },
  {
    id: 'x_tcc_madrugada', title: 'Prazo apertado', icon: '⏳', scene: 'escola', minAge: 18, maxAge: 40, cooldown: 24,
    when: (g) => !!g.education.enrolled,
    text: 'O trabalho final vence amanhã e você mal começou. O café já acabou.',
    choices: [
      { label: 'Virar a noite', hint: 'Custa saúde', text: 'Entregou às 7h58, com olheiras e orgulho. A nota foi boa.', effects: { stats: { inteligencia: 1, saude: -3, estresse: 8 } } },
      { label: 'Pedir extensão ao professor', outcomes: [
        { chance: (g) => 0.4 + g.player.stats.carisma / 300, text: 'O professor foi compreensivo e deu mais três dias.', effects: { stats: { estresse: -2 } } },
        { chance: 1, text: '"Prazo é prazo." Nota reduzida pela metade.', effects: { stats: { estresse: 5, inteligencia: -0.5 } } },
      ] },
      { label: 'Copiar da internet', text: 'O detector de plágio pegou. Advertência formal.', effects: { karma: -3, stats: { estresse: 7, inteligencia: -1 } } },
    ],
    en: { title: 'Tight deadline', text: 'The final paper is due tomorrow and you barely started. The coffee is gone.', choices: [{ label: 'Pull an all-nighter', hint: 'Costs health', text: 'You turned it in at 7:58 a.m., with eye bags and pride. The grade was good.' }, { label: 'Ask the professor for an extension', outcomes: ['The professor was understanding and gave three more days.', '“A deadline is a deadline.” Grade cut in half.'] }, { label: 'Copy from the internet', text: 'The plagiarism detector caught it. Formal warning.' }] },
  },
  {
    id: 'x_pede_emprestimo', title: 'Pedido de empréstimo', icon: '💸', scene: 'dinheiro', minAge: 20, maxAge: 80, cooldown: 24,
    when: (g) => g.money >= 1500,
    bind: { amigo: role('amigo', 'irmao', 'colega'), valor: amount(400, 1200, 100) },
    text: '{amigo.nome} pede {$valor} emprestados: "Te pago mês que vem, juro."',
    choices: [
      {
        label: 'Emprestar', hint: 'Pode não voltar',
        outcomes: [
          { chance: 0.55, text: '{amigo.nome} devolveu tudo, com um café de agradecimento.', effects: { rel: { amigo: 10 }, karma: 2 } },
          { chance: 1, text: 'O dinheiro nunca voltou e {amigo.nome} passou a evitar suas mensagens.', effects: { rel: { amigo: -15 }, run: (g, ctx) => { changeMoney(g, -Number(ctx.valor)); } } },
        ],
      },
      { label: 'Dar um valor menor, de presente', text: 'Você deu metade sem esperar retorno. Deixou claro que não era empréstimo.', effects: { karma: 3, rel: { amigo: 8 }, run: (g, ctx) => { changeMoney(g, -Math.round(Number(ctx.valor) / 2)); } } },
      { label: 'Recusar educadamente', text: 'Você explicou que mistura amizade com dinheiro dá confusão. {amigo.nome} entendeu, meio sem graça.', effects: { rel: { amigo: -6 } } },
    ],
    en: { title: 'Loan request', text: '{amigo.nome} asks to borrow {$valor}: “I will pay you back next month, I swear.”', choices: [{ label: 'Lend it', hint: 'May not come back', outcomes: ['{amigo.nome} paid back everything, with a thank-you coffee.', 'The money never came back and {amigo.nome} started avoiding your messages.'] }, { label: 'Give a smaller amount as a gift', text: 'You gave half without expecting anything back. You made clear it was not a loan.' }, { label: 'Politely decline', text: 'You explained that mixing friendship and money causes trouble. {amigo.nome} understood, a bit awkwardly.' }] },
  },
  {
    id: 'x_reencontro', title: 'Reencontro inesperado', icon: '🤝', scene: 'amor', minAge: 25, maxAge: 85, cooldown: 30,
    bind: { amigo: roleWith(30, 'amigo', 'colega') },
    text: 'No meio da rua, você esbarra em {amigo.nome}, que você não via há anos. O abraço dura longos segundos.',
    choices: [
      { label: 'Combinar um jantar', text: 'Horas de histórias antigas. Parecia que o tempo não tinha passado.', effects: { rel: { amigo: 15 }, stats: { felicidade: 7, estresse: -4 }, money: -100 } },
      { label: 'Trocar números e deixar para depois', text: 'Vocês prometeram marcar. As mensagens foram ficando espaçadas...', effects: { rel: { amigo: 2 } } },
    ],
    en: { title: 'Unexpected reunion', text: 'In the middle of the street, you bump into {amigo.nome}, whom you had not seen in years. The hug lasts long seconds.', choices: [{ label: 'Arrange a dinner', text: 'Hours of old stories. It felt like no time had passed.' }, { label: 'Swap numbers and leave it for later', text: 'You promised to meet. The messages slowly grew further apart...' }] },
  },
  {
    id: 'x_casamento_amigo', title: 'Convite de casamento', icon: '💒', scene: 'festa', minAge: 22, maxAge: 60, cooldown: 30,
    bind: { amigo: role('amigo', 'colega', 'irmao') },
    text: '{amigo.nome} vai se casar e quer você na festa. Hotel, presente e roupa vão pesar no bolso.',
    choices: [
      { label: 'Ir com presente caprichado ($700)', hint: '$700', when: (g) => g.money >= 700, text: 'Dançou até os sapatos pedirem socorro. {amigo.nome} chorou ao te ver.', effects: { money: -700, rel: { amigo: 12 }, stats: { felicidade: 7 } } },
      { label: 'Ir com presente simples ($150)', hint: '$150', when: (g) => g.money >= 150, text: 'Festa linda, e o presente simples foi aceito com carinho.', effects: { money: -150, rel: { amigo: 6 }, stats: { felicidade: 4 } } },
      { label: 'Mandar um abraço virtual', text: '{amigo.nome} entendeu... talvez. Mas ficou aquele gosto de ausência.', effects: { rel: { amigo: -10 } } },
    ],
    en: { title: 'Wedding invitation', text: '{amigo.nome} is getting married and wants you at the party. Hotel, gift and outfit will weigh on the wallet.', choices: [{ label: 'Go with a nice gift ($700)', hint: '$700', text: 'You danced until your shoes begged for mercy. {amigo.nome} cried on seeing you.' }, { label: 'Go with a simple gift ($150)', hint: '$150', text: 'Beautiful party, and the simple gift was warmly accepted.' }, { label: 'Send a virtual hug', text: '{amigo.nome} understood... maybe. But a taste of absence remained.' }] },
  },
  {
    id: 'x_irmao_mudanca', title: 'Dia de mudança', icon: '📦', scene: 'casa', minAge: 20, maxAge: 60, cooldown: 30,
    bind: { irmao: role('irmao') },
    text: '{irmao.nome} vai se mudar no sábado e pediu ajuda com as caixas. São 47 caixas e um sofá que não passa na porta.',
    choices: [
      { label: 'Ajudar o dia todo', text: 'Costas doloridas, mas a pizza no chão da casa nova valeu cada caixa.', effects: { rel: { irmao: 12 }, stats: { saude: -1, felicidade: 4 } } },
      { label: 'Contratar uma empresa de mudança ($300)', hint: '$300', when: (g) => g.money >= 300, text: 'Você pagou, {irmao.nome} agradeceu e todo mundo evitou o sofá.', effects: { money: -300, rel: { irmao: 8 } } },
      { label: 'Inventar compromisso', text: '{irmao.nome} percebeu a desculpa. Silêncio constrangedor no grupo da família.', effects: { rel: { irmao: -10 } } },
    ],
    en: { title: 'Moving day', text: '{irmao.nome} is moving on Saturday and asked for help with boxes. That is 47 boxes and a couch that will not fit through the door.', choices: [{ label: 'Help all day', text: 'Sore back, but the pizza on the new floor was worth every box.' }, { label: 'Hire a moving company ($300)', hint: '$300', text: 'You paid, {irmao.nome} was grateful and everyone avoided the couch.' }, { label: 'Make up a conflict', text: '{irmao.nome} noticed the excuse. Awkward silence in the family chat.' }] },
  },
  {
    id: 'x_ligacao_mae', title: 'Ligação em horário estranho', icon: '☎️', scene: 'casa', minAge: 18, maxAge: 70, cooldown: 18,
    bind: { p: role('mae', 'pai') },
    text: '{p.nome} liga sem motivo aparente. A conversa vai de receitas a fofocas da vizinhança.',
    choices: [
      { label: 'Atender e conversar', text: 'Meia hora de papo e você desligou com o coração mais leve.', effects: { rel: { p: 8 }, stats: { felicidade: 4, estresse: -3 } } },
      { label: 'Deixar tocar', text: 'Você viu a chamada perdida e se sentiu mal pelo resto do dia.', effects: { rel: { p: -5 }, stats: { felicidade: -2 } } },
    ],
    en: { title: 'A call at an odd hour', text: '{p.nome} calls for no apparent reason. The talk ranges from recipes to neighborhood gossip.', choices: [{ label: 'Answer and chat', text: 'Half an hour of talk and you hung up with a lighter heart.' }, { label: 'Let it ring', text: 'You saw the missed call and felt bad for the rest of the day.' }] },
  },
  {
    id: 'x_jantar_familia', title: 'Almoço de domingo', icon: '🍲', scene: 'casa', minAge: 18, maxAge: 80, cooldown: 20,
    bind: { p: role('mae', 'pai', 'irmao') },
    text: 'No almoço de domingo, {p.nome} solta um comentário sobre política que incendeia a mesa.',
    choices: [
      { label: 'Entrar na discussão', text: 'Vozes subiram, garfos tremeram. Todos saíram com a sobremesa na mão e a cara fechada.', effects: { rel: { p: -8 }, stats: { estresse: 6 } } },
      { label: 'Mudar de assunto com humor', hint: 'Carisma ajuda', outcomes: [
        { chance: (g) => 0.4 + g.player.stats.carisma / 200, text: 'Uma piada sobre o pudim salvou o almoço. Aplausos silenciosos.', effects: { rel: { p: 5 }, stats: { carisma: 1, felicidade: 3 } } },
        { chance: 1, text: 'A piada não colou, mas ao menos desviou o assunto.', effects: { stats: { estresse: 2 } } },
      ] },
      { label: 'Ficar quiet{eu.o} comendo', text: 'Uma refeição em paz, ainda que tensa.', effects: { stats: { estresse: 1 } } },
    ],
    en: { title: 'Sunday lunch', text: 'At Sunday lunch, {p.nome} drops a political comment that sets the table on fire.', choices: [{ label: 'Join the argument', text: 'Voices rose, forks trembled. Everyone left with dessert in hand and a long face.' }, { label: 'Change the subject with humor', hint: 'Charisma helps', outcomes: ['A joke about the pudding saved lunch. Silent applause.', 'The joke did not land, but at least it changed the subject.'] }, { label: 'Stay quiet and eat', text: 'A peaceful meal, if tense.' }] },
  },
  {
    id: 'x_pais_idosos', title: 'Cuidar dos pais', icon: '👵', scene: 'casa', minAge: 35, maxAge: 70, cooldown: 36,
    bind: { p: role('mae', 'pai') },
    check: (g, ctx) => ageYears(g, g.npcs[ctx.p]) >= 70,
    text: '{p.nome} está com dificuldade de se virar sozinh{p.o} e as contas médicas começam a pesar.',
    choices: [
      { label: 'Pagar um cuidador ($600/mês)', hint: '$600', when: (g) => g.money >= 600, text: 'Uma enfermeira simpática passou a visitar {p.nome} todos os dias. Você sente alívio.', effects: { money: -600, rel: { p: 10 }, karma: 3, stats: { estresse: -4 } } },
      { label: 'Cuidar pessoalmente', text: 'Semanas puxadas, mas vocês ficaram muito mais próximos.', effects: { rel: { p: 18 }, karma: 4, stats: { estresse: 8, felicidade: 3 } } },
      { label: 'Procurar uma casa de repouso', text: 'Foi uma decisão dolorosa. {p.nome} se adaptou melhor do que você temia.', effects: { money: -400, rel: { p: -5 }, stats: { estresse: 3 } } },
    ],
    en: { title: 'Caring for aging parents', text: '{p.nome} is struggling to cope alone and medical bills are starting to weigh.', choices: [{ label: 'Pay a caregiver ($600/month)', hint: '$600', text: 'A kind nurse started visiting {p.nome} every day. You feel relief.' }, { label: 'Care personally', text: 'Hard weeks, but you grew much closer.' }, { label: 'Look for a nursing home', text: 'It was a painful decision. {p.nome} adapted better than you feared.' }] },
  },
  {
    id: 'x_reuniao_escola_filho', title: 'Reunião de pais', icon: '🧑‍🏫', scene: 'escola', minAge: 26, maxAge: 60, cooldown: 24,
    bind: { filho: role('filho') },
    check: (g, ctx) => ageYears(g, g.npcs[ctx.filho]) <= 17,
    text: 'A professora de {filho.nome} chamou você: o desempenho caiu e ela está preocupada.',
    choices: [
      { label: 'Sentar com {filho.nome} e ajudar nos estudos', text: 'Noites de dever de casa juntos. As notas voltaram, e o vínculo ficou.', effects: { rel: { filho: 12 }, stats: { estresse: 3, felicidade: 3 } } },
      { label: 'Pagar aulas particulares ($400)', hint: '$400', when: (g) => g.money >= 400, text: 'O reforço funcionou, mas {filho.nome} queria mais da sua atenção.', effects: { money: -400, rel: { filho: 3 } } },
      { label: 'Dar uma bronca', text: '{filho.nome} fechou a cara e ficou dois dias sem falar.', effects: { rel: { filho: -10 }, stats: { estresse: 4 } } },
    ],
    en: { title: 'Parent-teacher meeting', text: '{filho.nome}’s teacher called you in: performance has dropped and she is worried.', choices: [{ label: 'Sit with {filho.nome} and help study', text: 'Evenings of homework together. Grades recovered, and the bond stayed.' }, { label: 'Pay for tutoring ($400)', hint: '$400', text: 'The tutoring worked, but {filho.nome} wanted more of your attention.' }, { label: 'Give a scolding', text: '{filho.nome} sulked and did not speak for two days.' }] },
  },
  {
    id: 'x_vizinho_barulho', title: 'Vizinho barulhento', icon: '🔊', scene: 'casa', minAge: 20, maxAge: 85, cooldown: 24,
    when: (g) => !g.livesWithParents,
    text: 'O vizinho do andar de cima faz festa toda quinta-feira às 2 da manhã.',
    choices: [
      { label: 'Bater na porta e conversar', outcomes: [
        { chance: 0.6, text: 'Ele pediu desculpas e até te convidou para a próxima. O barulho diminuiu.', effects: { stats: { estresse: -3, carisma: 1 } } },
        { chance: 1, text: 'Ele fechou a porta na sua cara. A festa continuou.', effects: { stats: { estresse: 5 } } },
      ] },
      { label: 'Ligar para a polícia', text: 'A patrulha veio e a festa acabou. O clima no prédio ficou pesado.', effects: { stats: { estresse: 2 }, karma: -1 } },
      { label: 'Comprar protetores de ouvido ($30)', hint: '$30', text: 'Dormiu como um bebê. Problema resolvido, orgulho ferido.', effects: { money: -30, stats: { estresse: -2 } } },
    ],
    en: { title: 'Noisy neighbor', text: 'The upstairs neighbor throws a party every Thursday at 2 a.m.', choices: [{ label: 'Knock on the door and talk', outcomes: ['He apologized and even invited you to the next one. The noise dropped.', 'He shut the door in your face. The party went on.'] }, { label: 'Call the police', text: 'The patrol came and the party ended. The mood in the building got heavy.' }, { label: 'Buy earplugs ($30)', hint: '$30', text: 'You slept like a baby. Problem solved, pride wounded.' }] },
  },
  {
    id: 'x_sogra', title: 'Visita surpresa', icon: '🚪', scene: 'amor', minAge: 22, maxAge: 70, cooldown: 24,
    when: (g) => Object.values(g.npcs).some((n) => n.alive && (n.role === 'parceiro' || n.role === 'conjuge')),
    bind: { p: role('parceiro', 'conjuge') },
    text: 'A mãe de {p.nome} apareceu sem avisar, com mala. "Fico só uns dias", disse.',
    choices: [
      { label: 'Receber de braços abertos', text: 'Foram duas semanas de comida demais e opiniões demais. No fim, você a achou adorável.', effects: { rel: { p: 8 }, stats: { estresse: 5, felicidade: 2 } } },
      { label: 'Sugerir um hotel gentilmente ($250)', hint: '$250', when: (g) => g.money >= 250, text: 'Você pagou o hotel e todo mundo manteve a sanidade.', effects: { money: -250, rel: { p: 2 } } },
      { label: 'Reclamar com {p.nome}', text: '{p.nome} ficou entre a mãe e você, e ninguém gostou.', effects: { rel: { p: -10 }, stats: { estresse: 6 } } },
    ],
    en: { title: 'Surprise visit', text: '{p.nome}’s mother showed up unannounced, with a suitcase. “Just a few days,” she said.', choices: [{ label: 'Welcome with open arms', text: 'Two weeks of too much food and too many opinions. In the end, you found her lovely.' }, { label: 'Gently suggest a hotel ($250)', hint: '$250', text: 'You paid for the hotel and everyone kept their sanity.' }, { label: 'Complain to {p.nome}', text: '{p.nome} was caught between mother and you, and nobody liked it.' }] },
  },
  {
    id: 'x_febre_crianca', title: 'Noite de febre', icon: '🌡️', scene: 'saude', minAge: 1, maxAge: 10, cooldown: 36,
    bind: { p: role('mae', 'pai') },
    text: 'Você acordou no meio da noite com febre alta. {p.nome} acendeu a luz do corredor, preocupad{p.o}.',
    choices: [
      { label: 'Ficar quieto e deixar cuidarem', text: '{p.nome} ficou ao seu lado com panos frios até amanhecer. Você se sentiu amad{eu.o}.', effects: { rel: { p: 10 }, stats: { saude: -3, felicidade: 2 }, run: (g) => { addCondition(g, 'gripe'); } } },
      { label: 'Pedir para ir à escola mesmo assim', text: 'Você contaminou meia turma. A professora ficou furiosa.', effects: { rel: { p: -3 }, stats: { saude: -5, felicidade: -2 }, karma: -1, run: (g) => { addCondition(g, 'gripe'); } } },
    ],
    en: { title: 'Fever night', text: 'You woke up in the middle of the night with a high fever. {p.nome} turned on the hallway light, worried.', choices: [{ label: 'Stay still and let them care', text: '{p.nome} stayed by your side with cold cloths until dawn. You felt loved.' }, { label: 'Ask to go to school anyway', text: 'You infected half the class. The teacher was furious.' }] },
  },
];
