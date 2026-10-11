import { useEffect } from 'react';
import { turnLabel } from '../../sim/game';
import type { GameState } from '../../sim/types';
import { useGame } from '../../store';
import { t } from '../../i18n';

const SPEED_MS = { 1: 1100, 2: 550, 3: 200 } as const;

export function TimeBar({ g }: { g: GameState }) {
  const { playing, speed, setPlaying, setSpeed, advance } = useGame();
  const blocked = !!g.pending || !!g.lastResult || !!g.dead || !!g.minigame;

  useEffect(() => {
    if (!playing || blocked) return;
    const id = setInterval(() => useGame.getState().advance(), SPEED_MS[speed]);
    return () => clearInterval(id);
  }, [playing, speed, blocked]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        advance();
      } else if (e.key === 'p') setPlaying(!useGame.getState().playing);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, setPlaying]);

  return (
    <div className="timebar">
      <button className={`icon-btn ${playing ? 'on' : ''}`} onClick={() => setPlaying(!playing)} title={t('Tempo automático (P)')} aria-label={playing ? t('Pausar') : t('Tempo automático')}>
        {playing ? '⏸' : '▶'}
      </button>
      <div className="speed">
        {([1, 2, 3] as const).map((s) => (
          <button key={s} className={speed === s ? 'on' : ''} onClick={() => setSpeed(s)}>
            {'›'.repeat(s)}
          </button>
        ))}
      </div>
      <button className={`advance ${playing && !blocked ? 'playing' : ''}`} onClick={advance} disabled={blocked} title={t('Avançar (Espaço)')}>
        {g.pending ? t('Decida o evento') : playing ? 'Vivendo…' : t('Avançar {v}', { v: turnLabel(g) })}
      </button>
    </div>
  );
}
