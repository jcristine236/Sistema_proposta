import type { CSSProperties } from "react";
import { exigirSessao } from "@/lib/auth";
import { temaDe, variaveisCss } from "@/lib/tema";
import { Lateral } from "@/components/admin/Lateral";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { usuario, empresa, empresas } = await exigirSessao();
  const tema = temaDe(empresa.tema);
  return (
    <div className="app" style={variaveisCss(tema) as CSSProperties}>
      <Lateral
        empresa={{ slug: empresa.slug, nome: empresa.nome }}
        empresas={empresas.map((e) => ({ slug: e.slug, nome: e.nome }))}
        usuario={usuario.nome}
        logo={tema.logoClaro || undefined}
      />
      <main className="conteudo">{children}</main>
    </div>
  );
}
