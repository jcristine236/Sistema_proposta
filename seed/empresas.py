"""As 3 empresas iniciais (copiado de prisma/seed.ts)."""

MOTIVOS = [
    "Desisti do projeto",
    "Não enxerguei valor",
    "Preço acima do esperado",
    "Não foi aprovado pela diretoria",
    "Escolhi outro fornecedor",
    "Outro motivo",
]

EMPRESAS = [
    {
        "slug": "caddi",
        "nome": "CADDI",
        "razao_social": "CADDI Soluções Tecnológicas Ltda.",
        "site": "caddi.com.br",
        "dominio_propostas": "propostas.caddi.com.br",
        "prefixo": "CAD",
        "rodape": "CADDI Soluções Tecnológicas Ltda. · Alameda Rio Negro, 503 — Sala 2005, Alphaville, Barueri/SP · (11) 2358-3919 · jessica@caddi.com.br",
        "tema": {
            "primaria": "#0D1B3E",
            "primaria2": "#16295A",
            "destaque": "#C9A84C",
            "destaqueSuave": "#FBF6E8",
            "destaqueTexto": "#9A7F2F",
            "neutra": "#B0B8C1",
            "tinta": "#EEF2FA",
            "logo": "/empresas/caddi/logo.png",
            "logoClaro": "/empresas/caddi/logo-claro.png",
        },
    },
    {
        # Manual da Marca KOLP: roxos #5C026E / #7605B7 e degradê magenta-laranja-amarelo.
        "slug": "kolp",
        "nome": "KOLP",
        "razao_social": "KOLP",
        "site": "kolp.com.br",
        "dominio_propostas": "propostas.kolp.com.br",
        "prefixo": "KLP",
        "rodape": "Kolp Aplicações e Datacenter · São Paulo/SP · kolp.com.br",
        "tema": {
            "primaria": "#5C026E",
            "primaria2": "#7605B7",
            "destaque": "#FE8010",
            "destaqueSuave": "#FFF3E6",
            "destaqueTexto": "#C2410C",
            "neutra": "#CDB6DA",
            "tinta": "#F7F0FA",
            "logo": "/empresas/kolp/logo.png",
            "logoClaro": "/empresas/kolp/logo-claro.png",
        },
    },
    {
        # Manual de Identidade Visual FASE v6.0.
        "slug": "fase",
        "nome": "FASE",
        "razao_social": "Fase Sistemas",
        "site": "fasesistemas.com.br",
        "dominio_propostas": "propostas.fasesistemas.com.br",
        "prefixo": "FSE",
        "rodape": "Fase Sistemas (marca Kolp · CADDI Soluções Tecnológicas Ltda.) · Av. Paulista, 1471 — Conj. 511, Bela Vista, São Paulo/SP · (11) 92567-6137 · comercial@fasesistemas.com.br",
        "tema": {
            "primaria": "#0B1829",
            "primaria2": "#185FA5",
            "destaque": "#378ADD",
            "destaqueSuave": "#E6F1FB",
            "destaqueTexto": "#534AB7",
            "neutra": "#9FB3CC",
            "tinta": "#EEF5FC",
            "logo": "/empresas/fase/logo.svg",
            "logoClaro": "/empresas/fase/logo-claro.svg",
        },
    },
]
