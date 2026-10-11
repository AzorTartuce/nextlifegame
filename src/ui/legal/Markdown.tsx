import type { ReactNode } from 'react';

/** Renderizador mínimo de Markdown (títulos, listas, citações, **negrito**) para os textos legais. */
function inline(s: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : p));
}

export function Markdown({ src }: { src: string }) {
  const out: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (!list.length) return;
    const items = list;
    out.push(<ul key={`u${out.length}`} style={{ margin: '4px 0 10px', paddingLeft: 20 }}>{items.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>);
    list = [];
  };
  for (const raw of src.split('\n')) {
    const line = raw.trimEnd();
    if (line.startsWith('- ')) { list.push(line.slice(2)); continue; }
    flush();
    if (!line.trim()) continue;
    if (line.startsWith('# ')) out.push(<h2 key={out.length} style={{ margin: '0 0 8px' }}>{line.slice(2)}</h2>);
    else if (line.startsWith('## ')) out.push(<h3 key={out.length} style={{ margin: '14px 0 4px' }}>{line.slice(3)}</h3>);
    else if (line.startsWith('> ')) out.push(<p key={out.length} className="small" style={{ margin: '0 0 10px', padding: '6px 10px', borderLeft: '3px solid currentColor', opacity: 0.8 }}>{inline(line.slice(2))}</p>);
    else out.push(<p key={out.length} className="small" style={{ margin: '0 0 8px', lineHeight: 1.5 }}>{inline(line)}</p>);
  }
  flush();
  return <>{out}</>;
}
