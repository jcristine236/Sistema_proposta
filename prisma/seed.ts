// Dados iniciais: as 3 empresas, usuário administrador, catálogo de planos da
// CADDI, modelos e uma proposta de exemplo. Pode ser executado mais de uma vez:
// empresas, produtos e modelos são atualizados pelo identificador.
//
//   npm run db:seed

import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { Tema } from "../src/lib/tema";
import { modeloCaddiNuvem, PLANOS_NUVEM } from "./modelos/caddi-servidor-nuvem";
import { modeloPadrao } from "./modelos/padrao";
import { calcular } from "../src/lib/precificacao";

const db = new PrismaClient();
const json = (v: unknown) => v as Prisma.InputJsonValue;

const EMPRESAS: {
  slug: string;
  nome: string;
  razaoSocial: string;
  site: string;
  dominioPropostas: string;
  rodape: string;
  tema: Tema;
}[] = [
  {
    slug: "caddi",
    nome: "CADDI",
    razaoSocial: "CADDI Soluções Tecnológicas",
    site: "caddi.com.br",
    dominioPropostas: "propostas.caddi.com.br",
    rodape: "CADDI Soluções Tecnológicas · Alphaville, Barueri/SP",
    tema: {
      primaria: "#0D1B3E",
      primaria2: "#16295A",
      destaque: "#C9A84C",
      destaqueSuave: "#FBF6E8",
      destaqueTexto: "#9A7F2F",
      neutra: "#B0B8C1",
      tinta: "#EEF2FA",
      fonteTitulo: "Space Grotesk",
      fonteTexto: "Inter",
      fonteNumeros: "JetBrains Mono",
      logo: "/empresas/caddi/logo.png",
      logoClaro: "/empresas/caddi/logo-claro.png",
    },
  },
  {
    // Manual da Marca KOLP: roxos #5C026E / #7605B7 e degradê magenta-laranja-amarelo.
    // Títulos: Ethnocentric (fonte paga) -> Michroma, a alternativa gratuita mais próxima.
    slug: "kolp",
    nome: "KOLP",
    razaoSocial: "KOLP",
    site: "kolp.com.br",
    dominioPropostas: "propostas.kolp.com.br",
    rodape: "KOLP · kolp.com.br",
    tema: {
      primaria: "#5C026E",
      primaria2: "#7605B7",
      destaque: "#FE8010",
      destaqueSuave: "#FFF3E6",
      destaqueTexto: "#C2410C",
      neutra: "#CDB6DA",
      tinta: "#F7F0FA",
      fonteTitulo: "Michroma",
      pesosTitulo: "400",
      fonteTexto: "Fira Sans",
      fonteNumeros: "JetBrains Mono",
      logo: "/empresas/kolp/logo.png",
      logoClaro: "/empresas/kolp/logo-claro.png",
    },
  },
  {
    // Manual de Identidade Visual FASE v6.0: azul institucional #185FA5, azul dinâmico #378ADD,
    // roxo inovação #534AB7, lilás #7F77DD, fundo escuro #0B1829, fundo suave #E6F1FB.
    // Títulos: Cormorant Garamond Bold; texto: Outfit.
    slug: "fase",
    nome: "FASE",
    razaoSocial: "Fase Sistemas",
    site: "fasesistemas.com.br",
    dominioPropostas: "propostas.fasesistemas.com.br",
    rodape: "Fase Sistemas · soluções modulares · de A a Z",
    tema: {
      primaria: "#0B1829",
      primaria2: "#185FA5",
      destaque: "#378ADD",
      destaqueSuave: "#E6F1FB",
      destaqueTexto: "#534AB7",
      neutra: "#9FB3CC",
      tinta: "#EEF5FC",
      fonteTitulo: "Cormorant Garamond",
      pesosTitulo: "500;600;700",
      fonteTexto: "Outfit",
      pesosTexto: "300;400;500;600;700",
      fonteNumeros: "JetBrains Mono",
      logo: "/empresas/fase/logo.svg",
      logoClaro: "/empresas/fase/logo-claro.svg",
    },
  },
];

async function salvarModelo(empresaId: string, m: ReturnType<typeof modeloPadrao>) {
  const existente = await db.modelo.findFirst({ where: { empresaId, tipoSolucao: m.tipoSolucao, nome: m.nome } });
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
  const admin = await db.usuario.upsert({
    where: { email },
    update: {},
    create: { nome: "Administrador", email, senhaHash: await bcrypt.hash(senha, 10), superAdmin: true },
  });

  for (const e of EMPRESAS) {
    const empresa = await db.empresa.upsert({
      where: { slug: e.slug },
      update: { nome: e.nome, razaoSocial: e.razaoSocial, site: e.site, dominioPropostas: e.dominioPropostas, rodape: e.rodape, tema: json(e.tema) },
      create: { ...e, tema: json(e.tema) },
    });
    await db.membro.upsert({
      where: { usuarioId_empresaId: { usuarioId: admin.id, empresaId: empresa.id } },
      update: {},
      create: { usuarioId: admin.id, empresaId: empresa.id, papel: "ADMIN" },
    });

    if (e.slug === "caddi") {
      for (const [i, p] of PLANOS_NUVEM.entries()) {
        const existente = await db.produto.findFirst({ where: { empresaId: empresa.id, codigo: p.codigo } });
        const data = { categoria: "planos-nuvem", nome: p.nome, preco: p.preco, atributos: json(p.atributos), ordem: i, recorrencia: "MENSAL" as const,
          descricao: `${p.atributos.vcpu} vCPUs, ${p.atributos.ram} GB RAM, ${p.atributos.disco} GB` };
        if (existente) await db.produto.update({ where: { id: existente.id }, data });
        else await db.produto.create({ data: { ...data, codigo: p.codigo, empresaId: empresa.id } });
      }
      const modelo = await salvarModelo(empresa.id, modeloCaddiNuvem as ReturnType<typeof modeloPadrao>);

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
        const proposta = await db.proposta.create({
          data: {
            empresaId: empresa.id,
            modeloId: modelo.id,
            autorId: admin.id,
            contatoId: contato.id,
            slug,
            titulo: "Servidor em nuvem — Grupo Mofarrej",
            clienteNome: "Grupo Mofarrej",
            dados: json(dados),
            snapshot: json({ campos: modeloCaddiNuvem.campos, secoes: modeloCaddiNuvem.secoes, precificacao: modeloCaddiNuvem.precificacao, catalogo }),
            calculo: json(calculo),
            valorMensal: calculo.totalMensal,
            valorUnico: calculo.totalUnico,
            validaAte: validade,
          },
        });
        await db.evento.create({ data: { propostaId: proposta.id, tipo: "CRIADA", dados: json({ por: admin.nome }) } });
      }
    } else {
      await salvarModelo(empresa.id, modeloPadrao({ nome: e.nome, site: e.site }));
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
