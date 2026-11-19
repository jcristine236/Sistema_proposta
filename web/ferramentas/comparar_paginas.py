"""Compara páginas do painel entre o Next (referência, porta 3000) e o Django (porta 8000).

Entra como admin@propostas.local nos dois (sem formulário: assina o JWT do Next com o
SESSION_SECRET do .env da raiz e cria uma sessão Django direto no banco), baixa a mesma
URL nos dois e compara a árvore canônica do <main class="conteudo">. Ids, datas e tokens
são mascarados. Uso (dentro de web/, com os dois servidores no ar):

    .venv/Scripts/python ferramentas/comparar_paginas.py /admin /admin/propostas
    .venv/Scripts/python ferramentas/comparar_paginas.py --empresa kolp /admin/catalogo
"""

import base64
import hashlib
import hmac
import json
import os
import re
import sys
import time
import urllib.request
from pathlib import Path

WEB = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(WEB))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django  # noqa: E402

django.setup()

import psycopg  # noqa: E402
from django.conf import settings  # noqa: E402
from django.contrib.sessions.backends.db import SessionStore  # noqa: E402

from nucleo.models import Usuario  # noqa: E402
from propostas.tests.html_canonico import _Arvore, _limpar, primeira_diferenca  # noqa: E402

EMAIL = "admin@propostas.local"
NEXT = "http://localhost:3000"
DJANGO = os.environ.get("COMPARAR_DJANGO_URL", "http://localhost:8000")

_ID = re.compile(r"\b(c[a-z0-9]{24}|[a-f0-9]{32})\b")
_DATA = re.compile(r"\d{2}/\d{2}/\d{4}(, \d{2}:\d{2})?")
_TEMPO = re.compile(r"\b\d+(min|h|s)\b")


def _env_raiz() -> dict:
    vals = {}
    for linha in (WEB.parent / ".env").read_text(encoding="utf-8").splitlines():
        if "=" in linha and not linha.lstrip().startswith("#"):
            k, v = linha.split("=", 1)
            vals[k.strip()] = v.strip().strip('"')
    return vals


def _b64(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def cookie_next() -> str:
    env = _env_raiz()
    db = settings.DATABASES["default"]
    with psycopg.connect(host=db["HOST"], port=db["PORT"] or 5432, user=db["USER"], password=db["PASSWORD"],
                         dbname="propostas_next") as c:
        uid, v = c.execute('select id, "versaoSessao" from "Usuario" where email=%s', (EMAIL,)).fetchone()
    agora = int(time.time())
    corpo = _b64(json.dumps({"alg": "HS256"}).encode()) + "." + _b64(
        json.dumps({"uid": uid, "v": v, "iat": agora, "exp": agora + 3600}).encode())
    assinatura = _b64(hmac.new(env["SESSION_SECRET"].encode(), corpo.encode(), hashlib.sha256).digest())
    return f"{corpo}.{assinatura}"


def cookie_django() -> str:
    u = Usuario.objects.get(email=EMAIL)
    s = SessionStore()
    s["uid"], s["v"] = u.pk, u.versao_sessao
    s.save()
    return s.session_key


def baixar(base: str, caminho: str, sessao: str, empresa: str) -> str:
    req = urllib.request.Request(base + caminho, headers={"Cookie": f"pp_sessao={sessao}; pp_empresa={empresa}"})
    with urllib.request.urlopen(req) as r:
        return r.read().decode("utf-8")


def _mascarar(no):
    if isinstance(no, str):
        return _TEMPO.sub("T", _DATA.sub("DATA", _ID.sub("ID", re.sub(r"localhost:\d+", "localhost", no))))
    tag, attrs, filhos = no
    attrs = tuple((k, _mascarar(v)) for k, v in attrs
                  if not (k == "name" and (v.startswith("$ACTION") or v == "csrfmiddlewaretoken"))
                  and not (tag == "form" and k in ("action", "method", "enctype")))
    filhos = tuple(_mascarar(f) for f in filhos
                   if not (not isinstance(f, str) and f[0] == "input" and dict(f[1]).get("type") == "hidden"
                           and (dict(f[1]).get("name", "").startswith("$ACTION") or dict(f[1]).get("name") == "csrfmiddlewaretoken")))
    return (tag, attrs, filhos)


def conteudo(html: str):
    p = _Arvore()
    p.feed(html)
    p.close()
    raiz = _limpar(p.raiz)

    def achar(no):
        if isinstance(no, str):
            return None
        if no[0] == "main" and ("class", "conteudo") in no[1]:
            return no
        for f in no[2]:
            r = achar(f)
            if r:
                return r
        return None

    return _mascarar(achar(raiz) or raiz)


def main(argv):
    empresa = "caddi"
    if argv and argv[0] == "--empresa":
        empresa, argv = argv[1], argv[2:]
    cn, cd = cookie_next(), cookie_django()
    falhas = 0
    for caminho in argv:
        cam_django, _, cam_next = caminho.partition("|")  # "caminho_django|caminho_next" quando os ids diferem
        a = conteudo(baixar(DJANGO, cam_django, cd, empresa))
        b = conteudo(baixar(NEXT, cam_next or cam_django, cn, empresa))
        d = primeira_diferenca(a, b)
        print(f"{'OK ' if d is None else 'DIF'} {caminho}" + ("" if d is None else f"\n    {d[:600]}"))
        falhas += d is not None
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
