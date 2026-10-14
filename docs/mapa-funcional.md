# Mapa funcional — referência para o novo sistema de propostas

Documento de base do projeto. Descreve **o que** um sistema de propostas comerciais
rastreáveis precisa fazer, a partir da análise funcional de uma ferramenta de mercado
usada como inspiração (telas salvas do painel e de uma proposta pública).

> Este mapa registra funcionalidades, fluxos e regras de negócio — não código.
> O novo sistema será escrito com código próprio, sem reaproveitar código, layout
> proprietário ou tema pago da ferramenta de referência.

---

## 1. Conceito

Sistema para **criar, enviar e acompanhar propostas comerciais online**. O vendedor
monta a proposta a partir de blocos reutilizáveis, envia um link, e acompanha em tempo
real se o cliente abriu, quanto tempo leu cada página, e se aceitou ou recusou.

### Hierarquia de conteúdo

```
Modelo ──► Páginas ──► Seções
   │
   └──► Proposta (instância de um modelo, enviada a um Contato)
```

- **Seção** — bloco de conteúdo (texto, imagem, vídeo, orçamento…). Pode ser salva numa galeria e reutilizada.
- **Página** — conjunto ordenado de seções. Reutilizável (galeria de páginas).
- **Modelo** — conjunto ordenado de páginas, com configurações padrão.
- **Proposta** — criada em branco, a partir de um modelo, ou importando um PDF.

---

## 2. Módulos do painel

### 2.1 Dashboard (Home)
- **Filtros:** período; base de data (*criação* ou *aprovação*); equipe; usuário criador; etiqueta.
- **KPIs:** valor total enviado · valor total em aberto · valor fechado · ticket médio ·
  publicadas · taxa de abertura · abertas · conversão · aceitas · tempo de leitura · ciclo de venda.
- **Insights de leitura:** total fechado · média de acessos · % de leitura completa · tempo médio de leitura · taxa de rejeição.
- **Gráfico semanal:** publicadas, abertas, declinadas, aceitas.
- **Alertas (com link):** não abertas · expirando · novos comentários · novos aceites.
- **Linha do tempo** de eventos (criada, aberta, aceita, recusada, comentada, expirada…).
- **Avisos globais:** fatura em atraso, e-mail não validado.

### 2.2 Propostas
- Listagem com busca e filtros (detalhes a definir).
- **Nova proposta:** em branco · a partir de modelo · importar PDF (prévia das páginas, excluir páginas, opção de agrupar tudo em uma página).
- **Motivos de perda** — cadastro dos motivos exibidos ao cliente quando ele recusa.
- **Fluxo pós-aceite** — cadastro de recursos reutilizáveis (ver 3.3).
- **Etiquetas** — título + cor.

### 2.3 Modelos
- Tabela: ID, nome, total de páginas, criado em, ações. Busca por nome/autor.
- Ações: criar (em branco ou PDF), editar, visualizar, renomear, duplicar, desativar, gerenciar páginas.
- **Configurações padrão do modelo:** etiquetas, recurso pós-aceite, identificação do leitor, notificações.

### 2.4 Páginas
- Tabela: ID, nome, total de seções, criado em, ações.
- Criar (nome + seleção de seções), adicionar/remover seções, renomear, duplicar, desativar.

### 2.5 Seções
- Tabela: ID, nome, tipo, criado em, última modificação, ações.
- Toda seção tem **título público** (visto pelo cliente) e **título privado** (uso interno).
- Botão de ação opcional por seção: texto, URL, cor, abrir em nova guia.
- Alguns tipos são bloqueados conforme o plano.

### 2.6 Catálogo
- **Produtos:** ID, nome, código, categoria, preço, tipo, status (ativo/inativo). Criar, editar, duplicar, desativar, reativar. Filtro por status.
- **Categorias** de produto.

### 2.7 Formulários
- Tabela: ID, criado em, título interno, título externo, qtd. de campos, nº de respostas, autor.
- Criar, editar, duplicar, excluir (bloqueado se estiver em uso), **ver respostas** em tabela.
- Usados como seção da proposta ou como recurso pós-aceite.

### 2.8 Contatos (clientes)
- Campos: empresa, nome do responsável, e-mail, celular (com DDI).
- Criar, editar, desativar, **exportar (Excel/CSV)**.

### 2.9 Integrações
- Integrações com CRMs e outras ferramentas · **Webhooks** · **Tokens de API**.

### 2.10 Conta
- Dados cadastrais do usuário · dados da empresa · plano/pagamentos · sair.
- **Gestão de equipe:** usuários (nome, e-mail, celular, cargo, equipe, perfil, status) e equipes.
  Criar, editar, desativar, reativar. **Limite de usuários por plano** com convite a fazer upgrade.

---

## 3. Editor de proposta

### 3.1 Estrutura da tela
- Topo: título, indicador de **salvamento automático**, botões **Configurar** e **Publicar**.
- Abas de páginas + **Nova página** (em branco ou da galeria).
- **Banner de capa** com recorte de imagem, logo da empresa e **logo do cliente**.
- Seções com **arrastar e soltar**, mover para outra página, salvar na galeria.
- Edição de texto inline com barra flutuante (parágrafo, H1–H4, negrito, itálico, sublinhado, cor).

### 3.2 Tipos de seção (18)

| Conteúdo | Comercial | Interação |
|---|---|---|
| Texto livre (editor rico) | Tabela de preço | Formulário |
| Imagens (galeria com legenda) | Orçamento interativo | Upload de arquivos pelo cliente |
| Vídeo (link ou upload) | Produto do catálogo | Agenda online (link de agendamento) |
| Arquivos para download | Calculadora de ROI | Botão de ação |
| Imagem + texto | Apresentação do vendedor | FAQ (lista ou blocos) |
| Card com imagem | Redes sociais | Post do Instagram |
| Incorporar URL (Canva, Notion, Google Docs/Planilhas/Apresentações, outros; altura configurável) | HTML & CSS livre (com pré-visualização) | |

### 3.3 Configurações da proposta (assistente em 2 passos)
1. **Informações:** cliente (com criação rápida), título, valor, prazo de expiração, etiquetas.
2. **Recursos:**
   - **Pós-aceite:** nenhum · link de redirecionamento (WhatsApp com mensagem pronta, ou URL) · formulário.
   - **Identificação do leitor:** não identificar · nome (obrigatório) · e-mail · celular · cargo.
   - Notificar se não for visualizada em 2 dias.
   - Salvar a proposta como modelo.

---

## 4. Proposta pública (visão do cliente)

- **Menu lateral:** logo, título, criado em/por, validade, dados do cliente, lista de páginas.
- Banner + seções; modo tela cheia; voltar ao topo.
- **Ações fixas:** Aceitar · Declinar · Comentar.
- **Identificação** antes de abrir (campos definidos na configuração); o leitor recebe um ID para diferenciar várias pessoas lendo a mesma proposta.

### 4.1 Rastreamento de leitura
- Mede **tempo total** e **tempo por página**.
- Pausa quando a aba fica oculta, retoma quando volta.
- Envia os dados ao sair da página de forma confiável (inclusive em mobile).
- Alimenta: tempo de leitura, leitura completa, taxa de rejeição, média de acessos.

### 4.2 Aceite / recusa / comentário
- **Aceitar:** confirmação + comentário opcional → executa o recurso pós-aceite; opção de recibo ao comprador.
- **Declinar:** escolha de **motivo de perda** + comentário.
- **Comentar:** mensagem livre ao vendedor (gera alerta no dashboard).

### 4.3 Orçamento interativo
- Grupos de itens: **obrigatórios**, **opcionais**, **escolha única**.
- Item: produto/serviço, imagem, preço, **quantidade editável**, total.
- Subtotal por grupo, **total geral**, separação entre **primeiro pagamento** e recorrência.

---

## 5. Modelo de dados (rascunho)

| Entidade | Campos principais |
|---|---|
| Empresa (conta) | nome, logo, plano, limites |
| Usuario | nome, email, celular, cargo, perfil, equipe, status |
| Equipe | nome |
| Contato | empresa, responsavel, email, celular |
| Etiqueta | titulo, cor |
| MotivoPerda | descricao |
| Produto | nome, codigo, categoria, preco, tipo, status |
| Categoria | nome |
| Formulario | titulo_interno, titulo_externo, campos[] |
| RespostaFormulario | formulario, proposta, dados |
| RecursoPosAceite | tipo (whatsapp/url/formulario), titulo, url, mensagem, nova_guia |
| Secao | tipo, titulo_publico, titulo_privado, conteudo (JSON), acao, galeria |
| Pagina | nome, secoes[] (ordem) |
| Modelo | nome, paginas[] (ordem), config padrão |
| Proposta | titulo, contato, valor, expira_em, status, modelo_origem, etiquetas, pos_aceite, identificacao, banner, logos, link_publico |
| Visualizacao | proposta, viewer_id, dados_identificacao, inicio, tempo_total |
| TempoPagina | visualizacao, pagina, segundos |
| Evento | proposta, tipo (criada/aberta/aceita/recusada/comentada/expirada), data, dados |
| Comentario | proposta, autor, texto |
| Webhook / TokenApi | url/eventos · token/escopos |

**Status da proposta:** rascunho → publicada → aberta → aceita / declinada / expirada.

---

## 6. Oportunidades de melhoria (diferenciais do novo sistema)

1. **Mapa de calor** de leitura por seção, não só por página.
2. **Alerta em tempo real** (WhatsApp/push) quando o cliente abre — "lendo agora".
3. **Assinatura eletrônica** com validade jurídica no aceite.
4. **Pagamento no aceite** (Pix/cartão) da primeira parcela.
5. **Negociação na proposta:** cliente ajusta opcionais/quantidades e o vendedor aprova a contraproposta.
6. **IA:** gerar proposta a partir de briefing; sugerir melhor momento de follow-up.
7. **Privacidade/LGPD:** mínimo de rastreadores de terceiros.
8. Editor visual moderno (arrastar e soltar) com tema próprio e gratuito.
