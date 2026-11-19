"""Formatação pt-BR com o mesmo resultado do Intl do navegador (src/lib/formato.ts)."""

import math
import re
import unicodedata
from datetime import date, datetime
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation
from zoneinfo import ZoneInfo

from babel.numbers import format_currency, format_decimal

SP = ZoneInfo("America/Sao_Paulo")
_DATA_ISO = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _decimal(v) -> Decimal:
    try:
        d = Decimal(str(v))
    except (InvalidOperation, ValueError, TypeError):
        return Decimal(0)
    return d if d.is_finite() else Decimal(0)


def brl(v) -> str:
    """1234.5 -> "R$ 1.234,50" (com NBSP depois de R$, como o Intl)."""
    d = _decimal(v).quantize(Decimal("0.01"), ROUND_HALF_UP)
    return format_currency(d, "BRL", locale="pt_BR")


def numero_br(v) -> str:
    """toLocaleString("pt-BR"): até 3 casas decimais, milhar com ponto."""
    if isinstance(v, float) and not math.isfinite(v):
        return "NaN" if math.isnan(v) else ("∞" if v > 0 else "-∞")
    d = _decimal(v).quantize(Decimal("0.001"), ROUND_HALF_UP)
    return format_decimal(d, format="#,##0.###", locale="pt_BR")


def _para_datetime(v) -> datetime:
    if isinstance(v, datetime):
        return v
    if isinstance(v, date):
        return datetime(v.year, v.month, v.day, tzinfo=SP)
    return datetime.fromisoformat(str(v).replace("Z", "+00:00"))


def data_br(v) -> str:
    """"2026-10-29" ou datetime -> "29/10/2026"; vazio -> "sem data"."""
    if not v:
        return "sem data"
    if isinstance(v, str) and _DATA_ISO.match(v):
        a, m, d = v.split("-")
        return f"{d}/{m}/{a}"
    dt = _para_datetime(v)
    if dt.tzinfo:
        dt = dt.astimezone(SP)
    return dt.strftime("%d/%m/%Y")


def data_hora_br(v) -> str:
    """datetime -> "19/11/2026, 12:04" (fuso de Brasília); vazio -> "-"."""
    if not v:
        return "-"
    dt = _para_datetime(v)
    if dt.tzinfo:
        dt = dt.astimezone(SP)
    return dt.strftime("%d/%m/%Y, %H:%M")


def duracao(seg) -> str:
    s = int(_decimal(seg).quantize(Decimal(1), ROUND_HALF_UP))
    if s < 60:
        return f"{s}s"
    m = s // 60
    if m < 60:
        return f"{m}min {s % 60}s"
    return f"{m // 60}h {m % 60}min"


def slugify_br(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if not ("̀" <= c <= "ͯ")).lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:40] or "cliente"
