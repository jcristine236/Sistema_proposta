from django.urls import include, path, re_path

from painel.views import auth, conta, inicio, proposta_detalhe, proposta_form, propostas

urlpatterns = [
    path("", auth.raiz),
    path("login", auth.login),
    path("admin/sair", auth.sair),
    path("admin/empresa-ativa", auth.empresa_ativa),
    path("admin", propostas.inicio),
    path("admin/propostas", propostas.lista),
    path("admin/propostas/nova", propostas.nova),
    path("admin/propostas/nova/<str:modelo_id>", proposta_form.nova),
    path("admin/propostas/nova/<str:modelo_id>/criar", proposta_form.criar),
    path("admin/propostas/calculo", proposta_form.calculo),
    path("admin/propostas/previa", proposta_form.previa),
    path("admin/propostas/<str:proposta_id>/editar", proposta_form.editar_rota),
    path("admin/propostas/<str:proposta_id>", proposta_detalhe.detalhe),
    path("admin/propostas/<str:proposta_id>/excluir", proposta_detalhe.excluir),
    path("admin/propostas/<str:proposta_id>/contrato", proposta_detalhe.gerar_contrato),
    path("admin/conta", conta.conta),
    path("admin/sem-permissao", inicio.sem_permissao),
    # Cadastros (clientes, catálogo, empresa, empresas, usuários, auditoria, uploads)
    path("", include("painel.urls_cadastros")),
    # Rotas do menu que entram nas etapas 3 e 4
    re_path(r"^admin/modelos(/.*)?$", inicio.em_construcao("modelos", "Modelos")),
]
