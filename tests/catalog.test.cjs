const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { listPublicRepositories, buildProjects, readSnapshot } = require('../js/catalog.js');

const context = { window: {} };
vm.runInNewContext(readFileSync(path.join(__dirname, '../js/projects.js'), 'utf8'), context);
const config = context.window.PORTFOLIO_CONFIG;

function repository(owner, name, overrides = {}) {
  return { owner, name, private: false, created_at: '2023-01-16T14:00:00Z', updated_at: '2026-11-19T22:10:00Z', ...overrides };
}

test('a new repo with no description is discovered and ordered by creation date', () => {
  const result = buildProjects(config, [
    repository('BrandonSaraiva', 'Bot-Faz-Tudo'),
    repository('mistercegueta', 'projeto-novo', { created_at: '2026-11-19T16:00:00Z', updated_at: '2026-11-19T17:00:00Z' }),
    repository('BrandonSaraiva', 'projeto-novo'),
  ]);
  assert.equal(result.length, 3);
  assert.equal(result[0].url, 'https://github.com/mistercegueta/projeto-novo');
  assert.equal(result[0].category, 'outros');
  assert.equal(result[0].era, undefined);
  assert.equal(result[0].meta.created_at, '2026-11-19T16:00:00Z');
  assert.equal(result.find(project => project.repo === 'Bot-Faz-Tudo').era, 'academica');
});

test('qualified exclusions, forks, private and archived repos stay out', () => {
  const result = buildProjects(config, [
    repository('BrandonSaraiva', 'lattes', { private: true }),
    repository('BrandonSaraiva', 'Site-Cartoes'),
    repository('mistercegueta', 'Site-Cartoes'),
    repository('mistercegueta', 'fork', { fork: true }),
    repository('mistercegueta', 'archived', { archived: true }),
    repository('mistercegueta', 'disabled', { disabled: true }),
    repository('mistercegueta', 'omit', { topics: ['portfolio-ignore'] }),
    repository('different-owner', 'public')
  ]);
  assert.deepEqual(result.map(item => item.url), ['https://github.com/mistercegueta/Site-Cartoes']);
});

test('lists both owners, follows pagination and rejects nonpublic API rows', async () => {
  const response = (owner, name, overrides) => repository({ login: owner }, name, overrides);
  const calls = [];
  const results = await listPublicRepositories(config.githubAccounts, {
    fetcher: async address => {
      const url = new URL(address);
      const owner = url.pathname.split('/')[2];
      const page = url.searchParams.get('page');
      calls.push(`${owner}:${page}`);
      assert.equal(url.searchParams.get('sort'), 'created');
      let rows = [response(owner, 'result')];
      if (owner === 'BrandonSaraiva' && page === '1') {
        rows = Array.from({ length: 100 }, (_, i) => response(owner, `repo-${i}`));
      } else if (owner === 'mistercegueta') {
        rows.push(response(owner, 'secret', { private: true }), response('other-owner', 'other'));
      }
      return { ok: true, json: async () => rows };
    }
  });
  assert.deepEqual(calls.sort(), ['BrandonSaraiva:1', 'BrandonSaraiva:2', 'mistercegueta:1']);
  assert.equal(results.length, 102);
  assert.ok(results.every(repo => repo.private === false && config.githubAccounts.includes(repo.owner)));
});

test('a rate-limited account does not replace the full catalog with partial results', async () => {
  await assert.rejects(listPublicRepositories(config.githubAccounts, {
    fetcher: async address => address.includes('mistercegueta')
      ? { ok: false, status: 403 }
      : { ok: true, json: async () => [] }
  }), /mistercegueta: GitHub HTTP 403/);
});

test('a Portuguese description with automação is classified without curation', () => {
  const [radar] = buildProjects({ ...config, curatedProjects: [] }, [
    repository('BrandonSaraiva', 'Dou-e-Concursos', {
      created_at: '2026-11-19T16:45:24Z',
      description: 'Automação para pesquisar nome do usuário no DOU e concursos nacionais e estaduais'
    })
  ]);
  assert.equal(radar.meta.created_at, '2026-11-19T16:45:24Z');
  assert.equal(radar.category, 'fluxos');
});

test('the published copy contains only eligible public repositories with real creation timestamps', () => {
  const snapshot = readSnapshot(require('../catalog/repos.json'));
  assert.equal(buildProjects(config, snapshot.repositories).length, snapshot.repositories.length);
  assert.ok(snapshot.repositories.every(repo => repo.private === false && Number.isFinite(Date.parse(repo.created_at))));
});
