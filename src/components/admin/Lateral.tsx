"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { trocarEmpresa } from "@/app/admin/acoes";
import { sair } from "@/app/login/acoes";

const I = {
  painel: <path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 9h8V3h-8z" />,
  propostas: <><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h6" /></>,
  nova: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
  modelos: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  catalogo: <><path d="M3 7l9-4 9 4-9 4z" /><path d="M3 7v10l9 4 9-4V7M12 11v10" /></>,
  contatos: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.5" /><path d="M17 14c2.8 0 4.5 2 4.5 5" /></>,
  empresa: <><path d="M4 21V5l8-3 8 3v16" /><path d="M9 21v-5h6v5M8 9h2M14 9h2M8 13h2M14 13h2" /></>,
};

const MENU: { grupo?: string; href: string; rotulo: string; icone: keyof typeof I }[] = [
  { href: "/admin", rotulo: "Painel", icone: "painel" },
  { grupo: "Propostas", href: "/admin/propostas", rotulo: "Propostas", icone: "propostas" },
  { href: "/admin/propostas/nova", rotulo: "Nova proposta", icone: "nova" },
  { href: "/admin/modelos", rotulo: "Modelos", icone: "modelos" },
  { grupo: "Cadastros", href: "/admin/catalogo", rotulo: "Produtos e planos", icone: "catalogo" },
  { href: "/admin/contatos", rotulo: "Clientes", icone: "contatos" },
  { grupo: "Configurações", href: "/admin/empresa", rotulo: "Empresa e marca", icone: "empresa" },
];

export function Lateral({
  empresa, empresas, usuario, logo,
}: {
  empresa: { slug: string; nome: string };
  empresas: { slug: string; nome: string }[];
  usuario: string;
  logo?: string;
}) {
  const path = usePathname();
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const ativo = (href: string) =>
    href === "/admin" ? path === "/admin" : href === "/admin/propostas" ? path === href || /^\/admin\/propostas\/(?!nova)/.test(path) : path.startsWith(href);

  return (
    <aside className="lateral">
      <div className="marca">{logo ? <img src={logo} alt={empresa.nome} /> : <b>{empresa.nome}</b>}</div>
      <nav>
        {MENU.map((m) => (
          <div key={m.href} style={{ display: "contents" }}>
            {m.grupo && <div className="grupo">{m.grupo}</div>}
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
