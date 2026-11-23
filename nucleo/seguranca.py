"""Cabeçalhos de segurança com CSP baseada em nonce (src/middleware.ts).

Cada requisição ganha um nonce novo em request.csp_nonce; todo <script> dos
templates precisa dele. /static/, /empresas/ e /uploads/ ficam de fora (o
WhiteNoise responde os dois primeiros antes de chegar aqui).
"""

import base64
import secrets

from django.conf import settings

FORA = ("/static/", "/empresas/", "/uploads/")


def _https() -> bool:
    # Mesmo critério do Next: produção e sem MODO_HTTP
    return not settings.DEBUG and not settings.MODO_HTTP


def montar_csp(nonce: str) -> str:
    partes = [
        "default-src 'self'",
        f"script-src 'self' 'nonce-{nonce}' 'strict-dynamic'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: blob: https:",
        "frame-src https://www.youtube-nocookie.com https://player.vimeo.com",
        "connect-src 'self'",
        "media-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
    ]
    if _https():
        partes.append("upgrade-insecure-requests")
    return "; ".join(partes)


class CabecalhosMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.csp_nonce = base64.b64encode(secrets.token_bytes(16)).decode()
        resposta = self.get_response(request)
        path = request.path
        if path.startswith(FORA):
            return resposta
        resposta["Content-Security-Policy"] = montar_csp(request.csp_nonce)
        resposta["X-Content-Type-Options"] = "nosniff"
        resposta["X-Frame-Options"] = "DENY"
        resposta["Referrer-Policy"] = "strict-origin-when-cross-origin"
        resposta["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
        resposta["Cross-Origin-Opener-Policy"] = "same-origin"
        if _https():
            resposta["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        if path.startswith("/admin") or path.startswith("/login"):
            resposta["Cache-Control"] = "no-store"
        return resposta
