const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const { listPublicRepositories, eligibleRepositories } = require('../js/catalog.js');

async function refresh() {
  const root = path.resolve(__dirname, '..');
  const configContext = { window: {} };
  const configSource = await fs.readFile(path.join(root, 'js/projects.js'), 'utf8');
  vm.runInNewContext(configSource, configContext);
  const config = configContext.window.PORTFOLIO_CONFIG;
  const scanned = await listPublicRepositories(config.githubAccounts, {
    token: process.env.GH_TOKEN,
    signal: AbortSignal.timeout(30_000)
  });
  const repositories = eligibleRepositories(config, scanned);
  const target = path.join(root, 'catalog', 'repos.json');
  let previous;
  try {
    previous = JSON.parse(await fs.readFile(target, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const data = { version: 1, repositoryCount: scanned.length, repositories };
  if (previous?.version === data.version && previous.repositoryCount === data.repositoryCount &&
      JSON.stringify(previous.repositories) === JSON.stringify(repositories)) {
    console.log(`Catálogo sem alterações: ${repositories.length} projetos.`);
    return;
  }
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify({ ...data, generatedAt: new Date().toISOString() }, null, 2) + '\n');
  console.log(`Catálogo gravado: ${repositories.length} projetos em ${config.githubAccounts.length} contas.`);
}

refresh().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
