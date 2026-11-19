"""Rotas dos cadastros do painel (etapa 3, frente "cadastros")."""

from django.urls import re_path

from painel.views import inicio

urlpatterns = [
    re_path(r"^admin/catalogo(/.*)?$", inicio.em_construcao("catalogo", "Produtos e planos")),
    re_path(r"^admin/contatos(/.*)?$", inicio.em_construcao("clientes", "Clientes")),
    re_path(r"^admin/empresas(/.*)?$", inicio.em_construcao("empresa", "Empresas")),
    re_path(r"^admin/empresa(/.*)?$", inicio.em_construcao("empresa", "Empresa e marca")),
    re_path(r"^admin/usuarios(/.*)?$", inicio.em_construcao("usuarios", "Usuários")),
    re_path(r"^admin/auditoria(/.*)?$", inicio.em_construcao("auditoria", "Auditoria")),
]
