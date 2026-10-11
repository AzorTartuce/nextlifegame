import { useEffect, useRef, useState } from 'react';
import { dec, t } from '../../i18n';
import type { MinigameResult } from '../../sim/types';

/** Vire as páginas antes do tempo acabar. Toque, clique ou use Espaço. */
export function Livro({ level, onDone }: { level: number; onDone: (r: MinigameResult) => void }) {
  const goal = 18 + level * 6;
  const seconds = 14;
  const [pages, setPages] = useState(0);
  const [left, setLeft] = useState(seconds);
  const [started, setStarted] = useState(false);
  const done = useRef(false);

  const finish = (p: number) => {
    if (done.current) return;
    done.current = true;
    onDone({ score: p, max: goal, win: p >= goal });
  };
  const flip = () => {
    if (done.current) return;
    setStarted(true);
    setPages((p) => {
      const n = p + 1;
      if (n >= goal) setTimeout(() => finish(n), 250);
      return n;
    });
  };

  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => setLeft((l) => Math.max(0, +(l - 0.1).toFixed(1))), 100);
    return () => clearInterval(id);
  }, [started]);
  useEffect(() => {
    if (left <= 0) finish(pages);
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        flip();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="mg">
      <p className="muted" style={{ margin: '0 0 10px' }}>{t('Vire {n} páginas em {s} segundos!', { n: goal, s: seconds })}</p>
      <button className="book" onClick={flip} aria-label={t('Virar página')}>
        <span className="book-page" key={pages}>📖</span>
        <span className="book-n">{pages}/{goal}</span>
      </button>
      <div className="bar" style={{ height: 10, margin: '12px 0 4px' }}><span style={{ width: `${(left / seconds) * 100}%`, background: left < 4 ? 'var(--bad)' : 'var(--accent)', transition: 'width 0.1s linear' }} /></div>
      <div className="small muted">{started ? `${dec(left, 1)} s` : t('Toque no livro para começar')}</div>
    </div>
  );
}
