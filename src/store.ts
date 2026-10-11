import { create } from 'zustand';
import { getLang, loadLang, saveLang, setLang, type Lang } from './i18n';
import { setWorld } from './sim/core';
import { ensureMarket } from './sim/systems/market';
import { setPremium as godSetPremium } from './sim/systems/god';
import { ensureLife } from './sim/systems/lifestate';
import { ensureShop, type CartLine } from './sim/systems/shop';
import { act, advance, choose, continueAsHeir, newGame, type NewGameOptions } from './sim/game';
import { autoAgenda } from './sim/systems/casual';
import type { ActivityId, Deltas, GameState } from './sim/types';

const SAVE_KEY = 'nextlife.save.v1';

export type Tab = 'vida' | 'rotina' | 'carreira' | 'empresa' | 'celular' | 'pessoas';
export type App = 'bolsa' | 'loja' | 'viagens' | 'lazer' | 'saude' | 'cassino' | 'rua' | 'pets' | 'ajustes' | null;

interface Store {
  game: GameState | null;
  /** Variações do último passo, para animações de feedback. */
  pulse: { deltas: Deltas; n: number } | null;
  toast: { text: string; n: number } | null;
  playing: boolean;
  speed: 1 | 2 | 3;
  tab: Tab;
  app: App;
  /** Fitas conquistadas ao longo de todas as vidas. */
  ribbons: Record<string, number>;
  /** Modo Destino desbloqueado (guardado no aparelho). */
  premium: boolean;
  lang: Lang;
  /** Modo casual (UI simplificada) e piloto automático da rotina; guardados no aparelho. */
  casual: boolean;
  autopilot: boolean;
  /** Tutorial: fora da simulação. `open` = visível agora; `seen` = já concluído/pulado. */
  tutorial: { open: boolean; step: number; seen: boolean };
  setCasual: (on: boolean) => void;
  applyAutopilot: () => void;
  setAutopilot: (on: boolean) => void;
  openTutorial: () => void;
  setTutorialStep: (n: number) => void;
  closeTutorial: () => void;
  cart: CartLine[];
  start: (opts: NewGameOptions) => void;
  advance: () => void;
  choose: (index: number) => void;
  dismissResult: () => void;
  run: <T extends unknown[]>(fn: (g: GameState, ...args: T) => string | void, ...args: T) => void;
  setAgenda: (id: ActivityId, hours: number) => void;
  setPlaying: (v: boolean) => void;
  setSpeed: (v: 1 | 2 | 3) => void;
  setTab: (t: Tab) => void;
  setApp: (a: App) => void;
  setLanguage: (l: Lang) => void;
  setPremium: (on: boolean) => void;
  addToCart: (ref: string, qty?: number) => void;
  setCartQty: (ref: string, qty: number) => void;
  removeFromCart: (ref: string) => void;
  clearCart: () => void;
  continueHeir: (id: string) => void;
  quit: () => void;
}

function diff(a: GameState, b: GameState): Deltas {
  const d: Deltas = {};
  for (const k of Object.keys(b.player.stats) as (keyof GameState['player']['stats'])[]) {
    const v = b.player.stats[k] - a.player.stats[k];
    if (Math.abs(v) >= 0.5) d[k] = v;
  }
  const m = b.money - a.money;
  if (Math.abs(m) >= 1) d.dinheiro = m;
  return d;
}

function loadSave(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const g = JSON.parse(raw) as GameState;
    if (g.version !== 1) return null;
    // Saves antigos (antes do mundo real) viram brasileiros.
    if (!g.country) {
      g.country = 'br';
      g.city = 'São Paulo';
      g.birthCountry = 'br';
    }
    ensureMarket(g);
    ensureShop(g);
    ensureLife(g);
    g.minigame ??= null;
    return g;
  } catch {
    return null;
  }
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
function persist(g: GameState | null) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      if (g) localStorage.setItem(SAVE_KEY, JSON.stringify(g));
      else localStorage.removeItem(SAVE_KEY);
    } catch {
      /* armazenamento indisponível: o jogo segue sem save */
    }
  }, 300);
}

const PREMIUM_KEY = 'nextlife.premium';
function loadPremium(): boolean {
  try {
    return localStorage.getItem(PREMIUM_KEY) === '1';
  } catch {
    return false;
  }
}

const RIBBON_KEY = 'nextlife.ribbons';
function loadRibbons(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(RIBBON_KEY) ?? '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

const CASUAL_KEY = 'nextlife.casual';
const AUTOPILOT_KEY = 'nextlife.autopilot';
const TUTORIAL_KEY = 'nextlife.tutorial.seen';
function loadFlag(key: string, def: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === null ? def : v === '1';
  } catch {
    return def;
  }
}
function saveFlag(key: string, on: boolean) {
  try {
    localStorage.setItem(key, on ? '1' : '0');
  } catch {
    /* sem armazenamento */
  }
}

export const hasSave = () => loadSave() !== null;

setLang(loadLang());

export const useGame = create<Store>((set, get) => {
  let n = 0;
  const commit = (prev: GameState | null, next: GameState, extra: Partial<Store> = {}) => {
    n += 1;
    const deltas = prev ? diff(prev, next) : {};
    // Ao morrer, as fitas da vida entram na coleção.
    let ribbons = get().ribbons;
    if (next.dead && !prev?.dead && next.dead.ribbons?.length) {
      ribbons = { ...ribbons };
      for (const id of next.dead.ribbons) ribbons[id] = (ribbons[id] ?? 0) + 1;
      try {
        localStorage.setItem(RIBBON_KEY, JSON.stringify(ribbons));
      } catch {
        /* sem armazenamento */
      }
    }
    set({ game: next, ribbons, pulse: Object.keys(deltas).length ? { deltas, n } : get().pulse, ...extra });
    persist(next);
  };

  return {
    game: loadSave(),
    pulse: null,
    toast: null,
    playing: false,
    speed: 1,
    tab: 'vida',
    app: null,
    ribbons: loadRibbons(),
    premium: loadPremium(),
    lang: getLang(),
    casual: loadFlag(CASUAL_KEY, false),
    autopilot: loadFlag(AUTOPILOT_KEY, true),
    tutorial: { open: false, step: 0, seen: loadFlag(TUTORIAL_KEY, false) },
    cart: [],

    setCasual: (on) => {
      saveFlag(CASUAL_KEY, on);
      set({ casual: on });
      if (on && get().autopilot) get().applyAutopilot();
    },
    setAutopilot: (on) => {
      saveFlag(AUTOPILOT_KEY, on);
      set({ autopilot: on });
      if (on && get().casual) get().applyAutopilot();
    },
    applyAutopilot: () => {
      const g = get().game;
      if (!g || g.dead) return;
      const next = { ...g, agenda: autoAgenda(g) };
      set({ game: next });
      persist(next);
    },
    openTutorial: () => set((s) => ({ tutorial: { ...s.tutorial, open: true, step: 0 } })),
    setTutorialStep: (n) => set((s) => ({ tutorial: { ...s.tutorial, step: n } })),
    closeTutorial: () => {
      saveFlag(TUTORIAL_KEY, true);
      set((s) => ({ tutorial: { ...s.tutorial, open: false, seen: true } }));
    },

    start: (opts) => {
      const g = newGame({ ...opts, premium: get().premium });
      set((s) => ({ game: g, playing: false, tab: 'vida', pulse: null, cart: [], app: null, tutorial: { open: !s.tutorial.seen, step: 0, seen: s.tutorial.seen } }));
      if (get().casual && get().autopilot) get().applyAutopilot();
      persist(get().game);
    },

    advance: () => {
      let g = get().game;
      if (!g || g.pending || g.lastResult || g.dead || g.minigame) return;
      if (get().casual && get().autopilot) g = { ...g, agenda: autoAgenda(g) };
      const next = advance(g);
      const stop = !!next.pending || !!next.dead;
      commit(g, next, stop ? { playing: false } : {});
      if (next.pending) navigator.vibrate?.(20);
    },

    choose: (index) => {
      const g = get().game;
      if (!g?.pending) return;
      commit(g, choose(g, index));
    },

    dismissResult: () => {
      const g = get().game;
      if (!g?.lastResult) return;
      const next = { ...g, lastResult: null };
      set({ game: next });
      persist(next);
    },

    run: (fn, ...args) => {
      const g = get().game;
      if (!g || g.dead) return;
      const { state, message } = act(g, fn, ...args);
      n += 1;
      commit(g, state, message ? { toast: { text: message, n } } : {});
    },

    setAgenda: (id, hours) => {
      const g = get().game;
      if (!g) return;
      const next = { ...g, agenda: { ...g.agenda, [id]: Math.max(0, Math.round(hours)) } };
      set({ game: next });
      persist(next);
    },

    setPlaying: (v) => set({ playing: v }),
    setSpeed: (v) => set({ speed: v }),
    setTab: (t) => set({ tab: t }),
    setApp: (a) => set({ app: a }),
    setPremium: (on) => {
      try {
        localStorage.setItem(PREMIUM_KEY, on ? '1' : '0');
      } catch {
        /* sem armazenamento */
      }
      set({ premium: on });
      const g = get().game;
      if (g) get().run(godSetPremium, on);
    },
    setLanguage: (l) => {
      setLang(l);
      saveLang(l);
      set({ lang: l });
    },
    addToCart: (ref, qty = 1) =>
      set((s) => {
        const found = s.cart.find((l) => l.ref === ref);
        return { cart: found ? s.cart.map((l) => (l.ref === ref ? { ...l, qty: l.qty + qty } : l)) : [...s.cart, { ref, qty }] };
      }),
    setCartQty: (ref, qty) => set((s) => ({ cart: qty <= 0 ? s.cart.filter((l) => l.ref !== ref) : s.cart.map((l) => (l.ref === ref ? { ...l, qty } : l)) })),
    removeFromCart: (ref) => set((s) => ({ cart: s.cart.filter((l) => l.ref !== ref) })),
    clearCart: () => set({ cart: [] }),

    continueHeir: (id) => {
      const g = get().game;
      if (!g) return;
      const next = continueAsHeir(g, id);
      set({ game: next, playing: false, tab: 'vida', pulse: null, cart: [], app: null });
      persist(next);
    },

    quit: () => {
      set({ game: null, playing: false, pulse: null });
      persist(null);
    },
  };
});

// A formatação de dinheiro depende do lugar onde o jogador vive. Registrado antes de qualquer componente.
const initial = useGame.getState().game;
if (initial) setWorld(initial);
useGame.subscribe((s, prev) => {
  if (s.game && s.game !== prev.game) setWorld(s.game);
});
