# Portfólio de RPA · Brandon Saraiva

[Abrir o portfólio](https://mistercegueta.github.io/rpa-portifolio/)

O site consulta automaticamente os repositórios públicos de `BrandonSaraiva` e `mistercegueta` ao abrir. O botão **Sincronizar** consulta novamente. Os cards são ordenados pela data de criação no GitHub, com opção de mudar a ordem na vitrine.

Repositórios sem descrição ou tópicos entram em **Outros** quando os metadados não permitem identificar a finalidade. O arquivo `js/projects.js` guarda a curadoria e as exclusões explícitas. Forks, repositórios arquivados e repositórios com o tópico `portfolio-ignore` ficam fora.

O GitHub Actions consulta a API a cada três horas e publica uma cópia do catálogo no repositório quando os dados mudam. Se a consulta direta falhar, o site usa a cópia mais recente disponível. O inventário em CSV inclui as datas de criação, atualização e último push em colunas próprias.

## Verificação local

Use Node.js 24 e sirva o diretório com um servidor HTTP estático para abrir o site no navegador. Rode `node --test` para verificar a descoberta e o painel de CSV. Para atualizar a cópia publicada localmente, rode `node scripts/refresh-catalog.cjs` com acesso à API pública do GitHub.
