"""Modelos de proposta e seções modelo (src/app/admin/modelos/** e acoes.ts).

As server actions do Next viram POST comum que redireciona; o editor (JS) fala com
os endpoints JSON no fim do arquivo.
"""

import json
import logging
import math

from django.db.models import Count
from django.http import Http404, JsonResponse
from django.shortcuts import redirect, render
from django.utils import timezone
from django.views.decorators.http import require_POST

from nucleo.auditoria import auditar
from nucleo.auth import exige_acao, exige_sessao
from nucleo.permissoes import pode
from nucleo.tema import FONTES_URL, tema_de
from propostas import blocos
from propostas.models import Modelo, SecaoModelo
from propostas.regras.campos import valores_padrao
from propostas.regras.contexto import montar_contexto
from propostas.regras.js import js_number, js_round, js_string
from propostas.regras.validacao import (
    conferir_valores, limpar_urls, tamanho_ok, validar_campos, validar_precificacao, validar_secao, validar_secoes,
)
from propostas.render.secoes import renderizar_bloco, renderizar_proposta
from propostas.servicos import catalogo_da_empresa
from propostas.templatetags.proposta import ICONES

log = logging.getLogger(__name__)


def _js_texto(v) -> str:
    """`String(v ?? "")`."""
    return "" if v is None else js_string(v)


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


# ---- Editor (tela + JSON) ---------------------------------------------------------

def _corpo(request) -> dict:
    try:
        # Inteiros gigantes viram inf (como no JSON.parse do JS) em vez de estourar float() depois
        corpo = json.loads(request.body or b"{}", parse_int=lambda t: int(t) if len(t) < 300 else float(t))
    except (ValueError, RecursionError):
        return {}
    return corpo if isinstance(corpo, dict) else {}


def _tela_editor(request, *, modo, inicial, favoritas, secao_id=None, url_salvar):
    return render(request, "painel/modelos/editor.html", {
        "fontes": FONTES_URL,
        "config": {
            "modo": modo, "inicial": inicial, "favoritas": favoritas, "secaoModeloId": secao_id,
            "podeEditar": pode(request.usuario, "modelos", "editar"),
            "urlSalvar": url_salvar, "urlRender": "/admin/modelos/render", "urlFavorita": "/admin/modelos/secoes/favorita",
            "blocos": blocos.CATALOGO, "icones": ICONES,
        },
    })


@exige_sessao("modelos")
def _editor_get(request, modelo_id):
    m = Modelo.objects.filter(pk=modelo_id, empresa=request.empresa).first()
    if m is None:
        raise Http404
    favoritas = [{"id": f.pk, "nome": f.nome, "secao": f.secao}
                 for f in SecaoModelo.objects.filter(empresa=request.empresa).order_by("nome")]
    inicial = {"id": m.pk, "nome": m.nome, "descricao": m.descricao or "", "tipoSolucao": m.tipo_solucao,
               "validadeDias": m.validade_dias, "campos": m.campos, "secoes": m.secoes, "precificacao": m.precificacao}
    return _tela_editor(request, modo="modelo", inicial=inicial, favoritas=favoritas,
                        url_salvar=f"/admin/modelos/{m.pk}/editar")


@exige_acao("modelos", "editar")
def _editor_post(request, modelo_id):
    """salvarModeloEditor do Next (o editor sempre salva um modelo que já existe)."""
    m = _corpo(request).get("modelo")
    m = m if isinstance(m, dict) else {}
    nome = _js_texto(m.get("nome")).strip()[:120]
    if not nome:
        return JsonResponse({"erro": "Dê um nome ao modelo."})
    campos = validar_campos(m.get("campos"))
    if "erro" in campos:
        return JsonResponse(campos)
    secoes = validar_secoes(m.get("secoes"))
    if "erro" in secoes:
        return JsonResponse(secoes)
    prec = validar_precificacao(m.get("precificacao"), campos["ok"])
    if "erro" in prec:
        return JsonResponse(prec)
    if not tamanho_ok(campos["ok"], secoes["ok"], prec["ok"]):
        return JsonResponse({"erro": "Modelo grande demais."})
    dias = js_number(m.get("validadeDias"))
    dias = 15 if math.isnan(dias) or dias == 0 else js_round(dias)
    tipo = m.get("tipoSolucao")
    alvo = Modelo.objects.filter(pk=modelo_id, empresa=request.empresa).first()
    if alvo is None:
        return JsonResponse({"erro": "Modelo não encontrado."})
    alvo.nome = nome
    alvo.descricao = _js_texto(m.get("descricao"))[:300] or None
    alvo.tipo_solucao = ("personalizado" if tipo is None else _js_texto(tipo))[:60] or "personalizado"
    alvo.validade_dias = int(min(365, max(1, dias)))
    alvo.campos, alvo.secoes, alvo.precificacao = campos["ok"], secoes["ok"], prec["ok"]
    alvo.save()
    _auditar(request, "EDITAR", "Modelo", alvo.pk, nome)
    return JsonResponse({"id": alvo.pk})


def editor(request, modelo_id):
    """GET abre o editor; POST (JSON) salva."""
    if request.method == "POST":
        return _editor_post(request, modelo_id)
    return _editor_get(request, modelo_id)


@exige_sessao("modelos")
def _secao_get(request, secao_id):
    sec = SecaoModelo.objects.filter(pk=secao_id, empresa=request.empresa).first()
    if sec is None:
        raise Http404
    inicial = {"nome": sec.nome, "descricao": "", "tipoSolucao": "", "validadeDias": 15, "campos": [],
               "secoes": [sec.secao], "precificacao": {}}
    return _tela_editor(request, modo="secao", inicial=inicial, favoritas=[], secao_id=sec.pk,
                        url_salvar=f"/admin/modelos/secoes/{sec.pk}")


def _salvar_secao(request, secao_id=None):
    """salvarSecaoFavorita do Next."""
    d = _corpo(request)
    nome = _js_texto(d.get("nome")).strip()[:120]
    if not nome:
        return JsonResponse({"erro": "Dê um nome à seção."})
    v = validar_secao(d.get("secao"))
    if "erro" in v:
        return JsonResponse(v)
    if not tamanho_ok(v["ok"]):
        return JsonResponse({"erro": "Seção grande demais."})
    if secao_id:
        sec = SecaoModelo.objects.filter(pk=secao_id, empresa=request.empresa).first()
        if sec is None:
            return JsonResponse({"erro": "Seção não encontrada."})
        sec.nome, sec.secao = nome, v["ok"]
        sec.save()
    else:
        sec = SecaoModelo.objects.create(empresa=request.empresa, nome=nome, secao=v["ok"])
    _auditar(request, "EDITAR" if secao_id else "CRIAR", "SecaoModelo", sec.pk, nome)
    return JsonResponse({"id": sec.pk})


@exige_acao("modelos", "editar")
def _secao_post(request, secao_id):
    return _salvar_secao(request, secao_id)


def secao(request, secao_id):
    """GET abre o editor da seção; POST (JSON) salva."""
    if request.method == "POST":
        return _secao_post(request, secao_id)
    return _secao_get(request, secao_id)


@require_POST
@exige_acao("modelos", "criar")
def favorita(request):
    """★ no editor: salva uma seção do modelo em "Minhas seções"."""
    return _salvar_secao(request)


def _contexto_exemplo(request, campos, precificacao) -> dict:
    """Mesmo contexto da prévia do editor no Next: valores padrão + "Cliente Exemplo"."""
    e = request.empresa
    empresa = {"nome": e.razao_social or e.nome, "site": e.site, "rodape": e.rodape}
    catalogo = catalogo_da_empresa(e)
    try:
        dados = valores_padrao(campos)
        cli = next((c for c in campos if c.get("tipo") == "contato"), None)
        if cli:
            dados[cli["id"]] = {"nome": "Cliente Exemplo"}
        return montar_contexto(campos, precificacao, dados, catalogo, empresa)
    except Exception:  # noqa: BLE001 — formulário a meio caminho de ser editado
        log.info("Prévia do editor sem os campos do formulário", exc_info=True)
        return montar_contexto([], {}, {}, catalogo, empresa)


def _bloco_valido(s) -> bool:
    return (isinstance(s, dict) and s.get("tipo") in blocos.BLOCO and isinstance(s.get("id"), str)
            and conferir_valores(s) is None)


def _bloco_html(s, ctx, tema) -> str:
    if not _bloco_valido(s):
        return ""
    try:
        return renderizar_bloco(limpar_urls(dict(s)), ctx, tema)
    except Exception:  # noqa: BLE001 — um bloco a meio caminho não derruba os outros
        log.info("Bloco do editor não renderizou", exc_info=True)
        return ""


@require_POST
@exige_acao("modelos", "ver")
def render_blocos(request):
    """HTML dos blocos do canvas (ou da prévia inteira, com "completa")."""
    d = _corpo(request)
    campos = d.get("campos") if isinstance(d.get("campos"), list) else []
    campos = [c for c in campos if isinstance(c, dict) and isinstance(c.get("id"), str)]
    precificacao = d.get("precificacao") if isinstance(d.get("precificacao"), dict) else {}
    secoes = d.get("secoes") if isinstance(d.get("secoes"), list) else []
    if conferir_valores(campos) or conferir_valores(precificacao) or len(secoes) > 60:
        return JsonResponse({"erro": "Modelo grande demais."}, status=400)
    ctx = _contexto_exemplo(request, campos, precificacao)
    tema = tema_de(request.empresa.tema)
    if d.get("completa"):
        # Só os blocos que renderizam sozinhos entram na prévia inteira
        secoes = [limpar_urls(dict(s)) if isinstance(s, dict) else s for s in secoes]
        validas = [s for s in secoes if _bloco_valido(s) and (s["tipo"] == "campoLista" or _bloco_html(s, ctx, tema))]
        try:
            html = renderizar_proposta(validas, ctx, tema, modo="previa", aviso_previa="Prévia do modelo com valores de exemplo")
        except Exception:  # noqa: BLE001
            log.info("Prévia do editor não renderizou", exc_info=True)
            html = ""
        return JsonResponse({"html": html})
    return JsonResponse({"blocos": [_bloco_html(s, ctx, tema) for s in secoes]})
