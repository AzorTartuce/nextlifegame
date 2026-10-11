import { t } from '../../../i18n';
import { ageYears } from '../../core';
import { chance } from '../../rng';
import { addPet } from '../../systems/pets';
import { role, setRole, stranger } from '../binders';
import type { Storylet } from '../engine';

export const INFANCIA: Storylet[] = [
  {
    id: 'primeira_palavra', title: 'Primeira palavra', icon: '🗣️', scene: 'casa', minAge: 1, maxAge: 2, once: true, priority: true,
    bind: { mae: role('mae') },
    text: 'Sua primeira palavra foi "[mamãe|papai|biscoito|não|au-au|gol]". {mae.nome} gravou e mandou para a família inteira.',
    effects: { stats: { inteligencia: 2, felicidade: 2 }, rel: { mae: 5 } },
  },
  {
    id: 'virose', title: 'Doente', icon: '🤒', scene: 'saude', minAge: 0, maxAge: 9, cooldown: 36,
    text: 'Você pegou [catapora|uma virose|uma gripe daquelas|piolho (de novo)]. Uma semana de sopa e desenho animado.',
    effects: { stats: { saude: -4, felicidade: 1 } },
  },
  {
    id: 'birra', title: 'Escândalo no mercado', icon: '😭', scene: 'casa', minAge: 3, maxAge: 7, once: true,
    bind: { mae: role('mae', 'pai') },
    text: '{mae.nome} se recusou a comprar [um dinossauro de plástico|um chocolate gigante|um balão de unicórnio]. Você sente o choro subindo...',
    choices: [
      {
        label: 'Chorar mais alto, no chão', hint: 'Arriscado',
        outcomes: [
          { chance: 0.4, text: 'Funcionou! Você saiu com o brinquedo e um sorriso vitorioso.', effects: { stats: { felicidade: 6 }, rel: { mae: -4 } } },
          { chance: 1, text: 'Castigo: uma semana sem TV.', effects: { stats: { felicidade: -5 }, rel: { mae: -2 } } },
        ],
      },
      { label: 'Engolir o choro', text: '{mae.nome} ficou orgulhos{mae.o} e te deu um abraço apertado.', effects: { stats: { inteligencia: 1 }, rel: { mae: 5 } } },
    ],
  },
  {
    id: 'desenho', title: 'Pequeno artista', icon: '🖍️', scene: 'escola', minAge: 4, maxAge: 9, once: true,
    text: 'A professora elogiou seu desenho de [um dragão|sua família|um foguete|um gato astronauta] na frente de todo mundo.',
    choices: [
      { label: 'Desenhar todo dia', text: 'Seus cadernos viraram galerias de arte.', effects: { stats: { inteligencia: 2, felicidade: 4 }, flags: { talento_arte: true } } },
      { label: 'Prefiro jogar bola', text: 'O recreio é seu reino.', effects: { stats: { saude: 4, carisma: 2 } } },
    ],
  },
  {
    id: 'bully', title: 'O valentão', icon: '😠', scene: 'escola', minAge: 7, maxAge: 14, cooldown: 48,
    bind: { rival: stranger() },
    text: '{rival.nome} roubou seu lanche pela [terceira|quinta|décima] vez esta semana e ainda riu da sua cara.',
    choices: [
      {
        label: 'Revidar', hint: 'Saúde ajuda',
        outcomes: [
          { chance: (g) => 0.3 + g.player.stats.saude / 250, text: 'Você venceu! Ninguém mais mexe com você.', effects: { stats: { carisma: 4, felicidade: 5 }, run: setRole('rival', 'rival') } },
          { chance: 1, text: 'Você levou a pior e foi parar na diretoria.', effects: { stats: { saude: -6, felicidade: -6 }, run: setRole('rival', 'rival') } },
        ],
      },
      { label: 'Contar para a professora', text: '{rival.nome} levou suspensão e agora te chama de dedo-duro.', effects: { stats: { carisma: -2 }, run: setRole('rival', 'rival') } },
      {
        label: 'Oferecer metade do lanche', hint: 'Carisma ajuda',
        outcomes: [
          { chance: (g) => 0.2 + g.player.stats.carisma / 200, text: '{rival.nome} ficou sem reação... e virou seu amigo!', effects: { stats: { carisma: 3 }, run: setRole('rival', 'amigo'), rel: { rival: 25 } } },
          { chance: 1, text: '{rival.nome} pegou o lanche inteiro.', effects: { stats: { felicidade: -4 }, run: setRole('rival', 'rival') } },
        ],
      },
    ],
  },
  {
    id: 'novo_amigo', title: 'Amizade no recreio', icon: '🤝', scene: 'escola', minAge: 6, maxAge: 17, cooldown: 30,
    weight: (g) => 1.5 - Math.min(1, Object.values(g.npcs).filter((n) => n.role === 'amigo' && n.alive).length * 0.3),
    bind: { amigo: stranger() },
    text: 'Você conheceu {amigo.nome}. [Vocês trocaram figurinhas a tarde toda|{amigo.Ele} sabe arrotar o alfabeto inteiro|Vocês criaram um clube secreto no fundo da sala|Vocês descobriram que amam o mesmo desenho].',
    choices: [
      { label: 'Virar amigos', text: 'Nasce uma amizade.', effects: { stats: { felicidade: 5 }, run: setRole('amigo', 'amigo'), rel: { amigo: 20 }, memory: { who: 'amigo', tag: 'conheceu', text: 'O dia em que nos conhecemos', weight: 2 } } },
      { label: 'Melhor ficar na minha', text: 'Cada um para o seu lado.', effects: { stats: { felicidade: -1 } } },
    ],
  },
  {
    id: 'pet', title: 'Bichinho abandonado', icon: '🐶', scene: 'natureza', minAge: 5, maxAge: 40, once: true,
    text: 'Você encontrou um [cachorro magrinho|gatinho miando] na chuva, olhando para você.',
    choices: [
      { label: 'Levar pra casa', text: 'Banho, comida e um nome novo. Melhor decisão da vida.', effects: { stats: { felicidade: 10, estresse: -5 }, run: (g) => { addPet(g, chance(g, 0.5) ? 'cachorro' : 'gato'); } } },
      { label: 'Deixar ali', text: 'Você pensou nele a noite inteira.', effects: { stats: { felicidade: -4 } } },
    ],
  },
  {
    id: 'prova', title: 'Prova surpresa', icon: '📝', scene: 'escola', minAge: 8, maxAge: 17, cooldown: 12,
    when: (g) => g.education.inSchool,
    text: 'Amanhã tem prova de [matemática|ciências|história|português] e você não abriu o caderno.',
    choices: [
      {
        label: 'Virar a noite estudando', hint: '+Estresse',
        outcomes: [
          { chance: (g) => g.player.stats.inteligencia / 110, text: 'Nota máxima! 🌟', effects: { stats: { inteligencia: 3, estresse: 4 }, run: (g) => { g.education.schoolPerf = Math.min(100, g.education.schoolPerf + 8); } } },
          { chance: 1, text: 'Você dormiu em cima da prova. Nota 4.', effects: { stats: { estresse: 6 } } },
        ],
      },
      {
        label: 'Colar do colega', hint: 'Arriscado',
        outcomes: [
          { chance: 0.6, text: 'Ninguém viu. Nota 8, consciência pesada.', effects: { run: (g) => { g.education.schoolPerf = Math.min(100, g.education.schoolPerf + 3); } } },
          { chance: 1, text: 'Pego no flagra! Zero e bilhete para os pais.', effects: { stats: { felicidade: -6 }, run: (g) => { g.education.schoolPerf = Math.max(0, g.education.schoolPerf - 10); } } },
        ],
      },
      { label: 'Aceitar o destino', text: 'Nota 3. Pelo menos você dormiu bem.', effects: { stats: { estresse: -2 }, run: (g) => { g.education.schoolPerf = Math.max(0, g.education.schoolPerf - 5); } } },
    ],
  },
  {
    id: 'pais_brigam', title: 'Brigas em casa', icon: '🌩️', scene: 'casa', minAge: 6, maxAge: 17, cooldown: 60,
    bind: { pai: role('pai'), mae: role('mae') },
    check: (g, ctx) => g.npcs[ctx.pai].relation + g.npcs[ctx.mae].relation < 150 || chance(g, 0.3),
    text: '{pai.nome} e {mae.nome} estão brigando de novo. Dá para ouvir tudo do seu quarto.',
    choices: [
      { label: 'Tentar acalmar os dois', text: 'Eles pararam, envergonhados. Você amadureceu um pouco.', effects: { stats: { carisma: 2, estresse: 5 }, rel: { pai: 3, mae: 3 } } },
      { label: 'Fone de ouvido no máximo', text: 'A música te salvou mais uma vez.', effects: { stats: { estresse: 2, felicidade: -2 } } },
      { label: 'Dormir na casa de um amigo', text: 'Uma noite de paz. Seus pais ficaram preocupados.', effects: { stats: { felicidade: 2 }, rel: { pai: -3, mae: -3 } } },
    ],
  },
  {
    id: 'feira_ciencias', title: 'Feira de ciências', icon: '🌋', scene: 'escola', minAge: 9, maxAge: 15, once: true,
    text: 'Feira de ciências! Seu projeto é [um vulcão de bicarbonato|um robô de sucata|uma horta hidropônica|uma bateria de batata].',
    choices: [
      {
        label: 'Caprichar ao máximo', hint: 'Inteligência ajuda',
        outcomes: [
          { chance: (g) => g.player.stats.inteligencia / 120, text: '1º lugar! Sua foto saiu no jornal do bairro.', effects: { stats: { inteligencia: 4, felicidade: 6, carisma: 2 }, flags: { premio_ciencia: true } } },
          { chance: 1, text: 'O vulcão explodiu no jurado. Inesquecível, mas sem prêmio.', effects: { stats: { felicidade: 2, carisma: 1 } } },
        ],
      },
      { label: 'Fazer o mínimo', text: 'Ninguém lembra do seu projeto.', effects: {} },
    ],
  },
  {
    id: 'crush', title: 'Borboletas no estômago', icon: '🦋', scene: 'amor', minAge: 13, maxAge: 17, cooldown: 18,
    when: (g) => !Object.values(g.npcs).some((n) => n.alive && (n.role === 'parceiro' || n.role === 'conjuge')),
    bind: { crush: stranger(true) },
    text: 'Você não para de pensar em {crush.nome}, da sua turma. {crush.Ele} sorriu pra você no intervalo hoje.',
    choices: [
      {
        label: 'Se declarar', hint: 'Aparência e carisma ajudam',
        outcomes: [
          { chance: (g) => 0.15 + g.player.stats.aparencia / 250 + g.player.stats.carisma / 250, text: '{crush.nome} disse que também gostava de você! 💕', effects: { stats: { felicidade: 12 }, run: setRole('crush', 'parceiro'), rel: { crush: 30 }, memory: { who: 'crush', tag: 'declaracao', text: 'O dia em que você se declarou', weight: 3 } } },
          { chance: 1, text: '{crush.nome} riu. Não de um jeito fofo. A escola inteira ficou sabendo.', effects: { stats: { felicidade: -8, carisma: -1 } } },
        ],
      },
      { label: 'Mandar bilhete anônimo', text: '{crush.nome} achou fofo, mas nunca soube que era você.', effects: { stats: { felicidade: 2 } } },
      { label: 'Guardar segredo', text: 'Fica para a próxima vida.', effects: { stats: { estresse: 2 } } },
    ],
  },
  {
    id: 'festa_proibida', title: 'A festa do ano', icon: '🎉', scene: 'festa', minAge: 14, maxAge: 17, cooldown: 24,
    bind: { pai: role('pai', 'mae') },
    text: 'Vai rolar uma festa enorme na casa de [um veterano|alguém do 3º ano|um primo de um amigo]. {pai.nome} disse NÃO.',
    choices: [
      {
        label: 'Fugir pela janela',
        outcomes: [
          { chance: 0.55, text: 'Melhor noite da sua adolescência. Ninguém percebeu.', effects: { stats: { felicidade: 10, carisma: 3 } } },
          { chance: 1, text: '{pai.nome} estava te esperando na sala, de luz apagada. Castigo de um mês.', effects: { stats: { felicidade: -6 }, rel: { pai: -10 }, memory: { who: 'pai', tag: 'fuga', text: 'A noite em que você fugiu para a festa', weight: 2 } } },
        ],
      },
      { label: 'Obedecer', text: 'Você ficou em casa vendo as fotos da festa no celular.', effects: { stats: { felicidade: -3 }, rel: { pai: 4 } } },
    ],
  },
  {
    id: 'primeiro_bico', title: 'Primeiro dinheirinho', icon: '🧽', scene: 'dinheiro', minAge: 13, maxAge: 17, once: true,
    text: 'O vizinho oferece $[40|60|80] por semana para você [lavar o carro dele|passear com o cachorro|ajudar na loja dele].',
    choices: [
      { label: 'Aceitar', text: 'Seu primeiro salário! Você se sentiu rico.', effects: { money: 600, stats: { felicidade: 4, estresse: 2 }, flags: { primeiro_bico: true } } },
      { label: 'Tô de férias', text: 'Liberdade não tem preço.', effects: { stats: { estresse: -2 } } },
    ],
  },
  {
    id: 'viral', title: 'Viralizou', icon: '📱', scene: 'festa', minAge: 13, maxAge: 35, cooldown: 120,
    text: 'Um vídeo seu #viral# chegou a [300 mil|1 milhão|4 milhões] de visualizações.',
    choices: [
      {
        label: 'Abraçar a fama', hint: 'Carisma ajuda',
        outcomes: [
          { chance: (g) => g.player.stats.carisma / 130, text: 'Você virou meme querido e ganhou seguidores (e uns trocados com publi).', effects: { stats: { carisma: 5, felicidade: 6 }, money: 1500 } },
          { chance: 1, text: 'A internet foi cruel nos comentários.', effects: { stats: { felicidade: -8, estresse: 8 } } },
        ],
      },
      { label: 'Apagar tudo e sumir', text: 'Em uma semana ninguém lembrava. Ufa.', effects: { stats: { estresse: -2 } } },
    ],
  },
  {
    id: 'fim_escola', title: 'E agora?', icon: '🧭', scene: 'escola', minAge: 18, maxAge: 19, once: true, priority: true,
    when: (g) => !!g.flags.formou_medio,
    text: 'Fim do ensino médio. Todo mundo pergunta: "e aí, vai fazer o quê da vida?". Você, {eu.nome}, decide:',
    choices: [
      { label: 'Prestar vestibular (escolho o curso na aba Carreira)', text: 'Você começou a estudar para o vestibular. Abra Carreira → Educação para escolher o curso.', effects: { stats: { estresse: 4 }, run: (g) => { g.agenda.estudo = Math.max(g.agenda.estudo, 12); } } },
      { label: 'Começar a trabalhar já', text: 'Currículos impressos, sapato engraxado. Veja as vagas na aba Carreira.', effects: { stats: { carisma: 1 }, run: (g) => { g.jobOffers.forEach((o) => (o.applied = false)); } } },
      { label: 'Ano sabático', text: 'Um ano para se encontrar. Ou só dormir até meio-dia.', effects: { stats: { felicidade: 8, estresse: -15 } } },
      {
        label: 'Mochilão pelo mundo', hint: 'Precisa de $3.000', when: (g) => g.money >= 3000,
        text: 'Você conheceu [Lisboa|Buenos Aires|Santiago|Bogotá] e voltou outra pessoa.', effects: { money: -3000, stats: { felicidade: 12, carisma: 4, estresse: -10 } },
      },
    ],
  },
  {
    id: 'aniversario_crianca', title: 'Festa de aniversário', icon: '🎂', scene: 'festa', minAge: 4, maxAge: 11, cooldown: 36,
    bind: { mae: role('mae', 'pai') },
    text: '{mae.nome} fez uma festa surpresa de {eu.idade} anos com tema de [super-heróis|dinossauros|princesas|espaço|futebol].',
    effects: { stats: { felicidade: 6 }, rel: { mae: 5 }, run: (g) => (ageYears(g) > 9 ? t('Você fingiu achar infantil, mas amou.') : '') },
  },
  {
    id: 'irmao_briga', title: 'Guerra de irmãos', icon: '🥊', scene: 'casa', minAge: 5, maxAge: 17, cooldown: 36,
    bind: { irmao: role('irmao') },
    text: '{irmao.nome} [quebrou seu brinquedo favorito|leu seu diário|comeu seu último pedaço de bolo] e jura que não foi {irmao.ele}.',
    choices: [
      { label: 'Vingança!', text: 'Você escondeu o controle do videogame. A guerra fria começou.', effects: { stats: { felicidade: 2 }, rel: { irmao: -8 }, memory: { who: 'irmao', tag: 'vinganca', text: 'A vingança do controle sumido', weight: 1 } } },
      { label: 'Perdoar', text: '{irmao.nome} te deu um abraço de urso.', effects: { rel: { irmao: 6 }, stats: { carisma: 1 } } },
    ],
  },
  {
    id: 'esporte_escola', title: 'Peneira do time', icon: '⚽', scene: 'escola', minAge: 10, maxAge: 17, once: true,
    text: 'Abriram testes para o time de [futebol|vôlei|basquete|natação] da escola.',
    choices: [
      {
        label: 'Fazer o teste', hint: 'Saúde ajuda',
        outcomes: [
          { chance: (g) => g.player.stats.saude / 130, text: 'Aprovad{eu.o}! Treinos 3x por semana.', effects: { stats: { saude: 6, carisma: 3, felicidade: 5 }, run: (g) => { g.agenda.exercicio = Math.max(g.agenda.exercicio, 6); } } },
          { chance: 1, text: 'Não passou. O técnico disse "ano que vem, quem sabe".', effects: { stats: { felicidade: -4 } } },
        ],
      },
      { label: 'Esporte não é comigo', text: 'O banco da arquibancada é confortável.', effects: {} },
    ],
  },
  {
    id: 'genero_brinquedo', title: 'Sonho de infância', icon: '🌠', scene: 'casa', minAge: 6, maxAge: 10, once: true,
    text: 'Na aula perguntaram o que você quer ser quando crescer. Você respondeu:',
    choices: [
      { label: '[Astronauta|Cientista] 🚀', text: 'A turma inteira aplaudiu.', effects: { stats: { inteligencia: 2 }, flags: { sonho: 'ciencia' } } },
      { label: 'Dono(a) de empresa 💼', text: 'A professora riu: "um pequeno magnata".', effects: { stats: { carisma: 2 }, flags: { sonho: 'empresa' } } },
      { label: '[Jogador(a) de futebol|Artista famoso(a)] ⭐', text: 'Sonhar grande é de graça.', effects: { stats: { felicidade: 3 }, flags: { sonho: 'fama' } } },
      { label: '[Médico(a)|Veterinário(a)] 🩺', text: 'Você operou todos os bichos de pelúcia naquela semana.', effects: { stats: { inteligencia: 1, carisma: 1 }, flags: { sonho: 'saude' } } },
    ],
  },
];
