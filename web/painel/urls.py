from django.urls import include, path

from painel.views import auth, conta, inicio, modelos, proposta_detalhe, proposta_form, propostas

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
    # Modelos e seções modelo
    path("admin/modelos", modelos.lista),
    path("admin/modelos/novo", modelos.criar_em_branco),
    path("admin/modelos/secoes/nova/<str:tipo>", modelos.criar_secao),
    path("admin/modelos/secoes/<str:secao_id>/renomear", modelos.renomear_secao),
    path("admin/modelos/secoes/<str:secao_id>/excluir", modelos.excluir_secao),
    path("admin/modelos/<str:modelo_id>", modelos.abrir),
    path("admin/modelos/<str:modelo_id>/duplicar", modelos.duplicar),
    path("admin/modelos/<str:modelo_id>/alternar", modelos.alternar),
    path("admin/modelos/<str:modelo_id>/excluir", modelos.excluir),
]
