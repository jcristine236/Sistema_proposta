import { exigirSessao } from "@/lib/auth";
import { temaDe } from "@/lib/tema";
import { FormAcao } from "@/components/admin/FormAcao";
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
  const { empresa, papel } = await exigirSessao();
  const tema = temaDe(empresa.tema);
  const host = empresa.dominioPropostas;
  const sub = host.split(".")[0];
  return (
    <>
      <div className="topo"><div><h1>Empresa e marca · {empresa.nome}</h1><p>Domínio dos links públicos, paleta, fontes e logos usados nas propostas desta empresa.</p></div></div>
      {papel !== "ADMIN" && <div className="alerta aviso">Somente administradores podem salvar alterações.</div>}
      <div className="grade g2">
        <div className="card">
          <FormAcao acao={salvarEmpresa} botao="Salvar alterações">
            <h2>Dados</h2>
            <div className="linha2">
              <div className="campo"><label>Nome curto</label><input name="nome" defaultValue={empresa.nome} /></div>
              <div className="campo"><label>Razão social / nome completo</label><input name="razaoSocial" defaultValue={empresa.razaoSocial ?? ""} /></div>
            </div>
            <div className="linha2">
              <div className="campo"><label>Site</label><input name="site" defaultValue={empresa.site ?? ""} /></div>
              <div className="campo"><label>Domínio dos links de proposta</label><input name="dominioPropostas" defaultValue={empresa.dominioPropostas} /></div>
            </div>
            <div className="campo"><label>Rodapé da proposta</label><input name="rodape" defaultValue={empresa.rodape ?? ""} /></div>
            <div className="campo">
              <label>E-mail para avisos</label>
              <input name="emailNotificacao" type="email" defaultValue={empresa.emailNotificacao ?? ""} placeholder="comercial@empresa.com.br" />
              <div className="ajuda">Recebe aviso de abertura, aceite, recusa e comentários (além do vendedor que criou a proposta).</div>
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
            <h2 style={{ marginTop: 10 }}>Fontes (Google Fonts)</h2>
            <div className="linha2">
              <div className="campo"><label>Títulos</label><input name="fonteTitulo" defaultValue={tema.fonteTitulo} /></div>
              <div className="campo"><label>Texto</label><input name="fonteTexto" defaultValue={tema.fonteTexto} /></div>
            </div>
            <div className="campo"><label>Números</label><input name="fonteNumeros" defaultValue={tema.fonteNumeros} /></div>
            <h2 style={{ marginTop: 10 }}>Logos</h2>
            <div className="linha2">
              <div className="campo"><label>Logo (fundo claro)</label><input name="logo" defaultValue={tema.logo} /></div>
              <div className="campo"><label>Logo (fundo escuro)</label><input name="logoClaro" defaultValue={tema.logoClaro ?? ""} /></div>
            </div>
            <div className="ajuda" style={{ marginTop: -6, marginBottom: 14 }}>Caminho do arquivo em <span className="mono">public/empresas/{empresa.slug}/</span> ou URL completa.</div>
          </FormAcao>
        </div>
        <div>
          <div className="card">
            <h2>Como fica</h2>
            <div style={{ background: `linear-gradient(160deg, ${tema.primaria}, ${tema.primaria2})`, borderRadius: 14, padding: 22, color: "#fff" }}>
              {tema.logoClaro ? <img src={tema.logoClaro} alt="" style={{ height: 44 }} /> : <b>{empresa.nome}</b>}
              <div style={{ color: tema.destaque, letterSpacing: ".14em", fontSize: 12, marginTop: 16, textTransform: "uppercase", fontWeight: 600 }}>Proposta comercial</div>
              <div style={{ fontSize: 30, fontWeight: 700, margin: "4px 0 14px" }}>CLIENTE EXEMPLO</div>
              <span style={{ background: tema.destaque, color: tema.primaria, borderRadius: 99, padding: "7px 14px", fontWeight: 600, fontSize: 13 }}>Válida até 30/10</span>
            </div>
            <div style={{ background: tema.tinta, borderRadius: 14, padding: 18, marginTop: 12 }}>
              <div style={{ color: tema.destaqueTexto, fontWeight: 600, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase" }}>Seção</div>
              <div style={{ color: tema.primaria, fontSize: 20, fontWeight: 700 }}>Título de uma seção</div>
              <div style={{ background: tema.destaqueSuave, borderLeft: `4px solid ${tema.destaque}`, padding: 10, borderRadius: 8, marginTop: 10, color: tema.primaria }}>Destaque suave com borda</div>
            </div>
          </div>
          <div className="card">
            <h2>Apontamento de DNS (Hostgator)</h2>
            <p className="muted" style={{ marginTop: -6 }}>Para os links abrirem em <b className="mono">{host}</b>, crie no DNS do domínio:</p>
            <div className="tabela-wrap">
              <table className="tabela">
                <thead><tr><th>Tipo</th><th>Nome</th><th>Destino</th></tr></thead>
                <tbody>
                  <tr><td className="mono">A</td><td className="mono">{sub}</td><td className="mono">IP público do servidor</td></tr>
                </tbody>
              </table>
            </div>
            <p className="muted" style={{ fontSize: 12.5 }}>Se o servidor tiver um nome fixo (ex.: <span className="mono">app.suanuvem.com.br</span>), use um registro <b>CNAME</b> apontando para ele. O certificado HTTPS é emitido automaticamente pelo servidor após o DNS propagar. Passo a passo completo em <span className="mono">deploy/README.md</span>.</p>
          </div>
        </div>
      </div>
    </>
  );
}
