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

  function load(labels) {
    const headers = [
      'repositorio', 'titulo', 'categoria', 'era',
      'linguagem_principal', 'tecnologias', 'url_github', 'fonte_metadados',
    ];
    const csv = [headers, ...projects.map(project => [
      project.repo, project.title, labels[project.category],
      project.era === 'academica' ? '01 / FACULDADE' : '02 / APLICAÇÕES',
      'Python', project.tags.join(' | '), project.url, 'GitHub API',
    ])].map(row => row.map(value =>
      '"' + String(value).replace(/"/g, '""') + '"').join(';')).join('\n');
    events['portfolio:inventory-ready']({ detail: { csv } });
    get('insightUseGenerated').fire('click');
  }

  function selected() {
    const map = get('insightStackMap').children[0];
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
      matrixTotal: get('insightMatrix').children
        .filter(x => x.tagName === 'BUTTON' && !x.disabled)
        .reduce((n, x) => n + Number(x.textContent), 0),
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
  assert.equal(value.matrixTotal, expected);
  assert.equal(value.ranks, Math.min(expected, 5));
  assert.ok(value.bars.every(x => x.count <= expected));
};

test('all charts use six repositories initially', () => {
  const app = createApp();
  app.load(oldLabels);
  checkSubset(app.selected(), 6);
  assert.match(app.selected().summary, /6 de 6/);
});

test('searching web scraping consistently selects only 2 repositories', () => {
  const app = createApp();
  app.load(oldLabels);
  const input = app.get('insightSearch');
  input.value = 'Web scraping';
  input.fire('input');
  const result = app.selected();
  checkSubset(result, 2);
  assert.deepEqual(result.repos, ['Threads Scraper', 'Tokinho • Telegram Bot']);
  assert.equal(result.bars.find(x => x.name === 'Python').count, 2);
  assert.equal(result.bars.find(x => x.name === 'Web scraping').count, 2);
  assert.match(result.summary, /2 de 6/);
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
  category.value = 'bots';
  category.fire('change');
  const result = app.selected();
  checkSubset(result, 3);
  const projects = result.legend.filter(x => x.className === 'insight-project-item');
  assert.equal(projects.length, 3);
  assert.equal(result.legend.filter(x => x.className === 'insight-legend-item').length, 1);
  assert.match(app.get('insightDonut').style.background, /#a58bff/);
  assert.doesNotMatch(app.get('insightDonut').style.background, /#69efce/);
});

test('new exported project type names remain recognized', () => {
  const app = createApp();
  app.load(newLabels);
  checkSubset(app.selected(), 6);
  assert.equal(app.get('insightMetricApi').textContent, '3');
});

test('no matches shows zero everywhere rather than old values', () => {
  const app = createApp();
  app.load(oldLabels);
  const input = app.get('insightSearch');
  input.value = 'nonexistent-product-xyz';
  input.fire('input');
  checkSubset(app.selected(), 0);
  assert.match(app.selected().summary, /0 de 6/);
});

test('required element ids exist in the HTML and visualizations do not ignore filters', () => {
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
  for (const [, id] of src.matchAll(/\$\('([^']+)'\)/g)) {
    assert.ok(ids.includes(id), 'Missing HTML id: ' + id);
  }
  assert.doesNotMatch(src, /filtered\('(?:tech|category)'\)/);
  assert.match(src, /const rows = filtered\(\);/);
});
