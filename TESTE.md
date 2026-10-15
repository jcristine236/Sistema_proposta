# Testar no seu computador

Roda o sistema completo (painel, banco de dados e propostas de exemplo) na sua
máquina, sem domínio e sem servidor. Leva uns 10 minutos na primeira vez.

## 1. Instalar o Docker Desktop (uma vez só)

1. Baixe em https://www.docker.com/products/docker-desktop/ e instale.
   No Windows, aceite a opção **WSL 2** se o instalador perguntar e reinicie o computador.
2. Abra o **Docker Desktop** e espere aparecer "Engine running" no canto inferior.

## 2. Baixar o sistema

1. Baixe o arquivo:
   https://github.com/jcristine236/Sistema_proposta/archive/refs/heads/claude/inspiring-archimedes-3stbow.zip
   (é preciso estar logada no GitHub).
2. Extraia o zip numa pasta, por exemplo `C:\Meus Sites\Sistema_proposta`.

> **Já testou a versão anterior?** Esta versão recria o banco. Antes de subir, rode uma vez:
> `docker compose -f docker-compose.teste.yml down -v` (apaga só os dados de teste).

## 3. Subir

1. Abra a pasta extraída no Explorador de Arquivos.
2. Clique na barra de endereço, digite `powershell` e aperte Enter.
3. Na janela que abrir, cole:

   ```
   docker compose -f docker-compose.teste.yml up --build
   ```

4. A primeira vez demora (baixa e monta tudo). Está pronto quando aparecer
   **"Ready"** ou **"✓ Starting..."** nas últimas linhas.
5. Abra no navegador: **http://localhost:3000**

   - E-mail: `admin@propostas.local`
   - Senha: `trocar-esta-senha`
   - No primeiro acesso o sistema pede para **criar uma senha nova** (mínimo 10 caracteres, letras e números).

Para parar: volte ao PowerShell e aperte `Ctrl + C`.
Para subir de novo depois: repita o comando do passo 3 (as propostas criadas continuam lá).
Para apagar tudo e começar do zero: `docker compose -f docker-compose.teste.yml down -v`

## 4. Roteiro de teste

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
- [ ] Nova proposta: preencher, ver o resumo e a prévia, **gerar link** (aparece o número, ex.: CAD-2026-0002)
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
- **E-mails e WhatsApp de aviso**: sem SMTP/WhatsApp configurados, os avisos aparecem
  apenas no PowerShell, como linhas `[aviso] ...` e `[whatsapp] ...`.
- **Abrir pelo celular de verdade**: o endereço `localhost` só existe no seu computador.

## Se algo der errado

| Mensagem | O que fazer |
|---|---|
| `docker: command not found` / não reconhecido | Abra o Docker Desktop e espere "Engine running"; feche e abra o PowerShell |
| `port is already allocated` / porta 3000 em uso | Feche outro programa usando a porta 3000, ou no `docker-compose.teste.yml` troque `"3000:3000"` por `"3001:3000"` e `http://localhost:3000` por `http://localhost:3001`; depois acesse http://localhost:3001 |
| A página não abre | Espere a montagem terminar; veja se o PowerShell mostra erro em vermelho e me envie um print |
