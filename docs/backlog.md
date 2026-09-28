# Backlog

Este documento é o inventário funcional do Cifrases. O estado da issue no GitHub é a fonte de verdade operacional.

## Taxonomia de labels

### Tipo

- `feature`: nova capacidade de produto.
- `fix`: correção de comportamento existente.
- `docs`: documentação.
- `test`: testes ou infraestrutura de testes.
- `chore`: manutenção técnica sem mudança funcional relevante.
- `refactor`: reorganização interna sem mudança de comportamento.
- `perf`: melhoria de desempenho.

### Ciclo de vida

- `released`: implementação já publicada.
- `duplicate`: issue consolidada por duplicidade.

Labels padrão do GitHub como `bug` podem existir em issues antigas, mas a classificação canônica deste projeto usa `fix`.

### Área

- `area:fundacao`
- `area:dados`
- `area:biblioteca`
- `area:cadastro`
- `area:musica`
- `area:player`
- `area:editor`
- `area:importacao`
- `area:ia`
- `area:apresentacao`
- `area:tema`
- `area:conta`
- `area:comunidades`
- `area:offline`
- `area:qualidade`
- `area:operacao`
- `area:catalogo`

Uma issue funcional recebe normalmente um label de tipo e um label de área.

## Cores oficiais

As cores são parte da taxonomia e devem permanecer consistentes no GitHub. A fonte de verdade é [.github/labels.yml](../.github/labels.yml).

| Label | Cor |
| --- | --- |
| `feature` | #1D76DB |
| `fix` | #D73A4A |
| `docs` | #0075CA |
| `test` | #8957E5 |
| `chore` | #6A737D |
| `refactor` | #A2EEEF |
| `perf` | #FBCA04 |
| `released` | #4C1D95 |
| `duplicate` | #CFD3D7 |
| `area:fundacao` | #B60205 |
| `area:dados` | #E99695 |
| `area:biblioteca` | #C2E0C6 |
| `area:cadastro` | #0E8A16 |
| `area:musica` | #006B75 |
| `area:player` | #0052CC |
| `area:editor` | #6F42C1 |
| `area:importacao` | #D4C5F9 |
| `area:ia` | #7057FF |
| `area:apresentacao` | #F9D0C4 |
| `area:tema` | #FF9F1C |
| `area:conta` | #0366D6 |
| `area:comunidades` | #008672 |
| `area:offline` | #00A67D |
| `area:qualidade` | #BFD4F2 |
| `area:operacao` | #E36209 |
| `area:catalogo` | #F6921E |

A lista deve evitar cores duplicadas entre labels canônicas.


## Inventário

| Issue | Área | Status | Título |
|---:|---|---|---|
| #1 | fundacao | concluída | Fundação: persistência e contrato de Song |
| #2 | dados | concluída | Dados: preparar armazenamento de músicas e mídias |
| #3 | biblioteca | concluída | Biblioteca: listar e abrir músicas |
| #4 | cadastro | concluída | Cadastro: criar uma música manualmente |
| #5 | cadastro | concluída | Cadastro: editar uma música existente |
| #6 | musica | concluída | Música: tela de detalhes e modo de preparação |
| #7 | player | concluída | Player: renderização de letras e acordes |
| #8 | player | concluída | Player: transposição de tonalidade |
| #9 | player | concluída | Player: controles de leitura e acessibilidade |
| #10 | player | concluída | Player: reprodução de áudio |
| #11 | player | concluída | Player: sincronização de letra e áudio |
| #12 | player | concluída | Player: rolagem automática sincronizada |
| #13 | editor | aberta | Editor: edição estrutural de música |
| #14 | editor | aberta | Editor: timeline visual de música |
| #15 | importacao | aberta | Importação: imagem ou PDF para criar rascunho de música |
| #16 | ia | aberta | IA/OCR: extrair letra e estrutura de uma cifra |
| #17 | ia | aberta | IA/OCR: reconhecer acordes e posições na cifra |
| #18 | biblioteca | aberta | Biblioteca: busca, filtros e ordenação |
| #19 | biblioteca | aberta | Biblioteca: favoritos e músicas recentes |
| #20 | biblioteca | aberta | Biblioteca: playlists e repertórios |
| #21 | biblioteca | duplicada | Biblioteca: playlists e repertórios |
| #22 | apresentacao | aberta | Apresentação: modo 16:9 baseado na mesma Song |
| #23 | apresentacao | aberta | Apresentação: controle de execução e avanço |
| #24 | tema | aberta | Temas: personalização por comunidade ou contexto |
| #25 | conta | aberta | Conta: autenticação e perfil do músico |
| #26 | comunidades | aberta | Comunidades: compartilhamento de biblioteca e permissões |
| #27 | offline | aberta | Offline/PWA: tocar repertório sem internet |
| #28 | qualidade | aberta | Qualidade: acessibilidade e experiência mobile do player |
| #29 | operacao | aberta | Operação: erros, observabilidade e segurança de dados |
| #30 | catalogo | aberta | Catálogo inicial: formato de importação e cadastro das primeiras músicas |
| #34 | tema | aberta | Tema: modo claro e modo escuro |
| #37 | player | aberta | Player: modo palco / teleprompter musical |
| #51 | player | concluída | Player: corrigir build quebrado por prop não desestruturada |
| #53 | player | concluída | Player: corrigir contrato de pausa do auto-scroll |

## Regras de organização

- O número do GitHub é a referência canônica.
- Títulos não repetem numeração manual.
- Duplicidades são fechadas apontando para a issue canônica.
- Não criar outra issue para a mesma capacidade sem justificar a diferença de escopo.