import { useState } from 'react';
import { t } from '../../i18n';
import { ageYears } from '../../sim/core';
import { ACTIVITIES } from '../../sim/data/activities';
import { casualAdvice } from '../../sim/systems/casual';
import { effectiveAgenda } from '../../sim/systems/agenda';
import type { GameState } from '../../sim/types';
import { useGame } from '../../store';
import { AgendaPanel } from '../panels/AgendaPanel';

/** Chave do modo casual + piloto automático (criação da vida e Configurações). */
export function CasualToggle({ compact = false }: { compact?: boolean }) {
  const { casual, setCasual, autopilot, setAutopilot } = useGame();
  return (
    <div className={compact ? 'field' : 'card'}>
      {compact ? <label>🌱 {t('Modo casual')}</label> : <h3>🌱 {t('Modo casual')} <span className="sub">{casual ? t('ativo') : t('desligado')}</span></h3>}
      <div className="seg">
        <button className={!casual ? 'on' : ''} onClick={() => setCasual(false)}>{t('Normal')}</button>
        <button className={casual ? 'on' : ''} onClick={() => setCasual(true)}>{t('Casual')}</button>
      </div>
      <p className="small faint" style={{ margin: '8px 0 0' }}>
        {t('No modo casual o jogo fica mais simples: menos abas e apps, números enxutos e a rotina se ajusta sozinha. As regras da vida são as mesmas.')}
      </p>
      {casual && (
        <label className="row small" style={{ marginTop: 8, gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={autopilot} onChange={(e) => setAutopilot(e.target.checked)} />
          {t('Piloto automático da rotina')}
        </label>
      )}
    </div>
  );
}

/** Aba Rotina no modo casual: resumo simples + recomendação; sliders só se o jogador pedir. */
export function CasualRoutine({ g }: { g: GameState }) {
  const { autopilot, setAutopilot } = useGame();
  const [manual, setManual] = useState(false);
  if (ageYears(g) < 6 || manual || !autopilot) {
    return (
      <>
        {autopilot && ageYears(g) >= 6 && (
          <button className="btn sm" style={{ marginBottom: 10 }} onClick={() => setManual(false)}>‹ {t('Voltar ao resumo')}</button>
        )}
        {!autopilot && ageYears(g) >= 6 && (
          <div className="card">
            <p className="small muted" style={{ margin: '0 0 8px' }}>{t('O piloto automático está desligado: você controla as horas.')}</p>
            <button className="btn sm primary" onClick={() => setAutopilot(true)}>{t('Ligar o piloto automático')}</button>
          </div>
        )}
        <AgendaPanel g={g} />
      </>
    );
  }
  const eff = effectiveAgenda(g);
  const rows = ACTIVITIES.filter((a) => eff[a.id] >= 1);
  return (
    <div className="card">
      <h3>🧭 {t('Rotina no piloto automático')}</h3>
      <p style={{ margin: '0 0 10px', fontWeight: 700 }}>{t(casualAdvice(g))}</p>
      <div className="legend">
        {rows.map((a) => <span key={a.id} style={{ ['--c' as string]: a.color }}>{a.icon} {t(a.name)}</span>)}
        <span style={{ ['--c' as string]: 'rgba(255,255,255,0.12)' }}>{t('Descanso')}</span>
      </div>
      <p className="small faint" style={{ margin: '8px 0 10px' }}>{t('A cada período a semana se ajusta sozinha ao que você mais precisa.')}</p>
      <div className="row">
        <button className="btn sm" onClick={() => setManual(true)}>{t('Ajustar manualmente')}</button>
        <button className="btn sm" onClick={() => setAutopilot(false)}>{t('Desligar piloto automático')}</button>
      </div>
    </div>
  );
}

/** Apps básicos do modo casual; o resto fica atrás de "Mais". */
export const CASUAL_APPS = ['saude', 'loja', 'lazer', 'viagens', 'ajustes'];
