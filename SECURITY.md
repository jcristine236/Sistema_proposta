# Segurança — relatório de auditoria e checklist de produção

A primeira parte descreve as proteções da aplicação (Django); a segunda é o
checklist da infraestrutura (servidor Windows); a terceira lista os riscos conhecidos e aceitos.

> **Pontos conferidos na versão Django:**
> - **Sem SQL injection:** todo acesso ao banco passa pelo ORM do Django, com parâmetros.
>   As duas únicas consultas SQL escritas à mão (limite de tentativas e numeração das
>   propostas) usam parâmetros, sem montar texto com dados do usuário.
> - **Sem HTML perigoso:** os templates escapam tudo por padrão; o HTML marcado como seguro
>   vem só de código do projeto (ícones SVG, `**negrito**` já escapado). No editor e no painel
>   o JS monta os elementos sem injetar texto do usuário como HTML.
> - **Âncora dos planos:** o link do botão é saneado para `#` + apenas letras, números e hífen.
> - **Cabeçalhos:** CSP com *nonce* novo a cada requisição, `X-Frame-Options: DENY`, `nosniff`,
>   `Referrer-Policy`, `Permissions-Policy`, `COOP` e HSTS (`nucleo/seguranca.py`).
> - **Aceite:** validação no servidor com limites de tamanho, limite de 20 envios por IP a cada
>   10 min, e validação de CNPJ, e-mail e WhatsApp.
> - **Testes automáticos** de segurança em `nucleo/tests/test_seguranca.py`
>   (`python manage.py test`).

## 1. Proteções na aplicação

### Acesso e sessão
| Item | Como está |
|---|---|
| Senhas | hash PBKDF2 do Django; mínimo 10 caracteres, letras e números; nova senha diferente da atual |
| Primeiro acesso | o administrador inicial e usuários criados pelo painel **trocam a senha no primeiro login** |
| Força bruta | 5 erros bloqueiam a conta por 15 min; limite de 20 tentativas por IP e 8 por e-mail a cada 15 min (gravado no banco) |
| Enumeração de contas | mesma mensagem e mesmo tempo de resposta para e-mail inexistente ou senha errada |
| Sessão | sessão do Django no banco, cookie `pp_sessao` `HttpOnly`, `SameSite=Lax`, `Secure` (HTTPS), validade de 12 h |
| Revogação | trocar senha, redefinir senha, desativar usuário ou sair **invalida todas as sessões** do usuário |
| Permissões | por módulo e ação (ver/criar/editar/excluir) e por empresa; checadas **no servidor** em cada página e ação, não só no menu |
| Escalada de privilégio | quem não é superadmin só concede permissões e empresas que ele mesmo tem; não altera superadmins |
| Isolamento entre empresas | toda consulta filtra pela empresa ativa; vendedor sem “propostas de todos” só vê as próprias |

### Páginas e API
| Item | Como está |
|---|---|
| Cabeçalhos | CSP com *nonce* por requisição (bloqueia scripts injetados), HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `COOP` |
| CSRF | todo formulário e chamada do painel leva o token CSRF do Django; cookies `SameSite=Lax`. As rotas públicas sem login (rastreio, aceite, webhook D4Sign) dispensam o token e se protegem por limite por IP, validação e (no webhook) token secreto |
| XSS | o conteúdo dos modelos é estruturado (sem HTML livre); textos são escapados; só `**negrito**` e `{{variáveis}}` |
| Links e mídia | imagens só de `/uploads`, `/empresas` ou `https`; vídeos só YouTube/Vimeo (player sem cookies); botões só `http(s)`, `mailto:`, `tel:` |
| Validação | todo dado de modelo, seção, campo, proposta e aceite é validado no servidor (formato, tamanho, profundidade) |
| Uploads | só PNG/JPG/WebP/GIF conferidos pelos bytes (não pela extensão), até 5 MB, 60 por hora por usuário, nome aleatório, servidos com `nosniff` e CSP `sandbox` |
| Links públicos | identificador aleatório + domínio da empresa: a proposta só abre no domínio dela (`ALLOW_ANY_HOST=false`) |
| Rotas públicas | rastreio e aceite com limite por IP e tamanho máximo de corpo; aceite valida CNPJ, e-mail e WhatsApp |
| Webhook D4Sign | exige `?token=` igual a `D4SIGN_WEBHOOK_TOKEN` (comparação em tempo constante) |
| Painel nos domínios públicos | bloqueado no Caddy (`/admin`, `/login`, `/api/uploads` respondem 404 em `propostas.*`) |
| Erros | com `DEBUG=false` o Django mostra só uma página de erro genérica, sem detalhes técnicos |
| Auditoria | logins (inclusive falhos e bloqueios), criação, edição e exclusão ficam registrados com usuário, data e IP (tela Auditoria) |

### Servidor
- O Django (waitress) escuta só em `127.0.0.1:8000`; o PostgreSQL só em `localhost`.
- `DEBUG` é a chave de ambiente: com `DEBUG=false`, `ALLOW_ANY_HOST` e `MODO_HTTP` são ignorados, a `SECRET_KEY` precisa ter 32+ caracteres e o webhook do D4Sign exige token. O `servir.py` se recusa a subir com `DEBUG=true`.
- Não existe o `/admin` padrão do Django (`django.contrib.admin` não está instalado). Todo o `/admin/...` é o painel próprio e exige login; só ficam abertos a proposta pública (`/p/...`), suas imagens, o rastreio, o aceite/recusa do cliente, o webhook do D4Sign e a tela de login (teste `painel/tests/test_rotas_anonimas.py`).
- Apenas o Caddy publica as portas 80/443; HTTPS automático; cabeçalho `Server` removido; corpo de requisição limitado a 10 MB.
- Segredos só no `.env` (fora do Git), com acesso restrito a administradores.

## 2. Checklist da infraestrutura (antes de ir ao ar)

- [ ] `.env` com `SECRET_KEY` e senha do banco **gerados aleatoriamente**; permissão restrita (`icacls`, ver deploy/README.md)
- [ ] `DEBUG=false`, `MODO_HTTP=false`, `ALLOW_ANY_HOST=false`, `PUBLIC_BASE_URL` vazio, `ATRAS_DE_PROXY=true`
- [ ] `SEED_ADMIN_PASSWORD` forte (o `semear` recusa senha fraca em produção); trocar no primeiro login
- [ ] Firewall do Windows: liberar só 80/443 (e RDP restrito por IP/VPN); nada de 5432 ou 8000 expostos
- [ ] RDP com senha forte (ou só por VPN), Windows Update automático ligado
- [ ] Painel (`painel.caddi.com.br`) preferencialmente restrito por VPN ou lista de IPs do escritório (no Caddy: `@fora not remote_ip 1.2.3.4/32` → `respond @fora 403`)
- [ ] Backup diário do banco (`pg_dump`) **e** da pasta `UPLOAD_DIR`, guardado fora do servidor, com teste de restauração
- [ ] SMTP com usuário próprio e senha de aplicativo; registros SPF/DKIM do domínio remetente
- [ ] WhatsApp e D4Sign: tokens/chaves apenas no `.env`
- [ ] Monitorar os logs dos serviços (`C:\propostas\logs\app.log` do waitress e `caddy.log`); revisar a tela Auditoria periodicamente
- [ ] Atualizar a plataforma regularmente (deploy/README.md, seção 7) e conferir dependências com
      `pip list --outdated` e `pip-audit` (`pip install pip-audit`, rodar dentro do `.venv`)

## 3. Riscos conhecidos e aceitos

| Risco | Situação | Mitigação |
|---|---|---|
| Imagens externas (`https://`) nos modelos | O navegador do cliente busca a imagem no servidor externo | Preferir enviar as imagens para o sistema (`/uploads`) |
| Avisos sem SMTP/WhatsApp configurados | Conteúdo do aviso vai para o log do serviço (contém dados do cliente) | Configurar SMTP e WhatsApp em produção; proteger acesso aos logs |
| Logo em SVG por upload | Não aceito (SVG pode conter script) | Logos SVG oficiais ficam em `publico_raiz/empresas/` (arquivos revisados) |
| `style-src 'unsafe-inline'` na CSP | Necessário para cores do tema e estilos dos blocos | Scripts continuam exigindo *nonce*; conteúdo dos modelos não aceita HTML |
