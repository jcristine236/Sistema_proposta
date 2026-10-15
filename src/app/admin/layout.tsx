import type { CSSProperties } from "react";
import { exigirSessao } from "@/lib/auth";
import { temaDe, variaveisCss } from "@/lib/tema";
import { MODULOS, type Modulo } from "@/lib/permissoes";
import { Lateral } from "@/components/admin/Lateral";
import "../p/proposta.css";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await exigirSessao(undefined, "ver", { permitirTrocaSenha: true });
  const tema = temaDe(s.empresa.tema);
  const modulos = (Object.keys(MODULOS) as Modulo[]).filter((m) => !s.usuario.trocarSenha && s.permite(m, "ver"));
  return (
    <div className="app" style={variaveisCss(tema) as CSSProperties}>
      <Lateral
        empresa={{ slug: s.empresa.slug, nome: s.empresa.nome }}
        empresas={s.empresas.map((e) => ({ slug: e.slug, nome: e.nome }))}
        usuario={s.usuario.nome}
        logo={tema.logoClaro || undefined}
        modulos={modulos}
        podeCriarProposta={!s.usuario.trocarSenha && s.permite("propostas", "criar")}
        superAdmin={s.usuario.superAdmin}
      />
      <main className="conteudo">{children}</main>
    </div>
  );
}
