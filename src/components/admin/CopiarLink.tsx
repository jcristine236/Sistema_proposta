"use client";

import { useState } from "react";

export function CopiarLink({ link }: { link: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="btn claro pequeno"
      onClick={async () => {
        await navigator.clipboard.writeText(link).catch(() => {});
        setOk(true);
        setTimeout(() => setOk(false), 2000);
      }}
    >
      {ok ? "Copiado!" : "Copiar link"}
    </button>
  );
}
