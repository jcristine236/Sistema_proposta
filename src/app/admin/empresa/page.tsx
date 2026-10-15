import { exigirSessao } from "@/lib/auth";
import { temaDe } from "@/lib/tema";
import { FormAcao } from "@/components/admin/FormAcao";
import { InputImagem } from "@/components/admin/InputImagem";
import { Logo } from "@/components/Logo";
import { salvarEmpresa } from "../cadastros";

const CORES = [
  { k: "primaria", r: "Principal", a: "fundos escuros e títulos" },
  { k: "primaria2", r: "Principal 2", a: "degradês" },
  { k: "destaque", r: "Destaque", a: "botões e valores" },
  { k: "destaqueSuave", r: "Destaque suave", a: "fundos claros" },
  { k: "destaqueTexto", r: "Destaque texto", a: "textos sobre fundo claro" },
  { k: "neutra", r: "Neutra", a: "textos de apoio" },
  { k: "tinta", r: "Fundo alternado", a: "seções intercaladas" },
] as const;

export default async function Empresa() {
  const s = await exigirSessao("empresa");
  const { empresa } = s;
  const tema = temaDe(empresa.tema);
  const host = empresa.dominioPropostas;
  const podeEditar = s.permite("empresa", "editar");
  return (
    <>
      <div className="topo"><div><h1>Empresa e marca · {empresa.nome}</h1><p>Cores, logos, avisos e motivos de recusa. Fontes e botões são padrão para todas as empresas.</p></div></div>
      <div className="grade g2">
        <div className="card">
          <fieldset disabled={!podeEditar} style={{ border: 0, padding: 0, margin: 0 }}>
            <FormAcao acao={salvarEmpresa} botao="Salvar alterações">
              <h2>Dados</h2>
              <div className="linha2">
                <div className="campo"><label>Razão social / nome completo</label><input name="razaoSocial" defaultValue={empresa.razaoSocial ?? ""} /></div>
                <div className="campo"><label>Site</label><input name="site" defaultValue={empresa.site ?? ""} /></div>
              </div>
              <div className="campo"><label>Rodapé da proposta</label><input name="rodape" defaultValue={empresa.rodape ?? ""} /></div>

              <h2 style={{ marginTop: 10 }}>Avisos</h2>
              <div className="linha2">
                <div className="campo"><label>E-mail para avisos</label><input name="emailNotificacao" type="email" defaultValue={empresa.emailNotificacao ?? ""} placeholder="comercial@empresa.com.br" /><div className="ajuda">Abertura, aceite, recusa e comentários (além do vendedor).</div></div>
                <div className="campo"><label>WhatsApp para avisos de aceite</label><input name="whatsappNotificacao" defaultValue={empresa.whatsappNotificacao ?? ""} placeholder="5511999998888" /><div className="ajuda">Recebe os dados de contratação. Com DDI e DDD.</div></div>
              </div>

              <h2 style={{ marginTop: 10 }}>Paleta</h2>
              <div className="linha2">
                {CORES.map((c) => (
                  <div key={c.k} className="campo">
                    <label>{c.r} <span className="muted" style={{ fontWeight: 400 }}>· {c.a}</span></label>
                    <input type="color" name={c.k} defaultValue={tema[c.k]} />
                  </div>
                ))}
              </div>
              <h2 style={{ marginTop: 10 }}>Logos</h2>
              <div className="linha2">
                <div className="campo"><label>Logo para fundo claro</label><InputImagem name="logo" valorInicial={tema.logo} /></div>
                <div className="campo"><label>Logo para fundo escuro</label><InputImagem name="logoClaro" valorInicial={tema.logoClaro} fundo={tema.primaria} /></div>
              </div>
              <div className="ajuda" style={{ marginTop: -6, marginBottom: 14 }}>PNG/JPG/WebP com fundo transparente e sem margens. O tamanho é ajustado para todas as marcas ocuparem o mesmo espaço.</div>

              <h2 style={{ marginTop: 10 }}>Motivos de recusa</h2>
              <div className="campo">
                <textarea name="motivosRecusa" rows={6} defaultValue={((empresa.motivosRecusa as string[]) ?? []).join("\n")} />
                <div className="ajuda">Um por linha. O cliente escolhe um ao recusar a proposta.</div>
              </div>
            </FormAcao>
          </fieldset>
        </div>
        <div>
          <div className="card">
            <h2>Como fica</h2>
            <div style={{ background: `linear-gradient(160deg, ${tema.primaria}, ${tema.primaria2})`, borderRadius: 14, padding: 22, color: "#fff" }}>
              {tema.logoClaro || tema.logo ? <Logo src={tema.logoClaro || tema.logo} alt="" altura={46} larguraMax={220} /> : <b>{empresa.nome}</b>}
              <div style={{ color: tema.destaque, letterSpacing: ".14em", fontSize: 12, marginTop: 16, textTransform: "uppercase", fontWeight: 600 }}>Proposta comercial</div>
              <div style={{ fontSize: 30, fontWeight: 700, margin: "4px 0 14px", fontFamily: "'Space Grotesk', sans-serif" }}>CLIENTE EXEMPLO</div>
              <span style={{ background: tema.destaque, color: tema.primaria, borderRadius: 10, padding: "10px 16px", fontWeight: 600, fontSize: 13 }}>Quero seguir com esta proposta</span>
            </div>
            <div style={{ background: tema.tinta, borderRadius: 14, padding: 18, marginTop: 12 }}>
              <div style={{ color: tema.destaqueTexto, fontWeight: 600, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase" }}>Seção</div>
              <div style={{ color: tema.primaria, fontSize: 20, fontWeight: 700 }}>Título de uma seção</div>
              <div style={{ background: tema.destaqueSuave, borderLeft: `4px solid ${tema.destaque}`, padding: 10, borderRadius: 8, marginTop: 10, color: tema.primaria }}>Destaque suave com borda</div>
            </div>
          </div>
          <div className="card">
            <h2>Links públicos</h2>
            <p className="muted" style={{ marginTop: -6 }}>Domínio: <b className="mono">{host}</b> · prefixo dos números: <b className="mono">{empresa.prefixo}</b></p>
            <p className="muted" style={{ fontSize: 12.5 }}>Para os links abrirem nesse domínio, crie no DNS (Hostgator) um registro <b>A</b> com nome <span className="mono">{host.split(".")[0]}</span> apontando para o IP do servidor. Domínio e prefixo são alterados em Empresas (superadministrador).</p>
          </div>
        </div>
      </div>
    </>
  );
}
