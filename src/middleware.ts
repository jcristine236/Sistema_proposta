import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, lerToken } from "@/lib/sessao";

// 1) Protege o painel (/admin): exige sessão válida.
// 2) Aplica cabeçalhos de segurança em todas as páginas, com CSP baseada em nonce.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const t = await lerToken(req.cookies.get(COOKIE_SESSAO)?.value);
    if (!t) {
      const url = new URL("/login", req.url);
      url.searchParams.set("voltar", pathname);
      return NextResponse.redirect(url);
    }
  }

  const nonce = btoa(crypto.randomUUID());
  const dev = process.env.NODE_ENV !== "production";
  // MODO_HTTP=true só no teste local sem HTTPS (docker-compose.teste.yml)
  const https = !dev && process.env.MODO_HTTP !== "true";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "frame-src https://www.youtube-nocookie.com https://player.vimeo.com",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(https ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  if (https) res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  if (pathname.startsWith("/admin") || pathname.startsWith("/login")) res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = {
  matcher: [{ source: "/((?!_next/static|_next/image|favicon.ico|icon.svg|empresas/|uploads/).*)" }],
};
