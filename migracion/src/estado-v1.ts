// A person's data as the v1 keeps it: decimal amounts (Bs 3550,50 is 3550.5), the same fields as docs/DOMINIO.md.
type Doc = Record<string, any>;
export interface EstadoV1 {
  aj: Doc;
  cuentas: Doc[];
  categorias: Doc[];
  movs: Doc[];
  fijos: Doc[];
  ocurrencias: Doc[];
  deudas: Doc[];
  metas: Doc[];
  apartados: Doc[];
}
