import { t, tp } from '../../i18n';
import { formatMoney } from '../../sim/core';
import { carePet, petAge, petKind, type PetCare } from '../../sim/systems/pets';
import type { GameState, Pet } from '../../sim/types';
import { useGame } from '../../store';
import { Bar } from '../components/bits';
import { ActionMenu } from '../components/ActionMenu';

function PetCard({ g, p }: { g: GameState; p: Pet }) {
  const run = useGame((s) => s.run);
  const k = petKind(p.kind);
  const age = petAge(g, p);
  const care = (c: PetCare) => run(carePet, p.id, c);
  return (
    <div className="item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div className="row">
        <span style={{ fontSize: 32 }}>{k.icon}</span>
        <div className="grow">
          <b>{p.name}</b> <span className="muted small">· {t(k.name)} · {age < 1 ? t('filhote') : tp(age, '{n} ano', '{n} anos')}</span>
          <div className="small faint">{t('Cuidados: {v}/mês', { v: formatMoney(k.upkeep) })}</div>
        </div>
      </div>
      <div className="grid2" style={{ marginTop: 8 }}>
        <div><div className="stat-label"><span>❤️ {t('Saúde')}</span><b>{Math.round(p.health)}</b></div><Bar value={p.health} color="var(--bad)" /></div>
        <div><div className="stat-label"><span>🤝 {t('Vínculo')}</span><b>{Math.round(p.bond)}</b></div><Bar value={p.bond} color="var(--gold)" /></div>
      </div>
      <div className="btn-row" style={{ marginTop: 8 }}>
        <button className="btn sm" onClick={() => care('brincar')}>🎾 {t('Brincar')}</button>
        <button className="btn sm" onClick={() => care('passear')}>🚶 {t('Passear')}</button>
        <button className="btn sm" disabled={g.money < k.vet} onClick={() => care('veterinario')}>🩺 {t('Veterinário')} · {formatMoney(k.vet, true)}</button>
        <button className="btn sm danger" onClick={() => confirm(t('Encaminhar {n} para adoção?', { n: p.name })) && care('adocao')}>{t('Doar')}</button>
      </div>
    </div>
  );
}

export function PetsPanel({ g }: { g: GameState }) {
  return (
    <>
      <div className="card">
        <h3>🐾 {t('Meus bichos')}</h3>
        {!g.life.pets.length && <div className="small muted">{t('Você ainda não tem bichos. Eles trazem alegria, menos estresse e algumas contas.')}</div>}
        {g.life.pets.map((p) => <PetCard key={p.id} g={g} p={p} />)}
      </div>
      <div className="card">
        <h3>🏠 {t('Adotar')}</h3>
        <ActionMenu g={g} group="pets" />
      </div>
    </>
  );
}
