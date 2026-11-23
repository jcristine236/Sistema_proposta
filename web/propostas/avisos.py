"""Avisos ao vendedor por e-mail e WhatsApp (src/lib/avisos.ts, email.ts, whatsapp.ts).

Sem SMTP_HOST / WHATSAPP_PROVIDER configurados o aviso só vai para o log, como no Next.
Falha de envio nunca derruba a requisição que gerou o aviso.
"""

import json
import logging
import re
import urllib.parse
import urllib.request

from django.conf import settings
from django.core.mail import send_mail

from propostas.regras.documentos import whatsapp_internacional
from propostas.servicos import link_publico

log = logging.getLogger(__name__)


def _unicos(*v):
    out = []
    for x in v:
        if x and x not in out:
            out.append(x)
    return out


def enviar_email(para: str | None, assunto: str, texto: str) -> None:
    if not settings.SMTP_HOST or not para:
        log.info("[aviso] %s -> %s\n%s", assunto, para or "(sem destinatário)", texto)
        return
    try:
        send_mail(assunto, texto, settings.DEFAULT_FROM_EMAIL, [para])
    except Exception:  # noqa: BLE001
        log.exception("[aviso] falha ao enviar e-mail")


def _postar(url: str, corpo: dict, headers: dict) -> None:
    req = urllib.request.Request(url, data=json.dumps(corpo).encode(), method="POST",
                                 headers={"Content-Type": "application/json", **headers})
    with urllib.request.urlopen(req, timeout=10) as r:  # erro HTTP vira exceção
        r.read()


def enviar_whatsapp(numero: str | None, texto: str, contexto: dict | None = None) -> None:
    if not numero:
        return
    para = whatsapp_internacional(numero)
    s = settings
    try:
        if s.WHATSAPP_PROVIDER == "evolution":
            base = s.EVOLUTION_URL.rstrip("/")
            _postar(f"{base}/message/sendText/{urllib.parse.quote(s.EVOLUTION_INSTANCE, safe='')}",
                    {"number": para, "text": texto}, {"apikey": s.EVOLUTION_APIKEY})
        elif s.WHATSAPP_PROVIDER == "meta":
            # Mensagens iniciadas pela empresa exigem modelo aprovado; o texto vai como parâmetro {{1}}
            _postar(f"https://graph.facebook.com/v20.0/{s.META_PHONE_ID}/messages", {
                "messaging_product": "whatsapp", "to": para, "type": "template",
                "template": {"name": s.META_TEMPLATE, "language": {"code": s.META_TEMPLATE_LANG},
                             "components": [{"type": "body", "parameters": [
                                 {"type": "text", "text": re.sub(r"\s*\n+\s*", " | ", texto)[:1000]}]}]},
            }, {"Authorization": f"Bearer {s.META_TOKEN}"})
        elif s.WHATSAPP_PROVIDER == "webhook":
            _postar(s.WHATSAPP_WEBHOOK_URL, {"para": para, "texto": texto, **(contexto or {})},
                    {"X-Webhook-Secret": s.WHATSAPP_WEBHOOK_SECRET})
        else:
            log.info("[whatsapp] (sem provedor) -> %s\n%s", para, texto)
    except Exception:  # noqa: BLE001
        log.exception("[whatsapp] falha ao enviar")


def avisar(proposta, assunto: str, corpo: str, whatsapp: bool = False) -> None:
    """Avisa o autor da proposta e os contatos de notificação da empresa."""
    p, e = proposta, proposta.empresa
    base = settings.ADMIN_BASE_URL.rstrip("/")
    painel = f"{base}/admin/propostas/{p.pk}"
    texto = f"{corpo}\n\nProposta {p.codigo}: {link_publico(e.dominio_propostas, p.slug)}\nAcompanhar: {painel}"
    for d in _unicos(p.autor.email, e.email_notificacao):
        enviar_email(d, f"[{e.nome}] {p.codigo} · {assunto}", texto)
    if whatsapp:
        # Normaliza antes de deduplicar (o Next mandava duas vezes para "11..." e "5511...")
        for n in _unicos(*(whatsapp_internacional(x) for x in (e.whatsapp_notificacao, p.autor.whatsapp) if x)):
            enviar_whatsapp(n, f"*{e.nome} · {assunto}*\n{texto}", {"evento": assunto, "proposta": p.codigo})
