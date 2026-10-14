export const brl = (v: number) =>
  (Number.isFinite(v) ? v : 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** "2026-10-29" ou Date -> "29/10/2026" */
export function dataBR(v: string | Date | null | undefined): string {
  if (!v) return "sem data";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split("-");
    return `${d}/${m}/${y}`;
  }
  const d = typeof v === "string" ? new Date(v) : v;
  return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function dataHoraBR(v: string | Date | null | undefined): string {
  if (!v) return "-";
  const d = typeof v === "string" ? new Date(v) : v;
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
}

export function duracao(seg: number): string {
  const s = Math.round(seg);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}min`;
}

export function slugify(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "cliente"
  );
}
