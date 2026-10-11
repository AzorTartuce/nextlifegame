import { useEffect, useMemo, useState } from 'react';
import type { GameState } from '../sim/types';
import { hasSave, useGame, type Tab } from '../store';
import { EventScene, Toast } from './components/EventScene';
import { Ambitions, Feed } from './components/Feed';
import { Hud, Profile } from './components/Hud';
import { TimeBar } from './components/TimeBar';
import { useMediaQuery } from './hooks';
import { AgendaPanel } from './panels/AgendaPanel';
import { CareerPanel } from './panels/CareerPanel';
import { CompanyPanel } from './panels/CompanyPanel';
import { RelationsPanel } from './panels/RelationsPanel';
import { PhonePanel } from './panels/PhonePanel';
import { MinigameHost } from './minigames/MinigameHost';
import { DeathScreen, NewGameScreen } from './screens';
import { hasSavedLang, t } from '../i18n';
import { CasualRoutine } from './tutorial/Casual';
import { Tutorial } from './tutorial/Tutorial';
import { AgeGate } from './legal/Legal';
import { hasConfirmedAge } from './legal/docs';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'vida', icon: '📜', label: 'Vida' },
  { id: 'rotina', icon: '🗓️', label: 'Rotina' },
  { id: 'carreira', icon: '💼', label: 'Carreira' },
  { id: 'empresa', icon: '🏢', label: 'Empresa' },
  { id: 'celular', icon: '📱', label: 'Celular' },
  { id: 'pessoas', icon: '🫂', label: 'Pessoas' },
];

function Sky({ g }: { g: GameState | null }) {
  // Matiz do céu acompanha as estações e o humor.
  useEffect(() => {
    if (!g) return;
    const season = [210, 220, 250, 270, 290, 300, 320, 20, 35, 200, 190, 200][g.t % 12];
    const mood = g.player.stats.felicidade;
    document.documentElement.style.setProperty('--hue', String(mood < 30 ? 230 : season));
  }, [g?.t, g?.player.stats.felicidade]);
  const stars = useMemo(
    () => Array.from({ length: 18 }, (_, i) => ({ left: `${(i * 53) % 100}%`, dur: `${18 + (i % 7) * 6}s`, delay: `${-i * 3.1}s` })),
    [],
  );
  return (
    <div className="sky">
      {stars.map((s, i) => <i key={i} style={{ left: s.left, animationDuration: s.dur, animationDelay: s.delay }} />)}
    </div>
  );
}

function Panel({ tab, g }: { tab: Tab; g: GameState }) {
  const casual = useGame((s) => s.casual);
  switch (tab) {
    case 'rotina': return casual ? <CasualRoutine g={g} /> : <AgendaPanel g={g} />;
    case 'carreira': return <CareerPanel g={g} />;
    case 'empresa': return <CompanyPanel g={g} />;
    case 'celular': return <PhonePanel g={g} />;
    case 'pessoas': return <RelationsPanel g={g} />;
    default: return (
      <>
        <Ambitions g={g} />
        <div style={{ height: 12 }} />
        <Feed g={g} />
      </>
    );
  }
}

function Nav({ g, tab, setTab, tabs }: { g: GameState; tab: Tab; setTab: (t: Tab) => void; tabs: typeof TABS }) {
  const alertCompany = (g.company?.cash ?? 0) < 0;
  return (
    <nav className="nav" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
      {tabs.map((tb) => (
        <button key={tb.id} className={tab === tb.id ? 'on' : ''} onClick={() => setTab(tb.id)}>
          <span className="ic">{tb.icon}</span>
          {t(tb.label)}
          {tb.id === 'empresa' && alertCompany && <span className="dot" />}
        </button>
      ))}
    </nav>
  );
}

function Game({ g }: { g: GameState }) {
  const { tab, setTab, casual } = useGame();
  // Modo casual: Empresa só aparece na barra quando já existe uma (ou está aberta); o resto fica em Celular > Mais.
  const shownTabs = casual ? TABS.filter((tb) => tb.id !== 'empresa' || g.company || tab === 'empresa') : TABS;
  const wide = useMediaQuery('(min-width: 1000px)');
  const sideTab = tab === 'vida' ? 'rotina' : tab;

  if (wide) {
    const side = shownTabs.filter((tb) => tb.id !== 'vida');
    return (
      <div className={`app wide${casual ? ' casual' : ''}`}>
        <div className="col col-left">
          <Profile g={g} />
          <Ambitions g={g} />
        </div>
        <div className="col col-panel">
          <div className="tabs">
            {side.map((tb) => (
              <button key={tb.id} className={sideTab === tb.id ? 'on' : ''} onClick={() => setTab(tb.id)}>
                {tb.icon} {t(tb.label)}
              </button>
            ))}
          </div>
          <div className="col scroll" style={{ flex: 1 }}>
            <Panel tab={sideTab} g={g} />
          </div>
        </div>
        <div className="col-feed">
          <div className="year-sep" style={{ margin: '0 4px 8px' }}>{t('📜 Linha da vida')}</div>
          <div className="col scroll" style={{ flex: 1 }}>
            <Feed g={g} limit={120} />
          </div>
        </div>
        <TimeBar g={g} />
        <EventScene g={g} />
        <MinigameHost g={g} />
        {g.dead && <DeathScreen g={g} />}
        <Toast />
        <Tutorial g={g} />
      </div>
    );
  }

  return (
    <div className={`app${casual ? ' casual' : ''}`}>
      <Hud g={g} />
      <div className="scroll">
        <Panel tab={tab} g={g} />
      </div>
      <TimeBar g={g} />
      <Nav g={g} tab={tab} setTab={setTab} tabs={shownTabs} />
      <EventScene g={g} />
      <MinigameHost g={g} />
      {g.dead && <DeathScreen g={g} />}
      <Toast />
      <Tutorial g={g} />
    </div>
  );
}

function LanguageGate({ onPick }: { onPick: () => void }) {
  const setLanguage = useGame((s) => s.setLanguage);
  const pick = (l: 'pt' | 'en') => {
    setLanguage(l);
    onPick();
  };
  return (
    <div className="screen">
      <div className="screen-card" style={{ textAlign: 'center' }}>
        <h1 className="logo">NextLife</h1>
        <p className="tagline">Escolha o idioma · Choose your language</p>
        <div className="card" style={{ display: 'grid', gap: 10 }}>
          <button className="btn primary" onClick={() => pick('pt')}><span className="e">🇧🇷</span> Português</button>
          <button className="btn primary" onClick={() => pick('en')}><span className="e">🇺🇸</span> English</button>
        </div>
      </div>
    </div>
  );
}

export function App() {
  const game = useGame((s) => s.game);
  const lang = useGame((s) => s.lang);
  const [langChosen, setLangChosen] = useState(() => hasSavedLang());
  // Um save existente abre direto no menu, com opção de continuar.
  const [inMenu, setInMenu] = useState(() => hasSave());
  const showMenu = !game || inMenu;
  const [ageOk, setAgeOk] = useState(() => hasConfirmedAge());
  if (!langChosen) return <LanguageGate onPick={() => setLangChosen(true)} />;
  if (!ageOk) return <AgeGate onAccept={() => setAgeOk(true)} />;
  return (
    <div key={lang} style={{ display: 'contents' }}>
      <Sky g={showMenu ? null : game} />
      {showMenu ? (
        <NewGameScreen
          canContinue={!!game}
          onContinue={() => setInMenu(false)}
          key={game ? 'with-save' : 'fresh'}
        />
      ) : (
        <Game g={game!} />
      )}
    </div>
  );
}
