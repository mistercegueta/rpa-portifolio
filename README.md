# Portfólio de RPA · Brandon Saraiva

[Abrir o portfólio](https://mistercegueta.github.io/rpa-portifolio/)

O site consulta automaticamente os repositórios públicos de `BrandonSaraiva` e `mistercegueta` ao abrir. O botão **Sincronizar** consulta novamente. Os cards são ordenados por data de criação no GitHub.

A vitrine reúne os trabalhos escolhidos em `js/projects.js`. Para publicar um projeto novo sem editar o site, preencha a descrição do repositório e adicione o tópico `portfolio` em **About → Topics** no GitHub. O projeto entra na próxima consulta. Use `portfolio-ignore` para ocultar um repositório público. Forks, projetos arquivados e itens na lista de exclusão ficam fora.

A captura do Radar no Telegram vem da [demonstração pública do projeto](https://github.com/BrandonSaraiva/Dou-e-Concursos/blob/main/docs/DEMONSTRACAO.md), com o nome monitorado oculto.

O GitHub Actions consulta a API a cada três horas e publica uma cópia do catálogo no repositório quando os dados mudam. Se a consulta direta falhar, o site usa a cópia mais recente disponível. O inventário em CSV inclui as datas de criação, atualização e último push em colunas próprias.

## Verificação local

Use Node.js 24 e sirva o diretório com um servidor HTTP estático para abrir o site no navegador. Rode `node --test` para verificar a descoberta e o painel de CSV. Para atualizar a cópia publicada localmente, rode `node scripts/refresh-catalog.cjs` com acesso à API pública do GitHub.
