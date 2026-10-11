import {
  addMemory, ageYears, changeMoney, changeRelation, changeStats, clamp, createNpc, currentPolicy, currentWorld, formatMoney, fullName,
  gx, livingNpcs, npcsByRole, partnerOf, pushFeed, romanceGender, worldOf,
} from '../core';
import { chance, pick, rint, rrange } from '../rng';
import { bonuses, ownsHome, statusScore } from './shop';
import { healthDeath } from './health';
import { addEn, t } from '../../i18n';
import { bump, fertilityFactor, takeQueuedDeath } from './lifestate';
import type { Deltas, GameState, NPC } from '../types';

export const LIFESTYLES = [
  { name: 'Simples', icon: '🏚️', cost: 1100, happiness: 0 },
  { name: 'Confortável', icon: '🏡', cost: 2600, happiness: 6 },
  { name: 'Luxuoso', icon: '🏰', cost: 7000, happiness: 12 },
];

export const lifestyle = (g: GameState) => (g.flags.estilo as number) ?? 0;

/** Custo mensal do estilo de vida na cidade atual. */
export const lifestyleCost = (i: number) => Math.round(LIFESTYLES[i].cost * currentWorld().city.cost);

/** Probabilidade anual de morte natural (curva de Gompertz simplificada). */
export function annualMortality(age: number, saude: number): number {
  const base = 0.00045 * Math.exp(0.09 * Math.max(0, age - 30));
  const mod = saude < 20 ? 4 : saude < 40 ? 2 : saude > 80 ? 0.6 : 1;
  return Math.min(0.9, base * mod + 0.0002);
}

export function createFamily(g: GameState) {
  const ln = g.player.lastName;
  const fatherAge = rint(g, 22, 42);
  createNpc(g, { role: 'pai', age: [fatherAge, fatherAge], gender: 'm', lastName: ln, relation: rint(g, 55, 85) });
  createNpc(g, { role: 'mae', age: [Math.max(19, fatherAge - 6), fatherAge + 2], gender: 'f', relation: rint(g, 60, 90) });
  const siblings = rint(g, 0, 2);
  for (let i = 0; i < siblings; i++) createNpc(g, { role: 'irmao', age: [1, 9], lastName: ln, relation: rint(g, 40, 75) });
  const roll = rint(g, 0, 99);
  g.flags.familia = roll < 30 ? 'humilde' : roll < 85 ? 'classe média' : 'rica';
}

function playerAgingTick(g: GameState, acc: Deltas) {
  const age = ageYears(g);
  const d = { saude: 0, felicidade: 0, inteligencia: 0, aparencia: 0, carisma: 0, estresse: 0 };

  if (age < 6) {
    const parents = npcsByRole(g, 'pai', 'mae');
    const love = parents.length ? parents.reduce((a, p) => a + p.relation, 0) / parents.length : 30;
    d.inteligencia += 0.25 + (love - 50) / 400;
    d.felicidade += (love - 55) / 200;
  }
  if (age >= 35) d.aparencia -= 0.03 + Math.max(0, age - 55) * 0.003;
  if (age >= 70) d.inteligencia -= 0.05;
  if (g.flags.terapia) changeMoney(g, -400, acc);
  if (g.flags.aposentado) changeMoney(g, Math.round((g.flags.pensao as number) ?? 1500), acc);
  changeStats(g, d, acc);
}

function npcTick(g: GameState, acc: Deltas) {
  for (const n of livingNpcs(g)) {
    const age = ageYears(g, n);
    if (chance(g, (annualMortality(age, n.stats.saude) * worldOf(g).country.life * currentPolicy().mortality) / 12)) {
      n.alive = false;
      n.deathT = g.t;
      onNpcDeath(g, n, acc);
      continue;
    }
    if (n.role === 'filho' && (g.t - n.birth) === 18 * 12) {
      pushFeed(g, '🎂', t('{firstName} fez 18 anos. Como o tempo voa.', { firstName: n.firstName }), 'milestone');
    }
    // Relações ruins com parceiro terminam.
    if ((n.role === 'parceiro' || n.role === 'conjuge') && n.relation < 12 && chance(g, 0.15)) {
      const was = n.role;
      n.role = 'ex';
      addMemory(n, g.t, 'termino', was === 'conjuge' ? t('Nosso divórcio') : t('Nosso término'), 3);
      if (was === 'conjuge') {
        const cut = Math.round(Math.max(0, g.money) * 0.4);
        changeMoney(g, -cut, acc);
        pushFeed(g, '💔', t('{firstName} pediu o divórcio e levou {v} na partilha.', { firstName: n.firstName, v: formatMoney(cut) }), 'bad', { dinheiro: -cut });
      } else {
        pushFeed(g, '💔', t('{firstName} terminou com você.', { firstName: n.firstName }), 'bad');
      }
      changeStats(g, { felicidade: -15, estresse: 8 }, acc);
    }
  }
}

function onNpcDeath(g: GameState, n: NPC, acc: Deltas) {
  const age = ageYears(g, n);
  const close = ['pai', 'mae', 'irmao', 'conjuge', 'filho', 'parceiro'].includes(n.role);
  if (!close && n.relation < 60) return;
  const grief = Math.round(5 + n.relation / 5 + (n.role === 'filho' ? 20 : 0));
  changeStats(g, { felicidade: -grief, estresse: grief / 2 }, acc);
  const label: Record<string, string> = { pai: t('Seu pai'), mae: t('Sua mãe'), irmao: gx(n, t('Seu irmão'), t('Sua irmã')), conjuge: gx(n, t('Seu marido'), t('Sua esposa')), filho: gx(n, t('Seu filho'), t('Sua filha')), parceiro: gx(n, t('Seu namorado'), t('Sua namorada')), amigo: gx(n, t('Seu amigo'), t('Sua amiga')) };
  let text = t('{v} {firstName} faleceu aos {age} anos.', { v: label[n.role] ?? '', firstName: n.firstName, age }).trim();
  if (n.role === 'pai' || n.role === 'mae' || n.role === 'conjuge') {
    const fam = g.flags.familia;
    const base = fam === 'rica' ? 400000 : fam === 'humilde' ? 5000 : 40000;
    const heirs = Math.max(1, npcsByRole(g, 'irmao').length + 1);
    const inheritance = Math.round((base * rrange(g, 0.3, 1.5)) / heirs);
    changeMoney(g, inheritance, acc);
    text += t(' Você herdou {v}.', { v: formatMoney(inheritance) });
  }
  pushFeed(g, '🕯️', text, 'bad');
}

export function lifeTick(g: GameState, acc: Deltas) {
  playerAgingTick(g, acc);
  npcTick(g, acc);

  const age = ageYears(g);
  if (age >= 18 && !g.livesWithParents && !g.life.crime.prison) {
    const kids = npcsByRole(g, 'filho').filter((k) => ageYears(g, k) < 18).length;
    const partner = partnerOf(g);
    const shared = partner?.role === 'conjuge' ? 0.7 : 1;
    changeMoney(g, -Math.round((lifestyleCost(lifestyle(g)) * (ownsHome(g) ? 0.55 : 1) + kids * 600 * currentWorld().city.cost) * shared), acc);
  }
  if (g.money < -5000 && chance(g, 0.05)) {
    changeStats(g, { estresse: 6, felicidade: -4 }, acc);
    pushFeed(g, '📞', t('O banco ligou de novo cobrando sua dívida de {v}.', { v: formatMoney(-g.money) }), 'bad');
  }
}

/** Nasce um filho do jogador. */
export function haveChild(g: GameState): NPC {
  const baby = createNpc(g, { role: 'filho', age: [0, 0], lastName: g.player.lastName, relation: 80 });
  baby.birth = g.t;
  bump(g, 'kids');
  g.flags.teve_filho = true;
  changeStats(g, { felicidade: 12, estresse: 8 });
  pushFeed(g, '👶', t('Nasceu {n}! {e}', { n: baby.firstName, e: baby.gender === 'f' ? '👧' : '👦' }), 'milestone');
  return baby;
}

addEn({ 'Nasceu {n}! {e}': '{n} was born! {e}' });

export function checkDeath(g: GameState): { cause: string; key?: string } | null {
  const p = g.player;
  const age = ageYears(g);
  if (p.stats.saude <= 0) return { cause: t('complicações de saúde') };
  const queued = takeQueuedDeath(g);
  if (queued) return queued;
  const hd = healthDeath(g);
  if (hd) return hd;
  if (chance(g, (annualMortality(age, p.stats.saude) * worldOf(g).country.life * currentPolicy().mortality) / 12)) {
    return { cause: age > 75 ? pick(g, [t('causas naturais'), t('dormindo, em paz'), t('um infarto fulminante')]) : pick(g, [t('um acidente de trânsito'), t('um AVC repentino'), t('uma doença rara')]) };
  }
  return null;
}

// ---------- Interações sociais ----------

export type InteractionKind =
  | 'conversar' | 'passeio' | 'presente' | 'pedir_dinheiro' | 'convidar_sair'
  | 'pedir_casamento' | 'ter_filho' | 'terminar';

export function interactionOptions(g: GameState, n: NPC): { kind: InteractionKind; label: string; icon: string; cost?: number }[] {
  const age = ageYears(g);
  const nAge = ageYears(g, n);
  const out: { kind: InteractionKind; label: string; icon: string; cost?: number }[] = [
    { kind: 'conversar', label: 'Conversar', icon: '💬' },
  ];
  if (age >= 14) out.push({ kind: 'passeio', label: t('Sair junto'), icon: '🍦', cost: 80 });
  if (age >= 12) out.push({ kind: 'presente', label: 'Presentear', icon: '🎁', cost: 250 });
  if ((n.role === 'pai' || n.role === 'mae') && age >= 10) out.push({ kind: 'pedir_dinheiro', label: t('Pedir dinheiro'), icon: '🪙' });
  const single = !partnerOf(g);
  const attracted = g.attraction === 'ambos' || g.attraction === n.gender;
  if (single && attracted && age >= 14 && Math.abs(age - nAge) <= 12 && nAge >= 14 && ['amigo', 'conhecido', 'colega', 'ex'].includes(n.role)) {
    out.push({ kind: 'convidar_sair', label: t('Chamar para sair'), icon: '💘' });
  }
  if (n.role === 'parceiro' && age >= 18) out.push({ kind: 'pedir_casamento', label: t('Pedir em casamento'), icon: '💍', cost: 3000 });
  if (n.role === 'conjuge' && age >= 18 && age <= 50) out.push({ kind: 'ter_filho', label: t('Ter um filho'), icon: '👶' });
  if (n.role === 'parceiro' || n.role === 'conjuge') out.push({ kind: 'terminar', label: n.role === 'conjuge' ? 'Divorciar' : 'Terminar', icon: '💔' });
  return out;
}

export function interact(g: GameState, npcId: string, kind: InteractionKind): string {
  const n = g.npcs[npcId];
  if (!n || !n.alive) return '';
  if (g.interactionsLeft <= 0) return t('Sem energia social este mês. Avance o tempo.');
  const opt = interactionOptions(g, n).find((o) => o.kind === kind);
  if (!opt) return '';
  if (opt.cost && g.money < opt.cost) return t('Você precisa de {v}.', { v: formatMoney(opt.cost) });
  g.interactionsLeft -= 1;
  if (opt.cost) g.money -= opt.cost;
  const s = g.player.stats;
  const nm = n.firstName;
  let msg = '';

  switch (kind) {
    case 'conversar': {
      const good = chance(g, 0.55 + s.carisma / 300);
      changeRelation(g, n, good ? rint(g, 2, 6) : -rint(g, 1, 4));
      msg = good
        ? pick(g, [`Vocês conversaram por horas sobre a vida. ${nm} riu muito.`, `${nm} desabafou com você. Laço fortalecido.`, `Papo leve e gostoso com ${nm}.`])
        : pick(g, [`A conversa com ${nm} virou discussão sobre política.`, `${nm} estava de mau humor e foi seco com você.`]);
      break;
    }
    case 'passeio':
      changeRelation(g, n, rint(g, 5, 10));
      changeStats(g, { felicidade: 3, estresse: -3 });
      msg = pick(g, [`Você e ${nm} foram ao parque.`, `Cinema com ${nm}. O filme era ruim, a companhia não.`, `Vocês dividiram uma pizza e muitas risadas.`]);
      if (chance(g, 0.3)) addMemory(n, g.t, 'passeio', 'Aquele passeio divertido', 1);
      break;
    case 'presente':
      changeRelation(g, n, rint(g, 8, 14));
      msg = `${nm} amou o presente!`;
      addMemory(n, g.t, 'presente', 'Ganhou um presente seu', 1);
      break;
    case 'pedir_dinheiro': {
      const fam = g.flags.familia;
      const ok = chance(g, n.relation / 120);
      if (ok) {
        const v = fam === 'rica' ? rint(g, 500, 5000) : fam === 'humilde' ? rint(g, 20, 150) : rint(g, 100, 800);
        g.money += v;
        changeRelation(g, n, -3);
        msg = `${nm} te deu ${formatMoney(v)}. "Não gaste com bobagem."`;
      } else {
        changeRelation(g, n, -5);
        msg = `${nm}: "Dinheiro não dá em árvore!"`;
      }
      break;
    }
    case 'convidar_sair': {
      const p = 0.15 + n.relation / 200 + (s.aparencia - 50) / 200 + (s.carisma - 50) / 250 + bonuses(g).look * 0.006 + statusScore(g) * 0.0015;
      if (chance(g, clamp(p, 0.05, 0.9))) {
        n.role = 'parceiro';
        n.since = g.t;
        changeRelation(g, n, 15);
        changeStats(g, { felicidade: 10 });
        addMemory(n, g.t, 'primeiro_encontro', 'Nosso primeiro encontro', 3);
        msg = `${nm} topou! Vocês estão namorando. 💕`;
      } else {
        changeRelation(g, n, -6);
        changeStats(g, { felicidade: -5 });
        msg = t('{nm} disse que te vê só como amig{g}. Ai.', { nm, g: g.player.gender === 'f' ? 'a' : 'o' });
      }
      break;
    }
    case 'pedir_casamento': {
      const months = g.t - n.since;
      const p = (n.relation - 40) / 50 + (months >= 12 ? 0.2 : -0.3);
      if (chance(g, clamp(p, 0.05, 0.95))) {
        n.role = 'conjuge';
        bump(g, 'marriages');
        n.since = g.t;
        changeRelation(g, n, 10);
        changeStats(g, { felicidade: 15 });
        addMemory(n, g.t, 'casamento', 'Nosso casamento', 5);
        g.flags.casou = true;
        msg = `${nm} disse SIM! 💍 Vocês se casaram numa festa ${pick(g, ['linda', 'caótica', 'no quintal', 'na praia'])}.`;
        pushFeed(g, '💒', `Você se casou com ${fullName(n)}!`, 'milestone');
      } else {
        changeRelation(g, n, -10);
        changeStats(g, { felicidade: -10 });
        msg = `${nm} disse que "ainda não é o momento". O anel voltou pra caixinha.`;
      }
      break;
    }
    case 'ter_filho': {
      const ok = n.relation >= 50 && chance(g, clamp(0.6 * fertilityFactor(g), 0.03, 0.85));
      if (ok) {
        const baby = haveChild(g);
        msg = t('Nasceu {name}! {e} Bem-vind{g} à família.', { name: baby.firstName, e: baby.gender === 'f' ? '👧' : '👦', g: baby.gender === 'f' ? 'a' : 'o' });
      } else {
        msg = n.relation < 50 ? `${nm} acha que a relação não está boa para isso agora.` : 'Ainda não foi dessa vez. Continuem tentando.';
      }
      break;
    }
    case 'terminar': {
      const was = n.role;
      if (was === 'conjuge') bump(g, 'divorces');
      n.role = 'ex';
      changeRelation(g, n, -30);
      addMemory(n, g.t, 'termino', was === 'conjuge' ? 'O divórcio' : 'O término', 4);
      if (was === 'conjuge') {
        const cut = Math.round(Math.max(0, g.money) * 0.4);
        g.money -= cut;
        msg = `Divórcio assinado. ${nm} ficou com ${formatMoney(cut)}.`;
      } else msg = `Você terminou com ${nm}.`;
      changeStats(g, { felicidade: -8 });
      break;
    }
  }
  pushFeed(g, opt.icon, msg, 'info');
  return msg;
}

/** Um conhecido aleatório que pode virar amigo/romance. */
export function meetSomeone(g: GameState, romance: boolean): NPC {
  const age = ageYears(g);
  return createNpc(g, {
    role: 'conhecido',
    age: [Math.max(age > 17 ? 18 : age - 1, age - 5), age + 5],
    gender: romance ? romanceGender(g) : undefined,
    relation: rint(g, 30, 50),
  });
}
