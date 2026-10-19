// Dados iniciais: as 3 empresas, usuário administrador, catálogo de planos da
// CADDI, modelos e uma proposta de exemplo. Pode ser executado mais de uma vez:
// empresas, produtos e modelos são atualizados pelo identificador.
//
//   npm run db:seed

import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { Tema } from "../src/lib/tema";
import { modeloCaddiNuvem, PLANOS_NUVEM } from "./modelos/caddi-servidor-nuvem";
import { modeloCaddiGestaoTi } from "./modelos/caddi-gestao-ti";
import { modeloCaddiSuporte } from "./modelos/caddi-suporte-gerenciado";
import { modeloCaddiBackup } from "./modelos/caddi-backup-seguranca";
import { modeloKolpSite } from "./modelos/kolp-site";
import { modeloKolpSaas } from "./modelos/kolp-saas";
import { modeloKolpProjeto } from "./modelos/kolp-projeto";
import { modeloKolpSiteSaas, PLANOS_SITE_SAAS } from "./modelos/kolp-site-saas";
import { modeloFaseWeb, PLANOS_WEB } from "./modelos/fase-web";
import { modeloFaseFood, PLANOS_FOOD } from "./modelos/fase-food";
import { modeloFasePet, PLANOS_PET } from "./modelos/fase-pet";
import { modeloFaseAgro, PLANOS_AGRO } from "./modelos/fase-agro";
import { modeloFaseClinicas, PLANOS_CLINICAS } from "./modelos/fase-clinicas";
import { modeloFaseAgenda, PLANOS_AGENDA } from "./modelos/fase-agenda";
import { modeloFaseX } from "./modelos/fase-x";
import { modeloPadrao } from "./modelos/padrao";
import type { ModeloDef } from "./modelos/tipo";
import { calcular } from "../src/lib/precificacao";

type PlanoSeed = { codigo: string; nome: string; preco: number; atributos: Record<string, number | string> };

// Modelos prontos por empresa (além do "Servidor em nuvem" da CADDI e dos
// segmentos FASE, que têm catálogo de planos e são tratados à parte).
const MODELOS_POR_EMPRESA: Record<string, ModeloDef[]> = {
  caddi: [modeloCaddiGestaoTi, modeloCaddiSuporte, modeloCaddiBackup],
  kolp: [modeloKolpSite, modeloKolpSaas, modeloKolpProjeto, modeloKolpSiteSaas],
};

// Catálogos de planos de modelos (fora da FASE) que usam campo "produto".
const CATALOGOS_POR_EMPRESA: Record<string, { categoria: string; planos: PlanoSeed[] }[]> = {
  kolp: [{ categoria: "kolp-site-saas", planos: PLANOS_SITE_SAAS }],
};

// Segmentos do Fase ERP: cada um tem seu catálogo de planos (categoria própria)
// e seu modelo. O "Fase X" (por volume) é registrado à parte, sem catálogo fixo.
const FASE_SEGMENTOS: { categoria: string; planos: PlanoSeed[]; modelo: ModeloDef }[] = [
  { categoria: "fase-web", planos: PLANOS_WEB, modelo: modeloFaseWeb },
  { categoria: "fase-food", planos: PLANOS_FOOD, modelo: modeloFaseFood },
  { categoria: "fase-pet", planos: PLANOS_PET, modelo: modeloFasePet },
  { categoria: "fase-agro", planos: PLANOS_AGRO, modelo: modeloFaseAgro },
  { categoria: "fase-clinicas", planos: PLANOS_CLINICAS, modelo: modeloFaseClinicas },
  { categoria: "fase-agenda", planos: PLANOS_AGENDA, modelo: modeloFaseAgenda },
];

const db = new PrismaClient();
const json = (v: unknown) => v as Prisma.InputJsonValue;

const EMPRESAS: {
  slug: string;
  nome: string;
  razaoSocial: string;
  site: string;
  dominioPropostas: string;
  rodape: string;
  prefixo: string;
  tema: Tema;
}[] = [
  {
    slug: "caddi",
    nome: "CADDI",
    razaoSocial: "CADDI Soluções Tecnológicas",
    site: "caddi.com.br",
    dominioPropostas: "propostas.caddi.com.br",
    prefixo: "CAD",
    rodape: "CADDI Soluções Tecnológicas · Alphaville, Barueri/SP",
    tema: {
      primaria: "#0D1B3E",
      primaria2: "#16295A",
      destaque: "#C9A84C",
      destaqueSuave: "#FBF6E8",
      destaqueTexto: "#9A7F2F",
      neutra: "#B0B8C1",
      tinta: "#EEF2FA",
      logo: "/empresas/caddi/logo.png",
      logoClaro: "/empresas/caddi/logo-claro.png",
    },
  },
  {
    // Manual da Marca KOLP: roxos #5C026E / #7605B7 e degradê magenta-laranja-amarelo.
    slug: "kolp",
    nome: "KOLP",
    razaoSocial: "KOLP",
    site: "kolp.com.br",
    dominioPropostas: "propostas.kolp.com.br",
    prefixo: "KLP",
    rodape: "KOLP · kolp.com.br",
    tema: {
      primaria: "#5C026E",
      primaria2: "#7605B7",
      destaque: "#FE8010",
      destaqueSuave: "#FFF3E6",
      destaqueTexto: "#C2410C",
      neutra: "#CDB6DA",
      tinta: "#F7F0FA",
      logo: "/empresas/kolp/logo.png",
      logoClaro: "/empresas/kolp/logo-claro.png",
    },
  },
  {
    // Manual de Identidade Visual FASE v6.0: azul institucional #185FA5, azul dinâmico #378ADD,
    // roxo inovação #534AB7, lilás #7F77DD, fundo escuro #0B1829, fundo suave #E6F1FB.
    slug: "fase",
    nome: "FASE",
    razaoSocial: "Fase Sistemas",
    site: "fasesistemas.com.br",
    dominioPropostas: "propostas.fasesistemas.com.br",
    prefixo: "FSE",
    rodape: "Fase Sistemas · soluções modulares · de A a Z",
    tema: {
      primaria: "#0B1829",
      primaria2: "#185FA5",
      destaque: "#378ADD",
      destaqueSuave: "#E6F1FB",
      destaqueTexto: "#534AB7",
      neutra: "#9FB3CC",
      tinta: "#EEF5FC",
      logo: "/empresas/fase/logo.svg",
      logoClaro: "/empresas/fase/logo-claro.svg",
    },
  },
];

const MOTIVOS = ["Desisti do projeto", "Não enxerguei valor", "Preço acima do esperado", "Não foi aprovado pela diretoria", "Escolhi outro fornecedor", "Outro motivo"];

// Cadastra/atualiza os planos de um segmento (identificados por categoria + código).
async function seedProdutos(empresaId: string, categoria: string, planos: PlanoSeed[]) {
  for (const [i, p] of planos.entries()) {
    const existente = await db.produto.findFirst({ where: { empresaId, categoria, codigo: p.codigo } });
    const data = { categoria, nome: p.nome, preco: p.preco, atributos: json(p.atributos), ordem: i, recorrencia: "MENSAL" as const, descricao: p.nome };
    if (existente) await db.produto.update({ where: { id: existente.id }, data });
    else await db.produto.create({ data: { ...data, codigo: p.codigo, empresaId } });
  }
}

async function salvarModelo(empresaId: string, m: ModeloDef) {
  // Casa por tipoSolucao (único por empresa): renomear o modelo atualiza no lugar,
  // sem criar duplicata.
  const existente = await db.modelo.findFirst({ where: { empresaId, tipoSolucao: m.tipoSolucao } });
  const data = {
    nome: m.nome,
    descricao: m.descricao,
    tipoSolucao: m.tipoSolucao,
    validadeDias: m.validadeDias,
    campos: json(m.campos),
    secoes: json(m.secoes),
    precificacao: json(m.precificacao),
  };
  return existente
    ? db.modelo.update({ where: { id: existente.id }, data })
    : db.modelo.create({ data: { ...data, empresaId } });
}

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@propostas.local";
  const senha = process.env.SEED_ADMIN_PASSWORD ?? "trocar-esta-senha";
  const producao = process.env.ALLOW_ANY_HOST !== "true";
  if (producao && (senha === "trocar-esta-senha" || senha.length < 12 || !/\d/.test(senha) || !/[a-z]/i.test(senha))) {
    throw new Error("Em produção, defina SEED_ADMIN_PASSWORD no .env com 12+ caracteres, letras e números.");
  }
  const admin = await db.usuario.upsert({
    where: { email },
    update: {},
    // Primeiro acesso obriga a trocar a senha
    create: { nome: "Administrador", email, senhaHash: await bcrypt.hash(senha, 12), superAdmin: true, todasEmpresas: true, trocarSenha: true },
  });

  for (const e of EMPRESAS) {
    const empresa = await db.empresa.upsert({
      where: { slug: e.slug },
      update: { nome: e.nome, razaoSocial: e.razaoSocial, site: e.site, dominioPropostas: e.dominioPropostas, rodape: e.rodape, prefixo: e.prefixo, tema: json(e.tema) },
      create: { ...e, tema: json(e.tema), motivosRecusa: json(MOTIVOS) },
    });
    await db.membro.upsert({
      where: { usuarioId_empresaId: { usuarioId: admin.id, empresaId: empresa.id } },
      update: {},
      create: { usuarioId: admin.id, empresaId: empresa.id },
    });

    if (e.slug === "caddi") {
      for (const [i, p] of PLANOS_NUVEM.entries()) {
        const existente = await db.produto.findFirst({ where: { empresaId: empresa.id, codigo: p.codigo } });
        const data = { categoria: "planos-nuvem", nome: p.nome, preco: p.preco, atributos: json(p.atributos), ordem: i, recorrencia: "MENSAL" as const,
          descricao: `${p.atributos.vcpu} vCPUs, ${p.atributos.ram} GB RAM, ${p.atributos.disco} GB` };
        if (existente) await db.produto.update({ where: { id: existente.id }, data });
        else await db.produto.create({ data: { ...data, codigo: p.codigo, empresaId: empresa.id } });
      }
      const modelo = await salvarModelo(empresa.id, modeloCaddiNuvem);

      // Proposta de exemplo para visualizar o link público
      const slug = "grupo-mofarrej-exemplo";
      if (!(await db.proposta.findUnique({ where: { slug } }))) {
        const contato = await db.contato.create({
          data: { empresaId: empresa.id, organizacao: "Grupo Mofarrej", responsavel: "Contato de exemplo" },
        });
        const validade = new Date();
        validade.setDate(validade.getDate() + 15);
        const dados = {
          cliente: { contatoId: contato.id, nome: "Grupo Mofarrej" },
          plano: { codigo: "avancado" },
          dispositivos: 17,
          implantacao: 960,
          desconto: { tipo: "nenhum", valor: 0 },
          validade: validade.toISOString().slice(0, 10),
          observacoes: [{ titulo: "Prazo de contrato", descricao: "12 meses, sem multa por cancelamento." }],
        };
        const catalogo = PLANOS_NUVEM.map((p) => ({ id: p.codigo, categoria: "planos-nuvem", ...p }));
        const calculo = calcular(modeloCaddiNuvem.precificacao, dados, catalogo);
        const ano = new Date().getFullYear();
        const cont = await db.contadorProposta.upsert({
          where: { empresaId_ano: { empresaId: empresa.id, ano } },
          update: { ultimo: { increment: 1 } },
          create: { empresaId: empresa.id, ano, ultimo: 1 },
        });
        const proposta = await db.proposta.create({
          data: {
            empresaId: empresa.id,
            codigo: `${e.prefixo}-${ano}-${String(cont.ultimo).padStart(4, "0")}`,
            modeloId: modelo.id,
            autorId: admin.id,
            contatoId: contato.id,
            slug,
            titulo: "Servidor em nuvem — Grupo Mofarrej",
            clienteNome: "Grupo Mofarrej",
            dados: json(dados),
            snapshot: json({ campos: modeloCaddiNuvem.campos, secoes: modeloCaddiNuvem.secoes, precificacao: modeloCaddiNuvem.precificacao, catalogo, modeloNome: modeloCaddiNuvem.nome }),
            calculo: json(calculo),
            valorMensal: calculo.totalMensal,
            valorUnico: calculo.totalUnico,
            validaAte: validade,
          },
        });
        await db.evento.create({ data: { propostaId: proposta.id, tipo: "CRIADA", dados: json({ nome: admin.nome }) } });
      }
    }

    // FASE: catálogo de planos por segmento + modelos de cada segmento + Fase X.
    if (e.slug === "fase") {
      for (const seg of FASE_SEGMENTOS) {
        await seedProdutos(empresa.id, seg.categoria, seg.planos);
        await salvarModelo(empresa.id, seg.modelo);
      }
      await salvarModelo(empresa.id, modeloFaseX);
    } else {
      // Catálogos de planos (ex.: KOLP "Site por assinatura").
      for (const cat of CATALOGOS_POR_EMPRESA[e.slug] ?? []) {
        await seedProdutos(empresa.id, cat.categoria, cat.planos);
      }
      // Demais modelos prontos de cada empresa (ou o modelo genérico, se não houver).
      const extras = MODELOS_POR_EMPRESA[e.slug];
      if (extras) {
        for (const m of extras) await salvarModelo(empresa.id, m);
      } else {
        await salvarModelo(empresa.id, modeloPadrao({ nome: e.nome, site: e.site }));
      }
    }
  }

  console.log(`Seed concluído. Login: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
