# Testar no seu computador (Windows)

Roda o sistema completo (painel, banco de dados e modelos de exemplo) na sua
máquina, sem domínio e sem servidor. Leva uns 15 minutos na primeira vez.

## 1. Instalar (uma vez só)

1. **Python 3.13**: https://www.python.org/downloads/ — no instalador, marque
   **"Add python.exe to PATH"**.
2. **PostgreSQL** (16 ou mais novo): https://www.postgresql.org/download/windows/ —
   anote a senha do usuário `postgres` que o instalador pede. O PostgreSQL fica
   rodando como serviço do Windows.
3. **Git** (opcional, para baixar com `git clone`): https://git-scm.com/download/win

## 2. Criar o banco

Abra o **SQL Shell (psql)** (menu Iniciar), entre com o usuário `postgres` e rode
(troque `SUA_SENHA` por uma senha só de letras e números):

```sql
CREATE ROLE propostas LOGIN PASSWORD 'SUA_SENHA' CREATEDB;
CREATE DATABASE propostas OWNER propostas;
```

(`CREATEDB` é necessário para os testes automáticos criarem o banco de teste.)

## 3. Baixar e configurar

Baixe o repositório (branch `claude/inspiring-archimedes-3stbow`) e abra o PowerShell
na pasta `web`:

```powershell
cd C:\caminho\Sistema_proposta\web
python -m venv .venv
.venv\Scripts\Activate.ps1          # se o Windows bloquear: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
pip install -r requirements.txt
copy .env.example .env
notepad .env
```

No `.env`, ajuste `DATABASE_URL` com a senha do passo 2
(`postgres://propostas:SUA_SENHA@localhost:5432/propostas`) e troque `SECRET_KEY` por
qualquer texto longo. O resto já vem pronto para teste local (`DEBUG=true`,
`MODO_HTTP=true`, `ALLOW_ANY_HOST=true`).

## 4. Subir

```powershell
python manage.py migrate      # cria as tabelas
python manage.py semear       # empresas CADDI/KOLP/FASE, administrador e os 18 modelos
python manage.py runserver    # http://localhost:8000
```

Abra **http://localhost:8000** e entre com o e-mail e a senha de `SEED_ADMIN_EMAIL` e
`SEED_ADMIN_PASSWORD` do `.env` (padrão: `admin@propostas.local` / `trocar-esta-senha`).
No primeiro acesso o sistema pede para **criar uma senha nova** (mínimo 10 caracteres,
letras e números).

Para parar: `Ctrl + C`. Para subir de novo: abra o PowerShell em `web`, rode
`.venv\Scripts\Activate.ps1` e `python manage.py runserver`.
O `semear` pode ser rodado de novo a qualquer momento (atualiza empresas e modelos, não
apaga propostas nem muda a senha do administrador).

## 5. Testes automáticos

```powershell
python manage.py test
```

## 6. Roteiro de teste manual

Marque o que funcionou e anote o que quiser mudar.

**Acesso**
- [ ] Entrar, trocar a senha obrigatória e chegar ao Painel
- [ ] Trocar entre CADDI, KOLP e FASE no menu lateral (cores e logo mudam; logos ocupam o mesmo espaço)

**Editor de modelos** (Modelos → Editar no "Servidor em nuvem")
- [ ] Arrastar um bloco da coluna da esquerda para o meio (ex.: "Imagem + texto")
- [ ] Clicar no bloco e editar título, texto e enviar uma imagem
- [ ] Aba **Aparência**: trocar fundo e efeito ao rolar
- [ ] Reordenar arrastando pela alça ⋮⋮ ou pelas setas
- [ ] ★ numa seção (ex.: Condições comerciais) para salvar como favorita e renomear
- [ ] Abas **Formulário** (campos do vendedor) e **Cálculo**; **Prévia** completa; **Salvar**
- [ ] Modelos → **Novo modelo em branco**: montar com Planos, Tabela, Vídeo, FAQ e salvar
- [ ] Aba **Seções modelo**: criar/renomear/excluir seções e usá-las em "Minhas seções" do editor

**Proposta**
- [ ] Nova proposta: preencher, ver o resumo e a prévia, **gerar link** (aparece o número, ex.: CAD-2026-0001)
- [ ] Abrir o link em **janela anônima** (Ctrl + Shift + N) e rolar até o fim
- [ ] **Aceitar**: preencher razão social, CNPJ, sócio, e-mail e WhatsApp (teste um CNPJ inválido)
- [ ] No painel: proposta "Aceita", **Dados para o contrato**, tempo de leitura por seção
- [ ] **Duplicar**, **Editar** e **Excluir** propostas; buscar pelo número na lista

**Cadastros e acesso**
- [ ] Produtos e Clientes: cadastrar, **editar** e **excluir**
- [ ] Empresa e marca: cores, logos (envio de arquivo), e-mail/WhatsApp de avisos, motivos de recusa
- [ ] Usuários: criar um vendedor só da KOLP com o perfil "Vendedor"; sair e entrar com ele
      (menu reduzido, só a KOLP, sem acesso a Usuários)
- [ ] Auditoria: ver os logins e alterações registrados

## O que não dá para testar localmente

- **Domínios reais** (`propostas.caddi.com.br` etc.) e HTTPS: só no servidor.
- **E-mails e WhatsApp de aviso**: sem `SMTP_HOST` e `WHATSAPP_PROVIDER` no `.env`, os
  avisos aparecem só no PowerShell (log).
- **Abrir pelo celular de verdade**: o endereço `localhost` só existe no seu computador.

## Se algo der errado

| Mensagem | O que fazer |
|---|---|
| `python` não reconhecido | Reinstale o Python marcando "Add python.exe to PATH"; feche e abra o PowerShell |
| `password authentication failed` | A senha em `DATABASE_URL` não é a do passo 2 |
| `ImproperlyConfigured: Set the SECRET_KEY` | Falta o `.env` em `web/` (passo 3) |
| Porta 8000 em uso | `python manage.py runserver 8001` e acesse http://localhost:8001 |
| Testes: `permission denied to create database` | Rode no psql: `ALTER ROLE propostas CREATEDB;` |
