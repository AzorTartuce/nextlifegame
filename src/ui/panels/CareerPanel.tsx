import { ageYears, formatMoney, genderTitle } from '../../sim/core';
import { COURSES, careerById } from '../../sim/data/careers';
import {
  applyForJob, askRaise, baseSalary, canEnroll, dropOut, enroll, incomeTax, jobSalary, jobTitle, quitJob, requirementGaps,
} from '../../sim/systems/career';
import type { CourseId, GameState } from '../../sim/types';
import { useGame } from '../../store';
import { SpecialCareers } from './SpecialPanel';
import { Bar } from '../components/bits';
import { ActionMenu } from '../components/ActionMenu';
import { t } from '../../i18n';

function perfLabel(p: number) {
  if (p >= 80) return ['Brilhante', 'var(--good)'];
  if (p >= 60) return [t('Muito bom'), '#8bd17c'];
  if (p >= 40) return ['Ok', 'var(--warn)'];
  if (p >= 20) return ['Preocupante', '#ff9f43'];
  return [t('Na corda bamba'), 'var(--bad)'];
}

function JobCard({ g }: { g: GameState }) {
  const { run } = useGame();
  if (g.flags.aposentado) {
    return (
      <div className="card">
        <div className="job-hero">
          <div className="ic">🏖️</div>
          <div className="grow">
            <div className="hud-name">{t('Aposentad{g}', { g: g.player.gender === 'f' ? 'a' : 'o' })}</div>
            <div className="small muted">{t('Pensão de')} {formatMoney(Number(g.flags.pensao ?? 0))}{t('/mês')}</div>
          </div>
        </div>
      </div>
    );
  }
  const job = g.job;
  if (!job) {
    return (
      <div className="card empty">
        <span className="e">🧑‍💼</span>
        {ageYears(g) < 16 ? t('Você ainda é jovem demais para trabalhar. Foque nos estudos!') : t('Sem emprego no momento. Confira as vagas abaixo.')}
      </div>
    );
  }
  const c = careerById(job.careerId);
  const gross = jobSalary(job);
  const [label, color] = perfLabel(job.performance);
  const next = c.levels[job.level + 1];
  return (
    <div className="card">
      <div className="job-hero">
        <div className="ic">{c.icon}</div>
        <div className="grow">
          <div className="hud-name">{jobTitle(g)}</div>
          <div className="small muted">{t(c.name)} · {c.hours}{t('h/semana ·')} {Math.floor(job.monthsInRole / 12) > 0 ? `${Math.floor(job.monthsInRole / 12)}a ` : ''}{job.monthsInRole % 12}{t('m no cargo')}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 900 }}>{formatMoney(gross - incomeTax(gross))}</div>
          <div className="small faint">{t('líquido/mês')}</div>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <div className="stat-label"><span>{t('Desempenho')}</span><b style={{ color }}>{label}</b></div>
        <Bar value={job.performance} color={color} />
        <div className="small faint" style={{ marginTop: 6 }}>
          {next ? t('Próximo cargo: {title} ({salary}). Desempenho alto + tempo no cargo = promoção.', { title: genderTitle(t(next.title), g.player.gender), salary: formatMoney(baseSalary(job.careerId, job.level + 1)) }) : t('Você chegou ao topo desta carreira. 👑')}
          {' '}{t('Hora extra na Rotina acelera o desempenho.')}
        </div>
      </div>
      <div className="btn-row" style={{ marginTop: 12 }}>
        <button className="btn sm" onClick={() => run(askRaise)}>{t('💸 Pedir aumento')}</button>
        <button className="btn sm danger" onClick={() => confirm('Pedir demissão?') && run(quitJob)}>{t('🚪 Pedir demissão')}</button>
      </div>
    </div>
  );
}

function Education({ g }: { g: GameState }) {
  const { run } = useGame();
  const ed = g.education;
  const age = ageYears(g);
  const e = ed.enrolled;
  const canAny = (Object.keys(COURSES) as CourseId[]).some((k) => !canEnroll(g, k));
  return (
    <div className="card">
      <h3>{t('🎓 Educação')} <span className="sub">{ed.degrees.length ? ed.degrees.map((d) => COURSES[d].icon).join(' ') : { nenhum: t('Sem escolaridade'), fundamental: t('Fundamental'), medio: t('Ensino médio'), superior: t('Superior') }[ed.level]}</span></h3>
      {ed.inSchool && (
        <>
          <div className="stat-label"><span>{t('Boletim escolar')}</span><b>{Math.round(ed.schoolPerf)}</b></div>
          <Bar value={ed.schoolPerf} color="var(--accent)" />
          <p className="small faint" style={{ margin: '6px 0 0' }}>{t('Estudar mais horas na Rotina melhora suas notas.')}</p>
        </>
      )}
      {e && (
        <>
          <div className="row" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 24 }}>{COURSES[e.course].icon}</span>
            <div className="grow">
              <b>{t(COURSES[e.course].name)}</b>
              <div className="small muted">{t('Faltam')} {Math.ceil(e.monthsLeft / 12)}  {t('ano(s) ·')} {e.monthly ? t('{v}/mês', { v: formatMoney(e.monthly) }) : t('Bolsa integral')}</div>
            </div>
            <button className="btn sm danger" onClick={() => confirm('Trancar a faculdade?') && run(dropOut)}>{t('Trancar')}</button>
          </div>
          <div className="stat-label"><span>{t('Desempenho acadêmico')}</span><b>{Math.round(e.performance)}</b></div>
          <Bar value={e.performance} color={e.performance < 25 ? 'var(--bad)' : 'var(--accent)'} />
          <div className="stat-label" style={{ marginTop: 8 }}><span>{t('Progresso')}</span></div>
          <Bar value={100 - (e.monthsLeft / COURSES[e.course].months) * 100} color="var(--gold)" />
        </>
      )}
      {!e && !ed.inSchool && age >= 17 && canAny && (
        <>
          <p className="small muted" style={{ marginTop: 0 }}>{t('Escolha um curso. A chance no vestibular depende da sua inteligência (')}{Math.round(g.player.stats.inteligencia)}{t('). Acima de 75: bolsa integral.')}</p>
          <div className="grid2">
            {(Object.keys(COURSES) as CourseId[]).map((k) => {
              const c = COURSES[k];
              const err = canEnroll(g, k);
              const chance = Math.max(5, Math.min(97, Math.round((0.25 + (g.player.stats.inteligencia - c.minInt) / 40) * 100)));
              return (
                <button key={k} className="pick" disabled={!!err} onClick={() => run(enroll, k)}>
                  <span className="e">{c.icon}</span>
                  <b>{t(c.name)}</b>
                  <span className="small muted">{err ?? t('{v} anos · {chance}% de chance', { v: c.months / 12, chance })}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
      {!e && !ed.inSchool && age < 17 && <p className="small muted">{t('A escola começa aos 6 anos.')}</p>}
      {(ed.inSchool || age >= 22) && (
        <div style={{ marginTop: 12 }}>
          <div className="group-title" style={{ marginTop: 0 }}>{ed.inSchool ? t('Vida escolar') : t('Estudos avançados')}</div>
          <ActionMenu g={g} group="escola" />
        </div>
      )}
    </div>
  );
}

function Offers({ g }: { g: GameState }) {
  const { run } = useGame();
  if (ageYears(g) < 16) return null;
  return (
    <div className="card">
      <h3>{t('📰 Vagas abertas')} <span className="sub">{t('novas a cada 3 meses')}</span></h3>
      {!g.jobOffers.length && <div className="small muted">{t('Nenhuma vaga agora. Volte em breve.')}</div>}
      {g.jobOffers.map((o, i) => {
        const c = careerById(o.careerId);
        const gaps = requirementGaps(g, c);
        return (
          <div className="offer" key={`${o.careerId}-${i}`}>
            <div className="ic">{c.icon}</div>
            <div className="grow">
              <b>{genderTitle(t(c.levels[o.level].title), g.player.gender)}</b>
              <div className="small muted">{t(c.name)} · {formatMoney(baseSalary(c.id, o.level))} · {c.hours}h</div>
              {gaps.length > 0 && <div className="req">{t('Falta:')} {gaps.join(', ')}</div>}
            </div>
            <button className={`btn sm ${gaps.length ? '' : 'primary'}`} disabled={o.applied} onClick={() => run(applyForJob, i)}>
              {o.applied ? t('Enviado') : t('Candidatar')}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function CareerPanel({ g }: { g: GameState }) {
  return (
    <>
      <JobCard g={g} />
      <Education g={g} />
      <Offers g={g} />
      <SpecialCareers g={g} />
    </>
  );
}
