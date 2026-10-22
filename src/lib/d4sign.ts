import "server-only";
import { brl, dataBR } from "./formato";

// Integração com o D4Sign (assinatura eletrônica de contratos).
// Fluxo: criar documento por modelo (template) -> cadastrar signatários
// (cliente + empresa) -> enviar para assinatura. As credenciais da conta ficam
// no .env; o cofre, o modelo e o signatário da empresa ficam na config de cada
// empresa (Empresa.d4sign). Endpoints conforme a API v1 do D4Sign.
// Docs: https://docapi.d4sign.com.br

export type D4SignConfig = {
  /** UUID do cofre (safe) onde o documento é criado */
  cofre?: string;
  /** UUID do modelo (template) do contrato */
  template?: string;
  /** Signatário da empresa (contra-assinatura) */
  signatarioNome?: string;
  signatarioEmail?: string;
  /** Mapeia os dados do sistema -> nomes dos campos do modelo no D4Sign.
   *  Ex.: { razaoSocial: "razao_social", valorMensal: "mensalidade" } */
  campos?: Record<string, string>;
};

export type ContratoProposta = {
  uuid: string;
  status: "ENVIADO" | "ASSINADO" | "CANCELADO";
  enviadoEm: string;
  assinadoEm?: string;
  signatarios: string[];
};

const AMBIENTE = (process.env.D4SIGN_AMBIENTE ?? "sandbox").toLowerCase();
// D4SIGN_BASE_URL permite apontar para outro endereço (ex.: testes). Normalmente vazio.
const BASE = process.env.D4SIGN_BASE_URL || (AMBIENTE === "producao" ? "https://secure.d4sign.com.br/api/v1" : "https://sandbox.d4sign.com.br/api/v1");

function credenciais() {
  const tokenAPI = process.env.D4SIGN_TOKEN_API ?? "";
  const cryptKey = process.env.D4SIGN_CRYPT_KEY ?? "";
  return { tokenAPI, cryptKey };
}

/** true quando o D4Sign está pronto para esta empresa (credenciais + config). */
export function d4signPronto(cfg: D4SignConfig | null | undefined): cfg is D4SignConfig {
  const { tokenAPI } = credenciais();
  return !!(tokenAPI && cfg?.cofre && cfg?.template && cfg?.signatarioEmail);
}

export function d4signAmbiente() {
  return AMBIENTE === "producao" ? "produção" : "sandbox";
}

async function chamar(caminho: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { tokenAPI, cryptKey } = credenciais();
  const url = new URL(`${BASE}${caminho}`);
  url.searchParams.set("tokenAPI", tokenAPI);
  if (cryptKey) url.searchParams.set("cryptKey", cryptKey);
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const texto = await resp.text();
  let dados: unknown;
  try { dados = texto ? JSON.parse(texto) : {}; } catch { dados = { raw: texto }; }
  if (!resp.ok) {
    const msg = (dados as { message?: string; error?: string })?.message || (dados as { error?: string })?.error || texto || `HTTP ${resp.status}`;
    throw new Error(`D4Sign (${caminho}): ${msg}`);
  }
  return (dados ?? {}) as Record<string, unknown>;
}

/** Monta os valores dos campos do modelo a partir dos dados da proposta. */
function camposDoContrato(
  dados: { razaoSocial?: string; cnpj?: string; nomeSocio?: string; email?: string; whatsapp?: string },
  proposta: { codigo: string; clienteNome: string; valorMensal?: number | null; valorUnico?: number | null; titulo: string },
  cfg: D4SignConfig,
): Record<string, string> {
  // Valores padrão (nossa chave -> valor). A empresa mapeia nossa chave para o
  // nome real do campo do modelo dela em cfg.campos.
  const valores: Record<string, string> = {
    razaoSocial: dados.razaoSocial ?? "",
    cnpj: dados.cnpj ?? "",
    nomeSocio: dados.nomeSocio ?? "",
    email: dados.email ?? "",
    whatsapp: dados.whatsapp ?? "",
    cliente: proposta.clienteNome,
    codigo: proposta.codigo,
    titulo: proposta.titulo,
    valorMensal: proposta.valorMensal ? brl(Number(proposta.valorMensal)) : "",
    valorUnico: proposta.valorUnico ? brl(Number(proposta.valorUnico)) : "",
    data: dataBR(new Date().toISOString().slice(0, 10)),
  };
  const mapa = cfg.campos ?? {};
  const out: Record<string, string> = {};
  for (const [chave, valor] of Object.entries(valores)) {
    const nomeNoModelo = mapa[chave] ?? chave; // sem mapeamento: usa a própria chave
    out[nomeNoModelo] = valor;
  }
  return out;
}

/** Cria o contrato no D4Sign a partir do modelo, cadastra os signatários
 *  (cliente + empresa) e envia para assinatura. Retorna os dados do contrato. */
export async function gerarContrato(
  empresa: { nome: string; d4sign: D4SignConfig },
  proposta: {
    codigo: string;
    titulo: string;
    clienteNome: string;
    valorMensal?: number | null;
    valorUnico?: number | null;
    dadosContratacao: { razaoSocial?: string; cnpj?: string; nomeSocio?: string; email?: string; whatsapp?: string } | null;
  },
): Promise<ContratoProposta> {
  const cfg = empresa.d4sign;
  if (!d4signPronto(cfg)) throw new Error("D4Sign não configurado para esta empresa.");
  const dc = proposta.dadosContratacao;
  if (!dc?.email) throw new Error("A proposta não tem os dados de contratação (e-mail do cliente).");

  // 1) Criar o documento a partir do modelo (template)
  const criado = await chamar(`/documents/${cfg.cofre}/makedocumentbytemplate`, {
    name_document: `Contrato ${proposta.codigo} — ${proposta.clienteNome}`,
    templates: { [cfg.template as string]: camposDoContrato(dc, proposta, cfg) },
  });
  const uuid = String((criado as { uuid?: string; uuidDoc?: string }).uuid ?? (criado as { uuidDoc?: string }).uuidDoc ?? "");
  if (!uuid) throw new Error("D4Sign não retornou o identificador do documento.");

  // 2) Cadastrar signatários: cliente + empresa (act "1" = assinar)
  const signers = [
    { email: dc.email, act: "1", foreign: "0", certificadoicpbr: "0", assinatura_presencial: "0" },
    { email: cfg.signatarioEmail as string, act: "1", foreign: "0", certificadoicpbr: "0", assinatura_presencial: "0" },
  ];
  await chamar(`/documents/${uuid}/createlist`, { signers });

  // 3) Enviar para assinatura (skip_email "0" = D4Sign envia o e-mail de assinatura)
  await chamar(`/documents/${uuid}/sendtosigner`, {
    message: `Contrato referente à proposta ${proposta.codigo}.`,
    skip_email: "0",
    workflow: "0",
  });

  return {
    uuid,
    status: "ENVIADO",
    enviadoEm: new Date().toISOString(),
    signatarios: [dc.email, cfg.signatarioEmail as string],
  };
}

/** Interpreta o payload do webhook do D4Sign e devolve o novo status, se houver. */
export function statusDoWebhook(payload: Record<string, unknown>): "ASSINADO" | "CANCELADO" | null {
  const tipo = String(payload.type_post ?? payload.type ?? payload.message ?? payload.status ?? "").toLowerCase();
  if (/finaliz|assinado|signed|concl/.test(tipo)) return "ASSINADO";
  if (/cancel/.test(tipo)) return "CANCELADO";
  return null;
}
