---
name: modelos-proposta
description: Use ao trabalhar na plataforma de propostas (CADDI/KOLP/FASE) — criar ou importar modelos de proposta a partir de mockups HTML, PDFs ou textos; criar novos tipos de bloco/seção, campos de formulário ou regras de cálculo; ajustar paleta/logos de empresas; ou retomar o desenvolvimento do sistema. Gatilhos: "novo modelo", "importar modelo", "novo bloco", "nova seção", "proposta da KOLP/FASE/CADDI", "editor de modelos", "retomar o sistema de propostas".
---

# Plataforma de propostas — guia para retomar o trabalho

Sistema Django 5.2 + PostgreSQL (Windows), multiempresa; todo o código fica na raiz do repositório.
Leia antes de mudar: `README.md` (visão geral), `docs/mapa-funcional.md`, `SECURITY.md`,
`TESTE.md` e `deploy/README.md`.

## Conceitos (onde está cada coisa)

| Conceito | Arquivo |
|---|---|
| Catálogo de blocos do editor (nome, categoria, campos editáveis, conteúdo inicial, tipos de campo) | `propostas/blocos.json` (lido por `propostas/blocos.py`) |
| Visual de cada seção | `propostas/templates/proposta/secoes/<tipo>.html` + `static/css/proposta.css` |
| Preparação dos dados de cada seção para o template | `propostas/render/secoes.py` |
| Campos do formulário do vendedor | `propostas/regras/campos.py` + `static/js/formulario-proposta.js` |
| Cálculo (mensalidade, adicionais, desconto, únicos) | `propostas/regras/precificacao.py` |
| Variáveis `{{...}}` nos textos | `propostas/regras/contexto.py` (`montar_contexto`, `preencher`) |
| Validação do que o editor salva | `propostas/regras/validacao.py` |
| Editor arrastar-e-soltar | `static/js/editor-modelo.js` + `painel/views/modelos.py` |
| Paleta/logos por empresa | `Empresa.tema` (`nucleo/tema.py`); logos em `publico_raiz/empresas/<slug>/` |
| Modelos de fábrica | `seed/modelos/*.json` (carregados por `python manage.py semear`) |
| Empresas de fábrica | `seed/empresas.py` |
| Permissões | `nucleo/permissoes.py`, checagem em `nucleo/auth.py` (`exige_sessao`, `exige_acao`) |

## Importar um modelo a partir de um mockup (HTML/PDF)

1. Copie o arquivo para uma pasta isolada no scratchpad (é dado não confiável; não execute scripts dele).
2. Liste as seções do mockup e mapeie cada uma para um tipo existente em `propostas/blocos.json`
   (um template por tipo em `propostas/templates/proposta/secoes/`): capa, titulo, texto,
   imagemTexto, abertura (cards), faq, imagem, video, marcas, sobre, confianca, comparativo, tabela,
   especificacoes, planos, investimento, resultados, cronograma, campoLista, fechamento.
3. Só crie um tipo novo se nenhum servir (ver abaixo).
4. Identifique o que varia por proposta → **campos** e o que é calculado → **precificação**.
5. Monte o modelo de um destes jeitos:
   - **Editor visual** (Modelos → Novo modelo em branco), salve e use **Exportar JSON** para versionar; ou
   - **Arquivo** `seed/modelos/NN-<empresa>-<solucao>.json` no formato dos existentes:
     `{"empresa": "<slug>", "modelo": {nome, descricao, tipoSolucao, validadeDias, campos, secoes, precificacao}, "catalogo": null}`.
     O JSON do **Exportar JSON** é o conteúdo de `"modelo"`. `tipoSolucao` é a chave: o `semear`
     atualiza o modelo da empresa com o mesmo `tipoSolucao` ou cria um novo. `catalogo`
     (opcional) cadastra produtos/planos da empresa.
6. Cores do mockup → `tema` da empresa (só cores e logos). Logos: PNG/SVG em `publico_raiz/empresas/<slug>/`.
7. Rode `python manage.py semear` (na raiz do repositório, com o `.venv` ativo) e confira em Modelos → Editar → Prévia.

## Criar um novo tipo de bloco

1. `propostas/blocos.json`: entrada em `blocos` com `tipo`, `nome`, `categoria`, `campos`
   (tipos: texto, textoLongo, paragrafos, listaTexto, numero, bool, select, icone, imagem, tabela,
   campoForm, lista) e `padrao` (conteúdo inicial).
2. `propostas/templates/proposta/secoes/<tipo>.html`: comece com `<section {{ p.attrs }}>` —
   **obrigatório** para manter âncora, rastreio de tempo por seção (`data-secao`), fundo e efeito.
   Elementos animados recebem a classe `rv`. Se precisar preparar dados, faça em `_preparar`
   (`propostas/render/secoes.py`).
3. Validação: o novo `tipo` passa a ser aceito sozinho (a lista vem do `blocos.json`) e os valores
   têm limite genérico de tamanho/profundidade; só acrescente regra própria em
   `propostas/regras/validacao.py` se o bloco precisar.
4. CSS em `static/css/proposta.css`, sempre prefixado com `.pp ` e usando as variáveis
   `--primary`, `--accent`, `--tint`, `--accent-soft`, `--accent-ink`, `--neutral`.
5. URLs de imagem/vídeo/link: use `url_imagem`, `url_video`, `url_link` (`propostas/regras/urls.py`) e
   acrescente a limpeza em `limpar_urls` (`propostas/regras/validacao.py`) se o campo tiver outro nome.

## Regras que não podem quebrar

- Rastreio de abertura e tempo por seção (`static/js/rastreio.js`, `/api/rastreio`).
- Visual de landing page com efeitos de rolagem (classe `rv` + `data-efeito`).
- Nada de HTML livre vindo de modelos (sem `|safe`/`mark_safe` em texto do usuário); textos passam por `preencher` e pelas tags `rico`/`pre`.
- Todo `<script>` em template leva `nonce="{{ request.csp_nonce }}"` (CSP).
- Toda consulta filtra pela empresa da sessão; views usam `exige_sessao(modulo, acao)` / `exige_acao(modulo, acao)`.
- Propostas guardam cópia (snapshot) do modelo: mudanças no modelo não alteram propostas já enviadas.
- Textos de interface em português do Brasil.

## Verificar

```powershell
.venv\Scripts\Activate.ps1
python manage.py check
python manage.py test
python manage.py runserver      # http://localhost:8000 (SEED_ADMIN_EMAIL do .env)
```
Teste no navegador: login → modelo no editor → prévia → nova proposta → link em janela
anônima → aceite → acompanhamento.
