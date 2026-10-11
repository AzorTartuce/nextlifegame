import { t } from '../../i18n';
import { formatMoney } from '../../sim/core';
import { actionStatus, listActions, runAction, type ActionDef, type ActionGroup } from '../../sim/systems/actions';
import type { GameState } from '../../sim/types';
import { useGame } from '../../store';

const RISK: Record<NonNullable<ActionDef['risk']>, { label: string; cls: string }> = {
  baixo: { label: 'Risco baixo', cls: 'good' },
  medio: { label: 'Risco médio', cls: '' },
  alto: { label: 'Risco alto', cls: 'bad' },
};

/** Lista de ações de um grupo, com custo, risco e o motivo de estarem bloqueadas. */
export function ActionMenu({ g, group, empty }: { g: GameState; group: ActionGroup | ActionGroup[]; empty?: string }) {
  const run = useGame((s) => s.run);
  const groups = Array.isArray(group) ? group : [group];
  const actions = groups.flatMap((k) => listActions(k));
  if (!actions.length) return empty ? <div className="small muted">{empty}</div> : null;
  return (
    <div className="actions">
      {actions.map((a) => {
        const st = actionStatus(g, a);
        return (
          <button key={a.id} className="action" disabled={!st.ok} onClick={() => run(runAction, a.id)}>
            <span className="action-ic">{a.icon}</span>
            <span className="grow" style={{ textAlign: 'left' }}>
              <b>{t(a.name)}</b>
              <span className="small muted" style={{ display: 'block' }}>{st.ok || !st.reason ? t(a.desc) : st.reason}</span>
            </span>
            <span className="action-side">
              {st.cost > 0 && <b>{formatMoney(st.cost, true)}</b>}
              {a.risk && <span className={`chip ${RISK[a.risk].cls}`}>{t(RISK[a.risk].label)}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
