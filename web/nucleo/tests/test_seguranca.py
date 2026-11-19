import re

from django.test import TestCase, override_settings


class CabecalhosTest(TestCase):
    def test_csp_com_nonce_igual_ao_html(self):
        r = self.client.get("/login")
        csp = r["Content-Security-Policy"]
        nonce = re.search(r"'nonce-([^']+)'", csp).group(1)
        self.assertIn(f"script-src 'self' 'nonce-{nonce}' 'strict-dynamic'", csp)
        self.assertIn("frame-ancestors 'none'", csp)
        self.assertIn("frame-src https://www.youtube-nocookie.com https://player.vimeo.com", csp)
        self.assertContains(r, f'nonce="{nonce}"')

    def test_demais_cabecalhos(self):
        r = self.client.get("/login")
        self.assertEqual(r["X-Frame-Options"], "DENY")
        self.assertEqual(r["X-Content-Type-Options"], "nosniff")
        self.assertEqual(r["Referrer-Policy"], "strict-origin-when-cross-origin")
        self.assertEqual(r["Permissions-Policy"], "camera=(), microphone=(), geolocation=(), payment=(), usb=()")
        self.assertEqual(r["Cross-Origin-Opener-Policy"], "same-origin")
        self.assertEqual(r["Cache-Control"], "no-store")

    @override_settings(MODO_HTTP=True)
    def test_sem_hsts_em_modo_http(self):
        r = self.client.get("/login")
        self.assertNotIn("Strict-Transport-Security", r)
        self.assertNotIn("upgrade-insecure-requests", r["Content-Security-Policy"])

    @override_settings(MODO_HTTP=False)
    def test_hsts_com_https(self):
        r = self.client.get("/login", secure=True)
        self.assertEqual(r["Strict-Transport-Security"], "max-age=31536000; includeSubDomains")
        self.assertIn("upgrade-insecure-requests", r["Content-Security-Policy"])

    def test_estaticos_sem_csp(self):
        r = self.client.get("/empresas/caddi/logo.png")
        self.assertEqual(r.status_code, 200)
        self.assertNotIn("Content-Security-Policy", r)

    def test_nonce_muda(self):
        a = self.client.get("/login")["Content-Security-Policy"]
        b = self.client.get("/login")["Content-Security-Policy"]
        self.assertNotEqual(a, b)
