// Política de senha: mínimo 10 caracteres, com letra e número.
export function problemaSenha(s: string): string | null {
  if (s.length < 10) return "A senha precisa ter pelo menos 10 caracteres.";
  if (s.length > 200) return "Senha longa demais.";
  if (!/[a-zA-Z]/.test(s) || !/\d/.test(s)) return "A senha precisa ter letras e números.";
  if (/^(.)\1+$/.test(s)) return "Senha fraca demais.";
  return null;
}
export const CUSTO_BCRYPT = 12;
