// PUB-06: Lighthouse in phone mode (its default: mobile screen and simulated slow 4G) on the Rumbo screen with the
// example, served by servidor-prueba.mjs. Below 90 in performance or 95 in accessibility or best practices, the CI goes red.
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4173/'],
      startServerCommand: 'E2E_ACCESS_ABIERTO=1 node --conditions=rumbo-compilado servidor-prueba.mjs',
      startServerReadyPattern: 'escucha',
      numberOfRuns: 3,
      // As a person who has not started (the fake Access lets it in without a token): the Rumbo screen with the example
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
