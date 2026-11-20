/**
 * CURADORIA: projetos confirmados e contexto informado por Brandon.
 * A fase só é definida quando o contexto do projeto é conhecido.
 * Nunca guardar tokens ou informações confidenciais neste arquivo público.
 */
window.PORTFOLIO_CONFIG = Object.freeze({
  githubAccounts: ['BrandonSaraiva', 'mistercegueta'],
  publishTopic: 'portfolio',
  snapshotUrl: 'https://raw.githubusercontent.com/mistercegueta/rpa-portifolio/main/catalog/repos.json',
  excludedRepositories: [
    'BrandonSaraiva/Site-Cartoes', 'BrandonSaraiva/brandon_portfolio',
    'BrandonSaraiva/BrandonSaraiva.github.io', 'mistercegueta/rpa-portifolio',
    'BrandonSaraiva/java_csv_downloader', 'BrandonSaraiva/projeto-ola-mundo', 'BrandonSaraiva/html-novo'
  ],
  curatedProjects: [
    {
      repo: 'Dou-e-Concursos', title: 'Radar DOU + Concursos', category: 'fluxos', era: 'aplicada',
      eyebrow: 'MONITORAMENTO & ALERTAS', eyebrow_en: 'MONITORING & ALERTS',
      description: 'Usa web scraping para acompanhar o Diário Oficial da União e concursos nacionais ou estaduais. O Radar compara os resultados com o histórico local e avisa sobre novidades por um bot do Telegram.',
      description_en: 'Uses web scraping to track Brazil’s federal gazette and national or state public-sector exams. Radar compares results against its local history and reports new entries through a Telegram bot.',
      workflow: ['Extrai dados com Beautiful Soup', 'Compara URLs no SQLite', 'Envia alertas pelo bot'],
      workflow_en: ['Extracts data with Beautiful Soup', 'Compares URLs in SQLite', 'Sends alerts through the bot'],
      tags: ['Python', 'Telegram Bot', 'Web scraping', 'Beautiful Soup', 'SQLite', 'Windows', 'Android'], url: 'https://github.com/BrandonSaraiva/Dou-e-Concursos',
      release: 'https://github.com/BrandonSaraiva/Dou-e-Concursos/releases/latest',
      demo: 'https://github.com/BrandonSaraiva/Dou-e-Concursos/blob/main/docs/DEMONSTRACAO.md',
      preview: './assets/radar-telegram.png'
    },
    {
      repo: 'indexador_elastic', title: 'Elasticsearch Indexer', category: 'dados', era: 'aplicada',
      context: 'ANAC', context_en: 'ANAC',
      eyebrow: 'INGESTÃO & INDEXAÇÃO', eyebrow_en: 'INGESTION & INDEXING',
      description: 'Pipeline desenvolvido no contexto da ANAC para tornar pesquisável o conteúdo de documentos disponíveis por URL.',
      description_en: 'A pipeline developed in the ANAC context to make content from document URLs searchable.',
      workflow: ['Recebe URLs', 'Extrai o conteúdo', 'Indexa no Elasticsearch'],
      workflow_en: ['Takes document URLs', 'Extracts content', 'Indexes in Elasticsearch'],
      tags: ['Python', 'Elasticsearch', 'ETL'], url: 'https://github.com/BrandonSaraiva/indexador_elastic'
    },
    {
      repo: 'Bot-Faz-Tudo', title: 'Bot Faz Tudo', category: 'bots', era: 'academica',
      eyebrow: 'AUTOMAÇÃO PESSOAL', eyebrow_en: 'PERSONAL AUTOMATION',
      description: 'Bot no Telegram criado para automatizar tarefas no computador, consultar informações e acionar comandos remotamente.',
      description_en: 'A Telegram bot built to automate computer tasks, retrieve information and trigger commands remotely.',
      tags: ['Python', 'Telegram Bot', 'PyAutoGUI'], url: 'https://github.com/BrandonSaraiva/Bot-Faz-Tudo'
    },
    {
      repo: 'data_science_bot', title: 'Data Science Bot', category: 'dados', era: 'academica',
      eyebrow: 'ANÁLISE & RELATÓRIOS', eyebrow_en: 'ANALYSIS & REPORTING',
      description: 'Projeto da faculdade que automatiza o trabalho desde a coleta na web até a apresentação dos resultados em slides.',
      description_en: 'A university project that automates the work from collecting data on the web to presenting the findings in slides.',
      workflow: ['Coleta dados na web', 'Analisa e gera gráficos', 'Monta a apresentação'],
      workflow_en: ['Collects web data', 'Analyzes and charts it', 'Builds the slide deck'],
      tags: ['Python', 'Selenium', 'Pandas'], url: 'https://github.com/BrandonSaraiva/data_science_bot'
    },
    {
      repo: 'get_random_post_threads', title: 'Threads Scraper', category: 'web', era: 'academica',
      eyebrow: 'EXTRAÇÃO WEB', eyebrow_en: 'WEB EXTRACTION',
      description: 'Script com Selenium para extrair publicações de perfis no Threads e escolher postagens aleatórias do conteúdo coletado.',
      description_en: 'A Selenium script that extracts public Threads profile posts and selects random posts from the collected data.',
      tags: ['Python', 'Selenium', 'Web scraping'], url: 'https://github.com/BrandonSaraiva/get_random_post_threads'
    }
  ]
});
