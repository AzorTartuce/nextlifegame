import { useState } from 'react';
import { t } from '../../i18n';
import { formatMoney } from '../../sim/core';
import { CLASSES, DESTINATIONS, VIBE_LABEL, type Destination, type TripClass } from '../../sim/data/travel';
import { canTravel, takeTrip, tripCost } from '../../sim/systems/travel';
import type { GameState } from '../../sim/types';
import { useGame } from '../../store';
import { ActionMenu } from '../components/ActionMenu';

function Card({ g, d, cls }: { g: GameState; d: Destination; cls: TripClass }) {
  const run = useGame((s) => s.run);
  const cost = tripCost(g, d, cls);
  const been = g.life.travel.visited.includes(d.id);
  const err = canTravel(g);
  return (
    <button className="dest" disabled={!!err || g.money < cost} onClick={() => run(takeTrip, d.id, cls)} title={err ?? undefined}>
      <span style={{ fontSize: 26 }}>{d.flag}</span>
      <span className="grow" style={{ textAlign: 'left' }}>
        <b>{t(d.name)}</b> {been && <span className="chip good">✓</span>}
        <span className="small muted" style={{ display: 'block' }}>{t(d.country)} · {d.vibes.map((v) => VIBE_LABEL[v].icon).join(' ')}</span>
      </span>
      <b style={{ fontSize: 14 }}>{formatMoney(cost, true)}</b>
    </button>
  );
}

export function TravelPanel({ g }: { g: GameState }) {
  const [cls, setCls] = useState<TripClass>('economica');
  const [vibe, setVibe] = useState<string>('todas');
  const visited = g.life.travel.visited;
  const list = DESTINATIONS.filter((d) => vibe === 'todas' || d.vibes.includes(vibe as never));
  return (
    <>
      <div className="card">
        <h3>✈️ {t('Viagens')} <span className="sub">{visited.length}/{DESTINATIONS.length} {t('lugares')}</span></h3>
        <div className="flags">{visited.map((id) => <span key={id} title={t(DESTINATIONS.find((d) => d.id === id)!.name)}>{DESTINATIONS.find((d) => d.id === id)!.flag}</span>)}{!visited.length && <span className="small muted">{t('Seu mapa-múndi ainda está vazio.')}</span>}</div>
        <p className="small faint" style={{ margin: '8px 0 0' }}>{t('Uma semana por viagem: reduz o estresse, aumenta a felicidade e traz o imprevisto de sempre. Dentro do seu país sai bem mais barato.')}</p>
      </div>
      <div className="card">
        <h3>💺 {t('Classe do voo')}</h3>
        <div className="seg">
          {(Object.keys(CLASSES) as TripClass[]).map((k) => (
            <button key={k} className={cls === k ? 'on' : ''} onClick={() => setCls(k)}><span className="e">{CLASSES[k].icon}</span>{t(CLASSES[k].label)}</button>
          ))}
        </div>
        <div className="chips">
          <button className={vibe === 'todas' ? 'on' : ''} onClick={() => setVibe('todas')}>{t('Todos')}</button>
          {Object.entries(VIBE_LABEL).map(([k, v]) => <button key={k} className={vibe === k ? 'on' : ''} onClick={() => setVibe(k)}>{v.icon} {t(v.name)}</button>)}
        </div>
      </div>
      <div className="card" style={{ padding: 8 }}>
        <div className="dest-grid">{list.map((d) => <Card key={d.id} g={g} d={d} cls={cls} />)}</div>
      </div>
      <div className="card">
        <h3>🪪 {t('Documentos e licenças')}</h3>
        <ActionMenu g={g} group="licenca" />
        <p className="small faint" style={{ margin: '8px 0 0' }}>{t('Carros, lanchas e aviões só podem ser comprados com a licença correspondente.')}</p>
      </div>
    </>
  );
}
