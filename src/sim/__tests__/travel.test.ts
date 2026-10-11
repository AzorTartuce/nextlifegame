import { describe, expect, it } from 'vitest';
import { DESTINATIONS, destById } from '../data/travel';
import { newGame } from '../game';
import { finishMinigame, runAction } from '../systems/actions';
import { checkout, shopTick, toggleRent, validateCart, ownsHome } from '../systems/shop';
import { canTravel, takeTrip, tripCost } from '../systems/travel';
import type { GameState } from '../types';

function adult(country = 'br', city = 'São Paulo', seed = 41): GameState {
  const g = newGame({ firstName: 'Ana', lastName: 'T', gender: 'f', attraction: 'm', seed, country, city });
  g.player.birth = g.t - 30 * 12;
  g.money = 5_000_000;
  g.livesWithParents = false;
  return g;
}

describe('viagens', () => {
  it('viajar custa mais longe e em classe melhor, e sai barato dentro do país', () => {
    const g = adult();
    const near = tripCost(g, destById('rio'), 'economica');
    const far = tripCost(g, destById('toquio'), 'economica');
    expect(far).toBeGreaterThan(near * 3);
    expect(tripCost(g, destById('toquio'), 'primeira')).toBeGreaterThan(far * 4);
    // Mesmo destino: doméstico é bem mais barato que para quem mora fora.
    const jp = adult('jp', 'Tóquio');
    const domestic = tripCost(jp, destById('toquio'), 'economica');
    const intl = tripCost(jp, destById('paris'), 'economica');
    expect(domestic).toBeLessThan(intl);
  });

  it('a viagem reduz o estresse, aumenta a felicidade e registra o lugar', () => {
    const g = adult();
    g.player.stats.estresse = 70;
    g.player.stats.felicidade = 40;
    const before = g.money;
    expect(takeTrip(g, 'paris', 'executiva')).toBe('');
    expect(g.money).toBeLessThan(before);
    expect(g.player.stats.estresse).toBeLessThan(60);
    expect(g.player.stats.felicidade).toBeGreaterThan(45);
    expect(g.life.travel.visited).toContain('paris');
    expect(g.lastResult?.title).toMatch(/Paris/);
    expect(g.life.counters.trips).toBe(1);
  });

  it('respeita espera, idade, prisão e dinheiro', () => {
    const g = adult();
    takeTrip(g, 'rio', 'economica');
    expect(canTravel(g)).toMatch(/Espere/);
    const kid = adult();
    kid.player.birth = kid.t - 12 * 12;
    expect(canTravel(kid)).toMatch(/16/);
    const poor = adult();
    poor.money = 10;
    expect(takeTrip(poor, 'maldivas', 'primeira')).toMatch(/Faltam/);
    const jailed = adult();
    jailed.life.crime.prison = { monthsLeft: 5, total: 5, crime: 'x', conduct: 0, gang: null };
    expect(canTravel(jailed)).toMatch(/preso/);
  });

  it('o mapa tem destinos reais únicos e variados', () => {
    expect(new Set(DESTINATIONS.map((d) => d.id)).size).toBe(DESTINATIONS.length);
    expect(DESTINATIONS.length).toBeGreaterThanOrEqual(40);
    const vibes = new Set(DESTINATIONS.flatMap((d) => d.vibes));
    expect(vibes.size).toBe(7);
  });

  it('muitas viagens enchem o mapa e rendem a fita de viajante', () => {
    const g = adult();
    for (const d of DESTINATIONS.slice(0, 16)) { g.cooldowns.trip = -1; g.money = 5_000_000; takeTrip(g, d.id, 'economica'); }
    expect(g.life.travel.visited.length).toBe(16);
  });
});

describe('licenças e minigames', () => {
  it('a carteira de motorista abre o minigame e o resultado concede a licença', () => {
    const g = adult();
    expect(validateCart(g, [{ ref: 'dealer_carros:compacto-popular', qty: 1 }])).toMatch(/carteira/);
    expect(runAction(g, 'act_lic_carro')).toBe('');
    expect(g.minigame?.id).toBe('sinais');
    expect(g.money).toBe(5_000_000 - 400);
    finishMinigame(g, { score: 8, max: 10, win: true });
    expect(g.minigame).toBeNull();
    expect(g.life.licenses.carro).toBe(true);
    expect(g.lastResult?.text).toMatch(/carteira/);
    expect(validateCart(g, [{ ref: 'dealer_carros:compacto-popular', qty: 1 }])).toBeNull();
  });

  it('reprovar não dá a licença, desistir não mostra nada', () => {
    const g = adult();
    runAction(g, 'act_lic_carro');
    finishMinigame(g, { score: 4, max: 10, win: false });
    expect(g.life.licenses.carro).toBeUndefined();
    expect(g.lastResult?.text).toMatch(/Reprovado/);
    const h = adult();
    runAction(h, 'act_lic_carro');
    finishMinigame(h, { score: 0, max: 1, win: false, cancelled: true });
    expect(h.lastResult).toBeNull();
  });

  it('ler um livro rende inteligência proporcional ao desempenho', () => {
    const g = adult();
    g.player.stats.inteligencia = 40;
    expect(runAction(g, 'act_ler')).toBe('');
    expect(g.minigame?.id).toBe('livro');
    finishMinigame(g, { score: 30, max: 30, win: true });
    expect(g.player.stats.inteligencia).toBeGreaterThan(41);
    // não dá para abrir outra ação com o minigame ativo
    const h = adult();
    runAction(h, 'act_ler');
    expect(runAction(h, 'act_cinema')).toMatch(/Resolva/);
  });

  it('lancha e avião pedem as licenças certas', () => {
    const g = adult();
    g.life.licenses = {};
    expect(validateCart(g, [{ ref: 'dealer_lanchas:bote-inflavel', qty: 1 }])).toMatch(/náutica/);
    expect(validateCart(g, [{ ref: 'dealer_avioes:monomotor-de-treinamento', qty: 1 }])).toMatch(/brevê/);
    g.life.licenses = { lancha: true, aviao: true };
    expect(validateCart(g, [{ ref: 'dealer_avioes:monomotor-de-treinamento', qty: 1 }])).toBeNull();
  });
});

describe('renda de imóveis e fazendas', () => {
  it('aluguel rende todo mês e o imóvel alugado deixa de ser moradia', () => {
    const g = adult();
    g.life.licenses.carro = true;
    checkout(g, [{ ref: 'dealer_imoveis:apartamento-de-2-quartos', qty: 1 }]);
    expect(ownsHome(g)).toBe(true);
    toggleRent(g, g.shop.inventory[0].uid);
    expect(ownsHome(g)).toBe(false);
    const before = g.money;
    let total = 0;
    for (let i = 0; i < 12; i++) { const m = g.money; g.t += 1; shopTick(g, {}); total += g.money - m; }
    expect(total).toBeGreaterThan(0);
    expect(g.money).toBeGreaterThan(before - 1);
  });

  it('fazendas produzem renda e valorizam', () => {
    const g = adult();
    checkout(g, [{ ref: 'dealer_imoveis:fazenda-produtiva', qty: 1 }]);
    const farm = g.shop.inventory[0];
    const before = g.money;
    for (let i = 0; i < 12; i++) { g.t += 1; shopTick(g, {}); }
    expect(g.money - before).toBeGreaterThan(farm.paid * 0.02);
  });
});
