import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, lerToken } from "@/lib/sessao";

// Protege o painel (/admin). Links públicos (/p/...) e a API de rastreio ficam abertos.
export async function middleware(req: NextRequest) {
  const uid = await lerToken(req.cookies.get(COOKIE_SESSAO)?.value);
  if (!uid) {
    const url = new URL("/login", req.url);
    url.searchParams.set("voltar", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
