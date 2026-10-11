import { AnimatePresence, motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { fmtNum, t, tp } from '../../i18n';
import { formatMoney } from '../../sim/core';
import { LAWS, OFFICES, lawById, partyById } from '../../sim/data/politics';
import { officeName } from '../../sim/systems/politics';
import { INSTRUMENTS, SPORTS, TIER_NAMES, acting, music, space, sport } from '../../sim/systems/special';
import type { GameState } from '../../sim/types';
import { ActionMenu } from '../components/ActionMenu';
import { Bar } from '../components/bits';

type Kind = 'politica' | 'musica' | 'atuacao' | 'esporte' | 'espaco';

const KINDS: { id: Kind; icon: string; name: string; minAge: number; status: (g: GameState) => string }[] = [
  {
    id: 'politica', icon: '🏛️', name: 'Política', minAge: 18,
    status: (g) => { const p = g.life.special.politics; return !p ? t('Sem partido') : p.office >= 0 ? `${t(officeName(g, p.office))} · ${t('aprovação')} ${Math.round(p.approval)}%` : p.campaign ? t('Em campanha') : t(partyById(p.party).name); },
  },
  {
    id: 'musica', icon: '🎸', name: 'Música', minAge: 8,
    status: (g) => { const m = music(g); return m ? `${t(INSTRUMENTS.find((i) => i.id === m.instrument)!.name)} · ${fmtNum(m.fans)} ${t('fãs')}` : t('Não começou'); },
  },
  {
    id: 'atuacao', icon: '🎬', name: 'Atuação', minAge: 8,
    status: (g) => { const a = acting(g); return a ? `${tp(a.roles, '{n} papel', '{n} papéis')} · ${t('fama')} ${Math.round(a.fame)}` : t('Não começou'); },
  },
  {
    id: 'esporte', icon: '🏅', name: 'Esporte profissional', minAge: 10,
    status: (g) => { const s = sport(g); return s ? `${t(SPORTS.find((x) => x.id === s.sport)!.name)} · ${s.team ?? t('sem time')}` : t('Não começou'); },
  },
  {
    id: 'espaco', icon: '🚀', name: 'Astronauta', minAge: 25,
    status: (g) => { const s = space(g); return s ? (s.stage === 1 ? t('Em treinamento: {n} meses', { n: s.trainingLeft }) : tp(s.missions, '{n} missão', '{n} missões')) : t('Não candidatou'); },
  },
];

function Row({ label, children }: { label: string; children: ReactNode }) {
  return <div className="move-row"><span>{label}</span><b>{children}</b></div>;
}

function Politics({ g }: { g: GameState }) {
  const p = g.life.special.politics;
  return (
    <>
      {p && (
        <div className="card">
          <h3>🗳️ {t(partyById(p.party).name)}</h3>
          <Row label={t('Cargo')}>{p.office >= 0 ? t(officeName(g, p.office)) : '—'}</Row>
          {p.office >= 0 && (
            <>
              <div className="stat-label"><span>{t('Aprovação')}</span><b>{Math.round(p.approval)}%</b></div>
              <Bar value={p.approval} color={p.approval < 30 ? 'var(--bad)' : 'var(--good)'} />
              <Row label={t('Mandato')}>{tp(p.monthsLeft, '{n} mês restante', '{n} meses restantes')}</Row>
              <Row label={t('Subsídio')}>{formatMoney(OFFICES[p.office].pay)}/{t('mês')}</Row>
            </>
          )}
          <Row label={t('Mandatos cumpridos')}>{p.terms}</Row>
          <Row label={t('Escândalos')}>{p.scandals}/3</Row>
          {p.laws.length > 0 && <div className="small muted" style={{ marginTop: 8 }}>{t('Leis em vigor')}: {p.laws.map((id) => `${lawById(id).icon} ${t(lawById(id).name)}`).join(' · ')}</div>}
          {p.campaign && (
            <div style={{ marginTop: 10 }}>
              <div className="stat-label"><span>🗳️ {t('Campanha para {o}', { o: t(officeName(g, p.campaign.office)) })} · {tp(p.campaign.months, '{n} mês', '{n} meses')}</span><b>{Math.round(p.campaign.support)}%</b></div>
              <Bar value={p.campaign.support} color="var(--accent)" target={p.campaign.opp} />
              <div className="small faint">{t('A marca branca é a força estimada do adversário.')}</div>
            </div>
          )}
        </div>
      )}
      <div className="card"><h3>🧾 {t('Partido e candidatura')}</h3><ActionMenu g={g} group="politica" /></div>
      {p?.campaign && <div className="card"><h3>📣 {t('Campanha')}</h3><ActionMenu g={g} group="campanha" /></div>}
      {p && p.office >= 0 && <div className="card"><h3>🏛️ {t('Mandato')}</h3><ActionMenu g={g} group="mandato" /></div>}
      <p className="small faint">{LAWS.length} {t('leis disponíveis, com efeitos reais em impostos, saúde, educação, segurança e economia.')}</p>
    </>
  );
}

function Music({ g }: { g: GameState }) {
  const m = music(g);
  return (
    <>
      {m && (
        <div className="card">
          <h3>🎸 {t(INSTRUMENTS.find((i) => i.id === m.instrument)!.name)}</h3>
          <div className="stat-label"><span>{t('Nível')}</span><b>{Math.round(m.skill)}</b></div>
          <Bar value={m.skill} color="var(--accent)" />
          <Row label={t('Banda')}>{m.band ?? '—'}</Row>
          <Row label={t('Álbuns')}>{m.albums}</Row>
          <Row label={t('Fãs')}>{fmtNum(m.fans)}</Row>
          <Row label={t('Gravadora')}>{m.label ? '✅' : '—'}</Row>
        </div>
      )}
      <div className="card"><h3>🎶 {t('Carreira musical')}</h3><ActionMenu g={g} group="banda" /></div>
    </>
  );
}

function Acting({ g }: { g: GameState }) {
  const a = acting(g);
  return (
    <>
      {a && (
        <div className="card">
          <h3>🎬 {t('Atuação')}</h3>
          <div className="stat-label"><span>{t('Nível')}</span><b>{Math.round(a.skill)}</b></div>
          <Bar value={a.skill} color="var(--accent)" />
          <div className="stat-label" style={{ marginTop: 8 }}><span>{t('Fama')}</span><b>{Math.round(a.fame)}</b></div>
          <Bar value={a.fame} color="var(--gold)" />
          <Row label={t('Agente')}>{a.agent ? '✅' : '—'}</Row>
          <Row label={t('Papéis')}>{a.roles}</Row>
          <Row label={t('Prêmios')}>{a.awards}</Row>
        </div>
      )}
      <div className="card"><h3>🎞️ {t('Carreira de ator')}</h3><ActionMenu g={g} group="cinema" /></div>
    </>
  );
}

function Sport({ g }: { g: GameState }) {
  const s = sport(g);
  return (
    <>
      {s && (
        <div className="card">
          <h3>🏅 {t(SPORTS.find((x) => x.id === s.sport)!.name)}</h3>
          <div className="stat-label"><span>{t('Nível')}</span><b>{Math.round(s.skill)}</b></div>
          <Bar value={s.skill} color="var(--good)" />
          <Row label={t('Time')}>{s.team ?? '—'}</Row>
          <Row label={t('Categoria')}>{s.team ? t(TIER_NAMES[s.tier]) : '—'}</Row>
          <Row label={t('Salário')}>{s.team ? `${formatMoney(s.salary)}/${t('mês')}` : '—'}</Row>
          <Row label={t('Títulos')}>{s.titles}</Row>
          {s.injured > 0 && <div className="insight bad" style={{ marginTop: 8 }}><span>🩼</span><span>{t('Machucado: {n} meses fora.', { n: s.injured })}</span></div>}
        </div>
      )}
      <div className="card"><h3>🏟️ {t('Carreira esportiva')}</h3><ActionMenu g={g} group="atletismo" /></div>
    </>
  );
}

function Space({ g }: { g: GameState }) {
  const s = space(g);
  return (
    <>
      {s && (
        <div className="card">
          <h3>🧑‍🚀 {t('Programa espacial')}</h3>
          <Row label={t('Fase')}>{s.stage === 1 ? t('Treinamento') : t('Astronauta ativo')}</Row>
          {s.stage === 1 && <Row label={t('Restam')}>{tp(s.trainingLeft, '{n} mês', '{n} meses')}</Row>}
          <Row label={t('Missões')}>{s.missions}</Row>
        </div>
      )}
      <div className="card"><h3>🚀 {t('Agência espacial')}</h3><ActionMenu g={g} group="nasa" /></div>
    </>
  );
}

export function SpecialCareers({ g }: { g: GameState }) {
  const [open, setOpen] = useState<Kind | null>(null);
  const age = Math.floor((g.t - g.player.birth) / 12);
  const list = KINDS.filter((k) => age >= k.minAge);
  if (!list.length) return null;
  const body = { politica: Politics, musica: Music, atuacao: Acting, esporte: Sport, espaco: Space };
  const Body = open ? body[open] : null;
  const k = KINDS.find((x) => x.id === open);
  return (
    <>
      <div className="card">
        <h3>🌟 {t('Carreiras especiais')}</h3>
        <div className="actions">
          {list.map((x) => (
            <button key={x.id} className="action" onClick={() => setOpen(x.id)}>
              <span className="action-ic">{x.icon}</span>
              <span className="grow" style={{ textAlign: 'left' }}><b>{t(x.name)}</b><span className="small muted" style={{ display: 'block' }}>{x.status(g)}</span></span>
              <span className="muted">›</span>
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {open && Body && k && (
          <motion.div className="sheet-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)}>
            <motion.div className="sheet" initial={{ y: 80 }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 26, stiffness: 300 }} onClick={(e) => e.stopPropagation()}>
              <div className="row" style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 28 }}>{k.icon}</span>
                <div className="grow hud-name">{t(k.name)}</div>
                <button className="icon-btn" onClick={() => setOpen(null)} aria-label={t('Fechar')}>✕</button>
              </div>
              <Body g={g} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
