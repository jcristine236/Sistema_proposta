from django.urls import include, path, re_path

from painel.views import auth, conta, inicio, propostas

urlpatterns = [
    path("", auth.raiz),
    path("login", auth.login),
    path("admin/sair", auth.sair),
    path("admin/empresa-ativa", auth.empresa_ativa),
    path("admin", propostas.inicio),
    path("admin/propostas", propostas.lista),
    path("admin/propostas/nova", propostas.nova),
    path("admin/conta", conta.conta),
    path("admin/sem-permissao", inicio.sem_permissao),
    # Cadastros (clientes, catálogo, empresa, empresas, usuários, auditoria, uploads)
    path("", include("painel.urls_cadastros")),
    # Rotas do menu que entram nas etapas 3 e 4
    re_path(r"^admin/propostas/nova/.+$", inicio.em_construcao("propostas", "Nova proposta")),
    re_path(r"^admin/propostas/.+$", inicio.em_construcao("propostas", "Propostas")),
    re_path(r"^admin/modelos(/.*)?$", inicio.em_construcao("modelos", "Modelos")),
]
