# Migração do sistema de propostas para Django — design

Data: 2026-11-19 · Branch: `claude/inspiring-archimedes-3stbow`

## 1. Objetivo

Reescrever o sistema de propostas (hoje Next.js 15 + Prisma + PostgreSQL em Docker) em
**Django**, para que o time consiga manter e evoluir o sistema em Python.

**Requisitos decididos com o usuário**

- Sem Docker e sem Node em tempo de execução. O banco é PostgreSQL instalado direto
  (no desenvolvimento, o PostgreSQL 18 desta máquina). O destino é um VPS Windows.
- **Visual idêntico em tudo**: o painel e a proposta pública têm de ficar iguais ao sistema atual.
- Templates do Django com JavaScript leve, sem etapa de build.
- O banco começa do zero, só com empresas, usuários e modelos. O sistema ainda não está
  em produção, então não há migração de dados.
- Servidor web e HTTPS no VPS ficam para depois.

**Critério de sucesso:** cada tela do painel e cada tipo de seção da proposta pública
renderiza igual à versão Next (comparação lado a lado no navegador). Os fluxos de criar,
enviar, abrir, rastrear, aceitar e recusar se comportam como hoje. Next.js, Prisma e
Docker saem do repositório.

## 2. Abordagem

O Django fica numa pasta nova, `web/`, no mesmo repositório. O código Next fica como
**referência** até a paridade e é removido num commit só, na etapa 5. Cada tela é
reescrita como template que produz o **mesmo HTML e as mesmas classes**, usando os
CSS atuais copiados sem alteração (`globals.css`, `proposta.css`).

Descartadas: substituir tudo de uma vez na raiz (perde a referência visual) e usar o
Django Admin no painel (muda o visual).

## 3. Stack

| Item | Escolha |
|---|---|
| Linguagem | Python 3.13 |
| Framework | Django 5.2 LTS |
| Banco | PostgreSQL (driver `psycopg[binary]` 3) |
| Configuração | `web/.env` lido por `django-environ` |
| Arquivos estáticos | WhiteNoise (serve `/static/` e `/empresas/` sem servidor extra) |
| Formatação BRL e números | `babel`, que gera o mesmo resultado do `Intl` pt-BR, NBSP incluso |
| Senhas | hasher padrão do Django (PBKDF2), com as mesmas regras de política |
| Servidor no Windows (etapa 5) | `waitress`. O HTTPS fica para depois |
| JS | Vanilla, em arquivos `.js` estáticos e sem Alpine: a CSP com nonce e `strict-dynamic` não admite `eval`, e JS puro dá conta do que o React fazia |
| Testes | `django.test` com PostgreSQL (o usuário do banco precisa de `CREATEDB`) |

## 4. Estrutura de `web/`

```
web/
  manage.py  requirements.txt  .env (não versionado)
  config/            settings, urls, wsgi
  nucleo/            Empresa, Usuario, Membro, LogAuditoria, Upload
                     auth (sessão + versaoSessao), permissões, limite de taxa,
                     CSP/cabeçalhos, tema, formatação (brl, dataBR, duracao, slugify),
                     documentos (CNPJ/telefone/e-mail), urls seguras
  propostas/         Produto, Contato, Modelo, SecaoModelo, ContadorProposta,
                     Proposta, Visualizacao, TempoSecao, Evento
                     regras: campos, precificação, contexto/interpolação,
                     validação de modelo, numeração, catálogo, avisos
                     render: templatetags + partials dos 20 tipos de seção
  painel/            views e templates de /admin e /login
  publico/           /p/<slug>, /api/rastreio, /api/propostas/<slug>/decisao,
                     /uploads/<arquivo>
  integracoes/       e-mail, WhatsApp, D4Sign (etapa 5)
  static/            css/globals.css, css/proposta.css, js/*.js
  publico_raiz/empresas/...   logos (servidos em /empresas/)
  seed/modelos/*.json         os 18 modelos + catálogos, exportados do TS
```

## 5. Dados

Os modelos Django espelham o `schema.prisma` campo a campo (nomes em snake_case), com:

- **PK:** `CharField(primary_key, max_length=32)` com um id aleatório (`uuid4().hex`).
  O banco é novo, então não precisa ser cuid.
- **Json → `JSONField`; Decimal(12,2) → `DecimalField(12,2)`; enums → `CharField` com `TextChoices`
  e `CheckConstraint`.**
- **Datas:** `USE_TZ=True`, `TIME_ZONE="America/Sao_Paulo"`.
- **`Usuario`:** é o modelo de usuário do Django (`AbstractBaseUser`, login por e-mail),
  com os campos `super_admin`, `todas_empresas`, `permissoes` (JSON), `trocar_senha`,
  `versao_sessao`, `falhas_login`, `bloqueado_ate`, `ultimo_acesso` e `whatsapp`.
- **`ContadorProposta`:** id substituto + `UniqueConstraint(empresa, ano)`. O próximo número
  sai de um único `INSERT … ON CONFLICT DO UPDATE SET ultimo = ultimo + 1 RETURNING ultimo`,
  começando em 1001. O código é `{PREFIXO}-{ANO}-{NNNN}`.
- **On delete:** `Proposta.autor` usa PROTECT. `modelo` e `contato` usam SET_NULL.
  O `empresa_id` do `LogAuditoria` não tem FK (o log sobrevive à empresa).
- **Formatos dos JSON** (tema, d4sign, permissoes, campos, secoes, precificacao, dados,
  snapshot, calculo, contrato, dadosContratacao): ficam **iguais** aos de hoje. Assim os
  modelos exportados entram sem conversão, e as regras portadas mantêm a mesma forma.

**Seed** (`python manage.py semear`, idempotente como o atual):
- As 3 empresas (CADDI, KOLP, FASE) com domínios, prefixos, tema, rodapé e motivos de recusa.
  Os motivos só são gravados na criação.
- O admin vindo de `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`, com `trocar_senha` e vínculo
  a todas as empresas. Se o admin já existe, não é alterado.
- Os produtos dos catálogos, casados por (empresa, categoria, código).
- Os 18 modelos, casados por (empresa, tipo_solucao).
- **Sem proposta de exemplo.**
- Os modelos vêm de `web/seed/modelos/*.json`, gerados **uma vez** por um script `tsx`
  que importa os arquivos de `prisma/modelos/`. Os JSON são versionados; depois disso o
  Node não é mais necessário.

## 6. Regras portadas para Python (fonte única no servidor)

As regras de `campos.ts`, `precificacao.ts`, `contexto.ts`, `validacao.ts`, `numeracao.ts`,
`formato.ts`, `documentos.ts`, `urls.ts`, `permissoes.ts` e `tema.ts` são portadas com o
mesmo comportamento, que está detalhado na análise (ver Anexo). Pontos de atenção:

- **Precificação:** mesma aritmética do JS (float e `Math.round`), para os centavos baterem com o
  Next. Testes comparam com valores de referência gerados pelo TS. **Não trocar por Decimal**: isso
  quebraria a paridade.
- **Interpolação:** `{{caminho|filtro}}` com os filtros brl, data, maiusculas e inteiro, e o
  mesmo formato padrão de números pt-BR. A ordem é interpolar, escapar o HTML e, por
  último, transformar `**x**` em `<b>`.
- **Datas:** o "hoje" e a validade usam America/Sao_Paulo. Isso corrige o desvio de UTC
  que o TS tem depois das 21h.

**Sem lógica duplicada em JS.** O resumo financeiro do formulário de proposta e as prévias
do editor chamam endpoints do painel que devolvem JSON ou o HTML renderizado pelos mesmos
templates da página pública (com debounce de cerca de 300 ms). No navegador ficam só a
interação, as máscaras e as validações simples de formulário (CNPJ, telefone, e-mail),
que existem também no servidor.

## 7. Autenticação e segurança

- **Sessão:** sessões do Django em cookie `pp_sessao`, válidas por 12h, `HttpOnly`,
  `SameSite=Lax`, `Secure` fora de `MODO_HTTP`. A sessão guarda o id do usuário e
  `versao_sessao`, e um middleware a invalida se a versão mudou ou o usuário ficou inativo.
  Sair incrementa a versão (desloga todos os dispositivos), e trocar a senha reemite a
  sessão. A empresa ativa vem do cookie `pp_empresa` (slug).
- **Login:** mesmas mensagens, limite de 20 tentativas por IP e 8 por e-mail a cada 15 min,
  bloqueio de 15 min depois de 5 falhas, verificação de senha falsa para não revelar quais
  e-mails existem, `voltar` restrito a `/admin…` e auditoria de LOGIN/LOGIN_FALHOU/LOGIN_BLOQUEADO.
- **Permissões:** os mesmos módulos, ações e perfis (administrador, gerente, vendedor, leitura),
  `propostas_de_todos` e superAdmin. Decorators `@exige(modulo, acao)` para páginas
  (redirecionam para `sem-permissao`) e para POSTs (bloqueiam também quem está com troca
  de senha pendente). O filtro de propostas restringe ao autor quando é o caso e devolve 404.
- **Limite de taxa:** janela deslizante no cache do Django, `DatabaseCache`, compartilhado
  entre processos. O IP é a última entrada do `X-Forwarded-For`, depois `X-Real-IP` e por
  fim `REMOTE_ADDR`.
- **Cabeçalhos:** middleware com nonce por requisição e a mesma CSP e os mesmos cabeçalhos
  de hoje (HSTS e `upgrade-insecure-requests` só fora de `MODO_HTTP`). Ficam de fora
  `/uploads/`, `/empresas/` e `/static/`. `no-store` em `/admin` e `/login`. Todo
  `<script>` leva `nonce`.
- **CSRF:** os forms e os `fetch` do painel usam o token do Django. `/api/rastreio` e
  `/decisao` ficam `csrf_exempt` (o `sendBeacon` não envia cabeçalho), como hoje, protegidos
  pelo limite de taxa e pela validação do host.
- **Host público:** a proposta é buscada pelo slug, e o host tem de ser o
  `dominio_propostas` da empresa, a menos que `ALLOW_ANY_HOST=true`.

## 8. Telas e comportamento

Os templates reproduzem o HTML descrito no Anexo para cada rota. Resumo do que muda de
tecnologia:

| Hoje (React) | Django |
|---|---|
| Server actions com retorno inline (FormAcao) | POST + re-render do mesmo template com `.alerta.ok/.erro`; na edição, redirect como hoje |
| FormUsuario, FormularioProposta (estado + JSON) | `fetch` JSON com CSRF para views que retornam `{ok, erro, …}` |
| CopiarLink, BotaoConfirmar, BotaoContrato, InputImagem, troca de empresa | `static/js/painel.js` (delegação de eventos por `data-*`) |
| PropostaView: efeitos `.rv`, contadores, progresso, dots, timeline, abas de selos, modais, máscaras, Logo | `static/js/proposta.js` |
| Rastreio de leitura | `static/js/rastreio.js`, com o mesmo payload, `sendBeacon` e a mesma lógica |
| Editor de modelos | `static/js/editor.js`: estado em memória, drag & drop nativo, formulário de propriedades recursivo gerado de `BLOCOS` (enviado por `json_script`), prévia via endpoint |

As 20 seções viram `propostas/templates/secoes/<tipo>.html`, incluídas por um template
`proposta.html` usado tanto em `/p/<slug>` quanto nas prévias (`modo=previa`).

## 9. Etapas

Cada etapa termina rodando e com testes.

1. **Base:** projeto Django, settings, conexão com o PostgreSQL, todos os modelos e
   migrações, export dos modelos TS para JSON, o comando `semear`, o login e a sessão,
   as permissões, o limite de taxa, a auditoria, os cabeçalhos/CSP, o layout do painel
   (lateral, troca de empresa, menu por permissão, conta/troca de senha, sem-permissao)
   e o CSS copiado.
2. **Proposta pública:** as regras (campos, precificação, contexto), os 20 partials, `/p/<slug>`,
   o rastreio, a decisão (aceitar/recusar/comentar, sem os avisos, que entram na etapa 5)
   e `/uploads/`.
3. **Painel:** painel/KPIs, propostas (lista, nova, criar, detalhe, editar, duplicar, excluir),
   contatos, catálogo, empresa e marca, empresas, usuários e auditoria.
4. **Editor:** o editor de modelos e de seções favoritas, as abas Formulário/Cálculo/Prévia,
   o upload de imagens e as ações de modelos.
5. **Integrações e encerramento:** e-mail, WhatsApp, avisos, D4Sign (geração e webhook),
   waitress, README para Windows e remoção do Next, do Prisma, do Docker, do `package.json`
   e afins.

## 10. Correções aproveitadas na migração

- O editor de Cálculo deixa de apagar `recorrente.extras` ao trocar o campo base.
- O webhook do D4Sign também reconhece os códigos numéricos de `type_post`.
- A ação CONTRATO aparece no filtro da auditoria.
- O "hoje" usa o fuso de Brasília.
- **Usuários com escopo por empresa:** quem não é superadmin só vê e gerencia usuários que
  compartilham empresa com ele (os de "todas as empresas" só para quem também tem esse acesso).
  Para editar, redefinir a senha ou excluir, o alvo não pode ter permissões que o editor não tem.
  No Next, o admin de uma empresa conseguia assumir a conta de usuários de outras empresas.
- Criar empresa audita `CRIAR` (o Next gravava `EDITAR`); editar um usuário só derruba as
  sessões dele quando ativo, senha ou permissões mudam de fato.

Fora isso, o comportamento continua o mesmo, inclusive o que é questionável (ex.: o KPI
"Aguardando abertura" limitado a 6, os botões do fechamento visíveis depois da decisão).
Isso fica para depois da paridade.

## 11. Testes

- **Unidade:** numeração (incluindo concorrência), precificação e interpolação (comparadas
  com valores de referência gerados pelo TS), validação de modelo, documentos, permissões,
  política de senha e limite de taxa.
- **Integração (Django test client):** login/bloqueio/logout, permissões por rota,
  criação de proposta ponta a ponta, rastreio, decisão.
- **Paridade visual:** cada tela comparada com a versão Next no navegador ao fim de cada etapa.

## Anexo — referência detalhada

O comportamento exato de cada rota, campo, mensagem e classe CSS foi levantado na análise
do código atual. A fonte da verdade continua sendo o código Next em `src/` e `prisma/`
até a remoção na etapa 5. Arquivos-chave: `prisma/schema.prisma`, `src/lib/*.ts`,
`src/app/admin/**`, `src/app/p/**`, `src/components/**`, `src/middleware.ts`.
