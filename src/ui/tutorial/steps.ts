import { t } from '../../i18n';

/** Passos do tutorial. `target` devolve o elemento real da tela (ou null: cartão centralizado). */

const visible = (el: Element | null): el is HTMLElement => {
  if (!(el instanceof HTMLElement)) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
};

const firstVisible = (sel: string): HTMLElement | null => {
  for (const el of Array.from(document.querySelectorAll(sel))) if (visible(el)) return el;
  return null;
};

/** Botão de aba (celular ou painel largo) cujo texto contém o rótulo (em PT ou EN, já traduzido). */
export const findTab = (labels: string[]): HTMLElement | null => {
  for (const el of Array.from(document.querySelectorAll('.nav button, .tabs button'))) {
    if (visible(el) && labels.some((l) => el.textContent?.includes(l) || el.textContent?.includes(t(l)))) return el;
  }
  return null;
};

export interface TourStep {
  id: string;
  title: string;
  body: string;
  /** Rótulos de aba (PT) a procurar; o componente traduz. */
  tab?: string;
  target?: () => HTMLElement | null;
  /** Aba a abrir antes de mostrar o passo. */
  openTab?: 'vida' | 'rotina' | 'carreira' | 'celular';
}

export const STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo à sua vida',
    body: 'Você vive uma vida inteira, um turno por vez. É simples: avance o tempo e decida quando algo acontecer. Este guia leva menos de um minuto e você pode pular quando quiser.',
  },
  {
    id: 'advance',
    title: 'Avançar o tempo',
    body: 'Toque aqui (ou aperte Espaço) para viver o próximo período. O botão ▶ deixa o tempo correr sozinho e para quando algo importante acontece.',
    target: () => firstVisible('.timebar .advance'),
  },
  {
    id: 'stats',
    title: 'Seus atributos',
    body: 'Saúde, felicidade e estresse mostram como você está. Barras cheias e verdes são boas; para o estresse, quanto menor, melhor. Eles mudam aos poucos, sem pressa.',
    target: () => firstVisible('.stats'),
  },
  {
    id: 'events',
    title: 'Eventos e escolhas',
    body: 'De vez em quando surge um evento com opções. Escolha com calma: o jogo espera por você e a vida segue a partir da sua decisão. Tudo fica registrado na linha da vida.',
    target: () => firstVisible('.feed'),
    openTab: 'vida',
  },
  {
    id: 'routine',
    title: 'Sua rotina semanal',
    body: 'Aqui você reparte as horas da semana entre estudo, exercício, amigos e lazer. Cada hora empurra seus atributos para um lado. Comece simples: um pouco de tudo e bastante descanso.',
    tab: 'Rotina',
    target: () => findTab(['Rotina']),
  },
  {
    id: 'career',
    title: 'Estudo e carreira',
    body: 'Quando crescer, aqui você escolhe escola, faculdade e emprego. Estudar abre portas melhores, e trabalho rende o dinheiro que sustenta o resto.',
    tab: 'Carreira',
    target: () => findTab(['Carreira']),
  },
  {
    id: 'phone',
    title: 'O celular',
    body: 'Seus apps ficam aqui: loja, saúde, viagens, bolsa e mais. Cada app aparece quando você tem idade para usá-lo. Não precisa mexer em nada disso para jogar.',
    tab: 'Celular',
    target: () => findTab(['Celular']),
  },
  {
    id: 'money',
    title: 'Dinheiro e patrimônio',
    body: 'Seu saldo fica aqui no topo. Gaste com cuidado: dívida aumenta o estresse. O patrimônio (tudo o que você possui) mostra se você está prosperando.',
    target: () => firstVisible('.money'),
  },
];
