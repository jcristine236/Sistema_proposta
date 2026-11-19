"""Pequenos equivalentes de operações do JavaScript usadas pelas regras."""

import math
import re
from decimal import Decimal

_PARSE_FLOAT = re.compile(r"^\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)")


def parse_float(v) -> float:
    """parseFloat(String(v ?? "")) — NaN quando não começa com número."""
    if v is None:
        return math.nan
    s = js_string(v)
    if re.match(r"^\s*[+-]?Infinity", s):
        return -math.inf if s.strip().startswith("-") else math.inf
    m = _PARSE_FLOAT.match(s)
    return float(m.group(1)) if m else math.nan


def js_number(v) -> float:
    """Number(v)."""
    if v is None:
        return 0.0 if v is None and False else math.nan  # Number(undefined) = NaN
    if isinstance(v, bool):
        return 1.0 if v else 0.0
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        s = v.strip()
        if s == "":
            return 0.0
        try:
            return float(s) if re.fullmatch(r"[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?|[+-]?Infinity", s) else math.nan
        except ValueError:
            return math.nan
    if isinstance(v, list):
        if not v:
            return 0.0
        if len(v) == 1:
            return js_number(js_string(v[0]))
    return math.nan


def js_round(x: float) -> float:
    """Math.round: meio vai para +infinito."""
    if not math.isfinite(x):
        return x
    return float(math.floor(x + 0.5))


def js_num(x) -> str:
    """String(número) do JS (forma mais curta; inteiros sem ".0")."""
    if isinstance(x, bool):
        return "true" if x else "false"
    x = float(x)
    if math.isnan(x):
        return "NaN"
    if math.isinf(x):
        return "Infinity" if x > 0 else "-Infinity"
    if x == 0:
        return "0"
    if x.is_integer() and abs(x) < 1e21:
        return str(int(x))
    r = repr(x)
    if abs(x) >= 1e21 or abs(x) < 1e-6:
        mant, _, exp = r.partition("e")
        if not exp:
            mant, exp = f"{x:e}".split("e")
        e = int(exp)
        return f"{mant}e{'+' if e >= 0 else '-'}{abs(e)}"
    return format(Decimal(r), "f")


def js_string(v) -> str:
    """String(v) do JS para valores vindos de JSON."""
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return js_num(v)
    if isinstance(v, str):
        return v
    if isinstance(v, list):
        return ",".join("" if x is None else js_string(x) for x in v)
    return "[object Object]"


def truthy(v) -> bool:
    if isinstance(v, float) and math.isnan(v):
        return False
    if isinstance(v, (list, dict)):
        return True
    return bool(v)
