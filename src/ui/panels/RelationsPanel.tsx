import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { ageYears, formatDate, formatMoney, gx } from '../../sim/core';
import { interact, interactionOptions } from '../../sim/systems/life';
import type { GameState, NPC, Role } from '../../sim/types';
import { useGame } from '../../store';
import { Avatar } from '../components/Avatar';
import { Bar } from '../components/bits';
import { ActionMenu } from '../components/ActionMenu';
import { t } from '../../i18n';

const ROLE_LABEL: Record<Role, [string, string]> = {
  pai: ['Pai', 'Pai'], mae: ['Mãe', 'Mãe'], irmao: ['Irmão', 'Irmã'], amigo: ['Amigo', 'Amiga'],
  parceiro: ['Namorado', 'Namorada'], conjuge: ['Marido', 'Esposa'], filho: ['Filho', 'Filha'],
  ex: ['Ex', 'Ex'], colega: ['Colega', 'Colega'], rival: ['Rival', 'Rival'], conhecido: ['Conhecido', 'Conhecida'],
};

const GROUPS: { title: string; roles: Role[]; limit?: number }[] = [
  { title: '💞 Amor', roles: ['conjuge', 'parceiro'] },
  { title: '🏡 Família', roles: ['pai', 'mae', 'irmao', 'filho'] },
  { title: '🫂 Amigos', roles: ['amigo'] },
  { title: '💼 Trabalho & rivais', roles: ['colega', 'rival', 'ex'], limit: 8 },
  { title: '👋 Conhecidos', roles: ['conhecido'], limit: 6 },
];

function relColor(v: number) {
  return v >= 70 ? 'var(--good)' : v >= 40 ? 'var(--warn)' : 'var(--bad)';
}

function PersonCard({ g, n, open, onToggle }: { g: GameState; n: NPC; open: boolean; onToggle: () => void }) {
  const { run } = useGame();
  const age = ageYears(g, n);
  const label = ROLE_LABEL[n.role][n.gender === 'f' ? 1 : 0];
  const mem = n.memories[0];
  return (
    <div className={`person ${open ? 'open' : ''}`} onClick={onToggle} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div className="row">
        <Avatar person={n} age={age} size={46} mood={n.relation} dead={!n.alive} />
        <div className="grow">
          <b>{n.firstName} {n.lastName}</b>
          <div className="meta">{label} · {age}  {t('anos')}{!n.alive && n.deathT ? ` · ✝ ${formatDate(n.deathT)}` : ''}</div>
          {n.alive && <Bar value={n.relation} color={relColor(n.relation)} />}
          {mem && !open && <div className="mem">“{mem.text}”</div>}
        </div>
      </div>
      <AnimatePresence>
        {open && n.alive && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div className="person-actions">
              {interactionOptions(g, n).map((o) => (
                <button key={o.kind} className="btn sm" disabled={g.interactionsLeft <= 0} onClick={() => run(interact, n.id, o.kind)}>
                  {o.icon} {t(o.label)}{o.cost ? ` · ${formatMoney(o.cost)}` : ''}
                </button>
              ))}
            </div>
            {n.memories.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div className="small faint" style={{ fontWeight: 800 }}>{gx(n, t('Ele'), t('Ela'))}  {t('lembra de:')}</div>
                {n.memories.slice(0, 5).map((m, i) => (
                  <div key={i} className="mem">• {m.text} ({Math.floor(m.t / 12)})</div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RelationsPanel({ g }: { g: GameState }) {
  const [open, setOpen] = useState<string | null>(null);
  const [showDead, setShowDead] = useState(false);
  const all = Object.values(g.npcs);
  const dead = all.filter((n) => !n.alive && ['pai', 'mae', 'irmao', 'conjuge', 'filho', 'amigo', 'parceiro'].includes(n.role));
  return (
    <>
      <div className="card row">
        <span style={{ fontSize: 22 }}>💬</span>
        <div className="grow small">
          <b>{g.interactionsLeft}  {t('interações')}</b> <span className="muted">{t('restantes neste turno. Toque em alguém para interagir.')}</span>
        </div>
      </div>
      {GROUPS.map((grp) => {
        const list = all
          .filter((n) => n.alive && grp.roles.includes(n.role))
          .sort((a, b) => b.since - a.since)
          .slice(0, grp.limit ?? 99);
        if (!list.length) return null;
        return (
          <div key={grp.title}>
            <div className="group-title">{t(grp.title)}</div>
            {list.map((n) => (
              <PersonCard key={n.id} g={g} n={n} open={open === n.id} onToggle={() => setOpen(open === n.id ? null : n.id)} />
            ))}
          </div>
        );
      })}
      <div className="card" style={{ marginTop: 12 }}>
        <h3>👨‍👩‍👧 {t('Família')}</h3>
        <ActionMenu g={g} group="familia" />
      </div>
      {dead.length > 0 && (
        <>
          <button className="group-title" onClick={() => setShowDead(!showDead)}>{t('🕯️ Memorial (')}{dead.length}) {showDead ? '▾' : '▸'}</button>
          {showDead && dead.map((n) => <PersonCard key={n.id} g={g} n={n} open={false} onToggle={() => {}} />)}
        </>
      )}
    </>
  );
}
