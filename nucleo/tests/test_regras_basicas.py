"""Permissões, política de senha, formatação e tema — valores de referência do Next."""

from datetime import datetime
from types import SimpleNamespace
from zoneinfo import ZoneInfo

from django.test import SimpleTestCase

from nucleo.formato import brl, data_br, data_hora_br, duracao, numero_br, slugify_br
from nucleo.permissoes import PERFIS, perfil_de, pode, sanitizar_permissoes
from nucleo.senha import validar_senha
from nucleo.tema import TEMA_PADRAO, tema_de, variaveis_css

NBSP = "\u00a0"


def usuario(perm=None, sup=False):
    return SimpleNamespace(super_admin=sup, permissoes=perm or {})


class PermissoesTest(SimpleTestCase):
    def test_super_pode_tudo(self):
        self.assertTrue(pode(usuario(sup=True), "usuarios", "excluir"))

    def test_vendedor(self):
        v = usuario(PERFIS["vendedor"]["permissoes"])
        self.assertTrue(pode(v, "propostas", "criar"))
        self.assertFalse(pode(v, "usuarios", "ver"))
        self.assertFalse(pode(v, "propostas", "excluir"))

    def test_sanitizar_implica_ver(self):
        p = sanitizar_permissoes({"modulos": {"propostas": {"editar": True}}})
        self.assertEqual(p, {"modulos": {"propostas": {"ver": True, "editar": True}}, "propostasDeTodos": False})

    def test_sanitizar_descarta_desconhecidos(self):
        p = sanitizar_permissoes({"modulos": {"painel": {"excluir": True}, "xyz": {"ver": True}}})
        self.assertEqual(p["modulos"], {})

    def test_perfil_de(self):
        self.assertEqual(perfil_de(usuario(sup=True)), "Superadministrador")
        self.assertEqual(perfil_de(usuario(PERFIS["gerente"]["permissoes"])), "Gerente comercial")
        self.assertEqual(perfil_de(usuario({"modulos": {"painel": {"ver": True}}})), "Personalizado")

    def test_perfis_e_ordem(self):
        self.assertEqual(list(PERFIS), ["administrador", "gerente", "vendedor", "leitura"])
        leitura = PERFIS["leitura"]["permissoes"]["modulos"]
        self.assertNotIn("usuarios", leitura)
        self.assertEqual(leitura["propostas"], {"ver": True})


class SenhaTest(SimpleTestCase):
    def test_mensagens(self):
        self.assertEqual(validar_senha("curta1"), "A senha precisa ter pelo menos 10 caracteres.")
        self.assertEqual(validar_senha("somenteletras"), "A senha precisa ter letras e números.")
        self.assertEqual(validar_senha("a1" * 101), "Senha longa demais.")
        self.assertIsNone(validar_senha("boa-senha-123"))


class FormatoTest(SimpleTestCase):
    def test_brl(self):
        self.assertEqual(brl(1234.5), f"R${NBSP}1.234,50")
        self.assertEqual(brl(-3), f"-R${NBSP}3,00")
        self.assertEqual(brl(0.005), f"R${NBSP}0,01")
        self.assertEqual(brl(float("nan")), f"R${NBSP}0,00")

    def test_numero_br(self):
        self.assertEqual(numero_br(1234.567), "1.234,567")
        self.assertEqual(numero_br(1234.5678), "1.234,568")
        self.assertEqual(numero_br(1000000), "1.000.000")

    def test_datas(self):
        self.assertEqual(data_br("2026-11-19"), "19/11/2026")
        self.assertEqual(data_br(None), "sem data")
        self.assertEqual(data_hora_br(None), "-")
        d = datetime(2026, 11, 19, 15, 4, tzinfo=ZoneInfo("UTC"))
        self.assertEqual(data_hora_br(d), "19/11/2026, 12:04")
        self.assertEqual(data_br(d), "19/11/2026")

    def test_duracao(self):
        self.assertEqual(duracao(45), "45s")
        self.assertEqual(duracao(125), "2min 5s")
        self.assertEqual(duracao(3720), "1h 2min")

    def test_slugify(self):
        self.assertEqual(slugify_br("Água & Cia Ltda"), "agua-cia-ltda")
        self.assertEqual(slugify_br("!!!"), "cliente")
        self.assertEqual(len(slugify_br("x" * 80)), 40)


class TemaTest(SimpleTestCase):
    def test_cor_invalida_volta_ao_padrao(self):
        self.assertEqual(tema_de({"primaria": "red"})["primaria"], TEMA_PADRAO["primaria"])
        self.assertEqual(tema_de(None)["logo"], "")

    def test_variaveis_css(self):
        css = variaveis_css(tema_de({}))
        self.assertIn("--primary:#0D1B3E", css)
        self.assertIn("--font-title:'Space Grotesk', system-ui, sans-serif", css)
