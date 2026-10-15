# Segurança — relatório de auditoria e checklist de produção

Revisão feita antes da implantação na nuvem privada. A primeira parte descreve
as proteções da aplicação; a segunda é o checklist da infraestrutura;
a terceira lista os riscos conhecidos e aceitos.

## 1. Proteções na aplicação

### Acesso e sessão
| Item | Como está |
|---|---|
| Senhas | bcrypt (custo 12); mínimo 10 caracteres, letras e números; nova senha diferente da atual |
| Primeiro acesso | o administrador inicial e usuários criados pelo painel **trocam a senha no primeiro login** |
| Força bruta | 5 erros bloqueiam a conta por 15 min; limite de 20 tentativas por IP e 8 por e-mail a cada 15 min |
| Enumeração de contas | mesma mensagem e mesmo tempo de resposta para e-mail inexistente ou senha errada |
| Sessão | cookie `HttpOnly`, `SameSite=Lax`, `Secure` (HTTPS), assinado (HS256), validade de 12 h |
| Revogação | trocar senha, redefinir senha, desativar usuário ou sair **invalida todas as sessões** do usuário |
| Permissões | por módulo e ação (ver/criar/editar/excluir) e por empresa; checadas **no servidor** em cada página e ação, não só no menu |
| Escalada de privilégio | quem não é superadmin só concede permissões e empresas que ele mesmo tem; não altera superadmins |
| Isolamento entre empresas | toda consulta filtra pela empresa ativa; vendedor sem “propostas de todos” só vê as próprias |

### Páginas e API
| Item | Como está |
|---|---|
| Cabeçalhos | CSP com *nonce* (bloqueia scripts injetados), HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `COOP` |
| CSRF | ações do painel usam Server Actions (checagem de origem do Next.js) + cookie `SameSite=Lax` |
| XSS | o conteúdo dos modelos é estruturado (sem HTML livre); textos são escapados; só `**negrito**` e `{{variáveis}}` |
| Links e mídia | imagens só de `/uploads`, `/empresas` ou `https`; vídeos só YouTube/Vimeo (player sem cookies); botões só `http(s)`, `mailto:`, `tel:` |
| Validação | todo dado de modelo, seção, campo, proposta e aceite é validado no servidor (formato, tamanho, profundidade) |
| Uploads | só PNG/JPG/WebP/GIF conferidos pelos bytes (não pela extensão), até 5 MB, nome aleatório, servidos com `nosniff` e CSP `sandbox` |
| Links públicos | identificador aleatório de 48 bits + domínio da empresa: a proposta só abre no domínio dela |
| Rotas públicas | rastreio e aceite com limite por IP e tamanho máximo de corpo; aceite valida CNPJ, e-mail e WhatsApp |
| Painel nos domínios públicos | bloqueado no proxy (`/admin`, `/login`, `/api/uploads` respondem 404 em `propostas.*`) |
| Erros | em produção o Next.js não mostra detalhes técnicos ao usuário |
| Auditoria | logins (inclusive falhos e bloqueios), criação, edição e exclusão ficam registrados com usuário, data e IP (tela Auditoria) |

### Contêineres
- Aplicação roda como usuário **sem privilégios**, sistema de arquivos **somente leitura**, `no-new-privileges`.
- Banco **não exposto** à rede externa (apenas a rede interna do Docker).
- Apenas o proxy (Caddy) publica as portas 80/443; HTTPS automático; cabeçalho `Server` removido; corpo de requisição limitado a 10 MB.
- Imagens enviadas ficam no volume `dados-uploads`; banco no volume `dados-db`.

## 2. Checklist da infraestrutura (antes de ir ao ar)

- [ ] `.env` com `DB_PASSWORD` e `SESSION_SECRET` **gerados aleatoriamente** (`openssl rand -base64 48`), permissão `chmod 600 .env`
- [ ] `SEED_ADMIN_PASSWORD` forte (o seed recusa senha fraca em produção); trocar no primeiro login
- [ ] `ALLOW_ANY_HOST=false`, `MODO_HTTP` **ausente**, `PUBLIC_BASE_URL` vazio
- [ ] Firewall: liberar só 80/443 (e SSH restrito por IP/VPN); nada de 5432 ou 3000 expostos
- [ ] SSH só com chave, sem login de root por senha; atualizações automáticas de segurança do sistema
- [ ] Painel (`painel.caddi.com.br`) preferencialmente restrito por VPN ou lista de IPs do escritório (no Caddy: `@fora not remote_ip 1.2.3.4/32` → `respond @fora 403`)
- [ ] Backup diário do banco **e** do volume de uploads, guardado fora do servidor, com teste de restauração
- [ ] SMTP com usuário próprio e senha de aplicativo; registros SPF/DKIM do domínio remetente
- [ ] WhatsApp: token/chave do provedor apenas no `.env`
- [ ] Monitorar `docker compose logs` (ou enviar para a ferramenta de logs da nuvem); revisar a tela Auditoria periodicamente
- [ ] Atualizar a plataforma regularmente (`git pull && docker compose up -d --build`) e rodar `npm audit`

## 3. Riscos conhecidos e aceitos

| Risco | Situação | Mitigação |
|---|---|---|
| Alertas do `npm audit` em `postcss` (dentro do Next.js 15) e `@prisma/config` (`deepmerge-ts`) | Afetam ferramentas usadas **apenas na compilação**, com arquivos do próprio projeto; não rodam com dados de usuários | Planejar atualização para Next.js 16 / Prisma 7 numa próxima versão |
| Limite de tentativas em memória | Vale por instância; com mais de um contêiner da aplicação o limite fica por instância | Bloqueio por conta é gravado no banco e vale para todas |
| Imagens externas (`https://`) nos modelos | O navegador do cliente busca a imagem no servidor externo | Preferir enviar as imagens para o sistema (`/uploads`) |
| Avisos sem SMTP/WhatsApp configurados | Conteúdo do aviso vai para o log do contêiner (contém dados do cliente) | Configurar SMTP e WhatsApp em produção; proteger acesso aos logs |
| Logo em SVG por upload | Não aceito (SVG pode conter script) | Logos SVG oficiais ficam em `public/empresas/` (arquivos revisados) |
