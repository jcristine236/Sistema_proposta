

from django.utils import timezone

from nucleo.models import Membro, Usuario
from nucleo.permissoes import PERFIS
from painel.tests.test_login import SENHA, Base
from propostas.models import Evento, Modelo, Proposta, Visualizacao
from publico.tests.fabrica import criar_proposta


class PainelTest(Base):
    def test_kpis(self):
        self.login()
        a = criar_proposta(status="ACEITA")
        b = criar_proposta(primeira_abertura_em=timezone.now())
        criar_proposta()
        Visualizacao.objects.create(proposta=a, viewer_id="x", tempo_total_seg=120)
        Visualizacao.objects.create(proposta=b, viewer_id="y", tempo_total_seg=60)
        Evento.objects.create(proposta=a, tipo="ACEITA")
        Evento.objects.create(proposta=a, tipo="CRIADA")
        html = self.client.get("/admin").content.decode()
        self.assertIn("<small>Propostas enviadas</small><b>3</b>", html)
        self.assertIn("<small>Taxa de abertura</small><b>33%</b><span>1 abertas</span>", html)
        self.assertIn("<small>Conversão</small><b>33%</b><span>1 aceitas</span>", html)
        self.assertIn("<small>Tempo médio de leitura</small><b>1min 30s</b>", html)
        self.assertIn("<small>Aguardando abertura</small><b>2</b>", html)
        self.assertIn("Proposta aceita · <a", html)
        self.assertNotIn("Proposta criada", html)

    def test_vazio(self):
        self.login()
        html = self.client.get("/admin").content.decode()
        self.assertIn("<small>Taxa de abertura</small><b>-</b>", html)
        self.assertIn("Nenhuma atividade ainda.", html)
        self.assertIn("Tudo em dia.", html)

    def test_sem_painel_vai_para_primeiro_modulo(self):
        u = Usuario.objects.create_user("c@x.com", SENHA, nome="C", permissoes={"modulos": {"catalogo": {"ver": True}}})
        Membro.objects.create(usuario=u, empresa=self.caddi)
        self.login(email="c@x.com")
        self.assertRedirects(self.client.get("/admin"), "/admin/catalogo", fetch_redirect_response=False)


class ListaTest(Base):
    def test_filtros_e_busca(self):
        self.login()
        a = criar_proposta(cliente="Alfa Ltda")
        criar_proposta(cliente="Beta SA", status="ACEITA")
        html = self.client.get("/admin/propostas").content.decode()
        self.assertIn("Alfa Ltda", html)
        self.assertIn("Beta SA", html)
        html = self.client.get("/admin/propostas?status=ACEITA").content.decode()
        self.assertNotIn("Alfa Ltda", html)
        self.assertIn('class="btn pequeno " href="/admin/propostas?status=ACEITA"', html)
        html = self.client.get("/admin/propostas?q=alfa").content.decode()
        self.assertIn("Alfa Ltda", html)
        self.assertNotIn("Beta SA", html)
        self.assertIn(f">{a.codigo}<", self.client.get(f"/admin/propostas?q={a.codigo.lower()}").content.decode())
        self.assertIn("Nenhuma proposta encontrada.", self.client.get("/admin/propostas?q=zzz").content.decode())

    def test_vendedor_so_ve_as_proprias(self):
        criar_proposta(cliente="Do Admin")
        self.vendedor()
        self.login(email="vend@x.com")
        self.assertNotIn("Do Admin", self.client.get("/admin/propostas").content.decode())

    def test_valor_e_leitura(self):
        self.login()
        p = criar_proposta()
        Visualizacao.objects.create(proposta=p, viewer_id="x", tempo_total_seg=75)
        html = self.client.get("/admin/propostas").content.decode()
        self.assertIn("/mês</td>", html)
        self.assertIn("1× · 1min 15s", html)


class NovaTest(Base):
    def test_lista_modelos(self):
        self.login()
        html = self.client.get("/admin/propostas/nova").content.decode()
        self.assertEqual(html.count('class="chip"'), Modelo.objects.filter(empresa=self.caddi).count())

    def test_um_modelo_redireciona(self):
        Modelo.objects.filter(empresa=self.caddi).exclude(tipo_solucao="servidor-nuvem").update(ativo=False)
        self.login()
        m = Modelo.objects.get(empresa=self.caddi, tipo_solucao="servidor-nuvem")
        self.assertRedirects(self.client.get("/admin/propostas/nova"), f"/admin/propostas/nova/{m.pk}", fetch_redirect_response=False)

    def test_vendedor_sem_criar(self):
        u = Usuario.objects.create_user("l@x.com", SENHA, nome="L", permissoes=PERFIS["leitura"]["permissoes"])
        Membro.objects.create(usuario=u, empresa=self.caddi)
        self.login(email="l@x.com")
        self.assertRedirects(self.client.get("/admin/propostas/nova"), "/admin/sem-permissao", fetch_redirect_response=False)
        self.assertNotIn("+ Nova proposta", self.client.get("/admin/propostas").content.decode())


