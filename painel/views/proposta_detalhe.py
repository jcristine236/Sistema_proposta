"""Acompanhamento de uma proposta, exclusão e contrato (src/app/admin/propostas/[id]/page.tsx)."""

import logging
import re

from django.http import Http404, JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.http import require_POST

from integracoes import d4sign
from nucleo.auditoria import auditar
from nucleo.auth import exige_acao, exige_sessao, filtro_propostas, pode_agir
from nucleo.formato import brl
from nucleo.permissoes import pode
from painel.views.propostas import EVENTOS, STATUS
from propostas.blocos import NOMES
from propostas.models import Evento, Proposta, StatusProposta
from propostas.regras.js import js_num
from propostas.servicos import link_publico

STATUS_CONTRATO = {"ENVIADO": "Enviado para assinatura", "ASSINADO": "Assinado", "CANCELADO": "Cancelado"}


def resumir_navegador(ua: str | None) -> str:
    if not ua:
        return "-"
    so = ("iOS" if re.search(r"iPhone|iPad", ua) else "Android" if "Android" in ua else "Windows" if "Windows" in ua
          else "macOS" if "Mac OS" in ua else "Linux" if "Linux" in ua else "")
    nav = ("Edge" if "Edg/" in ua else "Chrome" if "Chrome/" in ua else "Firefox" if "Firefox/" in ua
           else "Safari" if "Safari/" in ua else "Navegador")
    return f"{nav} · {so}" if so else nav


def _rotulo_secao(s: dict) -> str:
    if s.get("capitulo"):
        return s["capitulo"]
    titulo = s.get("titulo")
    if isinstance(titulo, str) and titulo:
        return re.sub(r"\*\*|\{\{[^}]+\}\}", "", titulo)[:50]
    return NOMES.get(s.get("tipo"), s.get("tipo"))


def _js_pct(v: float) -> str:
    return f"{v * 100 / 100:.1f}"


@exige_sessao("propostas")
def detalhe(request, proposta_id):
    p = (Proposta.objects.filter(filtro_propostas(request), pk=proposta_id)
         .select_related("autor", "modelo", "empresa").first())
    if p is None:
        raise Http404
    eventos = list(p.eventos.order_by("-criado_em"))
    visualizacoes = list(p.visualizacoes.order_by("-iniciada_em").prefetch_related("secoes"))
    tempo_por_secao: dict[str, int] = {}
    for v in visualizacoes:
        for ts in v.secoes.all():
            tempo_por_secao[ts.secao] = tempo_por_secao.get(ts.secao, 0) + ts.segundos
    max_tempo = max([1, *tempo_por_secao.values()])
    calc = p.calculo or {}
    desconto = calc.get("desconto") or {}
    u = request.usuario
    contrato = p.contrato or None
    secoes = (p.snapshot or {}).get("secoes") or []
    return render(request, "painel/propostas/detalhe.html", {
        "p": p,
        "link": link_publico(request.empresa.dominio_propostas, p.slug),
        "status": STATUS[p.status],
        "pode_editar": pode(u, "propostas", "editar") and p.status != StatusProposta.ACEITA,
        "pode_duplicar": pode(u, "propostas", "criar") and p.modelo is not None and p.modelo.ativo,
        "pode_excluir": pode(u, "propostas", "excluir"),
        "pode_contrato": pode(u, "propostas", "editar"),
        "mensal": brl(calc.get("totalMensal", 0)),
        "mensal_sub": f"com desconto de {brl(desconto.get('valor', 0))}" if (desconto.get("valor") or 0) > 0 else "sem desconto",
        "unico": brl(calc.get("totalUnico", 0)),
        "tempo_total": sum(v.tempo_total_seg for v in visualizacoes),
        "acessos": len(visualizacoes),
        "leitores": len({v.viewer_id for v in visualizacoes}),
        "pct": _js_pct(desconto.get("pct") or 0),
        "dc": p.dados_contratacao,
        "contrato": contrato,
        "status_contrato": STATUS_CONTRATO.get((contrato or {}).get("status"), (contrato or {}).get("status")),
        "d4_pronto": d4sign.pronto(p.empresa.d4sign),
        "d4_ambiente": d4sign.ambiente(),
        "tempos": [
            {"rotulo": _rotulo_secao(s), "t": tempo_por_secao.get(s.get("id"), 0),
             "largura": js_num(tempo_por_secao.get(s.get("id"), 0) / max_tempo * 100)}
            for s in secoes
        ] if tempo_por_secao else [],
        "eventos": [{"e": e, "rotulo": EVENTOS.get(e.tipo, e.tipo), "d": e.dados or {}} for e in eventos],
        "acessos_lista": [{"v": v, "nav": resumir_navegador(v.user_agent)} for v in visualizacoes],
        "comentarios": [{"e": e, "d": e.dados or {}} for e in eventos if e.tipo == "COMENTARIO"],
    })


@require_POST
@exige_sessao("propostas")
def excluir(request, proposta_id):
    if not pode_agir(request, "propostas", "excluir"):
        return redirect("/admin/sem-permissao")
    p = Proposta.objects.filter(filtro_propostas(request), pk=proposta_id).first()
    if p is not None:
        codigo, cliente, pk = p.codigo, p.cliente_nome, p.pk
        p.delete()
        auditar(request, usuario=request.usuario, empresa_id=request.empresa.pk, acao="EXCLUIR", entidade="Proposta",
                entidade_id=pk, descricao=f"{codigo} {cliente}")
    return redirect("/admin/propostas")


@require_POST
@exige_acao("propostas", "editar")
def gerar_contrato(request, proposta_id):
    """Gera o contrato no D4Sign a partir de uma proposta aceita (disparo manual)."""
    p = Proposta.objects.filter(filtro_propostas(request), pk=proposta_id).select_related("empresa").first()
    if p is None:
        return JsonResponse({"erro": "Proposta não encontrada."})
    if p.status != StatusProposta.ACEITA:
        return JsonResponse({"erro": "O contrato só pode ser gerado depois que o cliente aceitar a proposta."})
    if not d4sign.pronto(p.empresa.d4sign):
        return JsonResponse({"erro": "O D4Sign ainda não está configurado para esta empresa (veja Empresa e marca)."})
    if (p.contrato or {}).get("uuid") and (p.contrato or {}).get("status") != "CANCELADO":
        return JsonResponse({"erro": "Esta proposta já tem contrato no D4Sign."})
    try:
        contrato = d4sign.gerar_contrato(p.empresa, p)
    except d4sign.D4SignErro as e:
        return JsonResponse({"erro": str(e) or "Falha ao gerar o contrato no D4Sign."})
    except Exception:  # noqa: BLE001 — detalhe só no log: a mensagem pode trazer dados internos
        logging.getLogger(__name__).exception("Falha ao gerar contrato D4Sign (%s)", p.codigo)
        return JsonResponse({"erro": "Falha ao gerar o contrato no D4Sign."})
    Proposta.objects.filter(pk=p.pk).update(contrato=contrato)
    Evento.objects.create(proposta=p, tipo="CONTRATO_ENVIADO", dados={"nome": request.usuario.nome, "uuid": contrato["uuid"]})
    auditar(request, usuario=request.usuario, empresa_id=request.empresa.pk, acao="CONTRATO", entidade="Proposta",
            entidade_id=p.pk, descricao=f"{p.codigo} → D4Sign {contrato['uuid']}")
    return JsonResponse({"ok": True, "status": contrato["status"]})
