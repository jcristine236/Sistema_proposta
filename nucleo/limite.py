"""Limite de requisições por chave (IP, e-mail...) e IP do cliente (src/lib/limite.ts).

A janela deslizante fica numa tabela própria (LimiteTaxa) e cada chave é lida e
gravada com a linha travada (SELECT ... FOR UPDATE). Assim o limite vale para
todas as threads e processos do servidor, sem perder tentativas em paralelo.
"""

import random
import time
from datetime import timedelta

from django.db import connection, transaction
from django.utils import timezone

from nucleo.models import LimiteTaxa

_TABELA = LimiteTaxa._meta.db_table


def _agora() -> float:
    return time.time()


def permitir(chave: str, limite: int, janela_seg: int) -> bool:
    """True se ainda cabe uma requisição de `chave` dentro da janela; registra a tentativa."""
    agora = _agora()
    chave = chave[:200]
    with transaction.atomic():
        with connection.cursor() as cur:
            cur.execute(
                f"INSERT INTO {_TABELA} (chave, tentativas, atualizado_em) VALUES (%s, '[]', now()) "
                "ON CONFLICT (chave) DO NOTHING",
                [chave],
            )
        registro = LimiteTaxa.objects.select_for_update().get(chave=chave)
        lista = [t for t in registro.tentativas if agora - t < janela_seg]
        cabe = len(lista) < limite
        if cabe:
            lista.append(agora)
        registro.tentativas = lista
        registro.save(update_fields=["tentativas", "atualizado_em"])
    if random.random() < 0.01:
        # Faxina ocasional: chaves sem uso há mais de um dia
        LimiteTaxa.objects.filter(atualizado_em__lt=timezone.now() - timedelta(days=1)).delete()
    return cabe


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
