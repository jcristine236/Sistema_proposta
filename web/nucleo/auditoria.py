"""Registro de auditoria: quem fez o quê, quando e de onde (src/lib/auditoria.ts)."""

import logging

from django.db import transaction

from nucleo.limite import ip_cliente
from nucleo.models import LogAuditoria

log = logging.getLogger(__name__)


def auditar(request, *, acao, usuario=None, empresa_id=None, entidade=None, entidade_id=None, descricao=None) -> None:
    """Grava o registro. Uma falha aqui nunca derruba a ação que está sendo auditada."""
    try:
        with transaction.atomic():
            LogAuditoria.objects.create(
                usuario=usuario,
                empresa_id=empresa_id,
                acao=acao,
                entidade=entidade,
                entidade_id=entidade_id,
                descricao=descricao[:500] if descricao else descricao,
                ip=ip_cliente(request) if request is not None else None,
            )
    except Exception:  # noqa: BLE001 — auditoria é "melhor esforço", como no Next
        log.exception("[auditoria] falha ao registrar")
