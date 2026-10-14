// Sessão de login (cookie assinado). Usado pelo middleware e pelo servidor.
import { SignJWT, jwtVerify } from "jose";

export const COOKIE_SESSAO = "pp_sessao";
export const COOKIE_EMPRESA = "pp_empresa";
const DURACAO_DIAS = 7;

function chave() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET ausente ou curto (mínimo 32 caracteres).");
  return new TextEncoder().encode(s);
}

export async function criarToken(usuarioId: string) {
  return new SignJWT({ uid: usuarioId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACAO_DIAS}d`)
    .sign(chave());
}

export async function lerToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, chave());
    return typeof payload.uid === "string" ? payload.uid : null;
  } catch {
    return null;
  }
}

export const opcoesCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: DURACAO_DIAS * 24 * 3600,
};
