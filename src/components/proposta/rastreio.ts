"use client";

// Rastreamento de leitura no navegador do cliente:
// - registra a abertura (uma "visualização" por sessão de leitura);
// - mede o tempo em cada seção (a que ocupa o centro da tela), pausando com a aba oculta;
// - envia os tempos acumulados a cada 15s e ao sair da página (sendBeacon).

import { useEffect, type RefObject } from "react";

const INTERVALO_MS = 15000;

function viewerId(): string {
  try {
    let id = localStorage.getItem("pp_viewer");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("pp_viewer", id);
    }
    return id;
  } catch {
    return "anonimo";
  }
}

export function useRastreioLeitura(slug: string | undefined, raiz: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!slug || !raiz.current) return;
    const el = raiz.current;
    let visualizacaoId: string | null = null;
    let secaoAtual: string | null = null;
    let inicio: number | null = null;
    let pendente: Record<string, number> = {};
    let totalPendente = 0;
    let visivel = !document.hidden;

    const fecharTrecho = () => {
      if (secaoAtual && inicio !== null) {
        const seg = (performance.now() - inicio) / 1000;
        pendente[secaoAtual] = (pendente[secaoAtual] ?? 0) + seg;
        totalPendente += seg;
      }
      inicio = visivel && secaoAtual ? performance.now() : null;
    };

    const enviar = (final = false) => {
      fecharTrecho();
      if (!visualizacaoId || totalPendente < 1) return;
      const corpo = JSON.stringify({
        acao: "tempo",
        slug,
        visualizacaoId,
        total: Math.round(totalPendente),
        secoes: Object.fromEntries(Object.entries(pendente).map(([k, v]) => [k, Math.round(v)]).filter(([, v]) => (v as number) > 0)),
      });
      pendente = {};
      totalPendente = 0;
      if (final && navigator.sendBeacon) navigator.sendBeacon("/api/rastreio", new Blob([corpo], { type: "application/json" }));
      else fetch("/api/rastreio", { method: "POST", body: corpo, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
    };

    fetch("/api/rastreio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "abrir", slug, viewerId: viewerId() }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { visualizacaoId = j?.visualizacaoId ?? null; })
      .catch(() => {});

    // Seção "ativa" = a que cruza a linha a 45% da altura da tela
    const secoes = [...el.querySelectorAll<HTMLElement>("[data-secao]")];
    const detectar = () => {
      let ativa: string | null = secoes[0]?.dataset.secao ?? null;
      for (const s of secoes) if (s.getBoundingClientRect().top < innerHeight * 0.45) ativa = s.dataset.secao!;
      if (ativa !== secaoAtual) {
        fecharTrecho();
        secaoAtual = ativa;
        inicio = visivel ? performance.now() : null;
      }
    };
    const onVis = () => {
      fecharTrecho();
      visivel = !document.hidden;
      inicio = visivel && secaoAtual ? performance.now() : null;
      if (!visivel) enviar(true);
    };
    const onSair = () => enviar(true);

    detectar();
    window.addEventListener("scroll", detectar, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onSair);
    const timer = setInterval(() => enviar(false), INTERVALO_MS);

    return () => {
      enviar(true);
      clearInterval(timer);
      window.removeEventListener("scroll", detectar);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onSair);
    };
  }, [slug, raiz]);
}
