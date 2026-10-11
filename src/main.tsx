import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useGame } from './store';
import { App } from './ui/App';
import './i18n/en';
import './styles.css';

// Atalho de depuração no console: __nl.getState()
if (import.meta.env.DEV) (window as unknown as { __nl: typeof useGame }).__nl = useGame;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
