// AJU-05: the main color. For each mode: block, soft, text on soft, text on the block and line on the background (the
// v1's PALETA). Blue is the default and needs no extra style.
export const PALETA: Record<string, { nombre: string; claro: string[]; oscuro: string[] }> = {
  azul: { nombre: 'Azul', claro: ['#2B47E0', '#DDE3FF', '#1C2E95', '#FFFFFF', '#2B47E0'], oscuro: ['#3F5BEA', '#232C55', '#C9D1FF', '#FFFFFF', '#3F5BEA'] },
  cielo: { nombre: 'Cielo', claro: ['#1A6FB8', '#D6E8F7', '#0E3F6B', '#FFFFFF', '#1A6FB8'], oscuro: ['#2474B8', '#1B3550', '#C4E0F7', '#FFFFFF', '#2474B8'] },
  morado: { nombre: 'Morado', claro: ['#6A3FCF', '#E6DDFB', '#3B1F86', '#FFFFFF', '#6A3FCF'], oscuro: ['#7550DA', '#2E2550', '#DCCFFF', '#FFFFFF', '#7550DA'] },
  rosa: { nombre: 'Rosa pastel', claro: ['#F4A6C8', '#FBDDEB', '#7D1655', '#5C1239', '#A3366B'], oscuro: ['#F4A6C8', '#4C1F3D', '#FFCCEB', '#5C1239', '#F4A6C8'] },
};
const VARIABLES = ['--azul', '--azul-s', '--azul-t', '--azul-on', '--azul-l'];

export const colorElegido = (c: string | undefined): string => (c && Object.hasOwn(PALETA, c) ? c : 'azul');

// The CSS that puts a main color, in light and dark mode. Empty for blue.
export function cssDelTema(color: string): string {
  const id = colorElegido(color);
  if (id === 'azul') return '';
  const p = PALETA[id]!, decl = (v: string[]): string => VARIABLES.map((n, i) => `${n}:${v[i]};`).join('');
  return `:root{${decl(p.claro)}}@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${decl(p.oscuro)}}}:root[data-theme="dark"]{${decl(p.oscuro)}}`;
}
