"""Recebe uma imagem do painel (editor de modelos, logos) e devolve a URL pública.

Igual a src/app/api/uploads/route.ts + src/lib/uploads.ts: tipo conferido pelos
bytes, até 5 MB, 60 envios por hora por usuário, nome aleatório.
"""

import secrets

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_POST

from nucleo.auth import COOKIE_EMPRESA, empresas_do_usuario
from nucleo.limite import permitir
from nucleo.models import Upload
from nucleo.permissoes import pode

MAX_UPLOAD = 5 * 1024 * 1024


def tipo_imagem(b: bytes) -> tuple[str, str] | None:
    """Identifica PNG, JPEG, WebP e GIF pelos primeiros bytes (não confia na extensão)."""
    if b.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png", "png"
    if b.startswith(b"\xff\xd8\xff"):
        return "image/jpeg", "jpg"
    if b.startswith(b"RIFF") and b[8:12] == b"WEBP":
        return "image/webp", "webp"
    if b.startswith(b"GIF8"):
        return "image/gif", "gif"
    return None


def _erro(msg: str, status: int) -> JsonResponse:
    return JsonResponse({"erro": msg}, status=status)


@require_POST
def uploads(request):
    u = request.usuario
    if u is None or u.trocar_senha:
        return _erro("Não autorizado.", 401)
    if not (pode(u, "modelos", "editar") or pode(u, "modelos", "criar") or pode(u, "empresa", "editar")):
        return _erro("Sem permissão para enviar imagens.", 403)
    if not permitir(f"upload:{u.id}", 60, 60 * 60):
        return _erro("Muitos envios. Tente mais tarde.", 429)

    # Empresa ativa do usuário (mesma regra do painel)
    empresas = empresas_do_usuario(u)
    slug = request.COOKIES.get(COOKIE_EMPRESA)
    empresa = next((e for e in empresas if e.slug == slug), empresas[0] if empresas else None)
    if empresa is None:
        return _erro("Sem empresa.", 403)

    try:
        tamanho_pedido = int(request.META.get("CONTENT_LENGTH") or 0)
    except ValueError:
        tamanho_pedido = 0
    if tamanho_pedido > MAX_UPLOAD + 100_000:
        return _erro("Imagem maior que 5 MB.", 413)
    arq = request.FILES.get("arquivo")
    if arq is None:
        return _erro("Envie um arquivo.", 400)
    if arq.size > MAX_UPLOAD:
        return _erro("Imagem maior que 5 MB.", 413)
    dados = arq.read()
    tipo = tipo_imagem(dados)
    if not tipo:
        return _erro("Formato não aceito. Use PNG, JPG, WebP ou GIF.", 415)
    mime, ext = tipo

    nome = f"{secrets.token_hex(16)}.{ext}"
    pasta = settings.UPLOAD_DIR
    pasta.mkdir(parents=True, exist_ok=True)
    with open(pasta / nome, "xb") as saida:
        saida.write(dados)
    Upload.objects.create(empresa=empresa, arquivo=nome, nome=(arq.name or "")[:200], mime=mime, tamanho=arq.size)
    return JsonResponse({"url": f"/uploads/{nome}"})
