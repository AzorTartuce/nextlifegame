import { AnimatePresence, motion } from 'motion/react';
import { dec, t } from '../../i18n';
import { useMemo, useState } from 'react';
import { ageYears, formatDate, formatMoney } from '../../sim/core';
import { CATS, REGION_LABEL, TIER_LABEL, storeById, type ShopItem, type StoreDef } from '../../sim/data/shop';
import {
  MIN_ASSET_AGE, MIN_SHOP_AGE, bonuses, checkout, freshness, inUse, isIntl, itemPrice, previewCart, regionOf, resolveCart, sellItem, toggleRent,
  shippable, statusScore, storesFor, validateCart, type Bonus,
} from '../../sim/systems/shop';
import { assetsValue, itemOf, resaleValue } from '../../sim/systems/valuation';
import type { GameState, OwnedItem, StatKey } from '../../sim/types';
import { useGame } from '../../store';
import { PriceChart } from '../components/PriceChart';
import { STAT_META } from '../components/bits';
import { pct } from './TradeSheet';

type Sub = 'lojas' | 'ofertas' | 'tendencias' | 'inventario';

const BONUS_META: Record<keyof Bonus, { icon: string; label: string }> = {
  status: { icon: '🏅', label: 'Status' },
  prod: { icon: '⚙️', label: 'Produtividade' },
  mood: { icon: '😊', label: 'Humor' },
  health: { icon: '❤️', label: 'Saúde' },
  calm: { icon: '😌', label: 'Calma' },
  look: { icon: '✨', label: 'Presença' },
  learn: { icon: '🧠', label: 'Aprendizado' },
};

const fmt = (v: number) => `${v >= 0 ? '+' : '−'}${dec(Math.abs(v), 1)}`;

/** Setas verdes e vermelhas com o impacto na vida do jogador. */
function Impact({ before, after, now }: { before?: Bonus; after?: Bonus; now?: Partial<Record<StatKey, number>> }) {
  const rows: { key: string; icon: string; label: string; d: number; invert?: boolean }[] = [];
  if (before && after) {
    for (const k of Object.keys(BONUS_META) as (keyof Bonus)[]) {
      const d = after[k] - before[k];
      if (Math.abs(d) >= 0.05) rows.push({ key: k, icon: BONUS_META[k].icon, label: t(BONUS_META[k].label), d });
    }
  }
  for (const [k, v] of Object.entries(now ?? {}) as [StatKey, number][]) {
    if (Math.abs(v) >= 0.05) rows.push({ key: `n${k}`, icon: STAT_META[k].icon, label: t('{name} agora', { name: t(STAT_META[k].label) }), d: v, invert: STAT_META[k].invert });
  }
  if (!rows.length) return <span className="small faint">{t('Sem efeito direto')}</span>;
  return (
    <div className="impact">
      {rows.map((r) => {
        const good = r.invert ? r.d < 0 : r.d > 0;
        return (
          <span key={r.key} className={`chip ${good ? 'good' : 'bad'}`}>
            {r.d > 0 ? '▲' : '▼'} {r.icon} {r.label} {fmt(r.d)}
          </span>
        );
      })}
    </div>
  );
}

function ItemRow({ g, item, discount = 0, refId, extra }: { g: GameState; item: ShopItem; discount?: number; refId: string; extra?: string }) {
  const addToCart = useGame((s) => s.addToCart);
  const cart = useGame((s) => s.cart);
  const def = CATS[item.cat];
  const store = storeById(item.store);
  const price = itemPrice(g, item, discount);
  const inCart = cart.find((l) => l.ref === refId)?.qty ?? 0;
  const prev = useMemo(() => previewCart(g, [{ ref: refId, qty: 1 }]), [g, refId]);
  const oneOnly = def.kind !== 'consumivel';
  const intl = !!store && isIntl(g, store);
  const blocked = def.kind === 'ativo' && ageYears(g) < MIN_ASSET_AGE;
  return (
    <div className="item">
      <div className="item-ic">{def.icon}</div>
      <div className="grow">
        <div className="item-name">{item.name}{item.gacha && <span className="chip">{t('🎲 surpresa')}</span>}</div>
        {(item.desc || extra) && <div className="small muted">{item.desc ?? extra}</div>}
        <div className="small faint">{t(def.label)}{intl ? t(' · importado (+25%)') : ''}</div>
        <Impact before={prev.before} after={prev.after} now={prev.now} />
      </div>
      <div className="item-buy">
        <div style={{ fontWeight: 900 }}>{formatMoney(price)}</div>
        {discount > 0 && <div className="small faint" style={{ textDecoration: 'line-through' }}>{formatMoney(itemPrice(g, item))}</div>}
        <button className="btn sm primary" disabled={blocked || (oneOnly && inCart > 0)} onClick={() => addToCart(refId, 1)}>
          {blocked ? '18+' : oneOnly && inCart ? t('No carrinho') : inCart ? `+1 (${inCart})` : t('Adicionar')}
        </button>
      </div>
    </div>
  );
}

function StoreSheet({ g, store, onClose }: { g: GameState; store: StoreDef; onClose: () => void }) {
  const intl = isIntl(g, store);
  const trend = g.shop.trends[store.id];
  const items = store.items.filter((i) => !intl || shippable(i.cat));
  return (
    <motion.div className="sheet-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="sheet" initial={{ y: 80 }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 26, stiffness: 300 }} onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 30 }}>{store.icon}</span>
          <div className="grow">
            <div className="hud-name">{store.name}</div>
            <div className="small muted">{t(TIER_LABEL[store.tier])}{store.region !== 'all' ? ` · ${REGION_LABEL[store.region].flag} ${REGION_LABEL[store.region].name}` : ''}</div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label={t('Fechar')}>✕</button>
        </div>
        <p className="small muted" style={{ margin: '0 0 10px' }}>{store.desc}</p>
        {trend && (
          <div className={`insight ${trend.status < 1 ? 'bad' : 'good'}`} style={{ marginBottom: 10 }}>
            <span>{trend.status < 1 ? '🧊' : '🔥'}</span>
            <span>{trend.status < 1 ? t('Marca em baixa: os itens perdem status e valor de revenda, mas os preços caíram.') : t('Marca em alta: os itens dão mais status, mas os preços subiram.')}</span>
          </div>
        )}
        {intl && <div className="insight" style={{ marginBottom: 10 }}><span>📦</span><span>{t('Loja de outra região: entrega por correio com frete e imposto (+25%). Itens perecíveis não são enviados.')}</span></div>}
        {items.map((i) => <ItemRow key={i.id} g={g} item={i} refId={i.id} />)}
      </motion.div>
    </motion.div>
  );
}

function CartSheet({ g, onClose }: { g: GameState; onClose: () => void }) {
  const { cart, setCartQty, removeFromCart, clearCart, run } = useGame();
  const prev = useMemo(() => previewCart(g, cart), [g, cart]);
  const rows = resolveCart(g, cart);
  const error = validateCart(g, cart);
  const pay = () => {
    run(checkout, cart);
    clearCart();
    onClose();
  };
  return (
    <motion.div className="sheet-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="sheet" initial={{ y: 80 }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 26, stiffness: 300 }} onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ marginBottom: 10 }}>
          <div className="grow hud-name">{t('🛒 Carrinho')}</div>
          <button className="icon-btn" onClick={onClose} aria-label={t('Fechar')}>✕</button>
        </div>
        {!rows.length && <div className="empty"><span className="e">🛍️</span>{t('Seu carrinho está vazio.')}</div>}
        {rows.map((r) => {
          const def = CATS[r.item.cat];
          return (
            <div key={r.ref} className="item" style={{ alignItems: 'center' }}>
              <div className="item-ic">{def.icon}</div>
              <div className="grow">
                <div className="item-name">{r.item.name}</div>
                <div className="small muted">{formatMoney(r.unit)}{r.qty > 1 ? ` × ${r.qty}` : ''}</div>
              </div>
              {def.kind === 'consumivel' ? (
                <div className="stepper">
                  <button onClick={() => setCartQty(r.ref, r.qty - 1)} aria-label={t('Menos')}>−</button>
                  <b>{r.qty}</b>
                  <button onClick={() => setCartQty(r.ref, Math.min(9, r.qty + 1))} aria-label={t('Mais')}>+</button>
                </div>
              ) : (
                <button className="btn sm danger" onClick={() => removeFromCart(r.ref)}>{t('Remover')}</button>
              )}
            </div>
          );
        })}
        {rows.length > 0 && (
          <>
            <div className="group-title">{t('Impacto na sua vida')}</div>
            <Impact before={prev.before} after={prev.after} now={prev.now} />
            <div className="move-row" style={{ marginTop: 12 }}><span>{t('Total')}</span><b>{formatMoney(prev.total)}</b></div>
            <div className="move-row"><span>{t('Você tem')}</span><span>{formatMoney(g.money)}</span></div>
            <button className="btn primary block" style={{ marginTop: 8 }} disabled={!!error} onClick={pay}>{error ?? t('Finalizar compra')}</button>
            <button className="btn block" style={{ marginTop: 8 }} onClick={clearCart}>{t('Esvaziar carrinho')}</button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function StoreCard({ g, s, onOpen }: { g: GameState; s: StoreDef; onOpen: (s: StoreDef) => void }) {
  const trend = g.shop.trends[s.id];
  return (
    <button className="store-card" onClick={() => onOpen(s)}>
      <div className="row">
        <span style={{ fontSize: 26 }}>{s.icon}</span>
        <div className="grow" style={{ textAlign: 'left' }}>
          <b>{t(s.name)}</b>
          <div className="small faint">{t(TIER_LABEL[s.tier])} · {s.items.length}  {t('itens')}</div>
        </div>
        {trend && <span className={`chip ${trend.status < 1 ? 'bad' : 'good'}`}>{trend.status < 1 ? t('🧊 em baixa') : t('🔥 em alta')}</span>}
      </div>
    </button>
  );
}

function Stores({ g, onOpen }: { g: GameState; onOpen: (s: StoreDef) => void }) {
  const { local, intl } = storesFor(g);
  const dealers = local.filter((s) => s.region === 'all');
  const shops = local.filter((s) => s.region !== 'all');
  const [showIntl, setShowIntl] = useState(false);
  const region = REGION_LABEL[regionOf(g)];
  return (
    <>
      <div className="group-title" style={{ marginTop: 0 }}>{region.flag}  {t('Lojas da sua região')}</div>
      <div className="store-grid">{shops.map((s) => <StoreCard key={s.id} g={g} s={s} onOpen={onOpen} />)}</div>
      <div className="group-title">{t('🏡 Bens de alto custo')}</div>
      <div className="store-grid">{dealers.map((s) => <StoreCard key={s.id} g={g} s={s} onOpen={onOpen} />)}</div>
      <button className="group-title" onClick={() => setShowIntl(!showIntl)}>{t('🌍 Internacional (+25%)')} {showIntl ? '▾' : '▸'}</button>
      {showIntl && <div className="store-grid">{intl.map((s) => <StoreCard key={s.id} g={g} s={s} onOpen={onOpen} />)}</div>}
    </>
  );
}

function Offers({ g }: { g: GameState }) {
  if (!g.shop.offers.length) return <div className="card empty"><span className="e">🏷️</span>{t('Sem ofertas agora. Volte no próximo mês.')}</div>;
  return (
    <>
      <p className="small muted" style={{ margin: '0 2px 8px' }}>{t('Ofertas do dia: itens únicos, raros ou com descontos bizarros. Valem até o fim do mês.')}</p>
      {g.shop.offers.map((o) => (
        <div key={o.id} className="card" style={{ padding: 10 }}>
          <div className="small" style={{ fontWeight: 800, margin: '0 0 6px' }}>{storeById(o.storeId)?.icon} {storeById(o.storeId)?.name}: {o.headline}</div>
          <ItemRow g={g} item={o.item} discount={o.discount} refId={`offer:${o.id}`} />
        </div>
      ))}
    </>
  );
}

function Trends({ g }: { g: GameState }) {
  const hist = g.shop.priceHistory;
  const change = hist.length > 12 ? hist[hist.length - 1] / hist[hist.length - 13] - 1 : hist[hist.length - 1] / hist[0] - 1;
  const hot = Object.entries(g.shop.trends);
  return (
    <>
      <div className="card">
        <h3>{t('🏷️ Preços das lojas')} <span className="sub">{pct(change)}  {t('em 12 meses')}</span></h3>
        <PriceChart values={hist.length > 1 ? hist : [1, 1]} height={70} color={change > 0.02 ? 'var(--bad)' : 'var(--good)'} />
        <p className="small faint" style={{ margin: '8px 0 0' }}>{t('Os preços reais acompanham o clima da economia: com a bolsa em alta, tudo fica mais caro; em crise, as lojas fazem liquidação.')}</p>
      </div>
      {hot.length > 0 && (
        <div className="card">
          <h3>{t('📈 Marcas em evidência')}</h3>
          {hot.map(([id, tr]) => (
            <div key={id} className="move-row">
              <span>{storeById(id)?.icon} {t(storeById(id)?.name ?? '')}</span>
              <span className={tr.status < 1 ? 'bad' : 'good'}>{tr.status < 1 ? t('🧊 em baixa') : t('🔥 em alta')} · {tr.left} {t('meses')}</span>
            </div>
          ))}
        </div>
      )}
      <div className="group-title">{t('📰 Notícias do varejo')}</div>
      {g.shop.news.map((n) => (
        <div key={n.id} className={`news news-${n.tone}`}>
          <div className="small faint" style={{ fontWeight: 800 }}>{formatDate(n.t)} · {storeById(n.storeId)?.icon} {storeById(n.storeId)?.name}</div>
          <div style={{ fontWeight: 700, margin: '4px 0 0', lineHeight: 1.35 }}>{n.headline}</div>
        </div>
      ))}
      {!g.shop.news.length && <div className="card empty"><span className="e">📰</span>{t('Nenhuma notícia por enquanto.')}</div>}
      <p className="small faint" style={{ textAlign: 'center' }}>{t('Notícias fictícias criadas pelo jogo.')}</p>
    </>
  );
}

function OwnedRow({ g, o, active }: { g: GameState; o: OwnedItem; active: boolean }) {
  const run = useGame((s) => s.run);
  const item = itemOf(o)!;
  const def = CATS[item.cat];
  const value = resaleValue(g, o);
  const fresh = def.fade ? Math.round(freshness(item.cat, (g.t - o.t) / 12) * 100) : null;
  return (
    <div className="item">
      <div className="item-ic">{def.icon}</div>
      <div className="grow">
        <div className="item-name">{item.name} {def.slot && <span className={`chip ${active ? 'good' : ''}`}>{active ? t('em uso') : t('guardado')}</span>}{o.mult && o.mult > 1 && item.gacha && <span className="chip">✨ x{o.mult}</span>}</div>
        <div className="small faint">
          
          {t('Pago')} {formatMoney(o.paid)}  {t('· vale')} {formatMoney(value)}
          {fresh !== null && ` · ${fresh}% ${def.fade === 'tech' ? t('atual') : t('na moda')}`}
          {def.upkeep ? t(' · manutenção {v}/ano', { v: formatMoney(o.paid * def.upkeep) }) : ''}{o.rented ? ` · ${t('alugado')}` : ''}
        </div>
      </div>
      <div className="item-buy">
        {item.cat === 'imovel' && <button className="btn sm" onClick={() => run(toggleRent, o.uid)}>{o.rented ? t('Parar de alugar') : t('Alugar')}</button>}
        <button className="btn sm" onClick={() => confirm(`Vender ${item.name} por ${formatMoney(value)}?`) && run(sellItem, o.uid)}>{t('Vender')}</button>
      </div>
    </div>
  );
}

function Inventory({ g }: { g: GameState }) {
  const b = bonuses(g);
  const used = inUse(g, g.shop.inventory);
  const groups = new Map<string, OwnedItem[]>();
  for (const o of g.shop.inventory) {
    const item = itemOf(o);
    if (!item) continue;
    const list = groups.get(t(CATS[item.cat].label)) ?? [];
    list.push(o);
    groups.set(t(CATS[item.cat].label), list);
  }
  const status = statusScore(g);
  return (
    <>
      <div className="card">
        <h3>{t('🎒 Seu estilo de vida')} <span className="sub">{t('bens:')} {formatMoney(assetsValue(g), true)}</span></h3>
        <div className="kpis">
          <div className="kpi"><div className="v">{status}</div><div className="l">{t('🏅 Status')}</div></div>
          <div className="kpi"><div className="v">{fmt(b.prod)}</div><div className="l">{t('⚙️ Produtiv.')}</div></div>
          <div className="kpi"><div className="v">{fmt(b.mood)}</div><div className="l">{t('😊 Humor')}</div></div>
          <div className="kpi"><div className="v">{fmt(b.calm)}</div><div className="l">{t('😌 Calma')}</div></div>
          <div className="kpi"><div className="v">{fmt(b.look)}</div><div className="l">{t('✨ Presença')}</div></div>
          <div className="kpi"><div className="v">{fmt(b.health)}</div><div className="l">{t('❤️ Saúde')}</div></div>
          <div className="kpi"><div className="v">{fmt(b.learn)}</div><div className="l">{t('🧠 Aprend.')}</div></div>
          <div className="kpi"><div className="v">{formatMoney(g.shop.spentTotal, true)}</div><div className="l">{t('🛍️ Gasto')}</div></div>
        </div>
        <p className="small faint" style={{ margin: '10px 0 0' }}>{t('Em cada espaço só o melhor item conta (um celular, um relógio…). Eletrônicos ficam obsoletos e roupas saem de moda. Status ajuda em entrevistas e no romance; produtividade, no emprego e na empresa.')}</p>
        {g.shop.junk > 6 && <div className="insight bad" style={{ marginTop: 10 }}><span>🍔</span><span>{t('Sua alimentação anda pesada. Isso vai cobrar da sua saúde se continuar assim.')}</span></div>}
      </div>
      {!g.shop.inventory.length && <div className="card empty"><span className="e">🎒</span>{t('Você ainda não comprou nada que fique com você.')}</div>}
      {[...groups.entries()].map(([label, list]) => (
        <div key={label} className="card" style={{ padding: 10 }}>
          <div className="group-title" style={{ margin: '0 0 6px' }}>{CATS[itemOf(list[0])!.cat].icon} {label}</div>
          {list.map((o) => <OwnedRow key={o.uid} g={g} o={o} active={used.has(o.uid)} />)}
        </div>
      ))}
    </>
  );
}

export function ShopPanel({ g }: { g: GameState }) {
  const [sub, setSub] = useState<Sub>('lojas');
  const [store, setStore] = useState<StoreDef | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const cart = useGame((s) => s.cart);
  const count = cart.reduce((n, l) => n + l.qty, 0);
  if (ageYears(g) < MIN_SHOP_AGE) {
    return <div className="card empty"><span className="e">🛍️</span>{t('As compras online abrem aos')} {MIN_SHOP_AGE}  {t('anos. Até lá, peça aos seus pais.')}</div>;
  }
  const tabs: { id: Sub; label: string }[] = [{ id: 'lojas', label: '🏬 Lojas' }, { id: 'ofertas', label: `${t('🏷️ Ofertas')}${g.shop.offers.length ? ` ${g.shop.offers.length}` : ''}` }, { id: 'tendencias', label: t('📈 Preços') }, { id: 'inventario', label: '🎒 Bens' }];
  return (
    <>
      <div className="card">
        <div className="row">
          <div className="grow">
            <h3 style={{ margin: 0 }}>{t('🛍️ GlobalMart')}</h3>
            <div className="small muted">{t('Você tem')} {formatMoney(g.money)}  {t('· preços')} {pct(g.shop.priceIndex - 1, 0)}  {t('vs. base')}</div>
          </div>
          <button className="btn primary" onClick={() => setCartOpen(true)}>🛒 {count > 0 ? count : ''}</button>
        </div>
      </div>
      <div className="tabs compact">
        {tabs.map((tb) => <button key={tb.id} className={sub === tb.id ? 'on' : ''} onClick={() => setSub(tb.id)}>{tb.label.startsWith('🏷️') ? tb.label : t(tb.label)}</button>)}
      </div>
      {sub === 'lojas' && <Stores g={g} onOpen={setStore} />}
      {sub === 'ofertas' && <Offers g={g} />}
      {sub === 'tendencias' && <Trends g={g} />}
      {sub === 'inventario' && <Inventory g={g} />}
      <AnimatePresence>
        {store && <StoreSheet key={store.id} g={g} store={store} onClose={() => setStore(null)} />}
        {cartOpen && <CartSheet key="cart" g={g} onClose={() => setCartOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

