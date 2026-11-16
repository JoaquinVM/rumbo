// Layer rule (design.md, Capas): a forbidden import makes `npm run capas` fail and name the rule and the file.
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const depcruise = join(raiz, 'node_modules/.bin/depcruise');

const correr = (...rutas: string[]) => {
  try {
    execFileSync(depcruise, [...rutas, '--config', '.dependency-cruiser.cjs'], { cwd: raiz, encoding: 'utf8', stdio: 'pipe' });
    return { falla: false, salida: '' };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    return { falla: true, salida: (err.stdout ?? '') + (err.stderr ?? '') };
  }
};

// Writes temporary files (path → content), runs the check on `origen` and always cleans up.
const conArchivos = (archivos: Record<string, string>, origen: string) => {
  try {
    for (const [ruta, texto] of Object.entries(archivos)) {
      mkdirSync(join(raiz, dirname(ruta)), { recursive: true });
      writeFileSync(join(raiz, ruta), texto);
    }
    return correr(origen);
  } finally {
    for (const ruta of Object.keys(archivos)) rmSync(join(raiz, ruta), { force: true });
    for (const d of ['app/src/presentacion/modelos', 'app/src/infraestructura', 'app/src/aplicacion'])
      if (Object.keys(archivos).some((r) => r.startsWith(d))) rmSync(join(raiz, d), { recursive: true, force: true });
  }
};

describe('Capas verificadas', () => {
  it('el código de hoy cumple la regla', () => {
    expect(correr('paquetes', 'app/src', 'servidor/src', 'migracion/src')).toEqual({ falla: false, salida: '' });
  });

  it('falla y nombra el archivo cuando la presentación importa el dominio', () => {
    const origen = 'app/src/presentacion/__prueba_temporal.ts';
    const r = conArchivos({ [origen]: "export * from '@rumbo/dominio';\n" }, origen);
    expect(r.falla).toBe(true);
    expect(r.salida).toContain('presentacion-solo-contratos');
    expect(r.salida).toContain(origen);
  });

  it('falla cuando el dominio importa la infraestructura', () => {
    const origen = 'paquetes/dominio/src/__prueba_temporal.ts';
    const r = conArchivos({
      'app/src/infraestructura/__prueba_temporal.ts': 'export const x = 1;\n',
      [origen]: "import { x } from '../../../app/src/infraestructura/__prueba_temporal';\nexport const y = x;\n",
    }, origen);
    expect(r.falla).toBe(true);
    expect(r.salida).toContain('dominio-aislado');
  });

  it('falla cuando un modelo de vista importa React', () => {
    const origen = 'app/src/presentacion/modelos/__prueba_temporal.ts';
    const r = conArchivos({ [origen]: "import { useState } from 'react';\nexport const u = useState;\n" }, origen);
    expect(r.falla).toBe(true);
    expect(r.salida).toContain('modelos-sin-react');
  });

  it('falla cuando algo importa la composición', () => {
    const origen = 'app/src/presentacion/__prueba_temporal.ts';
    const r = conArchivos({ [origen]: "import '../composicion/main';\n" }, origen);
    expect(r.falla).toBe(true);
    expect(r.salida).toContain('nadie-importa-composicion');
  });

  it('falla cuando los contratos usan algo del dominio que no es un tipo', () => {
    const origen = 'paquetes/contratos/src/__prueba_temporal.ts';
    const r = conArchivos({ [origen]: "import { centavos } from '@rumbo/dominio';\nexport const c = centavos(1);\n" }, origen);
    expect(r.falla).toBe(true);
    expect(r.salida).toContain('contratos-solo-tipos-del-dominio');
    const tipo = conArchivos({ [origen]: "import type { Centavos } from '@rumbo/dominio';\nexport type C = Centavos;\n" }, origen);
    expect(tipo).toEqual({ falla: false, salida: '' });
  });

  it('falla cuando el servidor importa la app', () => {
    const origen = 'servidor/src/__prueba_temporal.ts';
    const r = conArchivos({ [origen]: "import '../../app/src/composicion/main';\n" }, origen);
    expect(r.falla).toBe(true);
    expect(r.salida).toContain('servidor-solo-contratos-y-dominio');
  });
});
