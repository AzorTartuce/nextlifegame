import { motion } from 'motion/react';
import { t } from '../../i18n';
import { RIBBONS, lifeScore, ribbonById, tierOf } from '../../sim/systems/ribbons';
import type { GameState } from '../../sim/types';
import { useGame } from '../../store';

/** Pontuação da vida, fita principal e todas as fitas conquistadas. */
export function ScoreBlock({ g }: { g: GameState }) {
  const collection = useGame((s) => s.ribbons);
  const score = lifeScore(g);
  const tier = tierOf(score.total);
  const earned = (g.dead?.ribbons ?? []).map((id) => ribbonById(id)!).filter(Boolean);
  const main = earned[0];
  return (
    <div style={{ textAlign: 'left', marginBottom: 14 }}>
      <motion.div className="score" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', delay: 0.6 }}>
        <div className="small muted" style={{ fontWeight: 800 }}>{t('Pontuação da vida')}</div>
        <div className="score-n">{score.total}</div>
        <div style={{ fontWeight: 900 }}>{t(tier.name)}</div>
      </motion.div>
      {main && (
        <div className="ribbon main">
          <span className="ribbon-ic">{main.icon}</span>
          <div className="grow">
            <b>{t(main.name)}</b>
            {!collection[main.id] || collection[main.id] === 1 ? <span className="chip good" style={{ marginLeft: 6 }}>{t('nova!')}</span> : null}
            <div className="small muted">{t(main.desc)}</div>
          </div>
        </div>
      )}
      {earned.length > 1 && (
        <div className="ribbon-grid">
          {earned.slice(1).map((r) => (
            <span key={r.id} className="ribbon-chip" title={t(r.desc)}>{r.icon} {t(r.name)}</span>
          ))}
        </div>
      )}
      <div className="group-title">{t('Como a pontuação foi feita')}</div>
      {score.parts.map((p) => (
        <div key={p.label} className="move-row"><span>{t(p.label)}</span><b className={p.pts < 0 ? 'bad' : ''}>{p.pts >= 0 ? '+' : ''}{p.pts}</b></div>
      ))}
    </div>
  );
}

/** Coleção de todas as fitas, entre vidas: as conquistadas em cor, as demais apagadas. */
export function RibbonCollection() {
  const collection = useGame((s) => s.ribbons);
  const got = RIBBONS.filter((r) => collection[r.id]).length;
  return (
    <div className="card">
      <h3>🏅 {t('Coleção de fitas')} <span className="sub">{got}/{RIBBONS.length}</span></h3>
      <div className="ribbon-list">
        {RIBBONS.map((r) => (
          <div key={r.id} className={`ribbon ${collection[r.id] ? '' : 'locked'}`}>
            <span className="ribbon-ic">{collection[r.id] ? r.icon : '🔒'}</span>
            <div className="grow">
              <b>{t(r.name)}</b>{collection[r.id] > 1 && <span className="chip" style={{ marginLeft: 6 }}>×{collection[r.id]}</span>}
              <div className="small muted">{t(r.desc)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
