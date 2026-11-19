# Etapa 1 — Base Django — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ter o projeto Django rodando com PostgreSQL local, com todas as tabelas, o seed
(empresas, usuários e 17 modelos), o login, a sessão, as permissões, a auditoria, os
cabeçalhos de segurança e a casca do painel com o mesmo visual do sistema Next.

**Architecture:** Projeto `web/config` com apps `nucleo` (empresa, usuário, auth,
segurança, formatação), `propostas` (modelos de dados de proposta e numeração) e `painel`
(views e templates de `/login` e `/admin`). Templates reproduzem o HTML do Next, com
`globals.css` copiado sem alteração. JS puro em `static/js/painel.js`.

**Tech Stack:** Python 3.13, Django 5.2, psycopg 3, django-environ, whitenoise, babel.

**Spec:** `docs/superpowers/specs/2026-11-19-migracao-django-design.md`

## Global Constraints

- Tudo em `web/`. Nada em `src/`, `prisma/` ou na raiz muda nesta etapa (o Next é a referência).
- Comandos rodam dentro de `web/` com o venv `web/.venv` (`py -3.13 -m venv .venv`).
- Banco: `DATABASE_URL` de `web/.env`. O usuário `propostas` precisa de `CREATEDB` para os testes.
- `TIME_ZONE="America/Sao_Paulo"`, `USE_TZ=True`, `LANGUAGE_CODE="pt-br"`.
- PKs: `CharField(primary_key=True, max_length=32, default=nucleo.ids.novo_id)`, sendo `novo_id() -> str` = `uuid4().hex`.
- Os nomes de campo seguem o Prisma em snake_case (`dominioPropostas` → `dominio_propostas`). Os formatos JSON não mudam.
- Os textos visíveis (mensagens, rótulos) são copiados literalmente do Next.
- Todo `<script>` tem `nonce="{{ request.csp_nonce }}"`. Sem `onclick=` inline.
- Cookies: sessão `pp_sessao` (12h), empresa `pp_empresa`.

## Review Focus

- Usuário com a sessão aberta em dois navegadores clica em Sair num deles: o outro tem de cair no `/login` na próxima página (versão de sessão). Teste em Task 7.
- E-mail digitado com maiúsculas e espaços no login (`" Admin@Propostas.LOCAL "`) tem de entrar. Teste em Task 7.
- `voltar=https://evil.com` ou `voltar=//evil.com` no login não pode redirecionar para fora. Teste em Task 7.
- Usuário sem nenhuma empresa ativa vinculada tem de ver o aviso "sem-empresa" no login, sem loop infinito de redirect. Teste em Task 7.
- Rodar `semear` duas vezes não pode duplicar empresas, produtos ou modelos, nem trocar a senha do admin. Teste em Task 3.

---

### Task 1: Projeto Django e conexão com o banco

**Files:**
- Create: `web/requirements.txt`, `web/manage.py`, `web/config/{__init__,settings,urls,wsgi}.py`, `web/nucleo/{__init__,apps,ids}.py`, `web/propostas/{__init__,apps}.py`, `web/painel/{__init__,apps}.py`, `web/.env.example`
- Test: `web/nucleo/tests/test_config.py`

**Interfaces:**
- Produces: `nucleo.ids.novo_id() -> str`; settings `ALLOW_ANY_HOST: bool`, `MODO_HTTP: bool`, `PUBLIC_BASE_URL: str`, `ADMIN_BASE_URL: str`, `UPLOAD_DIR: Path`, `AUTH_USER_MODEL="nucleo.Usuario"`, `CACHES["default"]` = `DatabaseCache` em tabela `cache_limite`.

- [ ] **Step 1:** `requirements.txt` com `Django>=5.2,<5.3`, `psycopg[binary]>=3.2`, `django-environ>=0.11`, `whitenoise>=6.7`, `babel>=2.16`, `waitress>=3.0`. Criar o venv e instalar.
- [ ] **Step 2: Teste** `test_config.py`: `test_banco_e_postgres` (`connection.vendor == "postgresql"`), `test_fuso` (`settings.TIME_ZONE == "America/Sao_Paulo"` e `USE_TZ`), `test_novo_id` (32 chars hex e diferente a cada chamada).
- [ ] **Step 3:** settings lendo `web/.env` (django-environ). `STATICFILES_DIRS=[BASE_DIR/"static"]`, `WHITENOISE_ROOT=BASE_DIR/"publico_raiz"` (serve `/empresas/...`). `SESSION_COOKIE_NAME="pp_sessao"`, `SESSION_COOKIE_AGE=43200`, `SESSION_COOKIE_SECURE=not MODO_HTTP`, `SESSION_COOKIE_SAMESITE="Lax"`, `CSRF_COOKIE_SECURE=not MODO_HTTP`. `ALLOWED_HOSTS=["*"]` (o host é validado por proposta). Copiar `public/empresas/` para `web/publico_raiz/empresas/`.
- [ ] **Step 4:** `python manage.py createcachetable` e `python manage.py test nucleo.tests.test_config` → PASS.
- [ ] **Step 5:** Commit "Django: projeto base e conexão com PostgreSQL".

### Task 2: Modelos de dados

**Files:**
- Create: `web/nucleo/models.py` (Empresa, Usuario + `UsuarioManager`, Membro, LogAuditoria, Upload), `web/propostas/models.py` (Contato, Produto, Modelo, SecaoModelo, ContadorProposta, Proposta, Visualizacao, TempoSecao, Evento), migrações iniciais
- Test: `web/propostas/tests/test_models.py`

**Interfaces:**
- Produces: todos os modelos com os campos do `prisma/schema.prisma` em snake_case. Choices: `Recorrencia` (MENSAL, UNICO), `StatusProposta` (RASCUNHO, PUBLICADA, ABERTA, ACEITA, RECUSADA, EXPIRADA). `Usuario.USERNAME_FIELD="email"`, `Usuario.objects.create_user(email, password, **extra)` e `.create_superuser(...)` (define `super_admin=True`, `todas_empresas=True`). `Usuario` não usa `is_staff`/`PermissionsMixin`. `is_active` é property de `ativo`. Relações: `Proposta.autor` PROTECT, `Proposta.modelo` e `Proposta.contato` SET_NULL, demais CASCADE. `LogAuditoria.empresa_id = CharField(null=True)` sem FK. Unique: `Membro(usuario, empresa)`, `ContadorProposta(empresa, ano)`, `TempoSecao(visualizacao, secao)`. Índices iguais aos do schema. `CheckConstraint` nos dois enums.

- [ ] **Step 1: Teste**: `test_status_padrao_publicada`, `test_autor_protegido` (apagar um Usuario com proposta levanta `ProtectedError`), `test_membro_unico` (`IntegrityError`), `test_contador_unico_por_ano`, `test_status_invalido_barrado_no_banco` (update via `.update(status="X")` levanta `IntegrityError`), `test_email_usuario_unico`.
- [ ] **Step 2:** Rodar → FAIL (modelos inexistentes).
- [ ] **Step 3:** Escrever os modelos e `makemigrations nucleo propostas`.
- [ ] **Step 4:** `python manage.py test propostas.tests.test_models` → PASS.
- [ ] **Step 5:** Commit "Django: modelos de dados (espelho do schema Prisma)".

### Task 3: Export dos modelos TS e comando `semear`

**Files:**
- Create: `web/ferramentas/exportar-modelos.ts`, `web/seed/modelos/<empresa>-<tipoSolucao>.json` (gerados), `web/seed/empresas.py` (dados das 3 empresas, copiados de `prisma/seed.ts:70-135`), `web/nucleo/management/commands/semear.py`
- Test: `web/nucleo/tests/test_semear.py`

**Interfaces:**
- Consumes: modelos da Task 2.
- Produces: comando `python manage.py semear`. Formato de cada JSON: `{"empresa": "caddi", "modelo": {nome, descricao, tipoSolucao, validadeDias, campos, secoes, precificacao}, "catalogo": {"categoria": "...", "itens": [{codigo, nome, preco, atributos, descricao?}]} | null}`.

- [ ] **Step 1:** Script `exportar-modelos.ts` importa todos os `prisma/modelos/*.ts` usados no `seed.ts` (CADDI 6, KOLP 4, FASE 8, sem `padrao.ts`) e os `PLANOS_*`, e grava os JSON. Para a CADDI, a descrição dos planos de nuvem é `"{vcpu} vCPUs, {ram} GB RAM, {disco} GB"`; nas demais a descrição é o nome. Rodar uma vez na raiz: `npm ci` e depois `npx tsx web/ferramentas/exportar-modelos.ts`. Conferir: 18 arquivos JSON (6+4+8).
- [ ] **Step 2: Teste** `test_semear.py`: `test_cria_tres_empresas` (slugs caddi/kolp/fase, prefixos CAD/KLP/FSE, domínios `propostas.caddi.com.br` etc.), `test_admin_criado_com_troca_de_senha` (`super_admin`, `todas_empresas`, `trocar_senha` = True, `check_password("trocar-esta-senha")`), `test_admin_membro_das_tres`, `test_modelos_carregados` (18 modelos ativos; tipos da CADDI = servidor-nuvem, gestao-ti, consultoria-ti, suporte-gerenciado, backup-seguranca, projeto-caddi), `test_idempotente` (rodar 2x mantém as contagens de Empresa, Produto e Modelo; muda a senha do admin entre as rodadas e confirma que a segunda rodada não a altera; motivos editados na empresa permanecem), `test_sem_proposta_de_exemplo` (`Proposta.objects.count() == 0`), `test_senha_fraca_bloqueada_em_producao` (com `ALLOW_ANY_HOST=False` e a senha padrão, o comando levanta `CommandError`).
- [ ] **Step 3:** Rodar → FAIL.
- [ ] **Step 4:** Implementar `semear`: `update_or_create` de Empresa por slug (os motivos só vão em `create_defaults`); admin só se não existir; Membro por `get_or_create`; Produto por (empresa, categoria, codigo) com `ordem` = índice e `recorrencia=MENSAL`; Modelo por (empresa, tipo_solucao). Tudo em `transaction.atomic`.
- [ ] **Step 5:** `python manage.py test nucleo.tests.test_semear` → PASS. Rodar `python manage.py semear` no banco de desenvolvimento.
- [ ] **Step 6:** Commit "Django: seed com empresas, admin e os 18 modelos exportados".

### Task 4: Numeração de propostas

**Files:**
- Create: `web/propostas/numeracao.py`
- Test: `web/propostas/tests/test_numeracao.py`

**Interfaces:**
- Produces: `proximo_codigo(empresa: Empresa, agora: datetime | None = None) -> str`, com formato `f"{prefixo}-{ano}-{n:04d}"`.

- [ ] **Step 1: Teste**: `test_primeiro_e_1001` (`CAD-2026-1001`), `test_sequencia` (1002 na segunda chamada), `test_separado_por_empresa`, `test_reinicia_no_ano_novo` (com `agora` em 2027 → `CAD-2027-1001`), `test_concorrente_sem_duplicar` (`TransactionTestCase`, 8 threads chamando ao mesmo tempo → 8 códigos distintos).
- [ ] **Step 2:** Rodar → FAIL.
- [ ] **Step 3:** Um único SQL: `INSERT INTO propostas_contadorproposta (id, empresa_id, ano, ultimo) VALUES (%s,%s,%s,1001) ON CONFLICT (empresa_id, ano) DO UPDATE SET ultimo = propostas_contadorproposta.ultimo + 1 RETURNING ultimo`. O ano vem de `timezone.localtime(agora).year`.
- [ ] **Step 4:** Rodar → PASS. **Step 5:** Commit "Django: numeração de propostas (1001+, atômica)".

### Task 5: Permissões, senha e formatação

**Files:**
- Create: `web/nucleo/permissoes.py`, `web/nucleo/senha.py`, `web/nucleo/formato.py`, `web/nucleo/tema.py`
- Test: `web/nucleo/tests/test_permissoes.py`, `test_senha.py`, `test_formato.py`, `test_tema.py`

**Interfaces:**
- Produces:
  - `MODULOS: list[dict]` (chave, nome, acoes) igual a `permissoes.ts`; `PERFIS: dict[str, dict]` (administrador, gerente, vendedor, leitura), `pode(usuario, modulo: str, acao: str = "ver") -> bool`, `sanitizar_permissoes(p: dict) -> dict`, `perfil_de(usuario) -> str` ("Superadministrador", o nome do perfil ou "Personalizado").
  - `validar_senha(s: str) -> str | None` (a mensagem de erro ou None).
  - `brl(v) -> str`, `numero_br(v) -> str`, `data_br(v) -> str`, `data_hora_br(v) -> str`, `duracao(seg: int) -> str`, `slugify_br(s: str) -> str`.
  - `TEMA_PADRAO`, `tema_de(json: dict | None) -> dict`, `variaveis_css(tema: dict) -> str` (string para `style=`), `FONTES_URL`.

- [ ] **Step 1: Testes** (valores do Next):
  - permissões: superAdmin pode tudo; vendedor `pode("propostas","criar")` True e `pode("usuarios","ver")` False; `sanitizar_permissoes({"modulos":{"propostas":{"editar":True}}})["modulos"]["propostas"]["ver"] is True`; ação inexistente no módulo é descartada.
  - senha: `"curta1"` → "A senha precisa ter pelo menos 10 caracteres."; `"somenteletras"` → "A senha precisa ter letras e números."; `"a"*201` → "Senha longa demais."; `"boa-senha-123"` → None.
  - formato: `brl(1234.5) == "R$ 1.234,50"`; `numero_br(1234.567) == "1.234,567"`; `data_br("2026-11-19") == "19/11/2026"`; `data_br(None) == "sem data"`; `data_hora_br(None) == "-"`; `duracao(45) == "45s"`, `duracao(125) == "2min 5s"`, `duracao(3720) == "1h 2min"`; `slugify_br("Água & Cia Ltda") == "agua-cia-ltda"`; `slugify_br("!!!") == "cliente"`; o slug é cortado em 40.
  - tema: uma cor inválida (`"red"`) volta para o padrão; `variaveis_css` contém `--primary:#0D1B3E` e `--font-title:'Space Grotesk', system-ui, sans-serif`.
- [ ] **Step 2:** Rodar → FAIL. **Step 3:** Implementar, portando `permissoes.ts`, `senha.ts`, `formato.ts` e `tema.ts` (o `brl` usa `babel.numbers.format_currency(v, "BRL", locale="pt_BR")`). Conferir no Node o `duracao` exato (`src/lib/formato.ts`) e ajustar o teste se divergir.
- [ ] **Step 4:** Rodar → PASS. **Step 5:** Commit "Django: permissões, política de senha, formatação e tema".

### Task 6: Limite de taxa, IP e auditoria

**Files:**
- Create: `web/nucleo/limite.py`, `web/nucleo/auditoria.py`
- Test: `web/nucleo/tests/test_limite.py`, `test_auditoria.py`

**Interfaces:**
- Produces: `ip_cliente(request) -> str` (a última entrada do `X-Forwarded-For`, depois `X-Real-IP`, depois `REMOTE_ADDR`, depois `"local"`), `ip_original(request) -> str` (a primeira entrada do XFF), `permitir(chave: str, limite: int, janela_seg: int) -> bool` (janela deslizante no cache default), `auditar(request, *, acao, usuario=None, empresa_id=None, entidade=None, entidade_id=None, descricao=None) -> None` (corta a descrição em 500, grava o IP e engole as exceções).

- [ ] **Step 1: Testes**: `permitir("x", 3, 60)` → True×3 e depois False; outra chave não é afetada; depois que a janela passa (com o relógio mockado) volta a permitir; `ip_cliente` com `"1.1.1.1, 2.2.2.2"` → `"2.2.2.2"`; `auditar` com descrição de 600 chars grava 500; `auditar` não levanta exceção mesmo com um `entidade_id` gigante.
- [ ] **Step 2–4:** FAIL → implementar → PASS. **Step 5:** Commit "Django: limite de taxa e auditoria".

### Task 7: Sessão, login, logout e empresa atual

**Files:**
- Create: `web/nucleo/auth.py` (middleware e decorators), `web/painel/views/auth.py`, `web/painel/urls.py`, `web/painel/templates/painel/login.html`
- Modify: `web/config/settings.py` (MIDDLEWARE), `web/config/urls.py`
- Test: `web/painel/tests/test_login.py`, `test_sessao.py`

**Interfaces:**
- Consumes: `pode`, `auditar`, `permitir`, `ip_cliente`.
- Produces:
  - `SessaoMiddleware`: define `request.usuario` (Usuario | None). Invalida a sessão se `session["v"] != usuario.versao_sessao` ou se o usuário estiver inativo.
  - `entrar(request, usuario)` grava `uid` e `v` e faz rotate.
  - `empresas_do_usuario(usuario) -> list[Empresa]`, `empresa_atual(request) -> Empresa`.
  - Decorators `@exige_sessao(modulo=None, acao="ver", permitir_troca_senha=False)` (redirects: `/login?voltar=…`, `/admin/conta?trocar=1`, `/admin/sem-permissao`, `/login?erro=sem-empresa`) e `@exige_acao(modulo, acao)` (para POST: 403 com JSON `{"erro":"Você não tem permissão para esta ação."}` ou re-render com erro).
  - `filtro_propostas(request) -> Q`.
  - Rotas: `GET/POST /login`, `POST /admin/sair`, `POST /admin/empresa-ativa`, `/` → redirect `/admin`.

- [ ] **Step 1: Testes** (com os dados do `semear`):
  - `test_login_ok_redireciona_para_conta_quando_trocar_senha`
  - `test_email_normalizado` (`" Admin@Propostas.LOCAL "` entra)
  - `test_senha_errada_mensagem_generica` ("E-mail ou senha incorretos.") + auditoria LOGIN_FALHOU
  - `test_bloqueio_apos_5_falhas` (a 5ª e a 6ª respondem "Conta bloqueada…", com o texto do Next em `src/app/login/acoes.ts`, mesmo com a senha certa)
  - `test_limite_por_email` (a 9ª tentativa em 15 min responde "Muitas tentativas incorretas. Aguarde 15 minutos e tente novamente.")
  - `test_voltar_externo_ignorado` (`//evil.com` e `https://evil.com` → `/admin`)
  - `test_sair_derruba_outras_sessoes` (dois `Client` logados; um faz POST `/admin/sair`; o outro, em GET `/admin`, recebe 302 para `/login`)
  - `test_sem_empresa` (usuário sem membro e sem `todas_empresas` → `/login?erro=sem-empresa`, e o login mostra "Seu usuário ainda não está vinculado a nenhuma empresa." sem redirect em loop)
  - `test_troca_de_empresa_valida_slug` (um slug fora da lista é ignorado)
  - `test_vendedor_sem_permissao_em_usuarios` (`/admin/usuarios` → `/admin/sem-permissao`)
- [ ] **Step 2:** Rodar → FAIL.
- [ ] **Step 3:** Implementar, portando `src/app/login/acoes.ts`, `src/lib/auth.ts` e `src/lib/sessao.ts`. A verificação falsa usa `check_password(senha, HASH_FALSO)`, com o hash gerado na carga do módulo. O template de login reproduz `src/app/login/page.tsx` dentro de `painel/base.html` (Task 9 completa a base; aqui basta o mínimo para o teste).
- [ ] **Step 4:** Rodar → PASS. **Step 5:** Commit "Django: login, sessão com versão, logout e empresa ativa".

### Task 8: Cabeçalhos de segurança e CSP com nonce

**Files:**
- Create: `web/nucleo/seguranca.py` (`CabecalhosMiddleware`)
- Test: `web/nucleo/tests/test_seguranca.py`

**Interfaces:**
- Produces: `request.csp_nonce: str` (base64 de 16 bytes aleatórios, por requisição) e os cabeçalhos exatos de `src/middleware.ts:18-50`. Ficam de fora os caminhos `/static/`, `/empresas/` e `/uploads/`.

- [ ] **Step 1: Testes**: o GET `/login` tem uma CSP contendo `script-src 'self' 'nonce-<n>' 'strict-dynamic'` e `frame-ancestors 'none'`, com o mesmo nonce que aparece no HTML; `X-Frame-Options: DENY`; `Cache-Control: no-store` em `/login`; sem HSTS quando `MODO_HTTP=True` e com HSTS quando False; `/empresas/caddi/logo.png` sem CSP; nonces diferentes em duas requisições.
- [ ] **Step 2–4:** FAIL → implementar → PASS. **Step 5:** Commit "Django: cabeçalhos de segurança e CSP com nonce".

### Task 9: Casca do painel com o visual atual

**Files:**
- Create: `web/static/css/globals.css` (cópia byte a byte de `src/app/globals.css`), `web/static/css/proposta.css` (cópia de `src/app/p/proposta.css`), `web/static/js/painel.js`, `web/painel/templates/painel/{base.html,app.html,_lateral.html,sem_permissao.html,conta.html,inicio.html}`, `web/painel/views/{conta,inicio}.py`, `web/painel/context_processors.py`
- Test: `web/painel/tests/test_casca.py`

**Interfaces:**
- Consumes: `empresa_atual`, `pode`, `tema_de`, `variaveis_css`, `validar_senha`, `auditar`.
- Produces: `painel/app.html` (bloco `conteudo`), que as etapas seguintes estendem; o context processor `painel` (`usuario`, `empresa`, `empresas`, `menu` já filtrado e com o `on` calculado, `tema`, `estilo_tema`); `painel.js` com `data-copiar`, `data-confirmar`, `data-enviando` (desabilita e troca o texto do botão no submit), o select de empresa e o dimensionamento de `img[data-logo]` (a fórmula de `src/components/Logo.tsx`).

- [ ] **Step 1: Testes**:
  - `test_menu_vendedor` (tem Painel, Propostas, Nova proposta, Modelos, Produtos e planos, Clientes e Minha conta; não tem Usuários, Empresas, Auditoria nem Empresa e marca)
  - `test_menu_com_troca_de_senha_so_mostra_conta`
  - `test_item_ativo` (em `/admin/propostas/x` o item Propostas tem `on`; em `/admin/propostas/nova` só Nova proposta tem `on`)
  - `test_tema_no_app` (`style` do `.app` contém a `--primary` da empresa ativa)
  - `test_conta_troca_senha` (fluxo completo com as mensagens "Senha atual incorreta.", "A confirmação não confere com a nova senha.", "A nova senha precisa ser diferente da atual."; no sucesso, `trocar_senha=False`, `versao_sessao` incrementada, o usuário continua logado nesta sessão e auditoria TROCAR_SENHA)
  - `test_sem_permissao_pagina` ("Acesso não permitido")
- [ ] **Step 2:** Rodar → FAIL.
- [ ] **Step 3:** Templates com o HTML de `src/app/layout.tsx`, `src/app/admin/layout.tsx`, `src/components/admin/Lateral.tsx` (mesmos SVGs), `src/app/admin/conta/*` e `src/app/admin/sem-permissao/page.tsx`. A página `/admin` (`inicio.html`) por enquanto traz só o `.topo` "Painel · {empresa}"; os KPIs entram na etapa 3.
- [ ] **Step 4:** Rodar → PASS.
- [ ] **Step 5: Paridade visual:** subir o Next (`npm run dev`, com `DATABASE_URL` apontando para um banco `propostas_next` semeado com `npx prisma migrate deploy && npx prisma db seed`) e o Django (`python manage.py runserver 8000`). Comparar no navegador, lado a lado, o login, a lateral, Minha conta e sem-permissão, e corrigir as diferenças.
- [ ] **Step 6:** Commit "Django: casca do painel (lateral, conta, sem-permissão) com o visual atual".

---

**Fim da etapa 1:** `python manage.py test` todo verde, `semear` rodado, login funcionando em
`http://localhost:8000/login` com o mesmo visual do Next. Próximo: plano da etapa 2.
