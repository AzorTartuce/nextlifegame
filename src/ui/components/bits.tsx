import { AnimatePresence, motion } from 'motion/react';
import { formatMoney } from '../../sim/core';
import type { DeltaKey, Deltas } from '../../sim/types';
import { t } from '../../i18n';

export const STAT_META: Record<DeltaKey, { label: string; icon: string; color: string; invert?: boolean }> = {
  saude: { label: 'Saúde', icon: '❤️', color: '#ff6b81' },
  felicidade: { label: 'Felicidade', icon: '😊', color: '#ffd166' },
  inteligencia: { label: 'Inteligência', icon: '🧠', color: '#8b7bff' },
  aparencia: { label: 'Aparência', icon: '✨', color: '#f78fb3' },
  carisma: { label: 'Carisma', icon: '🗣️', color: '#4dd0e1' },
  estresse: { label: 'Estresse', icon: '😵', color: '#ff9f43', invert: true },
  dinheiro: { label: 'Dinheiro', icon: '💵', color: '#3ecf8e' },
};

export function DeltaChips({ deltas, min = 1 }: { deltas?: Deltas; min?: number }) {
  if (!deltas) return null;
  const entries = (Object.entries(deltas) as [DeltaKey, number][]).filter(([k, v]) => Math.abs(v) >= (k === 'dinheiro' ? 1 : min));
  if (!entries.length) return null;
  return (
    <>
      {entries.map(([k, v]) => {
        const meta = STAT_META[k];
        const good = meta.invert ? v < 0 : v > 0;
        const text = k === 'dinheiro' ? `${v > 0 ? '+' : ''}${formatMoney(v, true)}` : `${v > 0 ? '+' : ''}${Math.round(v)}`;
        return (
          <span key={k} className={`chip ${good ? 'good' : 'bad'}`}>
            {meta.icon} {text}
          </span>
        );
      })}
    </>
  );
}

/** Chip que sobe e some — feedback visual de variação. */
export function FloatChip({ value, n, good, text }: { value: number; n: number; good: boolean; text: string }) {
  return (
    <AnimatePresence>
      {value !== 0 && (
        <motion.span
          key={n}
          className={`float-chip ${good ? 'good' : 'bad'}`}
          initial={{ opacity: 0, y: 6, scale: 0.8 }}
          animate={{ opacity: [0, 1, 1, 0], y: -14, scale: 1 }}
          transition={{ duration: 1.6, times: [0, 0.15, 0.7, 1] }}
        >
          {text}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export function Bar({ value, color, target }: { value: number; color: string; target?: number }) {
  return (
    <div className="bar">
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
      {target !== undefined && <i className="target" style={{ left: `calc(${Math.max(0, Math.min(100, target))}% - 1px)` }} />}
    </div>
  );
}

export function Sparkline({ values, color = '#8b7bff', height = 44 }: { values: number[]; color?: string; height?: number }) {
  if (values.length < 2) return <div className="faint small">{t('Sem dados ainda.')}</div>;
  const w = 300;
  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  const x = (i: number) => (i / (values.length - 1)) * w;
  const y = (v: number) => height - ((v - min) / (max - min)) * (height - 4) - 2;
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      {min < 0 && <line x1="0" x2={w} y1={y(0)} y2={y(0)} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />}
      <path d={`${d} L${w} ${height} L0 ${height} Z`} fill={color} opacity="0.12" />
      <path d={d} stroke={color} strokeWidth="2.5" fill="none" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
