import type { Person } from '../../sim/types';

const SKIN = ['#ffe0c7', '#f5c9a0', '#e0ac69', '#c68642', '#8d5524', '#5c3a1e'];
const HAIR = ['#2b1b10', '#4a2c17', '#8b5a2b', '#d6a85b', '#efd58a', '#b5442a', '#141414'];
const SHIRT = ['#8b7bff', '#3ecf8e', '#ff6b81', '#ffb547', '#4dd0e1', '#f78fb3', '#5c6bc0', '#26a69a'];

interface Props {
  person: Person;
  /** Idade em anos (pode ser diferente da atual, ex.: tela de morte). */
  age: number;
  size?: number;
  mood?: number;
  stress?: number;
  health?: number;
  dead?: boolean;
}

/** Avatar modular em SVG: envelhece, reage a humor, estresse e saúde. */
export function Avatar({ person, age, size = 64, mood = 60, stress = 20, health = 80, dead }: Props) {
  const { look, gender } = person;
  const baby = age < 3;
  const kid = age < 13;
  const elder = age >= 62;
  const skin = SKIN[look.skin % SKIN.length];
  const hair = age >= 55 ? (age >= 72 ? '#e8e8e8' : '#9e9e9e') : HAIR[look.hair % HAIR.length];
  const shirt = SHIRT[look.shirt % SHIRT.length];
  const headR = baby ? 25 : kid ? 23 : 21;
  const cy = baby ? 50 : kid ? 46 : 42;
  const style = baby ? -1 : (gender === 'f' ? [1, 3, 2, 5, 1] : [0, 4, 2, 0, 5])[look.hairStyle % 5];
  const bald = elder && gender === 'm' && look.hairStyle % 2 === 0;

  const smile = Math.max(-1, Math.min(1, (mood - 50) / 40));
  const mouthY = cy + headR * 0.5;
  const eyeY = cy + 1;
  const browTilt = stress > 65 ? 2.5 : mood < 30 ? -2 : 0;

  return (
    <svg className="avatar" width={size} height={size} viewBox="0 0 100 100" style={dead ? { filter: 'grayscale(1)' } : undefined}>
      <g className="bob">
        {/* Corpo */}
        {!baby && (
          <path d={`M${kid ? 24 : 18} 100 Q${kid ? 26 : 20} ${cy + headR + 10} 50 ${cy + headR + 8} Q${kid ? 74 : 80} ${cy + headR + 10} ${kid ? 76 : 82} 100 Z`} fill={shirt} />
        )}
        {baby && <ellipse cx="50" cy="96" rx="26" ry="16" fill="#fff4d6" />}
        <rect x="44" y={cy + headR - 6} width="12" height="12" rx="5" fill={skin} />

        {/* Cabelo atrás */}
        {style === 1 && !bald && <path d={`M${50 - headR - 3} ${cy} Q${50 - headR - 6} ${cy + headR + 18} ${50 - 8} ${cy + headR + 14} L${50 + 8} ${cy + headR + 14} Q${50 + headR + 6} ${cy + headR + 18} ${50 + headR + 3} ${cy} Z`} fill={hair} />}
        {style === 5 && <path d={`M${50 - headR - 2} ${cy} Q${50 - headR - 2} ${cy + headR * 0.9} ${50 - headR + 6} ${cy + headR * 0.9} L${50 + headR - 6} ${cy + headR * 0.9} Q${50 + headR + 2} ${cy + headR * 0.9} ${50 + headR + 2} ${cy} Z`} fill={hair} />}

        {/* Cabeça */}
        <circle cx="50" cy={cy} r={headR} fill={skin} />
        <ellipse cx={50 - headR + 1} cy={cy + 3} rx="3.5" ry="5" fill={skin} />
        <ellipse cx={50 + headR - 1} cy={cy + 3} rx="3.5" ry="5" fill={skin} />

        {/* Cabelo frente */}
        {style === -1 && <path d={`M46 ${cy - headR + 2} q4 -6 8 0`} stroke={HAIR[look.hair % HAIR.length]} strokeWidth="2.5" fill="none" strokeLinecap="round" />}
        {bald && <path d={`M${50 - headR} ${cy - 2} q2 -8 7 -10 M${50 + headR} ${cy - 2} q-2 -8 -7 -10`} stroke={hair} strokeWidth="4" fill="none" strokeLinecap="round" />}
        {!bald && style >= 0 && style !== 2 && style !== 4 && (
          <path d={`M${50 - headR - 1} ${cy + 2} Q${50 - headR} ${cy - headR - 6} 50 ${cy - headR - 3} Q${50 + headR} ${cy - headR - 6} ${50 + headR + 1} ${cy + 2} Q${50 + 6} ${cy - headR + 8} ${50 - headR + 4} ${cy - 2} Z`} fill={hair} />
        )}
        {!bald && style === 4 && <path d={`M${50 - headR + 1} ${cy - 4} Q50 ${cy - headR - 5} ${50 + headR - 1} ${cy - 4} Q50 ${cy - headR + 2} ${50 - headR + 1} ${cy - 4} Z`} fill={hair} />}
        {!bald && style === 2 && [-16, -8, 0, 8, 16, -20, 20].map((dx, i) => (
          <circle key={i} cx={50 + dx} cy={cy - headR + (Math.abs(dx) > 17 ? 8 : 1) + (i % 2) * 2} r={8} fill={hair} />
        ))}
        {!bald && style === 3 && <circle cx="50" cy={cy - headR - 6} r="8" fill={hair} />}

        {/* Rosto */}
        <g className="eyes">
          {dead ? (
            <>
              <path d={`M38 ${eyeY - 2} l5 4 m0 -4 l-5 4`} stroke="#2a2340" strokeWidth="2" strokeLinecap="round" />
              <path d={`M57 ${eyeY - 2} l5 4 m0 -4 l-5 4`} stroke="#2a2340" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="41" cy={eyeY} rx={baby ? 3.2 : 2.6} ry={baby ? 3.6 : 3.1} fill="#2a2340" />
              <ellipse cx="59" cy={eyeY} rx={baby ? 3.2 : 2.6} ry={baby ? 3.6 : 3.1} fill="#2a2340" />
              <circle cx="42" cy={eyeY - 1} r="0.9" fill="white" />
              <circle cx="60" cy={eyeY - 1} r="0.9" fill="white" />
            </>
          )}
        </g>
        {!baby && (
          <>
            <path d={`M37 ${eyeY - 7 + browTilt} L45 ${eyeY - 7 - browTilt}`} stroke={hair} strokeWidth="2" strokeLinecap="round" />
            <path d={`M55 ${eyeY - 7 - browTilt} L63 ${eyeY - 7 + browTilt}`} stroke={hair} strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        <path
          d={`M${44 - Math.abs(smile)} ${mouthY} Q50 ${mouthY + smile * 6} ${56 + Math.abs(smile)} ${mouthY}`}
          stroke="#7a3b3b" strokeWidth="2.2" fill={smile > 0.5 ? '#c0504d' : 'none'} strokeLinecap="round"
        />
        {mood > 70 && !dead && (
          <>
            <ellipse cx="35" cy={mouthY - 3} rx="4" ry="2.4" fill="#ff8fa3" opacity="0.45" />
            <ellipse cx="65" cy={mouthY - 3} rx="4" ry="2.4" fill="#ff8fa3" opacity="0.45" />
          </>
        )}
        {elder && <path d={`M33 ${eyeY + 6} q3 2 6 0 M61 ${eyeY + 6} q3 2 6 0`} stroke="#00000033" strokeWidth="1.2" fill="none" />}
        {stress > 70 && !dead && <path d={`M${50 + headR - 2} ${cy - 10} q3 5 0 8 q-3 -3 0 -8`} fill="#7fd3ff" />}
        {health < 30 && !dead && <circle cx="50" cy={cy} r={headR} fill="#8bc34a" opacity="0.18" />}
      </g>
    </svg>
  );
}
