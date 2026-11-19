"""Tela de preenchimento da proposta (nova, duplicar, editar) e seus endpoints JSON.

O formulário é desenhado pelo static/js/formulario-proposta.js (port do FormularioProposta
e do CamposFormulario). O cálculo e a prévia vêm do servidor (mesmas regras e templates da
página pública), então não há lógica de preço duplicada em JavaScript.
"""

import json

from django.http import Http404, JsonResponse
from django.shortcuts import redirect, render
from django.template.loader import render_to_string
from django.views.decorators.http import require_POST

from nucleo.auth import exige_acao, exige_sessao, filtro_propostas
from nucleo.tema import FONTES_URL, tema_de
from propostas.models import Contato, Modelo, Proposta, StatusProposta
from propostas.regras.campos import valores_padrao
from propostas.regras.contexto import montar_contexto
from propostas.regras.precificacao import catalogo_do_modelo
from propostas.render.secoes import renderizar_proposta
from propostas.servicos import catalogo_da_empresa, criar_proposta, editar_proposta


def _empresa_ctx(e) -> dict:
    return {"nome": e.razao_social or e.nome, "site": e.site, "rodape": e.rodape}


def _tela(request, *, campos, secoes, precificacao, nome_modelo, dados, url_salvar, editar=None, chave=None):
    empresa = request.empresa
    catalogo = catalogo_do_modelo(campos, catalogo_da_empresa(empresa))
    ctx = montar_contexto(campos, precificacao, dados, catalogo, _empresa_ctx(empresa))
    contatos = list(Contato.objects.filter(empresa=empresa, ativo=True).order_by("organizacao").values("id", "organizacao"))
    config = {
        "campos": campos, "catalogo": catalogo, "contatos": contatos, "dados": dados,
        "urlSalvar": url_salvar, "urlCalculo": "/admin/propostas/calculo", "urlPrevia": "/admin/propostas/previa",
        "chave": chave, "editar": editar,
    }
    return render(request, "painel/propostas/formulario.html", {
        "titulo": f"Editar proposta {editar['codigo']}" if editar else f"Nova proposta · {nome_modelo}",
        "botao": "Salvar alterações" if editar else "Gerar link da proposta",
        "calc": ctx["calc"],
        "config": config,
        "fontes": FONTES_URL,
    })


@exige_sessao("propostas", "criar")
def nova(request, modelo_id):
    modelo = Modelo.objects.filter(pk=modelo_id, empresa=request.empresa, ativo=True).first()
    if modelo is None:
        raise Http404
    dados = valores_padrao(modelo.campos)
    # Duplicar: reaproveita os dados de outra proposta (exceto a validade, que recomeça)
    de = request.GET.get("de")
    if de:
        origem = Proposta.objects.filter(filtro_propostas(request), pk=de).first()
        if origem:
            iniciais = dict(origem.dados or {})
            for c in modelo.campos:
                if c["tipo"] == "data":
                    iniciais.pop(c["id"], None)
            dados = {**dados, **iniciais}
    return _tela(request, campos=modelo.campos, secoes=modelo.secoes, precificacao=modelo.precificacao,
                 nome_modelo=modelo.nome, dados=dados, url_salvar=f"/admin/propostas/nova/{modelo.pk}/criar",
                 chave={"modelo": modelo.pk})


@exige_sessao("propostas", "editar")
def editar(request, proposta_id):
    p = Proposta.objects.filter(filtro_propostas(request), pk=proposta_id).first()
    if p is None:
        raise Http404
    if p.status == StatusProposta.ACEITA:
        return redirect(f"/admin/propostas/{p.pk}")
    snap = p.snapshot or {}
    campos = snap.get("campos") or []
    dados = {**valores_padrao(campos), **(p.dados or {})}
    return _tela(request, campos=campos, secoes=snap.get("secoes") or [], precificacao=snap.get("precificacao") or {},
                 nome_modelo=snap.get("modeloNome") or "Proposta", dados=dados,
                 url_salvar=f"/admin/propostas/{p.pk}/editar", editar={"id": p.pk, "codigo": p.codigo},
                 chave={"proposta": p.pk})


def _corpo(request) -> dict:
    try:
        corpo = json.loads(request.body or b"{}")
    except (ValueError, RecursionError):
        return {}
    return corpo if isinstance(corpo, dict) else {}


def _definicao(request, chave: dict):
    """Campos/seções/precificação do modelo (nova) ou do snapshot (edição)."""
    if chave.get("proposta"):
        p = Proposta.objects.filter(filtro_propostas(request), pk=str(chave["proposta"])).first()
        if p:
            snap = p.snapshot or {}
            return snap.get("campos") or [], snap.get("secoes") or [], snap.get("precificacao") or {}
    elif chave.get("modelo"):
        m = Modelo.objects.filter(pk=str(chave["modelo"]), empresa=request.empresa).first()
        if m:
            return m.campos, m.secoes, m.precificacao
    return None


def _contexto(request, corpo):
    chave = corpo.get("chave")
    d = _definicao(request, chave if isinstance(chave, dict) else {})
    if d is None:
        return None, None
    campos, secoes, precificacao = d
    dados = corpo.get("dados") if isinstance(corpo.get("dados"), dict) else {}
    catalogo = catalogo_do_modelo(campos, catalogo_da_empresa(request.empresa))
    return montar_contexto(campos, precificacao, dados, catalogo, _empresa_ctx(request.empresa)), secoes


@require_POST
@exige_acao("propostas", "ver")
def calculo(request):
    ctx, _ = _contexto(request, _corpo(request))
    if ctx is None:
        return JsonResponse({"erro": "Modelo não encontrado."}, status=404)
    return JsonResponse({"resumo": render_to_string("painel/propostas/_resumo.html", {"calc": ctx["calc"]}),
                         "pct": ctx["calc"]["desconto"]["pct"]})


@require_POST
@exige_acao("propostas", "ver")
def previa(request):
    ctx, secoes = _contexto(request, _corpo(request))
    if ctx is None:
        return JsonResponse({"erro": "Modelo não encontrado."}, status=404)
    html = renderizar_proposta(secoes, ctx, tema_de(request.empresa.tema), modo="previa",
                               aviso_previa=f"Prévia · link final em {request.empresa.dominio_propostas}")
    return JsonResponse({"html": html})


@require_POST
@exige_acao("propostas", "criar")
def criar(request, modelo_id):
    modelo = Modelo.objects.filter(pk=modelo_id, empresa=request.empresa, ativo=True).first()
    if modelo is None:
        return JsonResponse({"erros": ["Modelo não encontrado nesta empresa."]})
    dados = _corpo(request).get("dados")
    return JsonResponse(criar_proposta(request, modelo, dados if isinstance(dados, dict) else {}))


@require_POST
@exige_acao("propostas", "editar")
def salvar_edicao(request, proposta_id):
    p = Proposta.objects.filter(filtro_propostas(request), pk=proposta_id).first()
    if p is None:
        return JsonResponse({"erros": ["Proposta não encontrada."]})
    dados = _corpo(request).get("dados")
    return JsonResponse(editar_proposta(request, p, dados if isinstance(dados, dict) else {}))


def editar_rota(request, proposta_id):
    """GET abre a tela de edição; POST (JSON) salva."""
    if request.method == "POST":
        return salvar_edicao(request, proposta_id)
    return editar(request, proposta_id)
