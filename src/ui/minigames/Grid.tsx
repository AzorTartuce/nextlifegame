import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addEn, dec, t } from '../../i18n';
import type { MinigameResult } from '../../sim/types';

addEn({
  'Pegue o dinheiro e chegue à saída sem ser pego pelo vigia.': 'Grab the loot and reach the exit without the guard catching you.',
  'Chegue à saída antes dos guardas te alcançarem.': 'Reach the exit before the guards catch you.',
  'Pegue pelo menos um item antes de sair.': 'Grab at least one item before leaving.',
  'Pego!': 'Caught!', 'Tempo esgotado!': 'Time is up!', 'Você conseguiu!': 'You made it!',
  'Use as setas ou WASD. No celular, use os botões.': 'Use the arrow keys or WASD. On mobile, use the buttons.',
  'Itens: {n}': 'Loot: {n}',
});

const W = 11;
const H = 9;
type Cell = 0 | 1; // 0 livre, 1 parede

/** Labirinto por busca em profundidade, com algumas paredes abertas para criar atalhos. */
function makeMaze(): Cell[][] {
  const g: Cell[][] = Array.from({ length: H }, () => Array(W).fill(1) as Cell[]);
  const stack: [number, number][] = [[1, 1]];
  g[1][1] = 0;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const dirs = ([[2, 0], [-2, 0], [0, 2], [0, -2]] as const).filter(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx > 0 && ny > 0 && nx < W - 1 && ny < H - 1 && g[ny][nx] === 1;
    });
    if (!dirs.length) { stack.pop(); continue; }
    const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
    g[y + dy / 2][x + dx / 2] = 0;
    g[y + dy][x + dx] = 0;
    stack.push([x + dx, y + dy]);
  }
  for (let i = 0; i < 9; i++) {
    const x = 1 + Math.floor(Math.random() * (W - 2));
    const y = 1 + Math.floor(Math.random() * (H - 2));
    if (g[y][x] === 1 && ((x % 2 === 1) !== (y % 2 === 1))) g[y][x] = 0;
  }
  return g;
}

type P = { x: number; y: number };
const same = (a: P, b: P) => a.x === b.x && a.y === b.y;

export function Grid({ mode, level, onDone }: { mode: 'assalto' | 'fuga'; level: number; onDone: (r: MinigameResult) => void }) {
  const heist = mode === 'assalto';
  const maze = useMemo(makeMaze, []);
  const exit: P = { x: W - 2, y: H - 2 };
  const free = useMemo(() => {
    const out: P[] = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (maze[y][x] === 0) out.push({ x, y });
    return out;
  }, [maze]);
  const lootTotal = heist ? 5 + level : 0;
  const guardCount = heist ? Math.min(3, 1 + Math.floor(level / 2)) : Math.min(5, 2 + level);
  const seconds = heist ? 36 : 42;

  const setup = useMemo(() => {
    const spots = free.filter((p) => !same(p, { x: 1, y: 1 }) && !same(p, exit));
    const shuffled = [...spots].sort(() => Math.random() - 0.5);
    const loot = shuffled.slice(0, lootTotal);
    const far = spots.filter((p) => Math.abs(p.x - 1) + Math.abs(p.y - 1) > 8 && !loot.some((l) => same(l, p))).sort(() => Math.random() - 0.5);
    return { loot, guards: far.slice(0, guardCount) };
  }, [free, lootTotal, guardCount]);

  const [me, setMe] = useState<P>({ x: 1, y: 1 });
  const [guards, setGuards] = useState<P[]>(setup.guards);
  const [loot, setLoot] = useState<P[]>(setup.loot);
  const [taken, setTaken] = useState(0);
  const [left, setLeft] = useState(seconds);
  const [msg, setMsg] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const over = useRef(false);
  const meRef = useRef(me);
  meRef.current = me;

  const end = useCallback((win: boolean, text: string, score: number) => {
    if (over.current) return;
    over.current = true;
    setMsg(text);
    setTimeout(() => onDone({ score, max: Math.max(1, lootTotal), win }), 900);
  }, [onDone, lootTotal]);

  const step = useCallback((dx: number, dy: number) => {
    if (over.current) return;
    const cur = meRef.current;
    const nx = cur.x + dx, ny = cur.y + dy;
    if (ny < 0 || nx < 0 || ny >= H || nx >= W || maze[ny][nx] === 1) return;
    const next = { x: nx, y: ny };
    setMe(next);
    setLoot((l) => {
      const hit = l.findIndex((p) => same(p, next));
      if (hit < 0) return l;
      setTaken((n) => n + 1);
      return l.filter((_, i) => i !== hit);
    });
    if (guards.some((g) => same(g, next))) end(false, t('Pego!'), taken);
  }, [maze, guards, end, taken]);

  useEffect(() => {
    if (same(me, exit)) {
      if (heist && taken < 1) setHint(true);
      else end(true, t('Você conseguiu!'), taken);
    }
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, [number, number]> = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] };
      const d = map[e.key];
      if (d) {
        e.preventDefault();
        step(d[0], d[1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  useEffect(() => {
    const id = setInterval(() => setLeft((l) => +(l - 0.1).toFixed(1)), 100);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (left <= 0) end(false, t('Tempo esgotado!'), taken);
  }, [left, end, taken]);

  useEffect(() => {
    const id = setInterval(() => {
      if (over.current) return;
      setGuards((gs) => {
        const player = meRef.current;
        const moved = gs.map((g) => {
          const opts = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).map(([dx, dy]) => ({ x: g.x + dx, y: g.y + dy })).filter((p) => p.x >= 0 && p.y >= 0 && p.x < W && p.y < H && maze[p.y][p.x] === 0);
          if (!opts.length) return g;
          const dist = Math.abs(g.x - player.x) + Math.abs(g.y - player.y);
          if (dist < 7 && Math.random() < 0.6) return opts.sort((a, b) => Math.abs(a.x - player.x) + Math.abs(a.y - player.y) - (Math.abs(b.x - player.x) + Math.abs(b.y - player.y)))[0];
          return opts[Math.floor(Math.random() * opts.length)];
        });
        if (moved.some((g) => same(g, player))) setTimeout(() => end(false, t('Pego!'), 0), 0);
        return moved;
      });
    }, Math.max(260, 460 - level * 30));
    return () => clearInterval(id);
  }, [maze, level, end]);

  return (
    <div className="mg">
      <p className="muted small" style={{ margin: '0 0 8px' }}>{heist ? t('Pegue o dinheiro e chegue à saída sem ser pego pelo vigia.') : t('Chegue à saída antes dos guardas te alcançarem.')}</p>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
        <b>{heist ? `💰 ${t('Itens: {n}', { n: `${taken}/${lootTotal}` })}` : '🏃'}</b>
        <b className={left < 8 ? 'bad' : ''}>⏱ {dec(Math.max(0, left), 1)}s</b>
      </div>
      <div className="maze" style={{ gridTemplateColumns: `repeat(${W}, 1fr)` }}>
        {maze.map((row, y) => row.map((c, x) => {
          const p = { x, y };
          let ch = '';
          if (same(p, me)) ch = heist ? '🥷' : '🧑‍🦱';
          else if (guards.some((g) => same(g, p))) ch = '👮';
          else if (same(p, exit)) ch = '🚪';
          else if (loot.some((l) => same(l, p))) ch = '💰';
          return <div key={`${x}-${y}`} className={`mz ${c === 1 ? 'wall' : ''}`}>{ch}</div>;
        }))}
      </div>
      {hint && <div className="small warn" style={{ marginTop: 6, fontWeight: 800 }}>{t('Pegue pelo menos um item antes de sair.')}</div>}
      {msg && <div className="mg-msg">{msg}</div>}
      <div className="dpad">
        <button onClick={() => step(0, -1)} aria-label="↑">▲</button>
        <div><button onClick={() => step(-1, 0)} aria-label="←">◀</button><button onClick={() => step(0, 1)} aria-label="↓">▼</button><button onClick={() => step(1, 0)} aria-label="→">▶</button></div>
      </div>
      <div className="small faint">{t('Use as setas ou WASD. No celular, use os botões.')}</div>
    </div>
  );
}
