"""Modelos de proposta e seções modelo (src/app/admin/modelos/** e acoes.ts).

As server actions do Next viram POST comum que redireciona; o editor (JS) fala com
os endpoints JSON no fim do arquivo.
"""

from django.db.models import Count
from django.shortcuts import redirect, render
from django.utils import timezone
from django.views.decorators.http import require_POST

from nucleo.auditoria import auditar
from nucleo.auth import exige_sessao
from nucleo.permissoes import pode
from propostas import blocos
from propostas.models import Modelo, SecaoModelo


def _auditar(request, acao, entidade, entidade_id, descricao=None):
    auditar(request, usuario=request.usuario, empresa_id=request.empresa.pk, acao=acao, entidade=entidade,
            entidade_id=entidade_id, descricao=descricao)


# ---- Lista ------------------------------------------------------------------------

@exige_sessao("modelos")
def lista(request):
    aba = "secoes" if request.GET.get("aba") == "secoes" else "modelos"
    u = request.usuario
    modelos = (Modelo.objects.filter(empresa=request.empresa).annotate(n_propostas=Count("propostas"))
               .order_by("-ativo", "nome"))
    secoes = SecaoModelo.objects.filter(empresa=request.empresa).order_by("nome")
    return render(request, "painel/modelos/lista.html", {
        "aba": aba,
        "modelos": modelos,
        "secoes": [{"s": s, "tipo": blocos.NOMES.get((s.secao or {}).get("tipo"), (s.secao or {}).get("tipo"))}
                   for s in secoes],
        "n_secoes": len(secoes),
        "blocos_novos": [b for b in blocos.CATALOGO["blocos"] if b["tipo"] != "capa"],
        "criar": pode(u, "modelos", "criar"),
        "editar": pode(u, "modelos", "editar"),
        "excluir": pode(u, "modelos", "excluir"),
        "usar": pode(u, "propostas", "criar"),
    })


@exige_sessao("modelos")
def abrir(request, modelo_id):
    return redirect(f"/admin/modelos/{modelo_id}/editar")


# ---- Ações de modelo -------------------------------------------------------------

@require_POST
@exige_sessao("modelos", "criar")
def criar_em_branco(request):
    m = Modelo.objects.create(
        empresa=request.empresa, nome="Novo modelo", tipo_solucao="personalizado",
        campos=[{"id": "cliente", "tipo": "contato", "rotulo": "Nome do cliente", "obrigatorio": True},
                {"id": "validade", "tipo": "data", "rotulo": "Proposta válida até", "padraoDias": 15}],
        secoes=[blocos.padrao("capa"), blocos.padrao("fechamento")],
        precificacao={},
    )
    _auditar(request, "CRIAR", "Modelo", m.pk, "Novo modelo")
    return redirect(f"/admin/modelos/{m.pk}/editar")


@require_POST
@exige_sessao("modelos", "criar")
def duplicar(request, modelo_id):
    m = Modelo.objects.filter(pk=modelo_id, empresa=request.empresa).first()
    if m is None:
        return redirect("/admin/modelos")
    novo = Modelo.objects.create(
        empresa=request.empresa, nome=f"{m.nome} (cópia)", descricao=m.descricao, tipo_solucao=m.tipo_solucao,
        validade_dias=m.validade_dias, campos=m.campos, secoes=m.secoes, precificacao=m.precificacao,
    )
    _auditar(request, "CRIAR", "Modelo", novo.pk, f"Cópia de {m.nome}")
    return redirect(f"/admin/modelos/{novo.pk}/editar")


@require_POST
@exige_sessao("modelos", "editar")
def alternar(request, modelo_id):
    m = Modelo.objects.filter(pk=modelo_id, empresa=request.empresa).first()
    if m is not None:
        Modelo.objects.filter(pk=m.pk).update(ativo=not m.ativo, atualizado_em=timezone.now())
        _auditar(request, "DESATIVAR" if m.ativo else "ATIVAR", "Modelo", m.pk, m.nome)
    return redirect("/admin/modelos")


@require_POST
@exige_sessao("modelos", "excluir")
def excluir(request, modelo_id):
    m = Modelo.objects.filter(pk=modelo_id, empresa=request.empresa).first()
    if m is not None:
        # Propostas já enviadas continuam funcionando: guardam cópia do modelo (snapshot)
        pk, nome = m.pk, m.nome
        m.delete()
        _auditar(request, "EXCLUIR", "Modelo", pk, nome)
    return redirect("/admin/modelos")


# ---- Ações de seção modelo --------------------------------------------------------

@require_POST
@exige_sessao("modelos", "criar")
def criar_secao(request, tipo):
    tipo = tipo if tipo in blocos.BLOCO else "texto"
    sec = SecaoModelo.objects.create(empresa=request.empresa, nome=blocos.NOMES[tipo], secao=blocos.padrao(tipo))
    return redirect(f"/admin/modelos/secoes/{sec.pk}")


@require_POST
@exige_sessao("modelos", "editar")
def renomear_secao(request, secao_id):
    nome = str(request.POST.get("nome", "")).strip()[:120]
    if nome:
        SecaoModelo.objects.filter(pk=secao_id, empresa=request.empresa).update(nome=nome, atualizado_em=timezone.now())
    return redirect("/admin/modelos?aba=secoes")


@require_POST
@exige_sessao("modelos", "excluir")
def excluir_secao(request, secao_id):
    apagados, _ = SecaoModelo.objects.filter(pk=secao_id, empresa=request.empresa).delete()
    if apagados:
        _auditar(request, "EXCLUIR", "SecaoModelo", secao_id)
    return redirect("/admin/modelos?aba=secoes")
