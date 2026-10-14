# Plataforma de propostas

Sistema para criar, enviar e acompanhar propostas comerciais online, com várias
empresas na mesma instalação. Hoje atende **CADDI**, **KOLP** e **FASE**: cada uma
com domínio, paleta, logos, catálogo e modelos próprios.

- **Painel:** formulário de preenchimento por modelo, resumo financeiro ao vivo,
  prévia idêntica ao que o cliente vê e link pronto para enviar.
- **Proposta pública** (`https://propostas.<empresa>/p/<link>`): página no visual da
  empresa, com aceite, recusa com motivo e comentários.
- **Acompanhamento:** aberturas, leitores, tempo de leitura por seção, linha do tempo
  e avisos por e-mail.

Implantação na nuvem privada: **[deploy/README.md](deploy/README.md)**.
Mapa funcional de referência: [docs/mapa-funcional.md](docs/mapa-funcional.md).

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

- **Modelo**: cada tipo de solução tem seu formulário, cálculo e visual. O modelo
  CADDI "Servidor em nuvem" (`prisma/modelos/caddi-servidor-nuvem.ts`) reproduz o
  mockup aprovado. KOLP e FASE começam com um modelo genérico (`prisma/modelos/padrao.ts`).
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

Login inicial: `admin@propostas.local` / `trocar-esta-senha` (definidos no `.env`).
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
