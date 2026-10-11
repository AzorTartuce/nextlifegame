import { AnimatePresence } from 'motion/react';
import { useMemo, useState } from 'react';
import { ageYears, formatDate, formatMoney } from '../../sim/core';
import {
  ALL_STOCKS, GROUP_META, SECTOR_META, capGainsRate, formatPrice, stockByTicker, type StockGroup, type StockSector,
} from '../../sim/data/market';
import { MIN_AGE, fmtShares, marketMood } from '../../sim/systems/market';
import { portfolioValue, positions, unrealizedPnl } from '../../sim/systems/valuation';
import type { GameState, NewsItem } from '../../sim/types';
import { Bar } from '../components/bits';
import { PriceChart } from '../components/PriceChart';
import { TradeSheet, pct } from './TradeSheet';
import { t } from '../../i18n';
import { Disclaimer } from '../legal/Legal';

type Sub = 'carteira' | 'mercado' | 'noticias';

const KIND_LABEL: Record<NewsItem['kind'], string> = { fato: '🗞️ Fato', boato: '🗣️ Boato', macro: '🌍 Mercado' };

function Header({ g }: { g: GameState }) {
  const mood = marketMood(g);
  const idx = g.market.index;
  const total = portfolioValue(g);
  const pnl = unrealizedPnl(g);
  return (
    <div className="card">
      <h3>{t('📈 Bolsa de valores')} <span className="sub">{mood.icon} {t(mood.label)}</span></h3>
      <div className="kpis">
        <div className="kpi"><div className="v">{formatMoney(total, true)}</div><div className="l">{t('Investido')}</div></div>
        <div className="kpi"><div className={`v ${pnl >= 0 ? 'good' : 'bad'}`}>{pnl >= 0 ? '+' : '−'}{formatMoney(Math.abs(pnl), true)}</div><div className="l">{t('Resultado')}</div></div>
        <div className="kpi"><div className="v">{formatMoney(g.portfolio.dividendsTotal, true)}</div><div className="l">{t('Dividendos')}</div></div>
        <div className="kpi"><div className="v">{formatMoney(g.money, true)}</div><div className="l">{t('Em caixa')}</div></div>
      </div>
      <div className="small muted" style={{ margin: '12px 0 2px' }}>
        
        {t('Índice geral (100 empresas)')} <b className={mood.trend >= 0 ? 'good' : 'bad'}>{pct(mood.trend)}</b>  {t('em 6 meses')}
      </div>
      <PriceChart values={idx} height={64} />
    </div>
  );
}

function PositionRow({ g, ticker, side, onOpen }: { g: GameState; ticker: string; side: 'long' | 'short'; onOpen: (t: string) => void }) {
  const info = positions(g).find((p) => p.ticker === ticker && p.side === side)!;
  const s = stockByTicker(ticker)!;
  return (
    <div className="person" onClick={() => onOpen(ticker)} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div className="row">
        <span style={{ fontSize: 22 }}>{s.flag}</span>
        <div className="grow">
          <b>{ticker}</b> {side === 'short' && <span className="chip bad">{t('SHORT')}</span>}
          <div className="meta">{s.name} · {fmtShares(info.shares)}  {t('cotas')}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 900 }}>{formatMoney(side === 'long' ? info.value : (info.equity ?? 0), true)}</div>
          <div className={`small ${info.pnl >= 0 ? 'good' : 'bad'}`} style={{ fontWeight: 800 }}>{pct(info.pnlPct)}</div>
        </div>
      </div>
      {side === 'short' && (
        <div style={{ marginTop: 6 }}>
          <Bar value={Math.min(100, ((info.marginRatio ?? 0) / 0.5) * 100)} color={(info.marginRatio ?? 0) < 0.35 ? 'var(--bad)' : 'var(--good)'} target={50} />
        </div>
      )}
    </div>
  );
}

function Portfolio({ g, onOpen, goMarket }: { g: GameState; onOpen: (t: string) => void; goMarket: () => void }) {
  const p = g.portfolio;
  const longs = Object.keys(p.long).sort((a, b) => positions(g).find((x) => x.ticker === b && x.side === 'long')!.value - positions(g).find((x) => x.ticker === a && x.side === 'long')!.value);
  const shorts = Object.keys(p.short);
  const taxBase = Math.max(0, p.realizedYear + p.lossCarry);
  const rate = capGainsRate(g.country);
  return (
    <>
      {!longs.length && !shorts.length ? (
        <div className="card empty">
          <span className="e">💹</span>
          
          {t('Sua carteira está vazia. Escolha uma empresa no Mercado e faça seu primeiro investimento.')}
          <div style={{ marginTop: 12 }}><button className="btn primary" onClick={goMarket}>{t('Ver o mercado')}</button></div>
        </div>
      ) : (
        <div className="card">
          <h3>{t('💼 Posições')}</h3>
          {longs.map((t) => <PositionRow key={`l${t}`} g={g} ticker={t} side="long" onOpen={onOpen} />)}
          {shorts.map((t) => <PositionRow key={`s${t}`} g={g} ticker={t} side="short" onOpen={onOpen} />)}
        </div>
      )}
      <div className="card">
        <h3>{t('🧾 Custos e impostos')}</h3>
        <div className="move-row"><span>{t('Lucro realizado no ano')}</span><span className={p.realizedYear >= 0 ? 'good' : 'bad'}>{p.realizedYear >= 0 ? '+' : '−'}{formatMoney(Math.abs(p.realizedYear))}</span></div>
        {p.lossCarry < 0 && <div className="move-row"><span>{t('Prejuízo a compensar')}</span><span>{formatMoney(-p.lossCarry)}</span></div>}
        <div className="move-row"><span>{t('Imposto estimado (')}{Math.round(rate * 100)}%)</span><span>{formatMoney(taxBase * rate)}</span></div>
        <div className="move-row"><span>{t('Impostos pagos até hoje')}</span><span>{formatMoney(p.taxPaid)}</span></div>
        <div className="move-row"><span>{t('Taxas e aluguel pagos')}</span><span>{formatMoney(p.feesTotal)}</span></div>
        <div className="move-row"><span>{t('Resultado realizado total')}</span><span className={p.realizedTotal >= 0 ? 'good' : 'bad'}>{p.realizedTotal >= 0 ? '+' : '−'}{formatMoney(Math.abs(p.realizedTotal))}</span></div>
        <p className="small faint" style={{ margin: '8px 0 0' }}>{t('O imposto sobre ganhos é cobrado automaticamente em janeiro, sobre o lucro do ano anterior.')}</p>
      </div>
      {p.trades.length > 0 && (
        <div className="card">
          <h3>{t('🕘 Últimas operações')}</h3>
          {p.trades.slice(0, 8).map((tr, i) => (
            <div key={i} className="move-row">
              <span>{formatDate(tr.t)} · {({ compra: t('Compra'), venda: t('Venda'), short: t('Short'), cobertura: t('Cobertura'), margem: t('Margem') })[tr.side]} {tr.ticker}</span>
              <span className={tr.gain === undefined ? '' : tr.gain >= 0 ? 'good' : 'bad'}>{tr.gain === undefined ? formatMoney(tr.value, true) : `${tr.gain >= 0 ? '+' : '−'}${formatMoney(Math.abs(tr.gain), true)}`}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Market({ g, onOpen }: { g: GameState; onOpen: (t: string) => void }) {
  const [group, setGroup] = useState<StockGroup | 'todas'>('todas');
  const [sector, setSector] = useState<StockSector | 'todos'>('todos');
  const [sort, setSort] = useState<'padrao' | 'altas' | 'quedas' | 'dividendos'>('padrao');
  const [query, setQuery] = useState('');
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = ALL_STOCKS.filter((s) => (group === 'todas' || s.group === group) && (sector === 'todos' || s.sector === sector) && (!q || s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)));
    if (sort === 'altas') out.sort((a, b) => (g.market.lastChange[b.ticker] ?? 0) - (g.market.lastChange[a.ticker] ?? 0));
    if (sort === 'quedas') out.sort((a, b) => (g.market.lastChange[a.ticker] ?? 0) - (g.market.lastChange[b.ticker] ?? 0));
    if (sort === 'dividendos') out.sort((a, b) => b.yield - a.yield);
    return out;
  }, [group, sector, sort, query, g.market]);
  return (
    <>
      <div className="card">
        <input className="input" placeholder={t('Buscar empresa ou ticker')} value={query} onChange={(e) => setQuery(e.target.value)} aria-label={t('Buscar')} />
        <div className="chips">
          <button className={group === 'todas' ? 'on' : ''} onClick={() => setGroup('todas')}>{t('Todas')}</button>
          {(Object.keys(GROUP_META) as StockGroup[]).map((k) => <button key={k} className={group === k ? 'on' : ''} onClick={() => setGroup(k)}>{GROUP_META[k].flag} {GROUP_META[k].short}</button>)}
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <select className="input" value={sector} onChange={(e) => setSector(e.target.value as StockSector | 'todos')} aria-label={t('Setor')}>
            <option value="todos">{t('Setores')}</option>
            {(Object.keys(SECTOR_META) as StockSector[]).map((k) => <option key={k} value={k}>{SECTOR_META[k].icon} {t(SECTOR_META[k].name)}</option>)}
          </select>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label={t('Ordenar')}>
            <option value="padrao">{t('Padrão')}</option><option value="altas">{t('Maiores altas')}</option><option value="quedas">{t('Maiores quedas')}</option><option value="dividendos">{t('Dividendos')}</option>
          </select>
        </div>
      </div>
      <div className="card" style={{ padding: 6 }}>
        {list.map((s) => {
          const ch = g.market.lastChange[s.ticker] ?? 0;
          const held = !!g.portfolio.long[s.ticker] || !!g.portfolio.short[s.ticker];
          return (
            <button key={s.ticker} className="stk" onClick={() => onOpen(s.ticker)}>
              <span style={{ fontSize: 20 }}>{s.flag}</span>
              <div className="grow" style={{ textAlign: 'left' }}>
                <b>{s.ticker}</b> {held && <span className="chip">📦</span>}
                <div className="meta small muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
              </div>
              <div className="stk-chart"><PriceChart values={g.market.history[s.ticker].slice(-25)} height={30} mini /></div>
              <div style={{ textAlign: 'right', minWidth: 86 }}>
                <div style={{ fontWeight: 800, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{formatPrice(s.currency, g.market.prices[s.ticker])}</div>
                <div className={`small ${ch >= 0 ? 'good' : 'bad'}`} style={{ fontWeight: 800 }}>{pct(ch)}</div>
              </div>
            </button>
          );
        })}
        {!list.length && <div className="empty">{t('Nenhuma empresa encontrada.')}</div>}
      </div>
    </>
  );
}

function News({ g, onOpen }: { g: GameState; onOpen: (t: string) => void }) {
  return (
    <>
      {g.market.news.slice(0, 40).map((n) => (
        <div className={`news news-${n.tone}`} key={n.id}>
          <div className="row small" style={{ gap: 6, flexWrap: 'wrap' }}>
            <span className="faint" style={{ fontWeight: 800 }}>{formatDate(n.t)}</span>
            <span className="chip">{t(KIND_LABEL[n.kind])}</span>
            {n.ticker && <button className="chip" onClick={() => onOpen(n.ticker!)}>{stockByTicker(n.ticker)?.flag} {n.ticker}</button>}
            {n.sector && !n.ticker && <span className="chip">{SECTOR_META[n.sector as StockSector]?.icon} {SECTOR_META[n.sector as StockSector]?.name}</span>}
            {n.group && !n.ticker && <span className="chip">{GROUP_META[n.group as StockGroup]?.flag} {GROUP_META[n.group as StockGroup]?.short}</span>}
          </div>
          <div style={{ fontWeight: 700, margin: '6px 0 2px', lineHeight: 1.35 }}>{n.headline}</div>
          {n.kind !== 'macro' && (
            <div className="small faint">
              {n.done && n.realized !== undefined ? <>{t('Efeito do evento no preço:')} <b className={n.realized >= 0 ? 'good' : 'bad'}>{pct(n.realized)}</b></> : t('⏳ O mercado ainda está absorvendo a notícia.')}
            </div>
          )}
        </div>
      ))}
      {!g.market.news.length && <div className="card empty"><span className="e">📰</span>{t('Sem notícias por enquanto.')}</div>}
      <p className="small faint" style={{ textAlign: 'center' }}>{t('Notícias e eventos fictícios criados pelo jogo. Não são recomendação de investimento.')}</p>
    </>
  );
}

export function StocksPanel({ g }: { g: GameState }) {
  const [sub, setSub] = useState<Sub>('carteira');
  const [open, setOpen] = useState<string | null>(null);
  if (ageYears(g) < MIN_AGE) {
    return (
      <div className="card empty">
        <span className="e">📈</span>
        
        {t('A bolsa de valores abre aos 18 anos. Até lá, aproveite para economizar e estudar o mercado de longe.')}
      </div>
    );
  }
  const tabs: { id: Sub; label: string }[] = [{ id: 'carteira', label: '💼 Carteira' }, { id: 'mercado', label: '🔎 Mercado' }, { id: 'noticias', label: t('📰 Notícias') }];
  return (
    <>
      <Header g={g} />
      <Disclaimer kind="market" />
      <div className="tabs">
        {tabs.map((tb) => <button key={tb.id} className={sub === tb.id ? 'on' : ''} onClick={() => setSub(tb.id)}>{t(tb.label)}</button>)}
      </div>
      {sub === 'carteira' && <Portfolio g={g} onOpen={setOpen} goMarket={() => setSub('mercado')} />}
      {sub === 'mercado' && <Market g={g} onOpen={setOpen} />}
      {sub === 'noticias' && <News g={g} onOpen={setOpen} />}
      <AnimatePresence>{open && <TradeSheet key={open} g={g} ticker={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </>
  );
}
