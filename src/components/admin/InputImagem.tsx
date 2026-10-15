"use client";

// Campo de imagem para formulários comuns: envia o arquivo e guarda a URL num input.
import { useRef, useState } from "react";

export function InputImagem({ name, valorInicial, fundo = "#fff" }: { name: string; valorInicial?: string; fundo?: string }) {
  const [url, setUrl] = useState(valorInicial ?? "");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  async function enviar(f: File) {
    setErro("");
    setEnviando(true);
    const fd = new FormData();
    fd.append("arquivo", f);
    const r = await fetch("/api/uploads", { method: "POST", body: fd }).catch(() => null);
    const j = await r?.json().catch(() => null);
    setEnviando(false);
    if (!r?.ok) return setErro(j?.erro ?? "Falha no envio.");
    setUrl(j.url);
  }
  return (
    <div>
      <div style={{ background: fundo, border: "1px solid var(--line)", borderRadius: 10, padding: 10, minHeight: 64, display: "grid", placeItems: "center", marginBottom: 6 }}>
        {url ? <img src={url} alt="" style={{ maxHeight: 50, maxWidth: "100%" }} /> : <span className="muted" style={{ fontSize: 12.5 }}>Sem imagem</span>}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input name={name} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/uploads/... ou https://" />
        <button type="button" className="btn claro pequeno" style={{ height: 40 }} disabled={enviando} onClick={() => ref.current?.click()}>{enviando ? "..." : "Enviar"}</button>
      </div>
      <input ref={ref} type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={(e) => e.target.files?.[0] && enviar(e.target.files[0])} />
      {erro && <div className="alerta erro">{erro}</div>}
    </div>
  );
}
