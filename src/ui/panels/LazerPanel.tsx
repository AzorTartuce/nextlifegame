import { t } from '../../i18n';
import type { GameState } from '../../sim/types';
import { ActionMenu } from '../components/ActionMenu';

export function LazerPanel({ g }: { g: GameState }) {
  return (
    <div className="card">
      <h3>🎭 {t('Lazer')}</h3>
      <p className="small muted" style={{ margin: '0 0 10px' }}>{t('Cada programa pode ser repetido uma vez por mês.')}</p>
      <ActionMenu g={g} group="lazer" />
    </div>
  );
}
