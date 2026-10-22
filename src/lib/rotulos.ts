export const STATUS: Record<string, string> = {
  RASCUNHO: "Rascunho",
  PUBLICADA: "Enviada",
  ABERTA: "Aberta",
  ACEITA: "Aceita",
  RECUSADA: "Recusada",
  EXPIRADA: "Expirada",
};

export const EVENTOS: Record<string, string> = {
  CRIADA: "Proposta criada",
  ABERTA: "Cliente abriu a proposta",
  REABERTA: "Cliente voltou à proposta",
  ACEITA: "Proposta aceita",
  RECUSADA: "Proposta recusada",
  COMENTARIO: "Novo comentário",
  EDITADA: "Proposta editada",
  CONTRATO_ENVIADO: "Contrato enviado para assinatura (D4Sign)",
  CONTRATO_ASSINADO: "Contrato assinado (D4Sign)",
  CONTRATO_CANCELADO: "Contrato cancelado (D4Sign)",
};
