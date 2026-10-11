import { t } from '../../i18n';
interface Props {
  values: number[];
  height?: number;
  /** Modo compacto, para listas: sem rótulos. */
  mini?: boolean;
  color?: string;
}

/** Gráfico de linha de preços, escalado entre mínimo e máximo; verde se terminou acima de onde começou. */
export function PriceChart({ values, height = 120, mini, color }: Props) {
  if (values.length < 2) return null;
  const w = 300;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = mini ? 2 : 6;
  const x = (i: number) => (i / (values.length - 1)) * w;
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);
  const up = values[values.length - 1] >= values[0];
  const c = color ?? (up ? 'var(--good)' : 'var(--bad)');
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label={t('Gráfico de preço')}>
      {!mini && [0.25, 0.5, 0.75].map((k) => <line key={k} x1="0" x2={w} y1={height * k} y2={height * k} stroke="rgba(255,255,255,0.06)" />)}
      <path d={`${d} L${w} ${height} L0 ${height} Z`} fill={c} opacity={mini ? 0.1 : 0.14} />
      <path d={d} stroke={c} strokeWidth={mini ? 1.8 : 2.4} fill="none" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {!mini && <circle cx={w - 2} cy={y(values[values.length - 1])} r="3.5" fill={c} />}
    </svg>
  );
}
