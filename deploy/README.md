# Implantação em servidor Windows — passo a passo

Guia para colocar a plataforma no ar num servidor (VPS) Windows com os domínios
das três empresas (CADDI, KOLP e FASE), usando a Hostgator só para o DNS.

## Visão geral

```
Cliente ─► propostas.caddi.com.br ─┐
Cliente ─► propostas.kolp.com.br  ─┼─► servidor (portas 80/443) ─► Caddy (HTTPS automático)
Cliente ─► propostas.fasesistemas.com.br ─┘                              │
Equipe  ─► painel.caddi.com.br ──────────────────────────────────────────┤
                                                                         ▼
                                       Django (waitress, 127.0.0.1:8000) ─► PostgreSQL
```

- **Um servidor** atende as três empresas. Cada proposta só abre no domínio da empresa dona dela.
- **Painel interno** (login, criação de propostas) fica num domínio próprio, ex.: `painel.caddi.com.br`.
  Nos domínios `propostas.*` o painel é bloqueado pelo Caddy.
- **HTTPS** é emitido automaticamente (Let's Encrypt) pelo Caddy assim que o DNS aponta para o servidor.
- O Django (`web/servir.py`) e o Caddy rodam como **serviços do Windows** (via NSSM): sobem
  sozinhos quando o servidor liga.

Nos exemplos o sistema fica em `C:\propostas`. Use o **PowerShell como administrador**.

## 1. Requisitos do servidor

| Item | Mínimo |
|---|---|
| Sistema | Windows Server 2019/2022 (ou Windows 10/11) |
| CPU / RAM | 2 vCPU / 4 GB |
| Disco | 20 GB |
| Software | Python 3.13, PostgreSQL 16+, Git, NSSM, Caddy para Windows |
| Rede | IP público fixo, portas **80** e **443** liberadas para a internet |

Instale:
- **Python 3.13** (https://www.python.org/downloads/) — marque "Add python.exe to PATH" e
  "Install for all users".
- **PostgreSQL** (https://www.postgresql.org/download/windows/) — instala como serviço
  (`postgresql-x64-16`, por exemplo). Deixe ouvindo só em `localhost` (padrão).
- **Git** (https://git-scm.com/download/win).
- **NSSM** (https://nssm.cc/download) — copie `nssm.exe` (pasta `win64`) para `C:\Windows\System32`.
- **Caddy** (https://caddyserver.com/download, Windows amd64) — salve como `C:\caddy\caddy.exe`.

Firewall do Windows (só 80 e 443 abertas; nada de 5432 ou 8000):

```powershell
New-NetFirewallRule -DisplayName "Caddy HTTP"  -Direction Inbound -Protocol TCP -LocalPort 80  -Action Allow
New-NetFirewallRule -DisplayName "Caddy HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

## 2. DNS na Hostgator

No cPanel da Hostgator: **Domínios → Zone Editor (Editor de Zona)** → em cada domínio,
**+ Adicionar registro**. Crie um registro **A** apontando para o IP público do servidor:

| Domínio (zona) | Tipo | Nome | Valor | TTL |
|---|---|---|---|---|
| caddi.com.br | A | `propostas` | IP do servidor | 14400 |
| caddi.com.br | A | `painel` | IP do servidor | 14400 |
| kolp.com.br | A | `propostas` | IP do servidor | 14400 |
| fasesistemas.com.br | A | `propostas` | IP do servidor | 14400 |

Se o servidor tiver um nome fixo em vez de IP, use registros **CNAME** com esse nome.

Confirme a propagação (pode levar de minutos a algumas horas):

```powershell
Resolve-DnsName propostas.caddi.com.br
Resolve-DnsName propostas.kolp.com.br
Resolve-DnsName propostas.fasesistemas.com.br
Resolve-DnsName painel.caddi.com.br
```

Os quatro devem responder com o IP do servidor **antes** do passo 6, para que os
certificados HTTPS saiam na primeira tentativa.

## 3. Banco de dados

Abra o **SQL Shell (psql)** como `postgres` e crie o usuário e o banco (senha forte,
só letras e números, porque vai dentro da URL de conexão):

```sql
CREATE ROLE propostas LOGIN PASSWORD 'SENHA_FORTE_DO_BANCO';
CREATE DATABASE propostas OWNER propostas;
```

## 4. Baixar o sistema e configurar

```powershell
git clone -b claude/inspiring-archimedes-3stbow https://github.com/jcristine236/Sistema_proposta.git C:\propostas
cd C:\propostas\web
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
copy .env.example .env
notepad .env
```

Gere a `SECRET_KEY` com:

```powershell
.venv\Scripts\python -c "import secrets; print(secrets.token_urlsafe(50))"
```

Valores de produção no `web/.env`:

| Variável | O que colocar |
|---|---|
| `DATABASE_URL` | `postgres://propostas:SENHA_FORTE_DO_BANCO@localhost:5432/propostas` |
| `SECRET_KEY` | a chave gerada acima |
| `DEBUG` | `false` (obrigatório: o `servir.py` não sobe com `true`; desliga `ALLOW_ANY_HOST`/`MODO_HTTP` e exige `SECRET_KEY` com 32+ caracteres) |
| `MODO_HTTP` | `false` (HTTPS: cookies `Secure` e HSTS) |
| `ALLOW_ANY_HOST` | `false` (cada proposta só abre no domínio da empresa) |
| `PUBLIC_BASE_URL` | vazio (o link usa o domínio da empresa) |
| `PUBLIC_PROTOCOL` | `https` |
| `ADMIN_BASE_URL` | `https://painel.caddi.com.br` (usado nos links dos avisos) |
| `ATRAS_DE_PROXY` | `true` (confia no `X-Forwarded-Proto` do Caddy) |
| `CSRF_TRUSTED_ORIGINS` | `https://painel.caddi.com.br,https://propostas.caddi.com.br,https://propostas.kolp.com.br,https://propostas.fasesistemas.com.br` |
| `UPLOAD_DIR` | pasta das imagens enviadas; padrão `./uploads` (= `C:\propostas\web\uploads`) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | primeiro administrador; a senha precisa de 12+ caracteres, letras e números (o `semear` recusa senha fraca com `ALLOW_ANY_HOST=false`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | e-mail dos avisos de abertura/aceite (recomendado). Porta 587 usa STARTTLS; `SMTP_SECURE=true` para SSL direto (465) |
| `WHATSAPP_PROVIDER` e variáveis do provedor | `evolution` (`EVOLUTION_URL`, `EVOLUTION_INSTANCE`, `EVOLUTION_APIKEY`), `meta` (`META_TOKEN`, `META_PHONE_ID`, `META_TEMPLATE`, `META_TEMPLATE_LANG`) ou `webhook` (`WHATSAPP_WEBHOOK_URL`, `WHATSAPP_WEBHOOK_SECRET`) |
| `D4SIGN_*` | contrato por assinatura eletrônica — ver [D4SIGN.md](D4SIGN.md) |
| `HOST` / `PORTA` / `THREADS` | opcionais para o `servir.py`; padrão `127.0.0.1`, `8000`, `8` |

Proteja o arquivo (só administradores leem):

```powershell
icacls C:\propostas\web\.env /inheritance:r /grant:r "Administrators:F" "SYSTEM:F"
```

Antes de ir ao ar, siga o checklist de [SECURITY.md](../SECURITY.md).

## 5. Preparar e rodar o Django como serviço

```powershell
cd C:\propostas\web
.venv\Scripts\python manage.py migrate
.venv\Scripts\python manage.py collectstatic --noinput
.venv\Scripts\python manage.py semear
```

O `semear` cadastra as empresas, o administrador e os 18 modelos (pode rodar de novo:
atualiza sem apagar propostas).

Serviço `propostas` com NSSM (troque `postgresql-x64-16` pelo nome do serviço do seu PostgreSQL):

```powershell
mkdir C:\propostas\logs
nssm install propostas C:\propostas\web\.venv\Scripts\python.exe C:\propostas\web\servir.py
nssm set propostas AppDirectory C:\propostas\web
nssm set propostas AppStdout C:\propostas\logs\app.log
nssm set propostas AppStderr C:\propostas\logs\app.log
nssm set propostas AppRotateFiles 1
nssm set propostas AppRotateBytes 10485760
nssm set propostas DependOnService postgresql-x64-16
nssm start propostas
```

Confira: `Invoke-WebRequest http://127.0.0.1:8000/login -UseBasicParsing` deve responder 200.

## 6. Caddy (HTTPS) como serviço

O `deploy/Caddyfile` usa duas variáveis: `ACME_EMAIL` (avisos dos certificados) e
`PAINEL_DOMINIO`. Se os domínios forem diferentes dos padrões, ajuste o arquivo.

```powershell
nssm install caddy C:\caddy\caddy.exe run --config C:\propostas\deploy\Caddyfile
nssm set caddy AppDirectory C:\caddy
nssm set caddy AppEnvironmentExtra ACME_EMAIL=ti@caddi.com.br PAINEL_DOMINIO=painel.caddi.com.br
nssm set caddy AppStdout C:\propostas\logs\caddy.log
nssm set caddy AppStderr C:\propostas\logs\caddy.log
nssm set caddy AppRotateFiles 1
nssm set caddy AppRotateBytes 10485760
nssm start caddy
Get-Content C:\propostas\logs\caddy.log -Tail 30 -Wait   # acompanhe a emissão dos certificados
```

Acesse `https://painel.caddi.com.br`, entre com o usuário do `.env` (o sistema pede uma senha nova) e:

1. Em **Empresa e marca**, revise paleta, logos, e-mail e WhatsApp de avisos de cada empresa
   (troque de empresa no seletor do menu lateral). Domínio e prefixo ficam em **Empresas**.
2. Em **Usuários**, crie os acessos do time com o perfil adequado.
3. Crie uma proposta de teste e abra o link numa janela anônima.

## 7. Atualizar para uma nova versão

```powershell
cd C:\propostas
git pull
cd web
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python manage.py migrate
.venv\Scripts\python manage.py collectstatic --noinput
nssm restart propostas
```

Rode `semear` só se a versão trouxer modelos novos (ele sobrescreve os 18 modelos de fábrica
com a versão do repositório). As propostas já enviadas não mudam: cada uma guarda uma cópia
do modelo e dos preços do momento em que foi gerada.

## 8. Backup

Guarde **o banco e a pasta de uploads** (`UPLOAD_DIR`, padrão `C:\propostas\web\uploads`).

Para o `pg_dump` não pedir senha, crie `C:\Windows\System32\config\systemprofile\AppData\Roaming\postgresql\pgpass.conf`
(perfil da conta SYSTEM, que roda a tarefa) com a linha
`localhost:5432:propostas:propostas:SENHA_FORTE_DO_BANCO`.

Salve como `C:\propostas\backup.ps1` (ajuste a versão do PostgreSQL no caminho):

```powershell
$dia = Get-Date -Format yyyy-MM-dd
New-Item -ItemType Directory -Force C:\backup | Out-Null
& "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -h localhost -U propostas -Fc -f "C:\backup\propostas-$dia.dump" propostas
Compress-Archive -Path C:\propostas\web\uploads\* -DestinationPath "C:\backup\uploads-$dia.zip" -Force
Get-ChildItem C:\backup | Where-Object LastWriteTime -lt (Get-Date).AddDays(-30) | Remove-Item
```

Agende todo dia às 2h no Agendador de Tarefas:

```powershell
schtasks /create /tn "Backup propostas" /sc daily /st 02:00 /ru SYSTEM /tr "powershell -NoProfile -ExecutionPolicy Bypass -File C:\propostas\backup.ps1"
```

Copie `C:\backup` para fora do servidor (outro disco, nuvem). Restaurar:

```powershell
nssm stop propostas
& "C:\Program Files\PostgreSQL\16\bin\pg_restore.exe" -h localhost -U propostas -d propostas --clean C:\backup\propostas-AAAA-MM-DD.dump
Expand-Archive C:\backup\uploads-AAAA-MM-DD.zip -DestinationPath C:\propostas\web\uploads -Force
nssm start propostas
```

Os logos padrão ficam em `web/publico_raiz/empresas/<empresa>/` (versionados no repositório).

## 9. Usando outro proxy que a nuvem já tem

Sem o Caddy, configure no seu proxy:

- os quatro domínios encaminhando para `http://127.0.0.1:8000`;
- os cabeçalhos `Host`, `X-Forwarded-For` e `X-Forwarded-Proto` preservados (necessários
  para a trava por domínio, o limite por IP e o HTTPS);
- nos domínios `propostas.*`, bloquear `/admin`, `/login` e `/api/uploads`;
- certificados HTTPS para os quatro domínios.

## 10. Adicionar uma nova empresa no futuro

1. Cadastre a empresa em **Empresas** (superadministrador): nome, prefixo e domínio.
2. Crie o registro DNS `propostas.<dominio>` na Hostgator.
3. Inclua o domínio na lista de `deploy/Caddyfile` e em `CSRF_TRUSTED_ORIGINS` no `web/.env`.
4. `nssm restart caddy` e `nssm restart propostas`.

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| Link abre "Proposta não encontrada" | Proposta de outra empresa, ou o proxy não repassa o `Host` |
| Certificado não emitido | DNS ainda não propagou ou portas 80/443 bloqueadas (veja `C:\propostas\logs\caddy.log`) |
| Não chegam e-mails de aviso | `SMTP_HOST` vazio (os avisos ficam só no log: `C:\propostas\logs\app.log`) |
| Erro 403 "CSRF" ao salvar | Domínio faltando em `CSRF_TRUSTED_ORIGINS` ou `ATRAS_DE_PROXY` desligado |
| Página sem estilo | Faltou `collectstatic` depois de atualizar |
| Serviço `propostas` não sobe | Veja `C:\propostas\logs\app.log`; confira `DATABASE_URL` e se o PostgreSQL está rodando |
