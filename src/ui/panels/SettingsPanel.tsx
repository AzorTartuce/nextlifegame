import { t } from '../../i18n';
import type { GameState } from '../../sim/types';
import { useGame } from '../../store';
import { CasualToggle } from '../tutorial/Casual';
import { RibbonCollection } from '../components/Ribbons';
import { GodPanel } from './GodPanel';
import { LegalCard } from '../legal/Legal';

export function SettingsPanel({ g }: { g: GameState }) {
  const { lang, setLanguage, quit, premium, setPremium, openTutorial } = useGame();
  return (
    <>
      <div className="card">
        <h3>🌐 {t('Idioma')}</h3>
        <div className="seg">
          <button className={lang === 'pt' ? 'on' : ''} onClick={() => setLanguage('pt')}><span className="e">🇧🇷</span>{t('Português')}</button>
          <button className={lang === 'en' ? 'on' : ''} onClick={() => setLanguage('en')}><span className="e">🇺🇸</span>{t('English')}</button>
        </div>
        <p className="small faint" style={{ margin: '8px 0 0' }}>{t('O idioma vale para todo o jogo. Textos já escritos na linha da vida continuam no idioma em que foram criados.')}</p>
      </div>
      <CasualToggle />
      <div className="card">
        <h3>💡 {t('Tutorial')}</h3>
        <p className="small muted" style={{ margin: '0 0 10px' }}>{t('Dicas curtas apontando para as partes da tela. Você pode pular quando quiser.')}</p>
        <button className="btn block" onClick={() => openTutorial()}>{t('Rever o guia rápido')}</button>
      </div>
      <div className="card">
        <h3>⚡ {t('Modo Destino')} <span className="sub">{premium ? t('ativo') : t('premium')}</span></h3>
        {premium ? (
          <>
            <p className="small muted" style={{ margin: '0 0 10px' }}>{t('Edite atributos e traços de qualquer pessoa, inclusive os seus.')}</p>
            <GodPanel g={g} />
            <button className="btn sm danger" style={{ marginTop: 12 }} onClick={() => setPremium(false)}>{t('Desativar o Modo Destino')}</button>
          </>
        ) : (
          <>
            <p className="small muted" style={{ margin: '0 0 10px' }}>{t('Mexa no destino: edite atributos de qualquer pessoa e escolha um talento especial ao nascer. Recurso premium (nesta versão de teste, é grátis).')}</p>
            <button className="btn primary block" onClick={() => setPremium(true)}>🔓 {t('Desbloquear o Modo Destino')}</button>
          </>
        )}
      </div>
      <RibbonCollection />
      <LegalCard />
      <div className="card">
        <h3>♻️ {t('Vida')}</h3>
        <button className="btn danger block" onClick={() => confirm(t('Abandonar esta vida e começar outra?')) && quit()}>{t('Começar uma nova vida')}</button>
      </div>
    </>
  );
}
