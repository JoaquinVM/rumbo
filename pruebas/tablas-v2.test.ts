// The migration creates Rumbo 2's tables before Rumbo 2's server ever starts (the cut): they must be exactly the ones the
// server creates (servidor/src/base.ts).
import { describe, expect, it } from 'vitest';
import { ESQUEMA } from '../servidor/src/base';
import { TABLAS_V2 } from '../migracion/src/migracion';

describe('DAT-08: las tablas de Rumbo 2', () => {
  it('la migración las crea igual que el servidor', () => {
    const solo = (s: string): string => s.replace(/\s+/g, ' ').trim();
    expect(solo(TABLAS_V2)).toBe(solo(ESQUEMA));
  });
});
