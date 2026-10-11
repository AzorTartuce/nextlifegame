import { ageYears } from '../../core';
import { role, roleWith } from '../binders';
import type { GameState } from '../../types';
import type { Storylet } from '../engine';

const abroad = (g: GameState) => g.country !== g.birthCountry;

/** Eventos extras: fama, imigração, humor, dilemas morais e velhice. */
export const EXTRA4: Storylet[] = [
  {
    id: 'x_video_viral', title: 'Viralizou', icon: '📹', scene: 'festa', minAge: 12, maxAge: 60, cooldown: 30, weight: 0.8,
    text: 'Um vídeo seu #viral# foi parar nas redes e tem milhões de visualizações.',
    choices: [
      { label: 'Aproveitar a fama', outcomes: [
        { chance: 0.4, text: 'Marcas te procuraram e você fechou uma parceria.', effects: { money: 900, stats: { carisma: 2, felicidade: 7 } } },
        { chance: 1, text: 'A fama durou três dias. Ficaram os memes e algumas piadas.', effects: { stats: { felicidade: 2, estresse: 3 } } },
      ] },
      { label: 'Pedir para tirarem do ar', text: 'Aos poucos o vídeo sumiu. Sua privacidade voltou.', effects: { stats: { estresse: -3 } } },
    ],
    en: { title: 'Went viral', text: 'A video of you #viral# ended up on social media and has millions of views.', choices: [{ label: 'Make the most of the fame', outcomes: ['Brands reached out and you signed a partnership.', 'The fame lasted three days. Memes and a few jokes remained.'] }, { label: 'Ask to have it taken down', text: 'Gradually the video disappeared. Your privacy returned.' }] },
  },
  {
    id: 'x_olheiro', title: 'Olheiro na arquibancada', icon: '⚽', scene: 'festa', minAge: 12, maxAge: 24, cooldown: 36, weight: 0.6,
    when: (g) => g.player.stats.saude >= 55,
    text: 'No jogo da escola, um desconhecido anota seu nome. Depois se apresenta como olheiro de um clube.',
    choices: [
      { label: 'Fazer o teste no clube', hint: 'Saúde ajuda', outcomes: [
        { chance: (g) => 0.15 + g.player.stats.saude / 400, text: 'Você foi aprovad{eu.o} nas categorias de base!', effects: { stats: { felicidade: 10, saude: 3, carisma: 1 }, flags: { atletaBase: true } } },
        { chance: 1, text: 'Faltou fôlego e técnica. Mas você aprendeu muito no teste.', effects: { stats: { felicidade: -2, saude: 1 } } },
      ] },
      { label: 'Priorizar os estudos', text: 'Você agradeceu e seguiu no caminho acadêmico.', effects: { stats: { inteligencia: 1 } } },
    ],
    en: { title: 'Scout in the stands', text: 'At the school game, a stranger writes down your name. Then introduces himself as a club scout.', choices: [{ label: 'Try out at the club', hint: 'Health helps', outcomes: ['You made it into the youth academy!', 'Lacked stamina and technique. But you learned a lot at the tryout.'] }, { label: 'Prioritize studies', text: 'You thanked him and stayed on the academic path.' }] },
  },
  {
    id: 'x_show_pequeno', title: 'Show em bar pequeno', icon: '🎶', scene: 'festa', minAge: 16, maxAge: 60, cooldown: 24, weight: 0.8,
    when: (g) => g.player.stats.carisma >= 40,
    text: 'O dono de um barzinho te chamou para tocar numa noite de microfone aberto.',
    choices: [
      { label: 'Subir ao palco', outcomes: [
        { chance: (g) => 0.3 + g.player.stats.carisma / 250, text: 'A casa lotou e o público cantou junto. Você saiu com um cachê e novos fãs.', effects: { money: 200, stats: { carisma: 1.5, felicidade: 8 } } },
        { chance: 1, text: 'Só os garçons assistiram. Mas foi uma boa prática.', effects: { stats: { carisma: 0.5, felicidade: 1 } } },
      ] },
      { label: 'Agradecer e recusar', text: 'Palco não é para você, e tudo bem.', effects: {} },
    ],
    en: { title: 'Small bar gig', text: 'The owner of a little bar asked you to perform on an open-mic night.', choices: [{ label: 'Take the stage', outcomes: ['The house filled and the audience sang along. You left with a fee and new fans.', 'Only the waiters watched. But it was good practice.'] }, { label: 'Thank and decline', text: 'The stage is not for you, and that is fine.' }] },
  },
  {
    id: 'x_maratona', title: 'Maratona da cidade', icon: '🏅', scene: 'natureza', minAge: 16, maxAge: 65, cooldown: 36,
    text: 'Seus amigos se inscreveram na maratona da cidade e te desafiaram a completar os 10 km.',
    choices: [
      { label: 'Treinar e correr', outcomes: [
        { chance: (g) => 0.4 + g.player.stats.saude / 200, text: 'Você cruzou a linha de chegada com lágrimas e medalha.', effects: { stats: { saude: 4, felicidade: 8, estresse: -4 }, money: -40 } },
        { chance: 1, text: 'Cãibra no km 7. Você terminou caminhando, mas terminou.', effects: { stats: { saude: -2, felicidade: 4 }, money: -40 } },
      ] },
      { label: 'Torcer da calçada', text: 'Distribuiu água e bateu palmas. Também faz parte.', effects: { stats: { felicidade: 3 } } },
    ],
    en: { title: 'City race', text: 'Your friends signed up for the city race and dared you to finish the 10 km.', choices: [{ label: 'Train and run', outcomes: ['You crossed the finish line with tears and a medal.', 'Cramp at km 7. You finished walking, but you finished.'] }, { label: 'Cheer from the sidewalk', text: 'You handed out water and clapped. That counts too.' }] },
  },
  {
    id: 'x_papel_novela', title: 'Teste para figurante', icon: '🎬', scene: 'festa', minAge: 14, maxAge: 70, cooldown: 36, weight: 0.5,
    text: 'Uma produtora procura figurantes e você acha que tem chance. Um dia inteiro de filmagem por $120.',
    choices: [
      { label: 'Ir ao teste', outcomes: [
        { chance: (g) => 0.3 + g.player.stats.aparencia / 300, text: 'Você apareceu por 2 segundos, ao fundo. Mas contou para todo mundo.', effects: { money: 120, stats: { carisma: 1, felicidade: 6 } } },
        { chance: 1, text: 'Esperou o dia inteiro e ninguém chamou seu nome.', effects: { stats: { felicidade: -2 } } },
      ] },
      { label: 'Não vale o dia', text: 'Você preferiu seguir a rotina.', effects: {} },
    ],
    en: { title: 'Extra audition', text: 'A production company is looking for extras and you think you have a shot. A full filming day for $120.', choices: [{ label: 'Go to the audition', outcomes: ['You appeared for 2 seconds in the background. But you told everyone.', 'You waited all day and nobody called your name.'] }, { label: 'Not worth the day', text: 'You preferred to keep your routine.' }] },
  },
  {
    id: 'x_imigrante_saudade', title: 'Saudade de casa', icon: '🏠', scene: 'casa', minAge: 18, maxAge: 90, cooldown: 24,
    when: abroad,
    text: 'Nesta noite, a comida que você faz não tem o gosto de casa. A saudade de {pais} bate forte.',
    choices: [
      { label: 'Ligar para a família', text: 'Duas horas de chamada de vídeo. Você chorou e riu.', effects: { stats: { felicidade: 5, estresse: -4 } } },
      { label: 'Cozinhar um prato típico', text: 'Os vizinhos sentiram o cheiro e pediram para provar. Você fez amizades.', effects: { money: -40, stats: { felicidade: 4, carisma: 1 } } },
      { label: 'Guardar para si', text: 'O silêncio da noite foi mais pesado que o normal.', effects: { stats: { felicidade: -3, estresse: 3 } } },
    ],
    en: { title: 'Homesickness', text: 'Tonight, the food you cook does not taste like home. Longing for {pais} hits hard.', choices: [{ label: 'Call family', text: 'Two hours of video call. You cried and laughed.' }, { label: 'Cook a typical dish', text: 'The neighbors smelled it and asked to taste. You made friends.' }, { label: 'Keep it to yourself', text: 'The silence of the night was heavier than usual.' }] },
  },
  {
    id: 'x_imigrante_burocracia', title: 'Burocracia de documentos', icon: '📑', scene: 'trabalho', minAge: 18, maxAge: 90, cooldown: 36,
    when: abroad,
    text: 'O órgão de imigração pediu mais um documento. Já é o quinto. Os guichês fecham às 14h.',
    choices: [
      { label: 'Contratar despachante ($300)', hint: '$300', when: (g) => g.money >= 300, text: 'O despachante resolveu em uma semana.', effects: { money: -300, stats: { estresse: -3 } } },
      { label: 'Resolver sozinh{eu.o}', outcomes: [
        { chance: 0.5, text: 'Depois de três filas e duas viagens, tudo ok.', effects: { stats: { estresse: 6, inteligencia: 0.5 } } },
        { chance: 1, text: 'Erro de formulário: tudo de novo, com multa.', effects: { money: -120, stats: { estresse: 9 } } },
      ] },
    ],
    en: { title: 'Document paperwork', text: 'The immigration office asked for yet another document. It is already the fifth. Counters close at 2 p.m.', choices: [{ label: 'Hire a fixer ($300)', hint: '$300', text: 'The fixer sorted it out in a week.' }, { label: 'Handle it yourself', outcomes: ['After three lines and two trips, all fine.', 'Form error: start over, with a fine.'] }] },
  },
  {
    id: 'x_imigrante_idioma', title: 'Mal-entendido no idioma', icon: '🗣️', scene: 'trabalho', minAge: 12, maxAge: 90, cooldown: 18, weight: 1.2,
    when: abroad,
    text: 'Você entendeu errado uma expressão local e respondeu com algo constrangedor no meio de uma reunião.',
    choices: [
      { label: 'Rir de si mesmo', text: 'A sala riu junto. Foi o início de uma amizade inesperada.', effects: { stats: { carisma: 1, felicidade: 3 } } },
      { label: 'Ficar vermelho e calar', text: 'Você virou o gringo que erra. Passou, mas doeu.', effects: { stats: { felicidade: -2, estresse: 3 } } },
      { label: 'Matricular-se num curso de idioma ($150)', hint: '$150', when: (g) => g.money >= 150, text: 'Três meses depois você já discutia política em dialeto local.', effects: { money: -150, stats: { inteligencia: 2, carisma: 1 } } },
    ],
    en: { title: 'Language mix-up', text: 'You misunderstood a local expression and answered with something embarrassing in the middle of a meeting.', choices: [{ label: 'Laugh at yourself', text: 'The room laughed along. It was the start of an unexpected friendship.' }, { label: 'Blush and fall silent', text: 'You became the foreigner who makes mistakes. It passed, but it hurt.' }, { label: 'Enroll in a language course ($150)', hint: '$150', text: 'Three months later you were debating politics in local slang.' }] },
  },
  {
    id: 'x_vizinho_acolhe', title: 'Boas-vindas do bairro', icon: '🫶', scene: 'casa', minAge: 18, maxAge: 90, cooldown: 36,
    when: abroad,
    text: 'Uma vizinha idosa bate na porta com uma torta: "Bem-vindo{eu.o}! Qualquer coisa, é só chamar."',
    choices: [
      { label: 'Aceitar e conversar', text: 'Você ganhou uma amiga e um guia de todos os segredos da região.', effects: { karma: 2, stats: { felicidade: 6, estresse: -3 } } },
      { label: 'Agradecer e fechar a porta', text: 'Você estava com pressa. A torta estava deliciosa.', effects: { stats: { felicidade: 1 } } },
    ],
    en: { title: 'Neighborhood welcome', text: 'An elderly neighbor knocks with a pie: “Welcome! Anything you need, just ask.”', choices: [{ label: 'Accept and chat', text: 'You gained a friend and a guide to all the area’s secrets.' }, { label: 'Thank her and close the door', text: 'You were in a rush. The pie was delicious.' }] },
  },
  {
    id: 'x_pombo_guerra', title: 'Guerra do pombo', icon: '🕊️', scene: 'casa', minAge: 8, maxAge: 95, cooldown: 24, weight: 1.2,
    text: 'Um pombo fez ninho na sua janela e desafia você todas as manhãs. Hoje ele roubou seu pão.',
    choices: [
      { label: 'Declarar guerra', text: 'Dias de batalha com pano e vassoura. O pombo venceu em placar de 7 a 0.', effects: { stats: { estresse: 3, felicidade: 1 } } },
      { label: 'Adotar o pombo', text: 'Você o chamou de Gilberto. Ele agora te espera todo dia, e você o espera também.', effects: { stats: { felicidade: 5 }, karma: 1 } },
    ],
    en: { title: 'Pigeon war', text: 'A pigeon nested on your window and challenges you every morning. Today it stole your bread.', choices: [{ label: 'Declare war', text: 'Days of battle with a cloth and a broom. The pigeon won 7 to 0.' }, { label: 'Adopt the pigeon', text: 'You named him Gilbert. He now waits for you every day, and you wait for him too.' }] },
  },
  {
    id: 'x_loteria', title: 'Bilhete premiado?', icon: '🎟️', scene: 'dinheiro', minAge: 18, maxAge: 95, cooldown: 36, weight: 0.5,
    text: 'No caixa da padaria, você pega um bilhete de loteria por impulso. Dois dias depois, você confere o resultado.',
    choices: [
      { label: 'Conferir os números', outcomes: [
        { chance: 0.04, text: 'Você acertou a quina! Um prêmio razoável caiu na conta.', effects: { money: 4000, stats: { felicidade: 10 } } },
        { chance: 0.25, text: 'Acertou três números: o suficiente para pagar o café do mês.', effects: { money: 60, stats: { felicidade: 2 } } },
        { chance: 1, text: 'Nenhum acerto. O bilhete virou marcador de página.', effects: { money: -10 } },
      ] },
      { label: 'Esquecer o bilhete', text: 'Ele ficou perdido no bolso do casaco. Talvez fosse o prêmio, talvez não.', effects: {} },
    ],
    en: { title: 'Winning ticket?', text: 'At the bakery counter you grab a lottery ticket on impulse. Two days later, you check the result.', choices: [{ label: 'Check the numbers', outcomes: ['You hit the jackpot tier! A decent prize landed in your account.', 'Three numbers matched: enough to pay for the month’s coffee.', 'No match. The ticket became a bookmark.'] }, { label: 'Forget the ticket', text: 'It stayed lost in a coat pocket. Maybe it was the prize, maybe not.' }] },
  },
  {
    id: 'x_acidente_leve', title: 'Tombo humilhante', icon: '🤕', scene: 'perigo', minAge: 6, maxAge: 95, cooldown: 24, weight: 1.1,
    text: 'Você escorregou numa casca de banana (sim, isso existe) diante de uma multidão.',
    choices: [
      { label: 'Levantar sorrindo', text: 'Aplausos tímidos. Você fez uma reverência.', effects: { stats: { carisma: 1, felicidade: 2, saude: -1 } } },
      { label: 'Fingir que nada aconteceu', text: 'Mancou até a esquina. Dignidade preservada (quase).', effects: { stats: { saude: -2, estresse: 2 } } },
    ],
    en: { title: 'Humiliating tumble', text: 'You slipped on a banana peel (yes, they exist) in front of a crowd.', choices: [{ label: 'Get up smiling', text: 'Timid applause. You took a bow.' }, { label: 'Pretend nothing happened', text: 'You limped to the corner. Dignity preserved (almost).' }] },
  },
  {
    id: 'x_pegadinha', title: 'Pegadinha de aniversário', icon: '🎂', scene: 'festa', minAge: 10, maxAge: 80, cooldown: 24,
    bind: { amigo: roleWith(20, 'amigo', 'irmao', 'colega') },
    text: '{amigo.nome} organizou uma festa-surpresa de aniversário. Quando você abriu a porta, estavam todos escondidos.',
    choices: [
      { label: 'Fingir surpresa', text: 'Todos saíram gritando. Você interpretou o susto como um oscar.', effects: { rel: { amigo: 8 }, stats: { felicidade: 7 } } },
      { label: 'Contar que já sabia', text: '{amigo.nome} fez cara de decepcionad{amigo.o}, mas a festa foi ótima.', effects: { rel: { amigo: 2 }, stats: { felicidade: 4 } } },
    ],
    en: { title: 'Birthday surprise', text: '{amigo.nome} organized a surprise birthday party. When you opened the door, everyone was hiding.', choices: [{ label: 'Fake surprise', text: 'Everyone jumped out shouting. You acted the shock like an Oscar winner.' }, { label: 'Say you already knew', text: '{amigo.nome} looked disappointed, but the party was great.' }] },
  },
  {
    id: 'x_pais_segredo', title: 'Segredo de família', icon: '🗝️', scene: 'casa', minAge: 20, maxAge: 85, cooldown: 60, weight: 0.5,
    bind: { p: role('mae', 'pai') },
    text: 'Entre fotos antigas, você achou cartas que sugerem que {p.nome} guardava um segredo por décadas.',
    choices: [
      { label: 'Perguntar diretamente', text: 'Foi uma conversa dura e bonita. Vocês se conheceram melhor.', effects: { rel: { p: 12 }, stats: { felicidade: 3, estresse: 4 } } },
      { label: 'Guardar as cartas e esquecer', text: 'Você as devolveu à caixa. Alguns segredos têm direito de ficar.', effects: { karma: 1 } },
    ],
    en: { title: 'Family secret', text: 'Among old photos, you found letters suggesting that {p.nome} kept a secret for decades.', choices: [{ label: 'Ask directly', text: 'It was a hard and beautiful conversation. You got to know each other better.' }, { label: 'Keep the letters and forget it', text: 'You put them back in the box. Some secrets have a right to stay.' }] },
  },
  {
    id: 'x_mentira_branca', title: 'Pequena mentira', icon: '🤥', scene: 'amor', minAge: 14, maxAge: 85, cooldown: 24,
    bind: { amigo: role('amigo', 'parceiro', 'conjuge', 'colega') },
    text: '{amigo.nome} pergunta se você gostou do presente que ganhou. Você achou horrível.',
    choices: [
      { label: 'Mentir educadamente', text: '{amigo.nome} sorriu feliz. O presente foi parar no fundo do armário.', effects: { rel: { amigo: 3 }, karma: -1 } },
      { label: 'Ser sincero com gentileza', text: 'Você explicou com cuidado. {amigo.nome} agradeceu a honestidade.', effects: { rel: { amigo: 5 }, karma: 1, stats: { carisma: 0.5 } } },
      { label: 'Falar na lata', text: '{amigo.nome} ficou magoad{amigo.o} por semanas.', effects: { rel: { amigo: -12 } } },
    ],
    en: { title: 'Little white lie', text: '{amigo.nome} asks whether you liked the gift you got. You found it awful.', choices: [{ label: 'Lie politely', text: '{amigo.nome} smiled happily. The gift ended up at the back of the closet.' }, { label: 'Be honest, kindly', text: 'You explained carefully. {amigo.nome} thanked you for the honesty.' }, { label: 'Say it bluntly', text: '{amigo.nome} was hurt for weeks.' }] },
  },
  {
    id: 'x_acidente_carro_dano', title: 'Arranhão no carro alheio', icon: '🚘', scene: 'perigo', minAge: 18, maxAge: 85, cooldown: 36,
    when: (g) => g.money >= 400,
    text: 'Ao manobrar, você arranhou o carro estacionado ao lado. Ninguém viu e não há câmeras.',
    choices: [
      { label: 'Deixar um bilhete com contato', text: 'O dono ligou, resolveram o conserto por $350 e ele agradeceu a honestidade.', effects: { money: -350, karma: 5 } },
      { label: 'Ir embora', text: 'Sem testemunhas, sem consequências. Só o peso na consciência.', effects: { karma: -5, stats: { estresse: 3 } } },
    ],
    en: { title: 'Scratch on someone’s car', text: 'While maneuvering, you scratched the car parked next to you. Nobody saw and there are no cameras.', choices: [{ label: 'Leave a note with contact info', text: 'The owner called, you settled the repair for $350 and he thanked you for the honesty.' }, { label: 'Drive away', text: 'No witnesses, no consequences. Just the weight on your conscience.' }] },
  },
  {
    id: 'x_estranho_ajuda', title: 'Desconhecido em apuros', icon: '🆘', scene: 'perigo', minAge: 14, maxAge: 85, cooldown: 36,
    text: 'Um desconhecido chora num ponto de ônibus: perdeu a carteira e não consegue voltar para casa.',
    choices: [
      { label: 'Pagar a passagem ($20)', hint: '$20', when: (g) => g.money >= 20, text: 'Ele jurou retribuir. Provavelmente nunca vai. Mas você dormiu bem.', effects: { money: -20, karma: 4, stats: { felicidade: 3 } } },
      { label: 'Desconfiar e seguir', text: 'Pode ter sido golpe. Pode ter sido verdade. Você nunca vai saber.', effects: { karma: -1 } },
    ],
    en: { title: 'Stranger in trouble', text: 'A stranger is crying at a bus stop: lost his wallet and cannot get home.', choices: [{ label: 'Pay the fare ($20)', hint: '$20', text: 'He swore to repay you. He probably never will. But you slept well.' }, { label: 'Distrust and keep walking', text: 'It may have been a scam. It may have been true. You will never know.' }] },
  },
  {
    id: 'x_neto_visita', title: 'Visita dos netinhos', icon: '👶', scene: 'casa', minAge: 55, maxAge: 100, cooldown: 24,
    bind: { filho: role('filho') },
    check: (g, ctx) => ageYears(g, g.npcs[ctx.filho]) >= 20,
    text: 'Os filhos de {filho.nome} foram passar o fim de semana na sua casa e transformaram tudo em um parque de diversões.',
    choices: [
      { label: 'Brincar junto', text: 'Você contou histórias, fez bolo e levou uma bolada na cara. Fim de semana perfeito.', effects: { rel: { filho: 8 }, stats: { felicidade: 8, saude: 1, estresse: -4 } } },
      { label: 'Reclamar da bagunça', text: 'Sua casa ficou limpa, mas silenciosa demais depois que foram embora.', effects: { rel: { filho: -3 }, stats: { felicidade: -1 } } },
    ],
    en: { title: 'Grandkids visit', text: '{filho.nome}’s kids came to spend the weekend at your house and turned everything into an amusement park.', choices: [{ label: 'Play along', text: 'You told stories, baked a cake and took a ball to the face. A perfect weekend.' }, { label: 'Complain about the mess', text: 'Your house stayed clean, but too quiet after they left.' }] },
  },
  {
    id: 'x_aposentadoria_tedio', title: 'Rotina vazia', icon: '🛋️', scene: 'casa', minAge: 60, maxAge: 100, cooldown: 24,
    text: 'Os dias estão mais longos. Você já viu todas as reprises e tem a sensação de que sobra tempo.',
    choices: [
      { label: 'Entrar num grupo de caminhada', text: 'Você conheceu gente nova e ganhou fôlego.', effects: { stats: { saude: 3, felicidade: 6, carisma: 1 } } },
      { label: 'Aprender algo novo ($100)', hint: '$100', when: (g) => g.money >= 100, text: 'Aulas de pintura reacenderam sua curiosidade.', effects: { money: -100, stats: { inteligencia: 1.5, felicidade: 5 } } },
      { label: 'Ficar no sofá', text: 'O tempo passou. E passou. E passou.', effects: { stats: { felicidade: -3, saude: -1 } } },
    ],
    en: { title: 'Empty routine', text: 'The days are longer. You have seen all the reruns and feel there is time to spare.', choices: [{ label: 'Join a walking group', text: 'You met new people and gained stamina.' }, { label: 'Learn something new ($100)', hint: '$100', text: 'Painting classes reignited your curiosity.' }, { label: 'Stay on the couch', text: 'Time passed. And passed. And passed.' }] },
  },
  {
    id: 'x_golpe_idoso', title: 'Ligação do "banco"', icon: '📞', scene: 'perigo', minAge: 60, maxAge: 100, cooldown: 30,
    text: 'Uma voz educada diz ser do banco e pede que você confirme sua senha para "evitar fraude".',
    choices: [
      { label: 'Passar a senha', text: 'Em minutos, sua conta foi esvaziada parcialmente.', effects: { money: -1200, stats: { estresse: 8, felicidade: -4 } } },
      { label: 'Desligar e ligar para o banco', text: 'O banco confirmou que era golpe. Você contou a todos os vizinhos.', effects: { karma: 1, stats: { inteligencia: 0.5 } } },
    ],
    en: { title: 'Call from the “bank”', text: 'A polite voice claims to be from the bank and asks you to confirm your password to “avoid fraud.”', choices: [{ label: 'Give the password', text: 'Within minutes, your account was partially emptied.' }, { label: 'Hang up and call the bank', text: 'The bank confirmed it was a scam. You told all the neighbors.' }] },
  },
  {
    id: 'x_memorias_album', title: 'Álbum de fotos', icon: '📷', scene: 'casa', minAge: 55, maxAge: 100, cooldown: 24,
    bind: { amigo: roleWith(10, 'amigo', 'conjuge', 'parceiro', 'irmao') },
    text: 'Numa tarde chuvosa, você achou um álbum antigo. Em uma das fotos, {amigo.nome} sorri ao seu lado.',
    choices: [
      { label: 'Ligar para {amigo.nome}', text: 'Vocês riram de histórias que ninguém mais lembra.', effects: { rel: { amigo: 12 }, stats: { felicidade: 7, estresse: -3 } } },
      { label: 'Ficar só com a lembrança', text: 'Uma nostalgia doce e levemente triste.', effects: { stats: { felicidade: 1 } } },
    ],
    en: { title: 'Photo album', text: 'On a rainy afternoon, you found an old album. In one photo, {amigo.nome} smiles beside you.', choices: [{ label: 'Call {amigo.nome}', text: 'You laughed at stories nobody else remembers.' }, { label: 'Keep only the memory', text: 'A sweet and slightly sad nostalgia.' }] },
  },
  {
    id: 'x_testamento', title: 'Pensar no testamento', icon: '📜', scene: 'casa', minAge: 60, maxAge: 100, once: true,
    when: (g) => g.money >= 5000,
    text: 'Você vem pensando no que será do seu patrimônio. Um advogado se oferece para organizar o testamento.',
    choices: [
      { label: 'Contratar o advogado ($400)', hint: '$400', when: (g) => g.money >= 400, text: 'Tudo em ordem. A família ficou grata pela tranquilidade.', effects: { money: -400, karma: 2, stats: { estresse: -5 } } },
      { label: 'Deixar para os herdeiros decidirem', text: 'Você preferiu não pensar nisso. Eles pensam por você.', effects: { karma: -1 } },
    ],
    en: { title: 'Thinking about a will', text: 'You have been thinking about what will become of your assets. A lawyer offers to arrange the will.', choices: [{ label: 'Hire the lawyer ($400)', hint: '$400', text: 'All in order. The family was grateful for the peace of mind.' }, { label: 'Leave it to the heirs to decide', text: 'You preferred not to think about it. They will think for you.' }] },
  },
  {
    id: 'x_conselho_jovem', title: 'Jovem pede conselho', icon: '🧑‍🎓', scene: 'casa', minAge: 50, maxAge: 100, cooldown: 24,
    text: 'Um jovem do bairro te para na rua: "O senhor poderia me dar um conselho sobre a vida?"',
    choices: [
      { label: 'Contar uma história pessoal', text: 'Você falou dos seus erros e acertos. Ele ouviu com atenção.', effects: { karma: 3, stats: { felicidade: 5, carisma: 1 } } },
      { label: 'Dar um conselho curto', text: '"Seja gentil e durma bem." Ele sorriu sem entender tudo.', effects: { stats: { felicidade: 2 } } },
    ],
    en: { title: 'Young person asks for advice', text: 'A young person from the neighborhood stops you: “Could you give me some life advice?”', choices: [{ label: 'Share a personal story', text: 'You spoke of your mistakes and wins. They listened closely.' }, { label: 'Give short advice', text: '“Be kind and sleep well.” They smiled without fully understanding.' }] },
  },
  {
    id: 'x_time_escolha', title: 'Torcida dividida', icon: '🏟️', scene: 'festa', minAge: 8, maxAge: 90, cooldown: 24, weight: 1.1,
    bind: { amigo: role('amigo', 'irmao', 'pai', 'colega') },
    text: 'Final de campeonato. {amigo.nome} torce para o time rival e já passou a semana provocando.',
    choices: [
      { label: 'Ver o jogo juntos', outcomes: [
        { chance: 0.5, text: 'Seu time venceu! Você comemorou com moderação (nenhuma).', effects: { rel: { amigo: 3 }, stats: { felicidade: 8 } } },
        { chance: 1, text: 'O time rival venceu e você ouviu a zoação por um mês.', effects: { rel: { amigo: 3 }, stats: { felicidade: -3 } } },
      ] },
      { label: 'Ver sozinh{eu.o} com pipoca', text: 'Sem provocação, sem público. Foi quase tranquilo.', effects: { stats: { felicidade: 2 } } },
    ],
    en: { title: 'Divided fans', text: 'Championship final. {amigo.nome} supports the rival team and spent the week teasing.', choices: [{ label: 'Watch together', outcomes: ['Your team won! You celebrated with moderation (none).', 'The rival team won and you heard the teasing for a month.'] }, { label: 'Watch alone with popcorn', text: 'No teasing, no audience. It was almost peaceful.' }] },
  },
];
