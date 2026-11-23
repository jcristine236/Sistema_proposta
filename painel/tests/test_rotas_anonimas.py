"""Varredura: nenhuma rota do painel responde sem login; só as públicas abaixo ficam abertas."""

import re

from django.test import TestCase
from django.urls import URLPattern, URLResolver, get_resolver

# Abertas de propósito: a proposta do cliente (link sem login), as imagens dela, o rastreio e o
# aceite/recusa feitos pelo cliente, o webhook do D4Sign (protegido por token) e a tela de login.
PUBLICAS = {
    "p/x", "uploads/x", "api/rastreio", "api/propostas/x/decisao", "api/d4sign/webhook", "login", "",
}


def rotas(padroes=None, prefixo=""):
    for p in padroes if padroes is not None else get_resolver().url_patterns:
        if isinstance(p, URLResolver):
            yield from rotas(p.url_patterns, prefixo + str(p.pattern))
        elif isinstance(p, URLPattern):
            yield re.sub(r"<[^>]+>", "x", prefixo + str(p.pattern))


class RotasAnonimasTest(TestCase):
    def test_painel_exige_login(self):
        abertas = []
        for rota in rotas():
            if rota in PUBLICAS:
                continue
            for metodo in (self.client.get, self.client.post):
                r = metodo("/" + rota)
                bloqueada = r.status_code in (401, 403, 404, 405) or (
                    r.status_code == 302 and r["Location"].startswith("/login"))
                if not bloqueada:
                    abertas.append(f"{metodo.__name__.upper()} /{rota} -> {r.status_code}")
        self.assertEqual(abertas, [])

    def test_raiz_leva_ao_login(self):
        r = self.client.get("/", follow=True)
        self.assertEqual(r.redirect_chain[-1][0].split("?")[0], "/login")

    def test_sem_admin_do_django(self):
        from django.conf import settings
        self.assertNotIn("django.contrib.admin", settings.INSTALLED_APPS)
        self.assertEqual(self.client.get("/admin/login/").status_code, 404)
