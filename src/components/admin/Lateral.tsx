"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { trocarEmpresa } from "@/app/admin/acoes";
import { sair } from "@/app/login/acoes";
import { Logo } from "@/components/Logo";
import type { Modulo } from "@/lib/permissoes";

const I = {
  painel: <path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 9h8V3h-8z" />,
  propostas: <><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h6" /></>,
  nova: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
  modelos: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  catalogo: <><path d="M3 7l9-4 9 4-9 4z" /><path d="M3 7v10l9 4 9-4V7M12 11v10" /></>,
  contatos: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.5" /><path d="M17 14c2.8 0 4.5 2 4.5 5" /></>,
  empresa: <><path d="M4 21V5l8-3 8 3v16" /><path d="M9 21v-5h6v5M8 9h2M14 9h2M8 13h2M14 13h2" /></>,
  usuarios: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></>,
  auditoria: <><path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></>,
  empresas: <><rect x="3" y="7" width="7" height="14" rx="1" /><rect x="14" y="3" width="7" height="18" rx="1" /></>,
  conta: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="10" r="3" /><path d="M6.5 18.5c1.5-2 3.4-3 5.5-3s4 1 5.5 3" /></>,
};

type Item = { grupo?: string; href: string; rotulo: string; icone: keyof typeof I; modulo?: Modulo | "nova" | "super" };
const MENU: Item[] = [
  { href: "/admin", rotulo: "Painel", icone: "painel", modulo: "painel" },
  { grupo: "Propostas", href: "/admin/propostas", rotulo: "Propostas", icone: "propostas", modulo: "propostas" },
  { href: "/admin/propostas/nova", rotulo: "Nova proposta", icone: "nova", modulo: "nova" },
  { href: "/admin/modelos", rotulo: "Modelos", icone: "modelos", modulo: "modelos" },
  { grupo: "Cadastros", href: "/admin/catalogo", rotulo: "Produtos e planos", icone: "catalogo", modulo: "catalogo" },
  { href: "/admin/contatos", rotulo: "Clientes", icone: "contatos", modulo: "clientes" },
  { grupo: "Configurações", href: "/admin/empresa", rotulo: "Empresa e marca", icone: "empresa", modulo: "empresa" },
  { href: "/admin/usuarios", rotulo: "Usuários", icone: "usuarios", modulo: "usuarios" },
  { href: "/admin/empresas", rotulo: "Empresas", icone: "empresas", modulo: "super" },
  { href: "/admin/auditoria", rotulo: "Auditoria", icone: "auditoria", modulo: "auditoria" },
  { href: "/admin/conta", rotulo: "Minha conta", icone: "conta" },
];

export function Lateral({
  empresa, empresas, usuario, logo, modulos, podeCriarProposta, superAdmin,
}: {
  empresa: { slug: string; nome: string };
  empresas: { slug: string; nome: string }[];
  usuario: string;
  logo?: string;
  modulos: Modulo[];
  podeCriarProposta: boolean;
  superAdmin: boolean;
}) {
  const path = usePathname();
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const ativo = (href: string) =>
    href === "/admin" ? path === "/admin" : href === "/admin/propostas" ? path === href || /^\/admin\/propostas\/(?!nova)/.test(path) : path.startsWith(href);

  return (
    <aside className="lateral">
      <div className="marca">{logo ? <Logo src={logo} alt={empresa.nome} altura={34} larguraMax={180} /> : <b>{empresa.nome}</b>}</div>
      <nav>
        {MENU.map((m, i) => ({ ...m, g: MENU.slice(0, i + 1).reverse().find((x) => x.grupo)?.grupo })).filter((m) => !m.modulo || (m.modulo === "nova" ? podeCriarProposta : m.modulo === "super" ? superAdmin : modulos.includes(m.modulo))).map((m, i, lista) => (
          <div key={m.href} style={{ display: "contents" }}>
            {m.g && m.g !== lista[i - 1]?.g && <div className="grupo">{m.g}</div>}
            <Link href={m.href} className={ativo(m.href) ? "on" : ""}>
              <svg viewBox="0 0 24 24" aria-hidden="true">{I[m.icone]}</svg>
              {m.rotulo}
            </Link>
          </div>
        ))}
      </nav>
      <div className="base">
        <label>
          <small>Empresa</small>
          <select
            value={empresa.slug}
            disabled={pendente}
            onChange={(e) => {
              const slug = e.target.value;
              iniciar(async () => {
                await trocarEmpresa(slug);
                router.push("/admin");
                router.refresh();
              });
            }}
          >
            {empresas.map((e) => <option key={e.slug} value={e.slug}>{e.nome}</option>)}
          </select>
        </label>
        <small>{usuario}</small>
        <form action={sair}><button className="sair">Sair</button></form>
      </div>
    </aside>
  );
}
