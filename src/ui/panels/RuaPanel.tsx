import { t, tp } from '../../i18n';
import { GANG_RANKS } from '../../sim/data/crime';
import type { GameState } from '../../sim/types';
import { ActionMenu } from '../components/ActionMenu';
import { Bar } from '../components/bits';

export function RuaPanel({ g }: { g: GameState }) {
  const c = g.life.crime;
  const prison = c.prison;
  const rank = c.gang ? GANG_RANKS[c.gang.rank] : null;
  return (
    <>
      <div className="card">
        <h3>🕶️ {t('Rua')}</h3>
        {prison && (
          <div className="insight bad" style={{ marginBottom: 10 }}>
            <span>⛓️</span>
            <span>{t('Você está preso: faltam {n}.', { n: tp(prison.monthsLeft, '{n} mês', '{n} meses') })} {t('Conduta')}: {Math.round(prison.conduct)}/100.</span>
          </div>
        )}
        {c.fugitive && <div className="insight bad" style={{ marginBottom: 10 }}><span>🚨</span><span>{t('Você é um fugitivo: a polícia está atrás de você.')}</span></div>}
        <div className="stat-label"><span>🚓 {t('Atenção da polícia')}</span><b>{Math.round(c.heat)}</b></div>
        <Bar value={c.heat} color={c.heat >= 60 ? 'var(--bad)' : c.heat >= 25 ? 'var(--warn)' : 'var(--good)'} />
        <div className="kpis" style={{ marginTop: 10 }}>
          <div className="kpi"><div className="v">{c.record}</div><div className="l">⚖️ {t('Condenações')}</div></div>
          <div className="kpi"><div className="v">{c.weapon ? '✅' : '—'}</div><div className="l">🔫 {t('Arma')}</div></div>
          <div className="kpi"><div className="v">{rank ? t(rank.name) : '—'}</div><div className="l">🎩 {t('Máfia')}</div></div>
          <div className="kpi"><div className="v">{g.life.karma}</div><div className="l">☯️ {t('Karma')}</div></div>
        </div>
        {rank && c.gang && <p className="small faint" style={{ margin: '8px 0 0' }}>{t(c.gang.name)} · {t('lealdade')} {Math.round(c.gang.loyalty)} · {t('missões')} {c.mafiaMissions}</p>}
        {c.informant && <p className="small faint" style={{ margin: '4px 0 0' }}>🐀 {t('Você é informante da polícia.')}</p>}
      </div>

      {(prison || c.fugitive) && (
        <div className="card">
          <h3>{prison ? '⛓️' : '🏳️'} {prison ? t('Vida na prisão') : t('Fuga')}</h3>
          <ActionMenu g={g} group="prisao" />
        </div>
      )}

      {!prison && (
        <>
          <div className="card">
            <h3>💣 {t('Crimes')}</h3>
            <p className="small muted" style={{ margin: '0 0 10px' }}>{t('Cada crime atrai a atenção da polícia. Se você for pego, vai a julgamento. A pena depende do país.')}</p>
            <ActionMenu g={g} group="crime" />
          </div>
          <div className="card">
            <h3>🎩 {t('Crime organizado')}</h3>
            <ActionMenu g={g} group="mafia" />
          </div>
        </>
      )}
    </>
  );
}
