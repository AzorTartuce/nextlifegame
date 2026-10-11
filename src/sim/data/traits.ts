export interface TraitDef {
  id: string;
  m: string;
  f: string;
  icon: string;
  desc: string;
}

export const TRAITS: TraitDef[] = [
  { id: 'ambicioso', m: 'Ambicioso', f: 'Ambiciosa', icon: '🚀', desc: 'Rende mais no trabalho, mas se estressa mais.' },
  { id: 'preguicoso', m: 'Preguiçoso', f: 'Preguiçosa', icon: '🛋️', desc: 'Menos estresse, menos desempenho.' },
  { id: 'genio', m: 'Gênio', f: 'Gênia', icon: '🧠', desc: 'Aprende 30% mais rápido.' },
  { id: 'sociavel', m: 'Sociável', f: 'Sociável', icon: '🎉', desc: 'Faz amigos fácil e ganha carisma mais rápido.' },
  { id: 'ansioso', m: 'Ansioso', f: 'Ansiosa', icon: '😰', desc: 'O estresse sobe mais rápido.' },
  { id: 'atletico', m: 'Atlético', f: 'Atlética', icon: '🏃', desc: 'Exercício rende o dobro.' },
  { id: 'criativo', m: 'Criativo', f: 'Criativa', icon: '🎨', desc: 'Empresas fundadas têm mais qualidade.' },
  { id: 'generoso', m: 'Generoso', f: 'Generosa', icon: '🤝', desc: 'Relações melhoram mais rápido.' },
];

export const traitById = (id: string) => TRAITS.find((t) => t.id === id)!;
