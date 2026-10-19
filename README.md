# Plataforma de propostas

Sistema para criar, enviar e acompanhar propostas comerciais online, com várias
empresas na mesma instalação. Hoje atende **CADDI**, **KOLP** e **FASE**: cada uma
com domínio, paleta, logos, catálogo e modelos próprios.

- **Painel:** formulário de preenchimento por modelo, resumo financeiro ao vivo,
  prévia idêntica ao que o cliente vê e link pronto para enviar.
- **Proposta pública** (`https://propostas.<empresa>/p/<link>`): página no visual da
  empresa, com aceite, recusa com motivo e comentários.
- **Acompanhamento:** número de controle (ex.: CAD-2026-0001), aberturas, leitores,
  tempo de leitura por seção, linha do tempo e avisos por e-mail e WhatsApp.
- **Aceite com dados para contrato:** razão social, CNPJ, sócio, e-mail e WhatsApp.
- **Editor visual de modelos:** arrastar e soltar blocos, efeitos, seções favoritas reaproveitáveis.
- **Usuários e permissões:** por empresa e por módulo (ver/criar/editar/excluir), com auditoria.

Testar no seu computador: **[TESTE.md](TESTE.md)**.
Implantação na nuvem privada: **[deploy/README.md](deploy/README.md)**.
Segurança (auditoria e checklist): **[SECURITY.md](SECURITY.md)**.
Mapa funcional de referência: [docs/mapa-funcional.md](docs/mapa-funcional.md).

**Continuar com o Claude:** a skill `.claude/skills/modelos-proposta` explica a estrutura
para criar/importar modelos e novos blocos. Numa sessão do Claude Code neste repositório,
peça por exemplo: *“use a skill modelos-proposta e importe este mockup como modelo da KOLP”*.

## Tecnologia

| Camada | Escolha | Por quê |
|---|---|---|
| Aplicação | Next.js 15 + React 19 + TypeScript | Painel, páginas públicas e API num só projeto; uma linguagem só |
| Banco | PostgreSQL 16 + Prisma | Migrações versionadas e automáticas a cada atualização |
| Entrega | Docker Compose + Caddy | Um comando para subir/atualizar; HTTPS automático por domínio |

Atualizar = `git pull && docker compose up -d --build`.

## Conceitos

```
Empresa ─┬─ Produtos (ex.: planos de servidor)
         ├─ Modelos (tipos de solução) ─┬─ campos do formulário   src/lib/campos.ts
         │                              ├─ regras de cálculo      src/lib/precificacao.ts
         │                              └─ seções da proposta     src/lib/secoes.ts
         └─ Propostas ── visualizações, tempo por seção, eventos
```

- **Modelo**: cada tipo de solução tem seu formulário, cálculo e visual. Já vêm prontos
  (em `prisma/modelos/`, carregados pelo seed) — edite pelo editor visual ou duplique:
  - **CADDI**: Servidor em nuvem, Gestão de TI dedicada, Suporte e TI gerenciada, Backup e segurança de dados.
  - **KOLP**: Site e presença digital, Plataforma SaaS, Projeto sob medida.
  - **FASE**: Fase Web, Fase Food, Fase Pet, Fase Agro, Fase Clínicas e Fase Agenda
    (ERP por planos mensais fixos, um por segmento) e Fase X (automação fiscal por volume de CNPJs).

  Os modelos da FASE e o CADDI "Gestão e Suporte de TI" e "Site" da KOLP foram montados a partir
  de propostas reais. Os planos da FASE (preços por segmento) são cadastrados pelo seed e escolhidos
  na hora da proposta. O `padrao.ts` é um modelo genérico de reserva para novas empresas.
  Números de "quem somos" são exemplos — ajuste no editor.
- **Textos com variáveis**: `{{cliente}}`, `{{plano.nome}}`, `{{plano.vcpu}}`,
  `{{dispositivos}}`, `{{validade}}`, `{{calc.totalMensal|brl}}`, e `**negrito**`.
- **Proposta congelada**: ao gerar o link, a proposta guarda uma cópia do modelo e
  dos preços, então mudanças futuras não alteram o que já foi enviado.
- **Tema**: cores e fontes de cada empresa viram variáveis CSS (`src/lib/tema.ts`).
- **Multiempresa**: todo dado pertence a uma empresa; usuários podem atuar em mais de
  uma (papéis ADMIN/VENDEDOR); o campo `superAdmin` prepara o uso futuro como produto.

## Rodando localmente

Requisitos: Node 22 e PostgreSQL 16.

```bash
cp .env.example .env          # ajuste DATABASE_URL e SESSION_SECRET
npm install
npm run db:migrate            # cria as tabelas
npm run db:seed               # empresas, planos, modelos e proposta de exemplo
npm run dev                   # http://localhost:3000
```

Login inicial: `admin@propostas.local` / `trocar-esta-senha` (definidos no `.env`; troca obrigatória no primeiro acesso).
Proposta de exemplo: http://localhost:3000/p/grupo-mofarrej-exemplo

## Estrutura

```
prisma/
  schema.prisma              banco de dados
  seed.ts                    empresas, usuário, catálogo e modelos iniciais
  modelos/                   definição dos modelos (um arquivo por tipo de solução)
src/
  app/admin/                 painel (propostas, modelos, catálogo, clientes, empresa)
  app/p/[slug]/              página pública da proposta
  app/api/rastreio/          abertura e tempo de leitura
  app/api/propostas/[slug]/decisao/   aceite, recusa e comentário
  components/proposta/       seções visuais, efeitos e rastreio no navegador
  components/admin/          formulário dinâmico e componentes do painel
  lib/                       campos, cálculo, contexto/variáveis, tema, sessão
deploy/                      Caddyfile, .env de produção e passo a passo
```
