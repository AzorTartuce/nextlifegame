import { motion } from 'motion/react';
import type { ComponentType } from 'react';
import { t } from '../../i18n';
import { finishMinigame } from '../../sim/systems/actions';
import type { GameState, MinigameResult } from '../../sim/types';
import { useGame } from '../../store';
import { Grid } from './Grid';
import { Livro } from './Livro';
import { Sinais } from './Sinais';

interface MiniProps {
  level: number;
  onDone: (r: MinigameResult) => void;
}

export const MINIGAMES: Record<string, { title: string; icon: string; Component: ComponentType<MiniProps> }> = {
  livro: { title: 'Ler um livro', icon: '📖', Component: Livro },
  sinais: { title: 'Teste de trânsito', icon: '🚦', Component: Sinais },
  assalto: { title: 'Assalto', icon: '🏠', Component: (p) => <Grid mode="assalto" {...p} /> },
  fuga: { title: 'Fuga da prisão', icon: '🏃', Component: (p) => <Grid mode="fuga" {...p} /> },
};

export function registerMinigame(id: string, def: (typeof MINIGAMES)[string]) {
  MINIGAMES[id] = def;
}

/** Tela cheia que hospeda o minigame aberto pelo simulador e devolve o resultado. */
export function MinigameHost({ g }: { g: GameState }) {
  const run = useGame((s) => s.run);
  const mg = g.minigame;
  if (!mg) return null;
  const def = MINIGAMES[mg.id];
  if (!def) return null;
  const done = (r: MinigameResult) => run(finishMinigame, r);
  const { Component } = def;
  return (
    <motion.div className="overlay" style={{ zIndex: 55 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className="scene" initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} style={{ padding: 18 }}>
        <div className="row" style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 28 }}>{def.icon}</span>
          <h2 className="scene-title grow" style={{ margin: 0 }}>{t(def.title)}</h2>
          <button className="btn sm" onClick={() => done({ score: 0, max: 1, win: false, cancelled: true })}>{t('Desistir')}</button>
        </div>
        <Component key={`${mg.id}-${g.t}`} level={mg.level} onDone={done} />
      </motion.div>
    </motion.div>
  );
}
