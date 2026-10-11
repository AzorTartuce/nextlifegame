import { useMemo, useState } from 'react';
import { addEn, t } from '../../i18n';
import type { MinigameResult } from '../../sim/types';

type Q = [sign: string, right: string, wrong: [string, string]];

const BANK: Q[] = [
  ['🛑', 'Pare', ['Dê a preferência', 'Siga em frente']],
  ['⛔', 'Entrada proibida', ['Estacionamento', 'Via de mão dupla']],
  ['🚸', 'Cuidado: crianças na pista', ['Parque de diversões', 'Cruzamento de ciclistas']],
  ['🚧', 'Obras na pista', ['Fim de pista', 'Radar de velocidade']],
  ['🅿️', 'Estacionamento permitido', ['Ponto de ônibus', 'Posto de gasolina']],
  ['🚷', 'Proibido pedestres', ['Zona escolar', 'Passagem de pedestres']],
  ['⚠️', 'Atenção: perigo à frente', ['Pare imediatamente', 'Área de descanso']],
  ['🔴', 'Semáforo vermelho: pare', ['Reduza e siga', 'Pode acelerar']],
  ['🟡', 'Semáforo amarelo: atenção, vai fechar', ['Acelere para passar', 'Pare sempre']],
  ['🟢', 'Semáforo verde: siga', ['Pare e espere', 'Buzine duas vezes']],
  ['♿', 'Vaga para pessoa com deficiência', ['Hospital', 'Rampa de skate']],
  ['🚳', 'Proibido bicicletas', ['Ciclovia', 'Aluguel de bikes']],
  ['⬆️', 'Siga em frente', ['Proibido virar', 'Contramão']],
  ['↩️', 'Retorno permitido', ['Entrada proibida', 'Pista em curva']],
  ['⛽', 'Posto de combustível', ['Estacionamento', 'Oficina mecânica']],
  ['🚑', 'Hospital próximo: silêncio', ['Ambulâncias estacionadas', 'Pronto atendimento de pneus']],
];

addEn({
  'O que esta placa significa?': 'What does this sign mean?',
  'Pare': 'Stop', 'Dê a preferência': 'Yield', 'Siga em frente': 'Go straight',
  'Entrada proibida': 'No entry', 'Estacionamento': 'Parking lot', 'Via de mão dupla': 'Two-way road',
  'Cuidado: crianças na pista': 'Caution: children on the road', 'Parque de diversões': 'Amusement park', 'Cruzamento de ciclistas': 'Cyclist crossing',
  'Obras na pista': 'Roadworks', 'Fim de pista': 'End of road', 'Radar de velocidade': 'Speed camera',
  'Estacionamento permitido': 'Parking allowed', 'Ponto de ônibus': 'Bus stop', 'Posto de gasolina': 'Gas station',
  'Proibido pedestres': 'No pedestrians', 'Zona escolar': 'School zone', 'Passagem de pedestres': 'Pedestrian crossing',
  'Atenção: perigo à frente': 'Warning: danger ahead', 'Pare imediatamente': 'Stop immediately', 'Área de descanso': 'Rest area',
  'Semáforo vermelho: pare': 'Red light: stop', 'Reduza e siga': 'Slow down and go', 'Pode acelerar': 'You can speed up',
  'Semáforo amarelo: atenção, vai fechar': 'Yellow light: careful, it is about to turn red', 'Acelere para passar': 'Speed up to get through', 'Pare sempre': 'Always stop',
  'Semáforo verde: siga': 'Green light: go', 'Pare e espere': 'Stop and wait', 'Buzine duas vezes': 'Honk twice',
  'Vaga para pessoa com deficiência': 'Disabled parking space', Hospital: 'Hospital', 'Rampa de skate': 'Skate ramp',
  'Proibido bicicletas': 'No bicycles', Ciclovia: 'Bike lane', 'Aluguel de bikes': 'Bike rental',
  'Proibido virar': 'No turning', Contramão: 'Wrong way', 'Retorno permitido': 'U-turn allowed', 'Pista em curva': 'Curved road',
  'Posto de combustível': 'Fuel station', 'Oficina mecânica': 'Mechanic shop',
  'Hospital próximo: silêncio': 'Hospital nearby: keep quiet', 'Ambulâncias estacionadas': 'Parked ambulances', 'Pronto atendimento de pneus': 'Tire repair',
  'Acertos: {n} de {m}': 'Correct: {n} of {m}',
  'Pergunta {n} de {m}': 'Question {n} of {m}',
  'Vire {n} páginas em {s} segundos!': 'Turn {n} pages in {s} seconds!',
  'Virar página': 'Turn page', 'Toque no livro para começar': 'Tap the book to start',
});

/** Teste teórico da carteira de motorista: 10 placas, 7 acertos para passar. */
export function Sinais({ onDone }: { level: number; onDone: (r: MinigameResult) => void }) {
  const questions = useMemo(() => {
    const picks = [...BANK].sort(() => Math.random() - 0.5).slice(0, 10);
    return picks.map(([sign, right, wrong]) => ({ sign, right, options: [right, ...wrong].sort(() => Math.random() - 0.5) }));
  }, []);
  const [i, setI] = useState(0);
  const [hits, setHits] = useState(0);
  const [mark, setMark] = useState<{ pick: string; right: string } | null>(null);
  const q = questions[i];

  const answer = (opt: string) => {
    if (mark) return;
    const ok = opt === q.right;
    setMark({ pick: opt, right: q.right });
    const total = hits + (ok ? 1 : 0);
    setTimeout(() => {
      setMark(null);
      if (i + 1 >= questions.length) onDone({ score: total, max: questions.length, win: total >= 7 });
      else {
        setHits(total);
        setI(i + 1);
      }
    }, 650);
  };

  return (
    <div className="mg">
      <div className="small muted">{t('Pergunta {n} de {m}', { n: i + 1, m: questions.length })} · {t('Acertos: {n} de {m}', { n: hits, m: i })}</div>
      <div className="sign">{q.sign}</div>
      <p style={{ margin: '0 0 10px', fontWeight: 800 }}>{t('O que esta placa significa?')}</p>
      <div className="choices">
        {q.options.map((o) => (
          <button key={o} className={`choice ${mark ? (o === mark.right ? 'ok' : o === mark.pick ? 'no' : '') : ''}`} onClick={() => answer(o)}>{t(o)}</button>
        ))}
      </div>
    </div>
  );
}
