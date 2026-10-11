import { ageYears, changeMoney, changeStats, clamp, currentPolicy, currentWorld, formatMoney, genderTitle, hasTrait, pushFeed } from '../core';
import { CAREERS, COURSES, careerById, type CareerDef } from '../data/careers';
import { chance, rnd, rrange, shuffle } from '../rng';
import type { CourseId, Deltas, EduLevel, GameState, Job } from '../types';
import { effectiveAgenda } from './agenda';
import { t } from '../../i18n';
import { sickness } from './health';
import { bonuses, statusScore } from './shop';

const EDU_RANK: Record<EduLevel, number> = { nenhum: 0, fundamental: 1, medio: 2, superior: 3 };

export function requirementGaps(g: GameState, c: CareerDef): string[] {
  const r = c.req;
  const s = g.player.stats;
  const gaps: string[] = [];
  if (r.minAge && ageYears(g) < r.minAge) gaps.push(t('{n}+ anos', { n: r.minAge }));
  if (c.cleanRecord && g.life.crime.record > 0) gaps.push(t('Ficha limpa'));
  if (r.edu && EDU_RANK[g.education.level] < EDU_RANK[r.edu]) gaps.push(r.edu === 'medio' ? t('Ensino médio') : t('Ensino superior'));
  if (r.degree && !g.education.degrees.includes(r.degree)) gaps.push(t('Diploma: {d}', { d: t(COURSES[r.degree].name) }));
  if (r.license && !g.life.licenses[r.license]) gaps.push(t('Licença: {l}', { l: t(({ carro: 'carteira de motorista', aviao: 'brevê de piloto' } as Record<string, string>)[r.license] ?? r.license) }));
  if (r.inteligencia && s.inteligencia < r.inteligencia) gaps.push(t('Inteligência {inteligencia}', { inteligencia: r.inteligencia }));
  if (r.saude && s.saude < r.saude) gaps.push(t('Saúde {saude}', { saude: r.saude }));
  if (r.aparencia && s.aparencia < r.aparencia) gaps.push(t('Aparência {aparencia}', { aparencia: r.aparencia }));
  if (r.carisma && s.carisma < r.carisma) gaps.push(t('Carisma {carisma}', { carisma: r.carisma }));
  return gaps;
}

export function jobTitle(g: GameState, job: Job = g.job!): string {
  return genderTitle(t(careerById(job.careerId).levels[job.level].title), g.player.gender);
}

/** Imposto de renda progressivo, com as alíquotas do país onde o jogador mora. */
export function incomeTax(gross: number): number {
  const [l0, h0] = currentWorld().country.tax;
  const shift = currentPolicy().tax;
  const low = Math.max(0, l0 + shift);
  const high = Math.max(0, h0 + shift);
  const band1 = Math.max(0, Math.min(gross, 7000) - 2500) * low;
  const band2 = Math.max(0, gross - 7000) * high;
  return Math.round(band1 + band2);
}

export const netSalary = (job: Job) => jobSalary(job) - incomeTax(jobSalary(job));

/** Salário de tabela de um cargo na cidade atual. */
export const baseSalary = (careerId: string, level: number) =>
  Math.round(careerById(careerId).levels[level].salary * currentWorld().city.wage);

export const jobSalary = (job: Job) => {
  const degree = !!careerById(job.careerId).req.degree;
  return Math.round(baseSalary(job.careerId, job.level) * (1 + job.salaryBonus) * (degree ? 1 + 0.1 * currentWorld().posgrad : 1));
};

export function refreshOffers(g: GameState) {
  if (ageYears(g) < 16) {
    g.jobOffers = [];
    return;
  }
  const pool = shuffle(g, [...CAREERS]);
  const ok = pool.filter((c) => requirementGaps(g, c).length === 0);
  const dream = pool.filter((c) => requirementGaps(g, c).length > 0);
  const chosen = [...ok.slice(0, 3), ...dream.slice(0, 1)];
  g.jobOffers = chosen
    .filter((c) => !(g.job && g.job.careerId === c.id))
    .map((c) => {
      const exp = (g.flags[`exp:${c.id}`] as number) ?? 0;
      const level = Math.min(c.levels.length - 2, Math.floor(exp / 48) + (rnd(g) < 0.1 ? 1 : 0));
      return { careerId: c.id, level };
    });
}

export function applyForJob(g: GameState, index: number): string {
  const offer = g.jobOffers[index];
  if (!offer || offer.applied) return t('Vaga indisponível.');
  offer.applied = true;
  const c = careerById(offer.careerId);
  const gaps = requirementGaps(g, c);
  const s = g.player.stats;
  const b = bonuses(g);
  let p = 0.35 - g.life.crime.record * 0.12 + s.inteligencia / 300 + s.carisma / 300 + s.aparencia / 600 + b.look * 0.008 + statusScore(g) * 0.0015 - offer.level * 0.1;
  if (gaps.length) p = 0.03;
  if (chance(g, clamp(p, 0.02, 0.92))) {
    if (g.job) pushFeed(g, '👋', t('Você saiu do emprego de {v}.', { v: jobTitle(g) }), 'info');
    g.job = { careerId: c.id, level: offer.level, performance: 50, monthsInRole: 0, salaryBonus: 0 };
    g.jobOffers.splice(index, 1);
    if (!g.agenda.carreira) g.agenda.carreira = 0;
    const msg = t('Contratad{g}! Agora você é {title} ({name}).', { g: g.player.gender === 'f' ? 'a' : 'o', title: jobTitle(g), name: t(c.name) });
    pushFeed(g, c.icon, msg, 'milestone');
    return msg;
  }
  const msg = gaps.length
    ? t('Recusad{g} para {name}: faltou {gaps}.', { g: g.player.gender === 'f' ? 'a' : 'o', name: t(c.name), gaps: gaps.join(', ') })
    : t('A vaga de {name} ficou com outra pessoa. Continue tentando!', { name: t(c.name) });
  pushFeed(g, '📭', msg, 'bad');
  return msg;
}

export function quitJob(g: GameState): string {
  if (!g.job) return '';
  const msg = t('Você pediu demissão do cargo de {v}.', { v: jobTitle(g) });
  g.job = null;
  g.agenda.carreira = 0;
  pushFeed(g, '🚪', msg, 'info');
  return msg;
}

export function askRaise(g: GameState): string {
  const job = g.job;
  if (!job) return '';
  if ((g.cooldowns['acao:aumento'] ?? -1) > g.t) return t('Você pediu aumento há pouco tempo. Espere alguns meses.');
  g.cooldowns['acao:aumento'] = g.t + 6;
  const p = (job.performance - 40) / 80 + g.player.stats.carisma / 400;
  if (chance(g, clamp(p, 0.05, 0.85))) {
    const bonus = Math.round(rrange(g, 0.05, 0.15) * 100) / 100;
    job.salaryBonus += bonus;
    const msg = t('Aumento aprovado: +{v}%! Novo salário: {v2}.', { v: Math.round(bonus * 100), v2: formatMoney(jobSalary(job)) });
    pushFeed(g, '💸', msg, 'good');
    return msg;
  }
  job.performance = clamp(job.performance - 5);
  const msg = t('Seu chefe riu. Não de um jeito bom. (−desempenho)');
  pushFeed(g, '😬', msg, 'bad');
  return msg;
}

export function careerTick(g: GameState, acc: Deltas) {
  const job = g.job;
  if (!job) return;
  const c = careerById(job.careerId);
  const p = g.player;
  const s = p.stats;
  changeMoney(g, netSalary(job), acc);

  const extra = effectiveAgenda(g).carreira;
  let perf =
    (s.inteligencia - 50) / 50 * 1.2 +
    (s.carisma - 50) / 50 * 0.6 +
    Math.sqrt(extra) * 0.9 +
    (rnd(g) - 0.5) * 3 -
    (s.estresse > 70 ? 2 : 0) -
    (s.saude < 30 ? 1.5 : 0);
  if (hasTrait(p, 'ambicioso')) perf += 0.8;
  if (hasTrait(p, 'preguicoso')) perf -= 0.8;
  perf += Math.min(3, bonuses(g).prod * 0.08) - Math.min(3, sickness(g) * 0.1);
  job.performance = clamp(job.performance + perf);
  job.monthsInRole += 1;
  g.flags[`exp:${c.id}`] = ((g.flags[`exp:${c.id}`] as number) ?? 0) + 1;

  if (job.performance >= 80 && job.monthsInRole >= 18 + job.level * 6 && job.level < c.levels.length - 1) {
    job.level += 1;
    job.performance = 55;
    job.monthsInRole = 0;
    job.salaryBonus = 0;
    g.flags.promovido = true;
    changeStats(g, { felicidade: 8 }, acc);
    pushFeed(g, '🎖️', t('Promoção! Você agora é {v} — salário de {v2}.', { v: jobTitle(g), v2: formatMoney(jobSalary(job)) }), 'milestone');
  } else if (job.performance <= 8 && job.monthsInRole >= 3) {
    pushFeed(g, '📦', t('Você foi demitid{g} do cargo de {title}. Desempenho muito baixo.', { g: p.gender === 'f' ? 'a' : 'o', title: jobTitle(g) }), 'bad');
    changeStats(g, { felicidade: -12, estresse: 10 }, acc);
    g.job = null;
    g.agenda.carreira = 0;
  }
}

// ---------- Educação ----------

export function canEnroll(g: GameState, course: CourseId): string | null {
  if (g.education.enrolled) return t('Você já está matricula{g}.', { g: g.player.gender === 'f' ? 'da' : 'do' });
  if (EDU_RANK[g.education.level] < EDU_RANK.medio) return t('Precisa do ensino médio.');
  if (g.education.degrees.includes(course)) return t('Você já tem esse diploma.');
  if (ageYears(g) < 17) return t('Idade mínima: 17 anos.');
  return null;
}

export function enroll(g: GameState, course: CourseId): string {
  const err = canEnroll(g, course);
  if (err) return err;
  const def = COURSES[course];
  const int = g.player.stats.inteligencia;
  const pass = clamp(0.25 + (int - def.minInt) / 40, 0.05, 0.97);
  if (!chance(g, pass)) {
    const msg = t('Você não passou no vestibular de {name}. Estude mais e tente de novo.', { name: t(def.name) });
    pushFeed(g, '📝', msg, 'bad');
    return msg;
  }
  const scholarship = int >= 75;
  g.education.enrolled = { course, monthsLeft: def.months, performance: 55, monthly: scholarship ? 0 : 900 };
  const msg = scholarship
    ? t('Aprovad{g} em {name} com bolsa integral! 🎓', { g: g.player.gender === 'f' ? 'a' : 'o', name: t(def.name) })
    : t('Aprovad{g} em {name}! Mensalidade: {v}.', { g: g.player.gender === 'f' ? 'a' : 'o', name: t(def.name), v: formatMoney(900) });
  pushFeed(g, def.icon, msg, 'milestone');
  return msg;
}

export function dropOut(g: GameState): string {
  const e = g.education.enrolled;
  if (!e) return '';
  g.education.enrolled = null;
  const msg = t('Você trancou {name}.', { name: t(COURSES[e.course].name) });
  pushFeed(g, '🚪', msg, 'info');
  return msg;
}

export function educationTick(g: GameState, acc: Deltas) {
  const age = ageYears(g);
  const ed = g.education;
  if (!ed.inSchool && age >= 6 && age < 18 && ed.level !== 'medio' && !g.flags.evadiu) {
    ed.inSchool = true;
    pushFeed(g, '🎒', t('Primeiro dia de aula! Você chorou na porta da escola.'), 'milestone');
  }
  if (ed.inSchool) {
    const study = effectiveAgenda(g).estudo;
    ed.schoolPerf = clamp(ed.schoolPerf + (g.player.stats.inteligencia - 50) / 60 + Math.sqrt(study) * 0.4 - 0.6 + (rnd(g) - 0.5) * 2);
    if (age >= 14 && ed.level === 'nenhum') ed.level = 'fundamental';
    if (age >= 18) {
      ed.inSchool = false;
      ed.level = 'medio';
      g.flags.formou_medio = true;
      pushFeed(g, '🎓', t('Você concluiu o ensino médio! O mundo adulto te espera.'), 'milestone');
    }
  }
  const e = ed.enrolled;
  if (e) {
    if (e.monthly) changeMoney(g, -e.monthly, acc);
    const study = effectiveAgenda(g).estudo;
    e.performance = clamp(
      e.performance + (Math.sqrt(study) - 2.2) * 0.9 + (g.player.stats.inteligencia - 55) / 50 - (g.player.stats.estresse > 75 ? 1.5 : 0) + (rnd(g) - 0.5) * 2,
    );
    e.monthsLeft -= 1;
    if (e.performance <= 5) {
      pushFeed(g, '📉', t('Você foi jubilad{g} de {name}. Faltou estudar.', { g: g.player.gender === 'f' ? 'a' : 'o', name: t(COURSES[e.course].name) }), 'bad');
      changeStats(g, { felicidade: -10 }, acc);
      ed.enrolled = null;
    } else if (e.monthsLeft <= 0) {
      ed.degrees.push(e.course);
      ed.level = 'superior';
      ed.enrolled = null;
      changeStats(g, { felicidade: 10, inteligencia: 3 }, acc);
      pushFeed(g, '🎓', t('Formatura! Você é bacharel em {name}.', { name: t(COURSES[e.course].name) }), 'milestone');
    }
  }
}
