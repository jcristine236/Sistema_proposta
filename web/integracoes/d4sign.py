"""D4Sign: contrato a partir do modelo da empresa e status pelo webhook (src/lib/d4sign.ts).

Fluxo: criar documento pelo modelo (template) -> cadastrar signatários (cliente + empresa)
-> enviar para assinatura. Credenciais no .env; cofre, modelo e signatário da empresa
ficam em Empresa.d4sign. API v1: https://docapi.d4sign.com.br
"""

import json
import re
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings
from django.utils import timezone

from nucleo.formato import brl, data_br


class D4SignErro(Exception):
    pass


def pronto(cfg: dict | None) -> bool:
    """True quando o D4Sign está pronto para a empresa (credenciais no servidor + config da empresa)."""
    cfg = cfg or {}
    return bool(settings.D4SIGN_TOKEN_API and cfg.get("cofre") and cfg.get("template") and cfg.get("signatarioEmail"))


def ambiente() -> str:
    return "produção" if settings.D4SIGN_AMBIENTE == "producao" else "sandbox"


def _base() -> str:
    if settings.D4SIGN_BASE_URL:
        return settings.D4SIGN_BASE_URL.rstrip("/")
    return ("https://secure.d4sign.com.br/api/v1" if settings.D4SIGN_AMBIENTE == "producao"
            else "https://sandbox.d4sign.com.br/api/v1")


def _chamar(caminho: str, corpo: dict) -> dict:
    q = {"tokenAPI": settings.D4SIGN_TOKEN_API}
    if settings.D4SIGN_CRYPT_KEY:
        q["cryptKey"] = settings.D4SIGN_CRYPT_KEY
    req = urllib.request.Request(f"{_base()}{caminho}?{urllib.parse.urlencode(q)}", data=json.dumps(corpo).encode(),
                                 method="POST", headers={"Content-Type": "application/json", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            texto = r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        texto = e.read().decode("utf-8", "replace")
        try:
            d = json.loads(texto)
        except ValueError:
            d = {}
        msg = (d.get("message") or d.get("error")) if isinstance(d, dict) else None
        raise D4SignErro(f"D4Sign ({caminho}): {msg or texto or f'HTTP {e.code}'}") from None
    except OSError as e:
        raise D4SignErro(f"D4Sign ({caminho}): {e}") from None
    try:
        dados = json.loads(texto) if texto else {}
    except ValueError:
        dados = {"raw": texto}
    return dados if isinstance(dados, dict) else {"lista": dados}


def _campos_do_contrato(dc: dict, p, cfg: dict) -> dict:
    valores = {
        "razaoSocial": dc.get("razaoSocial") or "", "cnpj": dc.get("cnpj") or "", "nomeSocio": dc.get("nomeSocio") or "",
        "email": dc.get("email") or "", "whatsapp": dc.get("whatsapp") or "",
        "cliente": p.cliente_nome, "codigo": p.codigo, "titulo": p.titulo,
        "valorMensal": brl(p.valor_mensal) if p.valor_mensal else "",
        "valorUnico": brl(p.valor_unico) if p.valor_unico else "",
        "data": data_br(timezone.localdate()),
    }
    mapa = cfg.get("campos") if isinstance(cfg.get("campos"), dict) else {}
    return {str(mapa.get(k) or k): v for k, v in valores.items()}  # sem mapeamento: usa a própria chave


def gerar_contrato(empresa, proposta) -> dict:
    """Cria o contrato no D4Sign, cadastra os signatários e envia para assinatura."""
    cfg = empresa.d4sign or {}
    if not pronto(cfg):
        raise D4SignErro("D4Sign não configurado para esta empresa.")
    dc = proposta.dados_contratacao or {}
    if not dc.get("email"):
        raise D4SignErro("A proposta não tem os dados de contratação (e-mail do cliente).")
    criado = _chamar(f"/documents/{cfg['cofre']}/makedocumentbytemplate", {
        "name_document": f"Contrato {proposta.codigo} — {proposta.cliente_nome}",
        "templates": {cfg["template"]: _campos_do_contrato(dc, proposta, cfg)},
    })
    uuid = str(criado.get("uuid") or criado.get("uuidDoc") or "")
    if not uuid:
        raise D4SignErro("D4Sign não retornou o identificador do documento.")
    assinante = {"act": "1", "foreign": "0", "certificadoicpbr": "0", "assinatura_presencial": "0"}
    _chamar(f"/documents/{uuid}/createlist", {"signers": [
        {"email": dc["email"], **assinante}, {"email": cfg["signatarioEmail"], **assinante}]})
    _chamar(f"/documents/{uuid}/sendtosigner", {
        "message": f"Contrato referente à proposta {proposta.codigo}.", "skip_email": "0", "workflow": "0"})
    return {"uuid": uuid, "status": "ENVIADO", "enviadoEm": timezone.now().isoformat().replace("+00:00", "Z"),
            "signatarios": [dc["email"], cfg["signatarioEmail"]]}


# type_post numérico do D4Sign: 1 = documento finalizado, 3 = cancelado (2 e 4 não mudam o status)
_CODIGOS = {"1": "ASSINADO", "3": "CANCELADO"}


def status_do_webhook(payload: dict) -> str | None:
    bruto = next((payload[k] for k in ("type_post", "type", "message", "status") if payload.get(k) not in (None, "")), "")
    tipo = str(bruto).strip().lower()
    if tipo in _CODIGOS:
        return _CODIGOS[tipo]
    if re.search(r"finaliz|assinado|signed|concl", tipo):
        return "ASSINADO"
    if "cancel" in tipo:
        return "CANCELADO"
    return None
