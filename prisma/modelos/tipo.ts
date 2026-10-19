// Formato de um modelo de proposta definido em código (carregado pelo seed).
// Todos os arquivos de prisma/modelos/*.ts exportam um objeto deste tipo, o que
// garante checagem de tipos de campos, seções e regras de cálculo em conjunto.

import type { Campo } from "../../src/lib/campos";
import type { Precificacao } from "../../src/lib/precificacao";
import type { Secao } from "../../src/lib/secoes";

export type ModeloDef = {
  nome: string;
  descricao: string;
  /** Identificador do tipo de solução (único por empresa) */
  tipoSolucao: string;
  validadeDias: number;
  campos: Campo[];
  secoes: Secao[];
  precificacao: Precificacao;
};
