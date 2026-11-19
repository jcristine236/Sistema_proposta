"""Páginas públicas: a proposta, os arquivos enviados e a 404 da proposta."""

import re

from django.conf import settings
from django.http import FileResponse, HttpResponse
from django.shortcuts import render

from nucleo.formato import brl
from nucleo.tema import FONTES_PAINEL_URL, FONTES_URL
from propostas.render.secoes import renderizar_proposta
from publico import servico

NOME_ARQUIVO = re.compile(r"^[a-f0-9]{32}\.(png|jpg|webp|gif)$")
MIME = {"png": "image/png", "jpg": "image/jpeg", "webp": "image/webp", "gif": "image/gif"}


def _nao_encontrada(request):
    return render(request, "publico/nao_encontrada.html", status=404)


def proposta(request, slug):
    p = servico.proposta_publica(request, slug)
    if p is None:
        return _nao_encontrada(request)
    ctx = servico.contexto_da_proposta(p)
    tema = servico.tema_da_empresa(p.empresa)
    decisao = p.status if p.status in ("ACEITA", "RECUSADA") else None
    html = renderizar_proposta(
        (p.snapshot or {}).get("secoes") or [], ctx, tema, modo="publico", slug=p.slug, decisao=decisao, codigo=p.codigo,
        extras={
            "motivos": servico.motivos_da_empresa(p.empresa),
            "mensal": brl(ctx["calc"].get("totalMensal", 0)),
            "unico": brl(ctx["calc"].get("totalUnico", 0)) if ctx["calc"].get("totalUnico", 0) > 0 else "",
        },
    )
    return render(request, "publico/proposta.html", {
        "titulo": f"Proposta para {p.cliente_nome} · {p.empresa.nome}",
        "icone": tema.get("logo") or "",
        "fontes_painel": FONTES_PAINEL_URL,
        "fontes": FONTES_URL,
        "html": html,
    })


def upload(request, arquivo):
    """Serve as imagens enviadas (nome aleatório; tipo conferido no envio)."""
    if not NOME_ARQUIVO.match(arquivo):
        return HttpResponse("Não encontrado", status=404)
    caminho = settings.UPLOAD_DIR / arquivo
    if not caminho.is_file():
        return HttpResponse("Não encontrado", status=404)
    r = FileResponse(open(caminho, "rb"), content_type=MIME[arquivo.rsplit(".", 1)[1]])
    r["Cache-Control"] = "public, max-age=31536000, immutable"
    r["X-Content-Type-Options"] = "nosniff"
    r["Content-Security-Policy"] = "default-src 'none'; sandbox"
    return r
