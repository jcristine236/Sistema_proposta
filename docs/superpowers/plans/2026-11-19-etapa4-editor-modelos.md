# Etapa 4 — Editor de modelos (Django) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Trocar `/admin/modelos*` (hoje "em construção") pela lista de modelos/seções e pelo editor visual de blocos, com o mesmo visual e comportamento do Next.

**Architecture:** O catálogo de blocos (`src/lib/blocos.ts`) é exportado uma vez para `web/propostas/blocos.json`, lido pelo Python (validação, padrões) e entregue ao JS. A validação (`src/lib/validacao.ts`) é portada para Python. O editor é JS sem build (`static/js/editor-modelo.js`) que monta o DOM igual ao React; o HTML de cada bloco no canvas e a prévia vêm do servidor (`renderizar` já existente) por um endpoint JSON.

**Tech Stack:** Django 5.2, Python 3.13, JS puro, PostgreSQL.

**Spec:** `docs/superpowers/specs/2026-11-19-migracao-django-design.md` (Etapa 4).

## Global Constraints

- Mesmo visual, em tudo: classes, textos, ordem e estilos iguais aos do Next (`src/app/admin/modelos/**`, `src/components/editor/**`).
- Sem Node no runtime, sem build; todo `<script>` com `nonce="{{ request.csp_nonce }}"`; JSON do painel com `X-CSRFToken`.
- Tudo filtrado por `request.empresa` (modelo/seção de outra empresa = 404 ou "não encontrado").
- Permissões: módulo `modelos` (`ver`, `criar`, `editar`, `excluir`); "Usar" exige `propostas.criar`.
- Mensagens de erro e sucesso com o texto exato do Next.

## Review Focus

1. Seção com `capitulo`/`numero`/`mostrarSe` = `null` (o JS deve apagar a chave, não mandar null) — o servidor recusa como o zod.
2. Corpo JSON malformado/gigante/aninhado nos endpoints do editor → nunca 500.
3. Bloco inválido no canvas (tipo desconhecido, sem id) → o endpoint de render não quebra os outros blocos.
4. Duplicar/alternar/excluir/renomear com id de outra empresa → nada acontece.
5. Usuário só com `modelos.ver` → editor somente leitura (sem Salvar, fieldset desabilitado), endpoints de escrita 403.

---

### Task 1: Catálogo de blocos e validação

**Files:** Create `web/ferramentas/exportar-blocos.ts`, `web/propostas/blocos.json`, `web/propostas/regras/validacao.py`, `web/propostas/tests/test_validacao.py`; Modify `web/propostas/blocos.py`.

**Produces:**
- `blocos.json`: `{"blocos": [{tipo, nome, categoria, icone, descricao, campos, padrao}], "fundos": [...], "efeitos": [...], "tiposCampo": [...], "nomesIcones": [...]}` (padrao = `def.padrao()` já chamado).
- `propostas.blocos`: `CATALOGO` (o JSON), `BLOCO: dict[str, dict]`, `NOMES`, `TIPOS_SECAO`, `novo_id(tipo) -> str` (`<tipo>-` + 6 chars [a-z0-9]), `padrao(tipo) -> dict` (cópia com `id` novo).
- `propostas.regras.validacao`: `validar_secao(v) -> {"ok": dict} | {"erro": str}`, `validar_secoes`, `validar_campos`, `validar_precificacao(v, campos)`, `tamanho_ok(*v) -> bool`, `conferir_valores(v, prof=0) -> str | None`. Mesmas regras e textos do `validacao.ts` (MAX_TEXTO 8000, MAX_JSON 600000, listas ≤200, objetos ≤60 chaves, profundidade 8, ids `^[a-z][\w-]{0,60}$` sem distinção de maiúsculas, variável `^[a-z][a-zA-Z0-9_]{0,39}$`, reservadas calc/empresa/validadeISO/expirada, `null` em campo opcional recusado).

Tests: id inválido → "Seção inválida: Identificador inválido"; tipo desconhecido recusado; `capitulo: None` recusado; imagem `javascript:` vira ""; ids repetidos renomeados; variável repetida → "Variável repetida: x"; reservada → "“calc” é um nome reservado. Escolha outra variável."; rótulo vazio → "Todo campo precisa de rótulo"; precificação limpa referências a campos inexistentes e converte números como `Number(x) || 0`; texto de 8001 → "Texto muito longo."; profundidade 9 → "Estrutura aninhada demais.".

### Task 2: Lista de modelos e seções + ações

**Files:** Create `web/painel/views/modelos.py`, `web/painel/templates/painel/modelos/lista.html`, `web/painel/tests/test_modelos.py`; Modify `web/painel/urls.py` (remove o `em_construcao` de modelos).

Rotas (POST salvo indicação):
- `GET admin/modelos` (`?aba=secoes`), `POST admin/modelos/novo`, `GET admin/modelos/<id>` → redirect editar, `POST admin/modelos/<id>/duplicar|alternar|excluir`.
- `POST admin/modelos/secoes/nova/<tipo>`, `POST admin/modelos/secoes/<id>/renomear|excluir`.
Comportamento e auditoria idênticos a `acoes.ts` (criar em branco: campos cliente+validade, seções capa+fechamento; duplicar → "<nome> (cópia)" e redirect para o editor; excluir → redirect lista).

Tests: lista nas duas abas; vendedor (só `ver`) vê "Ver" e não vê criar/duplicar/excluir; criar em branco; duplicar; alternar; excluir; ações com id de outra empresa não mudam nada; criar/renomear/excluir seção; `comparar_paginas` OK em `/admin/modelos` e `/admin/modelos?aba=secoes`.

### Task 3: Endpoints do editor

**Files:** Modify `web/painel/views/modelos.py`, `web/painel/urls.py`, `web/painel/tests/test_modelos.py`; Create `web/painel/templates/painel/modelos/_bloco.html`.

- `GET admin/modelos/<id>/editar` (tela) / `POST` JSON `{"modelo": {...}}` → `{"id"}` | `{"erro"}` (= `salvarModeloEditor`).
- `GET admin/modelos/secoes/<id>` (tela) / `POST` JSON `{"nome", "secao"}` → `{"id"}` | `{"erro"}`.
- `POST admin/modelos/secoes/favorita` JSON `{"nome","secao"}` → `{"id"}` (criar).
- `POST admin/modelos/render` JSON `{"campos","precificacao","secoes","completa"?}` → `{"blocos": [html|""...]}` ou, com `completa`, `{"html"}` (prévia inteira, aviso "Prévia do modelo com valores de exemplo"). Contexto = `valores_padrao(campos)` + contato `{"nome": "Cliente Exemplo"}` + catálogo completo da empresa. Bloco inválido ou que falhe ao renderizar vira "" sem afetar os outros.

Tests: salvar válido/inválido (mensagens), "Dê um nome ao modelo.", modelo de outra empresa → "Modelo não encontrado.", só `ver` → 403, render devolve um html por seção, bloco inválido vira "", JSON quebrado não dá 500.

### Task 4: Editor em JS

**Files:** Create `web/painel/templates/painel/modelos/editor.html`, `web/static/js/editor-modelo.js`.

Porta `EditorModelo`, `CamposBloco`, `EditorCampos`, `EditorCalculo` para DOM puro com a mesma marcação. Edição de texto altera o estado no lugar (sem redesenhar o painel, para não perder o foco); mudanças estruturais redesenham a parte afetada. Canvas: render no servidor com espera de 250 ms, troca só os blocos cujo HTML mudou. Prévia: `window.iniciarProposta`. Upload via `/api/uploads` com CSRF.

Verificação: comparar o DOM do editor no navegador (Next :3000 x Django :8000) para um modelo semeado, nos estados: aba Seções com a capa selecionada, abas Conteúdo/Aparência, aba Formulário, aba Cálculo, modo seção. Teste manual: arrastar bloco, mover, duplicar, favoritar, salvar, recarregar e conferir.

### Task 5: Revisão final

Revisor Opus no diff da etapa; correções com teste RED→GREEN; atualizar a spec com desvios.
