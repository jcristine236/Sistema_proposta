from django.urls import path, re_path

from painel.views import auth, conta, inicio

urlpatterns = [
    path("", auth.raiz),
    path("login", auth.login),
    path("admin/sair", auth.sair),
    path("admin/empresa-ativa", auth.empresa_ativa),
    path("admin", inicio.inicio),
    path("admin/conta", conta.conta),
    path("admin/sem-permissao", inicio.sem_permissao),
    # Rotas do menu que entram nas etapas 3 e 4
    re_path(r"^admin/propostas/nova(/.*)?$", inicio.em_construcao("propostas", "Nova proposta")),
    re_path(r"^admin/propostas(/.*)?$", inicio.em_construcao("propostas", "Propostas")),
    re_path(r"^admin/modelos(/.*)?$", inicio.em_construcao("modelos", "Modelos")),
    re_path(r"^admin/catalogo(/.*)?$", inicio.em_construcao("catalogo", "Produtos e planos")),
    re_path(r"^admin/contatos(/.*)?$", inicio.em_construcao("clientes", "Clientes")),
    re_path(r"^admin/empresas(/.*)?$", inicio.em_construcao("empresa", "Empresas")),
    re_path(r"^admin/empresa(/.*)?$", inicio.em_construcao("empresa", "Empresa e marca")),
    re_path(r"^admin/usuarios(/.*)?$", inicio.em_construcao("usuarios", "Usuários")),
    re_path(r"^admin/auditoria(/.*)?$", inicio.em_construcao("auditoria", "Auditoria")),
]
