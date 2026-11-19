/* Interactive CSV insights — entirely client-side, no analytics backend or dependencies. */
(() => {
  'use strict';
  const dialog = document.getElementById('csvInsightDialog');
  if (!dialog) return;
  const $ = id => document.getElementById(id);
  const $all = (query, parent = dialog) => Array.from(parent.querySelectorAll(query));
  const state = {
    rows: [], file: '', latestCsv: '', category: 'all', era: 'all',
    source: 'all', tech: '', search: ''
  };
  let lastFocus = null;
  let language = document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'pt';
  const colors = { bots: '#a58bff', web: '#69efce', dados: '#ecacff', fluxos: '#e8c078', outros: '#8694bb' };
  const cats = ['bots', 'web', 'dados', 'fluxos', 'outros'];
  const words = {
    pt: {
      open: '◈ Analisar CSV', eyebrow: 'DEMO_002 / DATA EXPLORER',
      title: 'Análise do inventário.', subtitle: 'Compare projetos, tecnologias e características dos repositórios com filtros interativos.',
      upload: 'Selecionar arquivo CSV', drop: 'Clique para escolher ou arraste um CSV exportado pela demonstração.',
      privacy: 'Leitura 100% local no navegador. Nenhum arquivo é enviado.',
      current: 'Usar inventário desta sessão', emptyTitle: 'Nenhum arquivo carregado.',
      emptyBody: 'O painel analisa o inventário CSV da demonstração. É possível selecionar um arquivo existente ou utilizar o inventário gerado nesta sessão.',
      close: 'Fechar painel', clear: 'Limpar filtros', all: 'Todos',
      filterCat: 'Tipo de projeto', filterEra: 'Origem do projeto', filterSource: 'Fonte dos metadados',
      filterSearch: 'Buscar tecnologia', filterSearchPlaceholder: 'Nome da tecnologia...',
      selected: 'Repositórios', api: 'Tipos de projeto', techs: 'Tecnologias', push: 'Linguagens principais',
      selectionInfo: (shown, total) => `Exibindo ${shown} de ${total} repositórios selecionados`,
      count: 'projetos', donutTitle: 'Projetos por tipo',
      donutNote: 'Agrupamento pela finalidade dos projetos. As ferramentas e técnicas aparecem nos gráficos seguintes.',
      techTitle: 'Ferramentas e técnicas', techNote: 'Cada barra indica quantos dos repositórios selecionados utilizam a ferramenta ou técnica.',
      stackTitle: 'Ferramentas por repositório',
      stackNote: 'As colunas são repositórios selecionados e as linhas são tecnologias ou técnicas. Um ponto indica a presença da ferramenta no projeto.',
      stackEmpty: 'Não há tecnologias declaradas na seleção.',
      stackInfo: (shown, all, techShown, techAll) => `Exibindo ${shown} de ${all} repositórios · ${techShown} de ${techAll} tecnologias · clique em uma linha ou ponto para filtrar`,
      matrixTitle: 'Categorias e contextos',
      matrixNote: 'Cruza o tipo de projeto com o contexto informado no catálogo.',
      academic: 'Faculdade', applied: 'Aplicações', other: 'Não informado',
      rankTitle: 'Comparativo de repositórios', rankNoteSize: 'Ordenados pelo tamanho aproximado (KB), conforme a API do GitHub.',
      rankNoteStars: 'Ordenados pelo número de estrelas registrado no CSV.',
      rankNoteRecent: 'Ordenados pela data de último push registrada no CSV.',
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
      missingMeta: 'A análise utiliza somente os dados presentes no CSV. Campos ausentes não são estimados e valores iguais a zero são preservados.',
      reset: 'Reiniciar seleção', selectFile: 'Escolher arquivo CSV',
      updated: 'Atualizado em', size: 'Tamanho (KB)', localNotice: 'Itens de curadoria local podem não ter datas e métricas.',
      coverageTitle: 'Completude dos dados', coverageNote: 'Proporção de repositórios com metadados disponíveis; zero é um valor válido.',
      coverageCreated: 'Criação', coveragePushed: 'Último push', coverageStars: 'Estrelas',
      coverageForks: 'Forks', coverageIssues: 'Issues abertas', coverageSize: 'Tamanho',
      closeLabel: 'Fechar'
    },
    en: {
      open: '◈ Analyze CSV', eyebrow: 'DEMO_002 / DATA EXPLORER',
      title: 'Repository inventory analysis.', subtitle: 'Compare projects, technologies and repository characteristics with interactive filters.',
      upload: 'Select CSV file', drop: 'Choose a file or drop a CSV exported by this demo.',
      privacy: 'Processed locally in your browser. Nothing is uploaded.',
      current: 'Use current session inventory', emptyTitle: 'No file loaded.',
      emptyBody: 'This dashboard analyzes CSV files exported by the demo. Load a previous export or use the inventory generated in the current session.',
      close: 'Close dashboard', clear: 'Clear filters', all: 'All',
      filterCat: 'Project type', filterEra: 'Project context', filterSource: 'Metadata source',
      filterSearch: 'Search technologies', filterSearchPlaceholder: 'Technology name...',
      selected: 'Repositories', api: 'Project types', techs: 'Technologies', push: 'Primary languages',
      selectionInfo: (shown, total) => `Showing ${shown} of ${total} selected repositories`,
      count: 'projects', donutTitle: 'Projects by type',
      donutNote: 'Grouped by what each project does. Tools and techniques are shown in the charts below.',
      techTitle: 'Tools and techniques', techNote: 'Each bar counts the selected repositories using that tool or technique.',
      stackTitle: 'Tools by repository',
      stackNote: 'Columns are selected repositories and rows are tools or techniques. A dot marks where each one is used.',
      stackEmpty: 'No technologies are available in this selection.',
      stackInfo: (shown, all, techShown, techAll) => `Showing ${shown} of ${all} repositories · ${techShown} of ${techAll} technologies · select a row or dot to filter`,
      matrixTitle: 'Categories and contexts',
      matrixNote: 'Compares project types by the context recorded in the catalog.',
      academic: 'University', applied: 'Applied', other: 'Not available',
      rankTitle: 'Repository comparison', rankNoteSize: 'Sorted by approximate size in KB, as reported by the GitHub API.',
      rankNoteStars: 'Sorted by the number of stars recorded in the CSV.',
      rankNoteRecent: 'Sorted by the last push date recorded in the CSV.',
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
      missingMeta: 'Only fields present in the CSV are used. Missing values are not estimated; zero remains a valid value.',
      reset: 'Reset selection', selectFile: 'Choose CSV file',
      updated: 'Updated', size: 'Size (KB)', localNotice: 'Locally curated records may not have dates or API metrics.',
      coverageTitle: 'Metadata completeness', coverageNote: 'Share of repositories with available metadata; zero is a valid value.',
      coverageCreated: 'Created', coveragePushed: 'Last push', coverageStars: 'Stars',
      coverageForks: 'Forks', coverageIssues: 'Open issues', coverageSize: 'Size',
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
    if (/bot|assist|rpa/.test(v)) return 'bots';
    if (/web|scrap|crawler|extrac|coleta.*conteudo|content extraction/.test(v)) return 'web';
    if (/dados|data|etl|pipeline|integrac|integration/.test(v)) return 'dados';
    if (/automat|workflow|fluxo/.test(v)) return 'fluxos';
    return 'outros';
  }
  function categoryName(key) {
    const map = {
      pt: { bots: 'Bots e assistentes', web: 'Extração de conteúdo', dados: 'Dados e integração', fluxos: 'Automação de rotinas', outros: 'Outros projetos' },
      en: { bots: 'Bots and assistants', web: 'Content extraction', dados: 'Data and integration', fluxos: 'Workflow automation', outros: 'Other projects' }
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
  function matchesTechnologySearch(row) {
    // Busca somente tecnologias declaradas no CSV e a linguagem principal,
    // já incluída na lista de tecnologias normalizada de cada registro.
    const term = norm(state.search.trim());
    return !term || row.technologies.some(technology => norm(technology).includes(term));
  }
  function hasMatch(row, except = '') {
    if (except !== 'category' && state.category !== 'all' && row.category !== state.category) return false;
    if (except !== 'era' && state.era !== 'all' && row.era !== state.era) return false;
    if (except !== 'source' && state.source !== 'all' && row.source !== state.source) return false;
    if (except !== 'tech' && state.tech && !row.technologies.some(v => norm(v) === norm(state.tech))) return false;
    if (!matchesTechnologySearch(row)) return false;
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
    metric('insightMetricApi', new Set(rows.map(r => r.category)).size);
    metric('insightMetricTech', new Set(rows.flatMap(r => r.technologies.map(norm))).size);
    metric('insightMetricPush', new Set(rows.map(r => norm(r.language)).filter(Boolean)).size);
    $('insightFileLabel').textContent = tr('loaded') + ' ' + state.file + ' · ' + fmt(state.rows.length) + ' ' + tr('rows');
    const active = [state.category !== 'all', state.era !== 'all', state.source !== 'all', !!state.tech, !!state.search].some(Boolean);
    $('insightActiveFilter').textContent = tr('selectionInfo')(rows.length, state.rows.length);
    $('insightActiveFilter').hidden = false;
    $('insightActiveFilter').setAttribute('data-filtered', String(active));
    $('insightClearFilters').disabled = !active;
  }
  function renderDonut() {
    // All graphs use the same selected set. Never ignore category when a
    // category has already been chosen: that made 2 selected look like 6.
    const rows = filtered();
    const ring = $('insightDonut');
    const legend = $('insightCategoriesLegend');
    legend.replaceChildren();
    const counts = Object.fromEntries(cats.map(key =>
      [key, rows.filter(row => row.category === key).length]));
    const activeCats = cats.filter(key => counts[key] > 0);
    const total = rows.length;
    $('insightDonutNumber').textContent = fmt(total);
    $('insightDonutCaption').textContent = tr('count');
    $('insightDonutNote').textContent = tr('donutNote');
    ring.setAttribute('aria-label', tr('donutTitle') + ': ' + fmt(total));

    // A fatia SEMPRE significa tipo de projeto. Nunca mudar o significado
    // para "projeto individual" quando há só um tipo no filtro.
    let offset = 0;
    const parts = activeCats.map(key => {
      const from = offset, to = (offset += counts[key] / total * 100);
      return colors[key] + ' ' + from.toFixed(3) + '% ' + to.toFixed(3) + '%';
    });
    ring.style.background = parts.length
      ? 'conic-gradient(' + parts.join(', ') + ')' : '#242b41';

    activeCats.forEach(key => {
      const button = textNode('button', 'insight-legend-item');
      button.type = 'button';
      button.setAttribute('aria-pressed', String(state.category === key));
      button.title = tr('chartTip');
      const left = textNode('span', 'insight-legend-name');
      const swatch = textNode('i', 'insight-swatch');
      swatch.style.background = colors[key];
      left.append(swatch, document.createTextNode(categoryName(key)));
      button.append(left, textNode('strong', '',
        fmt(counts[key]) + ' · ' + Math.round(counts[key] / total * 100) + '%'));
      button.addEventListener('click', () => {
        state.category = state.category === key ? 'all' : key;
        render();
      });
      legend.append(button);

      // Mostrar nomes reais para diferenciar TIPO de REPOSITÓRIO.
      // Em CSVs longos, o comparativo inferior continua sendo a lista.
      if (total <= 10) {
        rows.filter(row => row.category === key)
          .sort((a, b) => a.title.localeCompare(b.title, language === 'en' ? 'en' : 'pt'))
          .forEach(project => {
            const item = textNode('div', 'insight-project-item');
            const left = textNode('span', 'insight-legend-name');
            const dot = textNode('i', 'insight-project-bullet');
            dot.style.background = colors[key];
            const url = safeGithubLink(project.url);
            const name = textNode(url ? 'a' : 'span', 'insight-project-name', project.title);
            name.title = project.title;
            if (url) {
              name.href = url;
              name.target = '_blank';
              name.rel = 'noopener noreferrer';
            }
            left.append(dot, name);
            item.append(left);
            legend.append(item);
          });
      }
    });
    if (!total) legend.append(textNode('p', 'insight-no-data', tr('noData')));
  }
  function renderTechnologies() {
    const host = $('insightTechBars');
    host.replaceChildren();
    const counts = new Map();
    filtered().forEach(row => row.technologies.forEach(t => {
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
  /* Repository × technology matrix; every dot is backed by a CSV tag. */
  function renderStackMap() {
    const host = $('insightStackMap'), summary = $('insightStackSummary');
    host.replaceChildren();
    const all = filtered().slice().sort((a,b) => a.title.localeCompare(b.title));
    const rows = all.slice(0, 18), counts = new Map();
    rows.forEach(p => p.technologies.forEach(t => {
      const key = norm(t), x = counts.get(key);
      if (x) x.count++;
      else counts.set(key, {key, title:t, count:1});
    }));
    const techs = [...counts.values()].sort((a,b) => b.count-a.count || a.title.localeCompare(b.title));
    const visible = techs.slice(0,14);
    if (!rows.length || !visible.length) {
      empty(host, tr('stackEmpty'));
      summary.textContent = '';
      return;
    }
    const matrix = textNode('div','insight-stack-matrix');
    matrix.style.setProperty('--stack-columns',rows.length);
    matrix.append(textNode('span','insight-stack-corner','STACK / REPOS'));
    rows.forEach(p => {
      const url = safeGithubLink(p.url);
      const node = textNode(url?'a':'span','insight-stack-project',p.title);
      node.title=p.title;
      if (url){node.href=url;node.target='_blank';node.rel='noopener noreferrer'}
      matrix.append(node);
    });
    visible.forEach(tech => {
      const label = textNode('button','insight-stack-technology');
      label.type='button';
      label.title=tech.title;
      label.setAttribute('aria-pressed',String(norm(state.tech)===tech.key));
      label.append(textNode('span','',tech.title),textNode('small','',fmt(tech.count)));
      const toggle = () => {state.tech=norm(state.tech)===tech.key?'':tech.title;render()};
      label.addEventListener('click',toggle);
      matrix.append(label);
      rows.forEach(p => {
        const cell=textNode('span','insight-stack-cell');
        if (p.technologies.some(t=>norm(t)===tech.key)) {
          const dot=textNode('button','insight-stack-dot');
          dot.type='button';
          dot.title=p.title+' · '+tech.title;
          dot.style.setProperty('--dot-color',colors[p.category]);
          dot.setAttribute('aria-label',dot.title);
          dot.setAttribute('aria-pressed',String(norm(state.tech)===tech.key));
          dot.addEventListener('click',toggle);
          cell.append(dot);
        } else cell.setAttribute('aria-hidden','true');
        matrix.append(cell);
      });
    });
    host.append(matrix);
    summary.textContent = tr('stackInfo')(rows.length, all.length, visible.length, techs.length);
  }
  function renderMatrix() {
    const host = $('insightMatrix');
    host.replaceChildren();
    // Same selected repositories as all other visualizations.
    const rows = filtered();
    const eraLabels = { academica: 'academic', aplicada: 'applied', outros: 'other' };
    const eras = Object.keys(eraLabels);
    host.append(textNode('span', 'insight-matrix-header', ''));
    eras.forEach(era => host.append(textNode('span', 'insight-matrix-header', tr(eraLabels[era]))));
    const max = Math.max(1, ...cats.flatMap(cat => eras.map(era => rows.filter(r => r.category === cat && r.era === era).length)));
    cats.filter(cat => rows.some(r => r.category === cat)).forEach(cat => {
      host.append(textNode('span', 'insight-matrix-rowlabel', categoryName(cat)));
      eras.forEach(era => {
        const count = rows.filter(r => r.category === cat && r.era === era).length;
        const button = textNode('button', 'insight-matrix-cell', String(count));
        button.type = 'button';
        button.style.setProperty('--heat', (count / max * 0.53 + 0.09).toFixed(2));
        button.title = categoryName(cat) + ' · ' + tr(eraLabels[era]) + ': ' + count;
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
    renderStackMap();
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
    Object.assign(state, { category: 'all', era: 'all', source: 'all', tech: '', search: '' });
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
