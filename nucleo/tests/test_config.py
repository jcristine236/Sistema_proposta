import re

from django.conf import settings
from django.db import connection
from django.test import SimpleTestCase, TestCase

from nucleo.ids import novo_id


class ConfigTest(TestCase):
    def test_banco_e_postgres(self):
        self.assertEqual(connection.vendor, "postgresql")


class ConfigSimplesTest(SimpleTestCase):
    def test_fuso(self):
        self.assertEqual(settings.TIME_ZONE, "America/Sao_Paulo")
        self.assertTrue(settings.USE_TZ)

    def test_novo_id(self):
        a, b = novo_id(), novo_id()
        self.assertRegex(a, re.compile(r"^[0-9a-f]{32}$"))
        self.assertNotEqual(a, b)
