"""Avisos ao vendedor (e-mail e WhatsApp) — src/lib/avisos.ts.

Etapa 2: só registra no log. O envio por e-mail/WhatsApp entra na etapa 5, mantendo
esta mesma assinatura (os pontos de chamada já estão no lugar certo).
"""

import logging

log = logging.getLogger(__name__)


def avisar(proposta, assunto: str, corpo: str, whatsapp: bool = False) -> None:
    log.info("[aviso] %s · %s · %s%s", proposta.codigo, assunto, corpo.replace("\n", " | "),
             " (+WhatsApp)" if whatsapp else "")
