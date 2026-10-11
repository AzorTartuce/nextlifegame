import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { formatDate, formatMoney } from '../../sim/core';
import { GROUP_META, SECTOR_META, formatPrice, stockByTicker } from '../../sim/data/market';
import {
  SHORT_MAINTENANCE_RATIO, SHORT_MARGIN_RATIO, buy, cover, feeRate, fmtShares, openShort, sell, tradeFee,
} from '../../sim/systems/market';
import { longInfo, priceU, shortInfo } from '../../sim/systems/valuation';
import type { GameState } from '../../sim/types';
import { useGame } from '../../store';
import { Bar } from '../components/bits';
import { PriceChart } from '../components/PriceChart';
import { dec, t } from '../../i18n';

type Mode = 'buy' | 'sell' | 'short' | 'cover';

export const pct = (v: number, digits = 1) => `${v >= 0 ? '+' : '−'}${dec(Math.abs(v * 100), digits)}%`;
const volLabel = (v: number) => (v < 0.07 ? 'baixa' : v < 0.11 ? t('média') : 'alta');

export function TradeSheet({ g, ticker, onClose }: { g: GameState; ticker: string; onClose: () => void }) {
  const run = useGame((s) => s.run);
  const s = stockByTicker(ticker)!;
  const [mode, setMode] = useState<Mode>('buy');
  const [share, setShare] = useState(25);
  const [range, setRange] = useState(24);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const price = g.market.prices[ticker];
  const change = g.market.lastChange[ticker] ?? 0;
  const pu = priceU(g, s);
  const lng = longInfo(g, ticker);
  const sht = shortInfo(g, ticker);
  const history = g.market.history[ticker].slice(-range - 1);
  const rate = feeRate(g, s);
  const liquidation = (1 + SHORT_MARGIN_RATIO) / (1 + SHORT_MAINTENANCE_RATIO) - 1;
  const news = g.market.news.filter((n) => n.ticker === ticker).slice(0, 3);

  const plan = useMemo(() => {
    const f = share / 100;
    if (mode === 'buy') {
      const spend = Math.max(0, g.money) * f;
      const fee = tradeFee(g, s, spend);
      return { amount: spend, fee, ok: spend > fee * 1.5, lines: [`Gasto: ${formatMoney(spend)}`, `Taxa: ${formatMoney(fee)}`, `Cotas: ${fmtShares(Math.max(0, (spend - fee) / pu))}`] };
    }
    if (mode === 'sell' && lng) {
      const gross = lng.value * f;
      const fee = tradeFee(g, s, gross);
      const gain = gross - fee - lng.basis * f;
      return { amount: f, fee, ok: gross > fee * 1.5, lines: [t('Você recebe: {v}', { v: formatMoney(gross - fee) }), `Taxa: ${formatMoney(fee)}`, `${gain >= 0 ? t('Lucro') : t('Prejuízo')}: ${formatMoney(Math.abs(gain))}`] };
    }
    if (mode === 'short') {
      const max = Math.max(0, g.money) / (SHORT_MARGIN_RATIO + rate);
      const notional = max * f;
      const fee = tradeFee(g, s, notional);
      return { amount: notional, fee, ok: notional > fee * 1.5 && g.money >= notional * SHORT_MARGIN_RATIO + fee, lines: [t('Venda a descoberto: {v}', { v: formatMoney(notional) }), t('Margem depositada: {v}', { v: formatMoney(notional * SHORT_MARGIN_RATIO) }), `Taxa: ${formatMoney(fee)}`] };
    }
    if (mode === 'cover' && sht) {
      const cost = sht.value * f;
      const fee = tradeFee(g, s, cost);
      const gain = sht.pnl * f - fee;
      return { amount: f, fee, ok: cost > 0, lines: [`Recompra: ${formatMoney(cost)}`, `Taxa: ${formatMoney(fee)}`, `Resultado: ${gain >= 0 ? '+' : '−'}${formatMoney(Math.abs(gain))}`] };
    }
    return { amount: 0, fee: 0, ok: false, lines: [] as string[] };
  }, [mode, share, g, s, lng, sht, pu, rate]);

  const confirm = () => {
    if (mode === 'buy') run(buy, ticker, plan.amount);
    else if (mode === 'sell') run(sell, ticker, plan.amount);
    else if (mode === 'short') run(openShort, ticker, plan.amount);
    else run(cover, ticker, plan.amount);
  };

  const modes: { id: Mode; label: string; off?: boolean }[] = [
    { id: 'buy', label: 'Comprar' }, { id: 'sell', label: 'Vender', off: !lng },
    { id: 'short', label: 'Short' }, { id: 'cover', label: 'Cobrir', off: !sht },
  ];
  const verb = { buy: 'Comprar', sell: 'Vender', short: t('Vender a descoberto'), cover: t('Cobrir short') }[mode];

  return (
    <motion.div className="sheet-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="sheet" initial={{ y: 80 }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 26, stiffness: 300 }} onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 26 }}>{s.flag}</span>
          <div className="grow">
            <div className="hud-name">{s.ticker} <span className="muted" style={{ fontSize: 14, fontWeight: 700 }}>{s.name}</span></div>
            <div className="small muted">{SECTOR_META[s.sector].icon} {SECTOR_META[s.sector].name} · {s.country} · {GROUP_META[s.group].name}</div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label={t('Fechar')}>✕</button>
        </div>

        <div className="row" style={{ alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontSize: 28, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{formatPrice(s.currency, price)}</div>
          <span className={`chip ${change >= 0 ? 'good' : 'bad'}`}>{pct(change)}  {t('no mês')}</span>
          <span className="small faint">≈ {formatMoney(pu)}</span>
        </div>
        <PriceChart values={history} height={110} />
        <div className="seg" style={{ marginBottom: 10 }}>
          {[12, 24, 60].map((r) => <button key={r} className={range === r ? 'on' : ''} onClick={() => setRange(r)}>{r === 60 ? '5 anos' : `${r} meses`}</button>)}
        </div>

        <div className="kpis" style={{ marginBottom: 10 }}>
          <div className="kpi"><div className="v">{dec(s.yield * 100, 1)}%</div><div className="l">{t('Dividendos/ano')}</div></div>
          <div className="kpi"><div className="v">{volLabel(s.vol)}</div><div className="l">{t('Volatilidade')}</div></div>
          <div className="kpi"><div className="v">{dec(rate * 100, 2)}%</div><div className="l">{t('Corretagem')}</div></div>
          <div className="kpi"><div className="v">{dec(s.beta, 1)}</div><div className="l">{t('Beta')}</div></div>
        </div>
        <p className="small muted" style={{ margin: '0 0 12px' }}>{s.desc}</p>

        {(lng || sht) && (
          <div className="insight" style={{ display: 'block', marginBottom: 12 }}>
            {lng && (
              <div className="row">
                <span>📦</span>
                <div className="grow small"><b>{fmtShares(lng.shares)}  {t('cotas')}</b> · {formatMoney(lng.value)}</div>
                <b className={lng.pnl >= 0 ? 'good' : 'bad'}>{pct(lng.pnlPct)}</b>
              </div>
            )}
            {sht && (
              <div style={{ marginTop: lng ? 8 : 0 }}>
                <div className="row">
                  <span>🔻</span>
                  <div className="grow small"><b>{t('Short de')} {fmtShares(sht.shares)}  {t('cotas')}</b> · {formatMoney(sht.value)}</div>
                  <b className={sht.pnl >= 0 ? 'good' : 'bad'}>{pct(sht.pnlPct)}</b>
                </div>
                <div className="stat-label" style={{ marginTop: 6 }}><span>{t('Margem de segurança')}</span><b>{Math.max(0, Math.round((sht.marginRatio ?? 0) * 100))}%</b></div>
                <Bar value={Math.min(100, ((sht.marginRatio ?? 0) / 0.5) * 100)} color={(sht.marginRatio ?? 0) < 0.35 ? 'var(--bad)' : 'var(--good)'} target={(SHORT_MAINTENANCE_RATIO / 0.5) * 100} />
                <div className="small faint">{t('Abaixo de')} {Math.round(SHORT_MAINTENANCE_RATIO * 100)}{t('% a posição é encerrada à força.')}</div>
              </div>
            )}
          </div>
        )}

        <div className="tabs" style={{ marginBottom: 10 }}>
          {modes.map((m) => <button key={m.id} className={mode === m.id ? 'on' : ''} disabled={m.off} onClick={() => { setMode(m.id); setShare(m.id === 'sell' || m.id === 'cover' ? 100 : 25); }}>{m.label}</button>)}
        </div>
        <input type="range" min={1} max={100} value={share} onChange={(e) => setShare(Number(e.target.value))} aria-label={t('Quantidade')} />
        <div className="btn-row" style={{ marginBottom: 8 }}>
          {[25, 50, 75, 100].map((p) => <button key={p} className="btn sm" onClick={() => setShare(p)}>{p === 100 ? t('Tudo') : `${p}%`}</button>)}
          <span className="small muted" style={{ marginLeft: 'auto', alignSelf: 'center' }}>{share}%</span>
        </div>
        <div className="insight" style={{ display: 'block' }}>
          {plan.lines.map((l) => <div key={l} className="small" style={{ fontWeight: 800 }}>{l}</div>)}
          {mode === 'short' && <div className="small warn" style={{ marginTop: 6, fontWeight: 800 }}>{t('⚠️ Se a ação subir cerca de')} {Math.round(liquidation * 100)}{t('%, a posição é encerrada à força. Aluguel: 0,3% ao mês.')}</div>}
        </div>
        <button className={`btn block ${mode === 'buy' || mode === 'cover' ? 'primary' : 'danger'}`} style={{ marginTop: 10 }} disabled={!plan.ok} onClick={confirm}>
          {verb} {ticker}
        </button>

        {news.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div className="group-title" style={{ marginTop: 0 }}>{t('Notícias de')} {ticker}</div>
            {news.map((n) => (
              <div key={n.id} className="small" style={{ margin: '6px 0' }}>
                <span className="faint">{formatDate(n.t)} · </span>{n.headline}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
