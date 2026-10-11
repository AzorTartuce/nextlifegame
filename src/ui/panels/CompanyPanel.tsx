import { useMemo, useState } from 'react';
import { ageYears, companyValuation, currentWorld, formatMoney } from '../../sim/core';
import { SECTORS } from '../../sim/data/sectors';
import {
  advisorInsights, branchCost, canFound, forecast, foundCompany, investQuality, MANAGER_COST, openBranch, qualityCost,
  sellCompany, setCompany, suggestCompanyName, transferToCompany, withdrawFromCompany,
} from '../../sim/systems/company';
import type { Company, GameState, SectorId } from '../../sim/types';
import { useGame } from '../../store';
import { useCountUp } from '../hooks';
import { Bar, Sparkline } from '../components/bits';
import { fmtNum, t } from '../../i18n';

function Founder({ g }: { g: GameState }) {
  const { run } = useGame();
  const [sector, setSector] = useState<SectorId>('cafe');
  const [name, setName] = useState('');
  if (ageYears(g) < 18) {
    return (
      <div className="card empty">
        <span className="e">🍋</span>
        
        {t('Aos 18 anos você poderá abrir sua própria empresa. Por enquanto... que tal uma barraquinha de limonada imaginária?')}
      </div>
    );
  }
  const err = canFound(g, sector);
  return (
    <div className="card">
      <h3>{t('🏁 Abrir uma empresa')} <span className="sub">{t('Você tem')} {formatMoney(g.money)}</span></h3>
      <div className="grid2">
        {(Object.keys(SECTORS) as SectorId[]).map((id) => {
          const s = SECTORS[id];
          return (
            <button key={id} className={`pick ${sector === id ? 'on' : ''}`} onClick={() => setSector(id)}>
              <span className="e">{s.icon}</span>
              <b>{t(s.name)}</b>
              <span className={`small ${g.money >= s.startCost ? 'good' : 'bad'}`} style={{ fontWeight: 800 }}>{formatMoney(s.startCost)}</span>
              <span className="small muted">{t(s.pitch)}</span>
            </button>
          );
        })}
      </div>
      <div className="field" style={{ marginTop: 12 }}>
        <label>{t('Nome da empresa')}</label>
        <div className="row">
          <input className="input" value={name} placeholder={t('Ex.: {name} da Esquina', { name: t(SECTORS[sector].name) })} onChange={(e) => setName(e.target.value)} maxLength={28} />
          <button className="btn" onClick={() => run((st) => { setName(suggestCompanyName(st, sector)); })} aria-label={t('Sugerir nome')}>🎲</button>
        </div>
      </div>
      <button className="btn primary block" disabled={!!err} onClick={() => run(foundCompany, sector, name)}>
        {err ?? t('Fundar {name} 🚀', { name: name || t('empresa') })}
      </button>
      {!g.flags.ideia_negocio && g.money < 20000 && <p className="small faint">{t('Dica: junte capital com emprego e bicos, ou peça ajuda à família.')}</p>}
    </div>
  );
}

function Diorama({ c }: { c: Company }) {
  const def = SECTORS[c.sector];
  const m = c.last;
  const load = m ? m.customers / Math.max(1, def.market * c.branches * 0.5) : 0.1;
  const walkers = Math.max(1, Math.min(14, Math.round(load * 12)));
  const queue = m && m.demand > m.capacity ? m.demand - m.capacity : 0;
  const people = ['🚶', '🚶‍♀️', '🧍', '🏃', '🧑‍🦯', '🚶‍♂️'];
  return (
    <div className="diorama">
      <span className="sun">{(c.last?.profit ?? 0) >= 0 ? '☀️' : '🌧️'}</span>
      {Array.from({ length: Math.min(6, c.branches) }, (_, i) => (
        <span key={i} className="bldg" style={{ left: `${8 + i * (84 / Math.min(6, c.branches))}%` }}>{def.building}</span>
      ))}
      {c.branches > 6 && <span className="queue" style={{ right: 8, background: 'rgba(139,123,255,0.9)' }}>+{c.branches - 6}</span>}
      {queue > 0 && <span className="queue" style={{ left: '12%' }}>{t('Fila:')} {queue}</span>}
      {Array.from({ length: walkers }, (_, i) => (
        <span key={i} className="walker" style={{ animationDuration: `${6 + (i % 5) * 1.7}s`, animationDelay: `${-i * 1.3}s` }}>
          {people[i % people.length]}
        </span>
      ))}
    </div>
  );
}

function Kpi({ v, l, cls }: { v: string; l: string; cls?: string }) {
  return (
    <div className="kpi">
      <div className={`v ${cls ?? ''}`}>{v}</div>
      <div className="l">{l}</div>
    </div>
  );
}

function priceLabel(p: number) {
  if (p < 0.8) return 'Popular';
  if (p < 1.1) return 'Justo';
  if (p < 1.4) return 'Premium';
  return 'Luxo';
}

function Manage({ g, c }: { g: GameState; c: Company }) {
  const { run } = useGame();
  const def = SECTORS[c.sector];
  const m = c.last;
  const cash = useCountUp(c.cash);
  const preview = useMemo(() => forecast(g, c), [g, c]);
  const insights = advisorInsights(g);
  const valuation = companyValuation(g);
  const age = g.t - c.founded;

  return (
    <>
      <div className="card">
        <h3>
          {def.icon} {c.name}
          <span className="sub">{age < 12 ? `${age} ${age === 1 ? t('mês') : t('meses')}` : `${Math.floor(age / 12)} ${age < 24 ? t('ano') : t('anos')}`}  {t('· vale')} {formatMoney(valuation, true)}</span>
        </h3>
        <div className="kpis">
          <Kpi v={formatMoney(cash, true)} l="Caixa" cls={c.cash < 0 ? 'bad' : ''} />
          <Kpi v={m ? formatMoney(m.profit, true) : '—'} l="Lucro/mês" cls={m ? (m.profit >= 0 ? 'good' : 'bad') : ''} />
          <Kpi v={m ? fmtNum(m.customers) : '—'} l="Clientes" />
          <Kpi v={`${Math.round(c.reputation)}`} l="Reputação" />
        </div>
        <Diorama c={c} />
        {insights.map((i, k) => (
          <div key={k} className={`insight ${i.tone}`}>
            <span style={{ fontSize: 18 }}>{i.icon}</span>
            <span>{i.text}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>{t('🎛️ Comando')} <span className={`sub ${preview.profit >= 0 ? 'good' : 'bad'}`}>{t('Previsão:')} {formatMoney(preview.profit, true)}{t('/mês')}</span></h3>

        <div className="ctrl">
          <div className="ctrl-head">{t('🏷️ Preço')} <span>{priceLabel(c.price)} · {formatMoney(def.ticket * c.price)}  {t('por cliente')}</span></div>
          <input type="range" min={0.6} max={2} step={0.05} value={c.price} onChange={(e) => run(setCompany, 'price', Number(e.target.value))} disabled={c.manager} />
        </div>

        <div className="ctrl">
          <div className="ctrl-head">{t('📣 Marketing')} <span>{formatMoney(c.marketing)}{t('/mês · alcance')} {Math.round(c.awareness)}%</span></div>
          <input type="range" min={0} max={def.mktScale * 3 * c.branches} step={100} value={c.marketing} onChange={(e) => run(setCompany, 'marketing', Number(e.target.value))} disabled={c.manager} />
        </div>

        <div className="ctrl">
          <div className="ctrl-head">{t('👥 Equipe')} <span>{t('capacidade')} {fmtNum(preview.capacity)}  {t('· demanda')} {fmtNum(preview.demand)}</span></div>
          <div className="row">
            <div className="stepper">
              <button onClick={() => run(setCompany, 'employees', Math.max(1, c.employees - 1))} disabled={c.employees <= 1 || c.manager}>−</button>
              <b>{c.employees}</b>
              <button onClick={() => run(setCompany, 'employees', c.employees + 1)} disabled={c.manager}>+</button>
            </div>
            <span className="small muted grow">{formatMoney(def.salary * currentWorld().city.wage)}  {t('cada · atende')} {def.capPerEmployee}  {t('clientes')}</span>
          </div>
        </div>

        <div className="ctrl">
          <div className="ctrl-head">{t('✨ Qualidade')} <span>{Math.round(c.quality)}/100</span></div>
          <Bar value={c.quality} color="var(--gold)" />
          <button className="btn sm" style={{ marginTop: 8 }} disabled={c.cash < qualityCost(c)} onClick={() => run(investQuality)}>
            
            {t('Investir')} {formatMoney(qualityCost(c), true)}
          </button>
        </div>

        <div className="ctrl">
          <div className="ctrl-head">{def.building} {c.sector === 'app' ? t('Mercados') : t('Filiais')} <span>{c.branches}</span></div>
          <button className="btn sm" disabled={c.cash < branchCost(c)} onClick={() => run(openBranch)}>
            {c.sector === 'app' ? t('Expandir para novo mercado') : t('Abrir filial')} · {formatMoney(branchCost(c), true)}
          </button>
        </div>

        <div className="ctrl">
          <div className="row">
            <div className="grow">
              <div className="ctrl-head" style={{ marginBottom: 0 }}>{t('🧑‍💼 Contratar gerente')}</div>
              <div className="small muted">{t('Ajusta preço, marketing e equipe sozinho ·')} {formatMoney(MANAGER_COST)}{t('/mês')}</div>
            </div>
            <button className={`switch ${c.manager ? 'on' : ''}`} onClick={() => run(setCompany, 'manager', !c.manager)} aria-label={t('Gerente')} />
          </div>
        </div>

        <div className="ctrl">
          <div className="ctrl-head">{t('💼 Pró-labore')} <span>{formatMoney(c.salaryDraw)}{t('/mês para você')}</span></div>
          <input type="range" min={0} max={30000} step={500} value={c.salaryDraw} onChange={(e) => run(setCompany, 'salaryDraw', Number(e.target.value))} />
        </div>
      </div>

      <div className="card">
        <h3>{t('📈 Histórico')} <span className="sub">{t('últimos')} {c.history.length}  {t('meses')}</span></h3>
        <div className="small muted">{t('Lucro mensal')}</div>
        <Sparkline values={c.history.map((h) => h.profit)} color="#3ecf8e" />
        <div className="small muted" style={{ marginTop: 6 }}>{t('Caixa')}</div>
        <Sparkline values={c.history.map((h) => h.cash)} color="#8b7bff" />
      </div>

      <div className="card">
        <h3>{t('🏦 Finanças')}</h3>
        <div className="btn-row">
          <button className="btn sm good" onClick={() => run(transferToCompany, 5000)} disabled={g.money <= 0}>{t('Aportar')} {formatMoney(5000, true)}</button>
          <button className="btn sm good" onClick={() => run(transferToCompany, 25000)} disabled={g.money <= 0}>{t('Aportar')} {formatMoney(25000, true)}</button>
          <button className="btn sm" onClick={() => run(withdrawFromCompany, 5000)} disabled={c.cash <= 0}>{t('Retirar')} {formatMoney(5000, true)}</button>
          <button className="btn sm" onClick={() => run(withdrawFromCompany, 25000)} disabled={c.cash <= 0}>{t('Retirar')} {formatMoney(25000, true)}</button>
        </div>
        <button className="btn sm danger block" style={{ marginTop: 10 }} onClick={() => confirm(`Vender ${c.name} por ${formatMoney(valuation)}?`) && run(sellCompany)}>
          
          {t('Vender empresa por')} {formatMoney(valuation)}
        </button>
      </div>
    </>
  );
}

export function CompanyPanel({ g }: { g: GameState }) {
  return g.company ? <Manage g={g} c={g.company} /> : <Founder g={g} />;
}
