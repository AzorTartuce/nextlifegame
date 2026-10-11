import { t } from '../../i18n';
import { ageYears, formatMoney } from '../../sim/core';
import { ACTIVITIES } from '../../sim/data/activities';
import { activityAvailable, commitments, effectiveAgenda, energy, freeHours, restHours, targets } from '../../sim/systems/agenda';
import { LIFESTYLES, lifestyle, lifestyleCost } from '../../sim/systems/life';
import type { GameState } from '../../sim/types';
import { MovePanel } from './MovePanel';
import { useGame } from '../../store';

function Arrow({ now, target, invert }: { now: number; target: number; invert?: boolean }) {
  const d = target - now;
  if (Math.abs(d) < 2) return <span className="faint">→</span>;
  const good = invert ? d < 0 : d > 0;
  return <span className={good ? 'good' : 'bad'}>{d > 0 ? '↗' : '↘'}</span>;
}

export function AgendaPanel({ g }: { g: GameState }) {
  const { setAgenda, run } = useGame();
  const age = ageYears(g);
  if (age < 6) {
    return (
      <div className="card empty">
        <span className="e">🍼</span>
        
        {t('Você ainda é um bebê. Sua rotina é dormir, comer e conquistar corações. A agenda libera aos 6 anos.')}
      </div>
    );
  }
  const c = commitments(g);
  const free = freeHours(g);
  const eff = effectiveAgenda(g);
  const rest = restHours(g);
  const tg = targets(g);
  const s = g.player.stats;
  const total = 112;
  const avail = ACTIVITIES.filter((a) => activityAvailable(g, a));
  const used = Object.values(eff).reduce((a, b) => a + b, 0);

  return (
    <>
      <div className="card">
        <h3>{t('🗓️ Sua semana')} <span className="sub">{Math.round(rest)}{t('h livres de')} {free}h</span></h3>
        <div className="week">
          {c.escola > 0 && <div className="fixed" style={{ width: `${(c.escola / total) * 100}%` }}>{t('Escola')}</div>}
          {c.faculdade > 0 && <div className="fixed" style={{ width: `${(c.faculdade / total) * 100}%` }}>{t('Faculdade')}</div>}
          {c.trabalho > 0 && <div className="fixed" style={{ width: `${(c.trabalho / total) * 100}%` }}>{t('Trabalho')}</div>}
          {c.especial > 0 && <div className="fixed" style={{ width: `${(c.especial / total) * 100}%` }}>{t('Carreira')}</div>}
          {avail.map((a) => (eff[a.id] > 0 ? <div key={a.id} style={{ width: `${(eff[a.id] / total) * 100}%`, background: a.color }}>{eff[a.id] >= 6 ? a.icon : ''}</div> : null))}
          <div style={{ flex: 1, background: 'transparent' }} />
        </div>
        <div className="legend">
          {avail.filter((a) => eff[a.id] > 0).map((a) => (
            <span key={a.id} style={{ ['--c' as string]: a.color }}>{t(a.name)}</span>
          ))}
          <span style={{ ['--c' as string]: 'rgba(255,255,255,0.12)' }}>{t('Descanso')}</span>
        </div>
        {rest < 14 && <p className="small bad" style={{ margin: '8px 0 0', fontWeight: 800 }}>{t('⚠️ Sobrecarga! Menos de 14h de descanso por semana aumenta muito o estresse.')}</p>}
        {used > free + 0.5 && <p className="small warn" style={{ margin: '6px 0 0', fontWeight: 800 }}>{t('Você planejou mais horas do que tem; tudo será reduzido proporcionalmente.')}</p>}

        <div style={{ marginTop: 10 }}>
          {avail.map((a) => {
            const h = g.agenda[a.id] ?? 0;
            return (
              <div className="act" key={a.id}>
                <div className="act-ic" style={{ background: `${a.color}22` }}>{a.icon}</div>
                <div className="grow">
                  <div className="act-name">{t(a.name)}</div>
                  <div className="small muted">{t(a.hint)}</div>
                </div>
                <div className="stepper">
                  <button onClick={() => setAgenda(a.id, h - 2)} disabled={h <= 0} aria-label={t('Menos {name}', { name: t(a.name) })}>−</button>
                  <b>{h}h</b>
                  <button onClick={() => setAgenda(a.id, h + 2)} disabled={rest < 2} aria-label={t('Mais {name}', { name: t(a.name) })}>+</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h3>{t('🔮 Para onde sua rotina te leva')} <span className="sub">⚡ {energy(g)}{t('% energia')}</span></h3>
        <div className="forecast">
          <div className="fc">
            <div className="v">{Math.round(tg.saude)} <Arrow now={s.saude} target={tg.saude} /></div>
            <div className="l">{t('❤️ Saúde')}</div>
          </div>
          <div className="fc">
            <div className="v">{Math.round(tg.felicidade)} <Arrow now={s.felicidade} target={tg.felicidade} /></div>
            <div className="l">{t('😊 Felicidade')}</div>
          </div>
          <div className="fc">
            <div className="v">{Math.round(tg.estresse)} <Arrow now={s.estresse} target={tg.estresse} invert /></div>
            <div className="l">{t('😵 Estresse')}</div>
          </div>
        </div>
        <p className="small faint" style={{ margin: '8px 0 0' }}>{t('Seus atributos caminham aos poucos até esses valores. Eventos podem dar trancos no caminho.')}</p>
      </div>

      {age >= 18 && (
        <div className="card">
          <h3>{t('🏠 Moradia')}</h3>
          {g.livesWithParents ? (
            <div className="row">
              <div className="grow small muted">{t('Você mora com sua família. Economia total, privacidade zero.')}</div>
              <button className="btn sm primary" onClick={() => run((st) => { st.livesWithParents = false; return t('Você se mudou! Bem-vind{g} à vida adulta. 🔑', { g: st.player.gender === 'f' ? 'a' : 'o' }); })}>
                
                {t('Sair de casa')}
              </button>
            </div>
          ) : (
            <div className="seg">
              {LIFESTYLES.map((l, i) => (
                <button key={l.name} className={lifestyle(g) === i ? 'on' : ''} onClick={() => run((st) => { st.flags.estilo = i; return `Estilo de vida: ${l.name}.`; })}>
                  <span className="e">{l.icon}</span>
                  {l.name}
                  <span className="faint">{formatMoney(lifestyleCost(i))}{t('/mês')}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {age >= 18 && <MovePanel g={g} />}
    </>
  );
}
