// PUB-06: Lighthouse in phone mode (its default: mobile screen and simulated slow 4G) on the v2 page served by
// servidor-prueba.mjs. Below 90 in performance or 95 in accessibility or best practices, the CI goes red.
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4173/'],
      startServerCommand: 'node servidor-prueba.mjs',
      startServerReadyPattern: 'escucha',
      numberOfRuns: 3,
      settings: { chromeFlags: '--no-sandbox --headless=new' },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9, aggregationMethod: 'median-run' }],
        'categories:accessibility': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:best-practices': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};
