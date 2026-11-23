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
- **Aceite com dados para contrato:** razão social, CNPJ, sócio, e-mail e WhatsApp;
  contrato enviado para assinatura pelo D4Sign ([deploy/D4SIGN.md](deploy/D4SIGN.md)).
- **Editor visual de modelos:** arrastar e soltar blocos, efeitos, seções favoritas reaproveitáveis.
- **Usuários e permissões:** por empresa e por módulo (ver/criar/editar/excluir), com auditoria.

Testar no seu computador: **[TESTE.md](TESTE.md)**.
Implantação no servidor: **[deploy/README.md](deploy/README.md)**.
Segurança (auditoria e checklist): **[SECURITY.md](SECURITY.md)**.
Mapa funcional de referência: [docs/mapa-funcional.md](docs/mapa-funcional.md).

**Continuar com o Claude:** a skill `.claude/skills/modelos-proposta` explica a estrutura
para criar/importar modelos e novos blocos. Numa sessão do Claude Code neste repositório,
peça por exemplo: *“use a skill modelos-proposta e importe este mockup como modelo da KOLP”*.

## Tecnologia

O sistema foi migrado de Next.js para Django; todo o código está em `web/`.

| Camada | Escolha | Por quê |
|---|---|---|
| Aplicação | Django 5.2 (Python 3.13) | Painel, páginas públicas e API num só projeto |
| Banco | PostgreSQL (instalado no Windows) | Migrações versionadas do Django (`python manage.py migrate`) |
| Servidor | waitress (`web/servir.py`) como serviço do Windows | Servidor WSGI estável no Windows, ouvindo só em 127.0.0.1:8000 |
| Proxy | Caddy para Windows | HTTPS automático por domínio; bloqueia o painel nos domínios públicos |

Atualizar = `git pull`, `pip install -r requirements.txt`, `migrate`, `collectstatic` e
reiniciar o serviço (detalhes em [deploy/README.md](deploy/README.md)).

## Conceitos

```
Empresa ─┬─ Produtos (ex.: planos de servidor)
         ├─ Modelos (tipos de solução) ─┬─ campos do formulário   web/propostas/regras/campos.py
         │                              ├─ regras de cálculo      web/propostas/regras/precificacao.py
         │                              └─ seções da proposta     web/propostas/templates/proposta/secoes/
         └─ Propostas ── visualizações, tempo por seção, eventos
```

- **Modelo**: cada tipo de solução tem seu formulário, cálculo e visual. Já vêm prontos
  (JSON em `web/seed/modelos/`, carregados por `python manage.py semear`) — edite pelo editor
  visual ou duplique:
  - **CADDI**: Servidor em nuvem, Gestão e Suporte de TI, Consultoria de TI dedicada, Suporte e TI gerenciada, Backup e segurança de dados, Projeto (valor único, campos preenchíveis).
  - **KOLP**: Site e presença digital, Site por assinatura (SaaS, planos mensais), Plataforma SaaS, Projeto sob medida.
  - **FASE**: Fase Web, Fase Food, Fase Pet, Fase Agro, Fase Clínicas e Fase Agenda
    (ERP por planos mensais fixos, um por segmento), Fase X (automação fiscal por volume de CNPJs) e um modelo base para novos módulos.

  Os modelos da FASE e o CADDI "Gestão e Suporte de TI" e "Site" da KOLP foram montados a partir
  de propostas reais. Os planos (preços) vêm no mesmo JSON do modelo e são escolhidos na hora da
  proposta. Números de "quem somos" são exemplos — ajuste no editor.
- **Blocos**: o catálogo do editor (nome, campos editáveis, conteúdo inicial) fica em
  `web/propostas/blocos.json`; o visual de cada bloco em `web/propostas/templates/proposta/secoes/<tipo>.html`;
  o editor em `web/static/js/editor-modelo.js`.
- **Validação**: tudo que o editor salva é conferido no servidor (`web/propostas/regras/validacao.py`).
- **Textos com variáveis**: `{{cliente}}`, `{{plano.nome}}`, `{{plano.vcpu}}`,
  `{{dispositivos}}`, `{{validade}}`, `{{calc.totalMensal|brl}}`, e `**negrito**`.
- **Proposta congelada**: ao gerar o link, a proposta guarda uma cópia do modelo e
  dos preços, então mudanças futuras não alteram o que já foi enviado.
- **Tema**: cores e logos de cada empresa viram variáveis CSS (`web/nucleo/tema.py`).
- **Multiempresa**: todo dado pertence a uma empresa; usuários podem atuar em mais de
  uma; o campo `super_admin` prepara o uso futuro como produto.

## Estrutura

```
web/
  config/                    settings.py (lê web/.env), urls, wsgi
  nucleo/                    empresas, usuários, login, permissões, segurança, auditoria
  propostas/                 modelos, propostas, cálculo, validação, blocos e templates da proposta
  painel/                    telas do painel (/admin)
  publico/                   proposta pública (/p/<link>), rastreio, aceite, webhook D4Sign
  integracoes/               D4Sign
  seed/                      empresas e modelos iniciais (comando semear)
  static/                    CSS e JS (painel, editor, proposta)
  publico_raiz/empresas/     logos de cada empresa
  servir.py                  servidor de produção (waitress)
deploy/                      Caddyfile e passo a passo de implantação
```
