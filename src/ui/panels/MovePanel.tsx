import { useState } from 'react';
import { formatMoney, worldOf } from '../../sim/core';
import { COUNTRIES, countryById } from '../../sim/data/world';
import { canMove, moveQuote, relocate } from '../../sim/systems/world';
import type { GameState } from '../../sim/types';
import { useGame } from '../../store';
import { t } from '../../i18n';

const pct = (v: number) => `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`;

export function MovePanel({ g }: { g: GameState }) {
  const run = useGame((s) => s.run);
  const here = worldOf(g);
  const [open, setOpen] = useState(false);
  const [countryId, setCountryId] = useState(g.country);
  const [city, setCity] = useState(g.city);
  const country = countryById(countryId);

  const pickCountry = (id: string) => {
    setCountryId(id);
    setCity(countryById(id).cities[0].name);
  };

  if (!open) {
    return (
      <div className="card">
        <h3>{t('🌍 Mundo')} <span className="sub">{here.country.flag} {here.city.name}, {here.country.name}</span></h3>
        <div className="row">
          <div className="grow small muted">{t('Salários, impostos, custo de vida e até a expectativa de vida mudam de lugar para lugar. Quer tentar a sorte em outro canto?')}</div>
          <button className="btn sm primary" onClick={() => setOpen(true)}>{t('Mudar-se')}</button>
        </div>
      </div>
    );
  }

  const err = canMove(g, countryId, city);
  const q = moveQuote(g, countryId, city);
  const same = countryId === g.country && city === g.city;

  return (
    <div className="card">
      <h3>{t('🌍 Para onde ir?')} <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={() => setOpen(false)}>{t('Fechar')}</button></h3>
      <div className="row" style={{ marginBottom: 10 }}>
        <select className="input" value={countryId} onChange={(e) => pickCountry(e.target.value)} aria-label={t('País de destino')}>
          {COUNTRIES.map((c) => <option key={c.id} value={c.id}>{c.flag} {t(c.name)}</option>)}
        </select>
        <select className="input" value={city} onChange={(e) => setCity(e.target.value)} aria-label={t('Cidade de destino')}>
          {country.cities.map((c) => <option key={c.name} value={c.name}>{t(c.name)}</option>)}
        </select>
      </div>
      {!same && (
        <>
          <div className="move-row"><span>{t('💼 Poder de compra dos salários')}</span><span className={q.incomeDelta >= 0 ? 'good' : 'bad'}>{pct(q.incomeDelta)}</span></div>
          <div className="move-row"><span>{t('🏠 Custo de moradia')}</span><span className={q.rentDelta <= 0 ? 'good' : 'bad'}>{pct(q.rentDelta)}</span></div>
          <div className="move-row"><span>{t('🧾 Imposto na faixa alta')}</span><span className={q.taxDelta <= 0 ? 'good' : 'bad'}>{q.taxDelta > 0 ? '+' : ''}{Math.round(q.taxDelta * 100)} p.p.</span></div>
          <div className="move-row"><span>{t('📦 Custo da mudança')}</span><span>{formatMoney(q.cost)}</span></div>
          <p className="small faint" style={{ margin: '6px 0 10px' }}>
            
            {t('Você perde o emprego e os colegas daqui; família e amigos sentem a distância')}{q.abroad ? t(' (mais ainda, do outro lado do mundo)') : ''}{t('. Seu patrimônio mantém o poder de compra.')}
          </p>
        </>
      )}
      <button className="btn primary block" disabled={!!err} onClick={() => { run(relocate, countryId, city); setOpen(false); }}>
        {err ?? t('Mudar para {city} ✈️', { city })}
      </button>
    </div>
  );
}
