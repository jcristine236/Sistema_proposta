// CNPJ, telefone e e-mail: validação e formatação (usado no navegador e no servidor).

export const soDigitos = (s: string) => (s ?? "").replace(/\D/g, "");

export function cnpjValido(v: string): boolean {
  const c = soDigitos(v);
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  const dv = (base: string) => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = base.split("").reduce((s, d, i) => s + Number(d) * pesos[i], 0);
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = dv(c.slice(0, 12));
  const d2 = dv(c.slice(0, 12) + d1);
  return c.endsWith(`${d1}${d2}`);
}

export function formatarCnpj(v: string): string {
  const c = soDigitos(v).slice(0, 14);
  return c
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

/** Celular/telefone BR: aceita 10-11 dígitos (ou 12-13 com 55). */
export function telefoneValido(v: string): boolean {
  const d = soDigitos(v).replace(/^55(?=\d{10,11}$)/, "");
  return d.length === 10 || d.length === 11;
}

export function formatarTelefone(v: string): string {
  const d = soDigitos(v).replace(/^55(?=\d{10,11}$)/, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

/** Número no formato internacional usado pelo WhatsApp: 5511999998888 */
export function whatsappInternacional(v: string): string {
  const d = soDigitos(v);
  return d.startsWith("55") && d.length >= 12 ? d : `55${d}`;
}

export const emailValido = (v: string) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i.test((v ?? "").trim());
