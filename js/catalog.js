/* Shared catalog logic for the browser and the snapshot generator. */
(() => {
  'use strict';

  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const dateValue = value => Date.parse(value) || 0;
  const newestFirst = (a, b) => dateValue(b.meta?.created_at) - dateValue(a.meta?.created_at) || a.title.localeCompare(b.title);
  const repoKey = (owner, name) => `${owner}/${name}`.toLowerCase();
  const topicsFor = repo => Array.isArray(repo.topics) ? repo.topics.filter(topic => typeof topic === 'string') : [];
  const curatedByRepository = config => new Map(config.curatedProjects.map(
    project => [new URL(project.url).pathname.slice(1).toLowerCase(), project]
  ));

  async function listPublicRepositories(accounts, { fetcher = fetch, signal, token } = {}) {
    const headers = { Accept: 'application/vnd.github+json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const lists = await Promise.all(accounts.map(async account => {
      const repos = [];
      for (let page = 1; ; page++) {
        const url = `https://api.github.com/users/${encodeURIComponent(account)}/repos?type=owner&per_page=100&sort=created&direction=desc&page=${page}`;
        const response = await fetcher(url, { signal, headers, cache: 'no-cache' });
        if (!response.ok) throw new Error(`${account}: GitHub HTTP ${response.status}`);
        const part = await response.json();
        if (!Array.isArray(part)) throw new Error(`${account}: resposta inválida do GitHub`);
        for (const repo of part) {
          if (repo?.private !== false || repo.owner?.login?.toLowerCase() !== account.toLowerCase()) continue;
          if (typeof repo.name !== 'string' || typeof repo.created_at !== 'string') continue;
          repos.push({
            owner: account, name: repo.name, private: false,
            fork: repo.fork === true, archived: repo.archived === true, disabled: repo.disabled === true,
            description: typeof repo.description === 'string' ? repo.description.trim() : '',
            topics: topicsFor(repo),
            language: repo.language || '', created_at: repo.created_at,
            updated_at: repo.updated_at || '', pushed_at: repo.pushed_at || '',
            stargazers_count: repo.stargazers_count ?? null, forks_count: repo.forks_count ?? null,
            open_issues_count: repo.open_issues_count ?? null, size: repo.size ?? null
          });
        }
        if (part.length < 100) return repos;
      }
    }));
    return lists.flat();
  }

  function classify(repo) {
    const topics = topicsFor(repo).map(normalize);
    const rules = [
      ['bots', /\bbot\b|telegram|whatsapp|chatbot|assistente/],
      ['dados', /elastic|pipeline|ingest|\betl\b|indexa|data science|engenharia de dados|analise de dados|analy[sz](?:e|ing) (?:the )?data|data (?:engineering|analysis|collection)|coleta de dados|datasus/],
      ['web', /scrap|crawl|selenium|playwright|beautiful soup|extracao web/],
      ['fluxos', /\brpa\b|robot|automat|automac|workflow|pyautogui|bpmn|integracao|integration|scheduler|monitoramento|csv downloader/]
    ];
    // Infer the purpose from the strongest signal first: declared topics and the name.
    for (const signal of [topics.join(' ').replace(/[-_]/g, ' '), normalize(repo.name).replace(/[-_]/g, ' '), normalize(repo.description)]) {
      const match = rules.find(([, pattern]) => pattern.test(signal));
      if (match) return match[0];
    }
    return 'outros';
  }

  function eligibleRepositories(config, repositories) {
    const accounts = new Set(config.githubAccounts.map(normalize));
    const excluded = new Set(config.excludedRepositories.map(normalize));
    const curated = curatedByRepository(config);
    const eligible = new Map();
    for (const repo of repositories) {
      if (!repo || !accounts.has(normalize(repo.owner)) || repo.private !== false || repo.fork || repo.archived || repo.disabled) continue;
      if (typeof repo.name !== 'string' || !/^[\w.-]+$/.test(repo.name)) continue;
      const topics = topicsFor(repo);
      const key = repoKey(repo.owner, repo.name);
      if (excluded.has(key) || topics.includes('portfolio-ignore')) continue;
      const optedIn = topics.includes(config.publishTopic) && typeof repo.description === 'string' && repo.description.trim();
      if (curated.has(key) || optedIn) eligible.set(key, repo);
    }
    return [...eligible.values()];
  }

  function buildProjects(config, repositories) {
    const curated = curatedByRepository(config);
    return eligibleRepositories(config, repositories).map(repo => {
      const editorial = curated.get(repoKey(repo.owner, repo.name));
      const topics = topicsFor(repo).filter(topic => topic !== config.publishTopic);
      const originalDescription = repo.description || '';
      const tags = [repo.language, ...topics].filter(Boolean);
      const title = repo.name.replace(/[-_]+/g, ' ').replace(/\b[a-z]/g, char => char.toUpperCase());
      return {
        owner: repo.owner, repo: repo.name, title, category: classify(repo),
        tags: [...new Set(tags)], ...editorial,
        url: `https://github.com/${repo.owner}/${encodeURIComponent(repo.name)}`,
        source: editorial ? 'curated' : 'github', originalDescription,
        meta: {
          created_at: repo.created_at, updated_at: repo.updated_at, pushed_at: repo.pushed_at,
          language: repo.language, topics,
          stars: repo.stargazers_count, forks: repo.forks_count,
          open_issues: repo.open_issues_count, size_kb: repo.size
        }
      };
    }).sort(newestFirst);
  }

  function readSnapshot(value) {
    if (!value || value.version !== 1 || !dateValue(value.generatedAt) || !Array.isArray(value.repositories)) {
      throw new Error('Snapshot de repositórios inválido');
    }
    return value;
  }

  const catalog = { normalize, dateValue, newestFirst, listPublicRepositories, eligibleRepositories, buildProjects, readSnapshot };
  if (typeof module !== 'undefined' && module.exports) module.exports = catalog;
  else window.PORTFOLIO_CATALOG = catalog;
})();
