import json
from unittest import mock

from django.test import TestCase, override_settings

from nucleo.models import LimiteTaxa, Usuario
from propostas.models import Contato, Evento, Proposta, TempoSecao, Visualizacao
from publico.tests.fabrica import criar_proposta, semear

CNPJ = "11.222.333/0001-81"


def post(client, url, corpo, **extra):
    dados = corpo if isinstance(corpo, str) else json.dumps(corpo)
    return client.post(url, dados, content_type="application/json", **extra)


@override_settings(ALLOW_ANY_HOST=True)
class Base(TestCase):
    @classmethod
    def setUpTestData(cls):
        semear()

    def setUp(self):
        LimiteTaxa.objects.all().delete()
        self.p = criar_proposta()

    def abrir(self, viewer="v1", **extra):
        return post(self.client, "/api/rastreio", {"acao": "abrir", "slug": self.p.slug, "viewerId": viewer}, **extra)


class RastreioTest(Base):
    def test_abrir_primeira_vez(self):
        with mock.patch("publico.apis.avisar") as avisar:
            r = self.abrir(HTTP_USER_AGENT="UA", HTTP_X_FORWARDED_FOR="1.1.1.1, 2.2.2.2")
        self.assertEqual(r.status_code, 200)
        vid = r.json()["visualizacaoId"]
        v = Visualizacao.objects.get(pk=vid)
        self.assertEqual((v.viewer_id, v.user_agent, v.ip), ("v1", "UA", "1.1.1.1"))
        p = Proposta.objects.get(pk=self.p.pk)
        self.assertEqual(p.status, "ABERTA")
        self.assertIsNotNone(p.primeira_abertura_em)
        self.assertEqual(list(Evento.objects.filter(proposta=p).values_list("tipo", flat=True)), ["ABERTA"])
        avisar.assert_called_once()

    def test_novo_leitor_reaberta(self):
        self.abrir("v1")
        self.abrir("v1")
        self.abrir("v2")
        tipos = list(Evento.objects.filter(proposta=self.p).order_by("criado_em").values_list("tipo", "dados"))
        self.assertEqual(tipos, [("ABERTA", None), ("REABERTA", {"nome": "novo leitor"})])

    def test_visita_interna_nao_grava(self):
        u = Usuario.objects.get(email="admin@propostas.local")
        u.set_password("senha-boa-123")
        u.trocar_senha = False
        u.save()
        self.client.post("/login", {"email": u.email, "senha": "senha-boa-123"})
        r = self.abrir()
        self.assertEqual(r.json(), {"visualizacaoId": None, "interno": True})
        self.assertEqual(Visualizacao.objects.count(), 0)

    def test_tempo(self):
        vid = self.abrir().json()["visualizacaoId"]
        r = post(self.client, "/api/rastreio", {"acao": "tempo", "slug": self.p.slug, "visualizacaoId": vid, "total": 30,
                                                "secoes": {"capa": 10, "investimento": 20, "inexistente": 5, "solucao": 0}})
        self.assertEqual(r.json(), {"ok": True})
        post(self.client, "/api/rastreio", {"acao": "tempo", "slug": self.p.slug, "visualizacaoId": vid, "total": 5, "secoes": {"capa": 5}})
        self.assertEqual(Visualizacao.objects.get(pk=vid).tempo_total_seg, 35)
        self.assertEqual(dict(TempoSecao.objects.values_list("secao", "segundos")), {"capa": 15, "investimento": 20})

    def test_tempo_invalido(self):
        vid = self.abrir().json()["visualizacaoId"]
        base = {"acao": "tempo", "slug": self.p.slug, "visualizacaoId": vid, "secoes": {}}
        self.assertEqual(post(self.client, "/api/rastreio", {**base, "total": 601}).status_code, 400)
        self.assertEqual(post(self.client, "/api/rastreio", {**base, "total": 1.5}).status_code, 400)
        self.assertEqual(post(self.client, "/api/rastreio", {**base, "total": 1, "secoes": {"capa": 700}}).status_code, 400)
        self.assertEqual(post(self.client, "/api/rastreio", {**base, "total": 1, "visualizacaoId": "x"}).status_code, 404)
        self.assertEqual(post(self.client, "/api/rastreio", "{nao json").status_code, 400)
        self.assertEqual(post(self.client, "/api/rastreio", json.dumps({"x": "a" * 8001})).status_code, 413)
        self.assertEqual(Visualizacao.objects.get(pk=vid).tempo_total_seg, 0)

    @override_settings(ALLOW_ANY_HOST=False)
    def test_host_errado(self):
        self.assertEqual(self.abrir(HTTP_HOST="propostas.kolp.com.br").status_code, 404)

    def test_limite(self):
        for _ in range(240):
            post(self.client, "/api/rastreio", "{}")
        self.assertEqual(post(self.client, "/api/rastreio", "{}").status_code, 429)


class DecisaoTest(Base):
    def decidir(self, **corpo):
        return post(self.client, f"/api/propostas/{self.p.slug}/decisao", corpo)

    def test_comentar(self):
        Proposta.objects.filter(pk=self.p.pk).update(status="EXPIRADA")
        self.assertEqual(self.decidir(acao="comentar", nome="Ana").status_code, 400)
        r = self.decidir(acao="comentar", nome=" Ana ", email="a@b.com", texto="Dúvida?")
        self.assertEqual(r.json(), {"ok": True})
        e = Evento.objects.get(proposta=self.p, tipo="COMENTARIO")
        self.assertEqual(e.dados, {"nome": "Ana", "email": "a@b.com", "texto": "Dúvida?"})

    def test_recusar(self):
        self.assertEqual(self.decidir(acao="recusar", nome="Ana").json(), {"erro": "Selecione um motivo."})
        r = self.decidir(acao="recusar", nome="Ana", motivo="Preço acima do esperado")
        self.assertEqual(r.status_code, 200)
        p = Proposta.objects.get(pk=self.p.pk)
        self.assertEqual((p.status, p.decisao_nome, p.motivo_recusa, p.comentario_decisao), ("RECUSADA", "Ana", "Preço acima do esperado", None))
        r = self.decidir(acao="recusar", nome="Ana", motivo="x")
        self.assertEqual((r.status_code, r.json()), (409, {"erro": "Esta proposta já foi respondida."}))

    def test_aceitar_valida_tudo(self):
        r = self.decidir(acao="aceitar", cnpj="123", email="x", whatsapp="1")
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.json()["erro"], "Informe a razão social. CNPJ inválido. Informe o nome do sócio responsável. "
                                           "E-mail inválido. WhatsApp inválido (informe DDD + número).")

    def test_aceitar(self):
        with mock.patch("publico.apis.avisar") as avisar:
            r = self.decidir(acao="aceitar", razaoSocial="Exemplo SA", cnpj="11222333000181", nomeSocio="João",
                             email="Joao@X.com", whatsapp="11912345678", texto="Ok")
        self.assertEqual(r.json(), {"ok": True})
        p = Proposta.objects.get(pk=self.p.pk)
        dados = {"razaoSocial": "Exemplo SA", "cnpj": CNPJ, "nomeSocio": "João", "email": "joao@x.com", "whatsapp": "(11) 91234-5678"}
        self.assertEqual((p.status, p.decisao_nome, p.comentario_decisao, p.dados_contratacao), ("ACEITA", "João", "Ok", dados))
        self.assertEqual(Evento.objects.get(proposta=p, tipo="ACEITA").dados, {"nome": "João", **dados, "texto": "Ok"})
        c = Contato.objects.get(pk=p.contato_id)
        self.assertEqual((c.razao_social, c.cnpj, c.responsavel, c.email, c.celular), ("Exemplo SA", CNPJ, "João", "joao@x.com", "(11) 91234-5678"))
        self.assertTrue(avisar.call_args.kwargs.get("whatsapp"))

    def test_expirada_409(self):
        p = criar_proposta(validade="2020-01-15")
        r = post(self.client, f"/api/propostas/{p.slug}/decisao", {"acao": "recusar", "nome": "A", "motivo": "x"})
        self.assertEqual((r.status_code, r.json()), (409, {"erro": "Esta proposta expirou. Fale com quem a enviou."}))

    def test_dados_invalidos(self):
        self.assertEqual(self.decidir(acao="outra").json(), {"erro": "Dados inválidos."})
        self.assertEqual(self.decidir(acao="comentar", nome="a" * 121, texto="x").status_code, 400)
        self.assertEqual(post(self.client, "/api/propostas/nao-existe/decisao", {"acao": "comentar", "nome": "a", "texto": "b"}).status_code, 404)

    def test_limite(self):
        for _ in range(20):
            self.decidir(acao="outra")
        r = self.decidir(acao="outra")
        self.assertEqual((r.status_code, r.json()), (429, {"erro": "Muitas tentativas. Aguarde alguns minutos."}))


class EndurecimentoTest(Base):
    """Entradas maliciosas nas APIs públicas respondem 4xx, nunca 500."""

    def test_inteiro_gigante(self):
        vid = self.abrir().json()["visualizacaoId"]
        corpo = '{"acao":"tempo","slug":"%s","visualizacaoId":"%s","total":%s,"secoes":{}}' % (self.p.slug, vid, "9" * 400)
        self.assertEqual(post(self.client, "/api/rastreio", corpo).status_code, 400)

    def test_aninhamento_profundo(self):
        corpo = "[" * 3000 + "]" * 3000
        self.assertEqual(post(self.client, "/api/rastreio", corpo[:7990]).status_code, 400)
        self.assertEqual(post(self.client, f"/api/propostas/{self.p.slug}/decisao", corpo).status_code, 400)

    def test_decisao_corpo_grande(self):
        r = post(self.client, f"/api/propostas/{self.p.slug}/decisao", {"acao": "comentar", "nome": "a", "texto": "b", "x": "y" * 20000})
        self.assertEqual(r.status_code, 413)

    def test_ip_longo(self):
        r = self.abrir(HTTP_X_FORWARDED_FOR="9" * 200 + ", 2.2.2.2")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(Visualizacao.objects.get().ip), 64)

    def test_digitos_nao_ascii_recusados(self):
        from propostas.regras.documentos import cnpj_valido, telefone_valido
        arabe = "".join(chr(0x0660 + int(d)) for d in "11222333000181")
        self.assertFalse(cnpj_valido(arabe))
        self.assertFalse(telefone_valido("".join(chr(0x0660 + int(d)) for d in "11912345678")))


class DecisaoConcorrenteTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        semear()

    def test_segunda_resposta_nao_sobrescreve(self):
        from unittest import mock
        p = criar_proposta()
        aceite = {"acao": "aceitar", "nome": "", "razaoSocial": "ACME", "cnpj": "11.222.333/0001-81", "nomeSocio": "Ana",
                  "email": "ana@acme.com", "whatsapp": "11999998888", "texto": ""}
        # A recusa chegou entre a leitura da proposta e a gravação do aceite
        real = Proposta.objects.filter
        with mock.patch("publico.servico.buscar", return_value=p):
            Proposta.objects.filter(pk=p.pk).update(status="RECUSADA")
            r = self.client.post(f"/p/{p.slug}".replace("/p/", "/api/propostas/") + "/decisao", aceite, content_type="application/json")
        self.assertEqual(r.status_code, 409)
        self.assertEqual(real(pk=p.pk).get().status, "RECUSADA")
