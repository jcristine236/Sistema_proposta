"use client";

import { useState, useTransition } from "react";
import { gerarContratoProposta } from "@/app/admin/propostas/acoes";

export function BotaoContrato({ id }: { id: string }) {
  const [pendente, iniciar] = useTransition();
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  return (
    <div>
      <button
        className="btn destaque"
        disabled={pendente}
        onClick={() => {
          setMsg(null);
          if (!window.confirm("Gerar o contrato no D4Sign e enviar para assinatura (cliente + empresa)?")) return;
          iniciar(async () => {
            const r = await gerarContratoProposta(id);
            if ("erro" in r) setMsg({ tipo: "erro", texto: r.erro });
            else setMsg({ tipo: "ok", texto: "Contrato criado no D4Sign e enviado para assinatura." });
          });
        }}
      >
        {pendente ? "Gerando contrato…" : "Gerar contrato no D4Sign"}
      </button>
      {msg && <div className={`alerta ${msg.tipo === "ok" ? "ok" : "erro"}`} style={{ marginTop: 10 }}>{msg.texto}</div>}
    </div>
  );
}
