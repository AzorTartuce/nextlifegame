import { t } from '../../i18n';
import { formatMoney } from '../../sim/core';
import { ARTS, BELTS, SUBSTANCES, conditionById } from '../../sim/data/health';
import { DOCTORS, GYM_FEE, DOJO_FEE, knownConditions, treatCondition, type DoctorKind } from '../../sim/systems/health';
import type { Condition, GameState } from '../../sim/types';
import { useGame } from '../../store';
import { Bar } from '../components/bits';
import { ActionMenu } from '../components/ActionMenu';

function ConditionRow({ g, c }: { g: GameState; c: Condition }) {
  const run = useGame((s) => s.run);
  const def = conditionById(c.id);
  const color = c.severity >= 70 ? 'var(--bad)' : c.severity >= 40 ? 'var(--warn)' : 'var(--good)';
  return (
    <div className="item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div className="row">
        <span style={{ fontSize: 24 }}>{def.icon}</span>
        <div className="grow">
          <b>{t(def.name)}</b> {def.chronic ? <span className="chip">{t('crônica')}</span> : <span className="chip">{t('aguda')}</span>}
          {c.treated && <span className="chip good" style={{ marginLeft: 4 }}>{t('em tratamento')}</span>}
          <div className="small muted">{t(def.desc)}</div>
        </div>
      </div>
      <div className="stat-label" style={{ marginTop: 6 }}><span>{t('Gravidade')}</span><b>{Math.round(c.severity)}</b></div>
      <Bar value={c.severity} color={color} />
      {c.treated ? (
        <div className="small faint" style={{ marginTop: 6 }}>{def.upkeep > 0 ? t('Remédios: {v} por mês.', { v: formatMoney(def.upkeep) }) : t('Em recuperação.')}</div>
      ) : (
        <div className="btn-row" style={{ marginTop: 8 }}>
          {(Object.keys(DOCTORS) as DoctorKind[]).map((k) => {
            const d = DOCTORS[k];
            const cost = Math.max(30, Math.round(def.cost * d.mult));
            return (
              <button key={k} className="btn sm" disabled={g.money < cost} title={t(d.note)} onClick={() => run(treatCondition, c.id, k)}>
                {d.icon} {t(d.label)} · {formatMoney(cost, true)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function HealthPanel({ g }: { g: GameState }) {
  const h = g.life.health;
  const known = knownConditions(g);
  const addictions = SUBSTANCES.filter((s) => (h.addictions[s.id] ?? 0) > 0);
  const art = h.martial ? ARTS.find((a) => a.id === h.martial!.art) : null;
  return (
    <>
      <div className="card">
        <h3>🏥 {t('Saúde e bem-estar')}</h3>
        <div className="kpis">
          <div className="kpi"><div className="v">{Math.round(g.player.stats.saude)}</div><div className="l">❤️ {t('Saúde')}</div></div>
          <div className="kpi"><div className="v">{known.length}</div><div className="l">🤒 {t('Doenças')}</div></div>
          <div className="kpi"><div className="v">{h.gym ? '✅' : '—'}</div><div className="l">🏋️ {t('Academia')}</div></div>
          <div className="kpi"><div className="v">{art ? t(BELTS[Math.floor(h.martial!.belt)]) : '—'}</div><div className="l">🥋 {art ? t(art.name) : t('Dojô')}</div></div>
        </div>
        {(h.gym || h.martial) && <p className="small faint" style={{ margin: '8px 0 0' }}>{t('Mensalidades:')} {h.gym ? `${t('academia')} ${formatMoney(GYM_FEE)}` : ''}{h.gym && h.martial ? ' · ' : ''}{h.martial ? `${t('dojô')} ${formatMoney(DOJO_FEE)}` : ''}</p>}
        {h.rehabLeft > 0 && <div className="insight" style={{ marginTop: 10 }}><span>🏥</span><span>{t('Em reabilitação: faltam {n} meses.', { n: h.rehabLeft })}</span></div>}
      </div>

      <div className="card">
        <h3>🤒 {t('Doenças e tratamentos')}</h3>
        {!known.length && <div className="small muted">{t('Nenhuma doença diagnosticada. Doenças crônicas podem aparecer sem sintomas: faça check-ups.')}</div>}
        {known.map((c) => <ConditionRow key={c.id} g={g} c={c} />)}
      </div>

      <div className="card">
        <h3>🩺 {t('Cuidados')}</h3>
        <ActionMenu g={g} group="saude" />
      </div>

      <div className="card">
        <h3>💆 {t('Beleza')}</h3>
        <ActionMenu g={g} group="beleza" />
      </div>

      <div className="card">
        <h3>💉 {t('Cirurgia plástica')}</h3>
        <ActionMenu g={g} group="cirurgia" />
      </div>

      <div className="card">
        <h3>🚬 {t('Vícios')}</h3>
        {addictions.map((s) => (
          <div key={s.id} style={{ marginBottom: 8 }}>
            <div className="stat-label"><span>{s.icon} {t(s.name)}</span><b>{Math.round(h.addictions[s.id])}</b></div>
            <Bar value={h.addictions[s.id]} color={h.addictions[s.id] >= 60 ? 'var(--bad)' : 'var(--warn)'} />
          </div>
        ))}
        {!addictions.length && <div className="small muted" style={{ marginBottom: 8 }}>{t('Você não tem vícios. Parabéns.')}</div>}
        <ActionMenu g={g} group="vicios" />
      </div>
    </>
  );
}
