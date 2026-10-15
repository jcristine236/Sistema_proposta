"use client";

// Botão de formulário que pede confirmação antes de enviar (ex.: excluir).
export function BotaoConfirmar({ mensagem, children, className = "btn claro pequeno" }: { mensagem: string; children: React.ReactNode; className?: string }) {
  return (
    <button className={className} onClick={(e) => { if (!window.confirm(mensagem)) e.preventDefault(); }}>
      {children}
    </button>
  );
}
