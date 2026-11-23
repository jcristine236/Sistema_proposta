from django.utils import timezone

from nucleo.models import LogAuditoria
from painel.tests.test_login import Base
from propostas.models import Evento, Proposta, TempoSecao, Visualizacao
from publico.tests.fabrica import criar_proposta


class DetalheTest(Base):
    def setUp(self):
        super().setUp()
        self.login()

    def test_detalhe_completo(self):
        p = criar_proposta(status="ACEITA", decidida_em=timezone.now(), decisao_nome="Maria",
                           dados_contratacao={"razaoSocial": "X SA", "cnpj": "11.222.333/0001-81", "nomeSocio": "Maria",
                                              "email": "m@x.com", "whatsapp": "(11) 91234-5678"})
        v = Visualizacao.objects.create(proposta=p, viewer_id="a", tempo_total_seg=90,
                                        user_agent="Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537")
        TempoSecao.objects.create(visualizacao=v, secao="investimento", segundos=60)
        TempoSecao.objects.create(visualizacao=v, secao="capa", segundos=30)
        Evento.objects.create(proposta=p, tipo="COMENTARIO", dados={"nome": "Ana", "email": "a@b.com", "texto": "Dúvida"})
        html = self.client.get(f"/admin/propostas/{p.pk}").content.decode()
        self.assertIn("Aceita por <b>Maria</b>", html)
        self.assertIn("Dados para o contrato", html)
        self.assertIn("Para gerar o contrato por aqui, configure o D4Sign", html)
        self.assertNotIn(">Editar</a>", html)  # aceita não edita
        self.assertIn(">Duplicar</a>", html)
        self.assertIn("Chrome · Windows", html)
        self.assertIn("1 acesso(s), 1 leitor(es)", html)
        self.assertIn('style="width:100%"', html)
        self.assertIn('style="width:50%"', html)
        self.assertIn("“Dúvida”", html)

    def test_outro_autor_404_para_vendedor(self):
        p = criar_proposta()
        self.vendedor()
        self.client.post("/admin/sair")
        self.login(email="vend@x.com")
        self.assertEqual(self.client.get(f"/admin/propostas/{p.pk}").status_code, 404)

    def test_excluir(self):
        p = criar_proposta()
        r = self.client.post(f"/admin/propostas/{p.pk}/excluir")
        self.assertRedirects(r, "/admin/propostas", fetch_redirect_response=False)
        self.assertFalse(Proposta.objects.filter(pk=p.pk).exists())
        self.assertTrue(LogAuditoria.objects.filter(acao="EXCLUIR", entidade="Proposta").exists())

    def test_contrato_sem_d4sign(self):
        p = criar_proposta(status="ACEITA")
        r = self.client.post(f"/admin/propostas/{p.pk}/contrato")
        self.assertEqual(r.json(), {"erro": "O D4Sign ainda não está configurado para esta empresa (veja Empresa e marca)."})
        p2 = criar_proposta()
        r = self.client.post(f"/admin/propostas/{p2.pk}/contrato")
        self.assertEqual(r.json()["erro"], "O contrato só pode ser gerado depois que o cliente aceitar a proposta.")
