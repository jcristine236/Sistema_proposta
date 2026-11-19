# Etapa 2 — Proposta pública — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/p/<slug>` no Django igual ao Next (HTML, CSS, efeitos), com o rastreio de leitura
e a decisão (aceitar/recusar/comentar) funcionando. Os avisos por e-mail e WhatsApp ficam para a etapa 5.

**Architecture:** As regras ficam em `propostas/regras/` (Python puro, portado de `src/lib`). A renderização
fica em `propostas/templates/proposta/` (um partial por tipo de seção), com template tags em
`propostas/templatetags/proposta.py`. As views ficam em `publico/` (página, APIs e uploads). O JS vive em
`static/js/proposta.js` e `static/js/rastreio.js`.

**Tech Stack:** a mesma da etapa 1.

**Spec:** `docs/superpowers/specs/2026-11-19-migracao-django-design.md`

## Global Constraints

- **Fonte da verdade:** `src/components/proposta/*`, `src/lib/{campos,precificacao,contexto,urls,documentos,publico}.ts`, `src/app/p/**` e `src/app/api/{rastreio,propostas}/**`.
- **Referências geradas do próprio React:** `web/propostas/tests/referencias/casos.json` (36 casos: entradas, `calc`, `ctx`, resultados de `preencher` e o HTML do `PropostaView`), `web/propostas/render/icones.json` e `datacenter.html`. Gerador: `web/ferramentas/gerar-referencias.tsx`.
- **Comparação de HTML:** é feita por uma árvore canônica (tags, atributos ordenados, classes normalizadas, texto com espaços colapsados, estilos com números arredondados a 4 casas). Os `<link rel="preload">` que o React injeta são ignorados.
- **Floats:** o JS converte números com `String(n)`; o Python usa `js_num(n)` (inteiros sem `.0`).
- **Números no JSON:** os valores monetários do `calc` saem como float, iguais aos do JS.

## Review Focus

- **Proposta expirada aberta** (`valida_ate` no passado e status PUBLICADA/ABERTA): vira EXPIRADA no primeiro acesso, e aceitar ou recusar responde 409. Testes nas Tasks 3 e 5.
- **Host errado em produção** (`ALLOW_ANY_HOST=False`, host diferente de `dominio_propostas`): 404 na página, no rastreio e na decisão. Testes nas Tasks 3 e 5.
- **Rastreio com payload inválido ou gigante:** total acima de 600 ou corpo acima de 8000 caracteres é rejeitado sem gravar nada. Teste na Task 5.
- **Visita interna** (usuário logado no painel): não grava visualização. Teste na Task 5.
- **Texto do modelo com `<script>` ou `{{` malformado:** é escapado e nunca vira HTML. A comparação com o React cobre o caso, porque a variante "b" tem `<tags>`.

---

### Task 1: Regras portadas

**Files:** create `web/propostas/regras/{__init__,documentos,urls,campos,precificacao,contexto}.py`. Test: `web/propostas/tests/test_regras.py`.

**Interfaces (produz):**
- **documentos:** `so_digitos`, `cnpj_valido`, `formatar_cnpj`, `telefone_valido`, `formatar_telefone`, `whatsapp_internacional`, `email_valido`.
- **urls:** `url_imagem(u) -> str|None`, `url_link(u) -> str|None`, `url_video(u) -> str|None`.
- **campos:** `valores_padrao(campos, hoje: date|None=None) -> dict`, `validar(campos, dados) -> list[str]`.
- **precificacao:** `catalogo_do_modelo(campos, catalogo)`, `resolver_produto(valor, catalogo)`, `calcular(regras, dados, catalogo) -> dict`. A saída tem as mesmas chaves do TS, com valores float/int.
- **contexto:** `montar_contexto(campos, precificacao, dados, catalogo, empresa, agora=None) -> dict`, `preencher(texto, ctx) -> str`, `condicao(expr, ctx) -> bool`, `js_num(n) -> str`.

- [ ] **Testes:**
  - para os 36 casos, `calcular` igual a `caso["calc"]`, comparando floats com tolerância de 1e-9;
  - `montar_contexto` igual a `caso["ctx"]` (sem `calc`, que já é comparado acima);
  - cada par de `caso["preenchidos"]` reproduzido por `preencher`;
  - `cnpj_valido("11.222.333/0001-81")` é True e `"11.111.111/1111-11"` é False;
  - `formatar_telefone("11912345678") == "(11) 91234-5678"`;
  - `url_video("https://youtu.be/dQw4w9WgXcQ") == "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0"`;
  - `url_imagem("javascript:alert(1)") is None`.
- [ ] RED → implementar → GREEN → commit "Django: regras da proposta (campos, precificação, contexto, documentos, urls)".

### Task 2: Renderização das seções

**Files:** create `web/propostas/render/{__init__,secoes}.py` (prepara cada seção para o template: classes, atributos, estilos `--d` com `js_num`), `web/propostas/templatetags/{__init__,proposta}.py` (`rico`, `preencher`, `icone`, `brl`), `web/propostas/templates/proposta/{proposta.html,_cabecalho.html,secoes/<tipo>.html ×20}`. Test: `web/propostas/tests/test_render.py`.

**Interfaces:** `renderizar_proposta(secoes, ctx, tema, modo="publico", slug=None, decisao=None, codigo=None, aviso_previa=None) -> str`, que devolve o HTML do `div.pp` inteiro, igual ao `PropostaView` no SSR.

- [ ] **Teste:** para os 36 casos, a árvore canônica de `renderizar_proposta(...)` é igual à de `caso["html"]`. Em caso de diferença, a mensagem mostra o primeiro nó que divergiu.
- [ ] RED → implementar → GREEN → commit "Django: renderização das 20 seções igual ao React".

### Task 3: Página `/p/<slug>` e `/uploads/<arquivo>`

**Files:** create `web/publico/{__init__,apps,urls,views}.py`, `web/publico/templates/publico/{proposta.html,nao_encontrada.html}`, `web/publico/servico.py` (`host_atual`, `host_permitido`, `proposta_publica`). Modify settings (app) and `config/urls.py`. Test: `web/publico/tests/test_pagina.py`.

- [ ] **Testes:**
  - `test_abre` (200, title "Proposta para X · CADDI", fontes `tema.FONTES_URL`, favicon = `tema.logo`, `proposta.css`, `div.pp`);
  - `test_rascunho_404`;
  - `test_empresa_inativa_404`;
  - `test_host_errado_404` (com `ALLOW_ANY_HOST=False`) e `test_host_certo_200` (com `HTTP_HOST=propostas.caddi.com.br`);
  - `test_expira_ao_abrir`;
  - `test_404_texto` ("Proposta não encontrada");
  - `test_upload_servido` (arquivo `<32hex>.png` em `UPLOAD_DIR` → 200, `Content-Type image/png`, `Cache-Control public, max-age=31536000, immutable`, CSP `default-src 'none'; sandbox`);
  - `test_upload_nome_invalido_404`.
- [ ] RED → implementar → GREEN → commit "Django: página pública da proposta e arquivos enviados".

### Task 4: JS da proposta e rastreio

**Files:** create `web/static/js/proposta.js` (efeitos `.rv`, contadores, progresso, dots, timeline, barra de ações, abas de selos, logo, modais com máscaras e validação, toast) e `web/static/js/rastreio.js` (mesmo algoritmo de `rastreio.ts`).

- [ ] Sem teste automatizado de JS: a verificação é no navegador, lado a lado com o Next (Task 6).
- [ ] Commit "Django: comportamento da proposta e rastreio de leitura em JS puro".

### Task 5: APIs de rastreio e de decisão

**Files:** modify `web/publico/{views,urls}.py`. Test: `web/publico/tests/test_apis.py`.

- [ ] **Testes (rastreio):**
  - `abrir` cria a Visualizacao, grava `primeira_abertura_em`, muda PUBLICADA → ABERTA e cria o Evento ABERTA;
  - um segundo leitor gera REABERTA `{"nome":"novo leitor"}`;
  - com sessão do painel, responde `{"visualizacaoId":null,"interno":true}` sem gravar;
  - `tempo` soma `tempo_total_seg` e o TempoSecao de cada seção, descartando seções que não estão no snapshot;
  - total acima de 600 → 400; corpo acima de 8000 → 413; JSON inválido → 400; host errado → 404;
  - 241 requisições → 429.
- [ ] **Testes (decisão):**
  - comentar cria o Evento COMENTARIO e funciona mesmo com a proposta expirada;
  - recusar exige motivo, grava RECUSADA e os campos de decisão;
  - aceitar valida e junta as mensagens ("Informe a razão social. CNPJ inválido. …"), formata e grava `dados_contratacao`, ACEITA e o Evento, e atualiza o Contato;
  - proposta já decidida → 409 "Esta proposta já foi respondida."; expirada → 409 "Esta proposta expirou. Fale com quem a enviou.";
  - 21 requisições → 429.
- [ ] RED → implementar (`csrf_exempt`, como hoje) → GREEN → commit "Django: APIs de rastreio e de decisão da proposta".

### Task 6: Paridade no navegador

- [ ] Criar a mesma proposta (mesmo modelo e mesmos dados) no banco do Next e no do Django, com um script de shell de cada lado.
- [ ] Abrir as duas lado a lado: comparar capa, rolagem, efeitos, contadores, barra de ações, abas de selos e os modais de aceitar, recusar e comentar. Conferir também o rastreio (Visualizacao e TempoSecao gravados).
- [ ] Corrigir as diferenças e fazer o commit.
