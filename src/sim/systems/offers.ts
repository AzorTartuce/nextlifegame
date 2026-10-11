import { chance, pick } from '../rng';
import { CATS, type ItemCat, type Passive, type ShopItem, type StoreDef } from '../data/shop';
import type { GameState, ShopOffer } from '../types';
import { t } from '../../i18n';

export interface OfferDraft {
  item: ShopItem;
  discount: number;
  headline: string;
}

/**
 * Ofertas do dia. A implementação padrão é procedural; para usar IA depois, implemente `OfferProvider`
 * com `buildOfferPrompt` + `parseOfferResponse`, usando `TemplateOffers` como fallback.
 */
export interface OfferProvider {
  generate(g: GameState, stores: StoreDef[], id: number): OfferDraft | null;
}

interface Quirk {
  name: (base: string) => string;
  desc: string;
  mods: Passive;
  priceMult: number;
  cats?: ItemCat[];
}

const TECH: ItemCat[] = ['celular', 'notebook', 'console', 'tv', 'audio', 'camera', 'gadget'];
const WEAR: ItemCat[] = ['roupa', 'social', 'calcado', 'bolsa'];
const HOME: ItemCat[] = ['movel', 'decor', 'eletro', 'reforma', 'outdoor'];
const FOOD: ItemCat[] = ['mercado', 'doces', 'bebida', 'refeicao', 'fastfood', 'suplemento', 'remedio', 'beleza', 'presente'];

const QUIRKS: Quirk[] = [
  { name: (b) => t('{b} com bluetooth que só conecta às terças', { b }), desc: 'Funciona maravilhosamente bem em um único dia da semana.', mods: { mood: 0.6, prod: -0.6 }, priceMult: 0.75, cats: TECH },
  { name: (b) => t('{b} edição "o gato que apertou todos os botões"', { b }), desc: 'Vem com uma pelúcia de gato e um manual escrito pelo próprio gato.', mods: { mood: 1.2, status: -0.8 }, priceMult: 0.9, cats: TECH },
  { name: (b) => t('{b} numerado: nº 0001 de 0001', { b }), desc: 'Edição limitada a exatamente uma unidade, a que você está vendo.', mods: { status: 2.5 }, priceMult: 1.5 },
  { name: (b) => t('{b} assinado por alguém que talvez seja famoso', { b }), desc: 'A assinatura é ilegível, mas a pessoa jurou que é famosa.', mods: { status: 1.8 }, priceMult: 1.35 },
  { name: (b) => t('{b} reciclado de forma muito criativa', { b }), desc: 'Parece usado por uma pessoa feliz. Cheira a lavanda e a segredos.', mods: { mood: 0.8, calm: 0.6, status: -0.5 }, priceMult: 0.7 },
  { name: (b) => t('{b} versão "feito por um avô orgulhoso"', { b }), desc: 'Tem defeitos charmosos e um bilhete de carinho no bolso.', mods: { mood: 1.4, calm: 0.8 }, priceMult: 1.1, cats: [...WEAR, ...HOME] },
  { name: (b) => t('{b} que muda de cor conforme o humor', { b }), desc: 'Fica roxo quando você está estressado. Já está roxo.', mods: { mood: 0.8, calm: 0.5, look: 0.5 }, priceMult: 1.2, cats: [...HOME, ...WEAR] },
  { name: (b) => t('{b} com cheiro de pizza (garantido)', { b }), desc: 'Ninguém pediu, mas todo mundo vai querer cheirar.', mods: { mood: 1.5, status: -1.2 }, priceMult: 0.8 },
  { name: (b) => t('{b} "protegido contra segundas-feiras"', { b }), desc: 'Reduz em 3% a chance de odiar o dia. Estudos? Nenhum.', mods: { calm: 1.4, mood: 0.6 }, priceMult: 1.05 },
  { name: (b) => t('{b} sabor mistério', { b }), desc: 'O rótulo caiu. O vendedor jura que é bom. Boa sorte.', mods: {}, priceMult: 0.6, cats: FOOD },
  { name: (b) => t('{b} do fabricante que só trabalha à noite', { b }), desc: 'Acabamento impecável, entrega misteriosa, nota fiscal em runas.', mods: { prod: 1.2, status: 0.8 }, priceMult: 1.25 },
];

const DISCOUNT_LEAD = ['Oferta relâmpago', 'Queima de estoque', 'Liquidação', 'Só hoje'];
const DISCOUNT_TAIL = [' — o gerente enlouqueceu.', ' (o estoque está um caos).', ', porque o fornecedor errou o pedido.', ' — corra, antes que alguém perceba!', ' (sem troca, sem choro).'];
const UNIQUE_LEAD = ['Item único', 'Achado raro', 'Edição única'];

const mergePassive = (a: Passive, b: Passive): Passive => {
  const out: Passive = { ...a };
  for (const [k, v] of Object.entries(b) as [keyof Passive, number][]) out[k] = Math.round(((out[k] ?? 0) + v) * 10) / 10;
  return out;
};

export const TemplateOffers: OfferProvider = {
  generate(g, stores, id) {
    const pool = stores.filter((s) => s.region !== 'all' && s.items.some((i) => CATS[i.cat].kind !== 'ativo' && i.cat !== 'ouro'));
    if (!pool.length) return null;
    const store = pick(g, pool);
    const base = pick(g, store.items.filter((i) => CATS[i.cat].kind !== 'ativo' && i.cat !== 'ouro'));
    if (chance(g, 0.3)) {
      const options = QUIRKS.filter((q) => !q.cats || q.cats.includes(base.cat));
      const quirk = pick(g, options);
      const consumable = CATS[base.cat].kind === 'consumivel';
      const item: ShopItem = {
        ...base,
        id: `unique:${id}`,
        name: quirk.name(t(base.name)),
        desc: t(quirk.desc),
        price: Math.round(base.price * quirk.priceMult * 100) / 100,
        passive: consumable ? base.passive : mergePassive(base.passive, quirk.mods),
        now: consumable ? { ...base.now, felicidade: Math.round(((base.now.felicidade ?? 0) + (quirk.mods.mood ?? 0)) * 10) / 10 } : base.now,
        unique: true,
      };
      return { item, discount: 0, headline: `${t(pick(g, UNIQUE_LEAD))}: ${item.name}` };
    }
    const discount = pick(g, [0.2, 0.25, 0.3, 0.4, 0.5, 0.6]);
    return { item: { ...base, id: base.id }, discount, headline: t('{v}: {name} com {v2}% de desconto{v3}', { v: t(pick(g, DISCOUNT_LEAD)), name: t(base.name), v2: Math.round(discount * 100), v3: t(pick(g, DISCOUNT_TAIL)) }) };
  },
};

export function generateOffers(g: GameState, stores: StoreDef[], count = 4): ShopOffer[] {
  const out: ShopOffer[] = [];
  for (let i = 0; i < count; i++) {
    g.nextId += 1;
    const draft = TemplateOffers.generate(g, stores, g.nextId);
    if (!draft) continue;
    out.push({ id: g.nextId, storeId: draft.item.store, item: draft.item, discount: draft.discount, headline: draft.headline, expires: g.t + 1 });
  }
  return out;
}

/** Prompt para uma IA criar uma oferta única, com humor, dentro dos limites do jogo. */
export function buildOfferPrompt(store: StoreDef, cat: ItemCat): string {
  return `Crie um item único e engraçado para a loja "${store.name}", categoria "${CATS[cat].label}", em português. ` +
    'Responda apenas com JSON: {"nome": string, "descricao": string, "preco_mult": number (0.5 a 1.6), "efeitos": {"status"?: number, "mood"?: number, "calm"?: number, "prod"?: number, "look"?: number} (cada efeito de -2 a 3)}.';
}

/** Valida a resposta da IA; devolve null se vier malformada (o chamador usa TemplateOffers). */
export function parseOfferResponse(raw: string, base: ShopItem): ShopItem | null {
  try {
    const data = JSON.parse(raw.trim().replace(/^```(?:json)?|```$/g, ''));
    const name = typeof data.nome === 'string' ? data.nome.trim() : '';
    const desc = typeof data.descricao === 'string' ? data.descricao.trim() : '';
    const mult = Number(data.preco_mult);
    if (!name || name.length > 90 || desc.length > 220 || !Number.isFinite(mult)) return null;
    const mods: Passive = {};
    for (const k of ['status', 'mood', 'calm', 'prod', 'look'] as const) {
      const v = Number(data.efeitos?.[k]);
      if (Number.isFinite(v)) mods[k] = Math.max(-2, Math.min(3, v));
    }
    return {
      ...base,
      id: `unique:${base.id}`,
      name,
      desc,
      price: Math.round(base.price * Math.max(0.5, Math.min(1.6, mult)) * 100) / 100,
      passive: CATS[base.cat].kind === 'consumivel' ? base.passive : mergePassive(base.passive, mods),
      unique: true,
    };
  } catch {
    return null;
  }
}


/** Textos-base das ofertas (usados pelo teste de cobertura do inglês). */
export const OFFER_PHRASES: string[] = [...QUIRKS.map((q) => q.desc), ...DISCOUNT_LEAD, ...DISCOUNT_TAIL, ...UNIQUE_LEAD];
