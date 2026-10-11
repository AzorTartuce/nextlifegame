import { AnimatePresence, motion } from 'motion/react';
import { genderTitle, localizeMoney } from '../../sim/core';
import { monthName, retranslate, t, tp } from '../../i18n';
import { activeAmbitions } from '../../sim/systems/ambitions';
import type { GameState } from '../../sim/types';
import { Bar, DeltaChips } from './bits';

export function Feed({ g, limit = 60 }: { g: GameState; limit?: number }) {
  const items = g.feed.slice(0, limit);
  let lastAge: number | null = null;
  return (
    <div className="feed">
      <AnimatePresence initial={false}>
        {items.map((f) => {
          const age = Math.floor((f.t - g.player.birth) / 12);
          const sep = age !== lastAge;
          lastAge = age;
          return (
            <motion.div
              key={f.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            >
              {sep && <div className="year-sep">{age >= 0 ? tp(age, '{n} ano', '{n} anos') : t('Antes de você')}</div>}
              <div className={`feed-item ${f.kind}`}>
                <div className="feed-icon">{f.icon}</div>
                <div className="grow">
                  <div className="feed-text">{retranslate(f.text)}</div>
                  <div className="feed-date">
                    <span>{monthName(f.t)} {Math.floor(f.t / 12)}</span>
                    <DeltaChips deltas={f.deltas} />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function Ambitions({ g }: { g: GameState }) {
  const list = activeAmbitions(g);
  if (!list.length) return null;
  return (
    <div className="card">
      <h3>{t('🎯 Ambições')} <span className="sub">{g.ambitionsDone.length}  {t('conquistadas')}</span></h3>
      {list.map((a) => (
        <div className="amb" key={a.id}>
          <div className="e">{a.icon}</div>
          <div className="grow">
            <div className="t">{genderTitle(localizeMoney(t(a.text)), g.player.gender)}</div>
            {a.progress && <Bar value={a.progress(g) * 100} color="var(--gold)" />}
          </div>
        </div>
      ))}
    </div>
  );
}
