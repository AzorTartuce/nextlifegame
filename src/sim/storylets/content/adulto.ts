import { t } from '../../../i18n';
import { addMemory, changeStats, clamp, formatMoney, partnerOf } from '../../core';
import { chance, rint } from '../../rng';
import { fertilityFactor } from '../../systems/lifestate';
import { haveChild } from '../../systems/life';
import { jobSalary } from '../../systems/career';
import { amount, partner, role, roleWith, setRole, stranger } from '../binders';
import type { Storylet } from '../engine';

const single = (g: Parameters<typeof partnerOf>[0]) => !partnerOf(g);

export const ADULTO: Storylet[] = [
  {
    id: 'sair_de_casa', title: 'Seu próprio canto', icon: '🏠', scene: 'casa', minAge: 19, maxAge: 35, cooldown: 18,
    when: (g) => g.livesWithParents,
    weight: 2,
    bind: { mae: role('mae', 'pai') },
    text: '{mae.nome} comentou "sem querer" que o quarto seria um ótimo escritório. Talvez seja hora de ter seu canto.',
    choices: [
      { label: 'Alugar um apê ($1.100/mês)', text: 'Chave na mão, geladeira vazia, liberdade total.', effects: { stats: { felicidade: 10, estresse: 4 }, run: (g) => { g.livesWithParents = false; } } },
      { label: 'Ficar mais um tempo', text: '"Só até eu juntar uma grana", você disse. Pela quarta vez.', effects: { rel: { mae: -4 }, stats: { felicidade: -2 } } },
    ],
  },
  {
    id: 'voltar_casa', title: 'Aperto financeiro', icon: '🧳', scene: 'casa', minAge: 18, cooldown: 12, priority: true,
    when: (g) => !g.livesWithParents && g.money < -4000 && !g.job && !g.company,
    bind: { p: role('mae', 'pai'), divida: (g) => String(-Math.round(g.money)) },
    text: 'As contas não fecham: você deve {$divida}. {p.nome} liga: "Seu quarto continua aqui, viu?"',
    choices: [
      { label: 'Voltar para casa por um tempo', text: 'Orgulho ferido, conta zerada de aluguel. {p.nome} fez sua comida favorita.', effects: { rel: { p: 6 }, stats: { felicidade: -4, estresse: -8 }, run: (g) => { g.livesWithParents = true; g.flags.estilo = 0; } } },
      { label: 'Cortar gastos ao máximo', text: 'Estilo de vida simples e miojo no jantar.', effects: { stats: { felicidade: -3 }, run: (g) => { g.flags.estilo = 0; g.agenda.lazer = 0; } } },
      { label: 'Eu dou meu jeito', text: 'Você desligou o telefone e olhou o extrato de novo.', effects: { stats: { estresse: 8 } } },
    ],
  },
  {
    id: 'match', title: 'Deu match!', icon: '💘', scene: 'amor', minAge: 18, maxAge: 70, cooldown: 10,
    when: single,
    weight: 4,
    bind: { crush: stranger(true) },
    text: 'O app de namoro deu match com {crush.nome}, {crush.idade} anos, que #hobby#. A conversa está fluindo.',
    choices: [
      {
        label: 'Marcar um encontro', hint: 'Aparência e carisma ajudam',
        outcomes: [
          { chance: (g) => 0.25 + g.player.stats.aparencia / 300 + g.player.stats.carisma / 300, text: 'Química instantânea. Vocês estão namorando! 💕', effects: { stats: { felicidade: 12 }, run: setRole('crush', 'parceiro'), rel: { crush: 30 }, memory: { who: 'crush', tag: 'primeiro_encontro', text: 'Nosso primeiro encontro', weight: 3 } } },
          { chance: 0.5, text: '{crush.nome} passou o jantar falando [do ex|de criptomoedas|da própria mãe]. Não rolou.', effects: { stats: { felicidade: -2 }, money: -120 } },
          { chance: 1, text: 'Você levou um bolo. Ficou 40 minutos sozinh{eu.o} no restaurante.', effects: { stats: { felicidade: -6 } } },
        ],
      },
      { label: 'Desfazer o match', text: 'Próximo.', effects: {} },
    ],
  },
  {
    id: 'briga_casal', title: 'DR', icon: '🗯️', scene: 'amor', minAge: 16, cooldown: 14,
    bind: { p: partner },
    text: '{p.nome} reclama que você vive [trabalhando demais|grudad{eu.o} no celular|esquecendo datas importantes|deixando louça na pia].',
    choices: [
      { label: 'Pedir desculpas e planejar uma viagem', hint: '$1.500', when: (g) => g.money >= 1500, text: 'Fim de semana na serra. Relação renovada.', effects: { money: -1500, rel: { p: 12 }, stats: { felicidade: 5, estresse: -6 }, memory: { who: 'p', tag: 'viagem', text: 'Aquela viagem para a serra', weight: 2 } } },
      { label: 'Ouvir com calma', text: 'Vocês conversaram até de madrugada.', effects: { rel: { p: 5 }, stats: { carisma: 1 } } },
      { label: 'Devolver as críticas', text: 'Portas batendo. Clima péssimo por dias.', effects: { rel: { p: -12 }, stats: { estresse: 6 }, memory: { who: 'p', tag: 'briga', text: 'Aquela briga feia', weight: 2 } } },
    ],
  },
  {
    id: 'pedido_surpresa', title: 'Um joelho no chão', icon: '💍', scene: 'amor', minAge: 18, cooldown: 24, weight: 5,
    bind: { p: roleWith(70, 'parceiro') },
    check: (g, ctx) => g.t - g.npcs[ctx.p].since >= 12,
    text: '{p.nome} está estranh{p.o} a noite toda... e de repente se ajoelha com uma caixinha na mão!',
    choices: [
      { label: 'SIM!', text: 'Casamento lindo, festa até o sol nascer. 💒', effects: { money: -4000, stats: { felicidade: 18 }, flags: { casou: true }, count: { marriages: 1 }, run: (g, ctx) => { setRole('p', 'conjuge')(g, ctx); addMemory(g.npcs[ctx.p], g.t, 'casamento', 'Nosso casamento', 5); } } },
      { label: 'Preciso de tempo', text: '{p.nome} guardou o anel com um sorriso triste.', effects: { rel: { p: -10 } } },
      { label: 'Não', text: 'Silêncio. {p.nome} foi embora naquela noite.', effects: { rel: { p: -50 }, stats: { felicidade: -10 }, run: setRole('p', 'ex') } },
    ],
  },
  {
    id: 'quer_filho', title: 'A conversa', icon: '🍼', scene: 'amor', minAge: 22, maxAge: 45, cooldown: 30, weight: 5,
    bind: { p: roleWith(55, 'conjuge') },
    check: (g) => Object.values(g.npcs).filter((n) => n.role === 'filho').length < 4,
    text: '{p.nome} segura sua mão: "E se a gente tivesse um filho?"',
    choices: [
      {
        label: 'Vamos!', text: '',
        effects: {
          run: (g) => {
            if (!chance(g, clamp(0.65 * fertilityFactor(g), 0.04, 0.9))) {
              changeStats(g, { estresse: 6, felicidade: -3 });
              return t('Tentaram por meses, sem sucesso. A fertilidade pode ser um obstáculo: há tratamentos.');
            }
            const baby = haveChild(g);
            return t('Nove meses depois, nasceu {n}. {e}', { n: baby.firstName, e: baby.gender === 'f' ? '👧' : '👦' });
          },
        },
      },
      { label: 'Ainda não', text: '{p.nome} entendeu. Por enquanto.', effects: { rel: { p: -4 } } },
    ],
  },
  {
    id: 'amigo_emprestimo', title: 'Pedido de ajuda', icon: '🙏', scene: 'dinheiro', minAge: 18, cooldown: 30,
    bind: { amigo: role('amigo', 'irmao'), valor: amount(300, 3000, 100) },
    check: (g, ctx) => g.money >= Number(ctx.valor),
    text: '{amigo.nome} está em apuros e pede {$valor} emprestado. "Te pago mês que vem, juro."',
    choices: [
      {
        label: 'Emprestar',
        effects: { run: (g, ctx) => { g.money -= Number(ctx.valor); } },
        outcomes: [
          { chance: 0.55, text: '{amigo.nome} pagou tudinho e ainda te levou para jantar.', effects: { run: (g, ctx) => { g.money += Number(ctx.valor); }, rel: { amigo: 12 }, memory: { who: 'amigo', tag: 'ajudou', text: 'Quando você me ajudou com dinheiro', weight: 3 } } },
          { chance: 1, text: 'O mês que vem nunca chegou. {amigo.nome} agora visualiza e não responde.', effects: { rel: { amigo: -15 }, stats: { felicidade: -4 } } },
        ],
      },
      { label: 'Recusar', text: '{amigo.nome} disse que entende. Será?', effects: { rel: { amigo: -8 } } },
    ],
  },
  {
    id: 'assalto', title: 'Assalto!', icon: '🔪', scene: 'perigo', minAge: 14, cooldown: 60,
    bind: { valor: amount(100, 800, 50) },
    text: 'Um sujeito encosta em você #lugar#: "Passa o celular e a carteira!"',
    choices: [
      { label: 'Entregar tudo', text: 'Foi-se o celular e {$valor}. Mas você está vivo.', effects: { stats: { estresse: 10, felicidade: -5 }, run: (g, ctx) => { g.money -= Number(ctx.valor) + 800; } } },
      {
        label: 'Reagir', hint: 'Muito arriscado',
        outcomes: [
          { chance: (g) => g.player.stats.saude / 300 + (g.life.health.martial ? Math.floor(g.life.health.martial.belt) * 0.08 : 0) + (g.life.crime.weapon ? 0.25 : 0), text: 'O ladrão fugiu correndo! Você virou herói do bairro.', effects: { stats: { carisma: 5, felicidade: 4, estresse: 8 } } },
          { chance: 1, text: 'Você levou uma facada e passou uma semana no hospital.', effects: { stats: { saude: -30, estresse: 15 }, money: -2500 } },
        ],
      },
    ],
  },
  {
    id: 'raspadinha', title: 'Raspadinha', icon: '🎟️', scene: 'dinheiro', minAge: 18, cooldown: 36,
    text: 'Você achou uma raspadinha na rua, ainda intacta.',
    choices: [
      {
        label: 'Raspar!',
        outcomes: [
          { chance: 0.02, text: 'PRÊMIO MÁXIMO! $250.000! Você gritou no meio da calçada.', effects: { money: 250000, stats: { felicidade: 25 }, count: { jackpots: 1 }, karma: 2 } },
          { chance: 0.2, text: 'Ganhou $200! O universo te ama hoje.', effects: { money: 200, stats: { felicidade: 3 } } },
          { chance: 1, text: '"Não foi dessa vez." Claro que não.', effects: {} },
        ],
      },
      { label: 'Jogar fora', text: 'Você nunca vai saber. E isso vai te assombrar.', effects: { stats: { estresse: 1 } } },
    ],
  },
  {
    id: 'saude_exame', title: 'Resultado do exame', icon: '🩻', scene: 'saude', minAge: 35, cooldown: 48,
    weight: (g) => (g.player.stats.saude < 50 ? 2.5 : 0.8),
    text: 'O médico olha os exames e franze a testa: [pressão alta|colesterol nas alturas|pré-diabetes|uma hérnia de disco].',
    choices: [
      { label: 'Fazer o tratamento ($2.000)', text: 'Remédios, dieta e caminhada. Seu corpo agradece.', effects: { money: -2000, stats: { saude: 12, estresse: -2 } } },
      { label: 'Mudar de hábitos (sem gastar)', text: 'Você prometeu se exercitar mais.', effects: { stats: { saude: 3 }, run: (g) => { g.agenda.exercicio = Math.max(g.agenda.exercicio, 5); } } },
      { label: 'Ignorar', text: '"Médico exagera." O tempo vai dizer.', effects: { stats: { saude: -8 } } },
    ],
  },
  {
    id: 'burnout', title: 'Esgotamento', icon: '🔥', scene: 'perigo', minAge: 16, cooldown: 12, priority: true,
    when: (g) => g.player.stats.estresse >= 88,
    text: 'Você travou no meio do dia. Coração disparado, mãos tremendo. Seu corpo está pedindo socorro.',
    choices: [
      { label: 'Tirar férias de verdade ($2.500)', when: (g) => g.money >= 2500, text: 'Duas semanas longe de tudo. Você voltou a respirar.', effects: { money: -2500, stats: { estresse: -45, felicidade: 8 } } },
      { label: 'Começar terapia ($400/mês)', text: 'Toda quinta, 19h. Aos poucos, as coisas fazem sentido.', effects: { stats: { estresse: -15 }, flags: { terapia: true } } },
      { label: 'Engolir e seguir', text: 'Você seguiu. Seu corpo cobrou.', effects: { stats: { saude: -15, felicidade: -8 } } },
    ],
  },
  {
    id: 'viagem_promo', title: 'Promoção de passagens', icon: '✈️', scene: 'natureza', minAge: 20, cooldown: 30,
    when: (g) => g.money >= 6000,
    text: 'Passagens para #destino# pela metade do preço. Só hoje.',
    choices: [
      { label: 'Comprar! ($4.000)', text: 'A viagem da sua vida. Fotos que você vai guardar para sempre.', effects: { money: -4000, stats: { felicidade: 14, estresse: -20, carisma: 2 } } },
      { label: 'Melhor guardar dinheiro', text: 'Responsável. E um pouco triste.', effects: { stats: { felicidade: -1 } } },
    ],
  },
  {
    id: 'ano_novo', title: 'Ano novo, vida nova?', icon: '🎆', scene: 'festa', minAge: 16, cooldown: 11,
    when: (g) => g.t % 12 === 0,
    weight: 4,
    text: 'Meia-noite, fogos no céu de {cidade}. Sua promessa para este ano:',
    choices: [
      { label: 'Entrar em forma', text: 'Academia paga, tênis novo. Vamos ver até fevereiro.', effects: { stats: { felicidade: 2 }, run: (g) => { g.agenda.exercicio = Math.max(g.agenda.exercicio, 6); } } },
      { label: 'Estudar mais', text: 'Lista de livros pronta.', effects: { run: (g) => { g.agenda.estudo = Math.max(g.agenda.estudo, 6); } } },
      { label: 'Mais tempo com quem amo', text: 'Grupo da família reativado.', effects: { stats: { felicidade: 3 }, run: (g) => { g.agenda.social = Math.max(g.agenda.social, 8); } } },
      { label: 'Promessas são para os fracos', text: 'Você só pulou as sete ondas e foi dormir.', effects: { stats: { estresse: -3 } } },
    ],
  },
  {
    id: 'reencontro_ex', title: 'Fantasma do passado', icon: '👻', scene: 'amor', minAge: 18, cooldown: 60,
    bind: { ex: role('ex') },
    text: 'Você esbarrou em {ex.nome} #lugar#. {ex.Ele} parece [ótim{ex.o}|cansad{ex.o}|exatamente igual].',
    choices: [
      {
        label: 'Puxar conversa', when: (g) => !partnerOf(g),
        outcomes: [
          { chance: (g, ctx) => g.npcs[ctx.ex].relation / 120, text: 'Velhas faíscas... vocês voltaram!', effects: { run: setRole('ex', 'parceiro'), rel: { ex: 25 }, stats: { felicidade: 8 } } },
          { chance: 1, text: 'Papo educado, despedida rápida. Algumas portas ficam fechadas.', effects: {} },
        ],
      },
      { label: 'Fingir que não viu', text: 'Você se escondeu atrás de uma pilastra. Funcionou?', effects: { stats: { estresse: 2 } } },
    ],
  },
  {
    id: 'pais_idosos', title: 'O tempo passa', icon: '👵', scene: 'casa', minAge: 30, cooldown: 60,
    bind: { pai: role('pai', 'mae') },
    check: (g, ctx) => g.t - g.npcs[ctx.pai].birth > 68 * 12,
    text: '{pai.nome} está esquecendo coisas e precisa de mais ajuda no dia a dia.',
    choices: [
      { label: 'Levar para morar com você', text: 'Casa cheia de novo. Cansativo e bonito.', effects: { rel: { pai: 15 }, stats: { estresse: 8, felicidade: 3 }, memory: { who: 'pai', tag: 'cuidou', text: 'Quando você cuidou de mim', weight: 4 } } },
      { label: 'Pagar uma cuidadora ($1.800/mês por 1 ano)', when: (g) => g.money >= 21600, text: '{pai.nome} está bem cuidad{pai.o}.', effects: { money: -21600, rel: { pai: 5 } } },
      { label: 'Visitar mais vezes', text: 'Domingos agora são sagrados.', effects: { rel: { pai: 6 }, run: (g) => { g.agenda.social = Math.max(g.agenda.social, 6); } } },
    ],
  },
  {
    id: 'filho_escola', title: 'Reunião de pais', icon: '🏫', scene: 'escola', minAge: 24, cooldown: 24,
    bind: { f: role('filho') },
    check: (g, ctx) => { const a = (g.t - g.npcs[ctx.f].birth) / 12; return a >= 6 && a < 17; },
    text: 'A professora de {f.nome} diz que {f.ele} é [brilhante, mas conversa demais|muito tímid{f.o}|o terror da turma|um talento para música].',
    choices: [
      { label: 'Ajudar nas tarefas todo dia', text: '{f.nome} melhorou muito. E vocês ficaram mais próximos.', effects: { rel: { f: 10 }, stats: { estresse: 3, felicidade: 3 }, run: (g, ctx) => { g.npcs[ctx.f].stats.inteligencia = clamp(g.npcs[ctx.f].stats.inteligencia + 6); } } },
      { label: 'Contratar professor particular ($600)', text: 'Dinheiro bem gasto.', effects: { money: -600, run: (g, ctx) => { g.npcs[ctx.f].stats.inteligencia = clamp(g.npcs[ctx.f].stats.inteligencia + 4); } } },
      { label: '"Na minha época era pior"', text: '{f.nome} ouviu e não gostou.', effects: { rel: { f: -6 } } },
    ],
  },
  {
    id: 'aposentadoria', title: 'Aposentadoria', icon: '🏖️', scene: 'natureza', minAge: 62, cooldown: 24,
    when: (g) => !!g.job && !g.flags.aposentado,
    text: 'Seu RH avisa: você já pode se aposentar. A pensão seria de uns 60% do salário.',
    choices: [
      {
        label: 'Aposentar!', text: 'Pijama em plena terça-feira. Você merece.',
        effects: {
          stats: { felicidade: 10, estresse: -20 },
          run: (g) => {
            g.flags.aposentado = true;
            g.flags.pensao = g.job ? Math.round(jobSalary(g.job) * 0.6) : 1500;
            g.job = null;
            g.agenda.carreira = 0;
          },
        },
      },
      { label: 'Ainda tenho lenha para queimar', text: 'Mais um ano de batente.', effects: { stats: { estresse: 2 } } },
    ],
  },
  {
    id: 'reflexao_velhice', title: 'Álbum de fotos', icon: '📷', scene: 'casa', minAge: 70, cooldown: 60,
    text: 'Você passou a tarde olhando fotos antigas. [O sorriso ficou no rosto por horas.|Bateu uma saudade daquelas.|Que vida, hein?]',
    effects: { stats: { felicidade: 4, estresse: -4 } },
  },
  {
    id: 'novo_vizinho', title: 'Vizinho novo', icon: '📦', scene: 'casa', minAge: 18, cooldown: 36,
    bind: { v: stranger() },
    text: '{v.nome} acabou de se mudar para o lado. {v.Ele} bateu na sua porta pedindo [uma xícara de açúcar|o wi-fi emprestado|ajuda com a mudança].',
    choices: [
      { label: 'Ajudar e puxar papo', text: 'Vocês se deram muito bem!', effects: { run: setRole('v', 'amigo'), rel: { v: 20 }, stats: { felicidade: 3 } } },
      { label: 'Ajudar rapidinho', text: 'Boa vizinhança, sem intimidade.', effects: { rel: { v: 5 } } },
      { label: 'Fingir que não está em casa', text: 'Você ficou imóvel atrás da porta por cinco minutos.', effects: { rel: { v: -10 } } },
    ],
  },
  {
    id: 'amigo_some', title: 'Amizade esfriando', icon: '🧊', scene: 'casa', minAge: 15, cooldown: 24,
    bind: { a: role('amigo') },
    check: (g, ctx) => g.npcs[ctx.a].relation < 35,
    text: 'Faz meses que você e {a.nome} não se falam. O grupo de vocês está parado.',
    choices: [
      { label: 'Mandar mensagem e marcar algo', text: 'Foi como se nunca tivessem se afastado.', effects: { rel: { a: 20 }, stats: { felicidade: 4 } } },
      { label: 'Deixar a vida seguir', text: 'Algumas amizades são de uma fase.', effects: { run: setRole('a', 'conhecido') } },
    ],
  },
  {
    id: 'tentacao', title: 'Tentação', icon: '🍷', scene: 'perigo', minAge: 20, cooldown: 48,
    bind: { p: partner, t: stranger(true) },
    text: 'Numa happy hour, {t.nome} deixa bem claro o interesse por você. {p.nome} está em casa.',
    choices: [
      {
        label: 'Ceder',
        outcomes: [
          { chance: 0.5, text: 'Ninguém descobriu. Mas você sabe.', effects: { stats: { felicidade: 3, estresse: 10 }, count: { affairs: 1 }, karma: -4 } },
          { chance: 1, text: '{p.nome} viu as mensagens. A casa caiu.', effects: { count: { affairs: 1 }, karma: -6, rel: { p: -60 }, stats: { felicidade: -15, estresse: 15 }, memory: { who: 'p', tag: 'traicao', text: 'A traição', weight: 5 } } },
        ],
      },
      { label: 'Ir embora pra casa', text: 'Você chegou cedo e {p.nome} adorou a surpresa.', effects: { rel: { p: 6 } } },
    ],
  },
  {
    id: 'irmao_casamento', title: 'Casamento na família', icon: '💐', scene: 'festa', minAge: 18, once: true,
    bind: { i: role('irmao') },
    check: (g, ctx) => g.t - g.npcs[ctx.i].birth > 22 * 12,
    text: '{i.nome} vai se casar e quer que você seja padrinho/madrinha!',
    choices: [
      { label: 'Aceitar com honra', text: 'Seu discurso fez todo mundo chorar.', effects: { rel: { i: 12 }, stats: { felicidade: 6, carisma: 2 }, money: -800 } },
      { label: 'Aceitar e passar vergonha no discurso', text: 'Você contou a história errada. Ninguém esquece.', effects: { rel: { i: 2 }, stats: { felicidade: 2 }, money: -800 } },
    ],
  },
  {
    id: 'doacao', title: 'Campanha solidária', icon: '❤️', scene: 'casa', minAge: 18, cooldown: 36,
    when: (g) => g.money > 5000,
    bind: { valor: amount(200, 1500, 100) },
    text: 'Uma enchente atingiu a periferia de {cidade}. A campanha pede doações.',
    choices: [
      { label: 'Doar {$valor}', text: 'Você recebeu uma carta de agradecimento escrita à mão.', effects: { stats: { felicidade: 6 }, count: { donations: 1 }, karma: 4, run: (g, ctx) => { g.money -= Number(ctx.valor); } } },
      { label: 'Ir lá ajudar pessoalmente', text: 'Botas na lama, coração cheio.', effects: { stats: { felicidade: 8, saude: -2, carisma: 2 } } },
      { label: 'Agora não dá', text: 'Fica para a próxima.', effects: {} },
    ],
  },
  {
    id: 'acidente_carro', title: 'Batida', icon: '🚗', scene: 'perigo', minAge: 18, cooldown: 120, weight: 0.4,
    text: 'Alguém furou o sinal e bateu no carro em que você estava.',
    effects: {
      run: (g) => {
        const hurt = rint(g, 5, 25);
        changeStats(g, { saude: -hurt, estresse: 10 });
        return hurt > 18 ? t('Você quebrou o braço e ficou semanas de molho.') : t('Só o susto e alguns hematomas.');
      },
    },
  },
  {
    id: 'pais_ajudam', title: 'Ajuda de casa', icon: '💌', scene: 'casa', minAge: 18, maxAge: 30, cooldown: 36,
    when: (g) => g.money < 0 && g.flags.familia !== 'humilde',
    bind: { p: roleWith(55, 'mae', 'pai') },
    text: '{p.nome} percebeu que você está no aperto e mandou uma transferência com a mensagem "não precisa devolver ❤️".',
    effects: { rel: { p: 4 }, run: (g) => { const v = g.flags.familia === 'rica' ? 8000 : 1500; g.money += v; return `(+${formatMoney(v)})`; } },
  },
  {
    id: 'saudade_casa', title: 'Saudade de casa', icon: '🏡', scene: 'casa', minAge: 18, cooldown: 30,
    when: (g) => !!g.flags.emigrou && g.country !== g.birthCountry,
    bind: { p: role('mae', 'pai', 'irmao', 'amigo') },
    text: 'Bateu uma saudade enorme de {p.nome} e de como o mundo era lá no seu país. Aqui o café nunca tem o mesmo gosto.',
    choices: [
      { label: 'Fazer uma chamada de vídeo longa', text: '{p.nome} chorou e riu junto. Fuso horário? Que fuso horário.', effects: { rel: { p: 10 }, stats: { felicidade: 4, estresse: -3 } } },
      { label: 'Cozinhar o prato da infância', text: 'A casa inteira ficou com cheiro de lar. Os vizinhos pediram a receita.', effects: { stats: { felicidade: 5 }, money: -60 } },
      { label: 'Seguir em frente', text: 'Você respirou fundo e foi trabalhar.', effects: { stats: { estresse: 3 } } },
    ],
  },
  {
    id: 'burocracia', title: 'Burocracia', icon: '📑', scene: 'perigo', minAge: 18, cooldown: 48,
    when: (g) => !!g.flags.emigrou && g.country !== g.birthCountry && g.t - Number(g.flags.mudou ?? 0) < 36,
    text: 'Faltou um carimbo no seu visto. O guichê fecha em dez minutos e a fila dá a volta no quarteirão.',
    choices: [
      { label: 'Pagar um despachante ($300)', text: 'Resolvido em uma tarde. Seu cartão chorou.', effects: { money: -300, stats: { estresse: 2 } } },
      {
        label: 'Encarar a fila',
        outcomes: [
          { chance: 0.55, text: 'Deu tempo! Você saiu de lá com um sorriso nervoso.', effects: { stats: { estresse: 4 } } },
          { chance: 1, text: 'Fechou na sua cara. Voltou três vezes até resolver.', effects: { stats: { estresse: 12, felicidade: -4 } } },
        ],
      },
    ],
  },
];
