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

Para parar: volte ao PowerShell e aperte `Ctrl + C`.
Para subir de novo depois: repita o comando do passo 3 (as propostas criadas continuam lá).
Para apagar tudo e começar do zero: `docker compose -f docker-compose.teste.yml down -v`

## 4. Roteiro de teste

Marque o que funcionou e anote o que quiser mudar.

**Painel e empresas**
- [ ] Entrar com o usuário acima
- [ ] Trocar entre CADDI, KOLP e FASE no seletor do menu lateral (as cores e o logo do painel mudam)
- [ ] Ver o Painel com os indicadores

**Nova proposta CADDI (Servidor em nuvem)**
- [ ] Em **Nova proposta**, preencher o cliente
- [ ] Trocar o plano e ver o resumo financeiro mudar
- [ ] Escolher **Personalizado** e editar preço, vCPUs, RAM e disco
- [ ] Colocar mais de 5 dispositivos (R$ 30,00 por adicional)
- [ ] Dar um desconto acima de 15% e ver o alerta de aprovação
- [ ] Adicionar observações (só aparecem as que têm título e descrição)
- [ ] Abrir a aba **Prévia** e conferir a proposta
- [ ] **Gerar link** e copiar

**Como o cliente vê** (abra o link numa **janela anônima**: Ctrl + Shift + N)
- [ ] Capa com o nome do cliente, plano e validade
- [ ] Rolar a página até o fim (animações, abas de certificações, cronograma)
- [ ] Testar no celular: no Chrome do computador, F12 e o ícone de celular
- [ ] Clicar em **Tenho uma dúvida** e enviar um comentário
- [ ] Clicar em **Quero seguir com esta proposta** e aceitar

> Precisa ser janela anônima: logada no painel, suas visitas não contam como leitura do cliente.

**Acompanhamento** (de volta ao painel)
- [ ] Em **Propostas**, abrir a proposta: status "Aceita", tempo de leitura por seção, comentário e linha do tempo
- [ ] Criar outra proposta e **recusar** pelo link (escolhendo um motivo)

**KOLP e FASE**
- [ ] Criar uma proposta em cada uma (modelo genérico) e conferir cores, fontes e logos

**Cadastros**
- [ ] **Produtos e planos**: cadastrar um plano novo e vê-lo no formulário
- [ ] **Clientes**: ver os clientes criados automaticamente
- [ ] **Empresa e marca**: mudar uma cor, salvar e ver a proposta mudar
- [ ] **Modelos**: ver os campos, as regras de cálculo e a prévia de cada modelo

## O que não dá para testar localmente

- **Domínios reais** (`propostas.caddi.com.br` etc.) e HTTPS: só no servidor.
- **E-mails de aviso**: sem servidor de e-mail configurado, os avisos aparecem
  apenas no PowerShell, como linhas `[aviso] ...`.
- **Abrir pelo celular de verdade**: o endereço `localhost` só existe no seu computador.

## Se algo der errado

| Mensagem | O que fazer |
|---|---|
| `docker: command not found` / não reconhecido | Abra o Docker Desktop e espere "Engine running"; feche e abra o PowerShell |
| `port is already allocated` / porta 3000 em uso | Feche outro programa usando a porta 3000, ou no `docker-compose.teste.yml` troque `"3000:3000"` por `"3001:3000"` e `http://localhost:3000` por `http://localhost:3001`; depois acesse http://localhost:3001 |
| A página não abre | Espere a montagem terminar; veja se o PowerShell mostra erro em vermelho e me envie um print |
