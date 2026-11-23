import json

from nucleo.models import LogAuditoria
from painel.tests.test_login import Base
from propostas.models import Contato, Evento, Modelo, Proposta


def jpost(client, url, corpo):
    return client.post(url, json.dumps(corpo), content_type="application/json")


class FormularioTest(Base):
    def setUp(self):
        super().setUp()
        self.login()
        self.m = Modelo.objects.get(empresa=self.caddi, tipo_solucao="servidor-nuvem")

    def dados(self, **extra):
        base = {"cliente": {"nome": "Acme Ltda"}, "plano": {"codigo": "avancado"}, "dispositivos": 8,
                "desconto": {"tipo": "pct", "valor": 10}, "validade": "2099-12-31", "implantacao": 960}
        return {**base, **extra}

    def test_tela_nova(self):
        r = self.client.get(f"/admin/propostas/nova/{self.m.pk}")
        self.assertContains(r, "Nova proposta · Servidor em nuvem")
        self.assertContains(r, "Gerar link da proposta")
        self.assertContains(r, 'id="config-formulario"')
        self.assertContains(r, "<h2>Resumo financeiro</h2>")

    def test_modelo_inativo_404(self):
        Modelo.objects.filter(pk=self.m.pk).update(ativo=False)
        self.assertEqual(self.client.get(f"/admin/propostas/nova/{self.m.pk}").status_code, 404)

    def test_criar(self):
        campos = {c["id"]: c["tipo"] for c in self.m.campos}
        self.assertEqual(campos.get("cliente"), "contato")
        r = jpost(self.client, f"/admin/propostas/nova/{self.m.pk}/criar", {"dados": self.dados(lixo="x")})
        j = r.json()
        self.assertRegex(j["codigo"], r"^CAD-\d{4}-1001$")
        self.assertRegex(j["link"], r"^http://localhost:8000/p/acme-ltda-[0-9a-f]{12}$|/p/acme-ltda-[0-9a-f]{12}$")
        p = Proposta.objects.get(pk=j["id"])
        self.assertEqual(p.cliente_nome, "Acme Ltda")
        self.assertEqual(p.titulo, "Servidor em nuvem — Acme Ltda")
        self.assertNotIn("lixo", p.dados)
        self.assertEqual(p.dados["cliente"]["contatoId"], p.contato_id)
        self.assertEqual(p.snapshot["modeloNome"], "Servidor em nuvem")
        self.assertTrue(all(x["categoria"] == "planos-nuvem" for x in p.snapshot["catalogo"]))
        self.assertGreater(float(p.valor_mensal), 0)
        self.assertEqual(str(p.valida_ate.date()), "2100-01-01")  # 23:59:59 -03:00 = 02:59 UTC do dia seguinte
        self.assertTrue(Evento.objects.filter(proposta=p, tipo="CRIADA").exists())
        self.assertTrue(LogAuditoria.objects.filter(acao="CRIAR", entidade="Proposta").exists())
        # o mesmo cliente (ignorando maiúsculas) reaproveita o contato
        j2 = jpost(self.client, f"/admin/propostas/nova/{self.m.pk}/criar", {"dados": self.dados(cliente={"nome": "ACME LTDA"})}).json()
        self.assertEqual(Proposta.objects.get(pk=j2["id"]).contato_id, p.contato_id)
        self.assertEqual(Contato.objects.filter(empresa=self.caddi).count(), 1)

    def test_criar_obrigatorios(self):
        r = jpost(self.client, f"/admin/propostas/nova/{self.m.pk}/criar", {"dados": {}})
        self.assertTrue(any(e.startswith('Preencha o campo "') for e in r.json()["erros"]))
        self.assertEqual(Proposta.objects.count(), 0)

    def test_editar_e_reabrir(self):
        j = jpost(self.client, f"/admin/propostas/nova/{self.m.pk}/criar", {"dados": self.dados()}).json()
        Proposta.objects.filter(pk=j["id"]).update(status="RECUSADA", motivo_recusa="x", decisao_nome="y")
        r = self.client.get(f"/admin/propostas/{j['id']}/editar")
        self.assertContains(r, f"Editar proposta {j['codigo']}")
        self.assertContains(r, "Salvar alterações")
        j2 = jpost(self.client, f"/admin/propostas/{j['id']}/editar", {"dados": self.dados(dispositivos=20)}).json()
        self.assertEqual(j2["link"], j["link"])
        p = Proposta.objects.get(pk=j["id"])
        self.assertEqual((p.status, p.motivo_recusa, p.decisao_nome, p.dados["dispositivos"]), ("PUBLICADA", None, None, 20))
        self.assertTrue(Evento.objects.filter(proposta=p, tipo="EDITADA").exists())

    def test_aceita_nao_edita(self):
        j = jpost(self.client, f"/admin/propostas/nova/{self.m.pk}/criar", {"dados": self.dados()}).json()
        Proposta.objects.filter(pk=j["id"]).update(status="ACEITA")
        self.assertRedirects(self.client.get(f"/admin/propostas/{j['id']}/editar"), f"/admin/propostas/{j['id']}",
                             fetch_redirect_response=False)
        r = jpost(self.client, f"/admin/propostas/{j['id']}/editar", {"dados": self.dados()})
        self.assertEqual(r.json()["erros"], ["Proposta já aceita: não pode ser alterada. Duplique para criar uma nova versão."])

    def test_duplicar_sem_validade(self):
        j = jpost(self.client, f"/admin/propostas/nova/{self.m.pk}/criar", {"dados": self.dados(validade="2099-01-01")}).json()
        r = self.client.get(f"/admin/propostas/nova/{self.m.pk}?de={j['id']}")
        config = r.context["config"]
        self.assertEqual(config["dados"]["cliente"]["nome"], "Acme Ltda")
        self.assertNotEqual(config["dados"]["validade"], "2099-01-01")

    def test_calculo_e_previa(self):
        corpo = {"chave": {"modelo": self.m.pk}, "dados": self.dados()}
        j = jpost(self.client, "/admin/propostas/calculo", corpo).json()
        self.assertIn("Mensalidade final", j["resumo"])
        self.assertAlmostEqual(j["pct"], 10)
        h = jpost(self.client, "/admin/propostas/previa", corpo).json()["html"]
        self.assertIn('class="pp previa"', h)
        self.assertIn("Prévia · link final em propostas.caddi.com.br", h)

    def test_endpoints_exigem_login(self):
        self.client.post("/admin/sair")
        r = jpost(self.client, "/admin/propostas/calculo", {"chave": {"modelo": self.m.pk}, "dados": {}})
        self.assertEqual(r.status_code, 403)

    def test_aceite_durante_a_edicao(self):
        """O cliente aceita enquanto o vendedor está com a tela de edição aberta."""
        from propostas.servicos import editar_proposta
        j = jpost(self.client, f"/admin/propostas/nova/{self.m.pk}/criar", {"dados": self.dados()}).json()
        p = Proposta.objects.get(pk=j["id"])  # objeto lido antes do aceite
        Proposta.objects.filter(pk=p.pk).update(status="ACEITA")
        req = type("R", (), {"empresa": p.empresa, "usuario": p.autor})()
        self.assertIn("erros", editar_proposta(req, p, self.dados(dispositivos=20)))
        self.assertEqual(Proposta.objects.get(pk=p.pk).status, "ACEITA")

    def test_datas_impossiveis_nao_dao_500(self):
        for v in ("2026-02-31", "abc", "99999-01-01", 5, None):
            for url in ("/admin/propostas/calculo", "/admin/propostas/previa"):
                r = jpost(self.client, url, {"chave": {"modelo": self.m.pk}, "dados": self.dados(validade=v)})
                self.assertEqual(r.status_code, 200, (v, url))
            r = jpost(self.client, f"/admin/propostas/nova/{self.m.pk}/criar", {"dados": self.dados(validade=v)})
            self.assertLess(r.status_code, 500, v)

    def test_ano_fora_do_intervalo(self):
        r = jpost(self.client, f"/admin/propostas/nova/{self.m.pk}/criar", {"dados": self.dados(validade="9999-12-31")})
        self.assertTrue(any("Data inválida" in e for e in r.json()["erros"]))
