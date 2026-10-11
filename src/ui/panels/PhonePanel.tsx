import type { ReactNode } from 'react';
import { t } from '../../i18n';
import { formatDate, formatMoney, placeLabel } from '../../sim/core';
import { positions } from '../../sim/systems/valuation';
import type { GameState } from '../../sim/types';
import { useGame, type App } from '../../store';
import { CasinoPanel } from './CasinoPanel';
import { HealthPanel } from './HealthPanel';
import { LazerPanel } from './LazerPanel';
import { PetsPanel } from './PetsPanel';
import { TravelPanel } from './TravelPanel';
import { RuaPanel } from './RuaPanel';
import { SettingsPanel } from './SettingsPanel';
import { ShopPanel } from './ShopPanel';
import { StocksPanel } from './StocksPanel';

type AppId = Exclude<App, null>;

interface AppDef {
  id: AppId;
  icon: string;
  name: string;
  minAge: number;
  badge?: (g: GameState) => { text: string; alert?: boolean } | null;
  render: (g: GameState) => ReactNode;
}

/** Apps do celular. Novos apps entram aqui; cada um aparece quando o jogador tem idade para usá-lo. */
export const APPS: AppDef[] = [
  {
    id: 'bolsa', icon: '📈', name: 'Bolsa', minAge: 0,
    badge: (g) => (positions(g).some((p) => p.side === 'short' && (p.marginRatio ?? 1) < 0.35) ? { text: '⚠️', alert: true } : null),
    render: (g) => <StocksPanel g={g} />,
  },
  {
    id: 'loja', icon: '🛍️', name: 'GlobalMart', minAge: 0,
    badge: (g) => (g.shop.offers.length ? { text: String(g.shop.offers.length) } : null),
    render: (g) => <ShopPanel g={g} />,
  },
  {
    id: 'saude', icon: '🏥', name: 'Saúde', minAge: 0,
    badge: (g) => (g.life.health.conditions.some((c) => c.known && !c.treated && c.severity >= 40) ? { text: '!', alert: true } : null),
    render: (g) => <HealthPanel g={g} />,
  },
  { id: 'cassino', icon: '🎰', name: 'Cassino', minAge: 18, render: (g) => <CasinoPanel g={g} /> },
  { id: 'viagens', icon: '✈️', name: 'Viagens', minAge: 16, render: (g) => <TravelPanel g={g} /> },
  { id: 'lazer', icon: '🎭', name: 'Lazer', minAge: 4, render: (g) => <LazerPanel g={g} /> },
  {
    id: 'rua', icon: '🕶️', name: 'Rua', minAge: 12,
    badge: (g) => (g.life.crime.prison ? { text: '⛓️', alert: true } : g.life.crime.heat >= 60 ? { text: '🚨', alert: true } : null),
    render: (g) => <RuaPanel g={g} />,
  },
  { id: 'pets', icon: '🐾', name: 'Pets', minAge: 10, render: (g) => <PetsPanel g={g} /> },
  { id: 'ajustes', icon: '⚙️', name: 'Ajustes', minAge: 0, render: (g) => <SettingsPanel g={g} /> },
];

export function registerApp(def: AppDef, before = 'ajustes') {
  const i = APPS.findIndex((a) => a.id === before);
  APPS.splice(i < 0 ? APPS.length : i, 0, def);
}

export function PhonePanel({ g }: { g: GameState }) {
  const { app, setApp } = useGame();
  const current = APPS.find((a) => a.id === app);

  if (current) {
    return (
      <>
        <button className="btn sm" style={{ marginBottom: 10 }} onClick={() => setApp(null)}>‹ {t('Celular')}</button>
        {current.render(g)}
      </>
    );
  }

  return (
    <div className="phone">
      <div className="phone-top">
        <div>
          <div style={{ fontWeight: 900, fontSize: 20 }}>{formatDate(g.t)}</div>
          <div className="small muted">{placeLabel(g)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="small muted">{t('Saldo')}</div>
          <div style={{ fontWeight: 900 }}>{formatMoney(g.money)}</div>
        </div>
      </div>
      <div className="phone-grid">
        {APPS.filter((a) => g.dead === null && Math.floor((g.t - g.player.birth) / 12) >= a.minAge).map((a) => {
          const badge = a.badge?.(g);
          return (
            <button key={a.id} className="app-tile" onClick={() => setApp(a.id)}>
              <span className="app-ic">{a.icon}{badge && <i className={`app-badge ${badge.alert ? 'alert' : ''}`}>{badge.text}</i>}</span>
              <span>{t(a.name)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
