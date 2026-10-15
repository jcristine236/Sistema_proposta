// Sessão de login (cookie assinado). Usado pelo middleware e pelo servidor.
import { SignJWT, jwtVerify } from "jose";

export const COOKIE_SESSAO = "pp_sessao";
export const COOKIE_EMPRESA = "pp_empresa";
const DURACAO_HORAS = 12;

function chave() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET ausente ou curto (mínimo 32 caracteres).");
  return new TextEncoder().encode(s);
}

export type Token = { uid: string; v: number };

/** v = Usuario.versaoSessao: ao trocar a senha ou desativar, sessões antigas deixam de valer. */
export async function criarToken(usuarioId: string, versao: number) {
  return new SignJWT({ uid: usuarioId, v: versao })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACAO_HORAS}h`)
    .sign(chave());
}

export async function lerToken(token: string | undefined): Promise<Token | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, chave(), { algorithms: ["HS256"] });
    return typeof payload.uid === "string" && typeof payload.v === "number" ? { uid: payload.uid, v: payload.v } : null;
  } catch {
    return null;
  }
}

export const opcoesCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production" && process.env.MODO_HTTP !== "true",
  path: "/",
  maxAge: DURACAO_HORAS * 3600,
};
