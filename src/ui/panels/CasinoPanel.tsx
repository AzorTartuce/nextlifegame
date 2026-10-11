import { useEffect, useMemo, useRef, useState } from 'react';
import { dec, t } from '../../i18n';
import { formatMoney } from '../../sim/core';
import {
  BETS, SLOT_SYMBOLS, colorOf, horseField, raceHorses, settleBlackjack, spinRoulette, spinSlots, type Horse, type RouletteChoice,
} from '../../sim/systems/casino';
import type { GameState } from '../../sim/types';
import { useGame } from '../../store';
import { Disclaimer } from '../legal/Legal';

type Tab = 'slots' | 'roleta' | 'cavalos' | 'blackjack';

function lastResult(): { detail: Record<string, unknown>; payout: number; bet: number } | null {
  try {
    return JSON.parse(String(useGame.getState().game?.flags.casinoResult ?? 'null'));
  } catch {
    return null;
  }
}

function BetBar({ g, bet, setBet }: { g: GameState; bet: number; setBet: (n: number) => void }) {
  return (
    <div className="chips" style={{ marginTop: 0 }}>
      {BETS.map((b) => <button key={b} className={bet === b ? 'on' : ''} disabled={b > g.money} onClick={() => setBet(b)}>{formatMoney(b, true)}</button>)}
    </div>
  );
}

function Slots({ g, bet }: { g: GameState; bet: number }) {
  const run = useGame((s) => s.run);
  const [reels, setReels] = useState(['🎰', '🎰', '🎰']);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => () => clearInterval(timer.current), []);
  const spin = () => {
    if (busy) return;
    setBusy(true);
    setMsg('');
    timer.current = setInterval(() => setReels(reels.map(() => SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].s)), 70);
    setTimeout(() => {
      clearInterval(timer.current);
      run(spinSlots, bet);
      const r = lastResult();
      if (r) setReels(r.detail.reels as string[]);
      setMsg(r ? (r.payout > r.bet ? `+${formatMoney(r.payout - r.bet)}` : r.payout < r.bet ? `−${formatMoney(r.bet - r.payout)}` : '=') : '');
      setBusy(false);
    }, 900);
  };
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="reels">{reels.map((r, i) => <span key={i} className="reel">{r}</span>)}</div>
      <div style={{ fontWeight: 900, fontSize: 20, minHeight: 28 }} className={msg.startsWith('+') ? 'good' : msg.startsWith('−') ? 'bad' : ''}>{msg}</div>
      <button className="btn primary block" disabled={busy || bet > g.money} onClick={spin}>🎰 {t('Girar')}</button>
      <p className="small faint">{t('Três iguais pagam muito; dois 🍒 pagam 1,5x.')}</p>
    </div>
  );
}

const BETS_R: { id: RouletteChoice; label: string }[] = [
  { id: 'vermelho', label: '🔴 Vermelho' }, { id: 'preto', label: '⚫ Preto' }, { id: 'par', label: 'Par' }, { id: 'impar', label: 'Ímpar' }, { id: 'baixo', label: '1–18' }, { id: 'alto', label: '19–36' },
];

function Roulette({ g, bet }: { g: GameState; bet: number }) {
  const run = useGame((s) => s.run);
  const [choice, setChoice] = useState<RouletteChoice>('vermelho');
  const [num, setNum] = useState(17);
  const [shown, setShown] = useState<{ n: number; win: boolean; net: number } | null>(null);
  const spin = () => {
    run(spinRoulette, bet, choice);
    const r = lastResult();
    if (r) setShown({ n: r.detail.n as number, win: r.detail.win as boolean, net: r.payout - r.bet });
  };
  return (
    <div style={{ textAlign: 'center' }}>
      {shown && <div className={`ball ${colorOf(shown.n)}`}>{shown.n}</div>}
      {shown && <div style={{ fontWeight: 900 }} className={shown.net > 0 ? 'good' : shown.net < 0 ? 'bad' : ''}>{shown.net > 0 ? '+' : shown.net < 0 ? '−' : ''}{formatMoney(Math.abs(shown.net))}</div>}
      <div className="chips">
        {BETS_R.map((b) => <button key={String(b.id)} className={choice === b.id ? 'on' : ''} onClick={() => setChoice(b.id)}>{t(b.label)}</button>)}
        <button className={typeof choice === 'number' ? 'on' : ''} onClick={() => setChoice(num)}>🎯 {t('Número')} {num}</button>
      </div>
      {typeof choice === 'number' && (
        <input type="range" min={0} max={36} value={num} onChange={(e) => { setNum(Number(e.target.value)); setChoice(Number(e.target.value)); }} aria-label={t('Número')} />
      )}
      <button className="btn primary block" style={{ marginTop: 10 }} disabled={bet > g.money} onClick={spin}>🎡 {t('Girar a roleta')}</button>
      <p className="small faint">{t('Cor e paridade pagam 2x; o número cheio paga 36x; o zero é da casa.')}</p>
    </div>
  );
}

function Horses({ g, bet }: { g: GameState; bet: number }) {
  const run = useGame((s) => s.run);
  const [field, setField] = useState<Horse[]>(() => horseField({ rng: Math.floor(Math.random() * 2 ** 31) }));
  const [pick, setPick] = useState(0);
  const [pos, setPos] = useState<number[] | null>(null);
  const [res, setRes] = useState<{ winner: number; net: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const race = () => {
    if (busy) return;
    setBusy(true);
    setRes(null);
    run(raceHorses, bet, pick, field);
    const r = lastResult();
    const winner = (r?.detail.winner as number) ?? 0;
    const speeds = field.map((_, i) => (i === winner ? 1.18 : 0.7 + Math.random() * 0.4));
    let p = field.map(() => 0);
    setPos(p);
    const id = setInterval(() => {
      p = p.map((x, i) => Math.min(100, x + speeds[i] * (3 + Math.random() * 3)));
      setPos(p);
      if (p.some((x) => x >= 100)) {
        clearInterval(id);
        setPos(field.map((_, i) => (i === winner ? 100 : Math.min(94, p[i]))));
        setRes({ winner, net: r ? r.payout - r.bet : 0 });
        setBusy(false);
      }
    }, 90);
  };
  return (
    <div>
      {field.map((h, i) => (
        <button key={h.name} className={`horse ${pick === i ? 'on' : ''}`} onClick={() => !busy && setPick(i)}>
          <div className="row"><b>🏇 {t(h.name)}</b><span className="grow" /><span className="chip">x{dec(h.odds, 1)}</span></div>
          <div className="track"><span style={{ left: `${pos?.[i] ?? 0}%` }}>🐎</span></div>
        </button>
      ))}
      {res && <div style={{ textAlign: 'center', fontWeight: 900, margin: '8px 0' }} className={res.net > 0 ? 'good' : 'bad'}>{t('Venceu: {h}', { h: t(field[res.winner].name) })} · {res.net > 0 ? '+' : '−'}{formatMoney(Math.abs(res.net))}</div>}
      <div className="btn-row" style={{ marginTop: 8 }}>
        <button className="btn primary grow" disabled={busy || bet > g.money} onClick={race}>🏁 {t('Largar')}</button>
        <button className="btn" disabled={busy} onClick={() => { setField(horseField({ rng: Math.floor(Math.random() * 2 ** 31) })); setPos(null); setRes(null); }}>🔄</button>
      </div>
    </div>
  );
}

// ---------- Blackjack ----------

type Card = { r: string; s: string; v: number };
function deck(): Card[] {
  const out: Card[] = [];
  for (const s of ['♠', '♥', '♦', '♣']) for (const [r, v] of [['A', 11], ['2', 2], ['3', 3], ['4', 4], ['5', 5], ['6', 6], ['7', 7], ['8', 8], ['9', 9], ['10', 10], ['J', 10], ['Q', 10], ['K', 10]] as [string, number][]) out.push({ r, s, v });
  return out.sort(() => Math.random() - 0.5);
}
const total = (h: Card[]) => {
  let v = h.reduce((a, c) => a + c.v, 0);
  let aces = h.filter((c) => c.r === 'A').length;
  while (v > 21 && aces > 0) { v -= 10; aces -= 1; }
  return v;
};
const Hand = ({ cards, hide }: { cards: Card[]; hide?: boolean }) => (
  <div className="cards">{cards.map((c, i) => <span key={i} className={`pcard ${!hide || i === 0 ? '' : 'back'} ${c.s === '♥' || c.s === '♦' ? 'red' : ''}`}>{!hide || i === 0 ? `${c.r}${c.s}` : '🂠'}</span>)}</div>
);

function Blackjack({ g, bet }: { g: GameState; bet: number }) {
  const run = useGame((s) => s.run);
  const [st, setSt] = useState<{ d: Card[]; p: Card[]; dealer: Card[]; stake: number; over: boolean; msg: string } | null>(null);

  const finish = (s: NonNullable<typeof st>, profit: number, msg: string) => {
    run(settleBlackjack, s.stake, profit);
    setSt({ ...s, over: true, msg });
  };
  const start = () => {
    const d = deck();
    const p = [d.pop()!, d.pop()!];
    const dealer = [d.pop()!, d.pop()!];
    const s = { d, p, dealer, stake: bet, over: false, msg: '' };
    if (total(p) === 21) finish(s, total(dealer) === 21 ? 0 : bet * 1.5, t('Blackjack!'));
    else setSt(s);
  };
  const dealerPlay = (s: NonNullable<typeof st>, p: Card[], stake: number) => {
    const dealer = [...s.dealer];
    const d = [...s.d];
    while (total(dealer) < 17) dealer.push(d.pop()!);
    const pt = total(p), dt = total(dealer);
    const next = { ...s, p, dealer, d, stake };
    if (dt > 21 || pt > dt) finish(next, stake, t('Você venceu!'));
    else if (pt === dt) finish(next, 0, t('Empate.'));
    else finish(next, -stake, t('A casa venceu.'));
  };
  const hit = () => {
    if (!st) return;
    const d = [...st.d];
    const p = [...st.p, d.pop()!];
    if (total(p) > 21) finish({ ...st, d, p }, -st.stake, t('Estourou!'));
    else setSt({ ...st, d, p });
  };
  const stand = () => st && dealerPlay(st, st.p, st.stake);
  const dbl = () => {
    if (!st || st.p.length !== 2 || st.stake * 2 > g.money) return;
    const d = [...st.d];
    const p = [...st.p, d.pop()!];
    if (total(p) > 21) finish({ ...st, d, p, stake: st.stake }, -st.stake * 2, t('Estourou!'));
    else dealerPlay({ ...st, d }, p, st.stake * 2);
  };
  const live = st && !st.over;
  return (
    <div style={{ textAlign: 'center' }}>
      {st && (
        <>
          <div className="small muted">{t('Banca')} {st.over ? total(st.dealer) : '?'}</div>
          <Hand cards={st.dealer} hide={!st.over} />
          <div className="small muted" style={{ marginTop: 8 }}>{t('Você')} {total(st.p)}</div>
          <Hand cards={st.p} />
          {st.over && <div style={{ fontWeight: 900, fontSize: 18, margin: '8px 0' }}>{st.msg}</div>}
        </>
      )}
      {live ? (
        <div className="btn-row" style={{ justifyContent: 'center' }}>
          <button className="btn primary" onClick={hit}>{t('Pedir')}</button>
          <button className="btn" onClick={stand}>{t('Parar')}</button>
          <button className="btn" disabled={st.p.length !== 2 || st.stake * 2 > g.money} onClick={dbl}>{t('Dobrar')}</button>
        </div>
      ) : (
        <button className="btn primary block" disabled={bet > g.money} onClick={start}>🃏 {t('Nova mão')}</button>
      )}
      <p className="small faint">{t('Blackjack paga 3 para 2. A banca para no 17.')}</p>
    </div>
  );
}

export function CasinoPanel({ g }: { g: GameState }) {
  const [tab, setTab] = useState<Tab>('slots');
  const [bet, setBet] = useState(BETS[1]);
  const lost = g.life.counters.gamblingLost ?? 0;
  const jogo = g.life.health.addictions.jogo ?? 0;
  const tabs: { id: Tab; label: string }[] = [{ id: 'slots', label: '🎰 Slots' }, { id: 'roleta', label: '🎡 Roleta' }, { id: 'cavalos', label: '🏇 Cavalos' }, { id: 'blackjack', label: '🃏 21' }];
  const Game = useMemo(() => ({ slots: Slots, roleta: Roulette, cavalos: Horses, blackjack: Blackjack })[tab], [tab]);
  if (Math.floor((g.t - g.player.birth) / 12) < 18) return <div className="card empty"><span className="e">🎰</span>{t('O cassino só abre aos 18 anos.')}</div>;
  return (
    <>
      <Disclaimer kind="casino" />
      <div className="card">
        <h3>🎰 {t('Cassino')} <span className="sub">{formatMoney(g.money)}</span></h3>
        <div className="small muted" style={{ marginBottom: 8 }}>{t('Aposta')}</div>
        <BetBar g={g} bet={bet} setBet={setBet} />
        <p className="small faint" style={{ margin: '8px 0 0' }}>{t('Já perdeu no total: {v}.', { v: formatMoney(lost) })}{jogo > 0 ? ` ⚠️ ${t('Você mostra sinais de vício em jogo.')}` : ''}</p>
      </div>
      <div className="tabs compact">{tabs.map((x) => <button key={x.id} className={tab === x.id ? 'on' : ''} onClick={() => setTab(x.id)}>{t(x.label)}</button>)}</div>
      <div className="card"><Game g={g} bet={bet} /></div>
      <p className="small faint" style={{ textAlign: 'center' }}>{t('Jogue com responsabilidade: a casa sempre ganha no longo prazo.')}</p>
    </>
  );
}
