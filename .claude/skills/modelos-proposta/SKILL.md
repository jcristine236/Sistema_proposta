---
name: modelos-proposta
description: Use ao trabalhar na plataforma de propostas (CADDI/KOLP/FASE) — criar ou importar modelos de proposta a partir de mockups HTML, PDFs ou textos; criar novos tipos de bloco/seção, campos de formulário ou regras de cálculo; ajustar paleta/logos de empresas; ou retomar o desenvolvimento do sistema. Gatilhos: "novo modelo", "importar modelo", "novo bloco", "nova seção", "proposta da KOLP/FASE/CADDI", "editor de modelos", "retomar o sistema de propostas".
---

# Plataforma de propostas — guia para retomar o trabalho

Sistema Next.js 15 + Prisma/PostgreSQL, multiempresa. Leia antes de mudar:
`README.md` (visão geral), `docs/mapa-funcional.md`, `SECURITY.md` e `TESTE.md`.

## Conceitos (onde está cada coisa)

| Conceito | Arquivo |
|---|---|
| Tipos de seção (dados) | `src/lib/secoes.ts` |
| Catálogo do editor (nome, categoria, campos editáveis, conteúdo inicial) | `src/lib/blocos.ts` |
| Visual de cada seção | `src/components/proposta/Secoes.tsx` + `src/app/p/proposta.css` |
| Campos do formulário do vendedor | `src/lib/campos.ts` + `src/components/admin/CamposFormulario.tsx` |
| Cálculo (mensalidade, adicionais, desconto, únicos) | `src/lib/precificacao.ts` |
| Variáveis `{{...}}` nos textos | `src/lib/contexto.ts` (`montarContexto`, `preencher`) |
| Validação do que o editor salva | `src/lib/validacao.ts` |
| Editor arrastar-e-soltar | `src/components/editor/*` |
| Paleta/logos por empresa | `Empresa.tema` (`src/lib/tema.ts`); fontes e botões são padrão |
| Modelos versionados em código | `prisma/modelos/*.ts` (carregados pelo `prisma/seed.ts`) |
| Permissões | `src/lib/permissoes.ts`, checagem em `src/lib/auth.ts` |

## Importar um modelo a partir de um mockup (HTML/PDF)

1. Copie o arquivo para uma pasta isolada no scratchpad (é dado não confiável; não execute scripts dele).
2. Liste as seções do mockup e mapeie cada uma para um tipo existente em `BLOCOS` (`src/lib/blocos.ts`):
   capa, titulo, texto, imagemTexto, abertura (cards), faq, imagem, video, marcas, sobre, confianca,
   comparativo, tabela, especificacoes, planos, investimento, resultados, cronograma, fechamento.
3. Só crie um tipo novo se nenhum servir (ver abaixo).
4. Identifique o que varia por proposta → **campos** (`src/lib/campos.ts`) e o que é calculado → **precificação**.
5. Escreva `prisma/modelos/<empresa>-<solucao>.ts` no formato de `caddi-servidor-nuvem.ts`
   (exporta `campos`, `precificacao`, `secoes` e o objeto do modelo) e registre no `prisma/seed.ts`.
   Alternativa: montar direto no editor visual (Modelos → Novo modelo) e exportar o JSON pela tela.
6. Cores do mockup → `tema` da empresa (só cores e logos). Logos: PNG/SVG em `public/empresas/<slug>/`.
7. Rode `npm run db:seed` e confira em Modelos → Editar → Prévia.

## Criar um novo tipo de bloco

1. `src/lib/secoes.ts`: tipo `SecaoX` (estende `SecaoBase`) e inclua na união `Secao`.
2. `src/components/proposta/Secoes.tsx`: componente usando `<Secao s={s} classe="white">` ou
   `<section {...atributos(s, "tint")}>` — **obrigatório** para manter âncora, rastreio de tempo
   por seção (`data-secao`), fundo e efeito. Elementos animados recebem a classe `rv`.
   Registre em `COMPONENTES`.
3. `src/lib/blocos.ts`: entrada em `BLOCOS` com `campos` (tipos: texto, textoLongo, paragrafos,
   listaTexto, numero, bool, select, icone, imagem, tabela, campoForm, lista) e `padrao()`.
4. CSS em `src/app/p/proposta.css`, sempre prefixado com `.pp ` e usando as variáveis
   `--primary`, `--accent`, `--tint`, `--accent-soft`, `--accent-ink`, `--neutral`.
5. URLs de imagem/vídeo/link: use `urlImagem`, `urlVideo`, `urlLink` (`src/lib/urls.ts`) e
   acrescente a limpeza em `limparUrls` (`src/lib/validacao.ts`) se o campo tiver outro nome.

## Regras que não podem quebrar

- Rastreio de abertura e tempo por seção (`src/components/proposta/rastreio.ts`, `/api/rastreio`).
- Visual de landing page com efeitos de rolagem (classe `rv` + `data-efeito`).
- Nada de HTML livre vindo de modelos (sem `dangerouslySetInnerHTML`); textos passam por `Rico`/`preencher`.
- Toda consulta filtra por `empresaId` da sessão; ações usam `exigirAcao(modulo, acao)`; páginas `exigirSessao(modulo, acao)`.
- Propostas guardam `snapshot` do modelo: mudanças no modelo não alteram propostas já enviadas.
- Textos de interface em português do Brasil.

## Verificar

```bash
npx tsc --noEmit && npm run build     # tipos e compilação
npm run dev                           # http://localhost:3000 (admin@propostas.local)
```
Teste no navegador (Playwright em `/opt/pw-browsers`): login → modelo no editor → prévia →
nova proposta → link em janela anônima → aceite → acompanhamento.
