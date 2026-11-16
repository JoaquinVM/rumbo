// Layer 5 · Presentation: the small pieces every screen uses (docs/DISENO.md, Piezas).
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { iconoDe } from '../modelos/iconos';

// A stroke icon, 20 px, white on its square.
export function Icono({ nombre, tam = 20 }: { nombre: string; tam?: number }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: iconoDe(nombre) }} />
  );
}

// The 40 px square of a row, in the color of its category.
export function Cuadrito({ icono, color }: { icono: string; color: string }) {
  return <span className="dt" style={{ background: color }}><Icono nombre={icono} /></span>;
}

// A sheet from the bottom: tapping outside or Escape closes it.
export function Hoja({ alCerrar, children }: { alCerrar: () => void; children: ReactNode }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent): void => { if (e.key === 'Escape') alCerrar(); };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [alCerrar]);
  return (
    <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget) alCerrar(); }}>
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="grab" />
        {children}
      </div>
    </div>
  );
}

// A button that asks for a second tap before doing something that cannot be undone (MOV-04).
export function BotonDosToques({ className, texto, armado, alConfirmar }: { className: string; texto: string; armado: string; alConfirmar: () => void }) {
  const [listo, setListo] = useState(false);
  return (
    <button type="button" className={className} onClick={() => (listo ? alConfirmar() : setListo(true))}>
      {listo ? armado : texto}
    </button>
  );
}

// The short message at the bottom, gone after 2,6 s.
export function useAviso(): [ReactNode, (texto: string) => void] {
  const [aviso, setAviso] = useState<{ texto: string; n: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mostrar = (texto: string): void => {
    if (timer.current) clearTimeout(timer.current);
    setAviso((a) => ({ texto, n: (a?.n ?? 0) + 1 }));
    timer.current = setTimeout(() => setAviso(null), 2600);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return [aviso ? <div key={aviso.n} className="toast" role="status">{aviso.texto}</div> : null, mostrar];
}
