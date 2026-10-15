// Permissões por módulo e ação. Guardadas em Usuario.permissoes.
// Superadmin ignora tudo isto e acessa todos os módulos de todas as empresas.

export const MODULOS = {
  painel: { nome: "Painel", acoes: ["ver"] },
  propostas: { nome: "Propostas", acoes: ["ver", "criar", "editar", "excluir"] },
  modelos: { nome: "Modelos e seções", acoes: ["ver", "criar", "editar", "excluir"] },
  catalogo: { nome: "Produtos e planos", acoes: ["ver", "criar", "editar", "excluir"] },
  clientes: { nome: "Clientes", acoes: ["ver", "criar", "editar", "excluir"] },
  empresa: { nome: "Empresa e marca", acoes: ["ver", "editar"] },
  usuarios: { nome: "Usuários", acoes: ["ver", "criar", "editar", "excluir"] },
  auditoria: { nome: "Auditoria", acoes: ["ver"] },
} as const;

export type Modulo = keyof typeof MODULOS;
export type Acao = "ver" | "criar" | "editar" | "excluir";

export type Permissoes = {
  modulos: Partial<Record<Modulo, Partial<Record<Acao, boolean>>>>;
  /** Vê e edita propostas de outros usuários (senão, só as próprias) */
  propostasDeTodos?: boolean;
};

export const NOMES_ACOES: Record<Acao, string> = { ver: "Ver", criar: "Criar", editar: "Editar", excluir: "Excluir" };

function tudo(mods: Modulo[], acoes?: Acao[]): Permissoes["modulos"] {
  return Object.fromEntries(
    mods.map((m) => [m, Object.fromEntries(MODULOS[m].acoes.filter((a) => !acoes || acoes.includes(a)).map((a) => [a, true]))]),
  );
}

const TODOS = Object.keys(MODULOS) as Modulo[];

/** Perfis prontos para preencher as permissões rapidamente. */
export const PERFIS: { id: string; nome: string; descricao: string; permissoes: Permissoes }[] = [
  {
    id: "administrador",
    nome: "Administrador",
    descricao: "Tudo nas empresas que acessa, inclusive usuários.",
    permissoes: { modulos: tudo(TODOS), propostasDeTodos: true },
  },
  {
    id: "gerente",
    nome: "Gerente comercial",
    descricao: "Propostas de todo o time, modelos, catálogo e clientes.",
    permissoes: { modulos: { ...tudo(["painel", "propostas", "modelos", "catalogo", "clientes"]), empresa: { ver: true } }, propostasDeTodos: true },
  },
  {
    id: "vendedor",
    nome: "Vendedor",
    descricao: "Cria e acompanha as próprias propostas.",
    permissoes: {
      modulos: {
        painel: { ver: true },
        propostas: { ver: true, criar: true, editar: true },
        modelos: { ver: true },
        catalogo: { ver: true },
        clientes: { ver: true, criar: true, editar: true },
      },
      propostasDeTodos: false,
    },
  },
  {
    id: "leitura",
    nome: "Somente leitura",
    descricao: "Visualiza tudo, sem alterar.",
    permissoes: { modulos: tudo(TODOS.filter((m) => m !== "usuarios" && m !== "auditoria"), ["ver"]), propostasDeTodos: true },
  },
];

export function lerPermissoes(json: unknown): Permissoes {
  const p = (json ?? {}) as Partial<Permissoes>;
  return { modulos: p.modulos ?? {}, propostasDeTodos: !!p.propostasDeTodos };
}

export function pode(usuario: { superAdmin: boolean; permissoes: unknown }, modulo: Modulo, acao: Acao = "ver"): boolean {
  if (usuario.superAdmin) return true;
  return !!lerPermissoes(usuario.permissoes).modulos[modulo]?.[acao];
}

/** Normaliza permissões vindas de formulário (só módulos/ações conhecidos). */
export function sanitizarPermissoes(p: Permissoes): Permissoes {
  const modulos: Permissoes["modulos"] = {};
  for (const m of TODOS) {
    const acoes = Object.fromEntries(MODULOS[m].acoes.map((a) => [a, !!p.modulos?.[m]?.[a as Acao]]).filter(([, v]) => v));
    if (Object.keys(acoes).length) {
      // Qualquer ação implica poder ver o módulo
      modulos[m] = { ver: true, ...acoes };
    }
  }
  return { modulos, propostasDeTodos: !!p.propostasDeTodos };
}
