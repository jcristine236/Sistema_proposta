"""Rotas dos cadastros do painel: clientes, catálogo, empresa, empresas, usuários, auditoria e uploads."""

from django.urls import path

from painel.views import auditoria, cadastros, cadastros_uploads, empresa, usuarios

urlpatterns = [
    path("admin/catalogo", cadastros.catalogo),
    path("admin/catalogo/<str:pid>/alternar", cadastros.alternar_produto),
    path("admin/catalogo/<str:pid>/excluir", cadastros.excluir_produto),
    path("admin/contatos", cadastros.contatos),
    path("admin/contatos/<str:cid>/excluir", cadastros.excluir_contato),
    path("admin/empresa", empresa.empresa),
    path("admin/empresas", empresa.empresas),
    path("admin/empresas/<str:eid>/alternar", empresa.alternar_empresa),
    path("admin/usuarios", usuarios.usuarios),
    path("admin/usuarios/salvar", usuarios.salvar),
    path("admin/usuarios/<str:uid>", usuarios.usuario),
    path("admin/usuarios/<str:uid>/redefinir-senha", usuarios.redefinir_senha),
    path("admin/usuarios/<str:uid>/excluir", usuarios.excluir),
    path("admin/auditoria", auditoria.auditoria),
    path("api/uploads", cadastros_uploads.uploads),
]
