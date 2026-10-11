import { useState } from 'react';
import { t } from '../../i18n';
import { formatMoney } from '../../sim/core';
import { TRAITS } from '../../sim/data/traits';
import { godEdit } from '../../sim/systems/god';
import type { GameState, Person, Stats } from '../../sim/types';
import { useGame } from '../../store';
import { STAT_META } from '../components/bits';

const KEYS: (keyof Stats)[] = ['saude', 'felicidade', 'inteligencia', 'aparencia', 'carisma', 'estresse'];

function Editor({ g, person, isMe }: { g: GameState; person: Person; isMe: boolean }) {
  const run = useGame((s) => s.run);
  const npc = g.npcs[person.id];
  const [stats, setStats] = useState<Stats>({ ...person.stats });
  const [traits, setTraits] = useState<string[]>([...person.traits]);
  const [relation, setRelation] = useState(npc?.relation ?? 0);
  const [money, setMoney] = useState(0);
  const apply = () => {
    run(godEdit, person.id, { stats, traits, relation: npc ? relation : undefined, money: isMe ? money : undefined });
    setMoney(0);
  };
  const toggle = (id: string) => setTraits((tr) => (tr.includes(id) ? tr.filter((x) => x !== id) : [...tr, id].slice(-3)));
  return (
    <>
      {KEYS.map((k) => (
        <div key={k} className="ctrl">
          <div className="ctrl-head">{STAT_META[k].icon} {t(STAT_META[k].label)} <span>{Math.round(stats[k])}</span></div>
          <input type="range" min={0} max={100} value={stats[k]} onChange={(e) => setStats({ ...stats, [k]: Number(e.target.value) })} />
        </div>
      ))}
      {npc && (
        <div className="ctrl">
          <div className="ctrl-head">🤝 {t('Relação com você')} <span>{Math.round(relation)}</span></div>
          <input type="range" min={0} max={100} value={relation} onChange={(e) => setRelation(Number(e.target.value))} />
        </div>
      )}
      <div className="group-title" style={{ marginTop: 6 }}>{t('Traços (até 3)')}</div>
      <div className="chips" style={{ marginTop: 0 }}>
        {TRAITS.map((tr) => <button key={tr.id} className={traits.includes(tr.id) ? 'on' : ''} onClick={() => toggle(tr.id)}>{tr.icon} {t(person.gender === 'f' ? tr.f : tr.m)}</button>)}
      </div>
      {isMe && (
        <div className="ctrl">
          <div className="ctrl-head">💵 {t('Dinheiro')} <span>{money >= 0 ? '+' : '−'}{formatMoney(Math.abs(money))}</span></div>
          <div className="btn-row">
            {[-10000, 10000, 100000, 1000000].map((d) => <button key={d} className="btn sm" onClick={() => setMoney(money + d)}>{d > 0 ? '+' : '−'}{formatMoney(Math.abs(d), true)}</button>)}
            <button className="btn sm" onClick={() => setMoney(0)}>0</button>
          </div>
        </div>
      )}
      <button className="btn primary block" style={{ marginTop: 10 }} onClick={apply}>⚡ {t('Aplicar')}</button>
    </>
  );
}

export function GodPanel({ g }: { g: GameState }) {
  const [id, setId] = useState(g.player.id);
  const npcs = Object.values(g.npcs).filter((n) => n.alive);
  const person: Person = id === g.player.id ? g.player : g.npcs[id] ?? g.player;
  return (
    <>
      <select className="input" value={id} onChange={(e) => setId(e.target.value)} aria-label={t('Pessoa')} style={{ marginBottom: 10 }}>
        <option value={g.player.id}>{person === g.player || id === g.player.id ? g.player.firstName : ''} ({t('você')})</option>
        {npcs.map((n) => <option key={n.id} value={n.id}>{n.firstName} {n.lastName} · {n.role}</option>)}
      </select>
      <Editor key={person.id} g={g} person={person} isMe={person.id === g.player.id} />
    </>
  );
}
