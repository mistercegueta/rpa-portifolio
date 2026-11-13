/**
 * CURADORIA: projetos confirmados e contexto informado por Brandon.
 * `era` explícita prevalece sobre a data do repositório (ex.: trabalho ANAC).
 * Repositórios novos usam created_at para estimar a fase.
 * Nunca guardar tokens ou informações confidenciais neste arquivo público.
 */
window.PORTFOLIO_CONFIG = Object.freeze({
  githubUsername: 'BrandonSaraiva',
  excludedRepositories: ['Site-Cartoes', 'rpa-portfolio', 'devportfolio', 'BrandonSaraiva.github.io'],
  curatedProjects: [
    {
      repo: 'indexador_elastic', title: 'Elasticsearch Indexer', category: 'dados', era: 'aplicada',
      context: 'ANAC', context_en: 'ANAC',
      eyebrow: 'INGESTÃO & INDEXAÇÃO', eyebrow_en: 'INGESTION & INDEXING', visual: 'database', feature: true,
      description: 'Pipeline desenvolvido no contexto da ANAC para coletar conteúdos de documentos a partir de URLs e indexá-los no Elasticsearch.',
      description_en: 'A document ingestion pipeline developed in the ANAC context. It reads document URLs, collects their content and indexes it in Elasticsearch.',
      tags: ['Python', 'Elasticsearch', 'ETL'], url: 'https://github.com/BrandonSaraiva/indexador_elastic'
    },
    {
      repo: 'Bot-Faz-Tudo', title: 'Bot Faz Tudo', category: 'bots', era: 'academica',
      eyebrow: 'AUTOMAÇÃO PESSOAL', eyebrow_en: 'PERSONAL AUTOMATION', visual: 'bot', feature: true,
      description: 'Bot no Telegram criado para automatizar tarefas no computador, consultar informações e acionar comandos remotamente.',
      description_en: 'A Telegram bot built to automate computer tasks, retrieve information and trigger commands remotely.',
      tags: ['Python', 'Telegram Bot', 'PyAutoGUI'], url: 'https://github.com/BrandonSaraiva/Bot-Faz-Tudo'
    },
    {
      repo: 'data_science_bot', title: 'Data Science Bot', category: 'dados', era: 'academica',
      eyebrow: 'AUTOMAÇÃO ACADÊMICA', eyebrow_en: 'ACADEMIC AUTOMATION', visual: 'data', feature: true,
      description: 'Projeto da faculdade que automatiza extração de dados por web scraping, análise, criação de gráficos e geração de slides.',
      description_en: 'A university project automating web scraping, data analysis, chart creation and slide generation.',
      tags: ['Python', 'Selenium', 'Pandas'], url: 'https://github.com/BrandonSaraiva/data_science_bot'
    },
    {
      repo: 'get_random_post_threads', title: 'Threads Scraper', category: 'web', era: 'academica',
      eyebrow: 'EXTRAÇÃO WEB', eyebrow_en: 'WEB EXTRACTION', visual: 'scrape',
      description: 'Script com Selenium para extrair publicações de perfis no Threads e escolher postagens aleatórias do conteúdo coletado.',
      description_en: 'A Selenium script that extracts public Threads profile posts and selects random posts from the collected data.',
      tags: ['Python', 'Selenium', 'Web scraping'], url: 'https://github.com/BrandonSaraiva/get_random_post_threads'
    },
    {
      repo: 'automated_messages', title: 'Automated Messages', category: 'bots', era: 'academica',
      eyebrow: 'ROTINAS PROGRAMADAS', eyebrow_en: 'SCHEDULED ROUTINES', visual: 'message',
      description: 'Automação de envio de mensagens em horários programados e de tarefas repetitivas em interfaces web.',
      description_en: 'Automated message sending on a schedule and other recurring tasks through web interfaces.',
      tags: ['Python', 'PyAutoGUI', 'Scheduling'], url: 'https://github.com/BrandonSaraiva/automated_messages'
    },
    {
      repo: 'Projeto-bot-telegram-Lotof-cil', title: 'Tokinho • Telegram Bot', category: 'bots', era: 'academica',
      eyebrow: 'BOT & ANÁLISE', eyebrow_en: 'BOT & ANALYSIS', visual: 'telegram',
      description: 'Bot de Telegram que consulta resultados históricos, automatiza análises de frequência e responde a consultas.',
      description_en: 'A Telegram bot that queries historical results, automates frequency analysis and replies to user requests.',
      tags: ['Python', 'Telegram Bot', 'Web scraping'], url: 'https://github.com/BrandonSaraiva/Projeto-bot-telegram-Lotof-cil'
    }
  ]
});
