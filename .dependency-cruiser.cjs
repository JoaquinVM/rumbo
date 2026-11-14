// Dependency rule of the six layers (openspec/changes/rumbo-2-reescritura/design.md, Capas), as in Strata.
// Each layer may import only what its line says; everything else is forbidden. `npm run capas` checks it.
const zonas = {
  dominio: '^paquetes/dominio/',
  contratos: '^paquetes/contratos/',
  aplicacion: '^app/src/aplicacion/',
  infraestructura: '^app/src/infraestructura/',
  presentacion: '^app/src/presentacion/',
  composicion: '^app/src/composicion/',
  servidor: '^servidor/src/',
  migracion: '^migracion/',
  oraculo: '^pruebas/v1/',
};
const NUESTRO = '^(paquetes|app|servidor|migracion|pruebas|e2e)/';
const NPM = ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-no-pkg', 'npm-unknown'];
const soloPuede = (nombre, desde, permitidas) => ({
  name: nombre,
  comment: `${desde} solo puede depender de: ${permitidas.join(', ') || 'nada fuera de sí'}`,
  severity: 'error',
  from: { path: zonas[desde] },
  to: { path: NUESTRO, pathNot: [zonas[desde], ...permitidas.map((z) => zonas[z])] },
});

module.exports = {
  forbidden: [
    soloPuede('dominio-aislado', 'dominio', []),
    soloPuede('contratos-aislados', 'contratos', []),
    soloPuede('aplicacion-hacia-adentro', 'aplicacion', ['dominio', 'contratos']),
    soloPuede('infraestructura-hacia-adentro', 'infraestructura', ['aplicacion', 'dominio', 'contratos']),
    soloPuede('presentacion-solo-contratos', 'presentacion', ['contratos']),
    soloPuede('composicion-solo-la-app', 'composicion',
      ['aplicacion', 'infraestructura', 'presentacion', 'dominio', 'contratos']),
    soloPuede('servidor-solo-contratos-y-dominio', 'servidor', ['contratos', 'dominio']),
    soloPuede('migracion-con-el-oraculo', 'migracion', ['dominio', 'contratos', 'oraculo']),
    {
      name: 'nadie-importa-composicion',
      severity: 'error',
      from: { pathNot: zonas.composicion },
      to: { path: zonas.composicion },
    },
    {
      name: 'modelos-sin-react',
      comment: 'Los modelos de vista no dependen del framework',
      severity: 'error',
      from: { path: '^app/src/presentacion/modelos/' },
      to: { path: ['^app/src/presentacion/react/', 'node_modules/react/', 'node_modules/react-dom/'] },
    },
    {
      name: 'capas-internas-sin-paquetes',
      comment: 'Dominio y Aplicación no usan paquetes externos',
      severity: 'error',
      from: { path: [zonas.dominio, zonas.aplicacion] },
      to: { dependencyTypes: NPM },
    },
    {
      name: 'contratos-solo-zod',
      comment: 'Contratos solo usa Zod',
      severity: 'error',
      from: { path: zonas.contratos },
      to: { dependencyTypes: NPM, pathNot: 'node_modules/zod/' },
    },
    { name: 'sin-ciclos', severity: 'error', from: {}, to: { circular: true } },
    { name: 'sin-resolver', severity: 'error', from: {}, to: { couldNotResolve: true } },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '\\.test\\.tsx?$' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      extensions: ['.ts', '.tsx', '.js', '.mjs', '.json'],
      exportsFields: ['exports'],
      conditionNames: ['import', 'default'],
    },
  },
};
