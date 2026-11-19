"""Painel (KPIs) e propostas: lista, escolha de modelo (src/app/admin/page.tsx e propostas/**)."""

from datetime import timedelta
from urllib.parse import urlencode

from django.db.models import Prefetch, Q
from django.shortcuts import redirect, render
from django.utils import timezone

from nucleo.auth import exige_sessao, filtro_propostas
from nucleo.formato import brl, duracao
from nucleo.permissoes import MODULOS, pode
from propostas.models import Evento, Modelo, Proposta, StatusProposta, Visualizacao

STATUS = dict(StatusProposta.choices)
EVENTOS = {
    "CRIADA": "Proposta criada",
    "ABERTA": "Cliente abriu a proposta",
    "REABERTA": "Cliente voltou à proposta",
    "ACEITA": "Proposta aceita",
    "RECUSADA": "Proposta recusada",
    "COMENTARIO": "Novo comentário",
    "EDITADA": "Proposta editada",
    "CONTRATO_ENVIADO": "Contrato enviado para assinatura (D4Sign)",
    "CONTRATO_ASSINADO": "Contrato assinado (D4Sign)",
    "CONTRATO_CANCELADO": "Contrato cancelado (D4Sign)",
}
ROTAS_MODULO = {"propostas": "/admin/propostas", "modelos": "/admin/modelos", "catalogo": "/admin/catalogo",
                "clientes": "/admin/contatos", "empresa": "/admin/empresa", "usuarios": "/admin/usuarios",
                "auditoria": "/admin/auditoria"}


def _js_round(x: float) -> int:
    import math
    return math.floor(x + 0.5)


@exige_sessao()
def inicio(request):
    u = request.usuario
    if not pode(u, "painel"):
        primeiro = next((m for m in MODULOS if m in ROTAS_MODULO and pode(u, m)), None)
        return redirect(ROTAS_MODULO[primeiro] if primeiro else "/admin/conta")

    filtro = filtro_propostas(request)
    desde = timezone.now() - timedelta(days=90)
    propostas = list(
        Proposta.objects.filter(filtro, criado_em__gte=desde)
        .only("id", "status", "valor_mensal", "primeira_abertura_em")
        .prefetch_related(Prefetch("visualizacoes", queryset=Visualizacao.objects.only("proposta_id", "tempo_total_seg")))
    )
    enviadas = len(propostas)
    abertas = sum(1 for p in propostas if p.primeira_abertura_em)
    aceitas = [p for p in propostas if p.status == StatusProposta.ACEITA]
    tempos = [t for t in (sum(v.tempo_total_seg for v in p.visualizacoes.all()) for p in propostas) if t > 0]

    def soma(lista):
        return sum(float(p.valor_mensal or 0) for p in lista)

    pendentes = list(Proposta.objects.filter(filtro, status=StatusProposta.PUBLICADA).order_by("publicada_em")[:6])
    kpis = [
        ("Propostas enviadas", str(enviadas), "últimos 90 dias"),
        ("Taxa de abertura", f"{_js_round(abertas / enviadas * 100)}%" if enviadas else "-", f"{abertas} abertas"),
        ("Conversão", f"{_js_round(len(aceitas) / enviadas * 100)}%" if enviadas else "-", f"{len(aceitas)} aceitas"),
        ("Tempo médio de leitura", duracao(sum(tempos) / len(tempos)) if tempos else "-", "por proposta aberta"),
        ("Mensalidade enviada", brl(soma(propostas)), "soma das propostas"),
        ("Mensalidade fechada", brl(soma(aceitas)), "propostas aceitas"),
        ("Ticket médio", brl(soma(propostas) / enviadas) if enviadas else "-", "mensal"),
        ("Aguardando abertura", str(len(pendentes)), "enviadas e não abertas"),
    ]
    eventos = list(
        Evento.objects.filter(proposta__in=Proposta.objects.filter(filtro)).exclude(tipo="CRIADA")
        .select_related("proposta").order_by("-criado_em")[:12]
    )
    return render(request, "painel/propostas/inicio.html", {
        "kpis": kpis,
        "eventos": [{"e": e, "rotulo": EVENTOS.get(e.tipo, e.tipo)} for e in eventos],
        "pendentes": [{"p": p, "rotulo": STATUS[p.status]} for p in pendentes],
        "pode_criar": pode(u, "propostas", "criar"),
    })


@exige_sessao("propostas")
def lista(request):
    status = request.GET.get("status") or ""
    busca = (request.GET.get("q") or "").strip()[:80]
    qs = Proposta.objects.filter(filtro_propostas(request))
    if status in STATUS:
        qs = qs.filter(status=status)
    if busca:
        qs = qs.filter(Q(codigo__icontains=busca) | Q(cliente_nome__icontains=busca))
    qs = (qs.select_related("autor", "modelo")
          .prefetch_related(Prefetch("visualizacoes", queryset=Visualizacao.objects.only("proposta_id", "tempo_total_seg")))
          .order_by("-criado_em")[:300])

    def link(st=None):
        params = {}
        if st:
            params["status"] = st
        if busca:
            params["q"] = busca
        return "/admin/propostas?" + urlencode(params)

    linhas = []
    for p in qs:
        vis = list(p.visualizacoes.all())
        tempo = sum(v.tempo_total_seg for v in vis)
        mensal = float(p.valor_mensal or 0)
        linhas.append({
            "p": p,
            "valor": f"{brl(mensal)}/mês" if mensal > 0 else brl(float(p.valor_unico or 0)),
            "status": STATUS[p.status],
            "leitura": f"{len(vis)}× · {duracao(tempo)}" if vis else None,
        })
    filtros = [{"rotulo": v, "href": link(k), "ativo": status == k} for k, v in STATUS.items() if k != "RASCUNHO"]
    return render(request, "painel/propostas/lista.html", {
        "linhas": linhas, "status": status, "busca": busca, "todas": link(), "filtros": filtros,
        "pode_criar": pode(request.usuario, "propostas", "criar"),
    })


@exige_sessao("propostas", "criar")
def nova(request):
    modelos = list(Modelo.objects.filter(empresa=request.empresa, ativo=True).order_by("nome"))
    if len(modelos) == 1:
        return redirect(f"/admin/propostas/nova/{modelos[0].pk}")
    return render(request, "painel/propostas/nova.html", {"modelos": modelos})
