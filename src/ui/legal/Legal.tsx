import { useState } from 'react';
import { getLang, t } from '../../i18n';
import { Markdown } from './Markdown';
import { LEGAL_TEXTS, confirmAge, type LegalDoc } from './docs';

/** Visualizador em tela cheia de um texto legal (no idioma atual). */
export function LegalViewer({ doc, onClose }: { doc: LegalDoc; onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', padding: 12 }}>
      <div className="card" style={{ width: 'min(640px, 100%)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <Markdown src={LEGAL_TEXTS[doc][getLang()]} />
        </div>
        <button className="btn primary block" style={{ marginTop: 10 }} onClick={onClose}>{t('Fechar')}</button>
      </div>
    </div>
  );
}

/** Cartão de Configurações com acesso à política de privacidade, termos e aviso de conteúdo. */
export function LegalCard() {
  const [open, setOpen] = useState<LegalDoc | null>(null);
  return (
    <div className="card">
      <h3>⚖️ {t('Legal')}</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        <button className="btn block" onClick={() => setOpen('privacy')}>{t('Política de Privacidade')}</button>
        <button className="btn block" onClick={() => setOpen('terms')}>{t('Termos de Uso')}</button>
        <button className="btn block" onClick={() => setOpen('notice')}>{t('Aviso de Conteúdo')}</button>
      </div>
      <p className="small faint" style={{ margin: '8px 0 0' }}>{t('Textos em rascunho, sujeitos a revisão jurídica.')}</p>
      {open && <LegalViewer doc={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

/** Tela de aviso de conteúdo adulto e confirmação de idade (primeira abertura, depois do idioma). */
export function AgeGate({ onAccept }: { onAccept: () => void }) {
  const [refused, setRefused] = useState(false);
  const [open, setOpen] = useState<LegalDoc | null>(null);
  if (refused) {
    return (
      <div className="screen">
        <div className="screen-card" style={{ textAlign: 'center' }}>
          <h1 className="logo">NextLife</h1>
          <div className="card">
            <p style={{ margin: '0 0 10px' }}>{t('Tudo bem! Este jogo é voltado a maiores de 18 anos, então não podemos continuar por aqui.')}</p>
            <p className="small muted" style={{ margin: '0 0 12px' }}>{t('Volte quando tiver a idade mínima. Se tocou sem querer, você pode voltar e confirmar.')}</p>
            <button className="btn block" onClick={() => setRefused(false)}>{t('Voltar')}</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="screen">
      <div className="screen-card">
        <h1 className="logo" style={{ textAlign: 'center' }}>NextLife</h1>
        <div className="card">
          <h3>🔞 {t('Conteúdo adulto')}</h3>
          <p className="small" style={{ margin: '0 0 8px' }}>{t('O NextLife é uma ficção com temas adultos: crimes e violência (inclusive assassinato), drogas e overdose, apostas simuladas, morte e referências românticas e sexuais leves.')}</p>
          <p className="small muted" style={{ margin: '0 0 8px' }}>{t('Os jogos de azar são simulados, sem dinheiro real. Notícias e empresas da bolsa são fictícias e ilustrativas, não são fatos nem recomendação de investimento.')}</p>
          <p className="small muted" style={{ margin: '0 0 12px' }}>{t('Ao continuar, você declara ter 18 anos ou mais e concorda com os Termos de Uso e a Política de Privacidade.')}</p>
          <div style={{ display: 'grid', gap: 8 }}>
            <button className="btn primary block" onClick={() => { confirmAge(); onAccept(); }}>{t('Tenho 18 anos ou mais')}</button>
            <button className="btn block" onClick={() => setRefused(true)}>{t('Não tenho 18 anos')}</button>
          </div>
          <p className="small faint" style={{ margin: '10px 0 0', textAlign: 'center' }}>
            <a href="#privacidade" onClick={(e) => { e.preventDefault(); setOpen('privacy'); }}>{t('Política de Privacidade')}</a>
            {' · '}
            <a href="#termos" onClick={(e) => { e.preventDefault(); setOpen('terms'); }}>{t('Termos de Uso')}</a>
            {' · '}
            <a href="#aviso" onClick={(e) => { e.preventDefault(); setOpen('notice'); }}>{t('Aviso de Conteúdo')}</a>
          </p>
        </div>
      </div>
      {open && <LegalViewer doc={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

/** Aviso fixo e discreto (bolsa, notícias, cassino). */
export function Disclaimer({ kind }: { kind: 'market' | 'casino' }) {
  return (
    <p className="small faint" role="note" style={{ margin: '8px 0', textAlign: 'center' }}>
      {kind === 'market'
        ? `ℹ️ ${t('Notícias e empresas são fictícias e ilustrativas: não são fatos nem recomendação de investimento.')}`
        : `🎰 ${t('Jogos de azar simulados, sem dinheiro real.')}`}
    </p>
  );
}
