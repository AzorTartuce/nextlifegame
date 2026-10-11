import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { t } from '../../i18n';
import type { GameState } from '../../sim/types';
import { useGame } from '../../store';
import { STEPS } from './steps';

interface Box { x: number; y: number; w: number; h: number }
const PAD = 6;

/**
 * Coach-marks do tutorial. Fica fora da simulação (estado no store/localStorage),
 * não captura cliques fora do cartão e some enquanto houver evento, resultado, minigame ou morte.
 */
export function Tutorial({ g }: { g: GameState }) {
  const open = useGame((s) => s.tutorial.open);
  const step = useGame((s) => s.tutorial.step);
  const setStep = useGame((s) => s.setTutorialStep);
  const close = useGame((s) => s.closeTutorial);
  const setTab = useGame((s) => s.setTab);
  const lang = useGame((s) => s.lang);
  const [box, setBox] = useState<Box | null>(null);
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const blocked = !!g.pending || !!g.lastResult || !!g.minigame || !!g.dead;
  const def = STEPS[Math.min(step, STEPS.length - 1)];
  const active = open && !blocked;

  useEffect(() => {
    if (active && def.openTab) setTab(def.openTab);
  }, [active, def.openTab, setTab]);

  const measure = useCallback(() => {
    setVp({ w: window.innerWidth, h: window.innerHeight });
    const el = def.target?.();
    if (!el) return setBox(null);
    const r = el.getBoundingClientRect();
    setBox((b) => (b && b.x === r.left && b.y === r.top && b.w === r.width && b.h === r.height ? b : { x: r.left, y: r.top, w: r.width, h: r.height }));
  }, [def]);

  useLayoutEffect(() => {
    if (!active) return;
    measure();
    // Elementos aparecem/mudam com a navegação, a rotação e o scroll: reconsulta leve e frequente.
    const id = setInterval(measure, 300);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearInterval(id);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [active, measure, lang]);

  if (!active) return null;

  const last = step >= STEPS.length - 1;
  const cardW = Math.min(340, vp.w - 24);
  const landscape = vp.w > vp.h;
  let left = (vp.w - cardW) / 2;
  let top = Math.max(12, vp.h / 2 - 110);
  if (box) {
    const below = box.y + box.h / 2 < vp.h / 2;
    const cardH = 190;
    if (landscape && box.w < vp.w * 0.5 && vp.w - (box.x + box.w) > cardW + 20) {
      left = box.x + box.w + 14;
      top = Math.min(Math.max(12, box.y), vp.h - cardH - 12);
    } else {
      left = Math.min(Math.max(12, box.x + box.w / 2 - cardW / 2), vp.w - cardW - 12);
      top = below ? Math.min(box.y + box.h + PAD + 12, vp.h - cardH - 12) : Math.max(12, box.y - PAD - 12 - cardH);
    }
  }

  return (
    <div className="tour" role="dialog" aria-label={t('Guia rápido')}>
      <AnimatePresence>
        {box && (
          <motion.div
            key="spot"
            className="tour-spot"
            initial={false}
            animate={{ left: box.x - PAD, top: box.y - PAD, width: box.w + PAD * 2, height: box.h + PAD * 2, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          />
        )}
      </AnimatePresence>
      <motion.div
        key={def.id}
        className="tour-card"
        style={{ width: cardW, maxHeight: vp.h - 24 }}
        initial={{ opacity: 0, y: 8, left, top }}
        animate={{ opacity: 1, y: 0, left, top }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="tour-step">{t('Passo {n} de {total}', { n: step + 1, total: STEPS.length })}</div>
        <h4>{t(def.title)}</h4>
        <p>{t(def.body)}</p>
        <div className="tour-actions">
          <button className="btn sm" onClick={close}>{t('Pular')}</button>
          <span className="grow" />
          {step > 0 && <button className="btn sm" onClick={() => setStep(step - 1)}>{t('Voltar')}</button>}
          <button className="btn sm primary" onClick={() => (last ? close() : setStep(step + 1))}>{last ? t('Concluir') : t('Próximo')}</button>
        </div>
      </motion.div>
    </div>
  );
}
