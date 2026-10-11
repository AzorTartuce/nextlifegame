import { t } from '../../../i18n';
import { clamp, companyValuation, formatMoney } from '../../core';
import { careerById } from '../../data/careers';
import { SECTORS } from '../../data/sectors';
import { rrange } from '../../rng';
import { jobSalary } from '../../systems/career';
import { sellCompany } from '../../systems/company';
import { amount, role, setRole, stranger } from '../binders';
import type { GameState } from '../../types';
import type { Storylet } from '../engine';

const perf = (d: number) => ({ run: (g: GameState) => { if (g.job) g.job.performance = clamp(g.job.performance + d); } });

export const TRABALHO: Storylet[] = [
  {
    id: 'chefe_credito', title: 'Crédito roubado', icon: '🦹', scene: 'trabalho', minAge: 18, cooldown: 36,
    when: (g) => !!g.job,
    text: 'Seu chefe apresentou SEU projeto à diretoria como se fosse dele. E ainda foi aplaudido.',
    choices: [
      {
        label: 'Confrontar na frente de todos', hint: 'Arriscado',
        outcomes: [
          { chance: (g) => g.player.stats.carisma / 140, text: 'A diretoria percebeu a verdade. Respeito conquistado.', effects: { stats: { carisma: 4, felicidade: 5 }, ...perf(15) } },
          { chance: 1, text: 'Pegou mal. Agora você é "{eu.o} problemátic{eu.o}" do setor.', effects: { stats: { estresse: 10 }, ...perf(-15) } },
        ],
      },
      { label: 'Conversar em particular', text: 'Ele pediu desculpas, meio sem jeito. Nada mudou.', effects: { stats: { estresse: 3 } } },
      { label: 'Engolir e documentar tudo', text: 'Você guardou os e-mails. Um dia isso vai servir.', effects: { stats: { estresse: 8 }, flags: { provas_chefe: true } } },
    ],
  },
  {
    id: 'hora_extra_fds', title: 'Sábado no escritório?', icon: '📅', scene: 'trabalho', minAge: 16, cooldown: 8,
    when: (g) => !!g.job,
    text: 'Seu gestor pergunta se você "pode dar uma força" no fim de semana. [De novo.|É a primeira vez.|Ele está com cara de desespero.]',
    choices: [
      { label: 'Topar', text: 'Fim de semana perdido, chefe feliz.', effects: { stats: { estresse: 6, felicidade: -3 }, money: 400, ...perf(6) } },
      { label: 'Recusar educadamente', text: '"Tenho compromisso." Ele não gostou muito.', effects: { stats: { estresse: -2 }, ...perf(-3) } },
    ],
  },
  {
    id: 'colega_fofoca', title: 'Rádio peão', icon: '🗣️', scene: 'trabalho', minAge: 18, cooldown: 24,
    when: (g) => !!g.job,
    bind: { c: stranger() },
    text: '{c.nome}, do setor ao lado, te puxa para o café: "Você não sabe da maior! Vão [demitir metade do time|trocar o diretor|cortar o vale-refeição]..."',
    choices: [
      { label: 'Fofocar junto', text: 'Vocês viraram unha e carne.', effects: { run: setRole('c', 'colega'), rel: { c: 15 }, stats: { felicidade: 2 } } },
      { label: 'Mudar de assunto', text: 'Profissional. Um pouco chato, mas profissional.', effects: { run: (g, ctx) => { setRole('c', 'colega')(g, ctx); perf(2).run(g); } } },
      { label: 'Contar ao chefe', text: 'O chefe agradeceu. {c.nome} nunca mais falou com você.', effects: { rel: { c: -30 }, run: (g, ctx) => { setRole('c', 'rival')(g, ctx); perf(5).run(g); } } },
    ],
  },
  {
    id: 'oferta_concorrente', title: 'Headhunter', icon: '🎯', scene: 'trabalho', minAge: 20, cooldown: 30,
    when: (g) => !!g.job && g.job.performance >= 60 && g.job.level < careerById(g.job.careerId).levels.length - 1,
    text: 'Uma concorrente quer te contratar como {proximo} — salário bem maior.',
    bind: { proximo: (g) => t(careerById(g.job!.careerId).levels[g.job!.level + 1].title) },
    choices: [
      { label: 'Aceitar a proposta', text: 'Novo crachá, novos desafios.', effects: { stats: { felicidade: 6, estresse: 4 }, run: (g) => { g.job = { careerId: g.job!.careerId, level: g.job!.level + 1, performance: 50, monthsInRole: 0, salaryBonus: 0 }; } } },
      {
        label: 'Usar como barganha', hint: 'Pode dar aumento',
        outcomes: [
          { chance: 0.6, text: 'Seu chefe cobriu a oferta: +15% de salário!', effects: { run: (g) => { g.job!.salaryBonus += 0.15; } } },
          { chance: 1, text: '"Então pode ir." Eita. Você ficou, mas o clima pesou.', effects: { stats: { estresse: 8 }, ...perf(-10) } },
        ],
      },
      { label: 'Recusar por lealdade', text: 'Seu chefe ficou sabendo e gostou.', effects: perf(6) },
    ],
  },
  {
    id: 'layoff', title: 'Reestruturação', icon: '✂️', scene: 'trabalho', minAge: 18, cooldown: 60, weight: 0.5,
    when: (g) => !!g.job,
    text: 'A empresa anunciou "reestruturação". Todo mundo sabe o que isso significa. Você é chamad{eu.o} na sala de reuniões...',
    effects: {
      run: (g) => {
        const job = g.job!;
        if (job.performance > 55) {
          job.salaryBonus += 0.05;
          return t('Alívio: você ficou! E ainda assumiu parte do trabalho de quem saiu (+5% de salário).');
        }
        const severance = jobSalary(job) * 2;
        g.money += severance;
        g.job = null;
        g.agenda.carreira = 0;
        g.player.stats.felicidade = clamp(g.player.stats.felicidade - 12);
        return t(g.player.gender === 'f' ? 'Você foi desligada. Indenização de {v}.' : 'Você foi desligado. Indenização de {v}.', { v: formatMoney(severance) });
      },
    },
  },
  {
    id: 'erro_grave', title: 'Deu ruim', icon: '💥', scene: 'trabalho', minAge: 16, cooldown: 30,
    when: (g) => !!g.job && g.player.stats.estresse > 50,
    text: 'Cansad{eu.o}, você [apagou um arquivo importante|mandou e-mail para o cliente errado|esqueceu uma reunião com o CEO].',
    choices: [
      { label: 'Assumir o erro', text: 'Doeu, mas o time respeitou sua honestidade.', effects: { stats: { estresse: 4 }, ...perf(-4) } },
      {
        label: 'Botar a culpa no estagiário',
        outcomes: [
          { chance: 0.6, text: 'Colou. O estagiário chorou no banheiro.', effects: { stats: { estresse: 2 } } },
          { chance: 1, text: 'Não colou. Agora você é o mentiroso do setor.', effects: { stats: { estresse: 10, carisma: -3 }, ...perf(-20) } },
        ],
      },
    ],
  },
  {
    id: 'ideia_negocio', title: 'Eureka no chuveiro', icon: '💡', scene: 'negocio', minAge: 20, maxAge: 55, cooldown: 48,
    when: (g) => !g.company && g.player.stats.inteligencia > 45,
    text: 'No banho, você teve uma ideia: [um café com gatos para adoção|um app que lembra de regar as plantas|uma loja de roupas sem gênero|uma academia 24h só para idosos].',
    choices: [
      { label: 'Anotar e planejar', text: 'Você abriu um caderno só para isso. Quando tiver capital, veja a aba Empresa.', effects: { stats: { felicidade: 3 }, flags: { ideia_negocio: true } } },
      { label: 'Esquecer', text: 'Daqui a dois anos alguém vai ficar rico com ela.', effects: {} },
    ],
  },

  // ---------- Empresa ----------
  {
    id: 'influencer', title: 'Influencer na área', icon: '🤳', scene: 'negocio', minAge: 18, cooldown: 18,
    when: (g) => !!g.company,
    text: 'Um influenciador com [200 mil|1 milhão|3 milhões] de seguidores apareceu na {empresa} sem avisar.',
    choices: [
      {
        label: 'Tratar como rei',
        outcomes: [
          { chance: (g) => g.company!.quality / 100, text: 'Ele amou e postou! Fila na porta no dia seguinte.', effects: { run: (g) => { const c = g.company!; c.awareness = clamp(c.awareness + 25); c.reputation = clamp(c.reputation + 5); } } },
          { chance: 1, text: 'Ele fez careta no stories. Ouch.', effects: { run: (g) => { const c = g.company!; c.awareness = clamp(c.awareness + 10); c.reputation = clamp(c.reputation - 10); } } },
        ],
      },
      { label: 'Oferecer parceria paga ($3.000)', text: 'Publi feita, alcance garantido.', effects: { run: (g) => { const c = g.company!; c.cash -= 3000; c.awareness = clamp(c.awareness + 20); } } },
      { label: 'Tratar como qualquer cliente', text: 'Ele nem postou. Talvez melhor assim.', effects: {} },
    ],
  },
  {
    id: 'funcionario_rouba', title: 'Caixa não fecha', icon: '🕵️', scene: 'negocio', minAge: 18, cooldown: 30,
    when: (g) => !!g.company && g.company.employees >= 3,
    bind: { f: stranger(), valor: amount(800, 6000, 100) },
    text: 'O caixa da {empresa} não fecha há semanas. As câmeras mostram {f.nome}, um funcionário, pegando dinheiro. Total: {$valor}.',
    choices: [
      { label: 'Demitir e processar', text: 'Justiça feita. A equipe entendeu o recado.', effects: { run: (g) => { g.company!.employees -= 1; } } },
      { label: 'Conversar e dar segunda chance', hint: 'Arriscado',
        outcomes: [
          { chance: 0.5, text: '{f.nome} chorou, devolveu tudo e virou o funcionário mais leal que você já teve.', effects: { run: (g, ctx) => { g.company!.cash += Number(ctx.valor); g.company!.reputation = clamp(g.company!.reputation + 3); } } },
          { chance: 1, text: 'Um mês depois, {f.nome} sumiu com o dobro.', effects: { run: (g, ctx) => { g.company!.cash -= Number(ctx.valor) * 2; } } },
        ],
      },
    ],
  },
  {
    id: 'concorrente', title: 'Concorrência', icon: '🥊', scene: 'negocio', minAge: 18, cooldown: 24,
    when: (g) => !!g.company,
    text: 'Abriu um concorrente da {empresa} [do outro lado da rua|com preços absurdamente baixos|com uma marca famosa por trás].',
    choices: [
      { label: 'Baixar preços 10%', text: 'Guerra de preços declarada.', effects: { run: (g) => { const c = g.company!; c.price = Math.max(0.6, Math.round(c.price * 0.9 * 100) / 100); } } },
      { label: 'Apostar em qualidade', text: 'Seus clientes notaram a diferença.', effects: { run: (g) => { const c = g.company!; c.quality = clamp(c.quality + 4); c.cash -= SECTORS[c.sector].startCost * 0.08; } } },
      { label: 'Ignorar', text: 'Parte dos clientes foi experimentar o vizinho.', effects: { run: (g) => { const c = g.company!; c.awareness = clamp(c.awareness - 12); } } },
    ],
  },
  {
    id: 'fiscalizacao', title: 'Fiscalização', icon: '🧾', scene: 'perigo', minAge: 18, cooldown: 36,
    when: (g) => !!g.company,
    bind: { valor: amount(2000, 12000, 500) },
    text: 'Um fiscal encontrou [um extintor vencido|uma nota fiscal faltando|um alvará atrasado] na {empresa}. Multa: {$valor}. Ele sussurra: "dá pra resolver de outro jeito..."',
    choices: [
      { label: 'Pagar a multa', text: 'Dói, mas está tudo certo.', effects: { run: (g, ctx) => { g.company!.cash -= Number(ctx.valor); } } },
      {
        label: 'Molhar a mão do fiscal', hint: 'Ilegal',
        outcomes: [
          { chance: 0.6, text: 'Ele aceitou metade. Ninguém ficou sabendo... por enquanto.', effects: { flags: { corrupcao: true }, run: (g, ctx) => { g.company!.cash -= Number(ctx.valor) / 2; } } },
          { chance: 1, text: 'Era uma operação da corregedoria! Escândalo no jornal.', effects: { stats: { estresse: 20, felicidade: -10 }, run: (g, ctx) => { const c = g.company!; c.cash -= Number(ctx.valor) * 3; c.reputation = clamp(c.reputation - 35); } } },
        ],
      },
    ],
  },
  {
    id: 'oferta_compra', title: 'Proposta milionária?', icon: '🤑', scene: 'negocio', minAge: 18, cooldown: 36,
    when: (g) => !!g.company && companyValuation(g) > 80000 && g.t - g.company.founded > 18,
    bind: { valor: (g) => String(Math.round((companyValuation(g) * rrange(g, 1.1, 1.6)) / 1000) * 1000) },
    text: 'Um fundo de investimento quer comprar a {empresa} inteira por {$valor}.',
    choices: [
      { label: 'Vender!', text: '', effects: { stats: { felicidade: 10, estresse: -10 }, run: (g, ctx) => sellCompany(g, Number(ctx.valor)) } },
      { label: 'Recusar — ela vale mais', text: 'Você apertou a mão deles e disse "não, obrigad{eu.o}".', effects: { stats: { carisma: 1 } } },
    ],
  },
  {
    id: 'funcionario_estrela', title: 'Talento raro', icon: '🌟', scene: 'negocio', minAge: 18, cooldown: 48, weight: 0.6,
    when: (g) => !!g.company && g.t - g.company.founded >= 12 && g.company.cash > SECTORS[g.company.sector].salary * 12,
    bind: { custo: (g) => String(SECTORS[g.company!.sector].salary * 6), f: stranger() },
    text: '{f.nome} quer trabalhar na {empresa}. Currículo impressionante, mas pede o triplo do salário normal.',
    choices: [
      { label: 'Contratar ({$custo} de luvas)', text: '{f.nome} revolucionou os processos.', effects: { run: (g, ctx) => { const c = g.company!; c.quality = clamp(c.quality + 8); c.employees += 1; c.cash -= SECTORS[c.sector].salary * 6; setRole('f', 'colega')(g, ctx); } } },
      { label: 'Recusar', text: 'Seis meses depois, {f.nome} abriu um concorrente.', effects: { run: (g) => { g.company!.awareness = clamp(g.company!.awareness - 5); } } },
    ],
  },
  {
    id: 'socio_amigo', title: 'Proposta de sociedade', icon: '🤜', scene: 'negocio', minAge: 20, cooldown: 60,
    when: (g) => !!g.company && g.company.cash < 15000,
    bind: { a: role('amigo', 'irmao', 'pai', 'mae') },
    text: '{a.nome} oferece $20.000 para entrar de sóci{a.o} na {empresa}.',
    choices: [
      { label: 'Aceitar', text: 'Caixa reforçado. Agora tem mais alguém opinando.', effects: { rel: { a: 8 }, run: (g) => { g.company!.cash += 20000; g.company!.salaryDraw = Math.round(g.company!.salaryDraw * 0.7); } } },
      { label: 'Recusar: negócio é negócio', text: '{a.nome} entendeu. Acho.', effects: { rel: { a: -4 } } },
    ],
  },
];
