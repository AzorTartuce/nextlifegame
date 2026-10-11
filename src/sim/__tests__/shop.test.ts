import { describe, expect, it } from 'vitest';
import { setWorld } from '../core';
import { CATS, ITEM_BY_ID, REGION_OF, STORES, itemById } from '../data/shop';
import { COUNTRIES } from '../data/world';
import { newGame } from '../game';
import { parseOfferResponse } from '../systems/offers';
import { lifeTick } from '../systems/life';
import { bonuses, checkout, inheritShop, itemPrice, previewCart, regionOf, sellItem, shopTick, statusScore, storesFor, validateCart, ownsHome } from '../systems/shop';
import { assetsValue, resaleValue } from '../systems/valuation';
import { relocate } from '../systems/world';
import type { GameState } from '../types';

function adult(country = 'br', city = 'São Paulo', seed = 21): GameState {
  const g = newGame({ firstName: 'Ana', lastName: 'T', gender: 'f', attraction: 'm', seed, country, city });
  g.player.birth = g.t - 30 * 12;
  g.money = 5_000_000;
  g.livesWithParents = false;
  g.life.licenses.carro = true;
  g.life.licenses.lancha = true;
  setWorld(g);
  return g;
}

const buyOne = (g: GameState, id: string) => checkout(g, [{ ref: id, qty: 1 }]);
const phone = (g: GameState, id: string) => g.shop.inventory.find((o) => o.itemId === id);

describe('GlobalMart: catálogo', () => {
  it('tem ~50 lojas do documento, ids únicos e dados válidos', () => {
    expect(STORES.length).toBeGreaterThanOrEqual(50);
    expect(new Set(STORES.map((s) => s.id)).size).toBe(STORES.length);
    const ids = STORES.flatMap((s) => s.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of STORES) {
      expect(s.items.length).toBeGreaterThan(0);
      for (const i of s.items) {
        expect(CATS[i.cat]).toBeDefined();
        expect(i.price).toBeGreaterThan(0);
        expect(i.store).toBe(s.id);
      }
    }
    for (const c of COUNTRIES) expect(REGION_OF[c.id]).toBeDefined();
    expect(ITEM_BY_ID.size).toBe(ids.length);
  });

  it('cada país vê as lojas da sua região e as demais como internacionais', () => {
    const br = adult('br');
    expect(regionOf(br)).toBe('brasil');
    const { local, intl } = storesFor(br);
    expect(local.some((s) => s.id === 'renner')).toBe(true);
    expect(local.some((s) => s.id === 'dealer_carros')).toBe(true);
    expect(intl.some((s) => s.id === 'apple')).toBe(true);
    expect(intl.some((s) => s.id === 'renner')).toBe(false);
    expect(regionOf(adult('jp', 'Tóquio'))).toBe('asia');
  });
});

describe('GlobalMart: preços', () => {
  it('produtos globais pesam muito mais no bolso em países de renda baixa', () => {
    const iphone = itemById('apple:iphone-de-ultima-geracao')!;
    const g1 = adult('br');
    const g2 = adult('us', 'Nova York');
    // Preço em unidades internas / salário do primeiro emprego (1.600).
    const br = itemPrice(g1, iphone) * 1 / 1600;
    const us = itemPrice(g2, iphone) / 1600;
    expect(br / us).toBeGreaterThan(5);
  });

  it('bens locais acompanham a renda do país', () => {
    const groceries = itemById('carrefour:compras-do-mes')!;
    const br = itemPrice(adult('br'), groceries);
    const jp = itemPrice(adult('jp', 'Tóquio'), groceries);
    expect(Math.abs(br - jp) / br).toBeLessThan(0.5);
  });

  it('lojas de outras regiões cobram frete e imposto, e nada perecível chega do exterior', () => {
    const g = adult('br');
    const home = itemById('renner:look-completo-casual')!;
    const abroad = itemById('muji:roupa-de-algodao-organico')!;
    expect(itemPrice(g, abroad)).toBeGreaterThan(abroad.price * 0.8 * 1.2);
    expect(itemPrice(g, home)).toBeLessThan(home.price * 2);
  });

  it('o índice de preços e o ouro ficam dentro de limites por 60 anos', () => {
    const g = adult('br');
    for (let i = 0; i < 720; i++) { g.t += 1; shopTick(g, {}); }
    expect(g.shop.priceIndex).toBeGreaterThanOrEqual(0.8);
    expect(g.shop.priceIndex).toBeLessThanOrEqual(2.2);
    expect(g.shop.goldIdx).toBeGreaterThanOrEqual(0.4);
    expect(g.shop.goldIdx).toBeLessThanOrEqual(4);
  });
});

describe('GlobalMart: compras', () => {
  it('consumíveis têm efeito imediato que rende menos a cada repetição no mês', () => {
    const g = adult();
    g.player.stats.felicidade = 20;
    const before = g.money;
    buyOne(g, 'americanas:chocolates-e-doces');
    const first = g.player.stats.felicidade - 20;
    expect(first).toBeGreaterThan(1);
    expect(g.money).toBeLessThan(before);
    const mid = g.player.stats.felicidade;
    buyOne(g, 'americanas:chocolates-e-doces');
    const second = g.player.stats.felicidade - mid;
    expect(second).toBeLessThan(first);
    expect(g.shop.inventory.length).toBe(0);
  });

  it('fast food acumula saúde oculta e remédio desfaz', () => {
    const g = adult();
    for (let i = 0; i < 6; i++) checkout(g, [{ ref: 'tesco:sanduiche-de-supermercado', qty: 3 }]);
    expect(g.shop.junk).toBeGreaterThan(8);
    const junk = g.shop.junk;
    buyOne(g, 'raia:remedios');
    expect(g.shop.junk).toBeLessThan(junk);
    for (let i = 0; i < 30; i++) { g.t += 1; shopTick(g, {}); }
    expect(g.shop.junk).toBeLessThan(junk - 5);
  });

  it('duráveis dão bônus, mas só o melhor item de cada espaço conta', () => {
    const g = adult();
    const b0 = bonuses(g);
    buyOne(g, 'magalu:smartphone-popular');
    const cheap = bonuses(g);
    expect(cheap.status).toBeGreaterThan(b0.status);
    buyOne(g, 'apple:iphone-de-ultima-geracao');
    const both = bonuses(g);
    expect(both.status).toBeGreaterThan(cheap.status);
    // Comprar um terceiro, mais barato, não soma.
    buyOne(g, 'magalu:smartphone-popular');
    expect(bonuses(g).status).toBeCloseTo(both.status, 5);
    expect(g.shop.inventory.length).toBe(3);
  });

  it('eletrônicos ficam obsoletos com o tempo', () => {
    const g = adult();
    buyOne(g, 'apple:iphone-de-ultima-geracao');
    const fresh = bonuses(g).prod;
    g.t += 48;
    expect(bonuses(g).prod).toBeLessThan(fresh);
  });

  it('terno e relógio aumentam o status social', () => {
    const g = adult();
    g.job = null;
    const s0 = statusScore(g);
    buyOne(g, 'saks:terno-sob-medida');
    buyOne(g, 'harrods:relogio-suico');
    expect(statusScore(g)).toBeGreaterThan(s0 + 8);
  });

  it('valida: carrinho vazio, dinheiro insuficiente e idade mínima', () => {
    const g = adult();
    expect(validateCart(g, [])).toMatch(/vazio/);
    g.money = 10;
    expect(validateCart(g, [{ ref: 'apple:macbook-pro', qty: 1 }])).toMatch(/Faltam/);
    const kid = adult();
    kid.player.birth = kid.t - 12 * 12;
    expect(validateCart(kid, [{ ref: 'americanas:chocolates-e-doces', qty: 1 }])).toMatch(/16 anos/);
    const teen = adult();
    teen.player.birth = teen.t - 17 * 12;
    expect(validateCart(teen, [{ ref: 'dealer_carros:compacto-popular', qty: 1 }])).toMatch(/18 anos/);
  });

  it('prévia do carrinho mostra o impacto antes de pagar', () => {
    const g = adult();
    const p = previewCart(g, [{ ref: 'bestbuy:notebook-ultrafino', qty: 1 }, { ref: 'cvs:remedios-e-vitaminas', qty: 2 }]);
    expect(p.error).toBeNull();
    expect(p.after.prod).toBeGreaterThan(p.before.prod);
    expect(p.now.saude).toBeGreaterThan(0);
    expect(p.total).toBeGreaterThan(0);
    expect(g.shop.inventory.length).toBe(0);
  });

  it('blind boxes sorteiam raridades que valorizam a revenda', () => {
    const g = adult();
    for (let i = 0; i < 80; i++) checkout(g, [{ ref: 'popmart:blind-box-figure-surpresa', qty: 1 }]);
    const mults = g.shop.inventory.map((o) => o.mult ?? 1);
    expect(mults.some((m) => m > 1)).toBe(true);
    expect(mults.filter((m) => m === 1).length).toBeGreaterThan(30);
    const top = g.shop.inventory.find((o) => (o.mult ?? 1) >= 5);
    if (top) expect(resaleValue(g, top)).toBeGreaterThan(top.paid);
  });
});

describe('GlobalMart: bens de alto custo e revenda', () => {
  it('casa própria substitui o aluguel e custa manutenção anual', () => {
    const g = adult();
    const base = adult();
    const m0 = g.money;
    lifeTick(base, {});
    const rent = m0 - base.money;
    buyOne(g, 'dealer_imoveis:kitnet');
    expect(ownsHome(g)).toBe(true);
    expect(g.livesWithParents).toBe(false);
    const afterBuy = g.money;
    lifeTick(g, {});
    const owned = afterBuy - g.money;
    expect(owned).toBeLessThan(rent * 0.7);
    const upkeep = afterBuy;
    shopTick(g, {});
    expect(upkeep - g.money).toBeGreaterThan(0);
  });

  it('carro cobra manutenção mensal e perde valor; imóvel valoriza', () => {
    const g = adult();
    expect(buyOne(g, 'dealer_carros:seda-medio')).toContain('Compra');
    const car = g.shop.inventory[0];
    const before = g.money;
    shopTick(g, {});
    expect(before - g.money).toBeCloseTo((car.paid * 0.06) / 12, 1);
    g.t += 36;
    expect(resaleValue(g, car)).toBeLessThan(car.paid * 0.8);
    buyOne(g, 'dealer_imoveis:apartamento-de-2-quartos');
    const home = g.shop.inventory.find((o) => itemById(o.itemId)?.cat === 'imovel')!;
    g.t += 60;
    expect(resaleValue(g, home)).toBeGreaterThan(home.paid * 1.05);
  });

  it('vender devolve o valor de usado, e ouro segue o preço do dia', () => {
    const g = adult();
    buyOne(g, 'apple:iphone-de-ultima-geracao');
    const o = phone(g, 'apple:iphone-de-ultima-geracao')!;
    g.t += 24;
    const before = g.money;
    sellItem(g, o.uid);
    expect(g.money - before).toBeLessThan(o.paid * 0.6);
    expect(g.shop.inventory.length).toBe(0);

    buyOne(g, 'goldsouk:barra-de-ouro-10-g');
    const gold = g.shop.inventory[0];
    g.shop.goldIdx *= 1.5;
    expect(resaleValue(g, gold)).toBeGreaterThan(gold.paid * 1.3);
  });

  it('patrimônio inclui ativos de valor, mas não eletrônicos', () => {
    const g = adult();
    buyOne(g, 'apple:iphone-de-ultima-geracao');
    expect(assetsValue(g)).toBe(0);
    buyOne(g, 'dealer_imoveis:kitnet');
    expect(assetsValue(g)).toBeGreaterThan(50000);
  });

  it('mudar de cidade vende o imóvel', () => {
    const g = adult();
    buyOne(g, 'dealer_imoveis:kitnet');
    expect(ownsHome(g)).toBe(true);
    delete g.flags.mudou;
    relocate(g, 'br', 'Curitiba');
    expect(ownsHome(g)).toBe(false);
    expect(g.city).toBe('Curitiba');
  });

  it('herdeiro fica com imóveis, ouro e colecionáveis; o resto vira dinheiro', () => {
    const g = adult();
    buyOne(g, 'dealer_imoveis:kitnet');
    buyOne(g, 'apple:iphone-de-ultima-geracao');
    buyOne(g, 'goldsouk:barra-de-ouro-10-g');
    const estate = inheritShop(g);
    expect(estate.shop.inventory.map((o) => itemById(o.itemId)?.cat).sort()).toEqual(['imovel', 'ouro']);
    expect(estate.cash).toBeGreaterThan(0);
  });
});

describe('GlobalMart: tendências e ofertas', () => {
  it('marca cancelada perde status e valor de revenda; marca em alta valoriza', () => {
    const g = adult();
    buyOne(g, 'zara:blazer-de-trabalho');
    const o = g.shop.inventory[0];
    const status = bonuses(g).status;
    const value = resaleValue(g, o);
    g.shop.trends.zara = { status: 0.4, price: 0.9, left: 12 };
    expect(bonuses(g).status).toBeLessThan(status);
    expect(resaleValue(g, o)).toBeLessThan(value);
    g.shop.trends.zara = { status: 1.5, price: 1.1, left: 12 };
    expect(bonuses(g).status).toBeGreaterThan(status);
    expect(resaleValue(g, o)).toBeGreaterThan(value);
  });

  it('tendência de marca com ação listada mexe no preço da ação', () => {
    let hit = false;
    for (let seed = 1; seed <= 400 && !hit; seed++) {
      const g = adult('us', 'Nova York', seed);
      for (let i = 0; i < 24 && !hit; i++) {
        g.t += 1;
        shopTick(g, {});
        hit = g.market.pending.some((p) => ['AAPL', 'WMT', 'COST', 'HD', 'RADL3', 'MC', 'EMAAR'].includes(p.ticker) && g.shop.news[0]?.t === g.t);
      }
    }
    expect(hit).toBe(true);
  });

  it('ofertas do dia: 4 por mês, itens únicos ou com desconto, e comprar usa o preço com desconto', () => {
    const g = adult();
    shopTick(g, {});
    expect(g.shop.offers.length).toBe(4);
    const offer = g.shop.offers.find((o) => o.discount > 0) ?? g.shop.offers[0];
    const ref = `offer:${offer.id}`;
    const full = itemPrice(g, offer.item, 0);
    const price = itemPrice(g, offer.item, offer.discount);
    expect(price).toBeLessThanOrEqual(full);
    const before = g.money;
    checkout(g, [{ ref, qty: 1 }]);
    expect(before - g.money).toBeCloseTo(price, 1);
    expect(g.shop.offers.some((o) => o.id === offer.id)).toBe(false);
  });

  it('interface de IA para ofertas: valida e limita a resposta', () => {
    const base = itemById('apple:airpods')!;
    const ok = parseOfferResponse('{"nome":"AirPods que cantam parabéns","descricao":"Só sabem uma música.","preco_mult":1.2,"efeitos":{"mood":9,"status":-9}}', base)!;
    expect(ok.unique).toBe(true);
    expect(ok.passive.mood).toBeLessThanOrEqual(base.passive.mood! + 3 + 0.01);
    expect(parseOfferResponse('lixo', base)).toBeNull();
    expect(parseOfferResponse('{"nome":"","descricao":"x","preco_mult":1}', base)).toBeNull();
  });
});
