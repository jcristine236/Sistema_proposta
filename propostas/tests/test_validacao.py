"""Validação do que o editor de modelos envia (src/lib/validacao.ts)."""

import re

from django.test import SimpleTestCase

from propostas import blocos
from propostas.regras.validacao import (
    conferir_valores, tamanho_ok, validar_campos, validar_precificacao, validar_secao, validar_secoes,
)


class BlocosTest(SimpleTestCase):
    def test_catalogo(self):
        self.assertEqual(len(blocos.BLOCO), 20)
        self.assertEqual(blocos.NOMES["campoLista"], "Lista preenchível")
        self.assertIn("capa", blocos.TIPOS_SECAO)

    def test_padrao_e_novo_id(self):
        s = blocos.padrao("capa")
        self.assertRegex(s["id"], r"^capa-[a-z0-9]{6}$")
        self.assertEqual(s["titulo"], "Proposta\nComercial")
        s["selos"].append("x")  # cópia, não altera o catálogo
        self.assertEqual(len(blocos.BLOCO["capa"]["padrao"]["selos"]), 1)


class SecaoTest(SimpleTestCase):
    def test_ok(self):
        r = validar_secao({"id": "texto-abc", "tipo": "texto", "extra": [1, 2]})
        self.assertEqual(r, {"ok": {"id": "texto-abc", "tipo": "texto", "extra": [1, 2]}})

    def test_id_invalido(self):
        self.assertEqual(validar_secao({"id": "1x", "tipo": "texto"}), {"erro": "Seção inválida: Identificador inválido"})
        self.assertEqual(validar_secao({"id": "ab\n", "tipo": "texto"}), {"erro": "Seção inválida: Identificador inválido"})
        self.assertEqual(validar_secao({"tipo": "texto"}), {"erro": "Seção inválida: Required"})

    def test_tipo_desconhecido(self):
        r = validar_secao({"id": "a", "tipo": "xyz"})
        self.assertTrue(r["erro"].startswith("Seção inválida: Invalid enum value. Expected 'capa' | 'titulo'"))
        self.assertTrue(r["erro"].endswith(", received 'xyz'"))

    def test_null_em_opcional(self):
        self.assertEqual(validar_secao({"id": "a", "tipo": "texto", "capitulo": None}),
                         {"erro": "Seção inválida: Expected string, received null"})

    def test_limites_opcionais(self):
        self.assertEqual(validar_secao({"id": "a", "tipo": "texto", "numero": "1234567"}),
                         {"erro": "Seção inválida: String must contain at most 6 character(s)"})
        self.assertEqual(validar_secao({"id": "a", "tipo": "texto", "mostrarSe": "a b"}), {"erro": "Seção inválida: Invalid"})
        self.assertIn("ok", validar_secao({"id": "a", "tipo": "texto", "mostrarSe": "!obs.x"}))

    def test_nao_objeto(self):
        self.assertEqual(validar_secao("x"), {"erro": "Seção inválida: Expected object, received string"})
        self.assertEqual(validar_secao([]), {"erro": "Seção inválida: Expected object, received array"})

    def test_limpa_urls(self):
        r = validar_secao({"id": "a", "tipo": "imagemTexto", "imagem": "javascript:alert(1)", "botaoUrl": "data:x"})
        self.assertEqual((r["ok"]["imagem"], r["ok"]["botaoUrl"]), ("", ""))
        r = validar_secao({"id": "a", "tipo": "video", "url": "https://evil.com/x"})
        self.assertEqual(r["ok"]["url"], "")
        r = validar_secao({"id": "a", "tipo": "imagem", "imagem": "/uploads/x.png"})
        self.assertEqual(r["ok"]["imagem"], "/uploads/x.png")

    def test_ids_repetidos_renomeados(self):
        r = validar_secoes([{"id": "a", "tipo": "texto"}, {"id": "a", "tipo": "faq"}])
        self.assertEqual(r["ok"][0]["id"], "a")
        self.assertRegex(r["ok"][1]["id"], r"^faq-[a-z0-9]{6}$")
        self.assertEqual(validar_secoes({}), {"erro": "Lista de seções inválida."})
        self.assertEqual(validar_secoes([{"id": "a", "tipo": "texto"}] * 61), {"erro": "Lista de seções inválida."})


class ValoresTest(SimpleTestCase):
    def test_limites(self):
        self.assertEqual(conferir_valores("x" * 8001), "Texto muito longo.")
        self.assertIsNone(conferir_valores("x" * 8000))
        self.assertEqual(conferir_valores([0] * 201), "Lista com itens demais.")
        self.assertEqual(conferir_valores({str(i): 1 for i in range(61)}), "Objeto com campos demais.")
        self.assertEqual(conferir_valores(float("inf")), "Número inválido.")
        self.assertEqual(conferir_valores({"__proto__": 1}), "Campo inválido.")
        fundo = 1
        for _ in range(9):
            fundo = [fundo]
        self.assertEqual(conferir_valores(fundo), "Estrutura aninhada demais.")
        self.assertIsNone(conferir_valores([[[[[[[[1]]]]]]]]))

    def test_emoji_conta_como_dois(self):
        # String.length do JS conta unidades UTF-16
        self.assertEqual(conferir_valores("😀" * 4001), "Texto muito longo.")

    def test_tamanho(self):
        self.assertTrue(tamanho_ok([], ["x" * 1000]))
        self.assertFalse(tamanho_ok(["x" * 600_000]))


class CamposTest(SimpleTestCase):
    def test_ok(self):
        campos = [{"id": "cliente", "tipo": "contato", "rotulo": "Cliente", "x": 1}]
        self.assertEqual(validar_campos(campos), {"ok": campos})

    def test_erros(self):
        self.assertEqual(validar_campos("x"), {"erro": "Lista de campos inválida."})
        self.assertEqual(validar_campos([{"id": "Ab", "tipo": "texto", "rotulo": "x"}]),
                         {"erro": "A variável do campo deve começar com letra e ter só letras, números ou _"})
        self.assertEqual(validar_campos([{"id": "a", "tipo": "texto", "rotulo": ""}]), {"erro": "Todo campo precisa de rótulo"})
        dup = [{"id": "a", "tipo": "texto", "rotulo": "x"}, {"id": "a", "tipo": "numero", "rotulo": "y"}]
        self.assertEqual(validar_campos(dup), {"erro": "Variável repetida: a"})
        self.assertEqual(validar_campos([{"id": "calc", "tipo": "texto", "rotulo": "x"}]),
                         {"erro": "“calc” é um nome reservado. Escolha outra variável."})
        r = validar_campos([{"id": "a", "tipo": "nada", "rotulo": "x"}])
        self.assertTrue(re.match(r"Invalid enum value\. Expected 'contato' \| 'texto'", r["erro"]))


class PrecificacaoTest(SimpleTestCase):
    CAMPOS = [{"id": "plano"}, {"id": "qtd"}, {"id": "desc"}, {"id": "impl"}]

    def test_limpa(self):
        p = {
            "recorrente": {"base": {"campo": "plano"}, "extras": {"campo": "nao"},
                           "adicionais": [{"campo": "qtd", "inclusos": "3", "valorUnitario": "abc", "unidade": ["u"]},
                                          {"campo": "sumiu"}]},
            "desconto": {"campo": "desc", "limitePct": 15},
            "unicos": [{"campo": "impl", "rotulo": None}, {"campo": ""}],
            "lixo": 1,
        }
        self.assertEqual(validar_precificacao(p, self.CAMPOS), {"ok": {
            "recorrente": {"base": {"campo": "plano"}, "adicionais": [{
                "campo": "qtd", "inclusos": 3, "valorUnitario": 0, "rotuloSingular": "", "rotuloPlural": "",
                "rotuloLinha": "", "unidade": ["u", ""]}]},
            "desconto": {"campo": "desc", "limitePct": 15},
            "unicos": [{"campo": "impl", "rotulo": ""}],
        }})

    def test_vazio_e_sem_base(self):
        self.assertEqual(validar_precificacao(None, []), {"ok": {"unicos": []}})
        self.assertEqual(validar_precificacao({"recorrente": {"base": {"campo": "x"}}, "desconto": {"campo": "desc"}}, self.CAMPOS),
                         {"ok": {"desconto": {"campo": "desc"}, "unicos": []}})
