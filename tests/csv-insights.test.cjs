'use strict';

// Execute with: node --test tests/csv-insights.test.cjs
// No browser or external dependency: uses real inventory JS and curated projects.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'js/csv-insights.js'), 'utf8');
const projectsScript = fs.readFileSync(path.join(root, 'js/projects.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

class FakeEl {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.className = '';
    this.children = [];
    this.events = {};
    this.attributes = {};
    this.dataset = {};
    this.textContent = '';
    this.hidden = false;
    this.disabled = false;
    this.value = '';
    this.open = false;
    this.isConnected = true;
    this.style = { setProperty: (key, value) => { this.style[key] = value; } };
    this.classList = { add() {}, remove() {} };
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(key, handler) { this.events[key] = handler; }
  focus() {}
  querySelectorAll() { return []; }
  showModal() { this.open = true; }
  close() { this.open = false; this.events.close?.({ target: this }); }
  fire(key) {
    assert.ok(this.events[key], 'Expected event handler: ' + key);
    this.events[key]({ target: this, preventDefault() {} });
  }
}

function createApp() {
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id,
      new FakeEl(id === 'csvInsightDialog' ? 'dialog' : 'div'));
    return elements.get(id);
  };
  const dom = {
    getElementById: get,
    createElement: tag => new FakeEl(tag),
    createElementNS: (_namespace, tag) => new FakeEl(tag),
    createTextNode: text => ({ textContent: text }),
    querySelectorAll: () => [],
    activeElement: new FakeEl('button'),
    documentElement: { lang: 'pt-BR', classList: { add() {}, remove() {} } },
  };
  const events = {};
  const browser = { addEventListener: (key, cb) => { events[key] = cb; } };
  vm.runInNewContext(src, { document: dom, window: browser, URL, Intl, Date,
    console }, { filename: 'csv-insights.js' });
  const catalog = {};
  vm.runInNewContext(projectsScript, { window: catalog },
    { filename: 'projects.js' });
  const projects = catalog.PORTFOLIO_CONFIG.curatedProjects;

  const datesByRepo = {
    'Dou-e-Concursos': ['2026-11-19T16:45:24Z', '2026-11-20T01:13:19Z'],
    indexador_elastic: ['2023-10-20T19:15:58Z', '2023-10-30T23:32:05Z'],
    'Bot-Faz-Tudo': ['2023-01-16T14:05:46Z', '2023-11-09T13:17:21Z'],
    data_science_bot: ['2023-05-11T16:57:38Z', '2023-11-09T13:25:00Z'],
    get_random_post_threads: ['2023-11-08T22:46:18Z', '2023-11-08T23:12:49Z'],
  };
  function load(labels, dates = datesByRepo) {
    const headers = [
      'repositorio', 'titulo', 'categoria', 'era',
      'linguagem_principal', 'tecnologias', 'url_github', 'fonte_metadados',
      'criado_em', 'ultimo_push',
    ];
    const csv = [headers, ...projects.map(project => [
      project.repo, project.title, labels[project.category],
      project.era === 'academica' ? '01 / FACULDADE' : '02 / APLICAÇÕES',
      'Python', project.tags.join(' | '), project.url, 'GitHub API',
      ...(dates[project.repo] || ['', '']),
    ])].map(row => row.map(value =>
      '"' + String(value).replace(/"/g, '""') + '"').join(';')).join('\n');
    events['portfolio:inventory-ready']({ detail: { csv } });
    get('insightUseGenerated').fire('click');
  }

  function selected() {
    const map = get('insightStackMap').children[0];
    const chart = get('insightYears').children.find(x => x.className === 'insight-year-scroll')?.children[0];
    const plot = chart?.children.find(x => x.className === 'insight-year-plot');
    return {
      kpi: Number(get('insightMetricTotal').textContent),
      donut: Number(get('insightDonutNumber').textContent),
      repos: map?.children.filter(x => x.className === 'insight-stack-project')
        .map(x => x.textContent) || [],
      bars: get('insightTechBars').children
        .filter(x => x.className === 'insight-bar-row')
        .map(x => ({
          name: x.children[1].children[0].children[0].textContent,
          count: Number(x.children[1].children[0].children[1].textContent),
        })),
      ranks: get('insightRank').children
        .filter(x => x.className === 'insight-rank-item').length,
      yearPoints: plot?.children.filter(x => x.className === 'insight-year-point') || [],
      legend: get('insightCategoriesLegend').children,
      summary: get('insightActiveFilter').textContent,
    };
  }

  return { get, load, selected };
}

const oldLabels = {
  bots: 'BOTS & RPA', web: 'WEB SCRAPING',
  dados: 'DADOS & ETL', fluxos: 'AUTOMAÇÃO',
};
const newLabels = {
  bots: 'BOTS E ASSISTENTES', web: 'EXTRAÇÃO DE CONTEÚDO',
  dados: 'DADOS E INTEGRAÇÃO', fluxos: 'AUTOMAÇÃO DE ROTINAS',
};
const checkSubset = (value, expected) => {
  assert.equal(value.kpi, expected);
  assert.equal(value.donut, expected);
  assert.equal(value.repos.length, expected);
  assert.equal(value.yearPoints.reduce((sum, point) => sum + Number(point.children[0].textContent), 0), expected);
  assert.equal(value.ranks, Math.min(expected, 5));
  assert.ok(value.bars.every(x => x.count <= expected));
};

test('all charts use the five curated repositories initially', () => {
  const app = createApp();
  app.load(oldLabels);
  checkSubset(app.selected(), 5);
  assert.match(app.selected().summary, /5 de 5/);
});

test('searching Selenium consistently selects only 2 repositories', () => {
  const app = createApp();
  app.load(oldLabels);
  const input = app.get('insightSearch');
  input.value = 'Selenium';
  input.fire('input');
  const result = app.selected();
  checkSubset(result, 2);
  assert.deepEqual(result.repos, ['Data Science Bot', 'Threads Scraper']);
  assert.equal(result.bars.find(x => x.name === 'Python').count, 2);
  assert.equal(result.bars.find(x => x.name === 'Selenium').count, 2);
  assert.match(result.summary, /2 de 5/);
});

test('project type is distinct from techniques and filters every chart', () => {
  const app = createApp();
  app.load(oldLabels);
  const category = app.get('insightCategory');
  category.value = 'web';
  category.fire('change');
  const result = app.selected();
  checkSubset(result, 1);
  assert.deepEqual(result.repos, ['Threads Scraper']);
  assert.ok(result.legend.some(x =>
    x.className === 'insight-legend-item' &&
    x.children[0].children.some(y => y.textContent === 'Extração de conteúdo')));
  assert.ok(!result.legend.some(x =>
    x.className === 'insight-legend-item' &&
    x.children[0].children.some(y => y.textContent === 'Web scraping')));
});

test('category ring always represents types, project names are nested', () => {
  const app = createApp();
  app.load(oldLabels);
  const category = app.get('insightCategory');
  category.value = 'dados';
  category.fire('change');
  const result = app.selected();
  checkSubset(result, 2);
  const projects = result.legend.filter(x => x.className === 'insight-project-item');
  assert.equal(projects.length, 2);
  assert.equal(result.legend.filter(x => x.className === 'insight-legend-item').length, 1);
  assert.match(app.get('insightDonut').style.background, /#ecacff/);
  assert.doesNotMatch(app.get('insightDonut').style.background, /#69efce/);
});

test('new exported project type names remain recognized', () => {
  const app = createApp();
  app.load(newLabels);
  checkSubset(app.selected(), 5);
  assert.equal(app.get('insightMetricApi').textContent, '4');
  const filter = app.get('insightCategory');
  filter.value = 'fluxos';
  filter.fire('change');
  assert.deepEqual(app.selected().repos, ['Radar DOU + Concursos']);
});

test('annual line includes years without creation and shows the projects for the selected point', () => {
  const app = createApp();
  app.load(newLabels);
  const points = app.selected().yearPoints;
  assert.deepEqual(points.map(point => point.attributes['aria-label']), [
    '2023 · 4 repositórios', '2024 · 0 repositórios', '2025 · 0 repositórios', '2026 · 1 repositório'
  ]);
  const chart = app.get('insightYears').children[1].children[0];
  const line = chart.children[1].children[0].children.find(node => node.tagName === 'POLYLINE');
  assert.equal(line.attributes.points.split(' ').length, 4);
  const details = app.get('insightYears').children[2];
  assert.equal(details.children[1].children[0].children[0].textContent, 'Radar DOU + Concursos');
  points[0].fire('click');
  assert.equal(points[0].attributes['aria-pressed'], 'true');
  assert.equal(details.children[1].children.length, 4);
  points[1].fire('click');
  assert.match(details.children[1].textContent, /Nenhum repositório/);
});

test('annual line never substitutes push dates for missing or malformed creation dates', () => {
  const app = createApp();
  app.load(newLabels, {
    'Dou-e-Concursos': ['2026-01-01T01:00:00Z', '2026-11-19'],
    indexador_elastic: ['2026-01-01', ''],
    data_science_bot: ['2026-02-30', '2027-01-01'],
  });
  assert.deepEqual(app.selected().yearPoints.map(point => point.attributes['aria-label']), [
    '2025 · 1 repositório', '2026 · 1 repositório'
  ]);
  const summary = app.get('insightYears').children[0];
  assert.match(summary.children[0].textContent, /3 sem data de criação/);
  app.load(newLabels, { 'Dou-e-Concursos': ['', '2026-11-19'] });
  assert.equal(app.selected().yearPoints.length, 0);
  assert.match(app.get('insightYears').children[0].textContent, /não tem datas de criação válidas/);
});

test('Radar is included in technology filters for Telegram Bot and web scraping', () => {
  const app = createApp();
  app.load(newLabels);
  const input = app.get('insightSearch');
  for (const [term, expected] of [
    ['Telegram Bot', ['Bot Faz Tudo', 'Radar DOU + Concursos']],
    ['Web scraping', ['Radar DOU + Concursos', 'Threads Scraper']]
  ]) {
    input.value = term;
    input.fire('input');
    assert.deepEqual(app.selected().repos, expected);
  }
});

test('no matches shows zero everywhere rather than old values', () => {
  const app = createApp();
  app.load(oldLabels);
  const input = app.get('insightSearch');
  input.value = 'nonexistent-product-xyz';
  input.fire('input');
  checkSubset(app.selected(), 0);
  assert.match(app.selected().summary, /0 de 5/);
});

test('required element ids exist in the HTML and visualizations do not ignore filters', () => {
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
  for (const [, id] of src.matchAll(/\$\('([^']+)'\)/g)) {
    assert.ok(ids.includes(id), 'Missing HTML id: ' + id);
  }
  assert.doesNotMatch(src, /filtered\('(?:tech|category)'\)/);
  assert.match(src, /const rows = filtered\(\);/);
});
