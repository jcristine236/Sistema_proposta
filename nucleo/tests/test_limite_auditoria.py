from unittest import mock

from django.core.cache import cache
from django.test import RequestFactory, TestCase

from nucleo import limite
from nucleo.auditoria import auditar
from nucleo.limite import ip_cliente, ip_original, permitir
from nucleo.models import LogAuditoria


class LimiteTest(TestCase):
    def setUp(self):
        cache.clear()

    def test_janela(self):
        self.assertEqual([permitir("x", 3, 60) for _ in range(4)], [True, True, True, False])
        self.assertTrue(permitir("y", 3, 60))

    def test_janela_desliza(self):
        with mock.patch.object(limite, "_agora", return_value=1000.0):
            for _ in range(3):
                permitir("z", 3, 60)
            self.assertFalse(permitir("z", 3, 60))
        with mock.patch.object(limite, "_agora", return_value=1061.0):
            self.assertTrue(permitir("z", 3, 60))

    def test_ip(self):
        rf = RequestFactory()
        r = rf.get("/", HTTP_X_FORWARDED_FOR="1.1.1.1, 2.2.2.2")
        self.assertEqual(ip_cliente(r), "2.2.2.2")
        self.assertEqual(ip_original(r), "1.1.1.1")
        self.assertEqual(ip_cliente(rf.get("/", HTTP_X_REAL_IP="3.3.3.3")), "3.3.3.3")
        self.assertEqual(ip_cliente(rf.get("/", REMOTE_ADDR="4.4.4.4")), "4.4.4.4")


class AuditoriaTest(TestCase):
    def test_corta_descricao_e_grava_ip(self):
        r = RequestFactory().get("/", REMOTE_ADDR="9.9.9.9")
        auditar(r, acao="LOGIN", descricao="x" * 600)
        log = LogAuditoria.objects.get()
        self.assertEqual(len(log.descricao), 500)
        self.assertEqual(log.ip, "9.9.9.9")

    def test_nao_levanta(self):
        r = RequestFactory().get("/")
        auditar(r, acao="EDITAR", entidade_id="y" * 5000)  # estoura a coluna: engolido
        self.assertEqual(LogAuditoria.objects.count(), 0)
