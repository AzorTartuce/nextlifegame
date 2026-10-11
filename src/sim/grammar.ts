import { isEn, t } from '../i18n';
import { ageYears, formatMoney, genderTitle, localizeMoney, setWorld, worldOf } from './core';
import { careerById } from './data/careers';
import { pick } from './rng';
import type { GameState, Person } from './types';

/**
 * Gramática procedural mínima (camada 2 do sistema narrativo).
 *
 *  - `{npc.nome}`  → campo de uma pessoa ligada ao contexto (`eu` = jogador)
 *    campos: nome, completo, o (o/a), ele (ele/ela), dele (dele/dela), um (um/uma), idade
 *  - `{valor}`     → valor bruto do contexto (números viram dinheiro com `{$valor}`)
 *  - `{empresa}`, `{cargo}`, `{cidade}`, `{pais}` → atalhos do estado atual
 *  - `$1.500`      → valor literal em unidades internas, convertido para a moeda local
 *  - `[a|b|c]`     → escolha aleatória inline
 *  - `#regra#`     → expande uma regra global
 */
export const RULES: Record<string, string[]> = {
  comida: ['pastel', 'coxinha', 'pão de queijo', 'açaí', 'brigadeiro', 'pizza fria'],
  lugar: ['na padaria', 'no ponto de ônibus', 'na fila do banco', 'no mercado', 'num show', 'na praia'],
  hobby: ['ama trilhas', 'coleciona plantas', 'faz cerâmica', 'toca baixo numa banda', 'corre maratonas', 'sabe todas as falas de novela'],
  elogio: ['incrível', 'genial', 'surpreendente', 'muito acima da média', 'impecável'],
  bronca: ['decepcionante', 'preocupante', 'inaceitável', 'abaixo do esperado'],
  destino: ['Lisboa', 'Tóquio', 'Patagônia', 'Cidade do Cabo', 'Islândia', 'Cartagena'],
  viral: ['dançando', 'tropeçando na escada', 'cantando no chuveiro', 'imitando o diretor', 'discutindo com um pombo'],
};

function personField(g: GameState, p: Person, field: string): string {
  const f = p.gender === 'f';
  if (isEn()) {
    switch (field) {
      case 'nome': return p.firstName;
      case 'completo': return `${p.firstName} ${p.lastName}`;
      case 'o': return '';
      case 'ele': return f ? 'she' : 'he';
      case 'Ele': return f ? 'She' : 'He';
      case 'dele': return f ? 'her' : 'his';
      case 'um': return 'a';
      case 'idade': return String(ageYears(g, p));
      default: return `?${field}`;
    }
  }
  switch (field) {
    case 'nome': return p.firstName;
    case 'completo': return `${p.firstName} ${p.lastName}`;
    case 'o': return f ? 'a' : 'o';
    case 'ele': return f ? 'ela' : 'ele';
    case 'Ele': return f ? 'Ela' : 'Ele';
    case 'dele': return f ? 'dela' : 'dele';
    case 'um': return f ? 'uma' : 'um';
    case 'idade': return String(ageYears(g, p));
    default: return `?${field}`;
  }
}

export function render(g: GameState, template: string, ctx: Record<string, string> = {}): string {
  setWorld(g);
  const { country, city } = worldOf(g);
  const local: Record<string, readonly string[]> = { comida: country.foods, lugar: country.places };
  let out = template;
  // Escolhas inline (permite aninhar regras dentro).
  out = out.replace(/\[([^\]]+)\]/g, (_, body: string) => pick(g, body.split('|')));
  out = out.replace(/#(\w+)#/g, (_, rule: string) => {
    const options = local[rule] ?? RULES[rule];
    return options ? t(pick(g, options)) : rule;
  });
  // Valores literais ($1.500) são escritos em unidades internas.
  out = localizeMoney(out);
  out = out.replace(/\{(\$?)([\w]+)(?:\.(\w+))?\}/g, (_, money: string, key: string, field?: string) => {
    if (field) {
      const p = key === 'eu' ? g.player : g.npcs[ctx[key]];
      return p ? personField(g, p, field) : '???';
    }
    if (key === 'empresa') return g.company?.name ?? t('sua empresa');
    if (key === 'cidade') return city.name;
    if (key === 'pais') return country.name;
    if (key === 'cargo') {
      if (!g.job) return t('seu cargo');
      return genderTitle(t(careerById(g.job.careerId).levels[g.job.level].title), g.player.gender);
    }
    const v = ctx[key];
    if (v === undefined) return `{${key}}`;
    return money ? formatMoney(Number(v)) : v;
  });
  // "Aprovado(a)" e afins seguem o gênero do jogador.
  return genderTitle(out, g.player.gender);
}
