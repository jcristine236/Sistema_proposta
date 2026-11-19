// Exporta os modelos de proposta (prisma/modelos/*.ts) e seus catálogos de planos
// para web/seed/modelos/*.json, que o comando `python manage.py semear` carrega.
// Rodado UMA vez, na raiz do repositório, enquanto o código Next ainda existe:
//
//   npx tsx web/ferramentas/exportar-modelos.ts
//
// Espelha o que prisma/seed.ts grava (inclusive a descrição dos planos de nuvem).

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { modeloCaddiNuvem, PLANOS_NUVEM } from "../../prisma/modelos/caddi-servidor-nuvem";
import { modeloCaddiGestaoTi } from "../../prisma/modelos/caddi-gestao-ti";
import { modeloCaddiConsultoria } from "../../prisma/modelos/caddi-consultoria";
import { modeloCaddiProjeto } from "../../prisma/modelos/caddi-projeto";
import { modeloCaddiSuporte } from "../../prisma/modelos/caddi-suporte-gerenciado";
import { modeloCaddiBackup } from "../../prisma/modelos/caddi-backup-seguranca";
import { modeloKolpSite } from "../../prisma/modelos/kolp-site";
import { modeloKolpSaas } from "../../prisma/modelos/kolp-saas";
import { modeloKolpProjeto } from "../../prisma/modelos/kolp-projeto";
import { modeloKolpSiteSaas, PLANOS_SITE_SAAS } from "../../prisma/modelos/kolp-site-saas";
import { modeloFaseWeb, PLANOS_WEB } from "../../prisma/modelos/fase-web";
import { modeloFaseFood, PLANOS_FOOD } from "../../prisma/modelos/fase-food";
import { modeloFasePet, PLANOS_PET } from "../../prisma/modelos/fase-pet";
import { modeloFaseAgro, PLANOS_AGRO } from "../../prisma/modelos/fase-agro";
import { modeloFaseClinicas, PLANOS_CLINICAS } from "../../prisma/modelos/fase-clinicas";
import { modeloFaseAgenda, PLANOS_AGENDA } from "../../prisma/modelos/fase-agenda";
import { modeloFaseX } from "../../prisma/modelos/fase-x";
import { modeloFaseBase } from "../../prisma/modelos/fase-base";

type Plano = { codigo: string; nome: string; preco: number; atributos: Record<string, number | string> };
type Item = Plano & { descricao: string };
type Catalogo = { categoria: string; itens: Item[] } | null;
type Modelo = { tipoSolucao: string } & Record<string, unknown>;

const comNome = (planos: Plano[]): Item[] => planos.map((p) => ({ ...p, descricao: p.nome }));
const cat = (categoria: string, planos: Plano[]): Catalogo => ({ categoria, itens: comNome(planos) });

const nuvem: Catalogo = {
  categoria: "planos-nuvem",
  itens: PLANOS_NUVEM.map((p: Plano) => ({
    ...p,
    descricao: `${p.atributos.vcpu} vCPUs, ${p.atributos.ram} GB RAM, ${p.atributos.disco} GB`,
  })),
};

const SAIDAS: { empresa: string; modelo: Modelo; catalogo: Catalogo }[] = [
  { empresa: "caddi", modelo: modeloCaddiNuvem as Modelo, catalogo: nuvem },
  ...[modeloCaddiGestaoTi, modeloCaddiConsultoria, modeloCaddiSuporte, modeloCaddiBackup, modeloCaddiProjeto].map(
    (m) => ({ empresa: "caddi", modelo: m as Modelo, catalogo: null }),
  ),
  ...[modeloKolpSite, modeloKolpSaas, modeloKolpProjeto].map((m) => ({ empresa: "kolp", modelo: m as Modelo, catalogo: null })),
  { empresa: "kolp", modelo: modeloKolpSiteSaas as Modelo, catalogo: cat("kolp-site-saas", PLANOS_SITE_SAAS) },
  { empresa: "fase", modelo: modeloFaseWeb as Modelo, catalogo: cat("fase-web", PLANOS_WEB) },
  { empresa: "fase", modelo: modeloFaseFood as Modelo, catalogo: cat("fase-food", PLANOS_FOOD) },
  { empresa: "fase", modelo: modeloFasePet as Modelo, catalogo: cat("fase-pet", PLANOS_PET) },
  { empresa: "fase", modelo: modeloFaseAgro as Modelo, catalogo: cat("fase-agro", PLANOS_AGRO) },
  { empresa: "fase", modelo: modeloFaseClinicas as Modelo, catalogo: cat("fase-clinicas", PLANOS_CLINICAS) },
  { empresa: "fase", modelo: modeloFaseAgenda as Modelo, catalogo: cat("fase-agenda", PLANOS_AGENDA) },
  { empresa: "fase", modelo: modeloFaseX as Modelo, catalogo: null },
  { empresa: "fase", modelo: modeloFaseBase as Modelo, catalogo: null },
];

const destino = join(__dirname, "..", "seed", "modelos");
mkdirSync(destino, { recursive: true });
SAIDAS.forEach((s, i) => {
  const nome = `${String(i + 1).padStart(2, "0")}-${s.empresa}-${s.modelo.tipoSolucao}.json`;
  writeFileSync(join(destino, nome), JSON.stringify(s, null, 2) + "\n", "utf8");
});
console.log(`${SAIDAS.length} modelos exportados para ${destino}`);
