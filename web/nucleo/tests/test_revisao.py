"""Correções da revisão final da etapa 1."""

from concurrent.futures import ThreadPoolExecutor

from django.core.management import call_command
from django.db import connection
from django.test import Client, TransactionTestCase, override_settings

from nucleo.limite import permitir
from nucleo.models import Usuario


def _fechando(fn):
    def envolvida(*a):
        try:
            return fn(*a)
        finally:
            connection.close()

    return envolvida


class LimiteAtomicoTest(TransactionTestCase):
    def test_paralelo_respeita_o_limite(self):
        with ThreadPoolExecutor(10) as ex:
            r = list(ex.map(_fechando(lambda _: permitir("paralelo", 3, 60)), range(10)))
        self.assertEqual(r.count(True), 3)

    def test_muitas_chaves_nao_apagam_o_bloqueio(self):
        for _ in range(3):
            permitir("alvo", 3, 60)
        for i in range(400):
            permitir(f"outra-{i}", 3, 60)
        self.assertFalse(permitir("alvo", 3, 60))


@override_settings(ALLOW_ANY_HOST=True)
class FalhasParalelasTest(TransactionTestCase):
    def test_cinco_falhas_paralelas_bloqueiam(self):
        call_command("semear", verbosity=0)

        def tentar(_):
            return Client().post("/login", {"email": "admin@propostas.local", "senha": "errada-123456"}).status_code

        with ThreadPoolExecutor(5) as ex:
            list(ex.map(_fechando(tentar), range(5)))
        self.assertIsNotNone(Usuario.objects.get(email="admin@propostas.local").bloqueado_ate)


@override_settings(ALLOW_ANY_HOST=True)
class WhatsappContaTest(TransactionTestCase):
    def test_whatsapp_de_20_digitos(self):
        call_command("semear", verbosity=0)
        u = Usuario.objects.get(email="admin@propostas.local")
        u.set_password("senha-boa-123")
        u.trocar_senha = False
        u.save()
        c = Client()
        c.post("/login", {"email": "admin@propostas.local", "senha": "senha-boa-123"})
        r = c.post("/admin/conta", {"nome": "Admin", "whatsapp": "5" * 20})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(Usuario.objects.get(pk=u.pk).whatsapp, "5" * 20)
