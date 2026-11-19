/* ============================================================
   BRANDON SARAIVA — RPA PORTFOLIO
   100% static for GitHub Pages. No framework, token or backend.
   Public GitHub API -> project catalog -> real CSV inventory.
   ============================================================ */
(() => {
  'use strict';
  document.documentElement.classList.add('js-enabled');
  const config = window.PORTFOLIO_CONFIG;
  const catalog = window.PORTFOLIO_CATALOG;
  if (!config || !catalog) return;
  const { normalize, dateValue, newestFirst, listPublicRepositories, buildProjects, readSnapshot } = catalog;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const dictionary = window.PORTFOLIO_I18N || {};
  const curated = config.curatedProjects.map((project) => ({ ...project, source: 'curated', meta: null }));
  let allProjects = [...curated];
  let githubRepoCount = null;
  let source = 'curated';
  let snapshotDate = '';
  let lastSync = 0;
  let checkingGitHub = false;
  let activeRequest = null;
  let activeFilter = 'todos';
  let activeEra = 'ambas';
  let activeSort = 'recent';
  let searchTerm = '';
  let generatedCsv = null;
  let executing = false;
  let language = 'pt';

  /* ========= Full interface localization ========= */
  const ignoreStatic = '#projectSource,#projectResult,#projectSyncText,#refreshProjects,#projectGrid,#demoLog,#demoState,#demoProgress,#demoProgressLabel,#runDemoLabel,#heroConsole,#metricInput,#metricValid,#metricOutput,#languageSwitch';
  const textRecords = [];
  const attrRecords = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.textContent.trim()) continue;
    const p = node.parentElement;
    if (!p || p.closest(ignoreStatic) || p.closest('script,style,svg')) continue;
    textRecords.push({ node, original: node.textContent });
  }
  $$('[aria-label],[title],[placeholder]').forEach(el => {
    for (const attr of ['aria-label', 'title', 'placeholder']) {
      if (el.hasAttribute(attr) && !el.closest(ignoreStatic)) attrRecords.push({ el, attr, original: el.getAttribute(attr) });
    }
  });
  const attrTranslations = {
    'Brandon Saraiva, voltar ao início': 'Brandon Saraiva, back to home',
    'Navegação principal': 'Main navigation',
    'Navegação mobile': 'Mobile navigation',
    'Abrir menu': 'Open menu',
    'Fechar menu': 'Close menu',
    'Áreas de atuação': 'Areas of expertise',
    'Representação animada de um fluxo automatizado com etapas de entrada, processamento e entrega': 'Animated representation of an automated workflow with input, processing and output stages',
    'Tecnologias e especialidades': 'Technologies and areas of expertise',
    'Filtrar projetos por especialidade': 'Filter projects by area',
    'Filtrar projetos por contexto': 'Filter projects by context',
    'Buscar projetos': 'Search projects',
    'Buscar projeto ou tecnologia...': 'Search projects or technologies...',
    'Terminal de demonstração de automação': 'Automation catalog terminal',
    'Etapas do processamento': 'Processing stages',
    'Switch to English': 'Switch to English'
  };
  const messages = {
    pt: {
      projects: n => `${n} projeto${n === 1 ? '' : 's'} encontrado${n === 1 ? '' : 's'}`,
      repoLink: 'Ver repositório',
      linkLabel: title => `Ver projeto ${title} no GitHub (abre nova guia)`,
      sourceLocal: 'Curadoria local', sourceGitHub: 'Sincronizado com o GitHub',
      sourceSnapshot: 'Cópia do catálogo', sourceChecking: 'Consultando GitHub…',
      syncOk: (n, time) => `${n} repositórios consultados · ${time}`,
      syncSnapshot: date => `API indisponível · versão de ${date}`,
      syncFailed: 'API indisponível · projetos selecionados',
      refresh: 'Sincronizar', refreshing: 'Sincronizando…',
      createdLabel: 'Criado em', recent: 'Novo', release: 'Downloads',
      run: '▶  Gerar inventário',
      running: '⟳  Consultando GitHub...',
      again: '↻  Atualizar inventário',
      ready: 'AGUARDANDO EXECUÇÃO',
      runningState: 'PROCESSANDO REPOSITÓRIOS',
      done: 'INVENTÁRIO PRONTO',
      failed: 'ERRO NA EXPORTAÇÃO',
      logStart: 'Iniciando consulta aos repositórios públicos...',
      logOnline: n => `GitHub respondeu: ${n} repositórios públicos consultados.`,
      logOffline: 'API indisponível. O inventário usa a cópia disponível do catálogo.',
      logFilter: n => `${n} projetos elegíveis incluídos no inventário.`,
      logEnrich: n => `${n} projetos organizados com categorias, eras, tecnologias e metadados disponíveis.`,
      logCsv: n => `CSV preparado: ${n} projetos. Arquivo gerado a partir do catálogo atual.`,
      logError: 'Não foi possível preparar o inventário. Tente novamente.',
      logDownload: 'Download do inventário CSV iniciado.',
      heroLines: [
        'github.repos() → consultando metadados',
        'repository.filter() → selecionando projetos públicos',
        'catalog.enrich() → organizando projetos',
        'inventory.export() → CSV disponível',
        'system.monitor() → aguardando atualização'
      ],
      offlineDescription: 'Consulte a documentação e o código no GitHub.'
    },
    en: {
      projects: n => `${n} project${n === 1 ? '' : 's'} found`,
      repoLink: 'View repository',
      linkLabel: title => `View ${title} on GitHub (opens in a new tab)`,
      sourceLocal: 'Curated projects', sourceGitHub: 'Synced with GitHub',
      sourceSnapshot: 'Saved catalog', sourceChecking: 'Checking GitHub…',
      syncOk: (n, time) => `${n} repositories checked · ${time}`,
      syncSnapshot: date => `API unavailable · version from ${date}`,
      syncFailed: 'API unavailable · selected projects',
      refresh: 'Sync now', refreshing: 'Syncing…',
      createdLabel: 'Created', recent: 'New', release: 'Downloads',
      run: '▶  Build inventory',
      running: '⟳  Checking GitHub...',
      again: '↻  Refresh inventory',
      ready: 'READY TO RUN',
      runningState: 'PROCESSING REPOSITORIES',
      done: 'INVENTORY READY',
      failed: 'EXPORT ERROR',
      logStart: 'Querying public repositories...',
      logOnline: n => `GitHub responded: ${n} public repositories checked.`,
      logOffline: 'API unavailable. The inventory uses the available catalog copy.',
      logFilter: n => `${n} eligible projects included in the inventory.`,
      logEnrich: n => `${n} projects enriched with categories, eras, technologies and available metadata.`,
      logCsv: n => `CSV ready: ${n} projects. The file reflects the current catalog.`,
      logError: 'Could not prepare the inventory. Please retry.',
      logDownload: 'CSV inventory download started.',
      heroLines: [
        'github.repos() → fetching metadata',
        'repository.filter() → selecting public projects',
        'catalog.enrich() → organizing projects',
        'inventory.export() → CSV available',
        'system.monitor() → waiting for updates'
      ],
      offlineDescription: 'See the documentation and code on GitHub.'
    }
  };
  const m = () => messages[language];
  function formatDate(iso) {
    const value = dateValue(iso);
    if (!value) return '';
    return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'pt-BR', {
      dateStyle: 'medium', timeZone: 'America/Sao_Paulo'
    }).format(value);
  }
  function translateStatic(lang) {
    for (const record of textRecords) {
      if (!record.node.isConnected) continue;
      const value = record.original.trim();
      const translated = lang === 'en' ? dictionary[value] : null;
      record.node.textContent = translated ? record.original.replace(value, translated) : record.original;
    }
    for (const record of attrRecords) {
      if (!record.el.isConnected) continue;
      record.el.setAttribute(record.attr, lang === 'en' ? attrTranslations[record.original] || record.original : record.original);
    }
  }
  function setLanguage(lang, persist = true) {
    language = lang === 'en' ? 'en' : 'pt';
    document.documentElement.lang = language === 'en' ? 'en' : 'pt-BR';
    translateStatic(language);
    $('#languageCurrent').textContent = language.toUpperCase();
    $('#languageNext').textContent = language === 'en' ? 'PT' : 'EN';
    const changeLabel = language === 'en' ? 'Mudar para português' : 'Switch to English';
    $('#languageSwitch').setAttribute('aria-label', changeLabel);
    $('#languageSwitch').title = changeLabel;
    document.title = 'Brandon Saraiva | RPA & Automation Engineer';
    $('meta[name="description"]').content = language === 'en'
      ? 'Brandon Saraiva portfolio: RPA, process automation, web scraping, bots and data engineering. University projects and applied work.'
      : 'Portfólio de Brandon Saraiva: RPA, automação de processos, web scraping, bots e engenharia de dados. Projetos acadêmicos e aplicações.';
    $('meta[property="og:description"]').content = language === 'en'
      ? 'University projects and applied work in process automation, RPA and data engineering.'
      : 'Projetos acadêmicos e aplicações em automação de processos, RPA e engenharia de dados.';
    $('#projectSearch').placeholder = language === 'en' ? 'Search projects or technologies...' : 'Buscar projeto ou tecnologia...';
    $('#runDemoLabel').textContent = executing ? m().running : generatedCsv ? m().again : m().run;
    $('#downloadCsv').textContent = language === 'en' ? '↓ Download CSV' : '↓ Baixar CSV';
    const contactSubject = language === 'en'
      ? 'Professional inquiry | Brandon Saraiva portfolio'
      : 'Contato profissional | Portfólio Brandon Saraiva';
    $('.button-contact').href = `mailto:trabalhobrandon@gmail.com?subject=${encodeURIComponent(contactSubject)}`;
    if (!executing) $('#demoState').textContent = generatedCsv ? m().done : m().ready;
    updateSourceLabel();
    updateProjects();
    updateHeroConsoleText();
    window.dispatchEvent(new CustomEvent('portfolio:language-change', { detail: { language } }));
    if (persist) { try { localStorage.setItem('brandon-rpa-language', language); } catch (_) { /* private mode */ } }
  }

  /* ========= Project gallery + eras ========= */
  const symbols = { bot: '⌘', data: '⋈', scrape: '⌗', message: '✉', database: '▤', telegram: '◈', workflow: '◇', generic: '⟡' };
  const labels = {
    pt: { bots: 'Bots e assistentes', web: 'Extração de conteúdo', dados: 'Dados e integração', fluxos: 'Automação de rotinas', outros: 'Outros projetos' },
    en: { bots: 'Bots and assistants', web: 'Content extraction', dados: 'Data and integration', fluxos: 'Workflow automation', outros: 'Other projects' }
  };
  const eraText = { pt: { aplicada: 'Aplicação', academica: 'Faculdade' }, en: { aplicada: 'Applied', academica: 'University' } };
  const categoryVisuals = { bots: 'bot', web: 'scrape', dados: 'database', fluxos: 'workflow' };
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text ?? '');
    return node;
  }
  function projectDescription(project) {
    return (language === 'en' ? project.description_en : project.description) || project.originalDescription || m().offlineDescription;
  }
  function renderProject(p) {
    const createdAt = p.meta?.created_at;
    const created = formatDate(createdAt);
    const age = Date.now() - dateValue(createdAt);
    const recent = age >= 0 && age < 30 * 86400000;
    const card = element('article', `project-card${p.feature ? ' is-featured' : ''}${recent ? ' is-recent' : ''}`);
    const top = element('div', 'project-card-top');
    top.append(element('span', 'project-type', (language === 'en' ? p.eyebrow_en : p.eyebrow) || labels[language][p.category]));
    if (recent) top.append(element('span', 'project-new', m().recent));
    card.append(top);
    const graphic = element('div', 'project-graphic');
    graphic.setAttribute('aria-hidden', 'true');
    graphic.append(element('span', 'project-glyph', symbols[p.visual || categoryVisuals[p.category]] || symbols.generic));
    card.append(graphic);
    if (p.era || p.context) {
      const strip = element('div', 'project-era-line');
      if (p.era) strip.append(element('span', 'project-era-pill', eraText[language][p.era]));
      if (p.context) strip.append(element('span', 'project-context', language === 'en' ? p.context_en || p.context : p.context));
      card.append(strip);
    }
    card.append(element('h3', null, p.title));
    card.append(element('p', null, projectDescription(p)));
    if (p.tags?.length) {
      const tags = element('div', 'project-tags');
      p.tags.slice(0, 4).forEach(tag => tags.append(element('span', null, tag)));
      card.append(tags);
    }
    if (created) {
      const date = element('div', 'project-created');
      const time = element('time', null, created);
      time.dateTime = createdAt;
      date.append(`${m().createdLabel} `, time);
      card.append(date);
    }
    const actions = element('div', 'project-card-actions');
    const link = element('a', 'project-card-link');
    link.href = p.url;
    link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', m().linkLabel(p.title));
    link.textContent = m().repoLink;
    actions.append(link);
    if (p.release) {
      const release = element('a', 'project-release', m().release);
      release.href = p.release;
      release.target = '_blank'; release.rel = 'noopener noreferrer';
      actions.append(release);
    }
    card.append(actions);
    return card;
  }
  function matchesSelection(project) {
    if (activeEra !== 'ambas' && (project.era || 'github') !== activeEra) return false;
    if (activeFilter !== 'todos' && project.category !== activeFilter) return false;
    if (!searchTerm) return true;
    const searchable = [
      project.title, project.repo, project.owner, project.description, project.description_en, project.originalDescription,
      project.eyebrow, project.eyebrow_en, project.context,
      ...(project.tags || []), ...(project.meta?.topics || [])
    ].join(' ');
    const text = normalize(searchable);
    return normalize(searchTerm).split(/\s+/).every(term => text.includes(term));
  }
  function updateProjects() {
    const list = allProjects.filter(project => matchesSelection(project));
    const locale = language === 'en' ? 'en' : 'pt-BR';
    if (activeSort === 'name') list.sort((a, b) => a.title.localeCompare(b.title, locale));
    else list.sort(activeSort === 'old' ? (a, b) => {
      const aTime = dateValue(a.meta?.created_at) || Infinity;
      const bTime = dateValue(b.meta?.created_at) || Infinity;
      return aTime - bTime || a.title.localeCompare(b.title, locale);
    } : newestFirst);
    $('#projectGrid').replaceChildren(...list.map(renderProject));
    $('#projectResult').textContent = m().projects(list.length);
    $('#projectEmpty').hidden = !!list.length;
  }
  function initProjectFilters() {
    $$('.filter').forEach(button => button.addEventListener('click', () => {
      activeFilter = button.dataset.filter;
      $$('.filter').forEach(el => { const on = el === button; el.classList.toggle('active', on); el.setAttribute('aria-pressed', String(on)); });
      updateProjects();
    }));
    $$('.era-button').forEach(button => button.addEventListener('click', () => {
      activeEra = button.dataset.eraFilter;
      $$('.era-button').forEach(el => { const on = el === button; el.classList.toggle('active', on); el.setAttribute('aria-pressed', String(on)); });
      updateProjects();
    }));
    $('#projectSearch').addEventListener('input', event => { searchTerm = event.target.value.trim(); updateProjects(); });
    $('#projectSort').addEventListener('change', event => { activeSort = event.target.value; updateProjects(); });
    $('#resetFilters').addEventListener('click', () => {
      searchTerm = '';
      $('#projectSearch').value = '';
      $('.era-button[data-era-filter="ambas"]').click();
      $('.filter[data-filter="todos"]').click();
      $('#projectSearch').focus();
    });
    $('#refreshProjects').addEventListener('click', syncGitHubProjects);
  }

  /* ========= Live GitHub catalog and published fallback ========= */
  function applyCatalog(repositories, date, nextSource, count = repositories.length) {
    if (nextSource === 'snapshot' && dateValue(date) <= dateValue(snapshotDate)) return;
    allProjects = buildProjects(config, repositories);
    githubRepoCount = count;
    snapshotDate = date;
    source = nextSource;
    updateProjects();
  }

  async function loadSnapshot(url) {
    try {
      const response = await fetch(url, { cache: 'no-cache', signal: AbortSignal.timeout(4000) });
      if (!response.ok) return;
      const snapshot = readSnapshot(await response.json());
      applyCatalog(snapshot.repositories, snapshot.generatedAt, 'snapshot', snapshot.repositoryCount);
    } catch (_) { /* Keep the current catalog if the copy is unavailable. */ }
  }

  function updateSourceLabel() {
    const text = checkingGitHub ? m().sourceChecking
      : { live: m().sourceGitHub, snapshot: m().sourceSnapshot, curated: m().sourceLocal }[source];
    $('#projectSourceText').textContent = text;
    $('#projectSource .meta-dot').classList.toggle('online', source === 'live' && !checkingGitHub);
    const time = source === 'live' ? new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'pt-BR', {
      timeStyle: 'short', timeZone: 'America/Sao_Paulo'
    }).format(dateValue(snapshotDate)) : '';
    $('#projectSyncText').textContent = checkingGitHub ? ''
      : source === 'live' ? m().syncOk(githubRepoCount, time)
      : source === 'snapshot' ? m().syncSnapshot(formatDate(snapshotDate)) : m().syncFailed;
    const button = $('#refreshProjects');
    button.textContent = checkingGitHub ? m().refreshing : m().refresh;
    button.setAttribute('aria-disabled', String(checkingGitHub));
  }

  function syncGitHubProjects() {
    if (activeRequest) return activeRequest;
    checkingGitHub = true;
    lastSync = Date.now();
    updateSourceLabel();
    activeRequest = (async () => {
      try {
        const repositories = await listPublicRepositories(config.githubAccounts, { signal: AbortSignal.timeout(8000) });
        applyCatalog(repositories, new Date().toISOString(), 'live');
        return { ok: true, count: githubRepoCount };
      } catch (_) {
        if (source === 'live') source = 'snapshot';
        await Promise.all([initialSnapshot, loadSnapshot(config.snapshotUrl)]);
        return { ok: false, count: githubRepoCount };
      } finally {
        checkingGitHub = false;
        activeRequest = null;
        updateSourceLabel();
      }
    })();
    return activeRequest;
  }

  /* ========= A real CSV inventory, not fabricated sample rows ========= */
  function csvRows() {
    const time = new Date().toISOString();
    return allProjects.map(p => ({
      repo: p.repo, titulo: p.title, categoria: labels[language][p.category] || p.category,
      era: eraText[language][p.era] || '',
      contexto: language === 'en' ? p.context_en || p.context || '' : p.context || '',
      descricao: (language === 'en' ? p.description_en : p.description) || p.originalDescription || '',
      descricao_original: p.originalDescription || '',
      assunto: labels[language][p.category] || p.category,
      linguagem: p.meta?.language || '', tecnologias: (p.tags || []).join(' | '),
      topicos: (p.meta?.topics || []).join(' | '),
      criado_em: p.meta?.created_at || '', atualizado_em: p.meta?.updated_at || '',
      ultimo_push: p.meta?.pushed_at || '', estrelas: p.meta?.stars ?? '',
      forks: p.meta?.forks ?? '', issues_abertas: p.meta?.open_issues ?? '',
      tamanho_kb: p.meta?.size_kb ?? '',
      url: p.url,
      fonte: p.meta ? 'GitHub API' : (language === 'en' ? 'Local catalog (dates unavailable)' : 'Curadoria local (datas indisponíveis)'),
      exportado_em: time
    }));
  }
  const csvColumns = [
    ['repo', 'repositorio', 'repository'], ['titulo', 'titulo', 'title'],
    ['categoria', 'categoria', 'category'], ['era', 'era', 'era'],
    ['contexto', 'contexto', 'context'], ['descricao', 'descricao', 'description'],
    ['descricao_original', 'descricao_original_github', 'original_github_description'],
    ['assunto', 'assunto', 'topic_area'],
    ['linguagem', 'linguagem_principal', 'primary_language'], ['tecnologias', 'tecnologias', 'technologies'],
    ['topicos', 'topicos', 'topics'], ['criado_em', 'criado_em', 'created_at'],
    ['atualizado_em', 'atualizado_em', 'updated_at'], ['ultimo_push', 'ultimo_push', 'last_push'],
    ['estrelas', 'estrelas', 'stars'], ['forks', 'forks', 'forks'],
    ['issues_abertas', 'issues_abertas', 'open_issues'], ['tamanho_kb', 'tamanho_kb', 'size_kb'],
    ['url', 'url_github', 'github_url'], ['fonte', 'fonte_metadados', 'metadata_source'],
    ['exportado_em', 'exportado_em', 'exported_at']
  ];
  function csvSafe(value) {
    let text = String(value ?? '').replace(/[\u0000-\u001f]/g, ' ').trim();
    // Prevent formula execution when opening exported CSV in spreadsheet applications.
    if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function serializeCsv(rows) {
    const headings = csvColumns.map(col => col[language === 'en' ? 2 : 1]).join(';');
    return '\uFEFF' + [headings, ...rows.map(row => csvColumns.map(col => csvSafe(row[col[0]])).join(';'))].join('\r\n');
  }
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  function addLog(message, kind = '') {
    const entry = element('div', `log-entry${kind ? ' ' + kind : ''}`);
    const time = element('span', 'log-time', `[${new Date().toLocaleTimeString(language === 'en' ? 'en-GB' : 'pt-BR', { hour12: false })}]`);
    entry.append(time, document.createTextNode(' ' + message));
    $('#demoLog').append(entry);
    $('#demoLog').scrollTop = $('#demoLog').scrollHeight;
  }
  function stageStatus(i, status) {
    const item = $(`.terminal-stage[data-stage="${i}"]`);
    item.classList.toggle('is-active', status === 'active');
    item.classList.toggle('is-done', status === 'done');
  }
  function progress(percent, label) {
    $('#demoProgress').textContent = `${String(percent).padStart(2, '0')}%`;
    $('#demoProgressLabel').textContent = label;
  }
  async function runDemo() {
    if (executing) return;
    executing = true;
    generatedCsv = null;
    window.dispatchEvent(new Event('portfolio:inventory-reset'));
    $('#runDemo').disabled = true;
    $('#downloadCsv').disabled = true;
    $('#runDemoLabel').textContent = m().running;
    $('#demoLog').replaceChildren();
    $$('.terminal-stage').forEach(item => item.classList.remove('is-active', 'is-done'));
    ['metricInput', 'metricValid', 'metricOutput'].forEach(id => $('#' + id).textContent = '--');
    $('#demoState').textContent = m().runningState;
    $('#demoState').classList.remove('success');
    progress(0, 'INITIALIZING');
    const delay = reduceMotion.matches ? 15 : 240;
    try {
      stageStatus(0, 'active');
      addLog(m().logStart);
      const result = await syncGitHubProjects();  // Always checks the source again on run.
      $('#metricInput').textContent = result.count ?? '—';
      addLog(result.ok ? m().logOnline(result.count) : m().logOffline, result.ok ? 'success' : 'warning');
      stageStatus(0, 'done'); progress(25, 'FETCH_COMPLETE');
      stageStatus(1, 'active'); await wait(delay);
      const projects = allProjects.length;
      $('#metricValid').textContent = projects;
      addLog(m().logFilter(projects));
      stageStatus(1, 'done'); progress(50, 'CLASSIFIED');
      stageStatus(2, 'active'); await wait(delay);
      const rows = csvRows();
      addLog(m().logEnrich(rows.length));
      stageStatus(2, 'done'); progress(75, 'METADATA_READY');
      stageStatus(3, 'active'); await wait(delay);
      generatedCsv = serializeCsv(rows);
      window.dispatchEvent(new CustomEvent('portfolio:inventory-ready', { detail: { csv: generatedCsv } }));
      $('#metricOutput').textContent = rows.length;
      addLog(m().logCsv(rows.length), 'success');
      stageStatus(3, 'done'); progress(100, 'CSV_READY');
      $('#demoState').textContent = m().done;
      $('#demoState').classList.add('success');
      $('#downloadCsv').disabled = false;
    } catch (err) {
      $('#demoState').textContent = m().failed;
      addLog(m().logError, 'warning');
    } finally {
      executing = false;
      $('#runDemo').disabled = false;
      $('#runDemoLabel').textContent = m().again;
    }
  }
  function downloadCsv() {
    if (!generatedCsv) return;
    const blob = new Blob([generatedCsv], { type: 'text/csv;charset=utf-8;' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `brandon-rpa-github-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    addLog(m().logDownload, 'success');
  }

  /* ========= Navigation, scroll and UI motion ========= */
  function initNavigation() {
    const toggle = $('#mobileToggle');
    const nav = $('#mobileNav');
    const close = () => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', language === 'en' ? 'Open menu' : 'Abrir menu');
      nav.hidden = true;
    };
    toggle.addEventListener('click', () => {
      const opened = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(opened));
      toggle.setAttribute('aria-label', opened ? (language === 'en' ? 'Close menu' : 'Fechar menu') : (language === 'en' ? 'Open menu' : 'Abrir menu'));
      nav.hidden = !opened;
    });
    $$('#mobileNav a').forEach(link => link.addEventListener('click', close));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
    window.addEventListener('resize', () => { if (innerWidth > 950) close(); });
    $('#languageSwitch').addEventListener('click', () => setLanguage(language === 'pt' ? 'en' : 'pt'));
  }
  function initScrollEffects() {
    const progressBar = $('#scrollProgress');
    const header = $('#siteHeader');
    let scheduled = false;
    const update = () => {
      const scrollable = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      progressBar.style.width = `${Math.min(100, scrollY / scrollable * 100)}%`;
      header.classList.toggle('is-scrolled', scrollY > 12);
      scheduled = false;
    };
    window.addEventListener('scroll', () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
    if ('IntersectionObserver' in window && !reduceMotion.matches) {
      const observer = new IntersectionObserver((entries, instance) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            instance.unobserve(entry.target);
          }
        });
      }, { threshold: .08, rootMargin: '0px 0px -25px 0px' });
      $$('[data-reveal]').forEach(el => observer.observe(el));
    } else $$('[data-reveal]').forEach(el => el.classList.add('visible'));
  }
  let heroLineIndex = 0;
  function updateHeroConsoleText() {
    $('#heroConsole').textContent = m().heroLines[heroLineIndex];
  }
  function initHeroConsole() {
    updateHeroConsoleText();
    if (!reduceMotion.matches) setInterval(() => { heroLineIndex = (heroLineIndex + 1) % m().heroLines.length; updateHeroConsoleText(); }, 2800);
    const clock = $('#liveClock');
    const updateClock = () => { clock.textContent = new Date().toLocaleTimeString(language === 'en' ? 'en-GB' : 'pt-BR', { hour12: false }); };
    updateClock(); setInterval(updateClock, 1000);
  }
  function initNetworkCanvas() {
    const canvas = $('#networkCanvas');
    if (!canvas || reduceMotion.matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let width, height, particles, frame = 0;
    function resize() {
      const b = canvas.getBoundingClientRect(); width = b.width; height = b.height;
      const scale = Math.min(devicePixelRatio || 1, 1.7);
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      particles = Array.from({ length: 23 }, (_, i) => ({
        x: (i * 71.3 % 100) / 100 * width,
        y: (i * 37.7 % 100) / 100 * height,
        speed: .13 + i % 4 * .065, size: i % 6 === 0 ? 2 : 1, phase: i * .6
      }));
    }
    function draw(time) {
      if (document.hidden) { frame = 0; return; }
      ctx.clearRect(0, 0, width, height);
      for (const [i, p] of particles.entries()) {
        const x = p.x + Math.sin(time / 1800 + p.phase) * 10;
        const y = (p.y + time * p.speed / 45) % Math.max(1, height);
        ctx.fillStyle = `rgba(166,145,250,${.24 + .08 * Math.sin(time / 1000 + i)})`;
        ctx.beginPath(); ctx.arc(x, y, p.size, 0, Math.PI * 2); ctx.fill();
        if (i % 5 === 0) {
          ctx.strokeStyle = 'rgba(105,239,206,.12)';
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 20); ctx.stroke();
        }
      }
      frame = requestAnimationFrame(draw);
    }
    resize();
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    else addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !frame) frame = requestAnimationFrame(draw); });
    frame = requestAnimationFrame(draw);
  }

  /* ========= Scroll-driven robotic gravity background =========
     Vector gears / industrial arms / processors move with inertia,
     downward gravity and spring-return. Scrolling delivers an impulse.
     No external dependencies; honours prefers-reduced-motion.
     ============================================================ */
  function initGravityCanvas() {
    const canvas = $('#gravityCanvas');
    if (!canvas || reduceMotion.matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = 0, h = 0, parts = [], lastScroll = scrollY, frame = 0, prev = 0;
    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      w = innerWidth; h = innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = w < 680 ? 4 : 8;
      parts = Array.from({ length: count }, (_, i) => {
        const left = i % 2 === 0;
        const x = (left ? .08 + (i % 3) * .13 : .79 + (i % 3) * .065) * w;
        const y = (.13 + ((i * 17) % 65) / 100) * h;
        return { x, y, homeX: x, homeY: y, vx: 0, vy: 0, radius: 20 + (i * 11) % 24, angle: i * .9, spin: (i % 2 ? 1 : -1) * .003, type: i % 3 };
      });
    }
    function gear(p) {
      const outer = p.radius, inner = outer * .76, teeth = 9;
      ctx.beginPath();
      for (let i = 0; i <= teeth * 4; i++) {
        const a = i / (teeth * 4) * Math.PI * 2;
        const r = i % 4 === 0 || i % 4 === 3 ? outer : inner;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, outer * .4, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
    }
    function arm(p) {
      const r = p.radius;
      ctx.beginPath(); ctx.moveTo(-r, r); ctx.lineTo(-r * .1, r * .12); ctx.lineTo(r * .6, -r * .65); ctx.stroke();
      for (const [x, y] of [[-r, r], [-r * .1, r * .12], [r * .6, -r * .65]]) {
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(r * .6, -r * .65); ctx.lineTo(r * .95, -r * .9); ctx.moveTo(r * .6, -r * .65); ctx.lineTo(r * .9, -r * .25); ctx.stroke();
    }
    function processor(p) {
      const r = p.radius * .65;
      ctx.strokeRect(-r, -r, r * 2, r * 2);
      ctx.strokeRect(-r * .55, -r * .55, r * 1.1, r * 1.1);
      for (let n = -2; n <= 2; n++) {
        const o = n * r / 3;
        ctx.beginPath(); ctx.moveTo(o, -r); ctx.lineTo(o, -r - 8);
        ctx.moveTo(o, r); ctx.lineTo(o, r + 8);
        ctx.moveTo(-r, o); ctx.lineTo(-r - 8, o);
        ctx.moveTo(r, o); ctx.lineTo(r + 8, o); ctx.stroke();
      }
      ctx.fillRect(-3, -3, 6, 6);
    }
    function draw(time) {
      if (document.hidden) { frame = 0; return; }
      const dt = Math.min(2, Math.max(.2, (time - (prev || time)) / 16.7));
      prev = time;
      ctx.clearRect(0, 0, w, h);
      // Connect moving robotic parts as a faint automation network.
      for (let i = 0; i < parts.length - 2; i++) {
        if (i % 2 === 1) continue;
        const a = parts[i], b = parts[i + 2];
        ctx.strokeStyle = 'rgba(105,239,206,.17)'; ctx.lineWidth = 1;
        ctx.setLineDash([3, 12]); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
        const t = (time / 2900 + i / 4) % 1;
        ctx.fillStyle = 'rgba(105,239,206,.6)'; ctx.beginPath();
        ctx.arc(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 2, 0, Math.PI * 2); ctx.fill();
      }
      for (const p of parts) {
        // Spring towards an anchor, plus gravity and momentum from scroll input.
        p.vx += (p.homeX - p.x) * .0035 * dt;
        p.vy += ((p.homeY + 15) - p.y) * .0055 * dt + .025 * dt;
        p.vx *= Math.pow(.965, dt);
        p.vy *= Math.pow(.965, dt);
        p.x += p.vx * dt; p.y += p.vy * dt;
        const margin = p.radius + 4;
        if (p.x < margin || p.x > w - margin) { p.vx *= -.65; p.x = Math.max(margin, Math.min(w - margin, p.x)); }
        if (p.y < margin || p.y > h - margin) { p.vy *= -.62; p.y = Math.max(margin, Math.min(h - margin, p.y)); }
        p.angle += p.spin * dt + p.vy * .00035 * dt;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = p.type === 0 ? 'rgba(164,139,255,.57)' : 'rgba(105,239,206,.49)';
        ctx.fillStyle = 'rgba(105,239,206,.42)';
        ctx.shadowBlur = 9; ctx.shadowColor = p.type === 0 ? 'rgba(165,139,255,.35)' : 'rgba(105,239,206,.3)';
        if (p.type === 0) gear(p);
        else if (p.type === 1) arm(p);
        else processor(p);
        ctx.restore();
      }
      frame = requestAnimationFrame(draw);
    }
    resize();
    let resizeTimer;
    addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 130); });
    addEventListener('scroll', () => {
      const delta = Math.max(-100, Math.min(100, scrollY - lastScroll));
      lastScroll = scrollY;
      parts.forEach((p, i) => {
        // Scrolling down pulls the parts down; upward scrolling reverses the impulse.
        p.vy += delta * (.058 + i % 3 * .009);
        p.vx += Math.sin(i * 2.7) * Math.abs(delta) * .012;
      });
    }, { passive: true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !frame) { prev = 0; frame = requestAnimationFrame(draw); } });
    frame = requestAnimationFrame(draw);
  }

  /* ========= Start ========= */
  $('#copyrightYear').textContent = String(new Date().getFullYear());
  initNavigation();
  initScrollEffects();
  initProjectFilters();
  initHeroConsole();
  initNetworkCanvas();
  initGravityCanvas();
  $('#runDemo').addEventListener('click', runDemo);
  $('#downloadCsv').addEventListener('click', downloadCsv);
  let storedLang = null;
  try { storedLang = localStorage.getItem('brandon-rpa-language'); } catch (_) { /* storage disabled */ }
  setLanguage(storedLang === 'en' ? 'en' : 'pt', false);
  const initialSnapshot = loadSnapshot('./catalog/repos.json');
  syncGitHubProjects();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Date.now() - lastSync > 5 * 60 * 1000) syncGitHubProjects();
  });
  window.addEventListener('online', syncGitHubProjects);
})();
