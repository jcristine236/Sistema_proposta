# Implantação na nuvem privada — passo a passo

Guia para o time de infraestrutura colocar a plataforma no ar com os domínios
das três empresas (CADDI, KOLP e FASE), usando a Hostgator só para o DNS.

## Visão geral

```
Cliente ─► propostas.caddi.com.br ─┐
Cliente ─► propostas.kolp.com.br  ─┼─► servidor (portas 80/443) ─► proxy Caddy (HTTPS automático)
Cliente ─► propostas.fasesistemas.com.br ─┘                              │
Equipe  ─► painel.caddi.com.br ──────────────────────────────────────────┤
                                                                         ▼
                                                        app (Next.js, porta 3000) ─► PostgreSQL
```

- **Um servidor** atende as três empresas. Cada proposta só abre no domínio da empresa dona dela.
- **Painel interno** (login, criação de propostas) fica em um domínio próprio, ex.: `painel.caddi.com.br`.
  Nos domínios `propostas.*` o painel é bloqueado pelo proxy.
- **HTTPS** é emitido automaticamente (Let's Encrypt) pelo Caddy assim que o DNS aponta para o servidor.

## 1. Requisitos do servidor

| Item | Mínimo |
|---|---|
| Sistema | Linux (Ubuntu 22.04/24.04 ou Debian 12) |
| CPU / RAM | 2 vCPU / 4 GB |
| Disco | 20 GB |
| Software | Docker 24+ com o plugin `docker compose` |
| Rede | IP público fixo, portas **80** e **443** liberadas para a internet |

> Se a nuvem já tem um proxy/balanceador (Nginx, Traefik, HAProxy), veja a seção 7.

## 2. DNS na Hostgator

No cPanel da Hostgator: **Domínios → Zone Editor (Editor de Zona)** → em cada domínio,
**+ Adicionar registro**. Crie um registro **A** apontando para o IP público do servidor:

| Domínio (zona) | Tipo | Nome | Valor | TTL |
|---|---|---|---|---|
| caddi.com.br | A | `propostas` | IP do servidor | 14400 |
| caddi.com.br | A | `painel` | IP do servidor | 14400 |
| kolp.com.br | A | `propostas` | IP do servidor | 14400 |
| fasesistemas.com.br | A | `propostas` | IP do servidor | 14400 |

Se o servidor tiver um nome fixo em vez de IP (ex.: `app.suanuvem.com.br`), use registros
**CNAME** com esse nome no campo Valor.

Confirme a propagação (pode levar de minutos a algumas horas):

```bash
dig +short propostas.caddi.com.br
dig +short propostas.kolp.com.br
dig +short propostas.fasesistemas.com.br
dig +short painel.caddi.com.br
```

Os quatro devem responder com o IP do servidor **antes** do passo 4, para que os
certificados HTTPS sejam emitidos na primeira tentativa.

## 3. Copiar os arquivos e configurar

```bash
# no servidor
git clone https://github.com/jcristine236/Sistema_proposta.git /opt/propostas
cd /opt/propostas
cp deploy/.env.producao.example .env
nano .env
```

Preencha no `.env`:

| Variável | O que colocar |
|---|---|
| `DB_PASSWORD` | senha forte do banco: `openssl rand -base64 24` |
| `SESSION_SECRET` | chave do login: `openssl rand -base64 48` |
| `PAINEL_DOMINIO` / `ADMIN_BASE_URL` | domínio do painel (ex.: `painel.caddi.com.br`) |
| `ACME_EMAIL` | e-mail que recebe avisos dos certificados |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | primeiro usuário administrador |
| `SMTP_*` | servidor de e-mail para os avisos de abertura/aceite (recomendado) |

Mantenha `ALLOW_ANY_HOST=false` e `PUBLIC_BASE_URL` vazio em produção.

Se os domínios forem diferentes dos padrões, ajuste também `deploy/Caddyfile`.

## 4. Subir

```bash
docker compose up -d --build
docker compose ps          # db, app e proxy "running"; migrar "exited (0)"
docker compose logs -f proxy   # acompanhe a emissão dos certificados
```

O serviço `migrar` roda sozinho a cada implantação: cria/atualiza as tabelas e
cadastra as empresas, os planos da CADDI e os modelos iniciais (sem apagar dados).

Acesse `https://painel.caddi.com.br`, entre com o usuário do `.env` e:

1. Em **Empresa e marca**, revise o domínio, a paleta e o e-mail de avisos de cada empresa
   (troque de empresa no seletor do menu lateral).
2. Crie uma proposta de teste e abra o link numa janela anônima.

## 5. Atualizar para uma nova versão

```bash
cd /opt/propostas
git pull
docker compose up -d --build
```

As migrações do banco rodam automaticamente. As propostas já enviadas não mudam:
cada uma guarda uma cópia do modelo e dos preços do momento em que foi gerada.

## 6. Backup

O banco fica no volume `dados-db`. Backup diário sugerido (cron):

```bash
docker compose exec -T db pg_dump -U propostas propostas | gzip > /backup/propostas-$(date +%F).sql.gz
```

Restaurar:

```bash
gunzip -c arquivo.sql.gz | docker compose exec -T db psql -U propostas propostas
```

Os logos ficam em `public/empresas/<empresa>/` (versionados no repositório).

## 7. Usando o proxy que a nuvem já tem

Remova o serviço `proxy` do `docker-compose.yml`, publique a porta do app
(`ports: ["127.0.0.1:3000:3000"]`) e configure no seu proxy:

- os quatro domínios encaminhando para `http://127.0.0.1:3000`;
- os cabeçalhos `Host` e `X-Forwarded-For` preservados (necessário para a trava por domínio);
- nos domínios `propostas.*`, bloquear `/admin` e `/login`;
- certificados HTTPS para os quatro domínios.

Exemplo Nginx (um bloco por domínio de proposta):

```nginx
server {
  server_name propostas.caddi.com.br;
  location ~ ^/(admin|login) { return 404; }
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## 8. Adicionar uma nova empresa no futuro

1. Cadastre a empresa (por enquanto em `prisma/seed.ts`, depois pelo painel de superadmin).
2. Crie o registro DNS `propostas.<dominio>` na Hostgator.
3. Inclua o domínio na lista de `deploy/Caddyfile`.
4. `docker compose up -d --build`.

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| Link abre "Proposta não encontrada" | Proposta de outra empresa, ou o proxy não repassa o `Host` |
| Certificado não emitido | DNS ainda não propagou ou portas 80/443 bloqueadas |
| Não chegam e-mails de aviso | `SMTP_*` vazio (os avisos ficam só no log: `docker compose logs app`) |
| Erro de banco ao subir | `DB_PASSWORD` mudou depois do primeiro `up` (o volume guarda a senha antiga) |
