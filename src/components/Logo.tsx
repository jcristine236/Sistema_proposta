"use client";

// Logo com "tamanho visual" igual para todas as empresas: a altura é ajustada
// pela proporção da imagem, de modo que logos largos e altos ocupem a mesma área.

import { useEffect, useRef, useState } from "react";

const PROPORCAO_REF = 3; // logo de referência: 3x mais largo que alto

export function Logo({ src, alt, altura = 56, larguraMax, className }: { src: string; alt: string; altura?: number; larguraMax?: number; className?: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [h, setH] = useState<number | null>(null);

  const calcular = () => {
    const img = ref.current;
    if (!img?.naturalWidth || !img.naturalHeight) return;
    const r = img.naturalWidth / img.naturalHeight;
    let nova = altura * Math.sqrt(PROPORCAO_REF / r);
    nova = Math.max(altura * 0.55, Math.min(altura * 1.5, nova));
    if (larguraMax && nova * r > larguraMax) nova = larguraMax / r;
    setH(Math.round(nova));
  };

  useEffect(() => {
    if (ref.current?.complete) calcular();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, altura, larguraMax]);

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={className}
      onLoad={calcular}
      style={{ height: h ?? altura, width: "auto", maxWidth: "100%", opacity: h ? 1 : 0, transition: "opacity .25s", display: "block" }}
    />
  );
}
