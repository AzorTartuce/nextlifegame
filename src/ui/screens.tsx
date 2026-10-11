import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { ageYears, formatDate, formatMoney, fullName, genderTitle, localizeMoney, netWorth } from '../sim/core';
import { COUNTRIES, cityOf, countryById, type CountryDef } from '../sim/data/world';
import { heirs } from '../sim/game';
import { AMBITIONS } from '../sim/systems/ambitions';
import type { Attraction, Gender, GameState, Person } from '../sim/types';
import { useGame } from '../store';
import { TALENTS } from '../sim/systems/god';
import { fmtNum, t } from '../i18n';
import { Avatar } from './components/Avatar';
import { ScoreBlock } from './components/Ribbons';

const rand = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];

export function NewGameScreen({ canContinue, onContinue }: { canContinue: boolean; onContinue: () => void }) {
  const start = useGame((s) => s.start);
  const [gender, setGender] = useState<Gender>(Math.random() < 0.5 ? 'm' : 'f');
  const [country, setCountry] = useState<CountryDef>(() => countryById('br'));
  const [city, setCity] = useState(() => rand(countryById('br').cities).name);
  const [first, setFirst] = useState(() => rand(countryById('br').names[gender === 'm' ? 'm' : 'f']));
  const [last, setLast] = useState(() => rand(countryById('br').names.last));
  const [attraction, setAttraction] = useState<Attraction>(gender === 'm' ? 'f' : 'm');
  const [lookSeed, setLookSeed] = useState(() => Math.floor(Math.random() * 1e6));
  const premium = useGame((s) => s.premium);
  const lang = useGame((s) => s.lang);
  const setLanguage = useGame((s) => s.setLanguage);
  const [talent, setTalent] = useState('');

  const preview: Person = useMemo(() => ({
    id: 'preview', firstName: first, lastName: last, gender, birth: 0, alive: true, traits: [],
    stats: { saude: 80, felicidade: 80, inteligencia: 50, aparencia: 50, carisma: 50, estresse: 10 },
    look: { skin: lookSeed % 6, hair: (lookSeed >> 3) % 7, hairStyle: (lookSeed >> 6) % 5, eyes: 0, shirt: (lookSeed >> 9) % 8 },
  }), [first, last, gender, lookSeed]);

  const cityDef = cityOf(country, city);
  const firstJob = fmtNum(Math.round(1600 * cityDef.wage * country.k));

  const pickCountry = (c: CountryDef, g: Gender = gender) => {
    setCountry(c);
    setCity(rand(c.cities).name);
    setFirst(rand(g === 'm' ? c.names.m : c.names.f));
    setLast(rand(c.names.last));
  };
  const reroll = () => {
    setFirst(rand(gender === 'm' ? country.names.m : country.names.f));
    setLast(rand(country.names.last));
    setLookSeed(Math.floor(Math.random() * 1e6));
  };
  const pickGender = (g: Gender) => {
    setGender(g);
    setFirst(rand(g === 'm' ? country.names.m : country.names.f));
  };

  return (
    <div className="screen">
      <motion.div className="screen-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', damping: 20 }}>
        <div style={{ textAlign: 'right' }}>
          <button className="btn sm" onClick={() => setLanguage(lang === 'pt' ? 'en' : 'pt')} aria-label={t('Language')}>🌐 {lang === 'pt' ? t('English') : t('Português')}</button>
        </div>
        <h1 className="logo">{t('NextLife')}</h1>
        <p className="tagline">{t('Uma vida. Infinitas escolhas. O mundo inteiro te espera.')}</p>
        <div className="card">
          <div style={{ display: 'grid', placeItems: 'center', marginBottom: 8 }}>
            <motion.div key={lookSeed + gender} initial={{ scale: 0.6, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }}>
              <Avatar person={preview} age={28} size={120} mood={80} />
            </motion.div>
          </div>
          <div className="field">
            <label>{t('Onde você nasce')}</label>
            <div className="row">
              <select className="input" value={country.id} onChange={(e) => pickCountry(countryById(e.target.value))} aria-label={t('País')}>
                {COUNTRIES.map((c) => <option key={c.id} value={c.id}>{c.flag} {t(c.name)}</option>)}
              </select>
              <select className="input" value={city} onChange={(e) => setCity(e.target.value)} aria-label={t('Cidade')}>
                {country.cities.map((c) => <option key={c.name} value={c.name}>{t(c.name)}</option>)}
              </select>
              <button className="btn" onClick={() => pickCountry(rand(COUNTRIES))} aria-label={t('Lugar aleatório')} title={t('Lugar aleatório')}>🌍</button>
            </div>
            <div className="small faint">
              
              {t('Moeda:')} {country.currency.code.trim()}  {t('· primeiro emprego típico:')} {country.currency.symbol}{firstJob}{t('/mês')}
              {cityDef.cost > 1.1 ? t(' · cidade cara') : cityDef.cost < 0.9 ? t(' · cidade barata') : ''}
            </div>
          </div>
          <div className="field">
            <label>{t('Nome')}</label>
            <div className="row">
              <input className="input" value={first} onChange={(e) => setFirst(e.target.value)} maxLength={20} />
              <input className="input" value={last} onChange={(e) => setLast(e.target.value)} maxLength={20} />
              <button className="btn" onClick={reroll} aria-label={t('Aleatório')}>🎲</button>
            </div>
          </div>
          <div className="field">
            <label>{t('Sexo')}</label>
            <div className="seg">
              <button className={gender === 'f' ? 'on' : ''} onClick={() => pickGender('f')}><span className="e">👩</span>{t('Feminino')}</button>
              <button className={gender === 'm' ? 'on' : ''} onClick={() => pickGender('m')}><span className="e">👨</span>{t('Masculino')}</button>
            </div>
          </div>
          <div className="field">
            <label>{t('Se interessa por')}</label>
            <div className="seg">
              <button className={attraction === 'm' ? 'on' : ''} onClick={() => setAttraction('m')}>{t('Homens')}</button>
              <button className={attraction === 'f' ? 'on' : ''} onClick={() => setAttraction('f')}>{t('Mulheres')}</button>
              <button className={attraction === 'ambos' ? 'on' : ''} onClick={() => setAttraction('ambos')}>{t('Ambos')}</button>
            </div>
          </div>
          <div className="field">
            <label>⚡ {t('Talento ao nascer')} {!premium && '🔒'}</label>
            <select className="input" value={talent} disabled={!premium} onChange={(e) => setTalent(e.target.value)} aria-label={t('Talento ao nascer')}>
              <option value="">{premium ? t('Nenhum') : t('Modo Deus: desbloqueie em Ajustes')}</option>
              {TALENTS.map((x) => <option key={x.id} value={x.id}>{x.icon} {t(x.name)}</option>)}
            </select>
          </div>
          <button className="advance" style={{ width: '100%', marginTop: 6 }} disabled={!first.trim() || !last.trim()} onClick={() => { start({ firstName: first.trim(), lastName: last.trim(), gender, attraction, country: country.id, city, talent: premium && talent ? talent : undefined }); onContinue(); }}>
            
            {t('👶 Nascer em')} {city}
          </button>
          {canContinue && (
            <button className="btn block" style={{ marginTop: 10 }} onClick={onContinue}>
              
              {t('Continuar vida salva')}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function DeathScreen({ g }: { g: GameState }) {
  const { continueHeir, quit } = useGame();
  const age = ageYears(g);
  const kids = heirs(g);
  const done = AMBITIONS.filter((a) => g.ambitionsDone.includes(a.id));
  const highlights = g.feed.filter((f) => f.kind === 'milestone').slice(0, 6).reverse();
  return (
    <div className="overlay" style={{ overflowY: 'auto', alignItems: 'start' }}>
      <motion.div className="scene" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 22, delay: 0.3 }} style={{ margin: '24px 0' }}>
        <div className="scene-body tomb">
          <Avatar person={g.player} age={age} size={110} dead />
          <h2>{fullName(g.player)}</h2>
          <div className="muted" style={{ fontWeight: 700 }}>
            {formatDate(g.player.birth)} — {formatDate(g.t)} · {age}  {t('anos')}
          </div>
          <div className="faint small" style={{ marginTop: 4 }}>{t('Causa:')} {g.dead?.cause}</div>
          <div className="summary">
            <div className="fc"><div className="v">{formatMoney(netWorth(g), true)}</div><div className="l">{t('Patrimônio')}</div></div>
            <div className="fc"><div className="v">{kids.length}</div><div className="l">{t('Filhos vivos')}</div></div>
            <div className="fc"><div className="v">{done.length}</div><div className="l">{t('Ambições')}</div></div>
            <div className="fc"><div className="v">{g.generation}</div><div className="l">{t('Geração')}</div></div>
          </div>
          <ScoreBlock g={g} />
          {highlights.length > 0 && (
            <div style={{ textAlign: 'left', marginBottom: 14 }}>
              <div className="group-title" style={{ marginTop: 0 }}>{t('Momentos marcantes')}</div>
              {highlights.map((h) => (
                <div key={h.id} className="small" style={{ margin: '4px 0' }}>{h.icon} {h.text}</div>
              ))}
            </div>
          )}
          {done.length > 0 && (
            <div className="traits" style={{ marginBottom: 14 }}>
              {done.map((a) => <span className="trait" key={a.id}>{a.icon} {genderTitle(localizeMoney(t(a.text)), g.player.gender)}</span>)}
            </div>
          )}
          {kids.length > 0 && (
            <>
              <div className="group-title">{t('🌳 Continuar a dinastia como…')}</div>
              <div className="grid2">
                {kids.map((k) => (
                  <button key={k.id} className="pick" onClick={() => continueHeir(k.id)} style={{ justifyItems: 'center', textAlign: 'center' }}>
                    <Avatar person={k} age={ageYears(g, k)} size={56} mood={k.relation} />
                    <b>{k.firstName}</b>
                    <span className="small muted">{ageYears(g, k)}  {t('anos')}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          <button className="btn block" style={{ marginTop: 14 }} onClick={quit}>{t('✨ Começar uma nova vida')}</button>
        </div>
      </motion.div>
    </div>
  );
}
