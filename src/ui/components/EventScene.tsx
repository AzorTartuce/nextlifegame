import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { GameState } from '../../sim/types';
import { useGame } from '../../store';
import { DeltaChips } from './bits';
import { retranslate, t } from '../../i18n';

const PARTICLES: Record<string, string[]> = {
  casa: ['🏠', '🧸', '☕'],
  escola: ['✏️', '📚', '🎒'],
  trabalho: ['💼', '📎', '☕'],
  amor: ['💖', '💕', '✨'],
  perigo: ['⚡', '💢', '❗'],
  festa: ['🎉', '🎈', '✨'],
  saude: ['💊', '🩺', '💚'],
  negocio: ['💰', '📈', '🪙'],
  dinheiro: ['🪙', '💵', '✨'],
  natureza: ['🍃', '🌸', '☀️'],
};

function Typewriter({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = setInterval(() => setN((v) => (v >= text.length ? v : v + 2)), 14);
    return () => clearInterval(id);
  }, [text]);
  const done = n >= text.length;
  return (
    <p className="scene-text" onClick={() => setN(text.length)}>
      {text.slice(0, n)}
      {!done && <span style={{ opacity: 0 }}>{text.slice(n)}</span>}
    </p>
  );
}

function Art({ scene, icon }: { scene: string; icon: string }) {
  const parts = PARTICLES[scene] ?? PARTICLES.casa;
  return (
    <div className={`scene-art scene-${scene}`}>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className="particle" style={{ left: `${8 + i * 10}%`, animationDelay: `${(i * 0.45) % 4}s` }}>
          {parts[i % parts.length]}
        </span>
      ))}
      <motion.div
        className="big"
        initial={{ scale: 0.2, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 12 }}
      >
        {icon}
      </motion.div>
    </div>
  );
}

export function EventScene({ g }: { g: GameState }) {
  const { choose, dismissResult } = useGame();
  const p = g.pending;
  const r = g.lastResult;
  const open = !!p || !!r;

  useEffect(() => {
    if (!r) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        e.stopImmediatePropagation();
        dismissResult();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [r, dismissResult]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="event-overlay" className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
          <AnimatePresence mode="wait">
            {p ? (
              <motion.div
                key={`p-${p.storyletId}-${g.t}`}
                className="scene"
                initial={{ y: 60, scale: 0.9, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ rotateY: 90, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              >
                <Art scene={p.scene} icon={p.icon} />
                <div className="scene-body">
                  <h2 className="scene-title">{retranslate(p.title)}</h2>
                  <Typewriter text={retranslate(p.text)} />
                  <div className="choices">
                    {p.choices.map((c, i) => (
                      <motion.button
                        key={c.index}
                        className="choice"
                        initial={{ opacity: 0, x: -14 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + i * 0.07 }}
                        onClick={() => choose(c.index)}
                      >
                        <span>{retranslate(c.label)}</span>
                        {c.hint && <span className="hint">{retranslate(c.hint)}</span>}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : r ? (
              <motion.div
                key="result"
                className="scene"
                initial={{ rotateY: -90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              >
                <Art scene={r.scene} icon={r.icon} />
                <div className="scene-body">
                  <h2 className="scene-title">{retranslate(r.title)}</h2>
                  <Typewriter text={retranslate(r.text)} />
                  <div className="deltas">
                    <DeltaChips deltas={r.deltas} />
                  </div>
                  <div className="choices">
                    <button className="btn primary block" onClick={dismissResult}>
                      
                      {t('Continuar')}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Toast() {
  const toast = useGame((s) => s.toast);
  const [visible, setVisible] = useState<typeof toast>(null);
  useEffect(() => {
    if (!toast) return;
    setVisible(toast);
    const id = setTimeout(() => setVisible(null), 2800);
    return () => clearTimeout(id);
  }, [toast]);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={visible.n}
          className="toast"
          initial={{ opacity: 0, y: 20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 10, x: '-50%' }}
        >
          {visible.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
