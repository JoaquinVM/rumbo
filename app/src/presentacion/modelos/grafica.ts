// PRO-01: the projection chart, the v1's chartSVG as plain shapes for React to draw. The series come in cents and are
// drawn in Bs, so the scale and labels are the v1's.
import { compacto, MESES, mesCorto } from './formato';

export interface SerieGrafica { datos: number[]; color: string; relleno?: boolean; punteada?: boolean; ancho?: number }
export type MarcaDibujo = { tipo: 'linea'; x: number; texto: string; xTexto: number } | { tipo: 'meta'; x: number; texto: string };
export interface Grafica {
  ancho: number;
  alto: number;
  izquierda: number;
  derecha: number;
  arriba: number;
  base: number; // y of the bottom of the plot
  guias: { y: number; cero: boolean; texto: string }[];
  etiquetas: { x: number; texto: string; ancla: 'start' | 'middle' | 'end' }[];
  marcas: MarcaDibujo[];
  series: { puntos: string; color: string; ancho: number; punteada: boolean; relleno: string | null; fin: { x: number; y: number } }[];
}

export type MarcaEntrada = { tipo: 'prestamo'; indice: number; fin: string; nombre: string } | { tipo: 'meta'; indice: number; nombre: string };

export function grafica(series: SerieGrafica[], meses: number, hoy: string, marcas: MarcaEntrada[]): Grafica {
  const W = 600, H = 250, L = 56, R = 14, T = 16, B = 30;
  const enBs = series.map((s) => ({ ...s, datos: s.datos.map((v) => v / 100) }));
  const todos = enBs.flatMap((s) => s.datos);
  let lo = Math.min(0, ...todos), hi = Math.max(0, ...todos);
  if (hi === lo) hi = lo + 1;
  const raw = (hi - lo) / 4, p = Math.pow(10, Math.floor(Math.log10(raw || 1))), f = raw / p;
  const paso = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
  lo = Math.floor(lo / paso) * paso;
  hi = Math.ceil(hi / paso) * paso;
  const x = (i: number): number => L + ((W - L - R) * i) / meses, y = (v: number): number => T + ((H - T - B) * (hi - v)) / (hi - lo);

  const guias: Grafica['guias'] = [];
  for (let v = lo; v <= hi + paso / 2; v += paso) guias.push({ y: y(v), cero: Math.abs(v) < 1e-9, texto: compacto(v) });

  const etiquetas: Grafica['etiquetas'] = [];
  const anios = meses / 12, cada = anios <= 1 ? 0.25 : anios <= 5 ? 1 : anios <= 10 ? 2 : 5;
  const [y0 = 0, m0 = 1] = hoy.split('-').map(Number);
  for (let a = 0; a <= anios + 1e-9; a += cada) {
    const i = Math.round(a * 12), t = m0 - 1 + i, anio = y0 + Math.floor(t / 12), mes = ((t % 12) + 12) % 12;
    const texto = a === 0 ? 'Hoy' : anios <= 1 ? MESES[mes]! : String(anio);
    etiquetas.push({ x: x(i), texto, ancla: a === 0 ? 'start' : i === meses ? 'end' : 'middle' });
  }

  const dibujadas: MarcaDibujo[] = [];
  for (const mk of marcas) {
    if (!(mk.indice > 0 && mk.indice <= meses)) continue;
    if (mk.tipo === 'prestamo') {
      const quien = mk.nombre.toLowerCase().startsWith('préstamo') ? 'el préstamo' : mk.nombre;
      dibujadas.push({ tipo: 'linea', x: x(mk.indice), texto: `${mesCorto(mk.fin)} · terminas ${quien}`, xTexto: Math.min(x(mk.indice) + 5, W - 160) });
    } else dibujadas.push({ tipo: 'meta', x: x(mk.indice), texto: mk.nombre });
  }

  return {
    ancho: W, alto: H, izquierda: L, derecha: W - R, arriba: T, base: H - B, guias, etiquetas, marcas: dibujadas,
    series: enBs.map((s) => {
      const puntos = s.datos.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
      return {
        puntos, color: s.color, ancho: s.ancho ?? 3, punteada: !!s.punteada,
        relleno: s.relleno ? `${x(0)},${y(Math.max(lo, 0))} ${puntos} ${x(meses)},${y(Math.max(lo, 0))}` : null,
        fin: { x: x(meses), y: y(s.datos[meses] ?? 0) },
      };
    }),
  };
}
