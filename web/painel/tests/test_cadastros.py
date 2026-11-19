import shutil
import tempfile
from pathlib import Path

from django.test import override_settings

from nucleo.models import Empresa, LogAuditoria, Membro, Upload, Usuario
from nucleo.permissoes import PERFIS
from painel.tests.test_login import SENHA, Base
from painel.views.cadastros import ler_atributos, numero_js, texto_atributos
from propostas.models import Contato, Produto

SEM = "Você não tem permissão para esta ação."
CNPJ = "11.222.333/0001-81"


class Comum(Base):
    def usuario_com(self, email, permissoes, empresa=None):
        u = Usuario.objects.create_user(email, SENHA, nome=email.split("@")[0], permissoes=permissoes)
        Membro.objects.create(usuario=u, empresa=empresa or self.caddi)
        return u

    def leitura(self):
        return self.usuario_com("leitura@x.com", PERFIS["leitura"]["permissoes"])


class ContatosTest(Comum):
    def setUp(self):
        super().setUp()
        self.login()

    def test_lista_e_formulario(self):
        Contato.objects.create(empresa=self.caddi, organizacao="Grupo Mofarrej")
        r = self.client.get("/admin/contatos")
        self.assertContains(r, "<h1>Clientes</h1>", html=False)
        self.assertContains(r, "<h2>Novo cliente</h2>")
        self.assertContains(r, "Cadastrar cliente")
        self.assertContains(r, 'data-confirmar="Excluir &quot;Grupo Mofarrej&quot;? As propostas continuam com o nome do cliente."')

    def test_criar_limpa_formulario_e_audita(self):
        r = self.client.post("/admin/contatos", {"organizacao": " ACME ", "cnpj": "11222333000181", "email": "a@b.com",
                                                 "responsavel": "Ana"})
        self.assertContains(r, '<div class="alerta ok">Cliente cadastrado.</div>', html=True)
        self.assertContains(r, '<input name="organizacao" required>', html=True)  # formulário limpo
        c = Contato.objects.get(organizacao="ACME")
        self.assertEqual((c.cnpj, c.email, c.responsavel, c.razao_social), (CNPJ, "a@b.com", "Ana", None))
        log = LogAuditoria.objects.get(acao="CRIAR", entidade="Contato")
        self.assertEqual((log.descricao, log.entidade_id, log.empresa_id), ("ACME", None, self.caddi.id))

    def test_validacoes(self):
        casos = [({"organizacao": ""}, "Informe a empresa do cliente."),
                 ({"organizacao": "X", "email": "ruim"}, "E-mail inválido."),
                 ({"organizacao": "X", "cnpj": "11222333000100"}, "CNPJ inválido.")]
        for dados, msg in casos:
            r = self.client.post("/admin/contatos", dados)
            self.assertContains(r, f'<div class="alerta erro">{msg}</div>', html=True)
        self.assertFalse(Contato.objects.filter(organizacao="X").exists())

    def test_editar_redireciona(self):
        c = Contato.objects.create(empresa=self.caddi, organizacao="Velho")
        r = self.client.get(f"/admin/contatos?editar={c.id}")
        self.assertContains(r, "<h2>Editar Velho</h2>")
        self.assertContains(r, 'style="background:var(--accent-soft)"')
        r = self.client.post(f"/admin/contatos?editar={c.id}", {"id": c.id, "organizacao": "Novo"})
        self.assertRedirects(r, "/admin/contatos", fetch_redirect_response=False)
        c.refresh_from_db()
        self.assertEqual(c.organizacao, "Novo")
        self.assertTrue(LogAuditoria.objects.filter(acao="EDITAR", entidade="Contato", entidade_id=c.id).exists())

    def test_editar_de_outra_empresa(self):
        kolp = Empresa.objects.get(slug="kolp")
        c = Contato.objects.create(empresa=kolp, organizacao="Outra")
        r = self.client.post("/admin/contatos", {"id": c.id, "organizacao": "Hack"})
        self.assertContains(r, "Cliente não encontrado.")
        c.refresh_from_db()
        self.assertEqual(c.organizacao, "Outra")

    def test_busca(self):
        Contato.objects.create(empresa=self.caddi, organizacao="Zeta Ltda", cnpj=CNPJ)
        html = self.client.get("/admin/contatos?q=zeta").content.decode()
        self.assertIn("Zeta Ltda", html)
        self.assertNotIn("Grupo Mofarrej</b>", html)
        self.assertIn("Zeta Ltda", self.client.get("/admin/contatos?q=333/0001").content.decode())
        self.assertContains(self.client.get("/admin/contatos?q=nada"), "Nenhum cliente encontrado.")

    def test_excluir(self):
        c = Contato.objects.create(empresa=self.caddi, organizacao="Some")
        r = self.client.post(f"/admin/contatos/{c.id}/excluir?q=x")
        self.assertRedirects(r, "/admin/contatos?q=x", fetch_redirect_response=False)
        self.assertFalse(Contato.objects.filter(id=c.id).exists())
        self.assertTrue(LogAuditoria.objects.filter(acao="EXCLUIR", entidade="Contato", entidade_id=c.id).exists())
        self.client.post("/admin/contatos/inexistente/excluir")
        self.assertEqual(LogAuditoria.objects.filter(acao="EXCLUIR").count(), 1)

    def test_permissoes_vendedor(self):
        self.client.logout()
        self.vendedor()
        self.login(email="vend@x.com")
        r = self.client.get("/admin/contatos")
        self.assertContains(r, "Novo cliente")
        self.assertNotContains(r, ">Excluir</button>")
        c = Contato.objects.create(empresa=self.caddi, organizacao="Fica")
        self.assertContains(self.client.get("/admin/contatos"), ">Editar</a>")
        self.client.post(f"/admin/contatos/{c.id}/excluir")
        self.assertTrue(Contato.objects.filter(id=c.id).exists())

    def test_somente_leitura_sem_formulario(self):
        self.client.logout()
        self.leitura()
        self.login(email="leitura@x.com")
        r = self.client.get("/admin/contatos")
        self.assertNotContains(r, "Novo cliente")
        self.assertNotContains(r, ">Editar</a>")
        # Sem o formulário na tela, a mensagem não aparece (igual ao Next), mas nada é gravado
        r = self.client.post("/admin/contatos", {"organizacao": "X"})
        self.assertEqual(r.status_code, 200)
        self.assertFalse(Contato.objects.filter(organizacao="X").exists())


class CatalogoTest(Comum):
    def setUp(self):
        super().setUp()
        self.login()

    def dados(self, **extra):
        return {"nome": "Plano", "categoria": "planos", "preco": "10,5", "codigo": "", "recorrencia": "MENSAL",
                "descricao": "", "ordem": "2.5", "atributos": "vcpu=16; ram = 92; nome=Ultra; 9x=1; ruim; a=b=c", **extra}

    def test_criar(self):
        r = self.client.post("/admin/catalogo", self.dados(codigo="pl-1"))
        self.assertContains(r, '<div class="alerta ok">Produto cadastrado.</div>', html=True)
        self.assertContains(r, '<input name="nome" required>', html=True)
        p = Produto.objects.get(codigo="pl-1")
        self.assertEqual(str(p.preco), "10.50")
        self.assertEqual(p.ordem, 3)
        self.assertEqual(p.atributos, {"vcpu": 16, "ram": 92, "nome": "Ultra", "a": "b"})
        self.assertTrue(LogAuditoria.objects.filter(acao="CRIAR", entidade="Produto", descricao="Plano").exists())

    def test_validacoes(self):
        Produto.objects.create(empresa=self.caddi, categoria="c", nome="Existe", codigo="dup", preco=1)
        casos = [(self.dados(nome=""), "Preencha nome, categoria e preço."),
                 (self.dados(preco="-1"), "Preencha nome, categoria e preço."),
                 (self.dados(preco="abc"), "Preencha nome, categoria e preço."),
                 (self.dados(codigo="com espaço"), "O código deve ter só letras, números, - ou _."),
                 (self.dados(codigo="dup"), "Já existe um produto com este código.")]
        for dados, msg in casos:
            self.assertContains(self.client.post("/admin/catalogo", dados), msg)
        # Preço vazio vale 0, como Number("") no JS
        self.assertContains(self.client.post("/admin/catalogo", self.dados(preco="", codigo="zero")), "Produto cadastrado.")

    def test_editar_alternar_excluir(self):
        p = Produto.objects.create(empresa=self.caddi, categoria="c", nome="Antigo", preco="1148.00", atributos={"ram": 2})
        r = self.client.get(f"/admin/catalogo?editar={p.id}")
        self.assertContains(r, 'value="1148"')
        self.assertContains(r, 'value="ram=2"')
        r = self.client.post(f"/admin/catalogo?editar={p.id}", self.dados(id=p.id, nome="Novo"))
        self.assertRedirects(r, "/admin/catalogo", fetch_redirect_response=False)
        p.refresh_from_db()
        self.assertEqual(p.nome, "Novo")
        self.client.post(f"/admin/catalogo/{p.id}/alternar")
        p.refresh_from_db()
        self.assertFalse(p.ativo)
        self.assertContains(self.client.get("/admin/catalogo"), "opacity:0.5")
        self.client.post(f"/admin/catalogo/{p.id}/excluir")
        self.assertFalse(Produto.objects.filter(id=p.id).exists())
        self.assertTrue(LogAuditoria.objects.filter(acao="EXCLUIR", entidade="Produto", entidade_id=p.id).exists())

    def test_vendedor_so_ve(self):
        self.client.logout()
        self.vendedor()
        self.login(email="vend@x.com")
        r = self.client.get("/admin/catalogo")
        self.assertNotContains(r, "Novo produto")
        self.client.post("/admin/catalogo", self.dados(codigo="nao"))
        self.assertFalse(Produto.objects.filter(codigo="nao").exists())
        p = Produto.objects.filter(empresa=self.caddi).first()
        self.assertRedirects(self.client.post(f"/admin/catalogo/{p.id}/alternar"), "/admin/sem-permissao",
                             fetch_redirect_response=False)

    def test_numeros_js(self):
        self.assertEqual(numero_js(""), 0)
        self.assertEqual(numero_js("0x10"), 16)
        self.assertNotEqual(numero_js("1_000"), numero_js("1_000"))  # NaN
        self.assertEqual(ler_atributos("x=1.5\ny=1e3"), {"x": 1.5, "y": 1000})
        p = Produto(atributos={"x": 1.5, "y": 1000})
        self.assertEqual(texto_atributos(p), "x=1.5; y=1000")


class AuditoriaTest(Comum):
    def test_lista_e_filtro(self):
        self.login()
        LogAuditoria.objects.create(acao="EXCLUIR", entidade="Produto", descricao="xyz", empresa_id=self.caddi.id)
        r = self.client.get("/admin/auditoria")
        self.assertContains(r, '<span class="status RECUSADA">Excluiu</span>', html=True)
        self.assertContains(r, "<b>Produto </b>xyz", html=False)
        r = self.client.get("/admin/auditoria?acao=LOGIN")
        self.assertNotContains(r, "xyz")
        self.assertContains(r, '<option value="LOGIN" selected>Entrou</option>', html=True)

    def test_escopo_por_empresa(self):
        kolp = Empresa.objects.get(slug="kolp")
        LogAuditoria.objects.create(acao="CRIAR", descricao="da-kolp", empresa_id=kolp.id)
        LogAuditoria.objects.create(acao="CRIAR", descricao="da-caddi", empresa_id=self.caddi.id)
        self.usuario_com("aud@x.com", {"modulos": {"auditoria": {"ver": True}}})
        self.login(email="aud@x.com")
        html = self.client.get("/admin/auditoria").content.decode()
        self.assertIn("da-caddi", html)
        self.assertNotIn("da-kolp", html)
        self.assertIn("Entrou", html)  # login sem empresa de um membro da caddi

    def test_sem_permissao(self):
        self.vendedor()
        self.login(email="vend@x.com")
        self.assertRedirects(self.client.get("/admin/auditoria"), "/admin/sem-permissao", fetch_redirect_response=False)


class EmpresaTest(Comum):
    def setUp(self):
        super().setUp()
        self.login()

    def form(self, **extra):
        return {"razaoSocial": "Razão", "site": "x.com", "rodape": "Rod", "emailNotificacao": "", "whatsappNotificacao": "+55 (11) 9",
                "primaria": "#112233", "destaque": "ruim", "logo": "/uploads/abc.png", "logoClaro": "",
                "motivosRecusa": "A\r\n\r\n B \n", "d4signCofre": "", "d4signTemplate": "", "d4signSignatarioNome": "",
                "d4signSignatarioEmail": "", "d4signCampos": "cnpj: doc\nlixo", **extra}

    def test_pagina(self):
        r = self.client.get("/admin/empresa")
        self.assertContains(r, "Empresa e marca · CADDI")
        self.assertContains(r, 'src="/static/js/cadastros.js"', html=False)

    def test_salvar(self):
        r = self.client.post("/admin/empresa", self.form())
        self.assertContains(r, "Alterações salvas.")
        self.caddi.refresh_from_db()
        self.assertEqual(self.caddi.tema["primaria"], "#112233")
        self.assertEqual(self.caddi.tema["destaque"], "#C9A84C")
        self.assertEqual(self.caddi.tema["logo"], "/uploads/abc.png")
        self.assertEqual(self.caddi.tema["logoClaro"], "")
        self.assertEqual(self.caddi.motivos_recusa, ["A", "B"])
        self.assertEqual(self.caddi.whatsapp_notificacao, "55119")
        self.assertIsNone(self.caddi.d4sign)  # só "campos" não liga o D4Sign
        self.assertIn("--primary:#112233", r.content.decode())  # tema da casca atualizado
        self.assertTrue(LogAuditoria.objects.filter(acao="EDITAR", entidade="Empresa", descricao="marca e avisos").exists())
        self.client.post("/admin/empresa", self.form(d4signCofre="c1", d4signSignatarioEmail="s@x.com"))
        self.caddi.refresh_from_db()
        self.assertEqual(self.caddi.d4sign, {"cofre": "c1", "signatarioEmail": "s@x.com", "campos": {"cnpj": "doc"}})

    def test_validacoes(self):
        for extra, msg in [({"logo": "javascript:alert(1)"}, "Endereço de logo inválido."),
                           ({"emailNotificacao": "x"}, "E-mail de avisos inválido."),
                           ({"d4signSignatarioEmail": "x"}, "E-mail do signatário da empresa (D4Sign) inválido.")]:
            self.assertContains(self.client.post("/admin/empresa", self.form(**extra)), msg)

    def test_sem_editar(self):
        self.client.logout()
        self.usuario_com("ger@x.com", PERFIS["gerente"]["permissoes"])
        self.login(email="ger@x.com")
        r = self.client.get("/admin/empresa")
        self.assertContains(r, "<fieldset disabled", html=False)
        self.assertContains(self.client.post("/admin/empresa", self.form()), SEM)


class EmpresasTest(Comum):
    def form(self, **extra):
        return {"nome": "Nova", "slug": "nova", "prefixo": "NOV", "dominioPropostas": "Propostas.Nova.com", **extra}

    def test_so_superadmin(self):
        self.usuario_com("adm@x.com", PERFIS["administrador"]["permissoes"])
        self.login(email="adm@x.com")
        self.assertRedirects(self.client.get("/admin/empresas"), "/admin/sem-permissao", fetch_redirect_response=False)
        kolp = Empresa.objects.get(slug="kolp")
        self.client.post(f"/admin/empresas/{kolp.id}/alternar")
        kolp.refresh_from_db()
        self.assertTrue(kolp.ativo)

    def test_criar_editar_alternar(self):
        self.login()
        r = self.client.post("/admin/empresas", self.form())
        self.assertContains(r, "Empresa salva.")
        self.assertContains(r, "<h2>Nova empresa</h2>")
        e = Empresa.objects.get(slug="nova")
        self.assertEqual(e.dominio_propostas, "propostas.nova.com")
        self.assertEqual(e.motivos_recusa[0], "Preço acima do esperado")
        self.assertIn('<option value="nova">Nova</option>', r.content.decode())  # lateral atualizada
        self.assertTrue(LogAuditoria.objects.filter(acao="CRIAR", entidade="Empresa", entidade_id=e.id).exists())
        r = self.client.post(f"/admin/empresas?editar={e.id}", self.form(id=e.id, nome="Renomeada"))
        self.assertContains(r, "Empresa salva.")
        self.assertContains(r, "<h2>Editar Renomeada</h2>")
        self.client.post(f"/admin/empresas/{e.id}/alternar")
        e.refresh_from_db()
        self.assertFalse(e.ativo)
        self.assertTrue(LogAuditoria.objects.filter(acao="DESATIVAR", entidade="Empresa", empresa_id=e.id).exists())

    def test_validacoes(self):
        self.login()
        for extra, msg in [({"slug": "A B"}, "Identificador: letras minúsculas, números e -"),
                           ({"prefixo": "no"}, "Prefixo: 2 a 5 letras maiúsculas (ex.: CAD)"),
                           ({"dominioPropostas": "semponto"}, "Domínio inválido (ex.: propostas.empresa.com.br)"),
                           ({"nome": ""}, "Required"),
                           ({"slug": "caddi"}, "Identificador, prefixo ou domínio já usado por outra empresa.")]:
            self.assertContains(self.client.post("/admin/empresas", self.form(**extra)), msg)
        self.assertFalse(Empresa.objects.filter(slug="nova").exists())


PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 100


class UploadsTest(Comum):
    def setUp(self):
        super().setUp()
        self.pasta = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.pasta, True)
        ajuste = override_settings(UPLOAD_DIR=self.pasta)
        ajuste.enable()
        self.addCleanup(ajuste.disable)

    def enviar(self, conteudo=PNG, nome="logo.png"):
        from django.core.files.uploadedfile import SimpleUploadedFile
        return self.client.post("/api/uploads", {"arquivo": SimpleUploadedFile(nome, conteudo)})

    def test_sem_login(self):
        r = self.enviar()
        self.assertEqual((r.status_code, r.json()), (401, {"erro": "Não autorizado."}))

    def test_sem_permissao(self):
        self.vendedor()
        self.login(email="vend@x.com")
        r = self.enviar()
        self.assertEqual((r.status_code, r.json()["erro"]), (403, "Sem permissão para enviar imagens."))

    def test_envio_ok(self):
        self.login()
        r = self.enviar()
        self.assertEqual(r.status_code, 200)
        url = r.json()["url"]
        self.assertRegex(url, r"^/uploads/[a-f0-9]{32}\.png$")
        arquivo = url.rsplit("/", 1)[1]
        self.assertEqual((self.pasta / arquivo).read_bytes(), PNG)
        up = Upload.objects.get(arquivo=arquivo)
        self.assertEqual((up.empresa_id, up.nome, up.mime, up.tamanho), (self.caddi.id, "logo.png", "image/png", len(PNG)))
        for cabeca, ext in [(b"\xff\xd8\xff\xe0", "jpg"), (b"RIFF\0\0\0\0WEBPVP8 ", "webp"), (b"GIF89a", "gif")]:
            self.assertTrue(self.enviar(cabeca + b"0" * 20, "x.bin").json()["url"].endswith("." + ext))

    def test_formato_tamanho_e_arquivo(self):
        self.login()
        r = self.enviar(b"<svg></svg>", "x.png")
        self.assertEqual((r.status_code, r.json()["erro"]), (415, "Formato não aceito. Use PNG, JPG, WebP ou GIF."))
        r = self.enviar(PNG + b"0" * (5 * 1024 * 1024))
        self.assertEqual((r.status_code, r.json()["erro"]), (413, "Imagem maior que 5 MB."))
        r = self.client.post("/api/uploads", {})
        self.assertEqual((r.status_code, r.json()["erro"]), (400, "Envie um arquivo."))
        self.assertFalse(Upload.objects.exists())

    def test_limite_por_hora(self):
        self.login()
        for _ in range(60):
            self.enviar(b"x")
        r = self.enviar()
        self.assertEqual((r.status_code, r.json()["erro"]), (429, "Muitos envios. Tente mais tarde."))

    def test_empresa_ativa(self):
        self.login()
        self.client.post("/admin/empresa-ativa", {"slug": "kolp"})
        r = self.enviar()
        self.assertEqual(Upload.objects.get().empresa.slug, "kolp")
        self.assertEqual(r.status_code, 200)
