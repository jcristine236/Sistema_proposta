"""Limite de requisições por chave (IP, e-mail...) e IP do cliente (src/lib/limite.ts).

A janela deslizante fica no cache do Django (tabela no banco), então vale para
todos os processos do servidor, não só para um.
"""

import time

from django.core.cache import cache


def _agora() -> float:
    return time.time()


def permitir(chave: str, limite: int, janela_seg: int) -> bool:
    """True se ainda cabe uma requisição de `chave` dentro da janela; registra a tentativa."""
    agora = _agora()
    k = f"limite:{chave}"
    lista = [t for t in cache.get(k, []) if agora - t < janela_seg]
    if len(lista) >= limite:
        cache.set(k, lista, janela_seg)
        return False
    lista.append(agora)
    cache.set(k, lista, janela_seg)
    return True


def _xff(request) -> list[str]:
    bruto = request.META.get("HTTP_X_FORWARDED_FOR", "")
    return [x.strip() for x in bruto.split(",") if x.strip()]


def ip_cliente(request) -> str:
    """A última entrada do X-Forwarded-For é a que o nosso proxy adiciona."""
    xff = _xff(request)
    if xff:
        return xff[-1]
    return request.META.get("HTTP_X_REAL_IP") or request.META.get("REMOTE_ADDR") or "local"


def ip_original(request) -> str:
    """A primeira entrada do X-Forwarded-For (usada para gravar a visualização)."""
    xff = _xff(request)
    return xff[0] if xff else ip_cliente(request)
