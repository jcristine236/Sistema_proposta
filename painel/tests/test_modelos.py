"""Modelos e seções modelo (src/app/admin/modelos/**)."""

import json

from nucleo.models import Empresa, LogAuditoria
from painel.tests.test_cadastros import SEM, Comum
from propostas.models import Modelo, SecaoModelo


class ListaTest(Comum):
    def setUp(self):
        super().setUp()
        self.login()

    def test_aba_modelos(self):
        r = self.client.get("/admin/modelos")
        html = r.content.decode()
        self.assertContains(r, "<h1>Modelos</h1>", html=False)
        n = Modelo.objects.filter(empresa=self.caddi).count()
        self.assertIn(f'class="aba on">Modelos de proposta ({n})</a>', html)
        self.assertIn("+ Novo modelo em branco", html)
        m = Modelo.objects.filter(empresa=self.caddi).first()
        self.assertIn(f'href="/admin/modelos/{m.pk}/editar">{m.nome}</a>', html)
        self.assertIn(f"{len(m.secoes)} seções · {len(m.campos)} campos", html)
        self.assertIn(f'href="/admin/propostas/nova/{m.pk}">Usar</a>', html)

    def test_aba_secoes(self):
        SecaoModelo.objects.create(empresa=self.caddi, nome="Minha FAQ", secao={"id": "faq-1", "tipo": "faq"})
        r = self.client.get("/admin/modelos?aba=secoes")
        html = r.content.decode()
        self.assertIn('class="aba on">Seções modelo (1)</a>', html)
        self.assertIn("<h2>Nova seção modelo</h2>", html)
        self.assertNotIn(">Capa</button>", html)
        self.assertIn(">Perguntas frequentes</button>", html)
        self.assertIn('value="Minha FAQ"', html)
        self.assertIn('<span class="chip">Perguntas frequentes</span>', html)

    def test_vazio(self):
        Modelo.objects.filter(empresa=self.caddi).delete()
        self.assertContains(self.client.get("/admin/modelos"), "Nenhum modelo ainda.")
        self.assertContains(self.client.get("/admin/modelos?aba=secoes"), "Nenhuma seção salva ainda.")

    def test_somente_leitura(self):
        self.vendedor()
        self.login(email="vend@x.com")
        html = self.client.get("/admin/modelos").content.decode()
        self.assertNotIn("+ Novo modelo em branco", html)
        self.assertNotIn(">Duplicar</button>", html)
        self.assertNotIn(">Excluir</button>", html)
        self.assertIn(">Ver</a>", html)
        self.assertIn(">Usar</a>", html)

    def test_redireciona_para_editar(self):
        m = Modelo.objects.filter(empresa=self.caddi).first()
        self.assertRedirects(self.client.get(f"/admin/modelos/{m.pk}"), f"/admin/modelos/{m.pk}/editar",
                             fetch_redirect_response=False)


class AcoesTest(Comum):
    def setUp(self):
        super().setUp()
        self.login()
        self.m = Modelo.objects.filter(empresa=self.caddi).first()
        self.outra = Empresa.objects.exclude(pk=self.caddi.pk).first()
        self.alheio = Modelo.objects.filter(empresa=self.outra).first()

    def test_criar_em_branco(self):
        r = self.client.post("/admin/modelos/novo")
        novo = Modelo.objects.filter(empresa=self.caddi, nome="Novo modelo").get()
        self.assertRedirects(r, f"/admin/modelos/{novo.pk}/editar", fetch_redirect_response=False)
        self.assertEqual([s["tipo"] for s in novo.secoes], ["capa", "fechamento"])
        self.assertEqual(novo.campos[0], {"id": "cliente", "tipo": "contato", "rotulo": "Nome do cliente", "obrigatorio": True})
        self.assertEqual(novo.precificacao, {})
        self.assertEqual(novo.tipo_solucao, "personalizado")
        self.assertTrue(LogAuditoria.objects.filter(acao="CRIAR", entidade="Modelo", entidade_id=novo.pk).exists())

    def test_duplicar(self):
        r = self.client.post(f"/admin/modelos/{self.m.pk}/duplicar")
        copia = Modelo.objects.get(empresa=self.caddi, nome=f"{self.m.nome} (cópia)")
        self.assertRedirects(r, f"/admin/modelos/{copia.pk}/editar", fetch_redirect_response=False)
        self.assertEqual(copia.secoes, self.m.secoes)
        self.assertTrue(LogAuditoria.objects.filter(descricao=f"Cópia de {self.m.nome}").exists())

    def test_alternar_e_excluir(self):
        self.client.post(f"/admin/modelos/{self.m.pk}/alternar")
        self.assertFalse(Modelo.objects.get(pk=self.m.pk).ativo)
        self.assertTrue(LogAuditoria.objects.filter(acao="DESATIVAR", entidade_id=self.m.pk).exists())
        html = self.client.get("/admin/modelos").content.decode()
        self.assertIn('<span class="status">Inativo</span>', html)
        r = self.client.post(f"/admin/modelos/{self.m.pk}/excluir")
        self.assertRedirects(r, "/admin/modelos", fetch_redirect_response=False)
        self.assertFalse(Modelo.objects.filter(pk=self.m.pk).exists())

    def test_outra_empresa_nao_muda(self):
        for acao in ("duplicar", "alternar", "excluir"):
            self.client.post(f"/admin/modelos/{self.alheio.pk}/{acao}")
        self.assertTrue(Modelo.objects.get(pk=self.alheio.pk).ativo)
        self.assertFalse(Modelo.objects.filter(nome=f"{self.alheio.nome} (cópia)").exists())

    def test_sem_permissao(self):
        self.leitura()
        self.login(email="leitura@x.com")
        r = self.client.post(f"/admin/modelos/{self.m.pk}/excluir")
        self.assertRedirects(r, "/admin/sem-permissao", fetch_redirect_response=False)
        self.assertTrue(Modelo.objects.filter(pk=self.m.pk).exists())

    def test_secoes(self):
        r = self.client.post("/admin/modelos/secoes/nova/faq")
        sec = SecaoModelo.objects.get(empresa=self.caddi)
        self.assertRedirects(r, f"/admin/modelos/secoes/{sec.pk}", fetch_redirect_response=False)
        self.assertEqual((sec.nome, sec.secao["tipo"]), ("Perguntas frequentes", "faq"))
        self.client.post("/admin/modelos/secoes/nova/inexistente")
        self.assertTrue(SecaoModelo.objects.filter(nome="Texto", secao__tipo="texto").exists())
        self.client.post(f"/admin/modelos/secoes/{sec.pk}/renomear", {"nome": "  FAQ padrão  "})
        self.assertEqual(SecaoModelo.objects.get(pk=sec.pk).nome, "FAQ padrão")
        self.client.post(f"/admin/modelos/secoes/{sec.pk}/renomear", {"nome": "  "})
        self.assertEqual(SecaoModelo.objects.get(pk=sec.pk).nome, "FAQ padrão")
        self.client.post(f"/admin/modelos/secoes/{sec.pk}/excluir")
        self.assertFalse(SecaoModelo.objects.filter(pk=sec.pk).exists())
        self.assertTrue(LogAuditoria.objects.filter(acao="EXCLUIR", entidade="SecaoModelo").exists())

    def test_secao_outra_empresa(self):
        sec = SecaoModelo.objects.create(empresa=self.outra, nome="Alheia", secao={"id": "faq-1", "tipo": "faq"})
        self.client.post(f"/admin/modelos/secoes/{sec.pk}/renomear", {"nome": "X"})
        self.client.post(f"/admin/modelos/secoes/{sec.pk}/excluir")
        self.assertEqual(SecaoModelo.objects.get(pk=sec.pk).nome, "Alheia")
        self.assertEqual(self.client.get(f"/admin/modelos/secoes/{sec.pk}").status_code, 404)


class EditorTest(Comum):
    def setUp(self):
        super().setUp()
        self.login()
        self.m = Modelo.objects.filter(empresa=self.caddi).first()

    def post(self, url, corpo, client=None):
        return (client or self.client).post(url, json.dumps(corpo) if not isinstance(corpo, str) else corpo,
                                            content_type="application/json")

    def dados(self, **kw):
        return {"nome": self.m.nome, "descricao": "", "tipoSolucao": self.m.tipo_solucao, "validadeDias": 15,
                "campos": self.m.campos, "secoes": self.m.secoes, "precificacao": self.m.precificacao, **kw}

    def test_tela(self):
        r = self.client.get(f"/admin/modelos/{self.m.pk}/editar")
        self.assertContains(r, 'id="config-editor"')
        self.assertContains(r, "js/editor-modelo.js")
        self.assertContains(r, "css/proposta.css")
        self.assertEqual(self.client.get("/admin/modelos/nao-existe/editar").status_code, 404)

    def test_salvar(self):
        r = self.post(f"/admin/modelos/{self.m.pk}/editar", {"modelo": self.dados(nome="  Novo nome  ", validadeDias="400")})
        self.assertEqual(r.json(), {"id": self.m.pk})
        m = Modelo.objects.get(pk=self.m.pk)
        self.assertEqual((m.nome, m.validade_dias, m.descricao), ("Novo nome", 365, None))
        self.assertTrue(LogAuditoria.objects.filter(acao="EDITAR", entidade="Modelo", entidade_id=m.pk).exists())

    def test_erros(self):
        url = f"/admin/modelos/{self.m.pk}/editar"
        self.assertEqual(self.post(url, {"modelo": self.dados(nome=" ")}).json(), {"erro": "Dê um nome ao modelo."})
        campos = [{"id": "a", "tipo": "texto", "rotulo": "x"}, {"id": "a", "tipo": "texto", "rotulo": "y"}]
        self.assertEqual(self.post(url, {"modelo": self.dados(campos=campos)}).json(), {"erro": "Variável repetida: a"})
        self.assertEqual(self.post(url, {"modelo": self.dados(secoes=[{"id": "a", "tipo": "texto", "capitulo": None}])}).json(),
                         {"erro": "Seção inválida: Expected string, received null"})
        self.assertEqual(self.post(url, {"modelo": self.dados(secoes=[{"id": "a", "tipo": "texto", "t": "x" * 7000, "u": "y" * 7000}] * 60)}).json(),
                         {"erro": "Modelo grande demais."})
        self.assertEqual(self.post(url, "{quebrado").json(), {"erro": "Dê um nome ao modelo."})
        alheio = Modelo.objects.exclude(empresa=self.caddi).first()
        self.assertEqual(self.post(f"/admin/modelos/{alheio.pk}/editar", {"modelo": self.dados()}).json(),
                         {"erro": "Modelo não encontrado."})

    def test_somente_ver(self):
        self.vendedor()
        self.login(email="vend@x.com")
        self.assertEqual(self.client.get(f"/admin/modelos/{self.m.pk}/editar").status_code, 200)
        r = self.post(f"/admin/modelos/{self.m.pk}/editar", {"modelo": self.dados(nome="X")})
        self.assertEqual((r.status_code, r.json()), (403, {"erro": SEM}))
        r = self.post("/admin/modelos/secoes/favorita", {"nome": "X", "secao": {"id": "a", "tipo": "texto"}})
        self.assertEqual(r.status_code, 403)

    def test_secao(self):
        sec = SecaoModelo.objects.create(empresa=self.caddi, nome="FAQ", secao={"id": "faq-1", "tipo": "faq"})
        self.assertContains(self.client.get(f"/admin/modelos/secoes/{sec.pk}"), 'id="config-editor"')
        r = self.post(f"/admin/modelos/secoes/{sec.pk}", {"nome": "FAQ 2", "secao": {"id": "faq-1", "tipo": "faq", "titulo": "T"}})
        self.assertEqual(r.json(), {"id": sec.pk})
        sec.refresh_from_db()
        self.assertEqual((sec.nome, sec.secao["titulo"]), ("FAQ 2", "T"))
        self.assertEqual(self.post(f"/admin/modelos/secoes/{sec.pk}", {"nome": "", "secao": {}}).json(), {"erro": "Dê um nome à seção."})

    def test_favorita(self):
        r = self.post("/admin/modelos/secoes/favorita", {"nome": "Capa padrão", "secao": {"id": "capa-1", "tipo": "capa"}})
        sec = SecaoModelo.objects.get(nome="Capa padrão")
        self.assertEqual(r.json(), {"id": sec.pk})
        self.assertTrue(LogAuditoria.objects.filter(acao="CRIAR", entidade="SecaoModelo").exists())

    def test_render(self):
        secoes = [{"id": "texto-1", "tipo": "texto", "titulo": "Olá {{cliente}}", "paragrafos": ["P"]},
                  {"id": "x", "tipo": "inexistente"}, "lixo",
                  {"id": "cl", "tipo": "campoLista", "campo": "nada"}]
        r = self.post("/admin/modelos/render", {"campos": self.m.campos, "precificacao": self.m.precificacao, "secoes": secoes})
        blocos = r.json()["blocos"]
        self.assertEqual(len(blocos), 4)
        self.assertTrue(blocos[0].startswith('<div class="pp previa" style="'))
        self.assertIn("Olá Cliente Exemplo", blocos[0])
        self.assertEqual(blocos[1:3], ["", ""])
        self.assertRegex(blocos[3], r'^<div class="pp previa" style="[^"]*"></div>$')  # lista vazia: só a moldura
        r = self.post("/admin/modelos/render", {"campos": self.m.campos, "precificacao": self.m.precificacao,
                                                "secoes": self.m.secoes, "completa": True})
        self.assertIn("Prévia do modelo com valores de exemplo", r.json()["html"])

    def test_render_entrada_ruim(self):
        for corpo in ("{x", "[]", {"campos": "x", "precificacao": [], "secoes": {}},
                      {"campos": [{"id": 1}], "secoes": [{"id": "a", "tipo": "capa", "selos": "x"}]}):
            r = self.post("/admin/modelos/render", corpo)
            self.assertEqual(r.status_code, 200, corpo)

    def test_inteiro_gigante_nao_da_500(self):
        corpo = '{"modelo": {"nome": "x", "validadeDias": 1' + "0" * 400 + ', "campos": [], "secoes": [], "precificacao": {}}}'
        r = self.post(f"/admin/modelos/{self.m.pk}/editar", corpo)
        self.assertEqual(r.json(), {"id": self.m.pk})
        self.assertEqual(Modelo.objects.get(pk=self.m.pk).validade_dias, 365)

    def test_render_limpa_link_perigoso(self):
        s = {"id": "it-1", "tipo": "imagemTexto", "titulo": "T", "botaoTexto": "Ir", "botaoUrl": "javascript:alert(1)"}
        r = self.post("/admin/modelos/render", {"campos": [], "precificacao": {}, "secoes": [s]})
        self.assertNotIn("javascript:", r.json()["blocos"][0])
        r = self.post("/admin/modelos/render", {"campos": [], "precificacao": {}, "secoes": [s], "completa": True})
        self.assertNotIn("javascript:", r.json()["html"])
