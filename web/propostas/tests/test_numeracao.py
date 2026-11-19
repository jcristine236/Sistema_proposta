from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from zoneinfo import ZoneInfo

from django.db import connection
from django.test import TestCase, TransactionTestCase

from nucleo.models import Empresa
from propostas.numeracao import proximo_codigo

SP = ZoneInfo("America/Sao_Paulo")


def empresa(slug="caddi", prefixo="CAD"):
    return Empresa.objects.create(slug=slug, nome=slug, dominio_propostas=f"{slug}.x", prefixo=prefixo, tema={})


class NumeracaoTest(TestCase):
    def setUp(self):
        self.cad = empresa()
        self.agora = datetime(2026, 6, 1, 12, tzinfo=SP)

    def test_primeiro_e_1001(self):
        self.assertEqual(proximo_codigo(self.cad, self.agora), "CAD-2026-1001")

    def test_sequencia(self):
        proximo_codigo(self.cad, self.agora)
        self.assertEqual(proximo_codigo(self.cad, self.agora), "CAD-2026-1002")

    def test_separado_por_empresa(self):
        proximo_codigo(self.cad, self.agora)
        self.assertEqual(proximo_codigo(empresa("kolp", "KLP"), self.agora), "KLP-2026-1001")

    def test_reinicia_no_ano_novo(self):
        proximo_codigo(self.cad, self.agora)
        self.assertEqual(proximo_codigo(self.cad, datetime(2027, 1, 1, 0, 30, tzinfo=SP)), "CAD-2027-1001")

    def test_ano_pelo_fuso_de_brasilia(self):
        # 01/01/2027 01:00 UTC ainda é 31/12/2026 em Brasília
        self.assertEqual(proximo_codigo(self.cad, datetime(2027, 1, 1, 1, tzinfo=ZoneInfo("UTC"))), "CAD-2026-1001")


class NumeracaoConcorrenteTest(TransactionTestCase):
    def test_concorrente_sem_duplicar(self):
        cad = empresa()

        def gerar(_):
            try:
                return proximo_codigo(cad)
            finally:
                connection.close()

        with ThreadPoolExecutor(8) as ex:
            codigos = list(ex.map(gerar, range(8)))
        self.assertEqual(len(set(codigos)), 8)
