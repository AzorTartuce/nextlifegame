import { t } from '../../i18n';
import { ageYears, formatDate, formatMoney, fullName, placeLabel } from '../../sim/core';
import { traitById } from '../../sim/data/traits';
import { energy, targets } from '../../sim/systems/agenda';
import { useGame } from '../../store';
import { useCountUp } from '../hooks';
import { Avatar } from './Avatar';
import { Bar, FloatChip, STAT_META } from './bits';
import type { GameState, StatKey } from '../../sim/types';

const ORDER: StatKey[] = ['saude', 'felicidade', 'inteligencia', 'aparencia', 'carisma', 'estresse'];

function Money({ g }: { g: GameState }) {
  const pulse = useGame((s) => s.pulse);
  const v = useCountUp(g.money);
  const d = pulse?.deltas.dinheiro ?? 0;
  return (
    <div className={`money ${g.money < 0 ? 'neg' : ''}`}>
      {formatMoney(v)}
      <small>{t('⚡ Energia')} {energy(g)}%</small>
      <FloatChip value={d} n={pulse?.n ?? 0} good={d > 0} text={`${d > 0 ? '+' : ''}${formatMoney(d, true)}`} />
    </div>
  );
}

export function StatBars({ g }: { g: GameState }) {
  const pulse = useGame((s) => s.pulse);
  const tg = targets(g);
  return (
    <div className="stats">
      {ORDER.map((k) => {
        const meta = STAT_META[k];
        const v = g.player.stats[k];
        const d = pulse?.deltas[k] ?? 0;
        const target = k in tg ? tg[k as keyof typeof tg] : undefined;
        return (
          <div className="stat" key={k} title={target !== undefined ? t('Tendência: {v}', { v: Math.round(target) }) : undefined}>
            <div className="stat-label">
              <span>{meta.icon} {t(meta.label)}</span>
              <b>{Math.round(v)}</b>
            </div>
            <Bar value={v} color={meta.color} target={ageYears(g) >= 6 ? target : undefined} />
            {Math.abs(d) >= 1 && (
              <FloatChip value={d} n={pulse?.n ?? 0} good={meta.invert ? d < 0 : d > 0} text={`${d > 0 ? '+' : ''}${Math.round(d)}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Hud({ g }: { g: GameState }) {
  const age = ageYears(g);
  const s = g.player.stats;
  return (
    <header className="hud">
      <div className="hud-top">
        <div className="avatar-ring" style={{ ['--p' as string]: s.saude }}>
          <div style={{ width: 52, height: 52 }}>
            <Avatar person={g.player} age={age} size={56} mood={s.felicidade} stress={s.estresse} health={s.saude} />
          </div>
        </div>
        <div className="grow">
          <div className="hud-name">{fullName(g.player)}</div>
          <div className="hud-sub">
            {age} {age === 1 ? t('ano') : t('anos')} · {formatDate(g.t)} · {placeLabel(g)}{g.generation > 1 ? ` · G${g.generation}` : ''}
          </div>
        </div>
        <Money g={g} />
      </div>
      {g.life.crime.prison && <div className="insight bad"><span>⛓️</span><span>{t('Preso: faltam {n} meses.', { n: g.life.crime.prison.monthsLeft })}</span></div>}
      <StatBars g={g} />
    </header>
  );
}

export function Profile({ g }: { g: GameState }) {
  const age = ageYears(g);
  const s = g.player.stats;
  return (
    <div className="card profile">
      <div className="avatar-wrap">
        <div className="avatar-ring" style={{ ['--p' as string]: s.saude }}>
          <div style={{ width: 150, height: 150 }}>
            <Avatar person={g.player} age={age} size={160} mood={s.felicidade} stress={s.estresse} health={s.saude} />
          </div>
        </div>
      </div>
      <div className="hud-name">{fullName(g.player)}</div>
      <div className="hud-sub">
        {age} {age === 1 ? t('ano') : t('anos')} · {formatDate(g.t)} · {placeLabel(g)}{g.generation > 1 ? t(' · Geração {generation}', { generation: g.generation }) : ''}
      </div>
      <div className="traits">
        {g.player.traits.map((id) => {
          const tr = traitById(id);
          return (
            <span className="trait" key={id} title={t(tr.desc)}>
              {tr.icon} {t(g.player.gender === 'f' ? tr.f : tr.m)}
            </span>
          );
        })}
      </div>
      <div style={{ marginTop: 14 }}>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Money g={g} />
        </div>
      </div>
      <div style={{ marginTop: 14, textAlign: 'left' }}>
        <StatBars g={g} />
      </div>
    </div>
  );
}
