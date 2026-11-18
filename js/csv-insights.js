/* Interactive CSV insights — entirely client-side, no analytics backend or dependencies. */
(() => {
  'use strict';
  const dialog = document.getElementById('csvInsightDialog');
  if (!dialog) return;
  const $ = id => document.getElementById(id);
  const $all = (query, parent = dialog) => Array.from(parent.querySelectorAll(query));
  const state = {
    rows: [], file: '', latestCsv: '', category: 'all', era: 'all',
    source: 'all', tech: '', search: '', year: null, yearKind: 'pushed'
  };
  let lastFocus = null;
  let language = document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'pt';
  const colors = { bots: '#a58bff', web: '#69efce', dados: '#ecacff', fluxos: '#e8c078', outros: '#8694bb' };
  const cats = ['bots', 'web', 'dados', 'fluxos', 'outros'];
  const words = {
    pt: {
      open: '◈ Explorar dados', eyebrow: 'DEMO_002 / DATA EXPLORER',
      title: 'Do CSV aos insights.', subtitle: 'Abra o inventário e investigue os projetos com gráficos conectados.',
      upload: 'Carregar CSV', drop: 'Arraste um CSV até aqui ou selecione um arquivo.',
      privacy: 'Leitura 100% local no navegador. Nenhum arquivo é enviado.',
      current: 'Usar CSV recém-gerado', emptyTitle: 'Seu inventário vira um painel.',
      emptyBody: 'Execute o fluxo, baixe o CSV e carregue-o aqui. Você também pode analisar um arquivo exportado anteriormente.',
      close: 'Fechar painel', clear: 'Limpar filtros', all: 'Todos',
      filterCat: 'Categoria', filterEra: 'Origem do projeto', filterSource: 'Fonte dos metadados',
      filterSearch: 'Buscar repositório', filterSearchPlaceholder: 'Nome ou tecnologia...',
      selected: 'Na seleção', api: 'Com API', techs: 'Tecnologias', push: 'Último push informado',
      count: 'projetos', donutTitle: 'Onde estão as automações?',
      donutNote: 'Categorias editoriais do catálogo; clique para filtrar.',
      techTitle: 'Stack mais presente', techNote: 'Tecnologias declaradas e linguagem principal. Um projeto conta uma vez por tecnologia.',
      timeTitle: 'Linha do tempo dos repositórios', timeNote: 'Ano de criação e ano do ÚLTIMO push de cada repositório. Não representa número de commits.',
      created: 'Criados', pushed: 'Último push', matrixTitle: 'Acadêmico × aplicação',
      matrixNote: 'Classificação do portfólio, não um campo calculado pelo GitHub.',
      academic: 'Faculdade', applied: 'Aplicações', other: 'Não informado',
      rankTitle: 'Repositórios em destaque', rankNoteSize: 'Ordenados pelo tamanho aproximado informado pela API.',
      rankNoteStars: 'Ordenados por estrelas públicas registradas no CSV.',
      rankNoteRecent: 'Ordenados pelo último push informado no CSV.',
      bySize: 'KB aprox.', stars: 'estrelas', noData: 'Dados insuficientes para este gráfico.',
      noFilter: 'Nenhum projeto corresponde aos filtros. Limpe os filtros para explorar novamente.',
      loaded: 'Arquivo analisado localmente:', rows: 'registros', sourceApi: 'GitHub API',
      sourceLocal: 'Curadoria local', sourceOther: 'Outra / desconhecida',
      yearFilter: 'Ano', yearFilterClear: 'Remover filtro de ano',
      filtered: 'Filtro ativo', chartTip: 'Clique para filtrar',
      fileTooBig: 'O arquivo é muito grande (limite de 8 MB).',
      badFile: 'Não foi possível ler o CSV. Verifique se é um inventário válido exportado pelo laboratório.',
      missingHeader: 'O CSV não contém a coluna de repositório ou título esperada.',
      emptyFile: 'O CSV não contém registros para análise.',
      malformed: 'O CSV contém aspas não fechadas.',
      fileError: 'Não foi possível abrir este arquivo.',
      inspect: 'Abrir no GitHub', coverage: 'Disponibilidade dos campos',
      missingMeta: 'Metadados ausentes são omitidos; zero não é ausência de dado.',
      reset: 'Reiniciar seleção', selectFile: 'Escolher arquivo CSV',
      updated: 'Atualizado em', size: 'Tamanho (KB)', localNotice: 'Itens de curadoria local podem não ter datas e métricas.',
      closeLabel: 'Fechar'
    },
    en: {
      open: '◈ Explore data', eyebrow: 'DEMO_002 / DATA EXPLORER',
      title: 'From CSV to insights.', subtitle: 'Load the inventory and investigate projects through connected charts.',
      upload: 'Upload CSV', drop: 'Drop a CSV here or choose a file.',
      privacy: 'Processed locally in your browser. Nothing is uploaded.',
      current: 'Use newly generated CSV', emptyTitle: 'Turn your inventory into a dashboard.',
      emptyBody: 'Run the workflow, download the CSV and upload it here. You can also analyze an earlier export.',
      close: 'Close dashboard', clear: 'Clear filters', all: 'All',
      filterCat: 'Category', filterEra: 'Project context', filterSource: 'Metadata source',
      filterSearch: 'Search repositories', filterSearchPlaceholder: 'Name or technology...',
      selected: 'In selection', api: 'API metadata', techs: 'Technologies', push: 'Last push available',
      count: 'projects', donutTitle: 'Where are the automations?',
      donutNote: 'Editorial project categories; click to filter.',
      techTitle: 'Most frequent stack', techNote: 'Declared technologies and primary language. Each project counted once per technology.',
      timeTitle: 'Repository timeline', timeNote: 'Year created and year of each repository’s LAST push. Not a commit history.',
      created: 'Created', pushed: 'Last push', matrixTitle: 'University × applied',
      matrixNote: 'Portfolio editorial classification, not a GitHub-derived field.',
      academic: 'University', applied: 'Applied', other: 'Not available',
      rankTitle: 'Repository highlights', rankNoteSize: 'Ranked by approximate repository size reported by the API.',
      rankNoteStars: 'Ranked by public stars recorded in the CSV.',
      rankNoteRecent: 'Ranked by last push available in the CSV.',
      bySize: 'KB approx.', stars: 'stars', noData: 'Not enough metadata for this chart.',
      noFilter: 'No projects match the filters. Clear filters to explore again.',
      loaded: 'File analyzed locally:', rows: 'rows', sourceApi: 'GitHub API',
      sourceLocal: 'Local curation', sourceOther: 'Other / unknown',
      yearFilter: 'Year', yearFilterClear: 'Remove year filter',
      filtered: 'Filter active', chartTip: 'Click to filter',
      fileTooBig: 'File exceeds the 8 MB limit.',
      badFile: 'Could not read the CSV. Check that it is a valid inventory exported by the lab.',
      missingHeader: 'The CSV lacks the expected repository or title column.',
      emptyFile: 'The CSV has no data rows.',
      malformed: 'CSV has an unclosed quoted field.',
      fileError: 'Could not open this file.',
      inspect: 'View on GitHub', coverage: 'Metadata availability',
      missingMeta: 'Missing metrics are omitted; zero is not missing data.',
      reset: 'Reset selection', selectFile: 'Choose CSV file',
      updated: 'Updated', size: 'Size (KB)', localNotice: 'Locally curated records may not have dates or API metrics.',
      closeLabel: 'Close'
    }
  };
  const tr = key => words[language][key] || key;
  const textNode = (tag, cls, value) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (value !== undefined) el.textContent = String(value);
    return el;
  };
  const norm = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  function roleCategory(value) {
    const v = norm(value);
    if (/bot|rpa/.test(v)) return 'bots';
    if (/web|scrap|crawler/.test(v)) return 'web';
    if (/dados|data|etl|pipeline/.test(v)) return 'dados';
    if (/automat|workflow|fluxo/.test(v)) return 'fluxos';
    return 'outros';
  }
  function categoryName(key) {
    const map = {
      pt: { bots: 'Bots & RPA', web: 'Web scraping', dados: 'Dados & ETL', fluxos: 'Automação', outros: 'Outros / não informado' },
      en: { bots: 'Bots & RPA', web: 'Web scraping', dados: 'Data & ETL', fluxos: 'Automation', outros: 'Other / unknown' }
    };
    return map[language][key] || key;
  }
  function eraValue(value) {
    const v = norm(value);
    if (/^01\b|faculdade|universit|university|academic/.test(v)) return 'academica';
    if (/^02\b|aplic|applied|profission/.test(v)) return 'aplicada';
    return 'outros';
  }
  function sourceValue(value) {
    const v = norm(value);
    if (v.includes('github api')) return 'api';
    if (/curadoria|catalog|local/.test(v)) return 'local';
    return 'outros';
  }
  function fieldNumber(v) {
    const t = String(v ?? '').trim();
    if (!/^\d+(?:\.\d+)?$/.test(t)) return null;
    const n = Number(t);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  function yearOf(value) {
    const m = /^(\d{4})-\d\d-\d\d(?:T|$)/.exec(String(value ?? '').trim());
    if (!m) return null;
    const y = Number(m[1]);
    return y >= 1970 && y <= new Date().getUTCFullYear() + 1 ? y : null;
  }
  // RFC-style quoted fields, embedded semicolons/newlines, escaped quotes and UTF-8 BOM.
  function detectSeparator(text) {
    let quoted = false, counts = { ';': 0, ',': 0, '\t': 0 };
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (quoted && text[i + 1] === '"') { i++; continue; }
        quoted = !quoted;
      } else if (!quoted && (c === '\n' || c === '\r')) break;
      else if (!quoted && Object.prototype.hasOwnProperty.call(counts, c)) counts[c]++;
    }
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  }
  function parseCsv(source) {
    const text = String(source).replace(/^\uFEFF/, '');
    const delimiter = detectSeparator(text);
    const rows = [], record = [];
    let value = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (quoted && text[i + 1] === '"') { value += '"'; i++; }
        else quoted = !quoted;
      } else if (c === delimiter && !quoted) {
        record.push(value); value = '';
      } else if ((c === '\r' || c === '\n') && !quoted) {
        record.push(value); value = '';
        if (record.some(cell => cell.trim())) rows.push(record.slice());
        record.length = 0;
        if (c === '\r' && text[i + 1] === '\n') i++;
      } else {
        value += c;
      }
    }
    if (quoted) throw new Error(tr('malformed'));
    record.push(value);
    if (record.some(cell => cell.trim())) rows.push(record);
    return rows;
  }
  const columns = {
    repo: ['repositorio', 'repository', 'repo'],
    title: ['titulo', 'title'],
    category: ['categoria', 'category'],
    era: ['era'], context: ['contexto', 'context'],
    language: ['linguagem_principal', 'primary_language', 'language'],
    technologies: ['tecnologias', 'technologies'],
    topics: ['topicos', 'topics'],
    created: ['criado_em', 'created_at'],
    updated: ['atualizado_em', 'updated_at'],
    pushed: ['ultimo_push', 'last_push', 'pushed_at'],
    stars: ['estrelas', 'stars'], forks: ['forks'],
    issues: ['issues_abertas', 'open_issues'],
    size: ['tamanho_kb', 'size_kb'],
    source: ['fonte_metadados', 'metadata_source', 'fonte'],
    url: ['url_github', 'github_url', 'url']
  };
  function normalizeInventory(csv) {
    const raw = parseCsv(csv);
    if (raw.length < 2) throw new Error(tr('emptyFile'));
    const names = raw[0].map(norm);
    const positions = {};
    for (const [key, aliases] of Object.entries(columns)) {
      positions[key] = names.findIndex(name => aliases.includes(name));
    }
    if (positions.repo < 0 && positions.title < 0) throw new Error(tr('missingHeader'));
    const items = [];
    for (const cells of raw.slice(1)) {
      const get = key => positions[key] < 0 ? '' : String(cells[positions[key]] ?? '').trim();
      const repo = get('repo') || get('title');
      if (!repo) continue;
      const techs = [get('language'), ...get('technologies').split('|')]
        .map(v => v.trim()).filter(v => v && norm(v) !== 'open source');
      const unique = [...new Map(techs.map(v => [norm(v), v])).values()];
      const record = {
        repo, title: get('title') || repo, category: roleCategory(get('category')),
        era: eraValue(get('era')), source: sourceValue(get('source')),
        language: get('language'), technologies: unique, created: yearOf(get('created')),
        pushed: yearOf(get('pushed')), pushedDate: get('pushed'),
        updatedDate: get('updated'), stars: fieldNumber(get('stars')),
        forks: fieldNumber(get('forks')), issues: fieldNumber(get('issues')),
        size: fieldNumber(get('size')), context: get('context'), url: get('url')
      };
      items.push(record);
    }
    if (!items.length) throw new Error(tr('emptyFile'));
    return items;
  }
  function sourceLabel(key) {
    return key === 'api' ? tr('sourceApi') : key === 'local' ? tr('sourceLocal') : tr('sourceOther');
  }
  const selectSource = $('insightSource');
  const selectEra = $('insightEra');
  const selectCat = $('insightCategory');
  function setupSelect(select, options, value) {
    select.replaceChildren();
    options.forEach(([key, label]) => {
      const opt = document.createElement('option');
      opt.value = key; opt.textContent = label;
      select.append(opt);
    });
    select.value = value;
  }
  function syncSelects() {
    setupSelect(selectCat, [['all', tr('all')], ...cats.map(key => [key, categoryName(key)])], state.category);
    setupSelect(selectEra, [['all', tr('all')], ['academica', tr('academic')], ['aplicada', tr('applied')], ['outros', tr('other')]], state.era);
    setupSelect(selectSource, [['all', tr('all')], ['api', tr('sourceApi')], ['local', tr('sourceLocal')], ['outros', tr('sourceOther')]], state.source);
  }
  function hasMatch(row, except = '') {
    if (except !== 'category' && state.category !== 'all' && row.category !== state.category) return false;
    if (except !== 'era' && state.era !== 'all' && row.era !== state.era) return false;
    if (except !== 'source' && state.source !== 'all' && row.source !== state.source) return false;
    if (except !== 'tech' && state.tech && !row.technologies.some(v => norm(v) === norm(state.tech))) return false;
    if (except !== 'year' && state.year !== null && row[state.yearKind] !== state.year) return false;
    if (state.search && !norm([row.repo, row.title, ...row.technologies].join(' ')).includes(norm(state.search))) return false;
    return true;
  }
  function filtered(except = '') { return state.rows.filter(row => hasMatch(row, except)); }
  function setError(text) {
    const el = $('insightError');
    el.textContent = text;
    el.hidden = !text;
  }
  const fmt = value => new Intl.NumberFormat(language === 'en' ? 'en-US' : 'pt-BR').format(value);
  function empty(panel, message = tr('noData')) {
    panel.replaceChildren(textNode('p', 'insight-no-data', message));
  }
  function metric(id, value) { $(id).textContent = fmt(value); }
  function renderMetrics(rows) {
    metric('insightMetricTotal', rows.length);
    metric('insightMetricApi', rows.filter(r => r.source === 'api').length);
    metric('insightMetricTech', new Set(rows.flatMap(r => r.technologies.map(norm))).size);
    metric('insightMetricPush', rows.filter(r => r.pushed !== null).length);
    $('insightFileLabel').textContent = tr('loaded') + ' ' + state.file + ' · ' + fmt(state.rows.length) + ' ' + tr('rows');
    const active = [state.category !== 'all', state.era !== 'all', state.source !== 'all', !!state.tech, !!state.search, state.year !== null].some(Boolean);
    $('insightActiveFilter').hidden = !active;
    $('insightClearFilters').disabled = !active;
    const yr = $('insightYearBadge');
    yr.hidden = state.year === null;
    yr.textContent = tr('yearFilter') + ': ' + (state.year ?? '') + ' (' + tr(state.yearKind === 'created' ? 'created' : 'pushed') + ') ×';
  }
  function renderDonut() {
    const base = filtered('category');
    const ring = $('insightDonut');
    const legend = $('insightCategoriesLegend');
    legend.replaceChildren();
    const counts = Object.fromEntries(cats.map(key => [key, base.filter(row => row.category === key).length]));
    const total = base.length;
    let offset = 0;
    const parts = cats.filter(k => counts[k]).map(key => {
      const from = offset, to = (offset += counts[key] / total * 100);
      return colors[key] + ' ' + from.toFixed(3) + '% ' + to.toFixed(3) + '%';
    });
    ring.style.background = parts.length ? 'conic-gradient(' + parts.join(',') + ')' : '#242b41';
    $('insightDonutNumber').textContent = fmt(total);
    $('insightDonutCaption').textContent = tr('count');
    cats.filter(k => counts[k]).forEach(key => {
      const button = textNode('button', 'insight-legend-item', '');
      button.type = 'button';
      button.setAttribute('aria-pressed', String(state.category === key));
      button.title = tr('chartTip');
      const left = textNode('span', 'insight-legend-name', '');
      const swatch = textNode('i', 'insight-swatch');
      swatch.style.background = colors[key];
      left.append(swatch, document.createTextNode(categoryName(key)));
      const right = textNode('strong', '', fmt(counts[key]) + ' · ' + Math.round(counts[key] / total * 100) + '%');
      button.append(left, right);
      button.addEventListener('click', () => {
        state.category = state.category === key ? 'all' : key;
        render();
      });
      legend.append(button);
    });
    if (!total) legend.append(textNode('p', 'insight-no-data', tr('noData')));
  }
  function renderTechnologies() {
    const host = $('insightTechBars');
    host.replaceChildren();
    const counts = new Map();
    filtered('tech').forEach(row => row.technologies.forEach(t => {
      const key = norm(t);
      const current = counts.get(key);
      counts.set(key, { label: current?.label || t, count: (current?.count || 0) + 1 });
    }));
    const popular = [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, 8);
    if (!popular.length) { empty(host); return; }
    const max = popular[0].count;
    popular.forEach((item, i) => {
      const button = textNode('button', 'insight-bar-row', '');
      button.type = 'button';
      button.setAttribute('aria-pressed', String(norm(state.tech) === norm(item.label)));
      button.title = tr('chartTip');
      button.append(textNode('span', 'insight-bar-num', String(i + 1).padStart(2, '0')));
      const main = textNode('span', 'insight-bar-main');
      const top = textNode('span', 'insight-bar-top');
      top.append(textNode('span', '', item.label), textNode('strong', '', fmt(item.count)));
      const track = textNode('span', 'insight-bar-track');
      const fill = textNode('i', 'insight-bar-fill');
      fill.style.width = Math.max(2, item.count / max * 100) + '%';
      track.append(fill);
      main.append(top, track); button.append(main);
      button.addEventListener('click', () => {
        state.tech = norm(state.tech) === norm(item.label) ? '' : item.label;
        render();
      });
      host.append(button);
    });
  }
  function renderTimeline() {
    const host = $('insightTimeline');
    host.replaceChildren();
    const base = filtered('year');
    const years = [...new Set(base.flatMap(r => [r.created, r.pushed]).filter(v => v !== null))].sort((a, b) => a - b);
    if (!years.length) { empty(host); return; }
    const series = years.map(year => ({
      year, created: base.filter(r => r.created === year).length,
      pushed: base.filter(r => r.pushed === year).length
    }));
    const max = Math.max(1, ...series.flatMap(r => [r.created, r.pushed]));
    const graph = textNode('div', 'insight-timeline-graph');
    series.forEach(d => {
      const col = textNode('div', 'insight-timeline-col');
      const bars = textNode('div', 'insight-timeline-pair');
      ['created', 'pushed'].forEach(kind => {
        const b = textNode('button', 'insight-timeline-bar ' + kind);
        b.type = 'button';
        b.style.height = Math.max(d[kind] ? 7 : 2, d[kind] / max * 100) + '%';
        b.title = d.year + ' · ' + tr(kind) + ': ' + d[kind];
        b.setAttribute('aria-label', b.title);
        b.setAttribute('aria-pressed', String(state.year === d.year && state.yearKind === kind));
        b.addEventListener('click', () => {
          if (state.year === d.year && state.yearKind === kind) state.year = null;
          else { state.year = d.year; state.yearKind = kind; }
          render();
        });
        bars.append(b);
      });
      col.append(bars, textNode('span', 'insight-year', String(d.year)));
      graph.append(col);
    });
    const key = textNode('div', 'insight-timeline-key');
    [['created', tr('created')], ['pushed', tr('pushed')]].forEach(([kind, title]) => {
      const s = textNode('span', '', title);
      s.prepend(textNode('i', 'insight-key-' + kind));
      key.append(s);
    });
    host.append(graph, key);
  }
  function renderMatrix() {
    const host = $('insightMatrix');
    host.replaceChildren();
    // Cross-filter context: ignore both category AND era, keep the other filters.
    const rows = state.rows.filter(r => {
      if (state.source !== 'all' && r.source !== state.source) return false;
      if (state.tech && !r.technologies.some(v => norm(v) === norm(state.tech))) return false;
      if (state.year !== null && r[state.yearKind] !== state.year) return false;
      if (state.search && !norm([r.repo, r.title, ...r.technologies].join(' ')).includes(norm(state.search))) return false;
      return true;
    });
    const eras = ['academica', 'aplicada'];
    host.append(textNode('span', 'insight-matrix-header', ''));
    eras.forEach(e => host.append(textNode('span', 'insight-matrix-header', tr(e === 'academica' ? 'academic' : 'applied'))));
    const max = Math.max(1, ...cats.flatMap(cat => eras.map(era => rows.filter(r => r.category === cat && r.era === era).length)));
    cats.filter(cat => rows.some(r => r.category === cat)).forEach(cat => {
      host.append(textNode('span', 'insight-matrix-rowlabel', categoryName(cat)));
      eras.forEach(era => {
        const count = rows.filter(r => r.category === cat && r.era === era).length;
        const button = textNode('button', 'insight-matrix-cell', String(count));
        button.type = 'button';
        button.style.setProperty('--heat', (count / max * 0.53 + 0.09).toFixed(2));
        button.title = categoryName(cat) + ' · ' + tr(era === 'academica' ? 'academic' : 'applied') + ': ' + count;
        button.setAttribute('aria-label', button.title + '. ' + tr('chartTip'));
        button.setAttribute('aria-pressed', String(state.category === cat && state.era === era));
        button.disabled = count === 0;
        button.addEventListener('click', () => {
          if (state.category === cat && state.era === era) { state.category = 'all'; state.era = 'all'; }
          else { state.category = cat; state.era = era; }
          render();
        });
        host.append(button);
      });
    });
    if (!rows.length) empty(host);
  }
  function safeGithubLink(value) {
    try {
      const u = new URL(value);
      return u.protocol === 'https:' && u.hostname.toLowerCase() === 'github.com' ? u.href : '';
    } catch { return ''; }
  }
  function renderRank() {
    const host = $('insightRank');
    host.replaceChildren();
    const rows = filtered();
    if (!rows.length) { empty(host); return; }
    const hasStars = rows.some(r => r.stars !== null && r.stars > 0);
    const hasSizes = rows.some(r => r.size !== null && r.size > 0);
    const mode = hasStars ? 'stars' : hasSizes ? 'size' : 'recent';
    $('insightRankNote').textContent = tr(mode === 'stars' ? 'rankNoteStars' : mode === 'size' ? 'rankNoteSize' : 'rankNoteRecent');
    const ranked = [...rows].sort((a, b) =>
      mode === 'stars' ? (b.stars ?? -1) - (a.stars ?? -1)
        : mode === 'size' ? (b.size ?? -1) - (a.size ?? -1)
          : (b.pushedDate || '').localeCompare(a.pushedDate || '')
    ).slice(0, 5);
    const biggest = Math.max(1, ...ranked.map(r => mode === 'stars' ? r.stars ?? 0 : mode === 'size' ? r.size ?? 0 : 1));
    ranked.forEach((r, i) => {
      const article = textNode('div', 'insight-rank-item');
      const number = textNode('span', 'insight-rank-index', String(i + 1).padStart(2, '0'));
      const main = textNode('div', 'insight-rank-main');
      const name = safeGithubLink(r.url)
        ? textNode('a', 'insight-rank-link', r.title)
        : textNode('span', 'insight-rank-link', r.title);
      if (name.tagName === 'A') { name.href = safeGithubLink(r.url); name.target = '_blank'; name.rel = 'noopener noreferrer'; }
      const detail = textNode('small', '', categoryName(r.category));
      const track = textNode('span', 'insight-rank-track');
      const fill = textNode('i', '');
      fill.style.width = (mode === 'recent' ? 90 : Math.max(3, (mode === 'stars' ? r.stars ?? 0 : r.size ?? 0) / biggest * 100)) + '%';
      track.append(fill); main.append(name, detail, track);
      const value = mode === 'stars'
        ? (r.stars === null ? '—' : fmt(r.stars) + ' ★')
        : mode === 'size' ? (r.size === null ? '—' : fmt(r.size) + ' KB')
          : r.pushedDate ? r.pushedDate.slice(0, 10) : '—';
      article.append(number, main, textNode('strong', 'insight-rank-value', value));
      host.append(article);
    });
  }
  function render() {
    if (!state.rows.length) return;
    const selected = filtered();
    syncSelects();
    renderMetrics(selected);
    if ($('insightSearch').value !== state.search) $('insightSearch').value = state.search;
    $('insightDashboard').hidden = false;
    $('insightEmpty').hidden = true;
    $('insightNoResults').hidden = selected.length !== 0;
    renderDonut();
    renderTechnologies();
    renderTimeline();
    renderMatrix();
    renderRank();
  }
  function translate() {
    language = document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'pt';
    $all('[data-insight-text]', document).forEach(node => {
      node.textContent = tr(node.dataset.insightText);
    });
    $all('[data-insight-placeholder]', document).forEach(node => {
      node.placeholder = tr(node.dataset.insightPlaceholder);
    });
    $('insightUpload').setAttribute('aria-label', tr('selectFile'));
    $('insightClose').setAttribute('aria-label', tr('closeLabel'));
    if (state.rows.length) render();
  }
  function resetFilters() {
    Object.assign(state, { category: 'all', era: 'all', source: 'all', tech: '', search: '', year: null, yearKind: 'pushed' });
    render();
  }
  function loadCsv(csv, file) {
    try {
      const data = normalizeInventory(csv);
      state.rows = data;
      state.file = file;
      resetFilters();
      setError('');
      return true;
    } catch (err) {
      setError(err.message || tr('badFile'));
      return false;
    }
  }
  async function handleFile(file) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setError(tr('fileTooBig')); return; }
    try {
      const csv = await file.text();
      loadCsv(csv, file.name);
    } catch { setError(tr('fileError')); }
  }
  function open() {
    lastFocus = document.activeElement;
    translate();
    if (!dialog.open) dialog.showModal();
    document.documentElement.classList.add('insights-modal-open');
    $('insightClose').focus({ preventScroll: true });
  }
  $('openCsvExplorer').addEventListener('click', open);
  $('insightClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('insights-modal-open');
    if (lastFocus?.isConnected && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  $('insightUpload').addEventListener('change', event => {
    handleFile(event.target.files?.[0]);
    event.target.value = '';
  });
  const drop = $('insightDrop');
  ['dragenter', 'dragover'].forEach(type => drop.addEventListener(type, event => {
    event.preventDefault();
    drop.classList.add('drag-over');
  }));
  ['dragleave', 'drop'].forEach(type => drop.addEventListener(type, event => {
    event.preventDefault();
    drop.classList.remove('drag-over');
    if (type === 'drop') handleFile(event.dataTransfer?.files?.[0]);
  }));
  $('insightUseGenerated').addEventListener('click', () => {
    if (state.latestCsv) loadCsv(state.latestCsv, language === 'en' ? 'Generated inventory' : 'Inventário gerado');
  });
  $('insightClearFilters').addEventListener('click', resetFilters);
  $('insightCategory').addEventListener('change', event => { state.category = event.target.value; render(); });
  $('insightEra').addEventListener('change', event => { state.era = event.target.value; render(); });
  $('insightSource').addEventListener('change', event => { state.source = event.target.value; render(); });
  $('insightSearch').addEventListener('input', event => { state.search = event.target.value; render(); $('insightSearch').focus(); });
  $('insightYearBadge').addEventListener('click', () => { state.year = null; render(); });
  window.addEventListener('portfolio:inventory-ready', event => {
    if (typeof event.detail?.csv !== 'string') return;
    state.latestCsv = event.detail.csv;
    $('insightUseGenerated').disabled = false;
  });
  window.addEventListener('portfolio:inventory-reset', () => {
    state.latestCsv = '';
    $('insightUseGenerated').disabled = true;
  });
  window.addEventListener('portfolio:language-change', translate);
  syncSelects();
  translate();
})();
