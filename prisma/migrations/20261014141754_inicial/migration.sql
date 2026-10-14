-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('ADMIN', 'VENDEDOR');

-- CreateEnum
CREATE TYPE "Recorrencia" AS ENUM ('MENSAL', 'UNICO');

-- CreateEnum
CREATE TYPE "StatusProposta" AS ENUM ('RASCUNHO', 'PUBLICADA', 'ABERTA', 'ACEITA', 'RECUSADA', 'EXPIRADA');

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "razaoSocial" TEXT,
    "site" TEXT,
    "dominioPropostas" TEXT NOT NULL,
    "tema" JSONB NOT NULL,
    "rodape" TEXT,
    "emailNotificacao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "superAdmin" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membro" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "papel" "Papel" NOT NULL DEFAULT 'VENDEDOR',

    CONSTRAINT "Membro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contato" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "organizacao" TEXT NOT NULL,
    "responsavel" TEXT,
    "email" TEXT,
    "celular" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "codigo" TEXT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" DECIMAL(12,2) NOT NULL,
    "recorrencia" "Recorrencia" NOT NULL DEFAULT 'MENSAL',
    "atributos" JSONB NOT NULL DEFAULT '{}',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modelo" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipoSolucao" TEXT NOT NULL,
    "campos" JSONB NOT NULL,
    "secoes" JSONB NOT NULL,
    "precificacao" JSONB NOT NULL,
    "validadeDias" INTEGER NOT NULL DEFAULT 15,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Modelo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposta" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "modeloId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "contatoId" TEXT,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "clienteNome" TEXT NOT NULL,
    "dados" JSONB NOT NULL,
    "snapshot" JSONB NOT NULL,
    "calculo" JSONB NOT NULL,
    "valorMensal" DECIMAL(12,2),
    "valorUnico" DECIMAL(12,2),
    "validaAte" TIMESTAMP(3),
    "status" "StatusProposta" NOT NULL DEFAULT 'PUBLICADA',
    "descontoAcimaLimite" BOOLEAN NOT NULL DEFAULT false,
    "publicadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "primeiraAberturaEm" TIMESTAMP(3),
    "decididaEm" TIMESTAMP(3),
    "decisaoNome" TEXT,
    "motivoRecusa" TEXT,
    "comentarioDecisao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visualizacao" (
    "id" TEXT NOT NULL,
    "propostaId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "iniciadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimaAtividade" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tempoTotalSeg" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Visualizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TempoSecao" (
    "id" TEXT NOT NULL,
    "visualizacaoId" TEXT NOT NULL,
    "secao" TEXT NOT NULL,
    "segundos" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TempoSecao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL,
    "propostaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dados" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_slug_key" ON "Empresa"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_dominioPropostas_key" ON "Empresa"("dominioPropostas");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Membro_usuarioId_empresaId_key" ON "Membro"("usuarioId", "empresaId");

-- CreateIndex
CREATE INDEX "Contato_empresaId_idx" ON "Contato"("empresaId");

-- CreateIndex
CREATE INDEX "Produto_empresaId_categoria_idx" ON "Produto"("empresaId", "categoria");

-- CreateIndex
CREATE INDEX "Modelo_empresaId_idx" ON "Modelo"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Proposta_slug_key" ON "Proposta"("slug");

-- CreateIndex
CREATE INDEX "Proposta_empresaId_status_idx" ON "Proposta"("empresaId", "status");

-- CreateIndex
CREATE INDEX "Visualizacao_propostaId_idx" ON "Visualizacao"("propostaId");

-- CreateIndex
CREATE UNIQUE INDEX "TempoSecao_visualizacaoId_secao_key" ON "TempoSecao"("visualizacaoId", "secao");

-- CreateIndex
CREATE INDEX "Evento_propostaId_criadoEm_idx" ON "Evento"("propostaId", "criadoEm");

-- AddForeignKey
ALTER TABLE "Membro" ADD CONSTRAINT "Membro_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membro" ADD CONSTRAINT "Membro_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contato" ADD CONSTRAINT "Contato_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modelo" ADD CONSTRAINT "Modelo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposta" ADD CONSTRAINT "Proposta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposta" ADD CONSTRAINT "Proposta_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "Modelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposta" ADD CONSTRAINT "Proposta_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposta" ADD CONSTRAINT "Proposta_contatoId_fkey" FOREIGN KEY ("contatoId") REFERENCES "Contato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visualizacao" ADD CONSTRAINT "Visualizacao_propostaId_fkey" FOREIGN KEY ("propostaId") REFERENCES "Proposta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TempoSecao" ADD CONSTRAINT "TempoSecao_visualizacaoId_fkey" FOREIGN KEY ("visualizacaoId") REFERENCES "Visualizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_propostaId_fkey" FOREIGN KEY ("propostaId") REFERENCES "Proposta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
