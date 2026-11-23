"""Auditoria: últimos 300 registros (src/app/admin/auditoria/page.tsx)."""

from django.db.models import Q
from django.shortcuts import render

from nucleo.auth import exige_sessao
from nucleo.models import LogAuditoria, Membro

ACOES = {
    "LOGIN": "Entrou", "LOGOUT": "Saiu", "LOGIN_FALHOU": "Login incorreto", "LOGIN_BLOQUEADO": "Bloqueado por tentativas",
    "CRIAR": "Criou", "EDITAR": "Editou", "EXCLUIR": "Excluiu", "ATIVAR": "Ativou", "DESATIVAR": "Desativou",
    "TROCAR_SENHA": "Trocou a senha", "REDEFINIR_SENHA": "Redefiniu senha",
}


@exige_sessao("auditoria")
def auditoria(request):
    acao = request.GET.get("acao")
    filtro = Q()
    if not request.usuario.super_admin:
        ids = [e.id for e in request.empresas]
        membros = Membro.objects.filter(empresa_id__in=ids).values("usuario_id")
        filtro = Q(empresa_id__in=ids) | Q(empresa_id__isnull=True, usuario_id__in=membros)
    if acao and acao in ACOES:
        filtro &= Q(acao=acao)
    logs = list(LogAuditoria.objects.filter(filtro).select_related("usuario").order_by("-criado_em")[:300])
    for log in logs:
        log.rotulo = ACOES.get(log.acao, log.acao)
        log.classe = "RECUSADA" if log.acao.startswith("LOGIN_") or log.acao == "EXCLUIR" else ""
    return render(request, "painel/cadastros/auditoria.html", {
        "logs": logs,
        "acao": acao or "",
        "opcoes": ACOES.items(),
    })
